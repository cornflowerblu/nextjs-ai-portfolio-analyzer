/**
 * Dashboard Layout
 * Composes parallel routes for metrics, comparison, and insights sections
 * Part of dashboard parallel routes refactor
 */

import { Suspense } from 'react';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';

// Loading skeleton for metrics section
function MetricsSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// Loading skeleton for comparison section
function ComparisonSkeleton() {
  return (
    <section>
      <div className="h-8 w-64 bg-muted animate-pulse rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <ChartSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

// Loading skeleton for insights section
function InsightsSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="h-32 bg-muted animate-pulse rounded" />
    </section>
  );
}

export default function DashboardLayout({
  children,
  metrics,
  comparison,
  insights,
}: {
  children: React.ReactNode;
  metrics: React.ReactNode;
  comparison: React.ReactNode;
  insights: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-8 space-y-8">
      {/* Main page content: header, real-time indicator, strategy cards */}
      {children}

      {/* Metrics section with independent loading */}
      <Suspense fallback={<MetricsSkeleton />}>
        {metrics}
      </Suspense>

      {/* Comparison section with independent loading */}
      <Suspense fallback={<ComparisonSkeleton />}>
        {comparison}
      </Suspense>

      {/* Insights section with independent loading */}
      <Suspense fallback={<InsightsSkeleton />}>
        {insights}
      </Suspense>
    </div>
  );
}
