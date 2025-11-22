/**
 * Data helpers for the dynamic cache lab demo.
 * Wraps Vercel Postgres + KV access with safe fallbacks for local dev.
 */

import { kv } from '@vercel/kv';
import { sql } from '@vercel/postgres';
import { createClient, RedisClientType } from 'redis';
import type { AnalysisStrategy, CreateAnalysisInput, KvStats, RecentAnalysis, RecentAnalysesResult } from '@/types/analysis';
import {
  AnalysisRow,
  DEMO_ANALYSES,
  fetchRecentAnalysesFromDatabase,
  isPostgresReady,
  mapRowToAnalysis,
} from './analyses-data';

const RECENT_ANALYSES_CACHE_KEY = 'analysis:list';
const ANALYSIS_STATS_KEY = 'analysis:stats';
const CACHE_TTL_SECONDS = 30;

const KV_CONFIGURED =
  Boolean(process.env.KV_REST_API_URL) &&
  Boolean(process.env.KV_REST_API_TOKEN);
const REDIS_CONFIGURED = Boolean(process.env.REDIS_URL);

type CacheProvider = 'kv' | 'redis' | 'none';
const CACHE_PROVIDER: CacheProvider = KV_CONFIGURED
  ? 'kv'
  : REDIS_CONFIGURED
    ? 'redis'
    : 'none';

// Removed module-scoped redisClient to avoid race conditions in serverless environments.

const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (!REDIS_CONFIGURED) return null;

  try {
    const client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on('error', (error) => {
      console.error('Redis client error', error);
    });
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to Redis', error);
    return null;
  }
};

type CachedAnalysesPayload = {
  items: RecentAnalysis[];
  refreshedAt: string;
};

const DEFAULT_STATS: KvStats = { hits: 0, misses: 0 };

const recordStat = async (field: keyof KvStats) => {
  if (KV_CONFIGURED) {
    try {
      await kv.hincrby(ANALYSIS_STATS_KEY, field, 1);
    } catch (error) {
      console.error('Failed to increment KV stat', error);
    }
    return;
  }

  const redis = await getRedisClient();
  if (!redis) return;

  try {
    await redis.hIncrBy(ANALYSIS_STATS_KEY, field, 1);
  } catch (error) {
    console.error('Failed to increment Redis stat', error);
  }
};

const readStats = async (): Promise<KvStats> => {
  if (KV_CONFIGURED) {
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
  }

  const redis = await getRedisClient();
  if (!redis) return DEFAULT_STATS;

  try {
    const value = await redis.hGetAll(ANALYSIS_STATS_KEY);
    return {
      hits: Number(value?.hits ?? 0),
      misses: Number(value?.misses ?? 0),
    };
  } catch (error) {
    console.error('Failed to read Redis stats', error);
    return DEFAULT_STATS;
  }
};

const readCache = async (): Promise<CachedAnalysesPayload | null> => {
  if (KV_CONFIGURED) {
    try {
      return await kv.get<CachedAnalysesPayload>(RECENT_ANALYSES_CACHE_KEY);
    } catch (error) {
      console.error('Failed to read analyses cache from KV', error);
      return null;
    }
  }

  const redis = await getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get(RECENT_ANALYSES_CACHE_KEY);
    return value ? (JSON.parse(value) as CachedAnalysesPayload) : null;
  } catch (error) {
    console.error('Failed to read analyses cache from Redis', error);
    return null;
  }
};

const writeCache = async (payload: CachedAnalysesPayload) => {
  if (KV_CONFIGURED) {
    try {
      await kv.set(RECENT_ANALYSES_CACHE_KEY, payload, {
        ex: CACHE_TTL_SECONDS,
      });
    } catch (error) {
      console.error('Failed to write analyses cache to KV', error);
    }
    return;
  }

  const redis = await getRedisClient();
  if (!redis) return;

  try {
    await redis.setEx(
      RECENT_ANALYSES_CACHE_KEY,
      CACHE_TTL_SECONDS,
      JSON.stringify(payload),
    );
  } catch (error) {
    console.error('Failed to write analyses cache to Redis', error);
  }
};

export { fetchRecentAnalysesFromDatabase, isPostgresReady };
export const isKvReady = () => KV_CONFIGURED;
export const isRedisReady = () => REDIS_CONFIGURED;
export const getCacheProvider = () => CACHE_PROVIDER;

export const getRecentAnalyses = async (): Promise<RecentAnalysesResult> => {
  if (!isPostgresReady()) {
    return {
      items: DEMO_ANALYSES,
      cacheHit: false,
      refreshedAt: new Date().toISOString(),
      kvStats: DEFAULT_STATS,
      mode: 'demo',
    };
  }

  if (CACHE_PROVIDER === 'none') {
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
  if (KV_CONFIGURED) {
    try {
      await kv.del(RECENT_ANALYSES_CACHE_KEY);
    } catch (error) {
      console.error('Failed to invalidate analyses cache (KV)', error);
    }
    return;
  }

  const redis = await getRedisClient();
  if (!redis) return;

  try {
    await redis.del(RECENT_ANALYSES_CACHE_KEY);
  } catch (error) {
    console.error('Failed to invalidate analyses cache (Redis)', error);
  }
};

export const createAnalysis = async (
  input: CreateAnalysisInput,
): Promise<RecentAnalysis> => {
  if (!isPostgresReady()) {
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
