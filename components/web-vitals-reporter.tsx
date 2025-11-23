/**
 * Web Vitals Reporter
 * Captures and reports Core Web Vitals metrics
 */

'use client';

import { useEffect, useRef } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { getIdToken } from '@/lib/firebase/auth';

type RenderingStrategy = 'SSR' | 'SSG' | 'ISR' | 'CACHE';

/**
 * T006: Determine rendering strategy from URL pathname
 * Extracts strategy from /lab/{strategy} routes
 */
function determineStrategy(pathname: string): RenderingStrategy | null {
  // Match /lab/ssr, /lab/ssg, /lab/isr, /lab/cache patterns
  const match = pathname.match(/^\/lab\/(ssr|ssg|isr|cache)$/i);
  if (!match) {
    return null; // Not a lab demo route
  }
  
  // Convert to uppercase to match RenderingStrategy enum
  return match[1].toUpperCase() as RenderingStrategy;
}

/**
 * T007: Save metric to database via API
 * Sends Web Vitals metric to /api/web-vitals endpoint with authentication
 */
async function saveMetricToDatabase(
  metricName: string,
  metricValue: number,
  url: string,
  strategy: RenderingStrategy
): Promise<void> {
  try {
    // Get Firebase ID token for authentication
    const idToken = await getIdToken();
    
    if (!idToken) {
      // User not authenticated - fail silently
      console.debug('Web Vitals: Skipping database save (not authenticated)');
      return;
    }

    // Map metric names to API field names
    const metricFieldMap: Record<string, string> = {
      'LCP': 'lcpMs',
      'CLS': 'cls',
      'INP': 'inpMs',
      'FID': 'fidMs',
      'TTFB': 'ttfbMs',
    };

    const fieldName = metricFieldMap[metricName];
    if (!fieldName) {
      // Unknown metric - skip
      console.debug(`Web Vitals: Unknown metric type: ${metricName}`);
      return;
    }

    // Build request body with only the captured metric
    const body: Record<string, unknown> = {
      url,
      strategy,
      [fieldName]: metricValue,
    };

    // POST to API endpoint
    const response = await fetch('/api/web-vitals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('Web Vitals: Failed to save metric:', error);
    } else {
      console.debug(`Web Vitals: Saved ${metricName} to database`);
    }
  } catch (error) {
    // T016: Fail silently - don't break user experience
    console.debug('Web Vitals: Error saving metric:', error);
  }
}

export function WebVitalsReporter() {
  // Track which metrics we've already saved to avoid duplicates
  const savedMetrics = useRef<Set<string>>(new Set());

  useReportWebVitals((metric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', metric);
    }

    // T008: Wire callbacks to save metrics to database
    // Only save for lab demo routes
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const strategy = determineStrategy(pathname);
      
      if (strategy) {
        // Create unique key for this metric to prevent duplicates
        const metricKey = `${pathname}-${metric.name}`;
        
        if (!savedMetrics.current.has(metricKey)) {
          savedMetrics.current.add(metricKey);
          
          // Save to database (async, doesn't block)
          saveMetricToDatabase(
            metric.name,
            metric.value,
            window.location.href,
            strategy
          );
        }
      }
    }

    // In production, send to analytics service
    // Example: Google Analytics, Vercel Analytics, etc.
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });

  // Track page views and reset saved metrics on navigation
  useEffect(() => {
    // Reset saved metrics when pathname changes
    savedMetrics.current.clear();

    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Track initial page view
      // You can integrate with analytics services here
    }
  }, []);

  return null;
}

// TypeScript augmentation for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}
