/**
 * Lighthouse test runner
 * Executes Lighthouse tests programmatically on URLs
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

const DEFAULT_OPTIONS: LighthouseRunnerOptions = {
  timeout: 60000, // 60 seconds
  formFactor: 'mobile',
  throttling: true,
};

/**
 * Run Lighthouse test on a URL
 */
export async function runLighthouse(
  url: string,
  options: LighthouseRunnerOptions = {}
): Promise<RawLighthouseResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Dynamic import for lighthouse and chrome-launcher (server-side only)
  const lighthouse = (await import('lighthouse')).default;
  const chromeLauncher = await import('chrome-launcher');
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  try {
    // Configure Lighthouse options
    const lighthouseOptions = {
      logLevel: 'error' as const,
      output: 'json' as const,
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: opts.formFactor,
      throttling: opts.throttling ? {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      } : undefined,
      screenEmulation: {
        mobile: opts.formFactor === 'mobile',
        width: opts.formFactor === 'mobile' ? 375 : 1920,
        height: opts.formFactor === 'mobile' ? 667 : 1080,
        deviceScaleFactor: opts.formFactor === 'mobile' ? 2 : 1,
        disabled: false,
      },
    };

    // Run Lighthouse with timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Lighthouse timeout')), opts.timeout);
    });

    const runnerResult = await Promise.race([
      lighthouse(url, lighthouseOptions),
      timeoutPromise,
    ]);

    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse returned no results');
    }

    const lhr = runnerResult.lhr;

    // Extract scores
    const scores: LighthouseScores = {
      performance: (lhr.categories.performance?.score || 0) * 100,
      accessibility: (lhr.categories.accessibility?.score || 0) * 100,
      bestPractices: (lhr.categories['best-practices']?.score || 0) * 100,
      seo: (lhr.categories.seo?.score || 0) * 100,
    };

    // Extract metrics
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
  } finally {
    // Always kill Chrome
    await chrome.kill();
  }
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
