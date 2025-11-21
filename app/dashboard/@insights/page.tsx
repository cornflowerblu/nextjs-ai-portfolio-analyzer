/**
 * Insights Parallel Route Slot
 * AI-powered optimization insights (Phase 6)
 * Part of dashboard parallel routes refactor
 */

'use client';

import { InsightsPanel } from '@/components/ai/insights-panel';
import useSWR from 'swr';
import type { StrategyMetrics } from '@/types/metrics';
import type { PerformanceContext } from '@/types/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function InsightsSlot() {
  const { data: metrics, error } = useSWR<StrategyMetrics[]>('/api/metrics', {
    refreshInterval: 1000,
    revalidateOnFocus: true,
  });

  if (error) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Insights</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unable to Load Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Failed to load performance metrics. Please refresh the page to try again.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!metrics) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">AI Insights</h2>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </section>
    );
  }

  const performanceContext: PerformanceContext = {
    strategies: metrics.map((m) => ({
      strategy: m.strategy,
      metrics: m.metrics,
    })),
    timestamp: new Date().toISOString(),
  };

  return <InsightsPanel performanceContext={performanceContext} autoAnalyze={true} />;
}
