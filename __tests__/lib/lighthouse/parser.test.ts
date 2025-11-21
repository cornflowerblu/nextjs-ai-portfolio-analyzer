/**
 * Tests for Lighthouse result parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseLighthouseResults,
  extractCoreWebVitals,
  getPerformanceGrade,
  identifyBottlenecks,
  calculateImprovement,
  formatMetricValue,
  formatMetricDisplay,
} from '@/lib/lighthouse/parser';
import type { LighthouseMetrics } from '@/types/lighthouse';
import type { RawLighthouseResult } from '@/lib/lighthouse/runner';

describe('Lighthouse Parser', () => {
  describe('parseLighthouseResults', () => {
    it('should parse complete Lighthouse results', () => {
      const rawResult: RawLighthouseResult = {
        scores: {
          performance: 85,
          accessibility: 92,
          bestPractices: 88,
          seo: 95,
        },
        metrics: {
          FCP: 1500,
          LCP: 2400,
          CLS: 0.08,
          INP: 180,
          TTFB: 600,
          SI: 2000,
          TBT: 150,
          speedIndex: 2000,
          totalBlockingTime: 150,
          interactive: 3000,
        },
        fullReport: {},
      };

      const result = parseLighthouseResults(rawResult);

      expect(result.scores).toEqual(rawResult.scores);
      expect(result.metrics).toEqual(rawResult.metrics);
      expect(result.webVitals).toEqual({
        FCP: 1500,
        LCP: 2400,
        CLS: 0.08,
        INP: 180,
        TTFB: 600,
        SI: 2000,
        TBT: 150,
      });
      expect(result.performanceGrade).toBe('Good');
      expect(result.bottlenecks).toEqual([]);
    });

    it('should identify bottlenecks in parsed results', () => {
      const rawResult: RawLighthouseResult = {
        scores: {
          performance: 45,
          accessibility: 80,
          bestPractices: 75,
          seo: 85,
        },
        metrics: {
          FCP: 3500,
          LCP: 4500,
          CLS: 0.3,
          INP: 600,
          TTFB: 2000,
          SI: 4000,
          TBT: 700,
          speedIndex: 4000,
          totalBlockingTime: 700,
          interactive: 5000,
        },
        fullReport: {},
      };

      const result = parseLighthouseResults(rawResult);

      expect(result.performanceGrade).toBe('Needs Improvement');
      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(result.bottlenecks).toContain('First Contentful Paint is too slow (>3s)');
      expect(result.bottlenecks).toContain('Largest Contentful Paint is too slow (>4s)');
    });
  });

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
    it('should identify slow FCP (moderate)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 2000, // Between 1.8s and 3s
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
      expect(bottlenecks).toContain('First Contentful Paint needs improvement (>1.8s)');
    });

    it('should identify slow FCP (severe)', () => {
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

    it('should identify slow LCP (moderate)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 3000, // Between 2.5s and 4s
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
      expect(bottlenecks).toContain('Largest Contentful Paint needs improvement (>2.5s)');
    });

    it('should identify slow LCP (severe)', () => {
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

    it('should identify moderate CLS', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.15, // Between 0.1 and 0.25
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Cumulative Layout Shift needs improvement (>0.1)');
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

    it('should identify slow INP (moderate)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 300, // Between 200ms and 500ms
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Interaction to Next Paint needs improvement (>200ms)');
    });

    it('should identify slow INP (severe)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 600,
        TTFB: 500,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Interaction to Next Paint is too slow (>500ms)');
    });

    it('should identify slow TTFB (moderate)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 100,
        TTFB: 1000, // Between 800ms and 1.8s
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Time to First Byte needs improvement (>800ms)');
    });

    it('should identify slow TTFB (severe)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 100,
        TTFB: 2000,
        SI: 1000,
        TBT: 100,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Time to First Byte is too slow (>1.8s)');
    });

    it('should identify slow TBT (moderate)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 400, // Between 200ms and 600ms
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Total Blocking Time needs improvement (>200ms)');
    });

    it('should identify slow TBT (severe)', () => {
      const metrics: LighthouseMetrics = {
        FCP: 1500,
        LCP: 2000,
        CLS: 0.05,
        INP: 100,
        TTFB: 500,
        SI: 1000,
        TBT: 700,
        speedIndex: 1000,
        totalBlockingTime: 100,
        interactive: 2000,
      };

      const bottlenecks = identifyBottlenecks(metrics);
      expect(bottlenecks).toContain('Total Blocking Time is too high (>600ms)');
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

    it('should format all metric types correctly', () => {
      expect(formatMetricValue('FCP', 1500)).toBe('1500ms');
      expect(formatMetricValue('LCP', 2400)).toBe('2400ms');
      expect(formatMetricValue('CLS', 0.05)).toBe('0.050');
      expect(formatMetricValue('INP', 150)).toBe('150ms');
      expect(formatMetricValue('TTFB', 600)).toBe('600ms');
      expect(formatMetricValue('SI', 2000)).toBe('2000ms');
      expect(formatMetricValue('TBT', 100)).toBe('100ms');
    });
  });

  describe('formatMetricDisplay', () => {
    it('should format CLS with score unit', () => {
      const result = formatMetricDisplay('CLS', 0.05);
      expect(result.value).toBe('0.050');
      expect(result.unit).toBe('score');
    });

    it('should format time metrics with ms unit', () => {
      const fcpResult = formatMetricDisplay('FCP', 1500);
      expect(fcpResult.value).toBe('1500');
      expect(fcpResult.unit).toBe('ms');

      const lcpResult = formatMetricDisplay('LCP', 2400);
      expect(lcpResult.value).toBe('2400');
      expect(lcpResult.unit).toBe('ms');

      const inpResult = formatMetricDisplay('INP', 180);
      expect(inpResult.value).toBe('180');
      expect(inpResult.unit).toBe('ms');

      const ttfbResult = formatMetricDisplay('TTFB', 600);
      expect(ttfbResult.value).toBe('600');
      expect(ttfbResult.unit).toBe('ms');

      const siResult = formatMetricDisplay('SI', 2000);
      expect(siResult.value).toBe('2000');
      expect(siResult.unit).toBe('ms');

      const tbtResult = formatMetricDisplay('TBT', 150);
      expect(tbtResult.value).toBe('150');
      expect(tbtResult.unit).toBe('ms');
    });

    it('should handle decimal values correctly', () => {
      const result = formatMetricDisplay('FCP', 1234.56);
      expect(result.value).toBe('1235');
      expect(result.unit).toBe('ms');
    });
  });
});
