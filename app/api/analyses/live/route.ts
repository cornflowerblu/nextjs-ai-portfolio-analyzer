import { NextResponse } from 'next/server';
import {
  fetchRecentAnalysesFromDatabase,
  isPostgresReady,
} from '@/lib/lab/analyses';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const start = performance.now();

  try {
    const analyses = await fetchRecentAnalysesFromDatabase();
    const latency = performance.now() - start;

    return NextResponse.json({
      analyses,
      latency,
      mode: isPostgresReady() ? 'live' : 'demo',
      servedAt: new Date().toISOString(),
      runtime,
    });
  } catch (error) {
    console.error('Failed to load live analyses', error);
    return NextResponse.json(
      { error: 'Unable to load live analyses' },
      { status: 500 },
    );
  }
}
