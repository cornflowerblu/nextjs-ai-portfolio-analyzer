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
    <>
      {/* Main page content: header, real-time indicator, strategy cards */}
      {children}

      {/* Parallel route sections - only render container if there's content */}
      {(metrics || comparison || insights) && (
        <div className="container mx-auto px-4 pb-8">
          <div className="space-y-8">
            {metrics}
            {comparison}
            {insights}
          </div>
        </div>
      )}
    </>
  );
}
