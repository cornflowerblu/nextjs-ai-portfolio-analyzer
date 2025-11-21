/**
 * Tests for Lighthouse runner
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runLighthouse, validateUrl } from '@/lib/lighthouse/runner';

// Mock global fetch
global.fetch = vi.fn();

describe('Lighthouse Runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runLighthouse', () => {
    it('should successfully fetch and parse PageSpeed Insights results', async () => {
      const mockResponse = {
        lighthouseResult: {
          categories: {
            performance: { score: 0.95 },
            accessibility: { score: 0.88 },
            'best-practices': { score: 0.92 },
            seo: { score: 0.90 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1200 },
            'largest-contentful-paint': { numericValue: 2400 },
            'cumulative-layout-shift': { numericValue: 0.05 },
            'interaction-to-next-paint': { numericValue: 150 },
            'server-response-time': { numericValue: 400 },
            'speed-index': { numericValue: 2000 },
            'total-blocking-time': { numericValue: 100 },
            'interactive': { numericValue: 3000 },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await runLighthouse('https://example.com');

      expect(result.scores).toEqual({
        performance: 95,
        accessibility: 88,
        bestPractices: 92,
        seo: 90,
      });

      expect(result.metrics).toEqual({
        FCP: 1200,
        LCP: 2400,
        CLS: 0.05,
        INP: 150,
        TTFB: 400,
        SI: 2000,
        TBT: 100,
        speedIndex: 2000,
        totalBlockingTime: 100,
        interactive: 3000,
      });
    });

    it('should use mobile strategy by default', async () => {
      const mockResponse = {
        lighthouseResult: {
          categories: {
            performance: { score: 0.8 },
            accessibility: { score: 0.85 },
            'best-practices': { score: 0.9 },
            seo: { score: 0.95 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1500 },
            'largest-contentful-paint': { numericValue: 2800 },
            'cumulative-layout-shift': { numericValue: 0.08 },
            'interaction-to-next-paint': { numericValue: 180 },
            'server-response-time': { numericValue: 500 },
            'speed-index': { numericValue: 2200 },
            'total-blocking-time': { numericValue: 150 },
            'interactive': { numericValue: 3500 },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await runLighthouse('https://example.com');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('strategy=mobile');
    });

    it('should use desktop strategy when specified', async () => {
      const mockResponse = {
        lighthouseResult: {
          categories: {
            performance: { score: 0.9 },
            accessibility: { score: 0.9 },
            'best-practices': { score: 0.95 },
            seo: { score: 0.95 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1000 },
            'largest-contentful-paint': { numericValue: 2000 },
            'cumulative-layout-shift': { numericValue: 0.03 },
            'interaction-to-next-paint': { numericValue: 100 },
            'server-response-time': { numericValue: 300 },
            'speed-index': { numericValue: 1800 },
            'total-blocking-time': { numericValue: 80 },
            'interactive': { numericValue: 2500 },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await runLighthouse('https://example.com', { formFactor: 'desktop' });

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('strategy=desktop');
    });

    it('should handle missing audit values gracefully', async () => {
      const mockResponse = {
        lighthouseResult: {
          categories: {
            performance: { score: 0.7 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1800 },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await runLighthouse('https://example.com');

      expect(result.scores.performance).toBe(70);
      expect(result.metrics.FCP).toBe(1800);
      expect(result.metrics.LCP).toBe(0);
      expect(result.metrics.CLS).toBe(0);
    });

    it('should throw error when API returns error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      await expect(runLighthouse('https://example.com')).rejects.toThrow(
        'PageSpeed Insights API error: 400 - Bad Request'
      );
    });

    it('should throw error when no Lighthouse results returned', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(runLighthouse('https://example.com')).rejects.toThrow(
        'PageSpeed Insights returned no Lighthouse results'
      );
    });

    it('should timeout after specified duration', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );

      await expect(
        runLighthouse('https://example.com', { timeout: 100 })
      ).rejects.toThrow('PageSpeed Insights API timeout');
    });

    it('should include API key in request when provided', async () => {
      const originalKey = process.env.PAGESPEED_API_KEY;
      process.env.PAGESPEED_API_KEY = 'test-api-key';

      const mockResponse = {
        lighthouseResult: {
          categories: {
            performance: { score: 0.85 },
            accessibility: { score: 0.9 },
            'best-practices': { score: 0.88 },
            seo: { score: 0.92 },
          },
          audits: {
            'first-contentful-paint': { numericValue: 1300 },
            'largest-contentful-paint': { numericValue: 2500 },
            'cumulative-layout-shift': { numericValue: 0.06 },
            'interaction-to-next-paint': { numericValue: 160 },
            'server-response-time': { numericValue: 450 },
            'speed-index': { numericValue: 2100 },
            'total-blocking-time': { numericValue: 120 },
            'interactive': { numericValue: 3200 },
          },
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await runLighthouse('https://example.com');

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('key=test-api-key');

      if (originalKey) {
        process.env.PAGESPEED_API_KEY = originalKey;
      } else {
        delete process.env.PAGESPEED_API_KEY;
      }
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTP URLs', () => {
      const result = validateUrl('http://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept URLs with paths and query parameters', () => {
      const result = validateUrl('https://example.com/path?query=value');
      expect(result.valid).toBe(true);
    });

    it('should reject non-HTTP/HTTPS protocols', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only HTTP and HTTPS protocols are supported');
    });

    it('should reject file protocol', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.valid).toBe(false);
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not a url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject URLs without host', () => {
      const result = validateUrl('http://');
      expect(result.valid).toBe(false);
    });

    it('should accept URLs with ports', () => {
      const result = validateUrl('http://localhost:3000');
      expect(result.valid).toBe(true);
    });

    it('should accept subdomains', () => {
      const result = validateUrl('https://www.example.com');
      expect(result.valid).toBe(true);
    });
  });
});
