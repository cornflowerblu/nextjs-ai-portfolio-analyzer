/**
 * Unit tests for lib/db/analysis.ts
 * Tests AI analysis session persistence functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAnalysisSession, listAnalysisSessions } from '@/lib/db/analysis';
import { prisma } from '@/lib/db/prisma';

// Mock Prisma client
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    analysisSession: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('Analysis Session Database Operations', () => {
  const mockUserId = 'firebase-uid-test-123';
  const mockUrl = 'https://example.com';
  const mockSummary = 'The site demonstrates excellent Core Web Vitals performance with LCP under 2.5s.';
  const mockRecommendations = 'Consider implementing ISR for dynamic content while maintaining fast load times.';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAnalysisSession', () => {
    it('creates a new analysis session successfully', async () => {
      const mockSession = {
        id: 'session-id-123',
        userId: mockUserId,
        url: mockUrl,
        summary: mockSummary,
        recommendations: mockRecommendations,
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
      };

      vi.mocked(prisma.analysisSession.create).mockResolvedValue(mockSession);

      const result = await createAnalysisSession(
        mockUserId,
        mockUrl,
        mockSummary,
        mockRecommendations
      );

      expect(result).toEqual(mockSession);
      expect(prisma.analysisSession.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          url: mockUrl,
          summary: mockSummary,
          recommendations: mockRecommendations,
        },
      });
    });

    it('passes through Prisma errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(prisma.analysisSession.create).mockRejectedValue(error);

      await expect(
        createAnalysisSession(mockUserId, mockUrl, mockSummary, mockRecommendations)
      ).rejects.toThrow('Database connection failed');
    });

    it('handles empty strings for summary and recommendations', async () => {
      const mockSession = {
        id: 'session-id-empty',
        userId: mockUserId,
        url: mockUrl,
        summary: '',
        recommendations: '',
        createdAt: new Date(),
      };

      vi.mocked(prisma.analysisSession.create).mockResolvedValue(mockSession);

      const result = await createAnalysisSession(mockUserId, mockUrl, '', '');

      expect(result).toEqual(mockSession);
      expect(prisma.analysisSession.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          url: mockUrl,
          summary: '',
          recommendations: '',
        },
      });
    });
  });

  describe('listAnalysisSessions', () => {
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
      {
        id: 'session-3',
        userId: mockUserId,
        url: 'https://example.com/page3',
        summary: 'Analysis 3',
        recommendations: 'Recommendation 3',
        createdAt: new Date('2024-01-01T12:00:00.000Z'),
      },
    ];

    it('returns default page size of 20 items', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue(mockSessions);

      const result = await listAnalysisSessions(mockUserId);

      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
      expect(prisma.analysisSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 21, // limit + 1
      });
    });

    it('respects custom limit parameter', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue([mockSessions[0]]);

      await listAnalysisSessions(mockUserId, { limit: 10 });

      expect(prisma.analysisSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 11, // limit + 1
      });
    });

    it('caps limit at 100 items', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue(mockSessions);

      const result = await listAnalysisSessions(mockUserId, { limit: 200 });

      expect(result).toBeDefined();
      expect(prisma.analysisSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 101, // capped at 100 + 1
      });
    });

    it('supports cursor-based pagination', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue([mockSessions[1]]);

      await listAnalysisSessions(mockUserId, {
        limit: 10,
        cursor: 'session-1',
      });

      expect(prisma.analysisSession.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
        take: 11,
        cursor: { id: 'session-1' },
        skip: 1,
      });
    });

    it('sets hasMore to true when more results exist', async () => {
      const manyItems = Array.from({ length: 11 }, (_, i) => ({
        id: `session-${i}`,
        userId: mockUserId,
        url: `https://example.com/page${i}`,
        summary: `Summary ${i}`,
        recommendations: `Recommendation ${i}`,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T12:00:00.000Z`),
      }));

      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue(manyItems);

      const result = await listAnalysisSessions(mockUserId, { limit: 10 });

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('session-9');
    });

    it('sets hasMore to false when no more results', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue(mockSessions);

      const result = await listAnalysisSessions(mockUserId, { limit: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('returns empty array for user with no sessions', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue([]);

      const result = await listAnalysisSessions('user-with-no-data');

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('orders sessions by createdAt descending', async () => {
      vi.mocked(prisma.analysisSession.findMany).mockResolvedValue(mockSessions);

      const result = await listAnalysisSessions(mockUserId);

      // Verify descending order
      expect(result.items[0].createdAt.getTime()).toBeGreaterThan(
        result.items[1].createdAt.getTime()
      );
      expect(result.items[1].createdAt.getTime()).toBeGreaterThan(
        result.items[2].createdAt.getTime()
      );
    });
  });
});
