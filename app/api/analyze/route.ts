/**
 * URL analysis API endpoint
 * Runs Lighthouse tests and provides rendering strategy recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateUrl } from '@/lib/lighthouse/runner';
import { parseLighthouseResults } from '@/lib/lighthouse/parser';
import { simulateStrategies, generateRecommendations } from '@/lib/lighthouse/simulator';
import { kvGet, kvSet } from '@/lib/storage/kv';
import type { AnalysisRequest, AnalysisResponse, AnalysisResult } from '@/types/lighthouse';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Request validation schema
const analyzeRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

// Cache TTL: 1 hour
const CACHE_TTL_SECONDS = 60 * 60;

/**
 * POST /api/analyze
 * Analyze a URL with Lighthouse and return recommendations
 */
export async function POST(request: NextRequest): Promise<NextResponse<AnalysisResponse>> {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json() as AnalysisRequest;
    const validation = analyzeRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request',
            code: 'INVALID_URL',
            details: validation.error.issues[0]?.message || 'Invalid URL format',
          },
        },
        { status: 400 }
      );
    }

    const { url } = validation.data;

    // Additional URL validation
    const urlValidation = validateUrl(url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: urlValidation.error || 'Invalid URL',
            code: 'INVALID_URL',
            details: urlValidation.error,
          },
        },
        { status: 400 }
      );
    }

    // Dynamic import to avoid bundling Lighthouse (do this early)
    const { runLighthouse } = await import('@/lib/lighthouse/runner');

    // Check cache first
    const cacheKey = `lighthouse:${url}`;
    const cachedResult = await kvGet<AnalysisResult>(cacheKey);

    if (cachedResult) {
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
      });
    }

    // Run Lighthouse test with timeout
    let rawResult;
    try {
      rawResult = await runLighthouse(url, {
        timeout: 60000, // 60 seconds
        formFactor: 'mobile',
        throttling: true,
      });
    } catch (error) {
      // Handle PageSpeed Insights API errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check for API not enabled error (403)
      if (errorMessage.includes('403') && errorMessage.includes('SERVICE_DISABLED')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'PageSpeed Insights API not enabled',
              code: 'API_NOT_ENABLED',
              details: 'The PageSpeed Insights API needs to be enabled. Please contact the administrator to enable it in Google Cloud Console.',
            },
          },
          { status: 503 }
        );
      }

      // Check for API quota/rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('RATE_LIMIT')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Rate limit exceeded',
              code: 'RATE_LIMIT',
              details: 'Too many requests. Please try again later.',
            },
          },
          { status: 429 }
        );
      }

      if (errorMessage.includes('timeout')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Analysis timeout',
              code: 'TIMEOUT',
              details: 'The analysis took too long to complete. The site might be slow or unreachable.',
            },
          },
          { status: 408 }
        );
      }

      if (errorMessage.includes('net::ERR_') || errorMessage.includes('ENOTFOUND')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Site unreachable',
              code: 'UNREACHABLE',
              details: 'Unable to reach the specified URL. Please check if the site is accessible.',
            },
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Analysis failed',
            code: 'ANALYSIS_ERROR',
            details: errorMessage,
          },
        },
        { status: 500 }
      );
    }

    // Parse results
    const parsed = parseLighthouseResults(rawResult);

    // Simulate strategies and generate recommendations
    const strategies = simulateStrategies(parsed.scores, parsed.metrics);
    const recommendations = generateRecommendations(strategies, parsed.metrics);

    // Find best strategy (highest improvement)
    const bestStrategy = strategies.reduce((best, current) => 
      current.improvement > best.improvement ? current : best
    );

    // Build result
    const result: AnalysisResult = {
      url,
      timestamp: Date.now(),
      currentScores: parsed.scores,
      currentMetrics: parsed.metrics,
      recommendations,
      bestStrategy,
      analysisTime: Date.now() - startTime,
    };

    // Cache result
    await kvSet(cacheKey, result, { ex: CACHE_TTL_SECONDS });

    return NextResponse.json({
      success: true,
      data: result,
      cached: false,
    });

  } catch (error) {
    console.error('Analyze API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Internal server error',
          code: 'UNKNOWN',
          details: errorMessage,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * Return API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'URL Analysis API',
    version: '1.0',
    description: 'Analyze website performance and get rendering strategy recommendations',
    endpoints: {
      POST: {
        description: 'Analyze a URL with Lighthouse',
        body: {
          url: 'string (required) - The URL to analyze',
        },
        response: {
          success: 'boolean',
          data: 'AnalysisResult (if successful)',
          error: 'AnalysisError (if failed)',
          cached: 'boolean (if result was from cache)',
        },
      },
    },
    cachePolicy: `Results are cached for ${CACHE_TTL_SECONDS / 60} minutes`,
  });
}
