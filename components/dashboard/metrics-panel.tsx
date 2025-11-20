/**
 * MetricsPanel Component
 * Displays all 5 Core Web Vitals for a rendering strategy
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CoreWebVitals } from '@/types/performance';
import { formatMetricValue } from '@/lib/utils/format';
import { getRatingColorClasses } from '@/lib/utils/colors';

interface MetricsPanelProps {
  metrics: CoreWebVitals;
  strategyName: string;
}

const METRIC_LABELS = {
  fcp: 'First Contentful Paint',
  lcp: 'Largest Contentful Paint',
  cls: 'Cumulative Layout Shift',
  inp: 'Interaction to Next Paint',
  ttfb: 'Time to First Byte',
} as const;

type MetricKey = 'fcp' | 'lcp' | 'cls' | 'inp' | 'ttfb';
const METRIC_ORDER: MetricKey[] = ['fcp', 'lcp', 'cls', 'inp', 'ttfb'];

export function MetricsPanel({ metrics, strategyName }: MetricsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{strategyName} Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {METRIC_ORDER.map((key) => {
            const metric = metrics[key];
            if (!metric) return null;

            const colorClasses = getRatingColorClasses(metric.rating);

            return (
              <div key={key} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">{METRIC_LABELS[key]}</div>
                  <div className="text-xs text-muted-foreground uppercase">{key}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold tabular-nums">
                    {formatMetricValue(key, metric.value)}
                  </span>
                  <Badge variant="outline" className={`${colorClasses.text} ${colorClasses.border}`}>
                    {metric.rating}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
