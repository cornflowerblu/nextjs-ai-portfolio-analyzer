/**
 * Tests for Lighthouse result parser
 */

import { describe, it, expect } from 'vitest';
import {
  extractCoreWebVitals,
  getPerformanceGrade,
  identifyBottlenecks,
  calculateImprovement,
  formatMetricValue,
} from '@/lib/lighthouse/parser';
import type { LighthouseMetrics } from '@/types/lighthouse';

describe('Lighthouse Parser', () => {
  describe('extractCoreWebVitals', () => {
    it('should extract Core Web Vitals from Lighthouse metrics', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 150,
        TTFB: 500,
        SI: 1800,
        TBT: 100,
        speedIndex: 1800,
        totalBlockingTime: 100,
        interactive: 2500,
      };

      const vitals = extractCoreWebVitals(metrics);

      expect(vitals).toEqual({
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 150,
        TTFB: 500,
        SI: 1800,
        TBT: 100,
      });
    });
  });

  describe('getPerformanceGrade', () => {
    it('should return "Excellent" for scores >= 90', () => {
      expect(getPerformanceGrade(90)).toBe('Excellent');
      expect(getPerformanceGrade(95)).toBe('Excellent');
      expect(getPerformanceGrade(100)).toBe('Excellent');
    });

    it('should return "Good" for scores between 50 and 89', () => {
      expect(getPerformanceGrade(50)).toBe('Good');
      expect(getPerformanceGrade(75)).toBe('Good');
      expect(getPerformanceGrade(89)).toBe('Good');
    });

    it('should return "Needs Improvement" for scores < 50', () => {
      expect(getPerformanceGrade(0)).toBe('Needs Improvement');
      expect(getPerformanceGrade(25)).toBe('Needs Improvement');
      expect(getPerformanceGrade(49)).toBe('Needs Improvement');
    });
  });

  describe('identifyBottlenecks', () => {
    it('should identify slow FCP', () => {
      const metrics: LighthouseMetrics = {
        FCP: 3500,
        LCP: 1000,
        CLS: 0.05,
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('First Contentful Paint is too slow (>3s)');
    });

    it('should identify slow LCP', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 4500,
        CLS: 0.05,
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Largest Contentful Paint is too slow (>4s)');
    });

    it('should identify high CLS', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.3,
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Cumulative Layout Shift is too high (>0.25)');
    });

    it('should return empty array for excellent metrics', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1000,
        LCP: 2000,
        CLS: 0.05,
        INP: 150,
        TTFB: 500,
        SI: 1000,
        TBT: 150,
        speedIndex: 1000,
        totalBlockingTime: 150,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toHaveLength(0);
    });
  });

  describe('calculateImprovement', () => {
    it('should calculate improvement correctly', () => {
      const result = calculateImprovement(1000, 500);
      expect(result.absolute).toBe(500);
      expect(result.percentage).toBe(50);
    });

    it('should handle zero current value', () => {
      const result = calculateImprovement(0, 100);
      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should return zero for negative improvements', () => {
      const result = calculateImprovement(500, 1000);
      expect(result.absolute).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('formatMetricValue', () => {
    it('should format CLS with 3 decimal places', () => {
      expect(formatMetricValue('CLS', 0.12345)).toBe('0.123');
    });

    it('should format time metrics in milliseconds', () => {
      expect(formatMetricValue('FCP', 1234.56)).toBe('1235ms');
      expect(formatMetricValue('LCP', 2000.1)).toBe('2000ms');
      expect(formatMetricValue('TTFB', 500.9)).toBe('501ms');
    });
  });
});
