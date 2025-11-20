/**
 * Dashboard Page
 * Displays header, real-time indicator, and strategy cards
 * Metrics, comparison, and insights are handled by parallel routes
 * MVP Feature: US1 - View Rendering Strategy Comparisons
 */

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { StrategyCard } from '@/components/dashboard/strategy-card';
import { RealTimeIndicator } from '@/components/dashboard/real-time-indicator';
import { RENDERING_STRATEGIES } from '@/types/strategy';
import { CoreWebVitals } from '@/types/performance';
import { RenderingStrategyType } from '@/types/strategy';

interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DashboardPage() {
  const [selectedStrategy, setSelectedStrategy] = useState<RenderingStrategyType | null>(null);
  
  // Fetch metrics for real-time indicator timestamp
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
      <div className="flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Dashboard</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
