/**
 * CacheStatus Component
 * Visual indicator for cache hit/miss status with feedback
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';

interface CacheStatusProps {
  status: 'hit' | 'miss' | 'stale' | 'revalidating';
  age?: number;
  maxAge?: number;
}

const STATUS_CONFIG = {
  hit: {
    icon: CheckCircle2,
    label: 'Cache Hit',
    variant: 'default' as const,
    color: 'text-green-600 dark:text-green-400',
    description: 'Served from cache',
  },
  miss: {
    icon: XCircle,
    label: 'Cache Miss',
    variant: 'secondary' as const,
    color: 'text-yellow-600 dark:text-yellow-400',
    description: 'Freshly generated',
  },
  stale: {
    icon: Clock,
    label: 'Stale',
    variant: 'secondary' as const,
    color: 'text-orange-600 dark:text-orange-400',
    description: 'Revalidation needed',
  },
  revalidating: {
    icon: RefreshCw,
    label: 'Revalidating',
    variant: 'secondary' as const,
    color: 'text-blue-600 dark:text-blue-400',
    description: 'Updating cache',
  },
};

export function CacheStatus({ status, age, maxAge }: CacheStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const formatAge = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const getCachePercentage = (): number | null => {
    if (age === undefined || maxAge === undefined || maxAge === 0) return null;
    return Math.min(100, (age / maxAge) * 100);
  };

  const percentage = getCachePercentage();

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1.5">
        <Icon className={`h-3 w-3 ${config.color} ${status === 'revalidating' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </Badge>
      {age !== undefined && (
        <div className="text-xs text-muted-foreground" title={config.description}>
          {formatAge(age)}
          {percentage !== null && (
            <span className="ml-1">
              ({percentage.toFixed(0)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
