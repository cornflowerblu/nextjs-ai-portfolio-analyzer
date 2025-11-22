/**
 * Data helpers for the dynamic cache lab demo.
 * Wraps Vercel Postgres + KV access with safe fallbacks for local dev.
 */

import { kv } from '@vercel/kv';
import { sql } from '@vercel/postgres';
import type {
  AnalysisStrategy,
  CreateAnalysisInput,
  KvStats,
  RecentAnalysis,
  RecentAnalysesResult,
} from '@/types/analysis';

const RECENT_ANALYSES_CACHE_KEY = 'analysis:list';
const ANALYSIS_STATS_KEY = 'analysis:stats';
const CACHE_TTL_SECONDS = 30;

const POSTGRES_CONFIGURED = Boolean(process.env.POSTGRES_URL);
const KV_CONFIGURED =
  Boolean(process.env.KV_REST_API_URL) &&
  Boolean(process.env.KV_REST_API_TOKEN);

type CachedAnalysesPayload = {
  items: RecentAnalysis[];
  refreshedAt: string;
};

type AnalysisRow = {
  id: string;
  url: string;
  strategy: AnalysisStrategy;
  score: number;
  created_at: Date;
};

const DEMO_ANALYSES: RecentAnalysis[] = [
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

const DEFAULT_STATS: KvStats = { hits: 0, misses: 0 };

const mapRowToAnalysis = (row: AnalysisRow): RecentAnalysis => ({
  id: row.id,
  url: row.url,
  strategy: row.strategy,
  score: row.score,
  createdAt: row.created_at?.toISOString?.() ?? new Date().toISOString(),
});

const recordStat = async (field: keyof KvStats) => {
  if (!KV_CONFIGURED) return;
  try {
    await kv.hincrby(ANALYSIS_STATS_KEY, field, 1);
  } catch (error) {
    console.error('Failed to increment KV stat', error);
  }
};

const readStats = async (): Promise<KvStats> => {
  if (!KV_CONFIGURED) return DEFAULT_STATS;
  try {
    const value = await kv.hgetall<Record<keyof KvStats, number | string>>(ANALYSIS_STATS_KEY);
    return {
      hits: Number(value?.hits ?? 0),
      misses: Number(value?.misses ?? 0),
    };
  } catch (error) {
    console.error('Failed to read KV stats', error);
    return DEFAULT_STATS;
  }
};

const readCache = async (): Promise<CachedAnalysesPayload | null> => {
  if (!KV_CONFIGURED) return null;
  try {
    return await kv.get<CachedAnalysesPayload>(RECENT_ANALYSES_CACHE_KEY);
  } catch (error) {
    console.error('Failed to read analyses cache', error);
    return null;
  }
};

const writeCache = async (payload: CachedAnalysesPayload) => {
  if (!KV_CONFIGURED) return;
  try {
    await kv.set(RECENT_ANALYSES_CACHE_KEY, payload, {
      ex: CACHE_TTL_SECONDS,
    });
  } catch (error) {
    console.error('Failed to write analyses cache', error);
  }
};

export const isPostgresReady = () => POSTGRES_CONFIGURED;
export const isKvReady = () => KV_CONFIGURED;

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

export const getRecentAnalyses = async (): Promise<RecentAnalysesResult> => {
  if (!POSTGRES_CONFIGURED) {
    return {
      items: DEMO_ANALYSES,
      cacheHit: true,
      refreshedAt: new Date().toISOString(),
      kvStats: DEFAULT_STATS,
      mode: 'demo',
    };
  }

  if (!KV_CONFIGURED) {
    return {
      items: await fetchRecentAnalysesFromDatabase(),
      cacheHit: false,
      refreshedAt: new Date().toISOString(),
      kvStats: DEFAULT_STATS,
      mode: 'database-only',
    };
  }

  const cached = await readCache();
  if (cached) {
    await recordStat('hits');
    return {
      items: cached.items,
      cacheHit: true,
      refreshedAt: cached.refreshedAt,
      kvStats: await readStats(),
      mode: 'live',
    };
  }

  const items = await fetchRecentAnalysesFromDatabase();
  const payload: CachedAnalysesPayload = {
    items,
    refreshedAt: new Date().toISOString(),
  };

  await writeCache(payload);
  await recordStat('misses');

  return {
    items,
    cacheHit: false,
    refreshedAt: payload.refreshedAt,
    kvStats: await readStats(),
    mode: 'live',
  };
};

export const invalidateAnalysesCache = async () => {
  if (!KV_CONFIGURED) return;
  try {
    await kv.del(RECENT_ANALYSES_CACHE_KEY);
  } catch (error) {
    console.error('Failed to invalidate analyses cache', error);
  }
};

export const createAnalysis = async (
  input: CreateAnalysisInput,
): Promise<RecentAnalysis> => {
  if (!POSTGRES_CONFIGURED) {
    throw new Error('POSTGRES_URL is not configured. Unable to insert data.');
  }

  const normalizedStrategy = input.strategy.toUpperCase() as AnalysisStrategy;

  try {
    const { rows } = await sql<AnalysisRow>`
      INSERT INTO analyses (url, strategy, score)
      VALUES (${input.url}, ${normalizedStrategy}, ${input.score})
      RETURNING id, url, strategy, score, created_at
    `;
    const record = rows[0];
    if (!record) {
      throw new Error('Insert succeeded but returned no rows.');
    }

    await invalidateAnalysesCache();
    return mapRowToAnalysis(record);
  } catch (error) {
    console.error('Failed to insert analysis', error);
    throw error;
  }
};
