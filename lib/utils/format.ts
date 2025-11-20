/**
 * Data formatting utilities
 * Provides consistent formatting for metrics, numbers, and scores
 */

import type { CoreWebVitals } from '@/types/performance';

/**
 * Format milliseconds to human-readable time
 */
export function formatMs(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format seconds to human-readable time
 */
export function formatSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format score (0-100)
 */
export function formatScore(score: number): string {
  return Math.round(score).toString();
}

/**
 * Format Lighthouse score with color class
 */
export function formatLighthouseScore(score: number): {
  value: string;
  rating: 'good' | 'needs-improvement' | 'poor';
} {
  const value = formatScore(score);
  let rating: 'good' | 'needs-improvement' | 'poor';

  if (score >= 90) {
    rating = 'good';
  } else if (score >= 50) {
    rating = 'needs-improvement';
  } else {
    rating = 'poor';
  }

  return { value, rating };
}

/**
 * Format Core Web Vitals metric value with appropriate units
 */
export function formatMetricValue(
  metric: keyof CoreWebVitals,
  value: number
): string {
  if (metric === 'timestamp') return value.toString();
  
  const metricKey = metric as 'fcp' | 'lcp' | 'cls' | 'inp' | 'ttfb';
  
  switch (metricKey) {
    case 'fcp':
    case 'lcp':
    case 'inp':
    case 'ttfb':
      return formatMs(value);
    case 'cls':
      return value.toFixed(3);
    default:
      return value.toString();
  }
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number | string): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  }
}

/**
 * Format ISO timestamp to readable date/time
 */
export function formatDateTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format ISO timestamp to date only
 */
export function formatDate(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format ISO timestamp to time only
 */
export function formatTime(timestamp: string | number): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
  
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format duration in milliseconds to readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.round((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.round((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

/**
 * Format change percentage with + or - sign
 */
export function formatChange(value: number, decimals = 1): string {
  const formatted = Math.abs(value).toFixed(decimals);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${formatted}%`;
}

/**
 * Format latency with color coding
 */
export function formatLatency(ms: number): {
  value: string;
  rating: 'good' | 'needs-improvement' | 'poor';
} {
  const value = formatMs(ms);
  let rating: 'good' | 'needs-improvement' | 'poor';

  if (ms < 100) {
    rating = 'good';
  } else if (ms < 300) {
    rating = 'needs-improvement';
  } else {
    rating = 'poor';
  }

  return { value, rating };
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format URL for display (remove protocol, truncate if needed)
 */
export function formatUrl(url: string, maxLength = 50): string {
  let formatted = url.replace(/^https?:\/\//, '');
  formatted = formatted.replace(/\/$/, ''); // Remove trailing slash
  return truncate(formatted, maxLength);
}

/**
 * Format cache age
 */
export function formatCacheAge(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s old`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m old`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h old`;
  }
  return `${Math.floor(seconds / 86400)}d old`;
}

/**
 * Format TTL (time to live)
 */
export function formatTTL(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h`;
  }
  return `${Math.floor(seconds / 86400)}d`;
}
