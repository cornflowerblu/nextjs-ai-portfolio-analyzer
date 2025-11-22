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

/**
 * Handle Edge vs Serverless comparison
 */
async function handleEdgeVsServerless(request: NextRequest) {
  const iterations = parseInt(request.nextUrl.searchParams.get('iterations') || '5');
  
  // Fetch from both endpoints
  const baseUrl = request.nextUrl.origin;
  
  const edgeResults = await Promise.all(
    Array.from({ length: iterations }, async () => {
      try {
        const start = performance.now();
        const response = await fetch(`${baseUrl}/edge/measure`);
        const data = await response.json();
        const totalTime = performance.now() - start;
        return { ...data, totalTime };
      } catch (error) {
        console.error('Edge function error:', error);
        return { executionTime: 0, totalTime: 0, type: 'edge', error: true };
      }
    })
  );
  
  const serverlessResults = await Promise.all(
    Array.from({ length: iterations }, async () => {
      try {
        const start = performance.now();
        const response = await fetch(`${baseUrl}/api/platform/serverless`);
        const data = await response.json();
        const totalTime = performance.now() - start;
        return { ...data, totalTime };
      } catch (error) {
        console.error('Serverless function error:', error);
        return { executionTime: 0, totalTime: 0, type: 'serverless', error: true };
      }
    })
  );
  
  // Calculate statistics - filter out invalid results and ensure we have valid numbers
  const edgeTimes = edgeResults
    .map(r => r.executionTime)
    .filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
  const serverlessTimes = serverlessResults
    .map(r => r.executionTime)
    .filter(t => typeof t === 'number' && !isNaN(t) && t > 0);
  
  // Ensure we have at least some valid results
  if (edgeTimes.length === 0 || serverlessTimes.length === 0) {
    throw new Error('Failed to get valid measurements from endpoints');
  }
  
  const edgeAvg = edgeTimes.reduce((a, b) => a + b, 0) / edgeTimes.length;
  const serverlessAvg = serverlessTimes.reduce((a, b) => a + b, 0) / serverlessTimes.length;
  
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
    speedup: serverlessAvg / edgeAvg,
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
