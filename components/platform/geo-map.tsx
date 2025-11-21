'use client';

/**
 * GeoMap component - visualizes response times by region
 * Shows geographic latency distribution
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Globe } from 'lucide-react';

interface RegionInfo {
  code: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

interface RegionLatency {
  region: RegionInfo;
  latency: number;
  status: 'success' | 'error' | 'timeout';
  timestamp: string;
}

interface GeoLatencyData {
  regions: RegionLatency[];
  source: 'real' | 'mock';
  error?: string;
}

export function GeoMap() {
  const [data, setData] = useState<GeoLatencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatency = async (useMock: boolean = true) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/platform/geo-latency?mock=${useMock}`);
      if (!response.ok) {
        throw new Error('Failed to fetch geo latency data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load geo latency');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatency(true);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geographic Latency</CardTitle>
          <CardDescription>Loading region data...</CardDescription>
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
          <CardTitle>Geographic Latency</CardTitle>
          <CardDescription>Error loading region data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
          <Button onClick={() => fetchLatency(true)} className="mt-4">
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
    if (latency < 50) return 'bg-green-500';
    if (latency < 100) return 'bg-yellow-500';
    if (latency < 200) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getLatencyBadgeVariant = (latency: number): "default" | "secondary" | "destructive" | "outline" => {
    if (latency < 50) return 'default';
    if (latency < 100) return 'secondary';
    return 'destructive';
  };

  // Sort by latency for better visualization
  const sortedRegions = [...data.regions].sort((a, b) => a.latency - b.latency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Geographic Latency Testing
        </CardTitle>
        <CardDescription>
          Response times from multiple Vercel regions
          <Badge variant="outline" className="ml-2">
            {data.source === 'real' ? 'Live' : 'Demo'}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Region List */}
          <div className="space-y-3">
            {sortedRegions.map((region) => (
              <div
                key={region.region.code}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <MapPin className={`h-5 w-5 ${region.status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{region.region.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {region.region.code}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{region.region.location}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {region.status === 'success' ? (
                    <>
                      <p className="text-lg font-bold">{region.latency.toFixed(0)}ms</p>
                      <Badge variant={getLatencyBadgeVariant(region.latency)} className="mt-1">
                        {region.latency < 50 ? 'Fast' : region.latency < 100 ? 'Good' : 'Slow'}
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="destructive">
                      {region.status === 'timeout' ? 'Timeout' : 'Error'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Latency Bar Chart */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Latency Comparison</h3>
            <div className="space-y-2">
              {sortedRegions
                .filter((r) => r.status === 'success')
                .map((region) => {
                  const maxLatency = Math.max(...sortedRegions.filter(r => r.status === 'success').map((r) => r.latency));
                  const percentage = (region.latency / maxLatency) * 100;

                  return (
                    <div key={region.region.code} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{region.region.code}</span>
                        <span className="font-medium">{region.latency.toFixed(0)}ms</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getLatencyColor(region.latency)} transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Info Message */}
          {data.source === 'mock' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <p>
                <strong>Demo Mode:</strong> Showing simulated latency data. Deploy to Vercel to see real multi-region measurements.
              </p>
            </div>
          )}

          {/* Refresh Button */}
          <Button onClick={() => fetchLatency(data.source === 'mock')} className="w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Measurements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
