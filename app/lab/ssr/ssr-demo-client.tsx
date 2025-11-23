/**
 * SSR Demo Client Component
 * Client-side interactivity for SSR demo
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { DemoContainer } from '@/components/lab/demo-container';
import { useDemo } from '@/lib/lab/use-demo';
import { Badge } from '@/components/ui/badge';
import { Clock, Database, Server } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SSRDemoClientProps {
  serverData: {
    renderTime: number;
    timestamp: number;
    data: {
      requestCount: number;
      serverTime: string;
      randomValue: string;
    };
  };
  sourceCode: string;
}

export function SSRDemoClient({ serverData, sourceCode }: SSRDemoClientProps) {
  const { metrics, cacheInfo, isLoading, reRender, refresh } = useDemo({
    strategy: 'SSR',
  });

  const [justRendered, setJustRendered] = useState(true);
  const previousValueRef = useRef(serverData.data.randomValue);

  // Merge server data with client metrics
  const combinedMetrics = {
    ...metrics,
    renderTime: serverData.renderTime,
    timestamp: serverData.timestamp,
  };

  // Detect when new data arrives and trigger flash animation
  useEffect(() => {
    if (serverData.data.randomValue !== previousValueRef.current) {
      previousValueRef.current = serverData.data.randomValue;
      // Use setTimeout to avoid setState in effect warning
      const renderTimer = setTimeout(() => setJustRendered(true), 0);
      const hideTimer = setTimeout(() => setJustRendered(false), 2000);
      return () => {
        clearTimeout(renderTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [serverData.data.randomValue]);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/lab">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lab
        </Link>
      </Button>

      <DemoContainer
        strategy="SSR"
        title="Server-Side Rendering (SSR)"
        description="Content generated on every request with always-fresh data"
        metrics={combinedMetrics}
        cacheInfo={cacheInfo}
        sourceCode={sourceCode}
        onReRender={reRender}
        onRefresh={refresh}
        isLoading={isLoading}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">SSR Demo Content</h2>
            <p className="text-muted-foreground">
              This content is generated on the server for every request
            </p>
          </div>

          {/* Server Data Display */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              justRendered ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <Server className="h-5 w-5" />
                <span className="font-semibold">
                  Server Processing
                  {justRendered && <span className="ml-2 text-blue-600 dark:text-blue-400">✨ Fresh</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Render Time:</span>{' '}
                  <Badge variant="secondary" className={`transition-all duration-500 ${
                    justRendered ? 'ring-2 ring-blue-500' : ''
                  }`}>{serverData.renderTime.toFixed(2)}ms</Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Request #:</span>{' '}
                  <Badge variant="outline" className={`transition-all duration-500 ${
                    justRendered ? 'ring-2 ring-blue-500' : ''
                  }`}>{serverData.data.requestCount}</Badge>
                </p>
              </div>
            </div>

            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              justRendered ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">
                  Timestamp
                  {justRendered && <span className="ml-2 text-blue-600 dark:text-blue-400">✨ New</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Generated:</span>{' '}
                  <Badge variant="secondary" className={`transition-all duration-500 ${
                    justRendered ? 'ring-2 ring-blue-500' : ''
                  }`}>
                    {new Date(serverData.timestamp).toLocaleTimeString()}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {serverData.data.serverTime}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Content Proof */}
          <div className={`border-2 border-dashed rounded-lg p-6 bg-muted/50 text-center transition-all duration-500 ${
            justRendered ? 'ring-4 ring-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-105' : ''
          }`}>
            <Database className={`h-8 w-8 mx-auto mb-2 text-primary transition-all duration-500 ${
              justRendered ? 'scale-125 text-blue-600' : ''
            }`} />
            <h3 className="font-semibold mb-2">
              {justRendered ? '🎉 Just Rendered!' : 'Fresh Data on Every Request'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {justRendered 
                ? 'This value was generated on the server just for you!'
                : 'This unique value proves the page was server-rendered just now'
              }
            </p>
            <Badge variant="default" className={`text-lg px-4 py-2 font-mono transition-all duration-500 ${
              justRendered ? 'ring-2 ring-blue-500 scale-110' : ''
            }`}>
              {serverData.data.randomValue}
            </Badge>
            <p className="text-xs text-muted-foreground mt-4">
              {justRendered 
                ? 'Click "Trigger New Request" to see a different value'
                : 'Click "Trigger New Request" to generate a new value'
              }
            </p>
          </div>

          {/* Key Characteristics */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              SSR Characteristics
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>✓ Always fresh data - no stale content</li>
              <li>✓ Perfect for user-specific or real-time data</li>
              <li>✗ Higher TTFB - waits for server processing</li>
              <li>✗ More expensive - compute on every request</li>
            </ul>
          </div>
        </div>
      </DemoContainer>
    </div>
  );
}
