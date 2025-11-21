/**
 * Tests for /api/historical route
 * Tests GET and POST endpoints for historical performance data
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/historical/route';
import { NextRequest } from 'next/server';
import * as historical from '@/lib/storage/historical';
import type { HistoricalDataPoint } from '@/lib/storage/historical';
import type { CoreWebVitals } from '@/types/performance';

// Mock the historical storage module
vi.mock('@/lib/storage/historical', () => ({
  queryHistoricalData: vi.fn(),
  getAggregatedMetrics: vi.fn(),
  detectRegressions: vi.fn(),
  saveHistoricalData: vi.fn(),
}));

describe('GET /api/historical', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (params: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/historical');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  const mockMetrics: CoreWebVitals = {
    fcp: { value: 1200, rating: 'good', delta: 0 },
    lcp: { value: 2000, rating: 'good', delta: 0 },
    cls: { value: 0.05, rating: 'good', delta: 0 },
    inp: { value: 150, rating: 'good', delta: 0 },
    ttfb: { value: 500, rating: 'good', delta: 0 },
    timestamp: '2024-01-01T12:00:00.000Z',
  };

  describe('Query Parameters Validation', () => {
    it('returns 400 when startDate is missing', async () => {
      const request = createMockRequest({
        endDate: '2024-01-31',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate and endDate');
    });

    it('returns 400 when endDate is missing', async () => {
      const request = createMockRequest({
        startDate: '2024-01-01',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('startDate and endDate');
    });

    it('returns 400 when dates are invalid', async () => {
      const request = createMockRequest({
        startDate: 'invalid-date',
        endDate: '2024-01-31',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date');
    });
  });

  describe('Raw Historical Data', () => {
    it('returns raw historical data when no granularity specified', async () => {
      const mockData: HistoricalDataPoint[] = [
        {
          timestamp: Date.parse('2024-01-01'),
          strategy: 'SSR',
          projectId: 'default',
          metrics: mockMetrics,
        },
      ];

      vi.mocked(historical.queryHistoricalData).mockResolvedValue(mockData);

      const request = createMockRequest({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        strategy: 'SSR',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });

    it('filters by strategy when specified', async () => {
      vi.mocked(historical.queryHistoricalData).mockResolvedValue([]);
      
      const request = createMockRequest({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        strategy: 'SSG',
        projectId: 'test-project',
      });

      await GET(request);

      expect(historical.queryHistoricalData).toHaveBeenCalledWith(
        expect.objectContaining({
          strategy: 'SSG',
          projectId: 'test-project',
        })
      );
    });
  });

  describe('Aggregated Data', () => {
    it('returns aggregated data when granularity is specified', async () => {
      const mockAggregated = [
        {
          timestamp: Date.parse('2024-01-01'),
          count: 5,
          metrics: {
            fcp: { avg: 1200, min: 1000, max: 1400 },
            lcp: { avg: 2000, min: 1800, max: 2200 },
            cls: { avg: 0.05, min: 0.03, max: 0.07 },
            inp: { avg: 150, min: 100, max: 200 },
            ttfb: { avg: 500, min: 400, max: 600 },
          },
        },
      ];

      vi.mocked(historical.getAggregatedMetrics).mockResolvedValue(mockAggregated);

      const request = createMockRequest({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        strategy: 'SSR',
        granularity: 'day',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
    });
  });
});

describe('POST /api/historical', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockPostRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/historical', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };

  const validPayload = {
    strategy: 'SSR',
    projectId: 'test-project',
    metrics: {
      fcp: { value: 1200, rating: 'good', delta: 0 },
      lcp: { value: 2000, rating: 'good', delta: 0 },
      cls: { value: 0.05, rating: 'good', delta: 0 },
      inp: { value: 150, rating: 'good', delta: 0 },
      ttfb: { value: 500, rating: 'good', delta: 0 },
      timestamp: '2024-01-01T12:00:00.000Z',
    },
  };

  describe('Request Validation', () => {
    it('returns 400 when strategy is missing', async () => {
      const request = createMockPostRequest({
        projectId: 'test',
        metrics: validPayload.metrics,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('strategy');
    });

    it('returns 400 when metrics are missing', async () => {
      const request = createMockPostRequest({
        strategy: 'SSR',
        projectId: 'test',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('metrics');
    });
  });

  describe('Successful Save', () => {
    it('saves historical data and returns success', async () => {
      vi.mocked(historical.saveHistoricalData).mockResolvedValue(true);

      const request = createMockPostRequest(validPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('saved successfully');
    });
  });
});
