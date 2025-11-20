/**
 * Insights Loading State
 * Shows skeleton while insights are loading
 */

export default function InsightsLoading() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="h-48 bg-muted animate-pulse rounded" />
    </section>
  );
}
