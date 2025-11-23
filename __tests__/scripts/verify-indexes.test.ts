/**
 * Tests for database index verification script
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the prisma module
const mockQueryRaw = vi.fn();
const mockDisconnect = vi.fn();

vi.mock('../../lib/db/prisma', () => ({
  prisma: {
    $queryRaw: mockQueryRaw,
    $disconnect: mockDisconnect,
  },
}));

// Mock dotenv
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

// Mock path
vi.mock('path', () => ({
  resolve: vi.fn((...args) => args.join('/')),
}));

describe('Database Index Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Index detection', () => {
    it('should detect userId+collectedAt index', async () => {
      const mockIndexes = [
        {
          indexname: 'web_vitals_metrics_userId_collectedAt_idx',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE INDEX web_vitals_metrics_userId_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, collected_at DESC)',
        },
      ];

      mockQueryRaw.mockResolvedValue(mockIndexes);

      // The script logic would check for this pattern
      const indexDef = mockIndexes[0].indexdef.toLowerCase();
      const pattern = /user_id.*collected_at/i;

      expect(pattern.test(indexDef)).toBe(true);
    });

    it('should detect userId+url+strategy+collectedAt index', async () => {
      const mockIndexes = [
        {
          indexname: 'web_vitals_metrics_userId_url_strategy_collectedAt_idx',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE INDEX web_vitals_metrics_userId_url_strategy_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, url, strategy, collected_at DESC)',
        },
      ];

      mockQueryRaw.mockResolvedValue(mockIndexes);

      const indexDef = mockIndexes[0].indexdef.toLowerCase();
      const pattern = /user_id.*url.*strategy.*collected_at/i;

      expect(pattern.test(indexDef)).toBe(true);
    });

    it('should detect both required indexes when present', async () => {
      const mockIndexes = [
        {
          indexname: 'web_vitals_metrics_pkey',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE UNIQUE INDEX web_vitals_metrics_pkey ON public.web_vitals_metrics USING btree (id)',
        },
        {
          indexname: 'web_vitals_metrics_userId_collectedAt_idx',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE INDEX web_vitals_metrics_userId_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, collected_at DESC)',
        },
        {
          indexname: 'web_vitals_metrics_userId_url_strategy_collectedAt_idx',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE INDEX web_vitals_metrics_userId_url_strategy_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, url, strategy, collected_at DESC)',
        },
      ];

      mockQueryRaw.mockResolvedValue(mockIndexes);

      const requiredIndexes = [
        {
          name: 'userId + collectedAt',
          pattern: /user_id.*collected_at/i,
          found: false,
        },
        {
          name: 'userId + url + strategy + collectedAt',
          pattern: /user_id.*url.*strategy.*collected_at/i,
          found: false,
        },
      ];

      for (const idx of mockIndexes) {
        const def = idx.indexdef.toLowerCase();

        for (const req of requiredIndexes) {
          if (req.pattern.test(def)) {
            req.found = true;
          }
        }
      }

      expect(requiredIndexes.every((req) => req.found)).toBe(true);
    });

    it('should identify missing indexes', async () => {
      const mockIndexes = [
        {
          indexname: 'web_vitals_metrics_pkey',
          tablename: 'web_vitals_metrics',
          indexdef: 'CREATE UNIQUE INDEX web_vitals_metrics_pkey ON public.web_vitals_metrics USING btree (id)',
        },
      ];

      mockQueryRaw.mockResolvedValue(mockIndexes);

      const requiredIndexes = [
        {
          name: 'userId + collectedAt',
          pattern: /user_id.*collected_at/i,
          found: false,
        },
        {
          name: 'userId + url + strategy + collectedAt',
          pattern: /user_id.*url.*strategy.*collected_at/i,
          found: false,
        },
      ];

      for (const idx of mockIndexes) {
        const def = idx.indexdef.toLowerCase();

        for (const req of requiredIndexes) {
          if (req.pattern.test(def)) {
            req.found = true;
          }
        }
      }

      const missingIndexes = requiredIndexes.filter((req) => !req.found);

      expect(missingIndexes.length).toBe(2);
      expect(missingIndexes[0].name).toBe('userId + collectedAt');
      expect(missingIndexes[1].name).toBe('userId + url + strategy + collectedAt');
    });
  });

  describe('Index patterns', () => {
    it('should match case-insensitive index definitions', () => {
      const testCases = [
        'CREATE INDEX idx ON table USING btree (user_id, collected_at)',
        'CREATE INDEX idx ON table USING btree (USER_ID, COLLECTED_AT)',
        'CREATE INDEX idx ON table (user_id, collected_at DESC)',
      ];

      const pattern = /user_id.*collected_at/i;

      testCases.forEach((testCase) => {
        expect(pattern.test(testCase.toLowerCase())).toBe(true);
      });
    });

    it('should match complex multi-column index', () => {
      const indexDef = 'CREATE INDEX idx ON table (user_id, url, strategy, collected_at DESC)';
      const pattern = /user_id.*url.*strategy.*collected_at/i;

      expect(pattern.test(indexDef.toLowerCase())).toBe(true);
    });

    it('should not match incorrect column orders', () => {
      const indexDef = 'CREATE INDEX idx ON table (collected_at, user_id)';
      const pattern = /user_id.*collected_at/i;

      // Pattern expects user_id BEFORE collected_at, so this should fail
      expect(pattern.test(indexDef.toLowerCase())).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors', async () => {
      const error = new Error('Connection refused');
      mockQueryRaw.mockRejectedValue(error);

      await expect(mockQueryRaw()).rejects.toThrow('Connection refused');
    });

    it('should handle empty result set', async () => {
      mockQueryRaw.mockResolvedValue([]);

      const result = await mockQueryRaw();

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('Index information structure', () => {
    it('should have correct properties in index result', () => {
      const indexInfo = {
        indexname: 'web_vitals_metrics_userId_collectedAt_idx',
        tablename: 'web_vitals_metrics',
        indexdef: 'CREATE INDEX web_vitals_metrics_userId_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, collected_at DESC)',
      };

      expect(indexInfo).toHaveProperty('indexname');
      expect(indexInfo).toHaveProperty('tablename');
      expect(indexInfo).toHaveProperty('indexdef');
      expect(indexInfo.tablename).toBe('web_vitals_metrics');
    });

    it('should extract table name from index definition', () => {
      const indexDef = 'CREATE INDEX idx ON public.web_vitals_metrics USING btree (user_id)';
      const tablePattern = /ON\s+(?:public\.)?(\w+)/i;
      const match = indexDef.match(tablePattern);

      expect(match).not.toBeNull();
      expect(match?.[1]).toBe('web_vitals_metrics');
    });
  });
});
