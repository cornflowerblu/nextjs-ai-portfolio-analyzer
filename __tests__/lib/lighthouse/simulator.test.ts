/**
 * Tests for strategy simulator
 */

import { describe, it, expect } from 'vitest';
import { simulateStrategies, generateRecommendations } from '@/lib/lighthouse/simulator';
import type { LighthouseScores, LighthouseMetrics } from '@/types/lighthouse';

describe('Strategy Simulator', () => {
  const mockScores: LighthouseScores = {
    performance: 70,
    accessibility: 85,
    bestPractices: 80,
    seo: 90,
  };

  const mockMetrics: LighthouseMetrics = {
    FCP: 2000,
    LCP: 3000,
    CLS: 0.15,
    INP: 300,
    TTFB: 1000,
    SI: 2500,
    TBT: 400,
    speedIndex: 2500,
    totalBlockingTime: 400,
    interactive: 3500,
  };

  describe('simulateStrategies', () => {
    it('should return 4 rendering strategies', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      
      expect(strategies).toHaveLength(4);
      expect(strategies.map(s => s.id)).toEqual(['ssr', 'ssg', 'isr', 'cache']);
    });

    it('should estimate improvements for each strategy', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      
      strategies.forEach(strategy => {
        expect(strategy).toHaveProperty('estimatedScores');
        expect(strategy).toHaveProperty('estimatedMetrics');
        expect(strategy).toHaveProperty('improvement');
        expect(strategy).toHaveProperty('pros');
        expect(strategy).toHaveProperty('cons');
      });
    });

    it('should provide better scores than current for all strategies', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      
      strategies.forEach(strategy => {
        expect(strategy.estimatedScores.performance).toBeGreaterThanOrEqual(
          mockScores.performance
        );
      });
    });

    it('should improve metrics for all strategies', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      
      strategies.forEach(strategy => {
        // Check that at least some metrics are improved
        const metrics = Object.values(strategy.estimatedMetrics);
        expect(metrics.length).toBeGreaterThan(0);
        
        // All estimated metrics should be lower (better) than current
        Object.entries(strategy.estimatedMetrics).forEach(([key, value]) => {
          if (value !== undefined) {
            const currentValue = mockMetrics[key as keyof LighthouseMetrics];
            expect(value).toBeLessThanOrEqual(currentValue);
          }
        });
      });
    });

    it('should have SSG with best performance improvement', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const ssg = strategies.find(s => s.id === 'ssg');
      
      expect(ssg).toBeDefined();
      expect(ssg!.improvement).toBeGreaterThan(0);
      
      // SSG should have highest improvement for static sites
      const ssr = strategies.find(s => s.id === 'ssr');
      expect(ssg!.improvement).toBeGreaterThanOrEqual(ssr!.improvement);
    });

    it('should include pros and cons for each strategy', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      
      strategies.forEach(strategy => {
        expect(strategy.pros.length).toBeGreaterThan(0);
        expect(strategy.cons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for all strategies', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      expect(recommendations).toHaveLength(4);
    });

    it('should sort recommendations by improvement', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      // First recommendation should have the highest priority
      expect(recommendations[0]?.priority).toBe('high');
      
      // Improvements should be in descending order
      for (let i = 0; i < recommendations.length - 1; i++) {
        const current = recommendations[i]!.strategy.improvement;
        const next = recommendations[i + 1]!.strategy.improvement;
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    it('should assign priorities correctly', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      const priorities = recommendations.map(r => r.priority);
      expect(priorities[0]).toBe('high');
      expect(priorities[1]).toBe('medium');
      expect(priorities.slice(2)).toEqual(['low', 'low']);
    });

    it('should include expected gains for each recommendation', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      recommendations.forEach(rec => {
        expect(rec.expectedGain.length).toBeGreaterThan(0);
        
        rec.expectedGain.forEach(gain => {
          expect(gain).toHaveProperty('metric');
          expect(gain).toHaveProperty('current');
          expect(gain).toHaveProperty('projected');
          expect(gain).toHaveProperty('improvement');
          expect(gain.improvement).toMatch(/%$/);
        });
      });
    });

    it('should include implementation complexity', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      recommendations.forEach(rec => {
        expect(['low', 'medium', 'high']).toContain(rec.implementationComplexity);
      });
    });

    it('should provide reasoning for each recommendation', () => {
      const strategies = simulateStrategies(mockScores, mockMetrics);
      const recommendations = generateRecommendations(strategies, mockMetrics);
      
      recommendations.forEach(rec => {
        expect(rec.reasoning).toBeTruthy();
        expect(rec.reasoning.length).toBeGreaterThan(0);
      });
    });
  });
});
