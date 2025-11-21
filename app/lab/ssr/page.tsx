/**
 * SSR Demo Page
 * Server-Side Rendering demonstration with force-dynamic
 */

import { Suspense } from 'react';
import { SSRDemoClient } from './ssr-demo-client';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'SSR Demo - Server-Side Rendering',
  description: 'Live demonstration of Next.js Server-Side Rendering with real-time metrics',
};

// Server component that generates data on each request
async function SSRContent() {
  const startTime = performance.now();
  
  // Simulate server-side data fetching
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const renderTime = performance.now() - startTime;
  const timestamp = Date.now();

  return {
    renderTime,
    timestamp,
    data: {
      requestCount: Math.floor(Math.random() * 1000) + 1,
      serverTime: new Date().toISOString(),
      randomValue: Math.random().toString(36).substring(7),
    },
  };
}

export default async function SSRDemoPage() {
  const serverData = await SSRContent();

  const sourceCode = `// app/lab/ssr/page.tsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SSRDemoPage() {
  // This runs on EVERY request - no caching
  const data = await fetchDataFromDatabase();
  
  return (
    <div>
      <h1>Always Fresh: {new Date().toISOString()}</h1>
      <p>Request #{data.requestCount}</p>
    </div>
  );
}

// Characteristics:
// - Renders on every request
// - Always fresh data
// - Higher TTFB (Time to First Byte)
// - Best for user-specific or real-time content`;

  return (
    <Suspense fallback={<div>Loading demo...</div>}>
      <SSRDemoClient 
        serverData={serverData} 
        sourceCode={sourceCode}
      />
    </Suspense>
  );
}
