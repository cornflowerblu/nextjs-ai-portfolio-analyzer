/**
 * Shared analysis data contracts used by the lab cache demo.
 */

import { RenderingStrategyType } from './strategy';

/**
 * Strategies supported by the dynamic data demo.
 * Adds a lightweight "DYNAMIC" label to contrast with cached reads.
 */
export type AnalysisStrategy = RenderingStrategyType | 'DYNAMIC';

export interface RecentAnalysis {
  id: string;
  url: string;
  strategy: AnalysisStrategy;
  score: number;
  createdAt: string;
}

export interface KvStats {
  hits: number;
  misses: number;
}

export interface RecentAnalysesResult {
  items: RecentAnalysis[];
  cacheHit: boolean;
  refreshedAt: string;
  kvStats: KvStats;
  mode: 'live' | 'demo' | 'database-only';
}

export interface CreateAnalysisInput {
  url: string;
  strategy: AnalysisStrategy;
  score: number;
}

export interface CreateAnalysisActionResult {
  success: boolean;
  error?: string;
}
