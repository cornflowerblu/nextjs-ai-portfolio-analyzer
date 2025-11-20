/**
 * Cache behavior analyzer
 * Detects cache hits/misses and analyzes caching patterns
 */

/**
 * Cache status for a request or component
 */
export type CacheStatus = 'HIT' | 'MISS' | 'STALE' | 'REVALIDATING' | 'BYPASS';

/**
 * Cache analysis result
 */
export interface CacheAnalysis {
  status: CacheStatus;
  age?: number; // Cache age in seconds
  timestamp: number;
  ttl?: number; // Time to live in seconds
  revalidatedAt?: number;
  hitRate?: number; // Percentage 0-100
}

/**
 * Cache metrics for tracking
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  stale: number;
  bypasses: number;
  totalRequests: number;
  hitRate: number;
  averageAge: number;
}

/**
 * Internal cache metrics store
 */
const metricsStore: Map<string, CacheMetrics> = new Map();

/**
 * Internal cache events log
 */
const eventsLog: Array<{ key: string; analysis: CacheAnalysis }> = [];
const MAX_LOG_SIZE = 100;

/**
 * Analyze Next.js cache headers from a Response
 */
export function analyzeCacheHeaders(response: Response): CacheAnalysis {
  const timestamp = Date.now();
  const cacheControl = response.headers.get('cache-control');
  const age = response.headers.get('age');
  const xNextjsCache = response.headers.get('x-nextjs-cache');
  const xVercelCache = response.headers.get('x-vercel-cache');
  
  // Determine cache status from headers
  let status: CacheStatus = 'MISS';
  
  if (xNextjsCache) {
    switch (xNextjsCache.toUpperCase()) {
      case 'HIT':
        status = 'HIT';
        break;
      case 'MISS':
        status = 'MISS';
        break;
      case 'STALE':
        status = 'STALE';
        break;
      case 'REVALIDATE':
        status = 'REVALIDATING';
        break;
      case 'BYPASS':
        status = 'BYPASS';
        break;
    }
  } else if (xVercelCache) {
    switch (xVercelCache.toUpperCase()) {
      case 'HIT':
        status = 'HIT';
        break;
      case 'MISS':
        status = 'MISS';
        break;
      case 'STALE':
        status = 'STALE';
        break;
    }
  }
  
  // Parse cache age
  const cacheAge = age ? parseInt(age, 10) : undefined;
  
  // Parse TTL from Cache-Control
  let ttl: number | undefined;
  if (cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch) {
      ttl = parseInt(maxAgeMatch[1], 10);
    }
  }
  
  return {
    status,
    age: cacheAge,
    timestamp,
    ttl,
  };
}

/**
 * Analyze cache behavior from fetch timing
 */
export function analyzeFetchTiming(duration: number, threshold = 100): CacheAnalysis {
  const timestamp = Date.now();
  
  // If fetch is very fast, likely a cache hit
  const status: CacheStatus = duration < threshold ? 'HIT' : 'MISS';
  
  return {
    status,
    timestamp,
  };
}

/**
 * Track cache event for metrics
 */
export function trackCacheEvent(key: string, analysis: CacheAnalysis) {
  // Update metrics
  let metrics = metricsStore.get(key);
  if (!metrics) {
    metrics = {
      hits: 0,
      misses: 0,
      stale: 0,
      bypasses: 0,
      totalRequests: 0,
      hitRate: 0,
      averageAge: 0,
    };
    metricsStore.set(key, metrics);
  }
  
  metrics.totalRequests++;
  
  switch (analysis.status) {
    case 'HIT':
      metrics.hits++;
      break;
    case 'MISS':
      metrics.misses++;
      break;
    case 'STALE':
    case 'REVALIDATING':
      metrics.stale++;
      break;
    case 'BYPASS':
      metrics.bypasses++;
      break;
  }
  
  // Calculate hit rate
  metrics.hitRate = (metrics.hits / metrics.totalRequests) * 100;
  
  // Update average age
  if (analysis.age !== undefined) {
    metrics.averageAge = 
      (metrics.averageAge * (metrics.totalRequests - 1) + analysis.age) / 
      metrics.totalRequests;
  }
  
  // Log event
  eventsLog.push({ key, analysis });
  if (eventsLog.length > MAX_LOG_SIZE) {
    eventsLog.shift();
  }
}

/**
 * Get cache metrics for a key
 */
export function getCacheMetrics(key: string): CacheMetrics | null {
  return metricsStore.get(key) || null;
}

/**
 * Get all cache metrics
 */
export function getAllCacheMetrics(): Map<string, CacheMetrics> {
  return new Map(metricsStore);
}

/**
 * Get recent cache events
 */
export function getRecentCacheEvents(limit = 20): Array<{ key: string; analysis: CacheAnalysis }> {
  return eventsLog.slice(-limit);
}

/**
 * Clear cache metrics
 */
export function clearCacheMetrics(key?: string) {
  if (key) {
    metricsStore.delete(key);
  } else {
    metricsStore.clear();
  }
}

/**
 * Clear cache events log
 */
export function clearCacheEvents() {
  eventsLog.length = 0;
}

/**
 * Detect cache warming opportunity
 */
export function detectCacheWarmingOpportunity(metrics: CacheMetrics): boolean {
  // If hit rate is low and we have enough data, suggest cache warming
  return metrics.totalRequests > 10 && metrics.hitRate < 30;
}

/**
 * Analyze cache effectiveness
 */
export interface CacheEffectiveness {
  overallHitRate: number;
  totalRequests: number;
  mostEffective: Array<{ key: string; hitRate: number }>;
  leastEffective: Array<{ key: string; hitRate: number }>;
  recommendations: string[];
}

export function analyzeCacheEffectiveness(): CacheEffectiveness {
  const allMetrics = Array.from(metricsStore.entries());
  
  if (allMetrics.length === 0) {
    return {
      overallHitRate: 0,
      totalRequests: 0,
      mostEffective: [],
      leastEffective: [],
      recommendations: ['No cache data available yet'],
    };
  }
  
  // Calculate overall stats
  const totalHits = allMetrics.reduce((sum, [, m]) => sum + m.hits, 0);
  const totalRequests = allMetrics.reduce((sum, [, m]) => sum + m.totalRequests, 0);
  const overallHitRate = (totalHits / totalRequests) * 100;
  
  // Sort by hit rate
  const sorted = allMetrics
    .map(([key, metrics]) => ({ key, hitRate: metrics.hitRate }))
    .sort((a, b) => b.hitRate - a.hitRate);
  
  const mostEffective = sorted.slice(0, 5);
  const leastEffective = sorted.slice(-5).reverse();
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (overallHitRate < 50) {
    recommendations.push('Overall cache hit rate is low. Consider increasing cache TTLs.');
  }
  
  if (leastEffective.some(item => item.hitRate < 20)) {
    recommendations.push('Some resources have very low cache hit rates. Review their caching strategy.');
  }
  
  const highMissRate = allMetrics.filter(([, m]) => m.misses > m.hits);
  if (highMissRate.length > allMetrics.length / 2) {
    recommendations.push('More than half of resources have more misses than hits. Consider cache warming.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Cache performance looks good!');
  }
  
  return {
    overallHitRate,
    totalRequests,
    mostEffective,
    leastEffective,
    recommendations,
  };
}

/**
 * Monitor cache behavior for a fetch request
 */
export async function monitorCachedFetch<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<{ data: T; analysis: CacheAnalysis }> {
  const startTime = performance.now();
  
  try {
    const data = await fetchFn();
    const duration = performance.now() - startTime;
    
    let analysis: CacheAnalysis;
    
    // If data is a Response, analyze headers
    if (data instanceof Response) {
      analysis = analyzeCacheHeaders(data as Response);
    } else {
      // Otherwise, analyze by timing
      analysis = analyzeFetchTiming(duration);
    }
    
    trackCacheEvent(key, analysis);
    
    return { data, analysis };
  } catch (error) {
    // Track as a miss/error
    const analysis: CacheAnalysis = {
      status: 'MISS',
      timestamp: Date.now(),
    };
    trackCacheEvent(key, analysis);
    throw error;
  }
}
