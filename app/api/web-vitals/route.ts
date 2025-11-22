/**
 * API routes for Web Vitals metrics persistence
 * Phase 5: User Story 3 - Track Core Web Vitals by strategy
 * 
 * Endpoints:
 * - T039: POST /api/web-vitals - Create new metric
 * - T040: GET /api/web-vitals - List metrics with filters
 * - T041: Node.js runtime for database access
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth/firebase-admin';
import { createWebVitalsMetric, listWebVitalsMetrics } from '@/lib/db/web-vitals';
import { RenderingStrategy } from '@/lib/generated/prisma';

// T041: Specify Node.js runtime for database operations
export const runtime = 'nodejs';

/**
 * Valid rendering strategies
 */
const VALID_STRATEGIES: RenderingStrategy[] = ['SSR', 'SSG', 'ISR', 'CACHE'];

/**
 * Validate if a string is a valid rendering strategy
 */
function isValidStrategy(strategy: string): strategy is RenderingStrategy {
  return VALID_STRATEGIES.includes(strategy as RenderingStrategy);
}

/**
 * T039: POST /api/web-vitals
 * 
 * Create a new Web Vitals metric record.
 * Requires Firebase authentication via Authorization header.
 * 
 * Request body:
 * ```json
 * {
 *   "url": "https://example.com",
 *   "strategy": "SSR" | "SSG" | "ISR" | "CACHE",
 *   "lcpMs": 1200,      // optional
 *   "cls": 0.05,        // optional
 *   "inpMs": 80,        // optional
 *   "fidMs": 50,        // optional
 *   "ttfbMs": 200       // optional
 * }
 * ```
 * 
 * Response (201):
 * ```json
 * {
 *   "metric": {
 *     "id": "...",
 *     "userId": "...",
 *     "url": "...",
 *     "strategy": "...",
 *     "lcpMs": 1200,
 *     "cls": 0.05,
 *     "inpMs": 80,
 *     "fidMs": 50,
 *     "ttfbMs": 200,
 *     "collectedAt": "2024-01-01T00:00:00.000Z"
 *   }
 * }
 * ```
 * 
 * Error responses:
 * - 400: Invalid request body or strategy
 * - 401: Missing or invalid authentication token
 * - 500: Database error
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId } = await getUserFromToken(authHeader);

    // Parse and validate request body
    const body = await request.json();
    const { url, strategy, lcpMs, cls, inpMs, fidMs, ttfbMs } = body;

    // Validate required fields
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: url' },
        { status: 400 }
      );
    }

    if (!strategy || typeof strategy !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid required field: strategy' },
        { status: 400 }
      );
    }

    // Validate strategy value
    if (!isValidStrategy(strategy)) {
      return NextResponse.json(
        { 
          error: `Invalid strategy. Must be one of: ${VALID_STRATEGIES.join(', ')}`,
          received: strategy,
        },
        { status: 400 }
      );
    }

    // Create metric
    const metric = await createWebVitalsMetric({
      userId,
      url,
      strategy,
      lcpMs: lcpMs !== undefined ? Number(lcpMs) : null,
      cls: cls !== undefined ? Number(cls) : null,
      inpMs: inpMs !== undefined ? Number(inpMs) : null,
      fidMs: fidMs !== undefined ? Number(fidMs) : null,
      ttfbMs: ttfbMs !== undefined ? Number(ttfbMs) : null,
    });

    return NextResponse.json({ metric }, { status: 201 });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && (
      error.message.includes('token') || 
      error.message.includes('Authorization') ||
      error.message.includes('Unauthorized')
    )) {
      return NextResponse.json(
        { error: 'Unauthorized', details: error.message },
        { status: 401 }
      );
    }

    // Handle other errors
    console.error('Error creating web vitals metric:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create web vitals metric',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * T040: GET /api/web-vitals
 * 
 * List Web Vitals metrics for the authenticated user with optional filters.
 * Requires Firebase authentication via Authorization header.
 * 
 * Query parameters:
 * - url: Filter by URL (optional)
 * - strategy: Filter by rendering strategy (SSR|SSG|ISR|CACHE) (optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 * 
 * Response (200):
 * ```json
 * {
 *   "metrics": [...],
 *   "total": 150,
 *   "hasMore": true
 * }
 * ```
 * 
 * Error responses:
 * - 400: Invalid query parameters
 * - 401: Missing or invalid authentication token
 * - 500: Database error
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    const { userId } = await getUserFromToken(authHeader);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || undefined;
    const strategyParam = searchParams.get('strategy');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate and parse strategy
    let strategy: RenderingStrategy | undefined;
    if (strategyParam) {
      if (!isValidStrategy(strategyParam)) {
        return NextResponse.json(
          { 
            error: `Invalid strategy. Must be one of: ${VALID_STRATEGIES.join(', ')}`,
            received: strategyParam,
          },
          { status: 400 }
        );
      }
      strategy = strategyParam;
    }

    // Validate and parse pagination
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter. Must be a positive integer.' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter. Must be a non-negative integer.' },
        { status: 400 }
      );
    }

    // Fetch metrics
    const result = await listWebVitalsMetrics({
      userId,
      url,
      strategy,
      limit,
      offset,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle authentication errors
    if (error instanceof Error && (
      error.message.includes('token') || 
      error.message.includes('Authorization') ||
      error.message.includes('Unauthorized')
    )) {
      return NextResponse.json(
        { error: 'Unauthorized', details: error.message },
        { status: 401 }
      );
    }

    // Handle other errors
    console.error('Error listing web vitals metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to list web vitals metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
