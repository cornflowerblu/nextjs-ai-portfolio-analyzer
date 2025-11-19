/**
 * Core Web Vitals types for performance measurement
 * Based on web-vitals library and Chrome User Experience Report
 */

/**
 * First Contentful Paint (FCP)
 * Measures time from page load to first DOM content render
 * Good: < 1.8s, Needs Improvement: 1.8s - 3.0s, Poor: > 3.0s
 */
export interface FCP {
  value: number; // milliseconds
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Largest Contentful Paint (LCP)
 * Measures time to render largest content element
 * Good: < 2.5s, Needs Improvement: 2.5s - 4.0s, Poor: > 4.0s
 */
export interface LCP {
  value: number; // milliseconds
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  element?: Element;
}

/**
 * Cumulative Layout Shift (CLS)
 * Measures visual stability (unexpected layout shifts)
 * Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
 */
export interface CLS {
  value: number; // unitless score
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Interaction to Next Paint (INP)
 * Measures responsiveness to user interactions
 * Good: < 200ms, Needs Improvement: 200ms - 500ms, Poor: > 500ms
 */
export interface INP {
  value: number; // milliseconds
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Time to First Byte (TTFB)
 * Measures time from request to first byte of response
 * Good: < 800ms, Needs Improvement: 800ms - 1800ms, Poor: > 1800ms
 */
export interface TTFB {
  value: number; // milliseconds
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

/**
 * Complete Core Web Vitals metrics set
 */
export interface CoreWebVitals {
  fcp: FCP;
  lcp: LCP;
  cls: CLS;
  inp: INP;
  ttfb: TTFB;
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Performance measurement snapshot
 */
export interface PerformanceSnapshot {
  id: string;
  metrics: CoreWebVitals;
  strategy: string; // References RenderingStrategy.id
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Helper type for metric thresholds
 */
export interface MetricThresholds {
  good: number;
  needsImprovement: number;
}

/**
 * Thresholds for all Core Web Vitals
 */
export const CORE_WEB_VITALS_THRESHOLDS = {
  fcp: { good: 1800, needsImprovement: 3000 },
  lcp: { good: 2500, needsImprovement: 4000 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  inp: { good: 200, needsImprovement: 500 },
  ttfb: { good: 800, needsImprovement: 1800 },
} as const;

/**
 * Helper function to determine rating from value and thresholds
 */
export function getRating(
  value: number,
  thresholds: MetricThresholds
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}
