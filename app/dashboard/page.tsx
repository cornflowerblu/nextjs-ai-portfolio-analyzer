/**
 * Dashboard Page
 * Displays real-time performance comparisons across rendering strategies
 * MVP Feature: US1 - View Rendering Strategy Comparisons
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { ComparisonChart } from '@/components/dashboard/comparison-chart';
import { RealTimeIndicator } from '@/components/dashboard/real-time-indicator';
import { RENDERING_STRATEGIES } from '@/types/strategy';
import { CoreWebVitals } from '@/types/performance';
import { RenderingStrategyType } from '@/types/strategy';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';

interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<RenderingStrategyType | null>(null);
  
  // Fetch all strategy metrics with 1-second polling
  const { data: metricsData, error, isLoading } = useSWR<StrategyMetrics[]>(
    '/api/metrics',
    fetcher,
    {
      refreshInterval: 1000, // Poll every 1 second for real-time updates
      revalidateOnFocus: true,
    }
  );

  const lastUpdate = metricsData?.[0]?.timestamp 
    ? new Date(metricsData[0].timestamp) 
    : new Date();

  const isUpdating = isLoading && !!metricsData; // Loading but have cached data

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Metrics</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Performance Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Real-time Core Web Vitals comparison across SSR, SSG, ISR, and Cache Components
            </p>
          </div>
          <RealTimeIndicator lastUpdate={lastUpdate} isUpdating={isUpdating} />
        </div>
      </header>

      {/* Strategy Cards Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Rendering Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.values(RENDERING_STRATEGIES).map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isActive={selectedStrategy === strategy.id}
              onClick={() => setSelectedStrategy(
                selectedStrategy === strategy.id ? null : strategy.id
              )}
            />
          ))}
        </div>
      </section>

      {/* Metrics Panels */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
        {isLoading && !metricsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricsData?.map((data) => (
              <MetricsPanel
                key={data.strategy}
                metrics={data.metrics}
                strategyName={RENDERING_STRATEGIES[data.strategy].displayName}
              />
            ))}
          </div>
        )}
      </section>

      {/* Comparison Charts */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Performance Comparison</h2>
        {isLoading && !metricsData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <ChartSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComparisonChart
              data={metricsData || []}
              metricKey="fcp"
              title="First Contentful Paint (FCP)"
              description="Time to first DOM content render"
            />
            <ComparisonChart
              data={metricsData || []}
              metricKey="lcp"
              title="Largest Contentful Paint (LCP)"
              description="Time to largest content element"
            />
            <ComparisonChart
              data={metricsData || []}
              metricKey="cls"
              title="Cumulative Layout Shift (CLS)"
              description="Visual stability score"
            />
            <ComparisonChart
              data={metricsData || []}
              metricKey="inp"
              title="Interaction to Next Paint (INP)"
              description="Responsiveness to user interactions"
            />
          </div>
        )}
      </section>
    </div>
  );
}
