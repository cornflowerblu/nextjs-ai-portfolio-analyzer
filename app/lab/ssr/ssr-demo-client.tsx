/**
 * SSR Demo Client Component
 * Client-side interactivity for SSR demo
 */

'use client';

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

  // Merge server data with client metrics
  const combinedMetrics = {
    ...metrics,
    renderTime: serverData.renderTime,
    timestamp: serverData.timestamp,
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Link href="/lab">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lab
        </Button>
      </Link>

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
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Server className="h-5 w-5" />
                <span className="font-semibold">Server Processing</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Render Time:</span>{' '}
                  <Badge variant="secondary">{serverData.renderTime.toFixed(2)}ms</Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Request #:</span>{' '}
                  <Badge variant="outline">{serverData.data.requestCount}</Badge>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Timestamp</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Generated:</span>{' '}
                  <Badge variant="secondary">
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
          <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50 text-center">
            <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-2">Fresh Data on Every Request</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This unique value proves the page was server-rendered just now
            </p>
            <Badge variant="default" className="text-lg px-4 py-2 font-mono">
              {serverData.data.randomValue}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Click &quot;Trigger New Request&quot; to generate a new value
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
