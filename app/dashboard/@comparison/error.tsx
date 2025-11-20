/**
 * Comparison Error Boundary
 * Displays error message when comparison charts fail to load
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ComparisonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Performance Comparison</h2>
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600">Failed to Load Comparison Charts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={reset} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
