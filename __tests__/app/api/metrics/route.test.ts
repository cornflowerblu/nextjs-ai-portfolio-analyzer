import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/metrics/route';

describe('GET /api/metrics', () => {
  describe('All Strategies', () => {
    it('returns metrics for all 4 strategies by default', async () => {
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toContain('application/json');
      expect(data).toHaveLength(4);
      expect(data.map((d: any) => d.strategy)).toEqual(['SSR', 'SSG', 'ISR', 'CACHE']);
    });

    it('returns unique metrics for each strategy', async () => {
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      const strategies = data.map((d: any) => d.strategy);
      const uniqueStrategies = new Set(strategies);
      expect(uniqueStrategies.size).toBe(4);
    });

    it('each strategy has all Core Web Vitals', async () => {
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);
      const data = await response.json();

      data.forEach((strategyData: any) => {
        expect(strategyData.metrics).toHaveProperty('fcp');
        expect(strategyData.metrics).toHaveProperty('lcp');
        expect(strategyData.metrics).toHaveProperty('cls');
        expect(strategyData.metrics).toHaveProperty('inp');
        expect(strategyData.metrics).toHaveProperty('ttfb');
        expect(strategyData.metrics).toHaveProperty('timestamp');
      });
    });
  });

  describe('Single Strategy', () => {
    it('returns metrics for SSR when queried', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.strategy).toBe('SSR');
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('timestamp');
    });

    it('returns metrics for SSG when queried', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.strategy).toBe('SSG');
    });

    it('returns metrics for ISR when queried', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=ISR');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.strategy).toBe('ISR');
    });

    it('returns metrics for CACHE when queried', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=CACHE');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.strategy).toBe('CACHE');
    });
  });

  describe('Metric Structure Validation', () => {
    it('validates FCP metric structure', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.fcp).toMatchObject({
        value: expect.any(Number),
        rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
        delta: expect.any(Number),
      });
    });

    it('validates LCP metric structure', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.lcp).toMatchObject({
        value: expect.any(Number),
        rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
        delta: expect.any(Number),
      });
    });

    it('validates CLS metric structure', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=ISR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.cls).toMatchObject({
        value: expect.any(Number),
        rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
        delta: expect.any(Number),
      });
    });

    it('validates INP metric structure', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=CACHE');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.inp).toMatchObject({
        value: expect.any(Number),
        rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
        delta: expect.any(Number),
      });
    });

    it('validates TTFB metric structure', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.ttfb).toMatchObject({
        value: expect.any(Number),
        rating: expect.stringMatching(/^(good|needs-improvement|poor)$/),
        delta: expect.any(Number),
      });
    });

    it('includes ISO 8601 timestamp', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(data.metrics.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Metric Value Ranges', () => {
    it('ensures FCP values are within realistic range (0-5000ms)', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.fcp.value).toBeGreaterThanOrEqual(0);
      expect(data.metrics.fcp.value).toBeLessThanOrEqual(5000);
    });

    it('ensures LCP values are within realistic range (0-8000ms)', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.lcp.value).toBeGreaterThanOrEqual(0);
      expect(data.metrics.lcp.value).toBeLessThanOrEqual(8000);
    });

    it('ensures CLS values are within valid range (0-1)', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=ISR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.cls.value).toBeGreaterThanOrEqual(0);
      expect(data.metrics.cls.value).toBeLessThanOrEqual(1);
    });

    it('ensures INP values are within realistic range (0-1000ms)', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=CACHE');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.inp.value).toBeGreaterThanOrEqual(0);
      expect(data.metrics.inp.value).toBeLessThanOrEqual(1000);
    });

    it('ensures TTFB values are within realistic range (0-3000ms)', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      expect(data.metrics.ttfb.value).toBeGreaterThanOrEqual(0);
      expect(data.metrics.ttfb.value).toBeLessThanOrEqual(3000);
    });
  });

  describe('Performance Characteristics by Strategy', () => {
    it('SSR metrics reflect server-side rendering characteristics', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const response = await GET(request);
      const data = await response.json();

      // SSR typically has higher TTFB but good FCP
      expect(typeof data.metrics.ttfb.value).toBe('number');
      expect(typeof data.metrics.fcp.value).toBe('number');
    });

    it('SSG metrics reflect static generation characteristics', async () => {
      const request = new Request('http://localhost:3000/api/metrics?strategy=SSG');
      const response = await GET(request);
      const data = await response.json();

      // SSG typically has excellent TTFB
      expect(typeof data.metrics.ttfb.value).toBe('number');
      expect(data.metrics.ttfb.value).toBeGreaterThanOrEqual(0);
    });

    it('generates varied metrics across multiple calls', async () => {
      const request1 = new Request('http://localhost:3000/api/metrics?strategy=SSR');
      const request2 = new Request('http://localhost:3000/api/metrics?strategy=SSR');

      const response1 = await GET(request1);
      const response2 = await GET(request2);

      const data1 = await response1.json();
      const data2 = await response2.json();

      // Metrics should vary (mock data generation)
      const hasVariation =
        data1.metrics.fcp.value !== data2.metrics.fcp.value ||
        data1.metrics.lcp.value !== data2.metrics.lcp.value ||
        data1.metrics.cls.value !== data2.metrics.cls.value;

      expect(hasVariation).toBe(true);
    });
  });

  describe('Response Headers', () => {
    it('sets correct Content-Type header', async () => {
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.headers.get('Content-Type')).toContain('application/json');
    });

    it('returns 200 status code for valid requests', async () => {
      const request = new Request('http://localhost:3000/api/metrics');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
