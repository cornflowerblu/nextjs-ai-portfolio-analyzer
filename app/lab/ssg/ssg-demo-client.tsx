/**
 * SSG Demo Client Component
 * Client-side interactivity for SSG demo
 */

'use client';

import { useState, useEffect } from 'react';
import { DemoContainer } from '@/components/lab/demo-container';
import { useDemo } from '@/lib/lab/use-demo';
import { Badge } from '@/components/ui/badge';
import { Zap, Package, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SSGDemoClientProps {
  staticData: {
    buildTime: number;
    data: {
      buildId: string;
      generatedAt: string;
      version: string;
    };
  };
  sourceCode: string;
}

export function SSGDemoClient({ staticData, sourceCode }: SSGDemoClientProps) {
  const { metrics, cacheInfo, isLoading, reRender, refresh } = useDemo({
    strategy: 'SSG',
  });

  // Track simulated rebuild data (overrides static data when rebuild is simulated)
  const [simulatedData, setSimulatedData] = useState<typeof staticData.data | null>(null);
  const [simulatedBuildTime, setSimulatedBuildTime] = useState<number | null>(null);
  const [justRebuilt, setJustRebuilt] = useState(false);

  // Use simulated data if available, otherwise use static data
  const displayData = simulatedData || staticData.data;
  const displayBuildTime = simulatedBuildTime || staticData.buildTime;

  // Calculate age since build (using state to avoid impure function in render)
  const [ageMs, setAgeMs] = useState(0);

  useEffect(() => {
    const updateAge = () => {
      setAgeMs(Date.now() - displayBuildTime);
    };
    
    updateAge();
    const interval = setInterval(updateAge, 1000);
    return () => clearInterval(interval);
  }, [displayBuildTime]);

  const ageMinutes = Math.floor(ageMs / 60000);
  const ageSeconds = Math.floor((ageMs % 60000) / 1000);

  // Custom reRender handler for SSG that fetches simulated rebuild data
  const handleRebuild = async () => {
    // Fetch simulated rebuild data from API
    try {
      const response = await fetch(`/api/demo/ssg?simulate=true&cacheBust=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.buildData) {
          setSimulatedData({
            buildId: data.buildData.buildId,
            generatedAt: data.buildData.generatedAt,
            version: staticData.data.version,
          });
          setSimulatedBuildTime(data.buildData.buildTime);
          
          // Show rebuild animation
          setJustRebuilt(true);
          setTimeout(() => setJustRebuilt(false), 2000);
        }
      }
    } catch (error) {
      console.error('Error simulating rebuild:', error);
    }
    
    // Also call the default reRender to update metrics
    reRender();
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
        strategy="SSG"
        title="Static Site Generation (SSG)"
        description="Pre-rendered at build time for maximum performance"
        metrics={metrics}
        cacheInfo={cacheInfo}
        sourceCode={sourceCode}
        onReRender={handleRebuild}
        onRefresh={refresh}
        isLoading={isLoading}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">SSG Demo Content</h2>
            <p className="text-muted-foreground">
              This content was pre-rendered at build time
            </p>
          </div>

          {/* Build Info Display */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              justRebuilt ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <Package className="h-5 w-5" />
                <span className="font-semibold">
                  Build Information
                  {justRebuilt && <span className="ml-2 text-green-600 dark:text-green-400">✨ Updated</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Build ID:</span>{' '}
                  <Badge variant="secondary" className={`font-mono transition-all duration-500 ${
                    justRebuilt ? 'ring-2 ring-green-500 scale-110' : ''
                  }`}>
                    {displayData.buildId}
                  </Badge>
                </p>
                <p>
                  <span className="text-muted-foreground">Version:</span>{' '}
                  <Badge variant="outline">{displayData.version}</Badge>
                </p>
              </div>
            </div>

            <div className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
              justRebuilt ? 'ring-2 ring-green-500 bg-green-50/50 dark:bg-green-950/20' : ''
            }`}>
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-5 w-5" />
                <span className="font-semibold">
                  Performance
                  {justRebuilt && <span className="ml-2 text-green-600 dark:text-green-400">✨ Reset</span>}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Page Age:</span>{' '}
                  <Badge variant="secondary" className={`transition-all duration-500 ${
                    justRebuilt ? 'ring-2 ring-green-500' : ''
                  }`}>
                    {ageMinutes}m {ageSeconds}s
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  Built: {new Date(displayBuildTime).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Static Content Proof */}
          <div 
            className={`border-2 border-dashed rounded-lg p-6 bg-muted/50 text-center transition-all duration-500 will-change-transform ${
              justRebuilt ? 'ring-4 ring-green-500 bg-green-50 dark:bg-green-950/30' : ''
            }`}
            style={justRebuilt ? { transform: 'scale(1.05)' } : undefined}
          >
            <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h3 className="font-semibold mb-2">
              {justRebuilt ? '🎉 New Build Generated!' : 'Same for All Visitors'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {justRebuilt 
                ? 'The page was rebuilt with fresh content!'
                : 'This value was generated at build time and is identical for everyone'
              }
            </p>
            <Badge variant="default" className="text-lg px-4 py-2 font-mono">
              {displayData.buildId}
            </Badge>
            <p className="text-xs text-muted-foreground mt-4">
              Generated at: {displayData.generatedAt}
            </p>
            {!justRebuilt && (
              <p className="text-xs text-muted-foreground">
                &quot;Simulate Rebuild&quot; will create a new version
              </p>
            )}
          </div>

          {/* Performance Benefits */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-green-900 dark:text-green-100">
              SSG Performance Benefits
            </h3>
            <ul className="space-y-1 text-sm text-green-800 dark:text-green-200">
              <li>✓ Fastest possible TTFB - instant from CDN</li>
              <li>✓ Zero server compute cost per request</li>
              <li>✓ Perfect for global distribution</li>
              <li>✗ Data can be stale until rebuild</li>
              <li>✗ Requires rebuild to update content</li>
            </ul>
          </div>

          {/* CDN Distribution Info */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              CDN Distribution
            </h3>
            <p className="text-sm text-muted-foreground">
              This page is served from a Content Delivery Network (CDN) edge location nearest to you,
              ensuring lightning-fast load times regardless of where you are in the world.
            </p>
          </div>
        </div>
      </DemoContainer>
    </div>
  );
}
