/**
 * Metrics Parallel Route Slot
 * Displays Core Web Vitals panel for all rendering strategies
 */

export default function MetricsSlot() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Performance Metrics</h2>
      <p className="text-muted-foreground">
        Real-time Core Web Vitals across rendering strategies
      </p>
    </div>
  );
}
