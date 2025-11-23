/**
 * Metrics Parallel Route Slot
 * Displays Core Web Vitals panels for all rendering strategies
 * Part of dashboard parallel routes refactor
 * 
 * Phase 4: User Story 2 - Dashboard Real Data Display
 * Converted to Server Component with database queries
 */

import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { RENDERING_STRATEGIES } from '@/types/strategy';
import type { CoreWebVitals } from '@/types/performance';
import { getCurrentUserId } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { getRating, CORE_WEB_VITALS_THRESHOLDS } from '@/types/performance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

// T009: Remove 'use client' and convert to async Server Component
export default async function MetricsSlot() {
  // T010: Get current user from session
  const userId = await getCurrentUserId();

  // If no user, show login prompt (empty state)
  if (!userId) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Please log in to view your performance metrics.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            >
              Log In
            </Link>
          </CardContent>
        </Card>
      </section>
    );
  }

  // T011: Query database for metrics from last 24 hours with aggregation
  // Query all metrics for the user in the last 24 hours
  // eslint-disable-next-line react-hooks/purity -- Date.now() is valid in Server Components (server-side only)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentMetrics = await prisma.webVitalsMetric.findMany({
    where: {
      userId,
      collectedAt: {
        gte: oneDayAgo,
      },
    },
    select: {
      strategy: true,
      lcpMs: true,
      cls: true,
      inpMs: true,
      fidMs: true,
      ttfbMs: true,
    },
  });

  // T015: Show empty state if no metrics found
  if (recentMetrics.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
        <Card>
          <CardHeader>
            <CardTitle>No Metrics Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No performance metrics collected in the last 24 hours.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Visit the lab pages to generate metrics:
            </p>
            <div className="flex gap-2">
              <Link
                href="/lab/ssg"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                SSG Demo
              </Link>
              <Link
                href="/lab/isr"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                ISR Demo
              </Link>
              <Link
                href="/lab/cache"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                Cache Demo
              </Link>
              <Link
                href="/lab/ssr"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                SSR Demo
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // T012: Transform query results into aggregated metrics per strategy
  // Group by strategy and calculate averages
  const strategyMap = new Map<
    string,
    {
      lcpSum: number;
      lcpCount: number;
      clsSum: number;
      clsCount: number;
      inpSum: number;
      inpCount: number;
      fidSum: number;
      fidCount: number;
      ttfbSum: number;
      ttfbCount: number;
    }
  >();

  // Aggregate metrics by strategy
  for (const metric of recentMetrics) {
    const strategy = metric.strategy;
    if (!strategyMap.has(strategy)) {
      strategyMap.set(strategy, {
        lcpSum: 0,
        lcpCount: 0,
        clsSum: 0,
        clsCount: 0,
        inpSum: 0,
        inpCount: 0,
        fidSum: 0,
        fidCount: 0,
        ttfbSum: 0,
        ttfbCount: 0,
      });
    }

    const agg = strategyMap.get(strategy)!;

    if (metric.lcpMs !== null) {
      agg.lcpSum += metric.lcpMs;
      agg.lcpCount++;
    }
    if (metric.cls !== null) {
      agg.clsSum += metric.cls;
      agg.clsCount++;
    }
    if (metric.inpMs !== null) {
      agg.inpSum += metric.inpMs;
      agg.inpCount++;
    }
    if (metric.fidMs !== null) {
      agg.fidSum += metric.fidMs;
      agg.fidCount++;
    }
    if (metric.ttfbMs !== null) {
      agg.ttfbSum += metric.ttfbMs;
      agg.ttfbCount++;
    }
  }

  // Convert aggregated data to CoreWebVitals format for each strategy
  const strategyMetricsData = Array.from(strategyMap.entries())
    .map(([strategy, agg]) => {
      // Calculate averages (only if we have data)
      const avgLcp = agg.lcpCount > 0 ? agg.lcpSum / agg.lcpCount : 0;
      const avgCls = agg.clsCount > 0 ? agg.clsSum / agg.clsCount : 0;
      const avgInp = agg.inpCount > 0 ? agg.inpSum / agg.inpCount : 0;
      // Note: FID (First Input Delay) is tracked in DB but not displayed - replaced by INP
      const avgTtfb = agg.ttfbCount > 0 ? agg.ttfbSum / agg.ttfbCount : 0;

      // Estimate FCP as ~60% of LCP (typical relationship based on Core Web Vitals data)
      // FCP measures first paint, LCP measures largest paint, so FCP is usually earlier
      const estimatedFcp = avgLcp * 0.6;

      // Create CoreWebVitals object with ratings
      const metrics: CoreWebVitals = {
        fcp: {
          value: estimatedFcp,
          rating: getRating(estimatedFcp, CORE_WEB_VITALS_THRESHOLDS.fcp),
          delta: 0,
        },
        lcp: {
          value: avgLcp,
          rating: getRating(avgLcp, CORE_WEB_VITALS_THRESHOLDS.lcp),
          delta: 0,
        },
        cls: {
          value: avgCls,
          rating: getRating(avgCls, CORE_WEB_VITALS_THRESHOLDS.cls),
          delta: 0,
        },
        inp: {
          value: avgInp,
          rating: getRating(avgInp, CORE_WEB_VITALS_THRESHOLDS.inp),
          delta: 0,
        },
        ttfb: {
          value: avgTtfb,
          rating: getRating(avgTtfb, CORE_WEB_VITALS_THRESHOLDS.ttfb),
          delta: 0,
        },
        timestamp: new Date().toISOString(),
      };

      return {
        strategy,
        metrics,
      };
    })
    // Filter out invalid strategies and sort by strategy order: SSG, ISR, CACHE, SSR
    .filter(({ strategy }) => strategy in RENDERING_STRATEGIES)
    .sort((a, b) => {
      const order = ['SSG', 'ISR', 'CACHE', 'SSR'];
      return order.indexOf(a.strategy) - order.indexOf(b.strategy);
    });

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {strategyMetricsData.map((strategyData) => {
          // Strategy is guaranteed to be valid after filter above
          const strategyKey = strategyData.strategy as keyof typeof RENDERING_STRATEGIES;
          return (
            <MetricsPanel
              key={strategyData.strategy}
              metrics={strategyData.metrics}
              strategyName={RENDERING_STRATEGIES[strategyKey].displayName}
            />
          );
        })}
      </div>
    </section>
  );
}
