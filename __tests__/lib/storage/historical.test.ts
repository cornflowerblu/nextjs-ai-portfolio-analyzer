/**
 * Tests for lib/storage/historical.ts
 * Tests historical data management functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveHistoricalData,
  getHistoricalData,
  queryHistoricalData,
  getAggregatedMetrics,
  detectRegressions,
  type HistoricalDataPoint,
} from '@/lib/storage/historical';
import * as kv from '@/lib/storage/kv';
import * as cacheKeys from '@/lib/storage/cache-keys';

// Mock the KV and cache-keys modules
vi.mock('@/lib/storage/kv');
vi.mock('@/lib/storage/cache-keys');

describe('Historical Data Management', () => {
  const mockMetrics = {
    fcp: { value: 1200, rating: 'good' as const, delta: 0 },
    lcp: { value: 2000, rating: 'good' as const, delta: 0 },
    cls: { value: 0.05, rating: 'good' as const, delta: 0 },
    inp: { value: 150, rating: 'good' as const, delta: 0 },
    ttfb: { value: 500, rating: 'good' as const, delta: 0 },
    timestamp: '2024-01-01T12:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveHistoricalData', () => {
    it('saves data with generated timestamp', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSR:default:123456');
      vi.mocked(kv.kvSet).mockResolvedValue(true);

      const result = await saveHistoricalData({
        strategy: 'SSR',
        projectId: 'default',
        metrics: mockMetrics,
      });

      expect(result).toBe(true);
      expect(kv.kvSet).toHaveBeenCalledWith(
        'historical:SSR:default:123456',
        expect.objectContaining({
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        }),
        { ex: 7776000 } // 90 days TTL
      );
    });

    it('saves data with custom timestamp', async () => {
      const customTimestamp = Date.parse('2024-01-15');
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSG:project:123');
      vi.mocked(kv.kvSet).mockResolvedValue(true);

      await saveHistoricalData({
        strategy: 'SSG',
        projectId: 'project',
        metrics: mockMetrics,
        timestamp: customTimestamp,
      });

      expect(cacheKeys.getHistoricalKey).toHaveBeenCalledWith('SSG', 'project', customTimestamp);
    });

    it('handles save errors gracefully', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSR:default:123');
      vi.mocked(kv.kvSet).mockRejectedValue(new Error('Storage error'));

      const result = await saveHistoricalData({
        strategy: 'SSR',
        projectId: 'default',
        metrics: mockMetrics,
      });

      expect(result).toBe(false);
    });

    it('includes metadata when provided', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:ISR:default:123');
      vi.mocked(kv.kvSet).mockResolvedValue(true);

      await saveHistoricalData({
        strategy: 'ISR',
        projectId: 'default',
        metrics: mockMetrics,
        metadata: {
          url: 'https://example.com',
          environment: 'production',
        },
      });

      expect(kv.kvSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadata: expect.objectContaining({
            url: 'https://example.com',
            environment: 'production',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('getHistoricalData', () => {
    it('retrieves data for specific strategy and date', async () => {
      const mockData: HistoricalDataPoint = {
        timestamp: Date.parse('2024-01-01'),
        strategy: 'SSR',
        projectId: 'default',
        metrics: mockMetrics,
      };

      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSR:default:123');
      vi.mocked(kv.kvGet).mockResolvedValue(mockData);

      const result = await getHistoricalData('SSR', 'default', new Date('2024-01-01'));

      expect(result).toEqual(mockData);
    });

    it('uses current date when date not provided', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSG:default:123');
      vi.mocked(kv.kvGet).mockResolvedValue(null);

      await getHistoricalData('SSG', 'default');

      expect(cacheKeys.getHistoricalKey).toHaveBeenCalledWith('SSG', 'default', expect.any(Number));
    });

    it('returns null when data not found', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSR:default:123');
      vi.mocked(kv.kvGet).mockResolvedValue(null);

      const result = await getHistoricalData('SSR', 'default');

      expect(result).toBeNull();
    });

    it('handles retrieval errors gracefully', async () => {
      vi.mocked(cacheKeys.getHistoricalKey).mockReturnValue('historical:SSR:default:123');
      vi.mocked(kv.kvGet).mockRejectedValue(new Error('Retrieval error'));

      const result = await getHistoricalData('SSR', 'default');

      expect(result).toBeNull();
    });
  });

  describe('queryHistoricalData', () => {
    it('queries data for specific strategy and date range', async () => {
      const mockDataPoints: HistoricalDataPoint[] = [
        {
          timestamp: Date.parse('2024-01-01'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        {
          timestamp: Date.parse('2024-01-02'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
      ];

      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1', 'key2']);
      vi.mocked(kv.kvMGet).mockResolvedValue(mockDataPoints);

      const result = await queryHistoricalData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        strategy: 'SSR',
        projectId: 'default',
      });

      expect(result).toEqual(mockDataPoints);
      expect(result).toHaveLength(2);
    });

    it('queries all strategies when strategy not specified', async () => {
      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:*:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue([]);
      vi.mocked(kv.kvMGet).mockResolvedValue([]);

      await queryHistoricalData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        projectId: 'default',
      });

      // Should call getHistoricalPattern for each strategy
      expect(cacheKeys.getHistoricalPattern).toHaveBeenCalledTimes(4); // SSR, SSG, ISR, CACHE
    });

    it('filters results by date range', async () => {
      const mockDataPoints: HistoricalDataPoint[] = [
        {
          timestamp: Date.parse('2024-01-01'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        {
          timestamp: Date.parse('2024-02-15'), // Outside range
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
      ];

      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1', 'key2']);
      vi.mocked(kv.kvMGet).mockResolvedValue(mockDataPoints);

      const result = await queryHistoricalData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        strategy: 'SSR',
        projectId: 'default',
      });

      // Should filter out data outside date range
      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBe(Date.parse('2024-01-01'));
    });

    it('returns empty array on error', async () => {
      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockRejectedValue(new Error('Query error'));

      const result = await queryHistoricalData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        strategy: 'SSR',
        projectId: 'default',
      });

      expect(result).toEqual([]);
    });

    it('sorts results by timestamp', async () => {
      const mockDataPoints: HistoricalDataPoint[] = [
        {
          timestamp: Date.parse('2024-01-03'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        {
          timestamp: Date.parse('2024-01-01'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        {
          timestamp: Date.parse('2024-01-02'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
      ];

      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1', 'key2', 'key3']);
      vi.mocked(kv.kvMGet).mockResolvedValue(mockDataPoints);

      const result = await queryHistoricalData({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        strategy: 'SSR',
        projectId: 'default',
      });

      expect(result[0].timestamp).toBeLessThan(result[1].timestamp);
      expect(result[1].timestamp).toBeLessThan(result[2].timestamp);
    });
  });

  describe('getAggregatedMetrics', () => {
    it('aggregates metrics by day', async () => {
      const mockDataPoints: HistoricalDataPoint[] = [
        {
          timestamp: Date.parse('2024-01-01T10:00:00Z'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        {
          timestamp: Date.parse('2024-01-01T14:00:00Z'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: { ...mockMetrics, fcp: { value: 1400, rating: 'good', delta: 0 } },
        },
      ];

      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1', 'key2']);
      vi.mocked(kv.kvMGet).mockResolvedValue(mockDataPoints);

      const result = await getAggregatedMetrics(
        'SSR',
        'default',
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result).toHaveLength(1);
      expect(result[0].count).toBe(2);
      expect(result[0].metrics.fcp.avg).toBe(1300); // Average of 1200 and 1400
    });

    it('returns empty array when no data available', async () => {
      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue([]);
      vi.mocked(kv.kvMGet).mockResolvedValue([]);

      const result = await getAggregatedMetrics(
        'SSR',
        'default',
        'day',
        new Date('2024-01-01'),
        new Date('2024-01-02')
      );

      expect(result).toEqual([]);
    });
  });

  describe('detectRegressions', () => {
    it('detects performance regressions above threshold', async () => {
      const mockDataPoints: HistoricalDataPoint[] = [
        // Baseline (first half)
        {
          timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics, // lcp: 2000
        },
        {
          timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
        // Current (second half) - degraded
        {
          timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
          strategy: 'SSR',
          projectId: 'default',
          metrics: { ...mockMetrics, lcp: { value: 2500, rating: 'needs-improvement', delta: 0 } },
        },
        {
          timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          strategy: 'SSR',
          projectId: 'default',
          metrics: { ...mockMetrics, lcp: { value: 2600, rating: 'needs-improvement', delta: 0 } },
        },
      ];

      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1', 'key2', 'key3', 'key4']);
      vi.mocked(kv.kvMGet).mockResolvedValue(mockDataPoints);

      const result = await detectRegressions('SSR', 'default', 0.2);

      expect(result.length).toBeGreaterThan(0);
      const lcpRegression = result.find(r => r.metric === 'lcp');
      expect(lcpRegression).toBeDefined();
      expect(lcpRegression!.change).toBeGreaterThan(0.2);
    });

    it('returns empty array when insufficient data', async () => {
      vi.mocked(cacheKeys.getHistoricalPattern).mockReturnValue('historical:SSR:default:*');
      vi.mocked(kv.kvKeys).mockResolvedValue(['key1']);
      vi.mocked(kv.kvMGet).mockResolvedValue([
        {
          timestamp: Date.now(),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
      ]);

      const result = await detectRegressions('SSR', 'default');

      expect(result).toEqual([]);
    });
  });
});
