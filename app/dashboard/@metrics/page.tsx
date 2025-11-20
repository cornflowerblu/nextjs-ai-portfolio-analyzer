/**
 * Metrics Parallel Route Slot
 * Displays Core Web Vitals panels for all rendering strategies
 * Part of dashboard parallel routes refactor
 */

'use client';

import useSWR from 'swr';
import { MetricsPanel } from '@/components/dashboard/metrics-panel';
import { RENDERING_STRATEGIES } from '@/types/strategy';
import type { StrategyMetrics } from '@/types/metrics';
import { fetcher } from '@/lib/fetcher';

const METRICS_SWR_CONFIG = {
  refreshInterval: 1000,
  revalidateOnFocus: true,
};

export default function MetricsSlot() {
  const { data, error } = useSWR<StrategyMetrics[]>('/api/metrics', fetcher, METRICS_SWR_CONFIG);

  if (error) throw error; // Caught by error.tsx
  if (!data) return null; // Show loading.tsx

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Core Web Vitals</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((strategyData) => (
          <MetricsPanel
            key={strategyData.strategy}
            metrics={strategyData.metrics}
            strategyName={RENDERING_STRATEGIES[strategyData.strategy].displayName}
          />
        ))}
      </div>
    </section>
  );
}
