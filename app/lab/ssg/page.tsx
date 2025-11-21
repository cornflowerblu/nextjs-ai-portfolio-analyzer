/**
 * SSG Demo Page
 * Static Site Generation demonstration with force-static
 */

import { Suspense } from 'react';
import { SSGDemoClient } from './ssg-demo-client';

// Force static generation
export const dynamic = 'force-static';

export const metadata = {
  title: 'SSG Demo - Static Site Generation',
  description: 'Live demonstration of Next.js Static Site Generation with build-time rendering',
};

// This function tells Next.js to generate this page at build time
export async function generateStaticParams() {
  return [{}]; // Single static page
}

// Server component that generates data at build time
async function SSGContent() {
  const buildTime = Date.now();
  
  // Simulate build-time data fetching
  await new Promise(resolve => setTimeout(resolve, 10));

  return {
    buildTime,
    data: {
      buildId: Math.random().toString(36).substring(7),
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

export default async function SSGDemoPage() {
  const staticData = await SSGContent();

  const sourceCode = `// app/lab/ssg/page.tsx
export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [{}]; // Generated at build time
}

export default async function SSGDemoPage() {
  // This runs ONCE at build time
  const data = await fetchDataFromCMS();
  
  return (
    <div>
      <h1>Built at: {new Date().toISOString()}</h1>
      <p>Build ID: {data.buildId}</p>
      <p>This is the same for all visitors!</p>
    </div>
  );
}

// Characteristics:
// - Generated once at build time
// - Fastest possible load time
// - Perfect for CDN distribution
// - Data doesn't change until rebuild`;

  return (
    <Suspense fallback={<div>Loading demo...</div>}>
      <SSGDemoClient 
        staticData={staticData} 
        sourceCode={sourceCode}
      />
    </Suspense>
  );
}
