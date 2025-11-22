/**
 * Integration tests for /api/analyses route
 * Tests POST and GET handlers for analysis sessions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@/lib/auth/firebase-admin', () => ({
  getUserFromToken: vi.fn(),
}));

vi.mock('@/lib/db/analysis', () => ({
  createAnalysisSession: vi.fn(),
  listAnalysisSessions: vi.fn(),
}));

import { POST, GET } from '@/app/api/analyses/route';
import * as firebaseAdmin from '@/lib/auth/firebase-admin';
import * as analysis from '@/lib/db/analysis';
import type { NextRequest } from 'next/server';
import type { DecodedIdToken } from 'firebase-admin/auth';

describe('POST /api/analyses', () => {
  const mockUserId = 'firebase-uid-123';
  const mockSession = {
    id: 'session-id-123',
    userId: mockUserId,
    url: 'https://example.com',
    summary: 'Excellent performance with fast LCP',
    recommendations: 'Consider implementing ISR',
    createdAt: new Date('2024-01-01T12:00:00.000Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });
  });

  it('creates analysis session with valid data', async () => {
    vi.mocked(analysis.createAnalysisSession).mockResolvedValue(mockSession);

    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        summary: 'Excellent performance with fast LCP',
        recommendations: 'Consider implementing ISR',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(201);
    // Date is serialized to string in JSON response
    expect(data).toMatchObject({
      id: mockSession.id,
      userId: mockSession.userId,
      url: mockSession.url,
      summary: mockSession.summary,
      recommendations: mockSession.recommendations,
    });
    expect(firebaseAdmin.getUserFromToken).toHaveBeenCalledWith('Bearer valid-token');
    expect(analysis.createAnalysisSession).toHaveBeenCalledWith(
      mockUserId,
      'https://example.com',
      'Excellent performance with fast LCP',
      'Consider implementing ISR'
    );
  });

  it('returns 401 when no authorization header', async () => {
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(
      new Error('Missing Authorization header')
    );

    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        summary: 'Test',
        recommendations: 'Test',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 401 with invalid token', async () => {
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(
      new Error('Invalid or expired token')
    );

    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        summary: 'Test',
        recommendations: 'Test',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 when url is missing', async () => {
    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Test summary',
        recommendations: 'Test recommendations',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('url');
  });

  it('returns 400 when summary is missing', async () => {
    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        recommendations: 'Test recommendations',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('summary');
  });

  it('returns 400 when recommendations is missing', async () => {
    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        summary: 'Test summary',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('recommendations');
  });

  it('returns 400 when url is not a string', async () => {
    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 123,
        summary: 'Test summary',
        recommendations: 'Test recommendations',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('url');
  });

  it('returns 500 on database error', async () => {
    vi.mocked(analysis.createAnalysisSession).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = new Request('http://localhost:3000/api/analyses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer valid-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://example.com',
        summary: 'Test summary',
        recommendations: 'Test recommendations',
      }),
    });

    const response = await POST(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to create analysis session');
  });
});

describe('GET /api/analyses', () => {
  const mockUserId = 'firebase-uid-123';
  const mockSessions = [
    {
      id: 'session-1',
      userId: mockUserId,
      url: 'https://example.com',
      summary: 'Analysis 1',
      recommendations: 'Recommendation 1',
      createdAt: new Date('2024-01-03T12:00:00.000Z'),
    },
    {
      id: 'session-2',
      userId: mockUserId,
      url: 'https://example.com/page2',
      summary: 'Analysis 2',
      recommendations: 'Recommendation 2',
      createdAt: new Date('2024-01-02T12:00:00.000Z'),
    },
  ];

  // Helper to create a request with nextUrl property
  function createGetRequest(url: string, headers: Record<string, string> = {}): NextRequest {
    const request = new Request(url, { headers });
    Object.defineProperty(request, 'nextUrl', {
      value: new URL(url),
      writable: false,
    });
    return request as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(firebaseAdmin.getUserFromToken).mockResolvedValue({
      userId: mockUserId,
      email: 'test@example.com',
      decodedToken: {} as DecodedIdToken,
    });
  });

  it('returns analysis sessions for authenticated user', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockResolvedValue({
      items: mockSessions,
      hasMore: false,
      nextCursor: null,
    });

    const request = createGetRequest('http://localhost:3000/api/analyses', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.hasMore).toBe(false);
    expect(data.nextCursor).toBeNull();
    expect(firebaseAdmin.getUserFromToken).toHaveBeenCalledWith('Bearer valid-token');
    expect(analysis.listAnalysisSessions).toHaveBeenCalledWith(mockUserId, {
      limit: undefined,
      cursor: undefined,
    });
  });

  it('returns 401 when no authorization header', async () => {
    vi.mocked(firebaseAdmin.getUserFromToken).mockRejectedValue(
      new Error('Missing Authorization header')
    );

    const request = createGetRequest('http://localhost:3000/api/analyses');

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(401);
  });

  it('supports custom limit parameter', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockResolvedValue({
      items: [mockSessions[0]],
      hasMore: true,
      nextCursor: 'session-1',
    });

    const request = createGetRequest('http://localhost:3000/api/analyses?limit=10', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(200);
    expect(analysis.listAnalysisSessions).toHaveBeenCalledWith(mockUserId, {
      limit: 10,
      cursor: undefined,
    });
  });

  it('supports cursor parameter for pagination', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockResolvedValue({
      items: [mockSessions[1]],
      hasMore: false,
      nextCursor: null,
    });

    const request = createGetRequest('http://localhost:3000/api/analyses?cursor=session-1', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);

    expect(response.status).toBe(200);
    expect(analysis.listAnalysisSessions).toHaveBeenCalledWith(mockUserId, {
      limit: undefined,
      cursor: 'session-1',
    });
  });

  it('supports both limit and cursor parameters', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockResolvedValue({
      items: [mockSessions[1]],
      hasMore: false,
      nextCursor: null,
    });

    const request = createGetRequest(
      'http://localhost:3000/api/analyses?limit=5&cursor=session-1',
      { 'Authorization': 'Bearer valid-token' }
    );

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toBeDefined();
    expect(analysis.listAnalysisSessions).toHaveBeenCalledWith(mockUserId, {
      limit: 5,
      cursor: 'session-1',
    });
  });

  it('returns 400 for invalid limit parameter', async () => {
    const request = createGetRequest('http://localhost:3000/api/analyses?limit=invalid', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('returns 400 for negative limit', async () => {
    const request = createGetRequest('http://localhost:3000/api/analyses?limit=-5', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('limit');
  });

  it('returns empty items array when user has no sessions', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockResolvedValue({
      items: [],
      hasMore: false,
      nextCursor: null,
    });

    const request = createGetRequest('http://localhost:3000/api/analyses', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.items).toHaveLength(0);
    expect(data.hasMore).toBe(false);
  });

  it('returns 500 on database error', async () => {
    vi.mocked(analysis.listAnalysisSessions).mockRejectedValue(
      new Error('Database connection failed')
    );

    const request = createGetRequest('http://localhost:3000/api/analyses', {
      'Authorization': 'Bearer valid-token',
    });

    const response = await GET(request as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to list analysis sessions');
  });
});
