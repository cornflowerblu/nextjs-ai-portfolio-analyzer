/**
 * Shared Postgres data helpers for the lab demo.
 * Kept separate so Edge runtimes can import without pulling in Redis dependencies.
 */

import { sql } from '@vercel/postgres';
import type { AnalysisStrategy, RecentAnalysis } from '@/types/analysis';

export const POSTGRES_CONFIGURED = Boolean(process.env.POSTGRES_URL);

export type AnalysisRow = {
  id: string;
  url: string;
  strategy: AnalysisStrategy;
  score: number;
  created_at: Date;
};

export const DEMO_ANALYSES: RecentAnalysis[] = [
  {
    id: 'demo-1',
    url: 'https://vercel.com',
    strategy: 'ISR',
    score: 96,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'demo-2',
    url: 'https://nextjs.org',
    strategy: 'SSR',
    score: 91,
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: 'demo-3',
    url: 'https://github.com/vercel',
    strategy: 'CACHE',
    score: 99,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
];

export const mapRowToAnalysis = (row: AnalysisRow): RecentAnalysis => ({
  id: row.id,
  url: row.url,
  strategy: row.strategy,
  score: row.score,
  createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
});

export const fetchRecentAnalysesFromDatabase = async (
  limit = 5,
): Promise<RecentAnalysis[]> => {
  if (!POSTGRES_CONFIGURED) {
    return DEMO_ANALYSES;
  }

  try {
    const { rows } = await sql<AnalysisRow>`
      SELECT id, url, strategy, score, created_at
      FROM analyses
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows.map(mapRowToAnalysis);
  } catch (error) {
    console.error('Failed to query analyses table', error);
    return DEMO_ANALYSES;
  }
};

export const isPostgresReady = () => POSTGRES_CONFIGURED;
