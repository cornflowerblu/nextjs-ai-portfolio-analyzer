/**
 * Dashboard Layout
 * Composes parallel routes for metrics, comparison, and insights sections
 * Part of dashboard parallel routes refactor
 */

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

      {/* Metrics section - loading handled by slot's loading.tsx */}
      {metrics}

      {/* Comparison section - loading handled by slot's loading.tsx */}
      {comparison}

      {/* Insights section - loading handled by slot's loading.tsx */}
      {insights}
    </div>
  );
}
