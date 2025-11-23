/**
 * ISR Demo Client Component
 * Client-side interactivity for ISR demo
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { metrics, cacheInfo, isLoading, reRender, refresh } = useDemo({
    strategy: 'ISR',
  });

  const [timeUntilRevalidation, setTimeUntilRevalidation] = useState(60);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(null);

  // Duration to show revalidation UI state (in milliseconds)
  const REVALIDATION_DISPLAY_DURATION = 3000;

  // Countdown to next revalidation
  useEffect(() => {
    const updateTimer = () => {
      const ageSeconds = Math.floor((Date.now() - isrData.timestamp) / 1000);
      const remaining = Math.max(0, isrData.data.revalidateInterval - ageSeconds);
      setTimeUntilRevalidation(remaining);
      
      // Trigger revalidation when timer hits zero
      // Only trigger if we haven't already refreshed for this timestamp
      const timerExpired = remaining === 0;
      const notCurrentlyRevalidating = !isRevalidating;
      const notAlreadyRefreshedForThisTimestamp = lastRefreshTimestamp !== isrData.timestamp;
      const shouldTriggerRevalidation = timerExpired && notCurrentlyRevalidating && notAlreadyRefreshedForThisTimestamp;
      
      if (shouldTriggerRevalidation) {
        setIsRevalidating(true);
        setLastRefreshTimestamp(isrData.timestamp);
        // Trigger Next.js to fetch fresh data from the server
        router.refresh();
        // Keep the revalidation UI visible for a few seconds
        setTimeout(() => setIsRevalidating(false), REVALIDATION_DISPLAY_DURATION);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isrData.timestamp, isrData.data.revalidateInterval, isRevalidating, lastRefreshTimestamp, router]);

  // Merge ISR data with client metrics
  const combinedMetrics = {
    ...metrics,
    renderTime: isrData.renderTime,
    timestamp: isrData.timestamp,
  };

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
          <div className={`border-2 rounded-lg p-4 transition-all duration-500 ${
            isRevalidating 
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 ring-4 ring-purple-500/50'
              : timeUntilRevalidation <= 10
              ? 'border-orange-500/70 bg-orange-50/50 dark:bg-orange-950/20'
              : 'border-primary/50 bg-primary/5'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 transition-all duration-500 ${
                  isRevalidating ? 'animate-spin text-purple-600' : 'text-primary'
                }`} />
                <span className="font-semibold">
                  {isRevalidating ? '🔄 Revalidating Now!' : 'Revalidation Timer'}
                </span>
              </div>
              <Badge 
                variant={isRevalidating || timeUntilRevalidation === 0 ? 'default' : 'secondary'} 
                className={`text-lg px-3 py-1 transition-all duration-300 ${
                  isRevalidating ? 'animate-pulse ring-2 ring-purple-500' :
                  timeUntilRevalidation <= 10 ? 'ring-2 ring-orange-500' : ''
                }`}
              >
                {timeUntilRevalidation}s
              </Badge>
            </div>
            <div className="mt-2">
              {/* Progress bar */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isRevalidating ? 'bg-purple-500 animate-pulse' :
                    timeUntilRevalidation <= 10 ? 'bg-orange-500' : 'bg-primary'
                  }`}
                  style={{ 
                    width: `${(timeUntilRevalidation / isrData.data.revalidateInterval) * 100}%` 
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isRevalidating
                ? '✨ Content is being regenerated in the background while you see the cached version!'
                : timeUntilRevalidation === 0
                ? 'Content is being revalidated in the background...'
                : timeUntilRevalidation <= 10
                ? `⚠️ Revalidation starting soon: ${timeUntilRevalidation} seconds remaining`
                : `Content will be revalidated in ${timeUntilRevalidation} seconds`}
            </p>
          </div>

          {/* ISR Data Display */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              isRevalidating ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">
                  Cache Status
                  {isRevalidating && <span className="ml-2 text-purple-600 dark:text-purple-400">🔄 Updating</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Last Revalidated:</span>{' '}
                  <Badge variant="secondary" className={`font-mono text-xs transition-all duration-500 ${
                    isRevalidating ? 'ring-2 ring-purple-500' : ''
                  }`}>
                    {new Date(isrData.timestamp).toLocaleTimeString()}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Interval:</span>{' '}
                  <Badge variant="outline">{isrData.data.revalidateInterval}s</Badge>
                </p>
                <p className="text-xs text-muted-foreground pt-1">
                  {isRevalidating 
                    ? '⏳ Background regeneration in progress...'
                    : timeUntilRevalidation <= 10
                    ? '⚡ Revalidation imminent'
                    : '✓ Serving from cache'
                  }
                </p>
              </div>
            </div>

            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              isRevalidating ? 'ring-2 ring-purple-500 bg-purple-50/50 dark:bg-purple-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                <span className="font-semibold">
                  Content Stats
                  {isRevalidating && <span className="ml-2 text-purple-600 dark:text-purple-400">✨ Fresh Soon</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Content ID:</span>{' '}
                  <Badge variant="secondary" className={`font-mono transition-all duration-500 ${
                    isRevalidating ? 'ring-2 ring-purple-500' : ''
                  }`}>
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
