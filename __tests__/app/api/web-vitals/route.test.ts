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
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    webVitalsMetric: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

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

describe('POST /api/web-vitals - Metric Validation (Security)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default auth mock for all validation tests
    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: 'test-user-123',
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });
  });

  describe('NaN rejection', () => {
    it('should reject non-numeric string values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 'not-a-number',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
      expect(data.error).toContain('valid number');
    });

    it('should reject array values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: [1, 2, 3],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
      expect(data.error).toContain('valid number');
    });

    it('should reject object values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          inpMs: { value: 100 },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('inpMs');
      expect(data.error).toContain('valid number');
    });
  });

  describe('Negative value rejection', () => {
    it('should reject negative LCP values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: -100,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
      expect(data.error).toContain('between 0 and');
    });

    it('should reject negative CLS values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: -0.5,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
      expect(data.error).toContain('between 0 and');
    });

    it('should reject negative INP values', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          inpMs: -50,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('inpMs');
      expect(data.error).toContain('between 0 and');
    });
  });

  describe('Extreme value rejection', () => {
    it('should reject LCP values exceeding 60 seconds', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 60001, // Just over 1 minute
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
      expect(data.error).toContain('between 0 and 60000');
    });

    it('should reject CLS values exceeding 100', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: 101,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
      expect(data.error).toContain('between 0 and 100');
    });

    it('should reject INP values exceeding 10 seconds', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          inpMs: 10001, // Just over 10 seconds
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('inpMs');
      expect(data.error).toContain('between 0 and 10000');
    });

    it('should reject TTFB values exceeding 60 seconds', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          ttfbMs: 65000,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('ttfbMs');
      expect(data.error).toContain('between 0 and 60000');
    });

    it('should accept values at the maximum boundary', async () => {
      const mockCreatedMetric = {
        id: 'metric-123',
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 60000,
        cls: 100,
        inpMs: 10000,
        fidMs: 10000,
        ttfbMs: 60000,
        collectedAt: new Date(),
      };

      vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(
        mockCreatedMetric as unknown as WebVitalsMetric
      );

      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 60000,
          cls: 100,
          inpMs: 10000,
          fidMs: 10000,
          ttfbMs: 60000,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Infinity rejection', () => {
    it('should reject Infinity for LCP (JSON converts to null)', async () => {
      // Note: JSON.stringify converts Infinity to null, so this tests null rejection
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: Infinity,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
      expect(data.error).toContain('cannot be null');
    });

    it('should reject -Infinity for CLS (JSON converts to null)', async () => {
      // Note: JSON.stringify converts -Infinity to null, so this tests null rejection
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: -Infinity,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
      expect(data.error).toContain('cannot be null');
    });
  });

  describe('Null rejection', () => {
    it('should reject explicit null for LCP', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
      expect(data.error).toContain('cannot be null');
    });

    it('should reject explicit null for CLS', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
      expect(data.error).toContain('cannot be null');
    });
  });

  describe('Type coercion protection', () => {
    it('should reject boolean true', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: true, // Number(true) === 1
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('lcpMs');
    });

    it('should reject boolean false', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: false, // Number(false) === 0
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cls');
    });

    it('should reject empty array', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          inpMs: [], // Number([]) === 0
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('inpMs');
    });

    it('should reject empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          ttfbMs: '', // Number('') === 0
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('ttfbMs');
    });
  });

  describe('Valid edge cases', () => {
    it('should accept zero values', async () => {
      const mockCreatedMetric = {
        id: 'metric-123',
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: 0,
        cls: 0,
        inpMs: 0,
        fidMs: 0,
        ttfbMs: 0,
        collectedAt: new Date(),
      };

      vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(
        mockCreatedMetric as unknown as WebVitalsMetric
      );

      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          lcpMs: 0,
          cls: 0,
          inpMs: 0,
          fidMs: 0,
          ttfbMs: 0,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('should accept decimal values for CLS', async () => {
      const mockCreatedMetric = {
        id: 'metric-123',
        userId: 'test-user-123',
        url: 'https://example.com',
        strategy: 'SSR',
        lcpMs: null,
        cls: 0.12345,
        inpMs: null,
        fidMs: null,
        ttfbMs: null,
        collectedAt: new Date(),
      };

      vi.mocked(webVitalsDb.createWebVitalsMetric).mockResolvedValue(
        mockCreatedMetric as unknown as WebVitalsMetric
      );

      const request = new NextRequest('http://localhost:3000/api/web-vitals', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer valid-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          strategy: 'SSR',
          cls: 0.12345,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
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
