/**
 * Demo Data API Route
 * Captures and returns render metrics for each strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { RenderingStrategyType } from '@/types/strategy';

interface DemoMetricsData {
  strategy: RenderingStrategyType;
  renderTime: number;
  timestamp: number;
  cacheAge?: number;
  requestId: string;
}

// Simulate different render times for different strategies
const STRATEGY_BASE_TIMES: Record<RenderingStrategyType, number> = {
  SSR: 150,  // Higher due to server-side processing
  SSG: 5,    // Very low - pre-rendered
  ISR: 20,   // Low with cache, higher on revalidation
  CACHE: 30, // Component-level overhead but still fast
};

// Simple in-memory store for demo purposes
const metricsStore = new Map<string, DemoMetricsData>();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ strategy: string }> }
) {
  const params = await context.params;
  const startTime = performance.now();
  const strategy = params.strategy.toUpperCase() as RenderingStrategyType;

  // Validate strategy
  if (!['SSR', 'SSG', 'ISR', 'CACHE'].includes(strategy)) {
    return NextResponse.json(
      { error: 'Invalid strategy. Must be one of: SSR, SSG, ISR, CACHE' },
      { status: 400 }
    );
  }

  // Get query parameters for cache busting and request tracking
  const searchParams = request.nextUrl.searchParams;
  const cacheBust = searchParams.get('cacheBust') || Date.now().toString();
  const requestId = searchParams.get('requestId') || `${strategy}-${Date.now()}`;

  // Check if we have cached data for this request
  const cached = metricsStore.get(requestId);
  const isCacheHit = cached !== undefined;

  // Simulate processing time based on strategy
  const baseTime = STRATEGY_BASE_TIMES[strategy];
  const variance = Math.random() * 20 - 10; // ±10ms variance
  const processingTime = baseTime + variance;

  // Add artificial delay to simulate server processing
  await new Promise(resolve => setTimeout(resolve, processingTime));

  const renderTime = performance.now() - startTime;
  const timestamp = Date.now();

  // Calculate cache age if it's a cache hit
  const cacheAge = cached ? timestamp - cached.timestamp : undefined;

  const metricsData: DemoMetricsData = {
    strategy,
    renderTime,
    timestamp,
    cacheAge,
    requestId,
  };

  // Store metrics for future cache hits (ISR/CACHE strategies)
  if (['ISR', 'CACHE'].includes(strategy)) {
    metricsStore.set(requestId, metricsData);

    // Clean up old entries (keep only last 100)
    if (metricsStore.size > 100) {
      const firstKey = metricsStore.keys().next().value;
      if (firstKey) {
        metricsStore.delete(firstKey);
      }
    }
  }

  // Determine cache status
  let cacheStatus: 'hit' | 'miss' | 'stale' | 'revalidating' = 'miss';
  
  if (strategy === 'SSR') {
    cacheStatus = 'miss'; // SSR never caches
  } else if (strategy === 'SSG') {
    cacheStatus = 'hit'; // SSG is always cached
  } else if (strategy === 'ISR') {
    if (isCacheHit && cacheAge && cacheAge < 60000) {
      cacheStatus = 'hit';
    } else if (isCacheHit && cacheAge && cacheAge >= 60000) {
      cacheStatus = 'stale';
    } else {
      cacheStatus = 'miss';
    }
  } else if (strategy === 'CACHE') {
    cacheStatus = isCacheHit ? 'hit' : 'miss';
  }

  return NextResponse.json({
    ...metricsData,
    cacheStatus,
    isCacheHit,
  });
}

// POST endpoint to clear cache for a specific strategy
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ strategy: string }> }
) {
  const params = await context.params;
  const strategy = params.strategy.toUpperCase() as RenderingStrategyType;

  // Clear all metrics for this strategy
  const requestIds = Array.from(metricsStore.keys()).filter(key => 
    key.startsWith(strategy)
  );

  requestIds.forEach(id => metricsStore.delete(id));

  return NextResponse.json({
    success: true,
    strategy,
    clearedCount: requestIds.length,
  });
}
