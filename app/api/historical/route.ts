import { NextRequest, NextResponse } from 'next/server';
import {
  queryHistoricalData,
  getAggregatedMetrics,
  detectRegressions,
  saveHistoricalData,
  type HistoricalDataPoint,
  type TimeRangeQuery,
} from '@/lib/storage/historical';
import type { RenderingStrategyType } from '@/types/strategy';

/**
 * GET /api/historical
 * Query historical performance data
 * 
 * Query parameters:
 * - startDate: ISO 8601 date string (required)
 * - endDate: ISO 8601 date string (required)
 * - strategy: RenderingStrategyType (optional)
 * - projectId: string (optional, default: 'default')
 * - granularity: 'hour' | 'day' | 'week' | 'month' (optional, for aggregated data)
 * - detectRegressions: 'true' | 'false' (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const strategy = searchParams.get('strategy') as RenderingStrategyType | null;
    const projectId = searchParams.get('projectId') || 'default';
    const granularity = searchParams.get('granularity') as 'hour' | 'day' | 'week' | 'month' | null;
    const shouldDetectRegressions = searchParams.get('detectRegressions') === 'true';

    // Validate required parameters
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'startDate must be before endDate' },
        { status: 400 }
      );
    }

    // Build query
    const query: TimeRangeQuery = {
      startDate,
      endDate,
      projectId,
    };

    if (strategy) {
      // Validate strategy
      const validStrategies: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
      if (!validStrategies.includes(strategy)) {
        return NextResponse.json(
          { error: 'Invalid strategy. Must be one of: SSR, SSG, ISR, CACHE' },
          { status: 400 }
        );
      }
      query.strategy = strategy;
    }

    // Fetch data based on granularity
    let data;
    if (granularity) {
      // Return aggregated data
      if (!strategy) {
        return NextResponse.json(
          { error: 'strategy is required when using granularity' },
          { status: 400 }
        );
      }

      const aggregated = await getAggregatedMetrics(
        strategy,
        projectId,
        granularity,
        startDate,
        endDate
      );

      data = aggregated;
    } else {
      // Return raw data points
      const rawData = await queryHistoricalData(query);
      data = rawData;
    }

    // Detect regressions if requested
    let regressions = null;
    if (shouldDetectRegressions && strategy) {
      regressions = await detectRegressions(strategy, projectId);
    }

    return NextResponse.json({
      success: true,
      data,
      regressions,
      query: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        strategy,
        projectId,
        granularity,
      },
      metadata: {
        count: data.length,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          durationMs: endDate.getTime() - startDate.getTime(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/historical
 * Save a new historical data point
 * 
 * Request body:
 * {
 *   strategy: RenderingStrategyType;
 *   projectId: string;
 *   metrics: CoreWebVitals;
 *   metadata?: { url?: string; userAgent?: string; environment?: string; };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.strategy || !body.metrics) {
      return NextResponse.json(
        { error: 'strategy and metrics are required' },
        { status: 400 }
      );
    }

    // Validate strategy
    const validStrategies: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
    if (!validStrategies.includes(body.strategy)) {
      return NextResponse.json(
        { error: 'Invalid strategy. Must be one of: SSR, SSG, ISR, CACHE' },
        { status: 400 }
      );
    }

    // Validate metrics structure
    const requiredMetrics = ['fcp', 'lcp', 'cls', 'inp', 'ttfb'];
    for (const metric of requiredMetrics) {
      if (!body.metrics[metric] || typeof body.metrics[metric].value !== 'number') {
        return NextResponse.json(
          { error: `Invalid metrics structure. Missing or invalid ${metric}` },
          { status: 400 }
        );
      }
    }

    // Prepare data point
    const dataPoint: Omit<HistoricalDataPoint, 'timestamp'> = {
      strategy: body.strategy,
      projectId: body.projectId || 'default',
      metrics: body.metrics,
      metadata: body.metadata,
    };

    // Save to KV store
    const success = await saveHistoricalData(dataPoint);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save historical data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Historical data saved successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error saving historical data:', error);
    return NextResponse.json(
      { error: 'Failed to save historical data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
