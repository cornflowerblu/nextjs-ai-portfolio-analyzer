import { describe, it, expect } from 'vitest';
import { getRating, CORE_WEB_VITALS_THRESHOLDS } from '@/types/performance';

describe('getRating', () => {
  describe('FCP (First Contentful Paint)', () => {
    const { fcp } = CORE_WEB_VITALS_THRESHOLDS;

    it('returns "good" for values below good threshold (1800ms)', () => {
      expect(getRating(0, fcp)).toBe('good');
      expect(getRating(1000, fcp)).toBe('good');
      expect(getRating(1799, fcp)).toBe('good');
    });

    it('returns "good" for values at exact good threshold', () => {
      expect(getRating(1800, fcp)).toBe('good');
    });

    it('returns "needs-improvement" for values between thresholds', () => {
      expect(getRating(1801, fcp)).toBe('needs-improvement');
      expect(getRating(2500, fcp)).toBe('needs-improvement');
      expect(getRating(2999, fcp)).toBe('needs-improvement');
    });

    it('returns "needs-improvement" for values at exact needsImprovement threshold', () => {
      expect(getRating(3000, fcp)).toBe('needs-improvement');
    });

    it('returns "poor" for values above needsImprovement threshold', () => {
      expect(getRating(3001, fcp)).toBe('poor');
      expect(getRating(5000, fcp)).toBe('poor');
      expect(getRating(10000, fcp)).toBe('poor');
    });
  });

  describe('LCP (Largest Contentful Paint)', () => {
    const { lcp } = CORE_WEB_VITALS_THRESHOLDS;

    it('returns "good" for values <= 2500ms', () => {
      expect(getRating(1000, lcp)).toBe('good');
      expect(getRating(2500, lcp)).toBe('good');
    });

    it('returns "needs-improvement" for values between 2500ms and 4000ms', () => {
      expect(getRating(2501, lcp)).toBe('needs-improvement');
      expect(getRating(3000, lcp)).toBe('needs-improvement');
      expect(getRating(4000, lcp)).toBe('needs-improvement');
    });

    it('returns "poor" for values > 4000ms', () => {
      expect(getRating(4001, lcp)).toBe('poor');
      expect(getRating(6000, lcp)).toBe('poor');
    });
  });

  describe('CLS (Cumulative Layout Shift)', () => {
    const { cls } = CORE_WEB_VITALS_THRESHOLDS;

    it('returns "good" for values <= 0.1', () => {
      expect(getRating(0, cls)).toBe('good');
      expect(getRating(0.05, cls)).toBe('good');
      expect(getRating(0.1, cls)).toBe('good');
    });

    it('returns "needs-improvement" for values between 0.1 and 0.25', () => {
      expect(getRating(0.11, cls)).toBe('needs-improvement');
      expect(getRating(0.2, cls)).toBe('needs-improvement');
      expect(getRating(0.25, cls)).toBe('needs-improvement');
    });

    it('returns "poor" for values > 0.25', () => {
      expect(getRating(0.26, cls)).toBe('poor');
      expect(getRating(0.5, cls)).toBe('poor');
      expect(getRating(1.0, cls)).toBe('poor');
    });
  });

  describe('INP (Interaction to Next Paint)', () => {
    const { inp } = CORE_WEB_VITALS_THRESHOLDS;

    it('returns "good" for values <= 200ms', () => {
      expect(getRating(0, inp)).toBe('good');
      expect(getRating(100, inp)).toBe('good');
      expect(getRating(200, inp)).toBe('good');
    });

    it('returns "needs-improvement" for values between 200ms and 500ms', () => {
      expect(getRating(201, inp)).toBe('needs-improvement');
      expect(getRating(350, inp)).toBe('needs-improvement');
      expect(getRating(500, inp)).toBe('needs-improvement');
    });

    it('returns "poor" for values > 500ms', () => {
      expect(getRating(501, inp)).toBe('poor');
      expect(getRating(1000, inp)).toBe('poor');
    });
  });

  describe('TTFB (Time to First Byte)', () => {
    const { ttfb } = CORE_WEB_VITALS_THRESHOLDS;

    it('returns "good" for values <= 800ms', () => {
      expect(getRating(0, ttfb)).toBe('good');
      expect(getRating(500, ttfb)).toBe('good');
      expect(getRating(800, ttfb)).toBe('good');
    });

    it('returns "needs-improvement" for values between 800ms and 1800ms', () => {
      expect(getRating(801, ttfb)).toBe('needs-improvement');
      expect(getRating(1200, ttfb)).toBe('needs-improvement');
      expect(getRating(1800, ttfb)).toBe('needs-improvement');
    });

    it('returns "poor" for values > 1800ms', () => {
      expect(getRating(1801, ttfb)).toBe('poor');
      expect(getRating(3000, ttfb)).toBe('poor');
    });
  });

  describe('Edge Cases', () => {
    const { fcp } = CORE_WEB_VITALS_THRESHOLDS;

    it('handles decimal values correctly', () => {
      expect(getRating(1800.5, fcp)).toBe('needs-improvement');
      expect(getRating(1799.9, fcp)).toBe('good');
    });

    it('handles very small values', () => {
      expect(getRating(0.001, fcp)).toBe('good');
    });

    it('handles very large values', () => {
      expect(getRating(999999, fcp)).toBe('poor');
    });
  });
});

describe('CORE_WEB_VITALS_THRESHOLDS', () => {
  it('has correct threshold values for FCP', () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.fcp).toEqual({
      good: 1800,
      needsImprovement: 3000,
    });
  });

  it('has correct threshold values for LCP', () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.lcp).toEqual({
      good: 2500,
      needsImprovement: 4000,
    });
  });

  it('has correct threshold values for CLS', () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.cls).toEqual({
      good: 0.1,
      needsImprovement: 0.25,
    });
  });

  it('has correct threshold values for INP', () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.inp).toEqual({
      good: 200,
      needsImprovement: 500,
    });
  });

  it('has correct threshold values for TTFB', () => {
    expect(CORE_WEB_VITALS_THRESHOLDS.ttfb).toEqual({
      good: 800,
      needsImprovement: 1800,
    });
  });

  it('is a readonly object', () => {
    expect(Object.isFrozen(CORE_WEB_VITALS_THRESHOLDS)).toBe(false);
    // TypeScript enforces readonly at compile time
  });
});
