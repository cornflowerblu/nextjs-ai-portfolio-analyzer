/**
 * Integration tests for Web Vitals API routes
 * Tests for Phase 5: User Story 3 - Track Core Web Vitals by strategy
 * 
 * Tests T035-T036:
 * - T035: Integration test for POST /api/web-vitals
 * - T036: Integration test for GET /api/web-vitals with filters
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { WebVitalsMetric } from '@/lib/generated/prisma';

// Mock dependencies BEFORE imports - this is crucial for hoisting
vi.mock('@/lib/auth/firebase-admin');
vi.mock('@/lib/db/web-vitals');

// Now import the mocked modules and the route
import * as firebaseAdmin from '@/lib/auth/firebase-admin';
import * as webVitalsDb from '@/lib/db/web-vitals';
import { POST, GET } from '@/app/api/web-vitals/route';

describe('POST /api/web-vitals (T035)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a web vitals metric with valid authentication', async () => {
    const mockUserId = 'test-user-123';
    const mockMetricData = {
      url: 'https://example.com',
      strategy: 'SSR',
      lcpMs: 1200,
      cls: 0.05,
      inpMs: 80,
      ttfbMs: 200,
    };

    const mockCreatedMetric = {
      id: 'metric-123',
      userId: mockUserId,
      ...mockMetricData,
      fidMs: null,
      collectedAt: new Date(),
    };

    // Mock authentication
    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    // Mock database operation
    vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(mockCreatedMetric as unknown as WebVitalsMetric);

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockMetricData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.metric.id).toBe(mockCreatedMetric.id);
    expect(data.metric.userId).toBe(mockCreatedMetric.userId);
    expect(data.metric.strategy).toBe(mockCreatedMetric.strategy);
    // Note: collectedAt is serialized as ISO string in JSON response
    expect(typeof data.metric.collectedAt).toBe('string');
    expect(webVitalsDb.createWebVitalsMetric).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        url: mockMetricData.url,
        strategy: mockMetricData.strategy,
        lcpMs: mockMetricData.lcpMs,
        cls: mockMetricData.cls,
        inpMs: mockMetricData.inpMs,
        ttfbMs: mockMetricData.ttfbMs,
      })
    );
  });

  it('should return 401 when no authentication token provided', async () => {
    // Configure mock to throw when called without auth header
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(new Error('Missing Authorization header'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1200,
        cls: 0.05,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should return 401 when authentication token is invalid', async () => {
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(new Error('Invalid token'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1200,
        cls: 0.05,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when required fields are missing', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required fields: url, strategy
        lcpMs: 1200,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should return 400 when strategy is invalid', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        strategy: 'INVALID_STRATEGY',
        lcpMs: 1200,
        cls: 0.05,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('should accept all valid rendering strategies', async () => {
    const mockUserId = 'test-user-123';
    const strategies = ['SSR', 'SSG', 'ISR', 'CACHE'];

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    for (const strategy of strategies) {
      const mockCreatedMetric = {
        id: `metric-${strategy}`,
        userId: mockUserId,
        url: 'https://example.com',
        strategy,
        lcpMs: 1000,
        cls: 0.05,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      };

      vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(mockCreatedMetric as unknown as WebVitalsMetric);

      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy,
          lcpMs: 1000,
          cls: 0.05,
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    }
  });

  it('should handle database errors gracefully', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.createWebVitalsMetric).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 1200,
        cls: 0.05,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('should accept optional metrics (fidMs, inpMs, ttfbMs)', async () => {
    const mockUserId = 'test-user-123';
    const mockMetricData = {
      url: 'https://example.com',
      strategy: 'SSG',
      lcpMs: 800,
      cls: 0.02,
      // No fidMs, inpMs, ttfbMs
    };

    const mockCreatedMetric = {
      id: 'metric-123',
      userId: mockUserId,
      ...mockMetricData,
      fidMs: null,
      inpMs: null,
      ttfbMs: null,
      collectedAt: new Date(),
    };

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(mockCreatedMetric as unknown as WebVitalsMetric);

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockMetricData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.metric.id).toBe(mockCreatedMetric.id);
    expect(data.metric.userId).toBe(mockCreatedMetric.userId);
    expect(data.metric.strategy).toBe(mockCreatedMetric.strategy);
    // Note: collectedAt is serialized as ISO string in JSON response
    expect(typeof data.metric.collectedAt).toBe('string');
  });
});

describe('GET /api/web-vitals (T036)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should list metrics for authenticated user', async () => {
    const mockUserId = 'test-user-123';
    const mockMetrics = [
      {
        id: 'metric-1',
        userId: mockUserId,
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

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: mockMetrics as unknown as WebVitalsMetric[],
      total: 1,
      hasMore: false,
    });

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toHaveLength(1);
    expect(data.metrics[0].id).toBe('metric-1');
    expect(data.total).toBe(1);
    expect(data.hasMore).toBe(false);
  });

  it('should filter metrics by URL query parameter', async () => {
    const mockUserId = 'test-user-123';
    const url = 'https://example.com';
    const mockMetrics = [
      {
        id: 'metric-1',
        userId: mockUserId,
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

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: mockMetrics as unknown as WebVitalsMetric[],
      total: 1,
      hasMore: false,
    });

    const request = new NextRequest(`http://localhost:3000/api/web-vitals?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(webVitalsDb.listWebVitalsMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        url,
      })
    );
  });

  it('should filter metrics by strategy query parameter', async () => {
    const mockUserId = 'test-user-123';
    const strategy = 'SSG';
    const mockMetrics = [
      {
        id: 'metric-1',
        userId: mockUserId,
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

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: mockMetrics as unknown as WebVitalsMetric[],
      total: 1,
      hasMore: false,
    });

    const request = new NextRequest(`http://localhost:3000/api/web-vitals?strategy=${strategy}`, {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(webVitalsDb.listWebVitalsMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        strategy,
      })
    );
  });

  it('should filter by both URL and strategy', async () => {
    const mockUserId = 'test-user-123';
    const url = 'https://example.com';
    const strategy = 'ISR';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: [] as WebVitalsMetric[],
      total: 0,
      hasMore: false,
    });

    const request = new NextRequest(
      `http://localhost:3000/api/web-vitals?url=${encodeURIComponent(url)}&strategy=${strategy}`,
      {
        headers: {
          'Authorization': 'Bearer valid-token',
        },
      }
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(webVitalsDb.listWebVitalsMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        url,
        strategy,
      })
    );
  });

  it('should support pagination with limit query parameter', async () => {
    const mockUserId = 'test-user-123';
    const limit = 10;

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: [] as WebVitalsMetric[],
      total: 100,
      hasMore: true,
    });

    const request = new NextRequest(`http://localhost:3000/api/web-vitals?limit=${limit}`, {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(webVitalsDb.listWebVitalsMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUserId,
        limit,
      })
    );
  });

  it('should support pagination with offset query parameter', async () => {
    const mockUserId = 'test-user-123';
    const limit = 10;
    const offset = 20;

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: [] as WebVitalsMetric[],
      total: 100,
      hasMore: true,
    });

    const request = new NextRequest(`http://localhost:3000/api/web-vitals?limit=${limit}&offset=${offset}`, {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(webVitalsDb.listWebVitalsMetrics).toHaveBeenCalledWith({
      userId: mockUserId,
      limit,
      offset,
    });
  });

  it('should return 401 when no authentication token provided', async () => {
    // Configure mock to throw when called without auth header
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(new Error('Missing Authorization header'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should return 401 when authentication token is invalid', async () => {
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(new Error('Invalid token'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('should handle database errors gracefully', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockRejectedValue(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBeDefined();
  });

  it('should return empty array when no metrics found', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    vi.mocked(webVitalsDb.listWebVitalsMetrics).mockResolvedValue({
      metrics: [],
      total: 0,
      hasMore: false,
    });

    const request = new NextRequest('http://localhost:3000/api/web-vitals', {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.metrics).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.hasMore).toBe(false);
  });

  it('should validate and reject invalid strategy values', async () => {
    const mockUserId = 'test-user-123';

    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });

    const request = new NextRequest('http://localhost:3000/api/web-vitals?strategy=INVALID', {
      headers: {
        'Authorization': 'Bearer valid-token',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
