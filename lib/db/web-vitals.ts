/**
 * Database functions for Web Vitals metrics persistence
 * Phase 5: User Story 3 - Track Core Web Vitals by strategy
 * 
 * Provides functions to:
 * - T037: Create Web Vitals metric records
 * - T038: List and filter Web Vitals metrics with pagination
 */

import { prisma } from '@/lib/db/prisma';
import { RenderingStrategy } from '@/lib/generated/prisma';

/**
 * Input data for creating a Web Vitals metric
 */
export interface CreateWebVitalsMetricInput {
  userId: string;
  url: string;
  strategy: RenderingStrategy;
  lcpMs?: number | null;
  cls?: number | null;
  inpMs?: number | null;
  fidMs?: number | null;
  ttfbMs?: number | null;
}

/**
 * Query options for listing Web Vitals metrics
 */
export interface ListWebVitalsMetricsOptions {
  userId: string;
  url?: string;
  strategy?: RenderingStrategy;
  limit?: number;
  offset?: number;
}

/**
 * Result of listing Web Vitals metrics
 */
export interface ListWebVitalsMetricsResult {
  metrics: Array<{
    id: string;
    userId: string;
    url: string;
    strategy: RenderingStrategy;
    lcpMs: number | null;
    cls: number | null;
    inpMs: number | null;
    fidMs: number | null;
    ttfbMs: number | null;
    collectedAt: Date;
  }>;
  total: number;
  hasMore: boolean;
}

/**
 * T037: Create a new Web Vitals metric record
 * 
 * Stores Core Web Vitals measurements for a specific URL and rendering strategy.
 * All metrics are optional except userId, url, and strategy.
 * 
 * @param data - Metric data including userId, url, strategy, and optional metrics
 * @returns Created metric record with generated ID and timestamp
 * 
 * @example
 * ```ts
 * const metric = await createWebVitalsMetric({
 *   userId: 'user-123',
 *   url: 'https://example.com',
 *   strategy: 'SSR',
 *   lcpMs: 1200,
 *   cls: 0.05,
 *   inpMs: 80,
 *   ttfbMs: 200,
 * });
 * ```
 */
export async function createWebVitalsMetric(data: CreateWebVitalsMetricInput) {
  return await prisma.webVitalsMetric.create({
    data: {
      userId: data.userId,
      url: data.url,
      strategy: data.strategy,
      lcpMs: data.lcpMs ?? null,
      cls: data.cls ?? null,
      inpMs: data.inpMs ?? null,
      fidMs: data.fidMs ?? null,
      ttfbMs: data.ttfbMs ?? null,
    },
  });
}

/**
 * T038: List Web Vitals metrics with optional filters and pagination
 * 
 * Retrieves metrics for a specific user, optionally filtered by URL and/or rendering strategy.
 * Results are ordered by collectedAt descending (newest first) and support pagination.
 * 
 * Uses indexed queries for optimal performance:
 * - Single user: @@index([userId, collectedAt(sort: Desc)])
 * - User + URL + Strategy: @@index([userId, url, strategy, collectedAt(sort: Desc)])
 * 
 * @param options - Query options including userId (required), optional filters, and pagination
 * @returns Paginated list of metrics with total count and hasMore flag
 * 
 * @example
 * ```ts
 * // Get all metrics for a user
 * const result = await listWebVitalsMetrics({ userId: 'user-123' });
 * 
 * // Filter by URL and strategy
 * const result = await listWebVitalsMetrics({
 *   userId: 'user-123',
 *   url: 'https://example.com',
 *   strategy: 'SSR',
 *   limit: 20,
 *   offset: 0,
 * });
 * ```
 */
export async function listWebVitalsMetrics(
  options: ListWebVitalsMetricsOptions
): Promise<ListWebVitalsMetricsResult> {
  const { userId, url, strategy, limit = 50, offset = 0 } = options;

  // Build where clause with optional filters
  const where: {
    userId: string;
    url?: string;
    strategy?: RenderingStrategy;
  } = { userId };
  if (url) {
    where.url = url;
  }
  if (strategy) {
    where.strategy = strategy;
  }

  // Execute query with pagination
  const [metrics, total] = await Promise.all([
    prisma.webVitalsMetric.findMany({
      where,
      orderBy: { collectedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.webVitalsMetric.count({ where }),
  ]);

  // Calculate if there are more results
  const hasMore = offset + metrics.length < total;

  return {
    metrics,
    total,
    hasMore,
  };
}
