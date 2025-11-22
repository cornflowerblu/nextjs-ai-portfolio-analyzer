/**
 * Cache Components Demo Page
 * Demonstrates Next.js 16 cache directive for component-level caching
 */

import { Suspense } from 'react';
import { CacheDemoClient } from './cache-demo-client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAnalysis } from '@/lib/lab/analyses';
import type { CreateAnalysisActionResult } from '@/types/analysis';

export const metadata = {
  title: 'Cache Components Demo - Next.js 16',
  description: 'Live demonstration of Next.js 16 Cache Components with granular cache control',
};

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
    revalidatePath('/api/analyses');
    revalidatePath('/lab/cache');
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save analysis';
    return { success: false, error: message };
  }
}

// Cached component - simulates component-level caching
// In production, this would use 'use cache' directive (Next.js 16+)
async function CachedContent() {
  const startTime = performance.now();
  await new Promise(resolve => setTimeout(resolve, 25));
  const renderTime = performance.now() - startTime;
  
  return {
    type: 'cached',
    timestamp: Date.now(),
    renderTime,
    value: Math.random().toString(36).substring(7),
  };
}

// Dynamic component - always fresh
async function DynamicContent() {
  const startTime = performance.now();
  await new Promise(resolve => setTimeout(resolve, 10));
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
      />
    </Suspense>
  );
}
