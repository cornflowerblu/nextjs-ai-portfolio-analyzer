/**
 * Analysis Sessions API Route
 * 
 * Provides endpoints for creating and listing AI-generated analysis sessions.
 * All operations require Firebase authentication and enforce user isolation.
 * 
 * User Story: Store AI analysis insights per user (Phase 4)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth/firebase-admin';
import { createAnalysisSession, listAnalysisSessions } from '@/lib/db/analysis';

// Use Node.js runtime for database access
export const runtime = 'nodejs';
// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

/**
 * POST /api/analyses
 * Create a new analysis session
 * 
 * Request body:
 * - url: string (required) - URL that was analyzed
 * - summary: string (required) - AI-generated analysis summary
 * - recommendations: string (required) - AI-generated recommendations
 * 
 * Requires: Authorization header with Firebase ID token
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const { userId } = await getUserFromToken(authHeader);

    // Parse and validate request body
    const body = await request.json();
    const { url, summary, recommendations } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'url is required and must be a string' },
        { status: 400 }
      );
    }

    if (!summary || typeof summary !== 'string') {
      return NextResponse.json(
        { error: 'summary is required and must be a string' },
        { status: 400 }
      );
    }

    if (!recommendations || typeof recommendations !== 'string') {
      return NextResponse.json(
        { error: 'recommendations is required and must be a string' },
        { status: 400 }
      );
    }

    // Create analysis session
    const session = await createAnalysisSession(
      userId,
      url,
      summary,
      recommendations
    );

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis session:', error);

    if (error instanceof Error) {
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authorization')) {
        return NextResponse.json(
          { error: 'Unauthorized', details: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create analysis session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyses
 * List analysis sessions for authenticated user
 * 
 * Query parameters:
 * - limit: number (optional, default: 20, max: 100) - Number of results per page
 * - cursor: string (optional) - Cursor for pagination
 * 
 * Requires: Authorization header with Firebase ID token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const { userId } = await getUserFromToken(authHeader);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitStr = searchParams.get('limit');
    const cursor = searchParams.get('cursor');

    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    // Validate limit if provided
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return NextResponse.json(
        { error: 'limit must be a positive number' },
        { status: 400 }
      );
    }

    // List analysis sessions
    const result = await listAnalysisSessions(userId, {
      limit,
      cursor: cursor || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing analysis sessions:', error);

    if (error instanceof Error) {
      // Handle authentication errors
      if (error.message.includes('token') || error.message.includes('Authorization')) {
        return NextResponse.json(
          { error: 'Unauthorized', details: error.message },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to list analysis sessions' },
      { status: 500 }
    );
  }
}
