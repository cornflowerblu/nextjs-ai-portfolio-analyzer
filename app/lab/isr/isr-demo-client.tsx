/**
 * ISR Demo Client Component
 * Client-side interactivity for ISR demo
 */

'use client';

import { useState, useEffect } from 'react';
import { DemoContainer } from '@/components/lab/demo-container';
import { useDemo } from '@/lib/lab/use-demo';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ISRDemoClientProps {
  isrData: {
    renderTime: number;
    timestamp: number;
    data: {
      contentId: string;
      lastRevalidated: string;
      revalidateInterval: number;
      viewCount: number;
    };
  };
  sourceCode: string;
}

export function ISRDemoClient({ isrData, sourceCode }: ISRDemoClientProps) {
  const { metrics, cacheInfo, isLoading, reRender, refresh } = useDemo({
    strategy: 'ISR',
  });

  const [timeUntilRevalidation, setTimeUntilRevalidation] = useState(60);

  // Countdown to next revalidation
  useEffect(() => {
    const updateTimer = () => {
      const ageSeconds = Math.floor((Date.now() - isrData.timestamp) / 1000);
      const remaining = Math.max(0, isrData.data.revalidateInterval - ageSeconds);
      setTimeUntilRevalidation(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isrData.timestamp, isrData.data.revalidateInterval]);

  // Merge ISR data with client metrics
  const combinedMetrics = {
    ...metrics,
    renderTime: isrData.renderTime,
    timestamp: isrData.timestamp,
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
        strategy="ISR"
        title="Incremental Static Regeneration (ISR)"
        description="Static generation with automatic background revalidation"
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
            <h2 className="text-3xl font-bold">ISR Demo Content</h2>
            <p className="text-muted-foreground">
              Cached content with periodic background revalidation
            </p>
          </div>

          {/* Revalidation Status */}
          <div className="border-2 border-primary/50 rounded-lg p-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-primary ${timeUntilRevalidation === 0 ? 'animate-spin' : ''}`} />
                <span className="font-semibold">Revalidation Timer</span>
              </div>
              <Badge variant={timeUntilRevalidation === 0 ? 'default' : 'secondary'} className="text-lg px-3 py-1">
                {timeUntilRevalidation}s
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {timeUntilRevalidation === 0
                ? 'Content is being revalidated in the background...'
                : `Content will be revalidated in ${timeUntilRevalidation} seconds`}
            </p>
          </div>

          {/* ISR Data Display */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Cache Status</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Last Revalidated:</span>{' '}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {new Date(isrData.timestamp).toLocaleTimeString()}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Interval:</span>{' '}
                  <Badge variant="outline">{isrData.data.revalidateInterval}s</Badge>
                </p>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">Content Stats</span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Content ID:</span>{' '}
                  <Badge variant="secondary" className="font-mono">
                    {isrData.data.contentId}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">View Count:</span>{' '}
                  <Badge variant="default">{isrData.data.viewCount.toLocaleString()}</Badge>
                </p>
              </div>
            </div>
          </div>

          {/* Stale-While-Revalidate Explanation */}
          <div className="border-2 border-dashed rounded-lg p-6 bg-muted/50">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Stale-While-Revalidate Pattern
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              ISR uses a smart caching strategy:
            </p>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Serve cached version instantly (fast!)</li>
              <li>Check if revalidation period has passed</li>
              <li>If yes, regenerate in background (no blocking!)</li>
              <li>Next visitor gets the updated version</li>
            </ol>
          </div>

          {/* Key Benefits */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-purple-900 dark:text-purple-100">
              ISR Best of Both Worlds
            </h3>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>✓ Fast like SSG - served from cache</li>
              <li>✓ Fresh like SSR - automatic updates</li>
              <li>✓ No blocking - revalidation happens in background</li>
              <li>✓ Scales well - most requests hit cache</li>
              <li>⚡ Perfect for high-traffic dynamic content</li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-2">How It Works</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>First request:</strong> Generates page and caches it
              </p>
              <p>
                <strong>Within {isrData.data.revalidateInterval}s:</strong> Serves cached version instantly
              </p>
              <p>
                <strong>After {isrData.data.revalidateInterval}s:</strong> Still serves cache, but triggers background regeneration
              </p>
              <p>
                <strong>After regeneration:</strong> Next request gets updated content
              </p>
            </div>
          </div>
        </div>
      </DemoContainer>
    </div>
  );
}
