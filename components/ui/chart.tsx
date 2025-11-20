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
 * 
 * NOTE: The type definition for CustomTooltip may be overly specific and might not align 
 * with Recharts' actual TooltipProps type. The manual intersection with specific payload 
 * types could cause type errors when Recharts' types evolve. This will be validated during 
 * functional testing to determine if a more generic payload type or exact Recharts types 
 * are needed.
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
 * Custom Legend component with fixed order
 */
function CustomLegend({ payload }: { payload?: Array<{ value: string; color: string }> }) {
  if (!payload) return null;
  
  // Force order: SSR, SSG, ISR, CACHE
  const orderedPayload = ['SSR', 'SSG', 'ISR', 'CACHE']
    .map(key => payload.find(item => item.value === key))
    .filter((item): item is { value: string; color: string } => item !== undefined);

  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      {orderedPayload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
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
        {showLegend && <Legend content={<CustomLegend />} />}
        {/* Render bars in explicit order: SSR, SSG, ISR, CACHE */}
        {['SSR', 'SSG', 'ISR', 'CACHE'].map((strategyKey) => {
          const config = dataKeys.find(dk => dk.key === strategyKey);
          if (!config) return null;
          return (
            <Bar
              key={config.key}
              dataKey={config.key}
              fill={config.color}
              name={config.name || config.key}
              radius={[4, 4, 0, 0]}
            />
          );
        })}
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
