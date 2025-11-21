/**
 * Tests for AI prompt templates
 */

import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PROMPT,
  createAnalysisPrompt,
  createFollowUpPrompt,
  parseOptimizationSuggestions,
} from '@/lib/ai/prompts';
import type { PerformanceContext } from '@/types/ai';

describe('AI Prompts', () => {
  const mockContext: PerformanceContext = {
    strategies: [
      {
        strategy: 'SSR',
        metrics: {
          fcp: { value: 1400, rating: 'good', delta: 0 },
          lcp: { value: 2100, rating: 'good', delta: 0 },
          cls: { value: 0.075, rating: 'good', delta: 0 },
          inp: { value: 200, rating: 'good', delta: 0 },
          ttfb: { value: 700, rating: 'good', delta: 0 },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
      {
        strategy: 'SSG',
        metrics: {
          fcp: { value: 750, rating: 'good', delta: 0 },
          lcp: { value: 1200, rating: 'good', delta: 0 },
          cls: { value: 0.035, rating: 'good', delta: 0 },
          inp: { value: 110, rating: 'good', delta: 0 },
          ttfb: { value: 275, rating: 'good', delta: 0 },
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      },
    ],
    timestamp: '2024-01-01T00:00:00.000Z',
  };

  describe('SYSTEM_PROMPT', () => {
    it('should contain performance consultant role', () => {
      expect(SYSTEM_PROMPT).toContain('expert Next.js performance optimization consultant');
    });

    it('should include Core Web Vitals thresholds', () => {
      expect(SYSTEM_PROMPT).toContain('FCP');
      expect(SYSTEM_PROMPT).toContain('LCP');
      expect(SYSTEM_PROMPT).toContain('CLS');
      expect(SYSTEM_PROMPT).toContain('INP');
      expect(SYSTEM_PROMPT).toContain('TTFB');
    });

    it('should mention impact levels', () => {
      expect(SYSTEM_PROMPT).toContain('high');
      expect(SYSTEM_PROMPT).toContain('medium');
      expect(SYSTEM_PROMPT).toContain('low');
    });
  });

  describe('createAnalysisPrompt', () => {
    it('should create prompt with strategy metrics', () => {
      const prompt = createAnalysisPrompt(mockContext);
      
      expect(prompt).toContain('SSR');
      expect(prompt).toContain('SSG');
      expect(prompt).toContain('FCP: 1400ms');
      expect(prompt).toContain('LCP: 2100ms');
    });

    it('should include timestamp', () => {
      const prompt = createAnalysisPrompt(mockContext);
      expect(prompt).toContain(mockContext.timestamp);
    });

    it('should include URL if provided', () => {
      const contextWithUrl = { ...mockContext, currentUrl: 'https://example.com' };
      const prompt = createAnalysisPrompt(contextWithUrl);
      expect(prompt).toContain('https://example.com');
    });

    it('should request optimization recommendations', () => {
      const prompt = createAnalysisPrompt(mockContext);
      expect(prompt).toContain('optimization');
      expect(prompt).toContain('recommendations');
    });
  });

  describe('createFollowUpPrompt', () => {
    it('should include user question', () => {
      const question = 'Why is SSG faster than SSR?';
      const prompt = createFollowUpPrompt(question, mockContext, []);
      
      expect(prompt).toContain(question);
    });

    it('should include performance context', () => {
      const question = 'Which strategy should I use?';
      const prompt = createFollowUpPrompt(question, mockContext, []);
      
      expect(prompt).toContain('SSR');
      expect(prompt).toContain('SSG');
    });

    it('should include conversation history', () => {
      const question = 'Tell me more';
      const history = [
        'user: What is SSG?',
        'assistant: SSG is Static Site Generation...',
      ];
      const prompt = createFollowUpPrompt(question, mockContext, history);
      
      expect(prompt).toContain('What is SSG?');
      expect(prompt).toContain('Static Site Generation');
    });
  });

  describe('parseOptimizationSuggestions', () => {
    it('should extract summary from text', () => {
      const text = 'SSG performs significantly better than SSR with lower TTFB.';
      const result = parseOptimizationSuggestions(text);
      
      expect(result.summary).toBeTruthy();
    });

    it('should parse numbered suggestions', () => {
      const text = `
Summary: Performance is good overall.

1. Optimize images to reduce LCP
2. Use SSG for static content
      `;
      const result = parseOptimizationSuggestions(text);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should parse bulleted suggestions', () => {
      const text = `
Summary: Consider these optimizations:

- Improve TTFB by using edge caching
- Reduce CLS with proper image sizing
      `;
      const result = parseOptimizationSuggestions(text);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should determine impact levels', () => {
      const text = `
1. Critical: Implement SSG for major performance gains
2. Minor optimization: Reduce bundle size slightly
      `;
      const result = parseOptimizationSuggestions(text);
      
      const highImpact = result.suggestions.find((s) => s.impact === 'high');
      const lowImpact = result.suggestions.find((s) => s.impact === 'low');
      
      expect(highImpact).toBeTruthy();
      expect(lowImpact).toBeTruthy();
    });

    it('should concatenate multi-line suggestion descriptions', () => {
      const text = `
Performance analysis summary goes here.

1. Optimize images to reduce LCP
This will improve loading times significantly.
Consider using next/image for automatic optimization.
Expected improvement: 500ms reduction in LCP.

2. Use SSG for static pages
This provides the best performance for content that doesn't change frequently.
      `;
      const result = parseOptimizationSuggestions(text);
      
      expect(result.suggestions.length).toBe(2);
      
      const firstSuggestion = result.suggestions[0];
      expect(firstSuggestion.title).toContain('Optimize images');
      expect(firstSuggestion.description).toContain('improve loading times');
      expect(firstSuggestion.description).toContain('next/image');
      expect(firstSuggestion.description).toContain('500ms reduction');
      
      const secondSuggestion = result.suggestions[1];
      expect(secondSuggestion.title).toContain('Use SSG');
      expect(secondSuggestion.description).toContain('best performance');
      expect(secondSuggestion.description).toContain('doesn\'t change frequently');
    });

    it('should handle empty description lines correctly', () => {
      const text = `
1. Optimize performance

Additional details here.
More information.
      `;
      const result = parseOptimizationSuggestions(text);
      
      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0].description).toContain('Additional details');
      expect(result.suggestions[0].description).toContain('More information');
      // Should have spaces between concatenated lines
      expect(result.suggestions[0].description).toMatch(/details.*More/);
    });
  });
});
