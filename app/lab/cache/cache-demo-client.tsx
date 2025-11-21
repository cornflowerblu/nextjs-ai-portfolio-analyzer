/**
 * Cache Components Demo Client Component
 * Client-side interactivity for Cache Components demo
 */

'use client';

import { useState, useEffect } from 'react';
import { DemoContainer } from '@/components/lab/demo-container';
import { useDemo } from '@/lib/lab/use-demo';
import { Badge } from '@/components/ui/badge';
import { Layers, Zap, Database } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CacheDemoClientProps {
  cachedData: {
    type: string;
    timestamp: number;
    renderTime: number;
    value: string;
  };
  dynamicData: {
    type: string;
    timestamp: number;
    renderTime: number;
    value: string;
  };
  sourceCode: string;
}

export function CacheDemoClient({ cachedData, dynamicData, sourceCode }: CacheDemoClientProps) {
  const { metrics, cacheInfo, isLoading, reRender, refresh } = useDemo({
    strategy: 'CACHE',
  });

  // Calculate component ages (using state to avoid impure function in render)
  const [cachedAge, setCachedAge] = useState(0);
  const [dynamicAge, setDynamicAge] = useState(0);

  useEffect(() => {
    const updateAges = () => {
      setCachedAge(Date.now() - cachedData.timestamp);
      setDynamicAge(Date.now() - dynamicData.timestamp);
    };
    
    updateAges();
    const interval = setInterval(updateAges, 1000);
    return () => clearInterval(interval);
  }, [cachedData.timestamp, dynamicData.timestamp]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Link href="/lab" className="cursor-pointer">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lab
        </Button>
      </Link>

      <DemoContainer
        strategy="CACHE"
        title="Cache Components (Next.js 16)"
        description="Component-level caching for granular control"
        metrics={metrics}
        cacheInfo={cacheInfo}
        sourceCode={sourceCode}
        onReRender={reRender}
        onRefresh={refresh}
        isLoading={isLoading}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Cache Components Demo</h2>
            <p className="text-muted-foreground">
              Mix cached and dynamic components in the same page
            </p>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Cached Component */}
            <div className="border-2 border-green-500/50 rounded-lg p-4 bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-900 dark:text-green-100">
                  Cached Component
                </span>
                <Badge variant="default" className="ml-auto">Cached</Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="bg-white dark:bg-gray-900 rounded p-3 space-y-1">
                  <p className="text-muted-foreground">Component Value:</p>
                  <Badge variant="secondary" className="font-mono text-base">
                    {cachedData.value}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-xs text-muted-foreground">Render Time</p>
                    <p className="font-semibold">{cachedData.renderTime.toFixed(2)}ms</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-semibold">{(cachedAge / 1000).toFixed(1)}s</p>
                  </div>
                </div>

                <p className="text-xs text-green-700 dark:text-green-300 pt-2">
                  ✓ This component is cached and reused across requests
                </p>
              </div>
            </div>

            {/* Dynamic Component */}
            <div className="border-2 border-blue-500/50 rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  Dynamic Component
                </span>
                <Badge variant="secondary" className="ml-auto">Fresh</Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="bg-white dark:bg-gray-900 rounded p-3 space-y-1">
                  <p className="text-muted-foreground">Component Value:</p>
                  <Badge variant="secondary" className="font-mono text-base">
                    {dynamicData.value}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-xs text-muted-foreground">Render Time</p>
                    <p className="font-semibold">{dynamicData.renderTime.toFixed(2)}ms</p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded p-2">
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="font-semibold">{(dynamicAge / 1000).toFixed(1)}s</p>
                  </div>
                </div>

                <p className="text-xs text-blue-700 dark:text-blue-300 pt-2">
                  ✓ This component regenerates on every request
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="h-6 w-6 text-primary" />
              <h3 className="font-semibold text-lg">Component-Level Caching</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Next.js 16 introduces the <code className="bg-muted px-1 py-0.5 rounded">&apos;use cache&apos;</code> directive,
              allowing you to cache individual components while keeping others dynamic:
            </p>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="bg-white dark:bg-gray-900 rounded p-3">
                <p className="font-semibold mb-1">Cached Component:</p>
                <code className="text-xs text-green-600 dark:text-green-400">
                  &apos;use cache&apos;
                </code>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Rendered once, reused</li>
                  <li>• Perfect for expensive operations</li>
                  <li>• Same across all users</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded p-3">
                <p className="font-semibold mb-1">Dynamic Component:</p>
                <code className="text-xs text-blue-600 dark:text-blue-400">
                  (no directive)
                </code>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>• Fresh on every request</li>
                  <li>• User-specific content</li>
                  <li>• Always up-to-date</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-violet-900 dark:text-violet-100">
              Cache Components Advantages
            </h3>
            <ul className="space-y-1 text-sm text-violet-800 dark:text-violet-200">
              <li>✓ Granular control - cache what you need</li>
              <li>✓ Flexible architecture - mix static and dynamic</li>
              <li>✓ Performance optimization - reduce render overhead</li>
              <li>✓ Fine-grained revalidation - per component</li>
              <li>⚡ Best for complex pages with mixed requirements</li>
            </ul>
          </div>

          {/* Use Cases */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-2">Perfect Use Cases</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium mb-1">Cache these components:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Navigation menus</li>
                  <li>• Product listings</li>
                  <li>• Blog post content</li>
                  <li>• Static sections</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Keep these dynamic:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• User profiles</li>
                  <li>• Shopping carts</li>
                  <li>• Real-time data</li>
                  <li>• Personalized content</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DemoContainer>
    </div>
  );
}
