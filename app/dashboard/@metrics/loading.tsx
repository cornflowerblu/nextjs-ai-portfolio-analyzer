/**
 * Metrics Loading State
 * Shows skeleton while metrics data is loading
 */

import { CardSkeleton } from '@/components/ui/skeleton';

export default function MetricsLoading() {
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
