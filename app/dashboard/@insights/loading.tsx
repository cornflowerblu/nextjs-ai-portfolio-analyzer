/**
 * Insights Loading State
 * Displays skeleton while insights section is being loaded
 */

export default function InsightsLoading() {
  return (
    <section>
      <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
      <div className="h-32 bg-muted animate-pulse rounded" />
    </section>
  );
}
