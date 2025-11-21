/**
 * MetricsDisplay Component
 * Shows real-time render metrics for lab demos
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RenderingStrategyType } from '@/types/strategy';
import { DemoMetrics } from './demo-container';

interface MetricsDisplayProps {
  metrics: DemoMetrics;
  strategy: RenderingStrategyType;
}

interface MetricItem {
  label: string;
  value: number | undefined;
  unit: string;
  threshold: { good: number; needs_improvement: number };
  description: string;
}

const METRIC_DEFINITIONS: Record<string, MetricItem['threshold']> = {
  fcp: { good: 1800, needs_improvement: 3000 },
  lcp: { good: 2500, needs_improvement: 4000 },
  cls: { good: 0.1, needs_improvement: 0.25 },
  inp: { good: 200, needs_improvement: 500 },
  ttfb: { good: 800, needs_improvement: 1800 },
};

function getMetricColor(value: number | undefined, threshold: MetricItem['threshold']): string {
  if (value === undefined) return 'text-muted-foreground';
  if (value <= threshold.good) return 'text-green-600 dark:text-green-400';
  if (value <= threshold.needs_improvement) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getMetricBadge(value: number | undefined, threshold: MetricItem['threshold']): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (value === undefined) return 'secondary';
  if (value <= threshold.good) return 'default';
  if (value <= threshold.needs_improvement) return 'secondary';
  return 'destructive';
}

export function MetricsDisplay({ metrics, strategy }: MetricsDisplayProps) {
  const metricsData: MetricItem[] = [
    {
      label: 'FCP',
      value: metrics.fcp,
      unit: 'ms',
      threshold: METRIC_DEFINITIONS.fcp,
      description: 'First Contentful Paint',
    },
    {
      label: 'LCP',
      value: metrics.lcp,
      unit: 'ms',
      threshold: METRIC_DEFINITIONS.lcp,
      description: 'Largest Contentful Paint',
    },
    {
      label: 'CLS',
      value: metrics.cls,
      unit: '',
      threshold: METRIC_DEFINITIONS.cls,
      description: 'Cumulative Layout Shift',
    },
    {
      label: 'INP',
      value: metrics.inp,
      unit: 'ms',
      threshold: METRIC_DEFINITIONS.inp,
      description: 'Interaction to Next Paint',
    },
    {
      label: 'TTFB',
      value: metrics.ttfb,
      unit: 'ms',
      threshold: METRIC_DEFINITIONS.ttfb,
      description: 'Time to First Byte',
    },
  ];

  const formatValue = (value: number | undefined, unit: string): string => {
    if (value === undefined) return 'N/A';
    return unit === '' ? value.toFixed(3) : `${Math.round(value)}${unit}`;
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>
          Real-time Core Web Vitals for {strategy} strategy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Render Time */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="text-sm font-medium">Render Time</p>
            <p className="text-xs text-muted-foreground">Server processing time</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{metrics.renderTime.toFixed(2)}ms</p>
          </div>
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-2">
          {metricsData.map((metric) => (
            <div
              key={metric.label}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{metric.label}</p>
                  <Badge variant={getMetricBadge(metric.value, metric.threshold)} className="text-xs">
                    {metric.value !== undefined && metric.value <= metric.threshold.good
                      ? 'Good'
                      : metric.value !== undefined && metric.value <= metric.threshold.needs_improvement
                      ? 'Needs Work'
                      : metric.value !== undefined
                      ? 'Poor'
                      : 'Pending'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getMetricColor(metric.value, metric.threshold)}`}>
                  {formatValue(metric.value, metric.unit)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Timestamp */}
        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          Last rendered: {formatTimestamp(metrics.timestamp)}
          {metrics.cacheAge !== undefined && (
            <span className="ml-2">
              (Cache age: {(metrics.cacheAge / 1000).toFixed(1)}s)
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
