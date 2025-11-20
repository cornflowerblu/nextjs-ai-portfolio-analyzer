/**
 * ComparisonChart Component
 * Side-by-side bar chart comparing rendering strategies
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/ui/chart';
import { CoreWebVitals } from '@/types/performance';
import { RenderingStrategyType } from '@/types/strategy';
import { getStrategyColor } from '@/lib/utils/colors';

interface ComparisonChartProps {
  data: Array<{
    strategy: RenderingStrategyType;
    metrics: CoreWebVitals;
  }>;
  metricKey: keyof CoreWebVitals;
  title: string;
  description?: string;
}

export function ComparisonChart({ 
  data, 
  metricKey, 
  title, 
  description 
}: ComparisonChartProps) {
  // Define the desired order
  const strategyOrder: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
  
  // Sort data to match the desired order
  const sortedData = [...data].sort((a, b) => {
    return strategyOrder.indexOf(a.strategy) - strategyOrder.indexOf(b.strategy);
  });
  
  // Transform data to have each strategy as its own dataKey for colored bars
  // Build object in specific order to ensure consistent legend order
  const chartDataObj: Record<string, string | number> = { name: 'Value' };
  sortedData.forEach((item) => {
    const metricValue = item.metrics[metricKey];
    const value = typeof metricValue === 'object' && metricValue !== null && 'value' in metricValue 
      ? metricValue.value 
      : 0;
    chartDataObj[item.strategy] = value;
  });
  const chartData = [chartDataObj];

  // Create dataKeys array with each strategy having its own color
  const colorMap: Record<RenderingStrategyType, string> = {
    SSR: 'hsl(217, 91%, 60%)', // blue
    SSG: 'hsl(142, 71%, 45%)', // green
    ISR: 'hsl(38, 92%, 50%)',  // yellow/orange
    CACHE: 'hsl(271, 91%, 65%)', // purple
  };
  
  // Use sorted data for consistent order
  const dataKeys = sortedData.map((item) => ({
    key: item.strategy,
    color: colorMap[item.strategy],
    name: item.strategy,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          dataKeys={dataKeys}
          xAxisKey="name"
          height={300}
          showLegend={true}
        />
      </CardContent>
    </Card>
  );
}
