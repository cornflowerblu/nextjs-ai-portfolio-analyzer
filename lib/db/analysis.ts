/**
 * Analysis Session Database Operations
 * 
 * Provides functions to create and query AI-generated analysis sessions
 * for authenticated users. All operations enforce user isolation.
 * 
 * User Story: Store AI analysis insights per user (Phase 4)
 */

import { prisma } from './prisma';

/**
 * Pagination options for listing analysis sessions
 */
export interface AnalysisListOptions {
  /** Maximum number of results to return (1-100) */
  limit?: number;
  /** Cursor for pagination (ID of last item from previous page) */
  cursor?: string;
}

/**
 * Create a new analysis session for a user
 * 
 * Stores AI-generated insights including summary and recommendations
 * for a specific URL, associated with the authenticated user.
 * 
 * @param userId - Firebase UID of the authenticated user
 * @param url - URL that was analyzed
 * @param summary - AI-generated analysis summary
 * @param recommendations - AI-generated recommendations
 * @returns Created analysis session record
 * 
 * @example
 * ```ts
 * const session = await createAnalysisSession(
 *   'firebase-uid-123',
 *   'https://example.com',
 *   'The site has good Core Web Vitals...',
 *   'Consider implementing ISR for better performance...'
 * );
 * ```
 */
export async function createAnalysisSession(
  userId: string,
  url: string,
  summary: string,
  recommendations: string
) {
  return await prisma.analysisSession.create({
    data: {
      userId,
      url,
      summary,
      recommendations,
    },
  });
}

/**
 * List analysis sessions for a user with cursor-based pagination
 * 
 * Returns sessions ordered by creation date (newest first).
 * Supports cursor-based pagination for efficient traversal.
 * 
 * @param userId - Firebase UID of the authenticated user
 * @param options - Pagination options (limit, cursor)
 * @returns Array of analysis sessions and pagination info
 * 
 * @example
 * ```ts
 * // Get first page (10 items)
 * const page1 = await listAnalysisSessions('firebase-uid-123', { limit: 10 });
 * 
 * // Get next page using cursor
 * if (page1.hasMore) {
 *   const page2 = await listAnalysisSessions('firebase-uid-123', {
 *     limit: 10,
 *     cursor: page1.nextCursor
 *   });
 * }
 * ```
 */
export async function listAnalysisSessions(
  userId: string,
  options: AnalysisListOptions = {}
) {
  const limit = Math.min(options.limit || 20, 100); // Cap at 100
  
  // Fetch limit + 1 to check if there are more results
  const sessions = await prisma.analysisSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(options.cursor && {
      cursor: { id: options.cursor },
      skip: 1, // Skip the cursor itself
    }),
  });

  // Check if there are more results
  const hasMore = sessions.length > limit;
  const items = hasMore ? sessions.slice(0, limit) : sessions;
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;

  return {
    items,
    hasMore,
    nextCursor,
  };
}
