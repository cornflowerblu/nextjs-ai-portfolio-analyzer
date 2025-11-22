import { NextResponse } from 'next/server';
import {
  getRecentAnalyses,
  isKvReady,
  isPostgresReady,
} from '@/lib/lab/analyses';

export const revalidate = 60;
export const fetchCache = 'force-cache';

export async function GET() {
  try {
    const result = await getRecentAnalyses();

    return NextResponse.json({
      ...result,
      cacheTTL: revalidate,
      kvEnabled: isKvReady(),
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
