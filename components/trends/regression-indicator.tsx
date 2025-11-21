'use client';

import React from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RenderingStrategyType } from '@/types/strategy';

export interface Regression {
  metric: string;
  current: number;
  baseline: number;
  change: number; // Percentage change
  strategy: RenderingStrategyType;
}

export interface RegressionIndicatorProps {
  regressions: Regression[];
  threshold?: number;
  className?: string;
}

const METRIC_LABELS: Record<string, string> = {
  fcp: 'First Contentful Paint',
  lcp: 'Largest Contentful Paint',
  cls: 'Cumulative Layout Shift',
  inp: 'Interaction to Next Paint',
  ttfb: 'Time to First Byte',
};

function formatMetricValue(value: number, metric: string): string {
  if (metric === 'cls') {
    return value.toFixed(3);
  }
  return `${value.toFixed(0)}ms`;
}

function getSeverityColor(change: number): string {
  if (change >= 0.5) return 'destructive'; // 50%+ regression
  if (change >= 0.3) return 'default'; // 30-50% regression
  return 'secondary'; // 20-30% regression
}

function getSeverityIcon(change: number) {
  if (change >= 0.5) return AlertTriangle;
  if (change >= 0.3) return TrendingDown;
  return Info;
}

export function RegressionIndicator({
  regressions,
  threshold = 0.2,
  className = '',
}: RegressionIndicatorProps) {
  if (regressions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>No Performance Regressions</CardTitle>
          </div>
          <CardDescription>
            All metrics are stable or improving compared to baseline
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group regressions by strategy
  const byStrategy = regressions.reduce((acc, reg) => {
    if (!acc[reg.strategy]) {
      acc[reg.strategy] = [];
    }
    acc[reg.strategy].push(reg);
    return acc;
  }, {} as Record<RenderingStrategyType, Regression[]>);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <CardTitle>Performance Regressions Detected</CardTitle>
        </div>
        <CardDescription>
          {regressions.length} metric{regressions.length === 1 ? '' : 's'} showing
          degradation above {(threshold * 100).toFixed(0)}% threshold
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(byStrategy).map(([strategy, regs]) => (
          <div key={strategy} className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Badge variant="outline">{strategy}</Badge>
              <span className="text-gray-500">
                {regs.length} issue{regs.length === 1 ? '' : 's'}
              </span>
            </h4>
            <div className="space-y-2 pl-4">
              {regs.map((reg, index) => {
                const Icon = getSeverityIcon(reg.change);
                const severity = getSeverityColor(reg.change);

                return (
                  <div
                    key={`${strategy}-${reg.metric}-${index}`}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {METRIC_LABELS[reg.metric] || reg.metric.toUpperCase()}
                        </span>
                        <Badge variant={['destructive', 'default', 'secondary', 'outline'].includes(severity) ? severity as 'destructive' | 'default' | 'secondary' | 'outline' : 'default'}>
                          +{(reg.change * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-2">
                          <span>Baseline: {formatMetricValue(reg.baseline, reg.metric)}</span>
                          <TrendingDown className="h-3 w-3" />
                          <span>Current: {formatMetricValue(reg.current, reg.metric)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Recommendation:</strong> Review recent changes and consider rolling
            back or optimizing affected strategies. Check for:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside mt-2 space-y-1">
            <li>Large bundle size increases</li>
            <li>Slow server-side data fetches</li>
            <li>Unoptimized images or assets</li>
            <li>Third-party script additions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
