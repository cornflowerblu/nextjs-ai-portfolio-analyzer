/**
 * Metrics API Route
 * Provides mock performance data for each rendering strategy
 */

import { NextResponse } from 'next/server';
import { CoreWebVitals, CORE_WEB_VITALS_THRESHOLDS, getRating } from '@/types/performance';
import { RenderingStrategyType } from '@/types/strategy';
import { saveHistoricalData } from '@/lib/storage/historical';

interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}

/**
 * Generate time-based variation using sine waves
 * This creates smooth, realistic fluctuations instead of random jumps
 * @param baseValue - The center value to fluctuate around
 * @param variationPercent - The percentage of variation (e.g., 0.08 = ±8%)
 * @param frequencyMs - How quickly values cycle (in milliseconds)
 * @param phaseOffset - Offset to create different patterns for different metrics
 */
function getTimeBasedVariation(
  baseValue: number,
  variationPercent: number,
  frequencyMs: number,
  phaseOffset: number = 0
): number {
  const now = Date.now();
  // Use sine wave for smooth oscillation
  const angle = ((now + phaseOffset) / frequencyMs) * Math.PI * 2;
  const variation = Math.sin(angle) * variationPercent;
  return baseValue * (1 + variation);
}

// Mock data generator for realistic Core Web Vitals with smooth variations
function generateMockMetrics(strategy: RenderingStrategyType): CoreWebVitals {
  // Base values represent typical performance for each strategy
  const baseMetrics = {
    SSR: {
      fcp: 1400,
      lcp: 2100,
      cls: 0.075,
      inp: 200,
      ttfb: 700,
    },
    SSG: {
      fcp: 750,
      lcp: 1200,
      cls: 0.035,
      inp: 110,
      ttfb: 275,
    },
    ISR: {
      fcp: 975,
      lcp: 1700,
      cls: 0.05,
      inp: 140,
      ttfb: 490,
    },
    CACHE: {
      fcp: 625,
      lcp: 1075,
      cls: 0.02,
      inp: 85,
      ttfb: 225,
    },
  };

  const values = baseMetrics[strategy];
  
  // Apply time-based variations (±8%) with different frequencies and phases
  // This creates realistic, observable trends rather than random noise
  const fcpValue = Math.round(getTimeBasedVariation(values.fcp, 0.08, 30000, 0));
  const lcpValue = Math.round(getTimeBasedVariation(values.lcp, 0.08, 35000, 5000));
  const clsValue = Math.round(getTimeBasedVariation(values.cls, 0.08, 40000, 10000) * 1000) / 1000;
  const inpValue = Math.round(getTimeBasedVariation(values.inp, 0.08, 32000, 15000));
  const ttfbValue = Math.round(getTimeBasedVariation(values.ttfb, 0.08, 38000, 20000));

  return {
    fcp: {
      value: fcpValue,
      rating: getRating(fcpValue, CORE_WEB_VITALS_THRESHOLDS.fcp),
      delta: 0,
    },
    lcp: {
      value: lcpValue,
      rating: getRating(lcpValue, CORE_WEB_VITALS_THRESHOLDS.lcp),
      delta: 0,
    },
    cls: {
      value: clsValue,
      rating: getRating(clsValue, CORE_WEB_VITALS_THRESHOLDS.cls),
      delta: 0,
    },
    inp: {
      value: inpValue,
      rating: getRating(inpValue, CORE_WEB_VITALS_THRESHOLDS.inp),
      delta: 0,
    },
    ttfb: {
      value: ttfbValue,
      rating: getRating(ttfbValue, CORE_WEB_VITALS_THRESHOLDS.ttfb),
      delta: 0,
    },
    timestamp: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy') as RenderingStrategyType | null;
    const projectId = searchParams.get('projectId') || 'default';
    const saveHistory = searchParams.get('saveHistory') !== 'false'; // Save by default

    // If specific strategy requested, return only that strategy's metrics
    if (strategy && ['SSR', 'SSG', 'ISR', 'CACHE'].includes(strategy)) {
      const metrics = generateMockMetrics(strategy);
      
      // Save to historical data store (T115: Store performance snapshots)
      if (saveHistory) {
        await saveHistoricalData({
          strategy,
          projectId,
          metrics,
          metadata: {
            environment: process.env.NODE_ENV as 'development' | 'production',
          },
        });
      }
      
      return NextResponse.json({
        strategy,
        metrics,
        timestamp: new Date().toISOString(),
      } as StrategyMetrics);
    }

    // Otherwise, return metrics for all strategies
    const strategies: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];
    const allMetrics: StrategyMetrics[] = [];

    for (const strat of strategies) {
      const metrics = generateMockMetrics(strat);
      
      // Save to historical data store (T115: Store performance snapshots)
      if (saveHistory) {
        await saveHistoricalData({
          strategy: strat,
          projectId,
          metrics,
          metadata: {
            environment: process.env.NODE_ENV as 'development' | 'production',
          },
        });
      }

      allMetrics.push({
        strategy: strat,
        metrics,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(allMetrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
