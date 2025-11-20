/**
 * Cache key generation utilities
 * Provides consistent key naming patterns for KV storage
 */

import type { RenderingStrategyType } from '@/types/strategy';

/**
 * Key prefixes for different data types
 */
export const KEY_PREFIXES = {
  METRICS: 'metrics',
  ANALYSIS: 'analysis',
  LIGHTHOUSE: 'lighthouse',
  HISTORICAL: 'historical',
  AI_INSIGHTS: 'insights',
  PLATFORM: 'platform',
  PROJECT: 'project',
} as const;

/**
 * Generate a metrics cache key for a specific strategy
 */
export function getMetricsKey(strategy: RenderingStrategyType, projectId = 'default'): string {
  return `${KEY_PREFIXES.METRICS}:${projectId}:${strategy.toLowerCase()}`;
}

/**
 * Generate a URL analysis cache key
 */
export function getAnalysisKey(url: string): string {
  // Hash the URL for a clean key
  const urlHash = hashString(url);
  return `${KEY_PREFIXES.ANALYSIS}:${urlHash}`;
}

/**
 * Generate a Lighthouse result cache key
 */
export function getLighthouseKey(url: string): string {
  const urlHash = hashString(url);
  return `${KEY_PREFIXES.LIGHTHOUSE}:${urlHash}`;
}

/**
 * Generate a historical data key for a time range
 */
export function getHistoricalKey(
  strategy: RenderingStrategyType,
  projectId = 'default',
  timestamp?: number
): string {
  const ts = timestamp || Date.now();
  const date = new Date(ts).toISOString().split('T')[0]; // YYYY-MM-DD
  return `${KEY_PREFIXES.HISTORICAL}:${projectId}:${strategy.toLowerCase()}:${date}`;
}

/**
 * Generate a historical data pattern for querying multiple dates
 */
export function getHistoricalPattern(
  strategy: RenderingStrategyType,
  projectId = 'default'
): string {
  return `${KEY_PREFIXES.HISTORICAL}:${projectId}:${strategy.toLowerCase()}:*`;
}

/**
 * Generate an AI insights cache key
 */
export function getInsightsKey(metricsHash: string): string {
  return `${KEY_PREFIXES.AI_INSIGHTS}:${metricsHash}`;
}

/**
 * Generate a platform feature measurement key
 */
export function getPlatformKey(feature: string, region?: string): string {
  const regionPart = region ? `:${region}` : '';
  return `${KEY_PREFIXES.PLATFORM}:${feature}${regionPart}`;
}

/**
 * Generate a project metadata key
 */
export function getProjectKey(projectId: string): string {
  return `${KEY_PREFIXES.PROJECT}:${projectId}`;
}

/**
 * Get all project IDs pattern
 */
export function getAllProjectsPattern(): string {
  return `${KEY_PREFIXES.PROJECT}:*`;
}

/**
 * Parse a project ID from a project key
 */
export function parseProjectId(key: string): string | null {
  const prefix = `${KEY_PREFIXES.PROJECT}:`;
  if (!key.startsWith(prefix)) return null;
  return key.substring(prefix.length);
}

/**
 * Generate a composite key for multiple strategies comparison
 */
export function getComparisonKey(
  strategies: RenderingStrategyType[],
  projectId = 'default'
): string {
  const strategiesHash = strategies.sort().join('-').toLowerCase();
  return `${KEY_PREFIXES.METRICS}:comparison:${projectId}:${strategiesHash}`;
}

/**
 * Simple string hash function for generating consistent keys
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a time-series key for aggregated data
 */
export function getAggregatedKey(
  strategy: RenderingStrategyType,
  projectId: string,
  granularity: 'hour' | 'day' | 'week' | 'month',
  timestamp: number
): string {
  const date = new Date(timestamp);
  let timeKey: string;

  switch (granularity) {
    case 'hour':
      timeKey = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${pad(date.getUTCHours())}`;
      break;
    case 'day':
      timeKey = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
      break;
    case 'week':
      const weekNum = getWeekNumber(date);
      timeKey = `${date.getUTCFullYear()}-W${pad(weekNum)}`;
      break;
    case 'month':
      timeKey = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
      break;
  }

  return `${KEY_PREFIXES.HISTORICAL}:agg:${projectId}:${strategy.toLowerCase()}:${granularity}:${timeKey}`;
}

/**
 * Helper to pad numbers to 2 digits
 */
function pad(num: number): string {
  return num.toString().padStart(2, '0');
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
