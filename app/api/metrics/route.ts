/**
 * Metrics API Route
 * Provides mock performance data for each rendering strategy
 */

import { NextResponse } from 'next/server';
import { CoreWebVitals, CORE_WEB_VITALS_THRESHOLDS, getRating } from '@/types/performance';
import { RenderingStrategyType } from '@/types/strategy';

interface StrategyMetrics {
  strategy: RenderingStrategyType;
  metrics: CoreWebVitals;
  timestamp: string;
}

// Mock data generator for realistic Core Web Vitals
function generateMockMetrics(strategy: RenderingStrategyType): CoreWebVitals {
  const baseMetrics = {
    SSR: {
      fcp: 1200 + Math.random() * 400,
      lcp: 1800 + Math.random() * 600,
      cls: 0.05 + Math.random() * 0.05,
      inp: 150 + Math.random() * 100,
      ttfb: 600 + Math.random() * 200,
    },
    SSG: {
      fcp: 600 + Math.random() * 300,
      lcp: 1000 + Math.random() * 400,
      cls: 0.02 + Math.random() * 0.03,
      inp: 80 + Math.random() * 60,
      ttfb: 200 + Math.random() * 150,
    },
    ISR: {
      fcp: 800 + Math.random() * 350,
      lcp: 1400 + Math.random() * 500,
      cls: 0.03 + Math.random() * 0.04,
      inp: 100 + Math.random() * 80,
      ttfb: 400 + Math.random() * 180,
    },
    CACHE: {
      fcp: 500 + Math.random() * 250,
      lcp: 900 + Math.random() * 350,
      cls: 0.01 + Math.random() * 0.02,
      inp: 60 + Math.random() * 50,
      ttfb: 150 + Math.random() * 100,
    },
  };

  const values = baseMetrics[strategy];
  const fcpValue = Math.round(values.fcp);
  const lcpValue = Math.round(values.lcp);
  const clsValue = Math.round(values.cls * 1000) / 1000;
  const inpValue = Math.round(values.inp);
  const ttfbValue = Math.round(values.ttfb);

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

    // If specific strategy requested, return only that strategy's metrics
    if (strategy && ['SSR', 'SSG', 'ISR', 'CACHE'].includes(strategy)) {
      const metrics = generateMockMetrics(strategy);
      return NextResponse.json({
        strategy,
        metrics,
        timestamp: new Date().toISOString(),
      } as StrategyMetrics);
    }

    // Otherwise, return metrics for all strategies
    const allMetrics: StrategyMetrics[] = [
      {
        strategy: 'SSR',
        metrics: generateMockMetrics('SSR'),
        timestamp: new Date().toISOString(),
      },
      {
        strategy: 'SSG',
        metrics: generateMockMetrics('SSG'),
        timestamp: new Date().toISOString(),
      },
      {
        strategy: 'ISR',
        metrics: generateMockMetrics('ISR'),
        timestamp: new Date().toISOString(),
      },
      {
        strategy: 'CACHE',
        metrics: generateMockMetrics('CACHE'),
        timestamp: new Date().toISOString(),
      },
    ];

    return NextResponse.json(allMetrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
