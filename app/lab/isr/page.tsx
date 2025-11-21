/**
 * ISR Demo Page
 * Incremental Static Regeneration demonstration with revalidation
 */

import { Suspense } from 'react';
import { ISRDemoClient } from './isr-demo-client';

// Enable ISR with 60 second revalidation
export const revalidate = 60;

export const metadata = {
  title: 'ISR Demo - Incremental Static Regeneration',
  description: 'Live demonstration of Next.js ISR with periodic revalidation',
};

// Server component that generates data with revalidation
async function ISRContent() {
  const startTime = performance.now();
  
  // Simulate data fetching
  await new Promise(resolve => setTimeout(resolve, 30));
  
  const renderTime = performance.now() - startTime;
  const timestamp = Date.now();

  return {
    renderTime,
    timestamp,
    data: {
      contentId: Math.random().toString(36).substring(7),
      lastRevalidated: new Date().toISOString(),
      revalidateInterval: 60,
      viewCount: Math.floor(Math.random() * 10000) + 1000,
    },
  };
}

export default async function ISRDemoPage() {
  const isrData = await ISRContent();

  const sourceCode = `// app/lab/isr/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds

export default async function ISRDemoPage() {
  // Generated on first request
  // Then revalidated in background every 60s
  const data = await fetchDataFromAPI();
  
  return (
    <div>
      <h1>Last updated: {data.lastRevalidated}</h1>
      <p>Views: {data.viewCount}</p>
      <p>Next revalidation: in {60}s</p>
    </div>
  );
}

// Characteristics:
// - Initial request generates page
// - Cached and served instantly
// - Revalidates in background after timeout
// - Stale-while-revalidate pattern
// - Best balance of speed and freshness`;

  return (
    <Suspense fallback={<div>Loading demo...</div>}>
      <ISRDemoClient 
        isrData={isrData} 
        sourceCode={sourceCode}
      />
    </Suspense>
  );
}
