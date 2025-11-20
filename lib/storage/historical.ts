/**
 * Historical data management for performance metrics
 * Handles saving and retrieving time-series performance data
 */

import type { RenderingStrategyType } from '@/types/strategy';
import type { CoreWebVitals } from '@/types/performance';
import { kvSet, kvGet, kvKeys, kvMGet } from './kv';
import { getHistoricalKey, getHistoricalPattern } from './cache-keys';

/**
 * Historical data point structure
 */
export interface HistoricalDataPoint {
  timestamp: number;
  strategy: RenderingStrategyType;
  projectId: string;
  metrics: CoreWebVitals;
  metadata?: {
    url?: string;
    userAgent?: string;
    environment?: 'development' | 'production';
    [key: string]: unknown;
  };
}

/**
 * Time range query options
 */
export interface TimeRangeQuery {
  startDate: Date;
  endDate: Date;
  strategy?: RenderingStrategyType;
  projectId?: string;
}

/**
 * Aggregated metrics for trend analysis
 */
export interface AggregatedMetrics {
  timestamp: number;
  count: number;
  metrics: {
    fcp: { avg: number; min: number; max: number };
    lcp: { avg: number; min: number; max: number };
    cls: { avg: number; min: number; max: number };
    inp: { avg: number; min: number; max: number };
    ttfb: { avg: number; min: number; max: number };
  };
}

/**
 * Save a performance snapshot to historical storage
 */
export async function saveHistoricalData(
  data: Omit<HistoricalDataPoint, 'timestamp'> & { timestamp?: number }
): Promise<boolean> {
  try {
    const timestamp = data.timestamp || Date.now();
    const dataPoint: HistoricalDataPoint = {
      ...data,
      timestamp,
    };

    const key = getHistoricalKey(data.strategy, data.projectId, timestamp);
    
    // Store with 90-day TTL (7776000 seconds)
    const success = await kvSet(key, dataPoint, { ex: 7776000 });
    
    return success;
  } catch (error) {
    console.error('Error saving historical data:', error);
    return false;
  }
}

/**
 * Retrieve historical data for a specific date and strategy
 */
export async function getHistoricalData(
  strategy: RenderingStrategyType,
  projectId = 'default',
  date?: Date
): Promise<HistoricalDataPoint | null> {
  try {
    const timestamp = date ? date.getTime() : Date.now();
    const key = getHistoricalKey(strategy, projectId, timestamp);
    
    return await kvGet<HistoricalDataPoint>(key);
  } catch (error) {
    console.error('Error retrieving historical data:', error);
    return null;
  }
}

/**
 * Query historical data for a time range
 * Uses batch fetching with MGET for better performance
 */
export async function queryHistoricalData(
  query: TimeRangeQuery
): Promise<HistoricalDataPoint[]> {
  try {
    const { startDate, endDate, strategy, projectId = 'default' } = query;
    const results: HistoricalDataPoint[] = [];

    // If strategy is specified, use a targeted pattern
    if (strategy) {
      const pattern = getHistoricalPattern(strategy, projectId);
      const keys = await kvKeys(pattern);
      
      // Use batch fetch instead of individual gets
      const dataPoints = await kvMGet<HistoricalDataPoint>(keys);
      
      for (const data of dataPoints) {
        if (data && isInRange(data.timestamp, startDate, endDate)) {
          results.push(data);
        }
      }
    } else {
      // Query all strategies
      const strategies: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
      
      for (const strat of strategies) {
        const pattern = getHistoricalPattern(strat, projectId);
        const keys = await kvKeys(pattern);
        
        // Use batch fetch instead of individual gets
        const dataPoints = await kvMGet<HistoricalDataPoint>(keys);
        
        for (const data of dataPoints) {
          if (data && isInRange(data.timestamp, startDate, endDate)) {
            results.push(data);
          }
        }
      }
    }

    // Sort by timestamp
    return results.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Error querying historical data:', error);
    return [];
  }
}

/**
 * Get aggregated metrics for a time range
 */
export async function getAggregatedMetrics(
  strategy: RenderingStrategyType,
  projectId: string,
  granularity: 'hour' | 'day' | 'week' | 'month',
  startDate: Date,
  endDate: Date
): Promise<AggregatedMetrics[]> {
  try {
    const dataPoints = await queryHistoricalData({
      startDate,
      endDate,
      strategy,
      projectId,
    });

    if (dataPoints.length === 0) return [];

    // Group by time bucket
    const buckets = new Map<number, HistoricalDataPoint[]>();
    
    for (const point of dataPoints) {
      const bucketTime = getBucketTimestamp(point.timestamp, granularity);
      const bucket = buckets.get(bucketTime) || [];
      bucket.push(point);
      buckets.set(bucketTime, bucket);
    }

    // Aggregate each bucket
    const aggregated: AggregatedMetrics[] = [];
    
    for (const [timestamp, points] of buckets) {
      aggregated.push({
        timestamp,
        count: points.length,
        metrics: {
          fcp: calculateStats(points.map(p => p.metrics.fcp.value)),
          lcp: calculateStats(points.map(p => p.metrics.lcp.value)),
          cls: calculateStats(points.map(p => p.metrics.cls.value)),
          inp: calculateStats(points.map(p => p.metrics.inp.value)),
          ttfb: calculateStats(points.map(p => p.metrics.ttfb.value)),
        },
      });
    }

    return aggregated.sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error('Error aggregating metrics:', error);
    return [];
  }
}

/**
 * Get latest metrics for all strategies
 */
export async function getLatestMetrics(
  projectId = 'default'
): Promise<Record<RenderingStrategyType, HistoricalDataPoint | null>> {
  const strategies: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
  const results: Record<string, HistoricalDataPoint | null> = {};

  for (const strategy of strategies) {
    const data = await getHistoricalData(strategy, projectId);
    results[strategy] = data;
  }

  return results as Record<RenderingStrategyType, HistoricalDataPoint | null>;
}

/**
 * Detect performance regressions
 */
export async function detectRegressions(
  strategy: RenderingStrategyType,
  projectId: string,
  threshold = 0.2 // 20% degradation threshold
): Promise<Array<{ metric: string; current: number; baseline: number; change: number }>> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentData = await queryHistoricalData({
    startDate: weekAgo,
    endDate: now,
    strategy,
    projectId,
  });

  if (recentData.length < 2) return [];

  // Split into baseline (first half) and current (second half)
  const mid = Math.floor(recentData.length / 2);
  const baseline = recentData.slice(0, mid);
  const current = recentData.slice(mid);

  const regressions = [];
  const metrics = ['fcp', 'lcp', 'cls', 'inp', 'ttfb'] as const;

  for (const metric of metrics) {
    const baselineAvg = average(baseline.map(d => d.metrics[metric].value));
    const currentAvg = average(current.map(d => d.metrics[metric].value));
    const change = (currentAvg - baselineAvg) / baselineAvg;

    if (change > threshold) {
      regressions.push({
        metric,
        current: currentAvg,
        baseline: baselineAvg,
        change,
      });
    }
  }

  return regressions;
}

// Helper functions

function isInRange(timestamp: number, start: Date, end: Date): boolean {
  return timestamp >= start.getTime() && timestamp <= end.getTime();
}

function getBucketTimestamp(timestamp: number, granularity: 'hour' | 'day' | 'week' | 'month'): number {
  const date = new Date(timestamp);
  
  switch (granularity) {
    case 'hour':
      date.setMinutes(0, 0, 0);
      break;
    case 'day':
      date.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      date.setDate(diff);
      date.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      date.setDate(1);
      date.setHours(0, 0, 0, 0);
      break;
  }
  
  return date.getTime();
}

function calculateStats(values: number[]): { avg: number; min: number; max: number } {
  if (values.length === 0) return { avg: 0, min: 0, max: 0 };
  
  return {
    avg: average(values),
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}
