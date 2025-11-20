/**
 * Comparison Parallel Route Slot
 * Displays performance comparison charts for all rendering strategies
 * Part of dashboard parallel routes refactor
 */

'use client';

import useSWR from 'swr';
import { ComparisonChart } from '@/components/dashboard/comparison-chart';
import type { CoreWebVitals } from '@/types/performance';
import type { RenderingStrategyType } from '@/types/strategy';

interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const METRICS_SWR_CONFIG = {
  refreshInterval: 1000,
  revalidateOnFocus: true,
};

export default function ComparisonSlot() {
  const { data, error } = useSWR<StrategyMetrics[]>('/api/metrics', fetcher, METRICS_SWR_CONFIG);

  if (error) throw error; // Caught by error.tsx
  if (!data) return null; // Show loading.tsx

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Performance Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ComparisonChart
          data={data}
          metricKey="fcp"
          title="First Contentful Paint (FCP)"
          description="Time to first DOM content render"
        />
        <ComparisonChart
          data={data}
          metricKey="lcp"
          title="Largest Contentful Paint (LCP)"
          description="Time to largest content element"
        />
        <ComparisonChart
          data={data}
          metricKey="cls"
          title="Cumulative Layout Shift (CLS)"
          description="Visual stability score"
        />
        <ComparisonChart
          data={data}
          metricKey="inp"
          title="Interaction to Next Paint (INP)"
          description="Responsiveness to user interactions"
        />
      </div>
    </section>
  );
}
