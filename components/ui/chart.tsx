/**
 * Chart component wrapper using Recharts
 * Provides consistent chart configuration and responsive behavior
 */

'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts';
import { Card } from '@/components/ui/card';

/**
 * Base chart props
 */
export interface BaseChartProps {
  data: Array<Record<string, unknown>>;
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

/**
 * Custom tooltip wrapper
 */
function CustomTooltip({ active, payload, label }: TooltipProps<number, string> & { 
  payload?: Array<{ color?: string; name?: string; value?: number }>; 
  label?: string; 
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <Card className="p-3 border shadow-lg">
      <p className="font-medium text-sm mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: { color?: string; name?: string; value?: number }, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Bar Chart component
 */
export interface BarChartProps extends BaseChartProps {
  dataKeys: Array<{ key: string; color: string; name?: string }>;
  xAxisKey: string;
}

export function BarChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        {dataKeys.map((config) => (
          <Bar
            key={config.key}
            dataKey={config.key}
            fill={config.color}
            name={config.name || config.key}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}

/**
 * Line Chart component
 */
export interface LineChartProps extends BaseChartProps {
  dataKeys: Array<{ key: string; color: string; name?: string }>;
  xAxisKey: string;
}

export function LineChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        {dataKeys.map((config) => (
          <Line
            key={config.key}
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            name={config.name || config.key}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

/**
 * Area Chart component
 */
export interface AreaChartProps extends BaseChartProps {
  dataKeys: Array<{ key: string; color: string; name?: string }>;
  xAxisKey: string;
}

export function AreaChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} className={className}>
      <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xAxisKey}
          className="text-xs"
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis className="text-xs" stroke="hsl(var(--muted-foreground))" />
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        {showLegend && <Legend />}
        {dataKeys.map((config) => (
          <Area
            key={config.key}
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            fill={config.color}
            fillOpacity={0.3}
            name={config.name || config.key}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Export all chart types
 */
export { ResponsiveContainer };
