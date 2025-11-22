/**
 * Unit tests for Web Vitals database functions
 * Tests for Phase 5: User Story 3 - Track Core Web Vitals by strategy
 * 
 * Tests T033-T034:
 * - T033: Unit test for createWebVitalsMetric
 * - T034: Unit test for listWebVitalsMetrics with filters
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWebVitalsMetric, listWebVitalsMetrics } from '@/lib/db/web-vitals';
import { prisma } from '@/lib/db/prisma';
import type { WebVitalsMetric } from '@/lib/generated/prisma';

// Mock Prisma client
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    webVitalsMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

describe('Web Vitals Database Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWebVitalsMetric (T033)', () => {
    it('should create a new web vitals metric record', async () => {
      const mockData = {
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSR' as const,
        lcpMs: 1200,
        cls: 0.05,
        inpMs: 80,
        fidMs: 50,
        ttfbMs: 200,
      };

      const mockCreatedMetric = {
        id: 'metric-123',
        ...mockData,
        collectedAt: new Date(),
      };

      vi.mocked(prisma.webVitalsMetric.create).mockResolvedValue(mockCreatedMetric);

      const result = await createWebVitalsMetric(mockData);

      expect(prisma.webVitalsMetric.create).toHaveBeenCalledWith({
        data: mockData,
      });
      expect(result).toEqual(mockCreatedMetric);
    });

    it('should handle missing optional metrics', async () => {
      const mockData = {
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSG' as const,
        lcpMs: 800,
        cls: 0.02,
        // inpMs, fidMs, ttfbMs are optional
      };

      const mockCreatedMetric = {
        id: 'metric-124',
        ...mockData,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      };

      vi.mocked(prisma.webVitalsMetric.create).mockResolvedValue(mockCreatedMetric);

      const result = await createWebVitalsMetric(mockData);

      expect(result.inpMs).toBeNull();
      expect(result.fidMs).toBeNull();
      expect(result.ttfbMs).toBeNull();
    });

    it('should accept all four rendering strategies', async () => {
      const strategies = ['SSR', 'SSG', 'ISR', 'CACHE'] as const;

      for (const strategy of strategies) {
        const mockData = {
          userId: 'test-user-123',
          url: 'https://example.com',
          strategy,
          lcpMs: 1000,
          cls: 0.05,
        };

        const mockCreatedMetric = {
          id: `metric-${strategy}`,
          ...mockData,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: new Date(),
        };

        vi.mocked(prisma.webVitalsMetric.create).mockResolvedValue(mockCreatedMetric);

        const result = await createWebVitalsMetric(mockData);

        expect(result.strategy).toBe(strategy);
      }
    });

    it('should throw error when database operation fails', async () => {
      const mockData = {
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSR' as const,
        lcpMs: 1200,
        cls: 0.05,
      };

      vi.mocked(prisma.webVitalsMetric.create).mockRejectedValue(new Error('Database error'));

      await expect(createWebVitalsMetric(mockData)).rejects.toThrow('Database error');
    });
  });

  describe('listWebVitalsMetrics (T034)', () => {
    it('should list metrics for a specific user', async () => {
      const userId = 'test-user-123';
      const mockMetrics = [
        {
          id: 'metric-1',
          userId,
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 1200,
          cls: 0.05,
          inpMs: 80,
          fidMs: null,
          ttfbMs: 200,
          collectedAt: new Date(),
        },
      ];

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(1);

      const result = await listWebVitalsMetrics({ userId });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { collectedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.metrics).toEqual(mockMetrics);
      expect(result.total).toBe(1);
    });

    it('should filter by URL', async () => {
      const userId = 'test-user-123';
      const url = 'https://example.com';
      const mockMetrics = [
        {
          id: 'metric-1',
          userId,
          url,
          strategy: 'SSR',
          lcpMs: 1200,
          cls: 0.05,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: new Date(),
        },
      ];

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(1);

      const result = await listWebVitalsMetrics({ userId, url });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId, url },
        orderBy: { collectedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.metrics[0].url).toBe(url);
    });

    it('should filter by rendering strategy', async () => {
      const userId = 'test-user-123';
      const strategy = 'SSG';
      const mockMetrics = [
        {
          id: 'metric-1',
          userId,
          url: 'https://example.com',
          strategy,
          lcpMs: 800,
          cls: 0.02,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: new Date(),
        },
      ];

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(1);

      const result = await listWebVitalsMetrics({ userId, strategy });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId, strategy },
        orderBy: { collectedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.metrics[0].strategy).toBe(strategy);
    });

    it('should filter by URL and strategy together', async () => {
      const userId = 'test-user-123';
      const url = 'https://example.com';
      const strategy = 'ISR';
      const mockMetrics = [
        {
          id: 'metric-1',
          userId,
          url,
          strategy,
          lcpMs: 1000,
          cls: 0.03,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: new Date(),
        },
      ];

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(1);

      const result = await listWebVitalsMetrics({ userId, url, strategy });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId, url, strategy },
        orderBy: { collectedAt: 'desc' },
        take: 50,
        skip: 0,
      });
      expect(result.metrics[0].url).toBe(url);
      expect(result.metrics[0].strategy).toBe(strategy);
    });

    it('should support pagination with limit', async () => {
      const userId = 'test-user-123';
      const limit = 10;
      const mockMetrics = Array(10).fill(null).map((_, i) => ({
        id: `metric-${i}`,
        userId,
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1000 + i * 100,
        cls: 0.05,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      }));

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(100);

      const result = await listWebVitalsMetrics({ userId, limit });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { collectedAt: 'desc' },
        take: limit,
        skip: 0,
      });
      expect(result.metrics).toHaveLength(10);
    });

    it('should support pagination with offset', async () => {
      const userId = 'test-user-123';
      const limit = 10;
      const offset = 20;
      const mockMetrics = Array(10).fill(null).map((_, i) => ({
        id: `metric-${i + 20}`,
        userId,
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1000 + i * 100,
        cls: 0.05,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      }));

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(100);

      const result = await listWebVitalsMetrics({ userId, limit, offset });

      expect(prisma.webVitalsMetric.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { collectedAt: 'desc' },
        take: limit,
        skip: offset,
      });
      expect(result.hasMore).toBe(true);
    });

    it('should indicate hasMore correctly when at end of results', async () => {
      const userId = 'test-user-123';
      const limit = 10;
      const offset = 90;
      const mockMetrics = Array(10).fill(null).map((_, i) => ({
        id: `metric-${i + 90}`,
        userId,
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1000,
        cls: 0.05,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      }));

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(100);

      const result = await listWebVitalsMetrics({ userId, limit, offset });

      expect(result.hasMore).toBe(false);
    });

    it('should order by collectedAt descending (newest first)', async () => {
      const userId = 'test-user-123';
      const date1 = new Date('2024-01-01');
      const date2 = new Date('2024-01-02');
      const date3 = new Date('2024-01-03');

      const mockMetrics = [
        {
          id: 'metric-3',
          userId,
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 1000,
          cls: 0.05,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: date3,
        },
        {
          id: 'metric-2',
          userId,
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 1000,
          cls: 0.05,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: date2,
        },
        {
          id: 'metric-1',
          userId,
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 1000,
          cls: 0.05,
          inpMs: null,
          fidMs: null,
          ttfbMs: null,
          collectedAt: date1,
        },
      ];

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue(mockMetrics as unknown as WebVitalsMetric[]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(3);

      const result = await listWebVitalsMetrics({ userId });

      expect(result.metrics[0].collectedAt).toEqual(date3);
      expect(result.metrics[1].collectedAt).toEqual(date2);
      expect(result.metrics[2].collectedAt).toEqual(date1);
    });

    it('should return empty array when no metrics found', async () => {
      const userId = 'test-user-123';

      vi.mocked(prisma.webVitalsMetric.findMany).mockResolvedValue([]);
      vi.mocked(prisma.webVitalsMetric.count).mockResolvedValue(0);

      const result = await listWebVitalsMetrics({ userId });

      expect(result.metrics).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    it('should throw error when database operation fails', async () => {
      const userId = 'test-user-123';

      vi.mocked(prisma.webVitalsMetric.findMany).mockRejectedValue(new Error('Database error'));

      await expect(listWebVitalsMetrics({ userId })).rejects.toThrow('Database error');
    });
  });
});
