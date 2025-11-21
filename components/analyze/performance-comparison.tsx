'use client';

/**
 * Performance Comparison Component
 * Shows before/after metrics comparison
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMetricDisplay } from '@/lib/lighthouse/parser';
import type { LighthouseMetrics, RenderingStrategy, CoreWebVitalsMetrics } from '@/types/lighthouse';

interface PerformanceComparisonProps {
  currentMetrics: LighthouseMetrics;
  bestStrategy: RenderingStrategy;
}

interface MetricComparison {
  name: string;
  key: keyof CoreWebVitalsMetrics;
  current: number;
  projected: number;
  improvement: number;
}

function calculateImprovement(current: number, projected: number): number {
  if (current === 0) return 0;
  return ((current - projected) / current) * 100;
}

export function PerformanceComparison({ currentMetrics, bestStrategy }: PerformanceComparisonProps) {
  const comparisons: MetricComparison[] = Object.entries(bestStrategy.estimatedMetrics)
    .filter(([, value]) => value !== undefined)
    .map(([key, projected]) => {
      const metricKey = key as keyof CoreWebVitalsMetrics;
      const current = currentMetrics[metricKey] || 0;
      const projectedValue = projected || 0;
      const improvement = calculateImprovement(current, projectedValue);

      return {
        name: metricKey,
        key: metricKey,
        current,
        projected: projectedValue,
        improvement,
      };
    })
    .filter((comp) => comp.current > 0);

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Comparison</CardTitle>
        <p className="text-sm text-gray-600">
          Comparing current performance with estimated {bestStrategy.name} performance
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comparisons.map((comp) => (
            <div key={comp.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{comp.name}</span>
                {comp.improvement > 0 && (
                  <span className="text-xs text-green-600 font-medium">
                    ↓ {Math.round(comp.improvement)}% improvement
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {/* Current */}
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">Current</p>
                  <div className="bg-red-50 border-2 border-red-200 rounded px-3 py-2">
                    <p className="text-lg font-bold text-red-700">
                      {formatMetricDisplay(comp.key, comp.current).value}
                      <span className="text-sm font-normal ml-1">
                        {formatMetricDisplay(comp.key, comp.current).unit}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-shrink-0 text-2xl text-green-600" aria-hidden="true">
                  →
                </div>

                {/* Projected */}
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">With {bestStrategy.id.toUpperCase()}</p>
                  <div className="bg-green-50 border-2 border-green-200 rounded px-3 py-2">
                    <p className="text-lg font-bold text-green-700">
                      {formatMetricDisplay(comp.key, comp.projected).value}
                      <span className="text-sm font-normal ml-1">
                        {formatMetricDisplay(comp.key, comp.projected).unit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">💡 Note:</span> These are estimated improvements based on typical
            performance characteristics of {bestStrategy.name}. Actual results may vary depending on your
            specific implementation and content.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
