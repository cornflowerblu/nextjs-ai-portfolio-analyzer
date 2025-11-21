/**
 * Tests for Lighthouse runner
 */

import { describe, it, expect } from 'vitest';
import { validateUrl } from '@/lib/lighthouse/runner';

describe('Lighthouse Runner', () => {
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
