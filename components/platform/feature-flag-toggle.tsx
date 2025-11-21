'use client';

/**
 * FeatureFlagToggle component - displays and toggles feature flags
 * from Edge Config with real-time updates
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, Flag, Clock } from 'lucide-react';

interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  updatedAt?: string;
}

interface EdgeConfigData {
  flags: FeatureFlag[];
  latency: number;
  cached: boolean;
  source: 'edge-config' | 'mock';
}

export function FeatureFlagToggle() {
  const [data, setData] = useState<EdgeConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/platform/edge-config');
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleToggle = (flagName: string) => {
    // In a real implementation, this would update Edge Config
    // For now, we'll just show a message that it's read-only
    alert(`Feature flag toggle would update Edge Config via API. Flag: ${flagName}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edge Config Feature Flags</CardTitle>
          <CardDescription>Loading feature flags...</CardDescription>
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
          <CardTitle>Edge Config Feature Flags</CardTitle>
          <CardDescription>Error loading feature flags</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
          <Button onClick={fetchFlags} className="mt-4">
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5" />
          Edge Config Feature Flags
        </CardTitle>
        <CardDescription>
          Real-time configuration with {data.latency.toFixed(2)}ms latency
          <Badge variant="outline" className="ml-2">
            {data.source === 'edge-config' ? 'Live' : 'Demo'}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Latency Info */}
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Read Latency</p>
              <p className="text-xs text-muted-foreground">
                Edge Config is globally distributed
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-green-600">
                {data.latency.toFixed(2)}ms
              </p>
            </div>
          </div>

          {/* Feature Flags */}
          <div className="space-y-4">
            {data.flags.map((flag) => (
              <div
                key={flag.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{flag.name}</h3>
                    <Badge variant={flag.enabled ? 'default' : 'secondary'}>
                      {flag.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  )}
                  {flag.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(flag.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => handleToggle(flag.name)}
                  disabled={data.source === 'mock'}
                />
              </div>
            ))}
          </div>

          {/* Info Message */}
          {data.source === 'mock' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              <p>
                <strong>Demo Mode:</strong> Edge Config is not configured. Showing mock data.
                Configure EDGE_CONFIG environment variable to use real feature flags.
              </p>
            </div>
          )}

          {/* Refresh Button */}
          <Button onClick={fetchFlags} className="w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Flags
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
