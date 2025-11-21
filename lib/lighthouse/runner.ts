/**
 * PageSpeed Insights API runner
 * Runs Lighthouse tests via Google's PageSpeed Insights API
 */

import type { LighthouseScores, LighthouseMetrics } from '@/types/lighthouse';

export interface LighthouseRunnerOptions {
  timeout?: number;
  formFactor?: 'mobile' | 'desktop';
  throttling?: boolean;
}

export interface RawLighthouseResult {
  scores: LighthouseScores;
  metrics: LighthouseMetrics;
  fullReport: unknown;
}

/**
 * Default options
 * - timeout: 60 seconds max for analysis
 * - formFactor: Mobile (default for PageSpeed Insights)
 */
const DEFAULT_OPTIONS: LighthouseRunnerOptions = {
  timeout: 60000, // 60 seconds
  formFactor: 'mobile',
  throttling: true,
};

// PageSpeed Insights API configuration
const PAGESPEED_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * PageSpeed Insights API Response Interface
 */
interface PageSpeedResponse {
  lighthouseResult: {
    categories: {
      performance?: { score: number };
      accessibility?: { score: number };
      'best-practices'?: { score: number };
      seo?: { score: number };
    };
    audits: {
      [key: string]: {
        numericValue?: number;
        score?: number;
        displayValue?: string;
      };
    };
  };
}

/**
 * Run Lighthouse test via PageSpeed Insights API
 */
export async function runLighthouse(
  url: string,
  options: LighthouseRunnerOptions = {}
): Promise<RawLighthouseResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Build API URL with parameters
  const apiUrl = new URL(PAGESPEED_API_URL);
  apiUrl.searchParams.set('url', url);
  apiUrl.searchParams.set('strategy', opts.formFactor === 'desktop' ? 'desktop' : 'mobile');

  // Add API key if available (optional but recommended for production)
  const apiKey = process.env.PAGESPEED_API_KEY;
  if (apiKey) {
    apiUrl.searchParams.set('key', apiKey);
  }

  // Request specific Lighthouse categories
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  categories.forEach(category => {
    apiUrl.searchParams.append('category', category);
  });

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('PageSpeed Insights API timeout')), opts.timeout);
  });

  // Make API request with timeout
  const fetchPromise = fetch(apiUrl.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  const response = await Promise.race([fetchPromise, timeoutPromise]);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PageSpeed Insights API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as PageSpeedResponse;

  if (!data.lighthouseResult) {
    throw new Error('PageSpeed Insights returned no Lighthouse results');
  }

  const lhr = data.lighthouseResult;

  // Extract scores (convert from 0-1 to 0-100)
  const scores: LighthouseScores = {
    performance: (lhr.categories.performance?.score || 0) * 100,
    accessibility: (lhr.categories.accessibility?.score || 0) * 100,
    bestPractices: (lhr.categories['best-practices']?.score || 0) * 100,
    seo: (lhr.categories.seo?.score || 0) * 100,
  };

  // Extract metrics (in milliseconds)
  const metrics: LighthouseMetrics = {
    FCP: lhr.audits['first-contentful-paint']?.numericValue || 0,
    LCP: lhr.audits['largest-contentful-paint']?.numericValue || 0,
    CLS: lhr.audits['cumulative-layout-shift']?.numericValue || 0,
    INP: lhr.audits['interaction-to-next-paint']?.numericValue || 0,
    TTFB: lhr.audits['server-response-time']?.numericValue || 0,
    SI: lhr.audits['speed-index']?.numericValue || 0,
    TBT: lhr.audits['total-blocking-time']?.numericValue || 0,
    speedIndex: lhr.audits['speed-index']?.numericValue || 0,
    totalBlockingTime: lhr.audits['total-blocking-time']?.numericValue || 0,
    interactive: lhr.audits['interactive']?.numericValue || 0,
  };

  return {
    scores,
    metrics,
    fullReport: lhr,
  };
}

/**
 * Validate URL before running Lighthouse
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are supported',
      };
    }

    // Must have a host
    if (!parsed.host) {
      return {
        valid: false,
        error: 'URL must include a valid hostname',
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error: 'Invalid URL format',
    };
  }
}
