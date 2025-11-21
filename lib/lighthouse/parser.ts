/**
 * Lighthouse result parser
 * Extracts and formats key metrics and scores from Lighthouse results
 */

import type { LighthouseMetrics, CoreWebVitalsMetrics } from '@/types/lighthouse';
import type { RawLighthouseResult } from './runner';

/**
 * Parse Lighthouse results into structured format
 */
export function parseLighthouseResults(rawResult: RawLighthouseResult) {
  const { scores, metrics } = rawResult;

  return {
    scores,
    metrics,
    webVitals: extractCoreWebVitals(metrics),
    performanceGrade: getPerformanceGrade(scores.performance),
    bottlenecks: identifyBottlenecks(metrics),
  };
}

/**
 * Extract Core Web Vitals from Lighthouse metrics
 */
export function extractCoreWebVitals(metrics: LighthouseMetrics): CoreWebVitalsMetrics {
  return {
    FCP: metrics.FCP,
    LCP: metrics.LCP,
    CLS: metrics.CLS,
    INP: metrics.INP,
    TTFB: metrics.TTFB,
    SI: metrics.SI,
    TBT: metrics.TBT,
  };
}

/**
 * Get performance grade based on score
 */
export function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 50) return 'Good';
  return 'Needs Improvement';
}

/**
 * Identify performance bottlenecks from metrics
 */
export function identifyBottlenecks(metrics: LighthouseMetrics): string[] {
  const bottlenecks: string[] = [];

  // FCP thresholds (good: <1.8s, needs improvement: 1.8-3s, poor: >3s)
  if (metrics.FCP > 3000) {
    bottlenecks.push('First Contentful Paint is too slow (>3s)');
  } else if (metrics.FCP > 1800) {
    bottlenecks.push('First Contentful Paint needs improvement (>1.8s)');
  }

  // LCP thresholds (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
  if (metrics.LCP > 4000) {
    bottlenecks.push('Largest Contentful Paint is too slow (>4s)');
  } else if (metrics.LCP > 2500) {
    bottlenecks.push('Largest Contentful Paint needs improvement (>2.5s)');
  }

  // CLS thresholds (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
  if (metrics.CLS > 0.25) {
    bottlenecks.push('Cumulative Layout Shift is too high (>0.25)');
  } else if (metrics.CLS > 0.1) {
    bottlenecks.push('Cumulative Layout Shift needs improvement (>0.1)');
  }

  // INP thresholds (good: <200ms, needs improvement: 200-500ms, poor: >500ms)
  if (metrics.INP > 500) {
    bottlenecks.push('Interaction to Next Paint is too slow (>500ms)');
  } else if (metrics.INP > 200) {
    bottlenecks.push('Interaction to Next Paint needs improvement (>200ms)');
  }

  // TTFB thresholds (good: <800ms, needs improvement: 800-1800ms, poor: >1800ms)
  if (metrics.TTFB > 1800) {
    bottlenecks.push('Time to First Byte is too slow (>1.8s)');
  } else if (metrics.TTFB > 800) {
    bottlenecks.push('Time to First Byte needs improvement (>800ms)');
  }

  // TBT thresholds (good: <200ms, needs improvement: 200-600ms, poor: >600ms)
  if (metrics.TBT > 600) {
    bottlenecks.push('Total Blocking Time is too high (>600ms)');
  } else if (metrics.TBT > 200) {
    bottlenecks.push('Total Blocking Time needs improvement (>200ms)');
  }

  return bottlenecks;
}

/**
 * Calculate potential improvements for a metric
 */
export function calculateImprovement(
  current: number,
  target: number
): { absolute: number; percentage: number } {
  const absolute = current - target;
  const percentage = current > 0 ? (absolute / current) * 100 : 0;
  
  return {
    absolute: Math.max(0, absolute),
    percentage: Math.max(0, percentage),
  };
}

/**
 * Format metric value with appropriate unit
 */
export function formatMetricValue(metric: keyof CoreWebVitalsMetrics, value: number): string {
  if (metric === 'CLS') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}
