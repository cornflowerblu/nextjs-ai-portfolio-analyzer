/**
 * Cache Components Demo Page
 * Demonstrates Next.js 16 cache directive for component-level caching
 */

import { Suspense } from 'react';
import { CacheDemoClient } from './cache-demo-client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAnalysis } from '@/lib/lab/analyses';
import { kvGet, kvSet, kvDel } from '@/lib/storage/kv';
import type { CreateAnalysisActionResult } from '@/types/analysis';

export const metadata = {
  title: 'Cache Components Demo - Next.js 16',
  description: 'Live demonstration of Next.js 16 Cache Components with granular cache control',
};

const CACHE_KEY = 'cache-demo:cached-content';

const createAnalysisSchema = z.object({
  url: z.string().url('Enter a valid URL (https://example.com)'),
  strategy: z.enum(['SSR', 'SSG', 'ISR', 'CACHE', 'DYNAMIC']),
  score: z.coerce.number().int().min(0).max(100),
});

async function createAnalysisAction(formData: FormData): Promise<CreateAnalysisActionResult> {
  'use server';

  const parsed = createAnalysisSchema.safeParse({
    url: formData.get('url'),
    strategy: formData.get('strategy'),
    score: formData.get('score'),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid form submission',
    };
  }

  try {
    await createAnalysis(parsed.data);
    revalidatePath('/api/lab/analyses');
    revalidatePath('/lab/cache');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save analysis';
    return { success: false, error: message };
  }
}

// Server action to clear the cached component
export async function clearCachedContent() {
  'use server';
  await kvDel(CACHE_KEY);
  revalidatePath('/lab/cache');
}

// Cached component - truly cached in Redis/KV
// Simulates 'use cache' directive behavior (Next.js 16+)
async function CachedContent() {
  // Try to get cached value
  const cached = await kvGet<{ timestamp: number; value: string }>(CACHE_KEY);
  
  if (cached) {
    // Cache hit - measure just the retrieval time
    const startTime = performance.now();
    await new Promise(resolve => setTimeout(resolve, 2)); // Minimal delay for realism
    const renderTime = performance.now() - startTime;
    
    return {
      type: 'cached',
      timestamp: cached.timestamp,
      renderTime: Math.max(2, renderTime), // Show at least 2ms for cache hit
      value: cached.value,
      cacheHit: true,
    };
  }
  
  // Cache miss - expensive computation
  const startTime = performance.now();
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate expensive operation
  const renderTime = performance.now() - startTime;
  
  const newData = {
    timestamp: Date.now(),
    value: Math.random().toString(36).substring(7),
  };
  
  // Store with no expiration (manual invalidation only)
  await kvSet(CACHE_KEY, newData);
  
  return {
    type: 'cached',
    ...newData,
    renderTime,
    cacheHit: false,
  };
}

// Dynamic component - always fresh, simulates expensive computation
async function DynamicContent() {
  const startTime = performance.now();
  // Simulate expensive operation (database query, API call, etc.)
  await new Promise(resolve => setTimeout(resolve, 25));
  const renderTime = performance.now() - startTime;
  
  return {
    type: 'dynamic',
    timestamp: Date.now(),
    renderTime,
    value: Math.random().toString(36).substring(7),
  };
}

export default async function CacheDemoPage() {
  const cachedData = await CachedContent();
  const dynamicData = await DynamicContent();

  const sourceCode = `// app/lab/cache/page.tsx
// Cached component - reused across requests
async function CachedContent() {
  'use cache'; // Next.js 16+ cache directive
  // (Feature flag required in next.config)
  
  const data = await fetchExpensiveData();
  return <div>Cached: {data}</div>;
}

// Dynamic component - always fresh
async function DynamicContent() {
  const data = await fetchUserData();
  return <div>Fresh: {data}</div>;
}

export default async function Page() {
  return (
    <div>
      <CachedContent /> {/* Cached */}
      <DynamicContent /> {/* Dynamic */}
    </div>
  );
}

// Characteristics:
// - Granular cache control per component
// - Mix static and dynamic in same page
// - Optimize expensive renders
// - New in Next.js 16`;

  return (
    <Suspense fallback={<div>Loading demo...</div>}>
      <CacheDemoClient 
        cachedData={cachedData}
        dynamicData={dynamicData}
        sourceCode={sourceCode}
        createAnalysisAction={createAnalysisAction}
        clearCacheAction={clearCachedContent}
      />
    </Suspense>
  );
}
