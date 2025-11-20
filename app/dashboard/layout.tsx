/**
 * Dashboard Layout
 * Composes parallel route slots for independent section loading
 * Demonstrates Next.js 16 parallel routes architecture
 */

import { Suspense } from 'react';
import { CardSkeleton, ChartSkeleton } from '@/components/ui/skeleton';

// Loading skeletons for Suspense fallbacks
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

function InsightsSkeleton() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="h-48 bg-muted animate-pulse rounded" />
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
      {/* Main page content: header, strategy cards, real-time indicator */}
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
