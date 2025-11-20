/**
 * Performance Observer API wrapper for Core Web Vitals capture
 * Client-side utility for measuring FCP, LCP, CLS, INP, TTFB
 */

'use client';

import type { FCP, LCP, CLS, INP, TTFB, CoreWebVitals } from '@/types/performance';
import { getRating, CORE_WEB_VITALS_THRESHOLDS } from '@/types/performance';

/**
 * Callback type for web vitals metrics
 */
export type WebVitalsCallback = (vitals: Partial<CoreWebVitals>) => void;

/**
 * Internal state for collected metrics
 */
const metricsState: Partial<CoreWebVitals> = {};
const callbacks: Set<WebVitalsCallback> = new Set();

/**
 * Register a callback to receive web vitals updates
 */
export function onWebVitals(callback: WebVitalsCallback): () => void {
  callbacks.add(callback);
  
  // Return unsubscribe function
  return () => {
    callbacks.delete(callback);
  };
}

/**
 * Notify all registered callbacks with current metrics
 */
function notifyCallbacks() {
  callbacks.forEach(callback => callback({ ...metricsState }));
}

/**
 * Initialize web vitals measurement
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return;

  // Measure FCP (First Contentful Paint)
  observeFCP();
  
  // Measure LCP (Largest Contentful Paint)
  observeLCP();
  
  // Measure CLS (Cumulative Layout Shift)
  observeCLS();
  
  // Measure INP (Interaction to Next Paint)
  observeINP();
  
  // Measure TTFB (Time to First Byte)
  measureTTFB();
}

/**
 * Observe First Contentful Paint
 */
function observeFCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          const value = Math.round(entry.startTime);
          const fcp: FCP = {
            value,
            rating: getRating(value, CORE_WEB_VITALS_THRESHOLDS.fcp),
            delta: value,
          };
          
          metricsState.fcp = fcp;
          metricsState.timestamp = new Date().toISOString();
          notifyCallbacks();
          
          observer.disconnect();
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    console.error('FCP observation error:', error);
  }
}

/**
 * Observe Largest Contentful Paint
 */
function observeLCP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    let lcpValue = 0;
    let lcpElement: Element | undefined;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
        element?: Element;
      };
      
      const value = Math.round(lastEntry.renderTime || lastEntry.loadTime || 0);
      
      if (value > lcpValue) {
        lcpValue = value;
        lcpElement = lastEntry.element;
        
        const lcp: LCP = {
          value,
          rating: getRating(value, CORE_WEB_VITALS_THRESHOLDS.lcp),
          delta: value,
          element: lcpElement,
        };
        
        metricsState.lcp = lcp;
        metricsState.timestamp = new Date().toISOString();
        notifyCallbacks();
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });

    // Stop observing on interaction or page hide
    const stopObserving = () => observer.disconnect();
    ['keydown', 'click', 'scroll'].forEach(type => {
      addEventListener(type, stopObserving, { once: true, capture: true });
    });
    addEventListener('pagehide', stopObserving, { once: true });
  } catch (error) {
    console.error('LCP observation error:', error);
  }
}

/**
 * Observe Cumulative Layout Shift
 */
function observeCLS() {
  if (!('PerformanceObserver' in window)) return;

  try {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          clsValue += (entry as PerformanceEntry & { value: number }).value;
          
          const cls: CLS = {
            value: Math.round(clsValue * 10000) / 10000, // Round to 4 decimals
            rating: getRating(clsValue, CORE_WEB_VITALS_THRESHOLDS.cls),
            delta: clsValue,
          };
          
          metricsState.cls = cls;
          metricsState.timestamp = new Date().toISOString();
          notifyCallbacks();
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.error('CLS observation error:', error);
  }
}

/**
 * Observe Interaction to Next Paint
 */
function observeINP() {
  if (!('PerformanceObserver' in window)) return;

  try {
    const interactions: number[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = (entry as PerformanceEntry & { duration: number }).duration;
        interactions.push(duration);
        
        // INP is the worst (98th percentile) interaction
        const sortedInteractions = [...interactions].sort((a, b) => b - a);
        let value: number;
        if (sortedInteractions.length < 50) {
          value = Math.round(sortedInteractions[0] || 0); // max duration
        } else {
          const p98Index = Math.max(0, Math.floor(sortedInteractions.length * 0.02));
          value = Math.round(sortedInteractions[p98Index] || 0);
        }
        
        const inp: INP = {
          value,
          rating: getRating(value, CORE_WEB_VITALS_THRESHOLDS.inp),
          delta: value,
        };
        
        metricsState.inp = inp;
        metricsState.timestamp = new Date().toISOString();
        notifyCallbacks();
      }
    });

    observer.observe({ entryTypes: ['event'] });
  } catch (error) {
    console.error('INP observation error:', error);
  }
}

/**
 * Measure Time to First Byte
 */
function measureTTFB() {
  if (typeof window === 'undefined' || !('performance' in window)) return;

  try {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigationTiming) {
      const value = Math.round(navigationTiming.responseStart - navigationTiming.requestStart);
      
      const ttfb: TTFB = {
        value,
        rating: getRating(value, CORE_WEB_VITALS_THRESHOLDS.ttfb),
        delta: value,
      };
      
      metricsState.ttfb = ttfb;
      metricsState.timestamp = new Date().toISOString();
      notifyCallbacks();
    }
  } catch (error) {
    console.error('TTFB measurement error:', error);
  }
}

/**
 * Get current collected metrics
 */
export function getCurrentMetrics(): Partial<CoreWebVitals> {
  return { ...metricsState };
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
  Object.keys(metricsState).forEach(key => {
    delete metricsState[key as keyof typeof metricsState];
  });
  notifyCallbacks();
}

/**
 * Check if all core metrics have been collected
 */
export function areAllMetricsCollected(): boolean {
  return !!(
    metricsState.fcp &&
    metricsState.lcp &&
    metricsState.cls &&
    metricsState.inp &&
    metricsState.ttfb
  );
}

/**
 * Wait for all metrics to be collected (with timeout)
 */
export function waitForMetrics(timeoutMs = 10000): Promise<CoreWebVitals> {
  return new Promise((resolve, reject) => {
    if (areAllMetricsCollected()) {
      resolve(metricsState as CoreWebVitals);
      return;
    }

    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timeout waiting for metrics'));
    }, timeoutMs);

    const unsubscribe = onWebVitals((vitals) => {
      if (areAllMetricsCollected()) {
        clearTimeout(timeout);
        unsubscribe();
        resolve(vitals as CoreWebVitals);
      }
    });
  });
}
