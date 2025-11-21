/**
 * Dashboard Page
 * Displays header, real-time indicator, and strategy cards
 * Metrics and comparison charts are now in parallel route slots
 * MVP Feature: US1 - View Rendering Strategy Comparisons
 */

'use client';

import useSWR from 'swr';
  import { SiteHeader } from '@/components/site-header';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { RealTimeIndicator } from '@/components/dashboard/real-time-indicator';
import { RENDERING_STRATEGIES } from '@/types/strategy';
import type { StrategyMetrics } from '@/types/metrics';
import { fetcher } from '@/lib/fetcher';
import { METRICS_SWR_CONFIG } from '@/lib/swr-config';

export default function DashboardPage() {
  // Fetch metrics for lastUpdate timestamp only
  const { data: metricsData, isLoading } = useSWR<StrategyMetrics[]>(
    '/api/metrics',
    fetcher,
    METRICS_SWR_CONFIG
  );

  const lastUpdate = metricsData?.[0]?.timestamp 
    ? new Date(metricsData[0].timestamp) 
    : new Date();

  const isUpdating = isLoading && !!metricsData; // Loading but have cached data

  return (
    <div>
      <SiteHeader />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
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
              isActive={false}
            />
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
