'use client';

/**
 * KvLatencyDisplay component - shows read/write timing for KV operations
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

interface KvLatencyData {
  write?: {
    avg?: number;
    min?: number;
    max?: number;
    latency?: number;
    latencies?: number[];
    success?: boolean;
  };
  read?: {
    avg?: number;
    min?: number;
    max?: number;
    latency?: number;
    latencies?: number[];
    data?: unknown;
  };
}

export function KvLatencyDisplay() {
  const [data, setData] = useState<KvLatencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<'read' | 'write' | 'benchmark'>('benchmark');

  const fetchLatency = async (op: 'read' | 'write' | 'benchmark') => {
    setLoading(true);
    setError(null);
    setOperation(op);

    try {
      const response = await fetch(`/api/platform/kv-cache?operation=${op}`);
      if (!response.ok) {
        throw new Error('Failed to fetch KV latency data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KV latency');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatency('benchmark');
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KV Cache Latency</CardTitle>
          <CardDescription>Loading KV operation timing...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
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
          <CardTitle>KV Cache Latency</CardTitle>
          <CardDescription>Error loading latency data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
          <Button onClick={() => fetchLatency(operation)} className="mt-4">
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

  const getLatencyColor = (latency: number) => {
    if (latency < 5) return 'text-green-600';
    if (latency < 10) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          KV Cache Latency
        </CardTitle>
        <CardDescription>
          Real millisecond measurements from Vercel KV (Redis)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Write Latency */}
          {data.write && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-semibold">Write Operations</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {data.write.avg !== undefined ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Average</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.write.avg)}`}>
                        {data.write.avg.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.write.min!)}`}>
                        {data.write.min!.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.write.max!)}`}>
                        {data.write.max!.toFixed(2)}ms
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 col-span-3">
                    <p className={`text-2xl font-bold ${getLatencyColor(data.write.latency!)}`}>
                      {data.write.latency!.toFixed(2)}ms
                    </p>
                    <Badge variant={data.write.success ? 'default' : 'destructive'}>
                      {data.write.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Read Latency */}
          {data.read && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-semibold">Read Operations</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {data.read.avg !== undefined ? (
                  <>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Average</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.read.avg)}`}>
                        {data.read.avg.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Min</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.read.min!)}`}>
                        {data.read.min!.toFixed(2)}ms
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Max</p>
                      <p className={`text-xl font-bold ${getLatencyColor(data.read.max!)}`}>
                        {data.read.max!.toFixed(2)}ms
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1 col-span-3">
                    <p className={`text-2xl font-bold ${getLatencyColor(data.read.latency!)}`}>
                      {data.read.latency!.toFixed(2)}ms
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => fetchLatency('read')} variant="outline" size="sm">
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Test Read
            </Button>
            <Button onClick={() => fetchLatency('write')} variant="outline" size="sm">
              <ArrowUpFromLine className="mr-2 h-4 w-4" />
              Test Write
            </Button>
            <Button onClick={() => fetchLatency('benchmark')} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Benchmark
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
