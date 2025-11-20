/**
 * Vercel KV (Redis) client for caching and data storage
 * Provides connection helpers and common operations
 */

import { createClient } from 'redis';

// Types for KV operations
export interface KVSetOptions {
  ex?: number; // Expiration in seconds
  px?: number; // Expiration in milliseconds
  nx?: boolean; // Only set if key doesn't exist
  xx?: boolean; // Only set if key exists
}

// Initialize Redis client
let client: ReturnType<typeof createClient> | null = null;

/**
 * Get or create Redis client instance
 */
export async function getKVClient() {
  if (client) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('REDIS_URL not configured - KV operations will be mocked');
    return null;
  }

  client = createClient({
    url: redisUrl,
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  await client.connect();
  return client;
}

/**
 * Set a value in KV with optional expiration
 */
export async function kvSet<T>(
  key: string,
  value: T,
  options?: KVSetOptions
): Promise<boolean> {
  try {
    const client = await getKVClient();
    if (!client) return false;

    const serialized = JSON.stringify(value);
    
    if (options?.ex) {
      await client.setEx(key, options.ex, serialized);
    } else if (options?.px) {
      await client.pSetEx(key, options.px, serialized);
    } else {
      await client.set(key, serialized);
    }
    
    return true;
  } catch (error) {
    console.error('KV Set Error:', error);
    return false;
  }
}

/**
 * Get a value from KV
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getKVClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;
    
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('KV Get Error:', error);
    return null;
  }
}

/**
 * Delete a key from KV
 */
export async function kvDel(key: string): Promise<boolean> {
  try {
    const client = await getKVClient();
    if (!client) return false;

    await client.del(key);
    return true;
  } catch (error) {
    console.error('KV Delete Error:', error);
    return false;
  }
}

/**
 * Check if a key exists
 */
export async function kvExists(key: string): Promise<boolean> {
  try {
    const client = await getKVClient();
    if (!client) return false;

    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    console.error('KV Exists Error:', error);
    return false;
  }
}

/**
 * Get keys matching a pattern
 */
export async function kvKeys(pattern: string): Promise<string[]> {
  try {
    const client = await getKVClient();
    if (!client) return [];

    return await client.keys(pattern);
  } catch (error) {
    console.error('KV Keys Error:', error);
    return [];
  }
}

/**
 * Set expiration on a key
 */
export async function kvExpire(key: string, seconds: number): Promise<boolean> {
  try {
    const client = await getKVClient();
    if (!client) return false;

    await client.expire(key, seconds);
    return true;
  } catch (error) {
    console.error('KV Expire Error:', error);
    return false;
  }
}

/**
 * Get time to live for a key
 */
export async function kvTTL(key: string): Promise<number> {
  try {
    const client = await getKVClient();
    if (!client) return -1;

    return await client.ttl(key);
  } catch (error) {
    console.error('KV TTL Error:', error);
    return -1;
  }
}

/**
 * Increment a numeric value
 */
export async function kvIncr(key: string): Promise<number> {
  try {
    const client = await getKVClient();
    if (!client) return 0;

    return await client.incr(key);
  } catch (error) {
    console.error('KV Incr Error:', error);
    return 0;
  }
}

/**
 * Measure operation latency
 */
export async function measureKVLatency<T>(
  operation: () => Promise<T>
): Promise<{ result: T; latency: number }> {
  const start = performance.now();
  const result = await operation();
  const latency = performance.now() - start;
  
  return { result, latency };
}

/**
 * Gracefully close the connection
 */
export async function closeKVConnection(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
