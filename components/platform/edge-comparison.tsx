'use client';

/**
 * EdgeComparison component - displays execution time comparison
 * between Edge Functions and Serverless Functions
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';

interface FunctionResult {
  executionTime: number;
  totalTime: number;
  type: string;
  coldStart?: boolean;
  timestamp: string;
}

interface ComparisonData {
  edge: {
    avg: number;
    min: number;
    max: number;
    results: FunctionResult[];
  };
  serverless: {
    avg: number;
    min: number;
    max: number;
    results: FunctionResult[];
  };
  speedup: number;
}

export function EdgeComparison() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/platform/edge-vs-serverless?iterations=5');
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      const result = await response.json();
      
      // Validate the response structure
      if (!result.edge || !result.serverless) {
        throw new Error('Invalid response structure');
      }
      
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge vs Serverless Comparison</CardTitle>
          <CardDescription>Loading performance comparison...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge vs Serverless Comparison</CardTitle>
          <CardDescription>Error loading comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
          <Button onClick={fetchComparison} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  // Helper function to safely format numbers
  const safeToFixed = (value: number | null | undefined, decimals: number = 2): string => {
    if (value == null || isNaN(value)) {
      return '0.' + '0'.repeat(decimals);
    }
    return value.toFixed(decimals);
  };

  const chartData = [
    {
      metric: 'Average',
      Edge: safeToFixed(data.edge.avg),
      Serverless: safeToFixed(data.serverless.avg),
    },
    {
      metric: 'Min',
      Edge: safeToFixed(data.edge.min),
      Serverless: safeToFixed(data.serverless.min),
    },
    {
      metric: 'Max',
      Edge: safeToFixed(data.edge.max),
      Serverless: safeToFixed(data.serverless.max),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edge vs Serverless Comparison</CardTitle>
        <CardDescription>
          Real execution time measurements over 5 iterations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Edge Average</p>
              <p className="text-2xl font-bold text-green-600">
                {safeToFixed(data.edge.avg)}ms
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Serverless Average</p>
              <p className="text-2xl font-bold text-orange-600">
                {safeToFixed(data.serverless.avg)}ms
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Speedup</p>
              <p className="text-2xl font-bold text-blue-600">
                {safeToFixed(data.speedup)}x
              </p>
            </div>
          </div>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Edge" fill="#10b981" />
              <Bar dataKey="Serverless" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>

          {/* Refresh Button */}
          <Button onClick={fetchComparison} className="w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Run New Comparison
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
