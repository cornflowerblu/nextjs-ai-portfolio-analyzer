import { describe, it, expect } from 'vitest';
import {
  formatMs,
  formatMetricValue,
  formatMetric,
  formatRelativeTime,
  formatPercent,
  formatBytes,
  formatDuration,
} from '@/lib/utils/format';

describe('formatMs', () => {
  it('formats milliseconds below 1000ms', () => {
    expect(formatMs(0)).toBe('0ms');
    expect(formatMs(500)).toBe('500ms');
    expect(formatMs(999)).toBe('999ms');
  });

  it('formats milliseconds as seconds above 1000ms', () => {
    expect(formatMs(1000)).toBe('1.00s');
    expect(formatMs(1500)).toBe('1.50s');
    expect(formatMs(2345)).toBe('2.35s');
  });

  it('rounds to 2 decimal places for seconds', () => {
    expect(formatMs(1234)).toBe('1.23s');
    expect(formatMs(1236)).toBe('1.24s');
  });

  it('handles negative values', () => {
    expect(formatMs(-500)).toBe('-500ms');
    expect(formatMs(-1500)).toBe('-1.50s');
  });
});

describe('formatMetricValue', () => {
  it('formats FCP as seconds', () => {
    expect(formatMetricValue('fcp', 1200)).toBe('1.20s');
    expect(formatMetricValue('fcp', 500)).toBe('0.50s');
  });

  it('formats LCP as seconds', () => {
    expect(formatMetricValue('lcp', 2500)).toBe('2.50s');
    expect(formatMetricValue('lcp', 1800)).toBe('1.80s');
  });

  it('formats CLS with 3 decimal places', () => {
    expect(formatMetricValue('cls', 0.1)).toBe('0.100');
    expect(formatMetricValue('cls', 0.05)).toBe('0.050');
  });

  it('formats INP as milliseconds', () => {
    expect(formatMetricValue('inp', 200)).toBe('200ms');
    expect(formatMetricValue('inp', 150)).toBe('150ms');
  });

  it('formats TTFB as milliseconds', () => {
    expect(formatMetricValue('ttfb', 800)).toBe('800ms');
    expect(formatMetricValue('ttfb', 600)).toBe('600ms');
  });
});

describe('formatRelativeTime', () => {
  it('returns "just now" for times less than 60 seconds ago', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
    const result = formatRelativeTime(thirtySecondsAgo);
    expect(result).toBe('just now');
  });

  it('formats minutes correctly', () => {
    const now = new Date();
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
    const result = formatRelativeTime(twoMinutesAgo);
    expect(result).toBe('2 minutes ago');
  });

  it('accepts Date, string, and number formats', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    expect(formatRelativeTime(oneMinuteAgo.toISOString())).toBe('1 minute ago');
    expect(formatRelativeTime(oneMinuteAgo.getTime())).toBe('1 minute ago');
  });
});

describe('formatPercent', () => {
  it('formats value with 1 decimal place by default', () => {
    expect(formatPercent(50.0, 1)).toBe('50.0%');
    expect(formatPercent(12.3, 1)).toBe('12.3%');
  });

  it('supports custom decimal places', () => {
    expect(formatPercent(12.345, 2)).toBe('12.35%');
    expect(formatPercent(12.345, 0)).toBe('12%');
  });
});

describe('formatBytes', () => {
  it('formats bytes below 1KB', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
  });

  it('rounds to 2 decimal places by default', () => {
    expect(formatBytes(1234)).toBe('1.21 KB');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds', () => {
    expect(formatDuration(100)).toBe('100ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats seconds', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(5500)).toBe('5.5s');
  });

  it('formats minutes', () => {
    expect(formatDuration(60000)).toBe('1m 0s');
    expect(formatDuration(90000)).toBe('1m 30s');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0ms');
  });
});

describe('formatMetric', () => {
  it('formats CLS with 3 decimal places', () => {
    expect(formatMetric(0.1, 'cls')).toBe('0.100');
    expect(formatMetric(0.05, 'cls')).toBe('0.050');
    expect(formatMetric(0.001, 'cls')).toBe('0.001');
    expect(formatMetric(0.25678, 'cls')).toBe('0.257');
  });

  it('formats FCP as seconds', () => {
    expect(formatMetric(1200, 'fcp')).toBe('1.20s');
    expect(formatMetric(500, 'fcp')).toBe('0.50s');
    expect(formatMetric(2345, 'fcp')).toBe('2.35s');
  });

  it('formats LCP as seconds', () => {
    expect(formatMetric(2500, 'lcp')).toBe('2.50s');
    expect(formatMetric(1800, 'lcp')).toBe('1.80s');
    expect(formatMetric(3456, 'lcp')).toBe('3.46s');
  });

  it('formats INP as rounded milliseconds', () => {
    expect(formatMetric(200, 'inp')).toBe('200ms');
    expect(formatMetric(150, 'inp')).toBe('150ms');
    expect(formatMetric(123.456, 'inp')).toBe('123ms');
    expect(formatMetric(199.8, 'inp')).toBe('200ms');
  });

  it('formats TTFB using formatMs', () => {
    expect(formatMetric(800, 'ttfb')).toBe('800ms');
    expect(formatMetric(600, 'ttfb')).toBe('600ms');
    expect(formatMetric(1500, 'ttfb')).toBe('1.50s');
    expect(formatMetric(50, 'ttfb')).toBe('50ms');
  });

  it('handles zero values', () => {
    expect(formatMetric(0, 'cls')).toBe('0.000');
    expect(formatMetric(0, 'fcp')).toBe('0.00s');
    expect(formatMetric(0, 'lcp')).toBe('0.00s');
    expect(formatMetric(0, 'inp')).toBe('0ms');
    expect(formatMetric(0, 'ttfb')).toBe('0ms');
  });

  it('handles large values', () => {
    expect(formatMetric(1.999, 'cls')).toBe('1.999');
    expect(formatMetric(10000, 'fcp')).toBe('10.00s');
    expect(formatMetric(15000, 'lcp')).toBe('15.00s');
    expect(formatMetric(999, 'inp')).toBe('999ms');
    expect(formatMetric(5000, 'ttfb')).toBe('5.00s');
  });

  it('handles unknown metric keys as default', () => {
    expect(formatMetric(123.456, 'unknown')).toBe('123.456');
    expect(formatMetric(100, 'custom')).toBe('100');
  });

  it('handles timestamp metric key', () => {
    expect(formatMetric(1234567890, 'timestamp')).toBe('1234567890');
  });
});
