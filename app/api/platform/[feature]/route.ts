/**
 * Platform features API - handles all platform demo requests
 * Supports edge-vs-serverless, kv-cache, edge-config, and geo-latency
 */

import { NextRequest, NextResponse } from 'next/server';
import { kvGet, kvSet, measureKVLatency } from '@/lib/storage/kv';
import { getFeatureFlags, readEdgeConfig, getMockFeatureFlags } from '@/lib/platform/edge-config';
import { testMultiRegionLatency, getMockRegionLatencies } from '@/lib/platform/geo-test';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ feature: string }> }
) {
  const { feature } = await params;

  try {
    switch (feature) {
      case 'edge-vs-serverless':
        return handleEdgeVsServerless(request);
      
      case 'kv-cache':
        return handleKvCache(request);
      
      case 'edge-config':
        return handleEdgeConfig(request);
      
      case 'geo-latency':
        return handleGeoLatency(request);
      
      default:
        return NextResponse.json(
          { error: 'Unknown feature', feature },
          { status: 404 }
        );
    }
  } catch (error) {
    console.error('Platform API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// Type for measurement results
type MeasurementResult = {
  type: 'edge' | 'serverless';
  executionTime: number;
  totalTime: number;
  error?: boolean;
  httpStatus?: number;
  httpStatusText?: string;
  errorMessage?: string;
  coldStart?: boolean;
  timestamp?: string;
  result?: number;
  region?: string;
};

/**
 * Handle Edge vs Serverless comparison
 */
async function handleEdgeVsServerless(request: NextRequest) {
  const iterations = parseInt(request.nextUrl.searchParams.get('iterations') || '5');
  
  // Fetch from both endpoints
  const baseUrl = request.nextUrl.origin;
  
  // Log diagnostic information
  console.log('[Edge vs Serverless] Starting comparison', {
    baseUrl,
    iterations,
    host: request.nextUrl.host,
    protocol: request.nextUrl.protocol,
  });
  
  const edgeResults = await Promise.all(
    Array.from({ length: iterations }, async () => {
      try {
        const start = performance.now();
        const url = `${baseUrl}/edge/measure`;
        console.log('[Edge] Fetching:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error('[Edge] HTTP error:', response.status, response.statusText);
          return { 
            executionTime: 0, 
            totalTime: 0, 
            type: 'edge', 
            error: true,
            httpStatus: response.status,
            httpStatusText: response.statusText
          };
        }
        
        const data = await response.json();
        const totalTime = performance.now() - start;
        return { ...data, totalTime };
      } catch (error) {
        console.error('[Edge] Fetch error:', error);
        return { 
          executionTime: 0, 
          totalTime: 0, 
          type: 'edge', 
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );
  
  const serverlessResults = await Promise.all(
    Array.from({ length: iterations }, async () => {
      try {
        const start = performance.now();
        const url = `${baseUrl}/api/platform/serverless`;
        console.log('[Serverless] Fetching:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error('[Serverless] HTTP error:', response.status, response.statusText);
          return { 
            executionTime: 0, 
            totalTime: 0, 
            type: 'serverless', 
            error: true,
            httpStatus: response.status,
            httpStatusText: response.statusText
          };
        }
        
        const data = await response.json();
        const totalTime = performance.now() - start;
        return { ...data, totalTime };
      } catch (error) {
        console.error('[Serverless] Fetch error:', error);
        return { 
          executionTime: 0, 
          totalTime: 0, 
          type: 'serverless', 
          error: true,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );
  
  // Helper function to filter valid execution times
  const filterValidTimes = (results: Array<{ executionTime?: number }>): number[] => {
    return results
      .map(r => r.executionTime)
      .filter((t): t is number => typeof t === 'number' && !isNaN(t) && t > 0);
  };
  
  // Calculate statistics - filter out invalid results and ensure we have valid numbers
  const edgeTimes = filterValidTimes(edgeResults);
  const serverlessTimes = filterValidTimes(serverlessResults);
  
  // Log diagnostic information about results
  console.log('[Results] Edge times:', edgeTimes.length, 'valid out of', edgeResults.length);
  console.log('[Results] Serverless times:', serverlessTimes.length, 'valid out of', serverlessResults.length);
  
  // Ensure we have at least some valid results
  if (edgeTimes.length === 0 || serverlessTimes.length === 0) {
    const edgeFailedResults = edgeResults.filter((r: MeasurementResult) => r.error);
    const serverlessFailedResults = serverlessResults.filter((r: MeasurementResult) => r.error);
    
    const errorDetails = {
      message: 'Failed to get valid measurements from endpoints',
      baseUrl,
      edgeFailures: edgeFailedResults.length,
      serverlessFailures: serverlessFailedResults.length,
      edgeErrors: edgeFailedResults.map((r: MeasurementResult) => ({
        httpStatus: r.httpStatus,
        httpStatusText: r.httpStatusText,
        errorMessage: r.errorMessage,
      })),
      serverlessErrors: serverlessFailedResults.map((r: MeasurementResult) => ({
        httpStatus: r.httpStatus,
        httpStatusText: r.httpStatusText,
        errorMessage: r.errorMessage,
      })),
    };
    console.error('[Error] Detailed failure information:', errorDetails);
    throw new Error(JSON.stringify(errorDetails));
  }
  
  const edgeAvg = edgeTimes.reduce((a, b) => a + b, 0) / edgeTimes.length;
  const serverlessAvg = serverlessTimes.reduce((a, b) => a + b, 0) / serverlessTimes.length;
  
  // Calculate speedup with guard against division by zero
  const speedup = edgeAvg > 0 ? serverlessAvg / edgeAvg : 1;
  
  return NextResponse.json({
    edge: {
      results: edgeResults,
      avg: edgeAvg,
      min: Math.min(...edgeTimes),
      max: Math.max(...edgeTimes),
    },
    serverless: {
      results: serverlessResults,
      avg: serverlessAvg,
      min: Math.min(...serverlessTimes),
      max: Math.max(...serverlessTimes),
    },
    speedup,
  });
}

/**
 * Handle KV cache operations with latency measurements
 */
async function handleKvCache(request: NextRequest) {
  const operation = request.nextUrl.searchParams.get('operation') || 'read';
  const key = `platform:demo:${Date.now()}`;
  const testData = { message: 'Test data for KV demo', timestamp: new Date().toISOString() };
  
  let results;
  
  if (operation === 'read') {
    // Measure read latency
    const writeResult = await measureKVLatency(async () => {
      await kvSet(key, testData, { ex: 60 });
      return true;
    });
    
    const readResult = await measureKVLatency(async () => {
      return await kvGet(key);
    });
    
    results = {
      write: {
        latency: writeResult.latency,
        success: writeResult.result,
      },
      read: {
        latency: readResult.latency,
        data: readResult.result,
      },
    };
  } else if (operation === 'write') {
    // Measure write latency
    const result = await measureKVLatency(async () => {
      return await kvSet(key, testData, { ex: 60 });
    });
    
    results = {
      write: {
        latency: result.latency,
        success: result.result,
      },
    };
  } else {
    // Comprehensive benchmark
    const iterations = 5;
    const writeLatencies = [];
    const readLatencies = [];
    
    for (let i = 0; i < iterations; i++) {
      const writeResult = await measureKVLatency(async () => {
        await kvSet(`${key}:${i}`, { ...testData, iteration: i }, { ex: 60 });
        return true;
      });
      writeLatencies.push(writeResult.latency);
      
      const readResult = await measureKVLatency(async () => {
        return await kvGet(`${key}:${i}`);
      });
      readLatencies.push(readResult.latency);
    }
    
    results = {
      write: {
        avg: writeLatencies.reduce((a, b) => a + b, 0) / writeLatencies.length,
        min: Math.min(...writeLatencies),
        max: Math.max(...writeLatencies),
        latencies: writeLatencies,
      },
      read: {
        avg: readLatencies.reduce((a, b) => a + b, 0) / readLatencies.length,
        min: Math.min(...readLatencies),
        max: Math.max(...readLatencies),
        latencies: readLatencies,
      },
    };
  }
  
  return NextResponse.json(results);
}

/**
 * Handle Edge Config feature flags
 */
async function handleEdgeConfig(request: NextRequest) {
  const flagName = request.nextUrl.searchParams.get('flag');
  
  if (flagName) {
    // Get specific flag
    const result = await readEdgeConfig<boolean>(`featureFlags.${flagName}`);
    
    return NextResponse.json({
      flag: flagName,
      enabled: result.data ?? false,
      latency: result.latency,
      cached: result.cached,
    });
  }
  
  // Get all flags
  const result = await getFeatureFlags();
  
  // If Edge Config is not configured, use mock data
  const flags = result.data || getMockFeatureFlags();
  
  return NextResponse.json({
    flags,
    latency: result.latency,
    cached: result.cached,
    source: result.data ? 'edge-config' : 'mock',
  });
}

/**
 * Handle geographic latency testing
 */
async function handleGeoLatency(request: NextRequest) {
  const baseUrl = request.nextUrl.origin;
  const useMock = request.nextUrl.searchParams.get('mock') === 'true';
  
  if (useMock) {
    // Return mock data for demo
    return NextResponse.json({
      regions: getMockRegionLatencies(),
      source: 'mock',
    });
  }
  
  // Test real latency to current region
  try {
    const testUrl = `${baseUrl}/edge/measure`;
    const results = await testMultiRegionLatency(testUrl, ['iad1', 'sfo1', 'lhr1']);
    
    return NextResponse.json({
      regions: results,
      source: 'real',
    });
  } catch (error) {
    // Fallback to mock data
    return NextResponse.json({
      regions: getMockRegionLatencies(),
      source: 'mock',
      error: error instanceof Error ? error.message : 'Failed to test regions',
    });
  }
}
