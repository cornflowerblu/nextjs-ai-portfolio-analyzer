'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import type { RenderingStrategyType } from '@/types/strategy';
import { formatMetric } from '@/lib/utils/format';

export interface TrendDataPoint {
  timestamp: number;
  date: string; // Human-readable date
  value: number;
  strategy: RenderingStrategyType;
  label?: string; // For annotations
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  metric: 'fcp' | 'lcp' | 'cls' | 'inp' | 'ttfb';
  metricLabel: string;
  strategies: RenderingStrategyType[];
  height?: number;
  showAnnotations?: boolean;
  annotations?: Array<{
    timestamp: number;
    label: string;
    type: 'improvement' | 'regression' | 'info';
  }>;
}

const STRATEGY_COLORS: Record<RenderingStrategyType, string> = {
  SSR: '#3b82f6', // blue
  SSG: '#10b981', // green
  ISR: '#f59e0b', // amber
  CACHE: '#8b5cf6', // purple
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium">{entry.name}:</span>
          <span className="text-gray-600 dark:text-gray-400">
            {formatMetric(entry.value as number, entry.dataKey as string)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function TrendChart({
  data,
  metric,
  metricLabel,
  strategies,
  height = 400,
  showAnnotations = true,
  annotations = [],
}: TrendChartProps) {
  // Group data by timestamp for proper chart rendering
  const chartData = React.useMemo(() => {
    const grouped = new Map<number, any>();

    data.forEach((point) => {
      if (!grouped.has(point.timestamp)) {
        grouped.set(point.timestamp, {
          timestamp: point.timestamp,
          date: point.date,
        });
      }
      const entry = grouped.get(point.timestamp);
      entry[point.strategy] = point.value;
    });

    return Array.from(grouped.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [data]);

  // Find annotation points
  const annotationPoints = React.useMemo(() => {
    if (!showAnnotations || annotations.length === 0) return [];

    return annotations.map((annotation) => {
      const dataPoint = chartData.find(
        (d) => Math.abs(d.timestamp - annotation.timestamp) < 60000 // Within 1 minute
      );
      if (!dataPoint) return null;
      return {
        ...annotation,
        x: dataPoint.timestamp,
        y: Math.max(...strategies.map((s) => dataPoint[s] || 0)),
      };
    }).filter(Boolean);
  }, [annotations, chartData, strategies, showAnnotations]);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatYAxis = (value: number) => {
    if (metric === 'cls') {
      return value.toFixed(3);
    }
    return `${value.toFixed(0)}ms`;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            className="text-xs"
          />
          <YAxis
            tickFormatter={formatYAxis}
            className="text-xs"
            label={{
              value: metricLabel,
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {strategies.map((strategy) => (
            <Line
              key={strategy}
              type="monotone"
              dataKey={strategy}
              stroke={STRATEGY_COLORS[strategy]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={strategy}
              connectNulls
            />
          ))}
          {/* Add annotations as reference lines or dots */}
          {annotationPoints.map((annotation, index) => (
            <React.Fragment key={`annotation-${index}`}>
              {/* This would need a custom implementation with ReferenceArea or custom shapes */}
            </React.Fragment>
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Annotations legend below chart */}
      {showAnnotations && annotations.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Significant Changes:</h4>
          <div className="space-y-1">
            {annotations.map((annotation, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    annotation.type === 'improvement'
                      ? 'bg-green-500'
                      : annotation.type === 'regression'
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(annotation.timestamp).toLocaleDateString()} -{' '}
                  {annotation.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
