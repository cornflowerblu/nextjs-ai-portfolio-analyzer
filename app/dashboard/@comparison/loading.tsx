/**
 * Comparison Loading State
 * Shows skeleton while comparison data is loading
 */

import { ChartSkeleton } from '@/components/ui/skeleton';

export default function ComparisonLoading() {
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
