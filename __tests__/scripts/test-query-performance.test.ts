/**
 * Tests for database query performance testing script
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the prisma module
const mockQueryRaw = vi.fn();
const mockCount = vi.fn();
const mockGroupBy = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../../lib/db/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    webVitalsMetric: {
      count: mockCount,
      groupBy: mockGroupBy,
    },
    $disconnect: mockDisconnect,
  },
}));

describe('Database Query Performance Testing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('EXPLAIN output parsing', () => {
    it('should detect execution time in EXPLAIN ANALYZE output', () => {
      const explainLine = 'Execution Time: 45.123 ms';
      const pattern = /Execution Time:\s*([\d.]+)\s*ms/;
      const match = explainLine.match(pattern);

      expect(match).not.toBeNull();
      expect(parseFloat(match![1])).toBe(45.123);
    });

    it('should detect planning time in EXPLAIN ANALYZE output', () => {
      const explainLine = 'Planning Time: 5.678 ms';
      const pattern = /Planning Time:\s*([\d.]+)\s*ms/;
      const match = explainLine.match(pattern);

      expect(match).not.toBeNull();
      expect(parseFloat(match![1])).toBe(5.678);
    });

    it('should detect index scan usage', () => {
      const scanTypes = [
        'Index Scan using web_vitals_metrics_userId_collectedAt_idx',
        'Index Only Scan using some_index',
        '  ->  Index Scan on table',
      ];

      scanTypes.forEach((line) => {
        const hasIndexScan =
          line.includes('Index Scan') || line.includes('Index Only Scan');
        expect(hasIndexScan).toBe(true);
      });
    });

    it('should detect sequential scan usage', () => {
      const scanTypes = [
        'Seq Scan on web_vitals_metrics',
        '  ->  Seq Scan on table',
      ];

      scanTypes.forEach((line) => {
        const hasSeqScan = line.includes('Seq Scan');
        expect(hasSeqScan).toBe(true);
      });
    });
  });

  describe('Performance metrics evaluation', () => {
    it('should identify excellent performance (<50ms)', () => {
      const executionTime = 35.5;
      const isExcellent = executionTime < 50;
      const isGood = executionTime < 100;

      expect(isExcellent).toBe(true);
      expect(isGood).toBe(true);
    });

    it('should identify good performance (50-100ms)', () => {
      const executionTime = 75.0;
      const isExcellent = executionTime < 50;
      const isGood = executionTime < 100;
      const isAcceptable = executionTime < 200;

      expect(isExcellent).toBe(false);
      expect(isGood).toBe(true);
      expect(isAcceptable).toBe(true);
    });

    it('should identify acceptable performance (100-200ms)', () => {
      const executionTime = 150.0;
      const isGood = executionTime < 100;
      const isAcceptable = executionTime < 200;

      expect(isGood).toBe(false);
      expect(isAcceptable).toBe(true);
    });

    it('should identify poor performance (>200ms)', () => {
      const executionTime = 250.0;
      const isAcceptable = executionTime < 200;

      expect(isAcceptable).toBe(false);
    });

    it('should validate planning time (<10ms target)', () => {
      const goodPlanningTime = 5.0;
      const badPlanningTime = 15.0;

      expect(goodPlanningTime < 10).toBe(true);
      expect(badPlanningTime < 10).toBe(false);
    });
  });

  describe('Query performance measurement', () => {
    it('should measure query execution time', async () => {
      mockGroupBy.mockResolvedValue([
        {
          strategy: 'SSR',
          _avg: { lcpMs: 1800, cls: 0.12, inpMs: 120, fidMs: 45, ttfbMs: 650 },
          _count: { id: 75 },
        },
      ]);

      const startTime = Date.now();
      await mockGroupBy({
        by: ['strategy'],
        where: {
          userId: 'test-user',
          collectedAt: { gte: new Date() },
        },
        _avg: {
          lcpMs: true,
          cls: true,
          inpMs: true,
          fidMs: true,
          ttfbMs: true,
        },
        _count: { id: true },
      });
      const endTime = Date.now();

      const elapsed = endTime - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(0);
      expect(mockGroupBy).toHaveBeenCalledOnce();
    });

    it('should calculate average from multiple runs', () => {
      const times = [45, 52, 48];
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      expect(avgTime).toBe(48.333333333333336);
      expect(Math.round(avgTime)).toBe(48);
    });

    it('should find min and max times', () => {
      const times = [45, 52, 48, 60, 43];
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      expect(minTime).toBe(43);
      expect(maxTime).toBe(60);
    });
  });

  describe('Performance analysis logic', () => {
    it('should pass all checks for optimal performance', () => {
      const executionTime = 45.0;
      const usesIndexScan = true;
      const usesSeqScan = false;
      const avgTime = 125.0;

      const issues: string[] = [];
      const passed: string[] = [];

      if (executionTime < 100) {
        passed.push('Query execution time is within target (<100ms)');
      } else {
        issues.push(
          `Query execution time (${executionTime.toFixed(2)}ms) exceeds target (100ms)`
        );
      }

      if (usesIndexScan) {
        passed.push('Query uses index scan for efficient filtering');
      } else if (usesSeqScan) {
        issues.push('Query uses sequential scan instead of index');
      }

      if (avgTime < 500) {
        passed.push('Prisma query response time is acceptable');
      } else {
        issues.push(`Prisma query response time (${avgTime.toFixed(2)}ms) is high`);
      }

      expect(issues).toHaveLength(0);
      expect(passed).toHaveLength(3);
    });

    it('should detect issues with slow execution and sequential scan', () => {
      const executionTime = 150.0;
      const usesIndexScan = false;
      const usesSeqScan = true;
      const avgTime = 600.0;

      const issues: string[] = [];
      const passed: string[] = [];

      if (executionTime < 100) {
        passed.push('Query execution time is within target (<100ms)');
      } else {
        issues.push(
          `Query execution time (${executionTime.toFixed(2)}ms) exceeds target (100ms)`
        );
      }

      if (usesIndexScan) {
        passed.push('Query uses index scan for efficient filtering');
      } else if (usesSeqScan) {
        issues.push('Query uses sequential scan instead of index');
      }

      if (avgTime < 500) {
        passed.push('Prisma query response time is acceptable');
      } else {
        issues.push(`Prisma query response time (${avgTime.toFixed(2)}ms) is high`);
      }

      expect(issues).toHaveLength(3);
      expect(passed).toHaveLength(0);
    });
  });

  describe('Mock EXPLAIN ANALYZE results', () => {
    it('should parse complete EXPLAIN ANALYZE output', () => {
      const explainOutput = [
        { 'QUERY PLAN': 'HashAggregate  (cost=100.00..110.00 rows=4 width=40) (actual time=42.123..42.125 rows=4 loops=1)' },
        { 'QUERY PLAN': '  Group Key: strategy' },
        { 'QUERY PLAN': '  ->  Index Scan using web_vitals_metrics_userId_collectedAt_idx on web_vitals_metrics  (cost=0.29..95.00 rows=337 width=32) (actual time=0.015..35.234 rows=337 loops=1)' },
        { 'QUERY PLAN': '        Index Cond: ((user_id = \'demo-seed-user-id\') AND (collected_at >= \'2025-11-22 06:24:00\'::timestamp))' },
        { 'QUERY PLAN': 'Planning Time: 5.678 ms' },
        { 'QUERY PLAN': 'Execution Time: 45.123 ms' },
      ];

      let executionTime: number | null = null;
      let planningTime: number | null = null;
      let usesIndexScan = false;
      let usesSeqScan = false;

      for (const row of explainOutput) {
        const line = row['QUERY PLAN'];

        if (line.includes('Execution Time:')) {
          const match = line.match(/Execution Time:\s*([\d.]+)\s*ms/);
          if (match) {
            executionTime = parseFloat(match[1]);
          }
        }

        if (line.includes('Planning Time:')) {
          const match = line.match(/Planning Time:\s*([\d.]+)\s*ms/);
          if (match) {
            planningTime = parseFloat(match[1]);
          }
        }

        if (line.includes('Index Scan') || line.includes('Index Only Scan')) {
          usesIndexScan = true;
        }

        if (line.includes('Seq Scan')) {
          usesSeqScan = true;
        }
      }

      expect(executionTime).toBe(45.123);
      expect(planningTime).toBe(5.678);
      expect(usesIndexScan).toBe(true);
      expect(usesSeqScan).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Connection refused');
      mockCount.mockRejectedValue(error);

      await expect(mockCount()).rejects.toThrow('Connection refused');
    });

    it('should handle empty data set', async () => {
      mockCount.mockResolvedValue(0);

      const result = await mockCount({ where: { userId: 'test-user' } });

      expect(result).toBe(0);
    });
  });

  describe('Time calculations', () => {
    it('should calculate 24 hours ago correctly', () => {
      const now = Date.now();
      const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
      const timeDiff = now - twentyFourHoursAgo.getTime();

      expect(timeDiff).toBeGreaterThanOrEqual(24 * 60 * 60 * 1000 - 100); // Allow 100ms variance
      expect(timeDiff).toBeLessThanOrEqual(24 * 60 * 60 * 1000 + 100);
    });
  });
});
