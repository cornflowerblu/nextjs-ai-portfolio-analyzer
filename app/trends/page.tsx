'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendChart, type TrendDataPoint } from '@/components/trends/trend-chart';
import { RegressionIndicator, type Regression } from '@/components/trends/regression-indicator';
import { ProjectSelector, type Project } from '@/components/trends/project-selector';
import type { RenderingStrategyType } from '@/types/strategy';
import type { HistoricalDataPoint, AggregatedMetrics } from '@/lib/storage/historical';

type DateRange = '7d' | '30d' | '90d';
type Granularity = 'hour' | 'day' | 'week' | 'month';

const DATE_RANGES: Array<{ value: DateRange; label: string }> = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
];

const METRICS = [
  { key: 'fcp', label: 'First Contentful Paint', unit: 'ms' },
  { key: 'lcp', label: 'Largest Contentful Paint', unit: 'ms' },
  { key: 'cls', label: 'Cumulative Layout Shift', unit: 'score' },
  { key: 'inp', label: 'Interaction to Next Paint', unit: 'ms' },
  { key: 'ttfb', label: 'Time to First Byte', unit: 'ms' },
] as const;

const STRATEGIES: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];

function getDateRangeDates(range: DateRange): { start: Date; end: Date; granularity: Granularity } {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '7d':
      start.setDate(start.getDate() - 7);
      return { start, end, granularity: 'hour' };
    case '30d':
      start.setDate(start.getDate() - 30);
      return { start, end, granularity: 'day' };
    case '90d':
      start.setDate(start.getDate() - 90);
      return { start, end, granularity: 'week' };
  }
}

export default function TrendsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('default');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<Map<string, TrendDataPoint[]>>(new Map());
  const [regressions, setRegressions] = useState<Regression[]>([]);
  const [annotations, setAnnotations] = useState<Array<{
    timestamp: number;
    label: string;
    type: 'improvement' | 'regression' | 'info';
  }>>([]);

  // Mock projects for now - in a real app, this would come from an API
  const [projects] = useState<Project[]>([
    {
      id: 'default',
      name: 'Default Project',
      description: 'Primary performance tracking',
      createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
      lastUpdated: Date.now(),
      metricsCount: 0,
    },
  ]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const { start, end, granularity } = getDateRangeDates(dateRange);
      
      // Fetch data for all strategies in parallel
      const promises = STRATEGIES.map(async (strategy) => {
        const params = new URLSearchParams({
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          strategy,
          projectId: selectedProject,
          granularity,
          detectRegressions: 'true',
        });

        const response = await fetch(`/api/historical?${params}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${strategy}`);
        }

        return { strategy, data: await response.json() };
      });

      const results = await Promise.all(promises);

      // Process and transform data for charts
      const dataMap = new Map<string, TrendDataPoint[]>();
      const allRegressions: Regression[] = [];

      for (const { strategy, data } of results) {
        if (data.success && data.data) {
          // Transform data for each metric
          for (const metric of METRICS) {
            const key = `${strategy}-${metric.key}`;
            const points: TrendDataPoint[] = [];

            if (granularity === 'hour' || granularity === 'day' || granularity === 'week' || granularity === 'month') {
              // Aggregated data
              data.data.forEach((agg: AggregatedMetrics) => {
                points.push({
                  timestamp: agg.timestamp,
                  date: new Date(agg.timestamp).toLocaleDateString(),
                  value: agg.metrics[metric.key]?.avg || 0,
                  strategy,
                });
              });
            } else {
              // Raw data
              data.data.forEach((point: HistoricalDataPoint) => {
                points.push({
                  timestamp: point.timestamp,
                  date: new Date(point.timestamp).toLocaleDateString(),
                  value: point.metrics[metric.key]?.value || 0,
                  strategy,
                });
              });
            }

            if (!dataMap.has(metric.key)) {
              dataMap.set(metric.key, []);
            }
            dataMap.get(metric.key)!.push(...points);
          }

          // Collect regressions
          if (data.regressions && data.regressions.length > 0) {
            allRegressions.push(
              ...data.regressions.map((r: any) => ({
                ...r,
                strategy,
              }))
            );
          }
        }
      }

      setHistoricalData(dataMap);
      setRegressions(allRegressions);

      // Generate annotations from regressions
      const newAnnotations = allRegressions
        .filter((r) => r.change > 0.3) // Only significant regressions
        .map((r) => ({
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // Approximate
          label: `${r.strategy} ${r.metric.toUpperCase()} regression: +${(r.change * 100).toFixed(0)}%`,
          type: 'regression' as const,
        }));

      setAnnotations(newAnnotations);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, [selectedProject, dateRange]);

  const handleExport = () => {
    // Export data as CSV
    const csv: string[] = ['Timestamp,Strategy,Metric,Value'];
    
    historicalData.forEach((points, metric) => {
      points.forEach((point) => {
        csv.push(`${point.timestamp},${point.strategy},${metric},${point.value}`);
      });
    });

    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-trends-${selectedProject}-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Performance Trends
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Historical Core Web Vitals data showing performance evolution over time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={fetchHistoricalData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProject}
            onProjectSelect={setSelectedProject}
          />

          <div className="flex items-center gap-2">
            <Badge variant="outline">Showing {STRATEGIES.length} strategies</Badge>
            <Badge variant="outline">
              {(() => {
                const { start, end } = getDateRangeDates(dateRange);
                return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
              })()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Regressions Alert */}
      {regressions.length > 0 && (
        <RegressionIndicator regressions={regressions} />
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">Loading trend data...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Charts */}
      {!loading && (
        <div className="space-y-6">
          {METRICS.map((metric) => {
            const data = historicalData.get(metric.key) || [];
            
            return (
              <Card key={metric.key}>
                <CardHeader>
                  <CardTitle>{metric.label}</CardTitle>
                  <CardDescription>
                    Time-series visualization of {metric.label.toLowerCase()} across all rendering strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.length > 0 ? (
                    <TrendChart
                      data={data}
                      metric={metric.key as any}
                      metricLabel={`${metric.label} (${metric.unit})`}
                      strategies={STRATEGIES}
                      height={350}
                      showAnnotations={true}
                      annotations={annotations.filter((a) => 
                        a.label.toLowerCase().includes(metric.key)
                      )}
                    />
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      No historical data available for this metric.
                      <br />
                      <span className="text-sm">
                        Data will appear here as metrics are captured over time.
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && historicalData.size === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold mb-2">No Historical Data</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No performance metrics have been captured yet for the selected time range.
                </p>
                <p className="text-sm text-gray-500">
                  Visit the <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a> or{' '}
                  <a href="/lab" className="text-blue-600 hover:underline">Lab</a> to start capturing metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
