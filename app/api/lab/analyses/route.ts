/**
 * Lab Cache Demo - Analyses API Route
 *
 * Provides analysis data for the lab cache demonstration.
 * This is separate from the authenticated /api/analyses route.
 */

import { NextResponse } from 'next/server';
import {
  getRecentAnalyses,
  getCacheProvider,
  isKvReady,
  isPostgresReady,
  isRedisReady,
} from '@/lib/lab/analyses';

// Explicitly use Node.js runtime since analyses.ts imports Redis client
export const runtime = 'nodejs';
export const revalidate = 60;
export const fetchCache = 'force-cache';

export async function GET() {
  try {
    const result = await getRecentAnalyses();

    return NextResponse.json({
      ...result,
      cacheTTL: revalidate,
      kvEnabled: isKvReady(),
      redisEnabled: isRedisReady(),
      cacheProvider: getCacheProvider(),
      postgresEnabled: isPostgresReady(),
      servedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to load analyses (cached route)', error);
    return NextResponse.json(
      { error: 'Unable to load analyses' },
      { status: 500 },
    );
  }
}
