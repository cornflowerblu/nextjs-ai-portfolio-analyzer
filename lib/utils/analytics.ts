/**
 * Analytics Helper
 * Track user interactions and events
 */

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

/**
 * Track a custom event
 */
export function trackEvent({ action, category, label, value }: AnalyticsEvent): void {
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Analytics Event:', { action, category, label, value });
  }

  // Google Analytics 4
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  // Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va(action, { category, label, value });
  }

  // Custom analytics endpoint (optional)
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, category, label, value, timestamp: Date.now() }),
    }).catch(() => {
      // Silently fail - analytics should not break app functionality
    });
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || '', {
      page_path: path,
    });
  }

  if (typeof window !== 'undefined' && window.va) {
    window.va('pageview', { path });
  }
}

/**
 * Common event trackers
 */
export const analytics = {
  // Demo interactions
  triggerDemo: (strategy: string) => {
    trackEvent({
      action: 'trigger_demo',
      category: 'Lab',
      label: strategy,
    });
  },

  // URL analysis
  analyzeUrl: (url: string) => {
    trackEvent({
      action: 'analyze_url',
      category: 'Analyze',
      label: url,
    });
  },

  // AI interactions
  requestInsights: (metricType: string) => {
    trackEvent({
      action: 'request_insights',
      category: 'AI',
      label: metricType,
    });
  },

  askQuestion: (question: string) => {
    trackEvent({
      action: 'ask_question',
      category: 'AI',
      label: question.substring(0, 100), // Truncate for privacy
    });
  },

  // Export actions
  exportReport: (format: 'pdf' | 'markdown' | 'json') => {
    trackEvent({
      action: 'export_report',
      category: 'Export',
      label: format,
    });
  },

  // Platform demos
  testPlatformFeature: (feature: string) => {
    trackEvent({
      action: 'test_feature',
      category: 'Platform',
      label: feature,
    });
  },

  // Trends
  viewTrends: (dateRange: string) => {
    trackEvent({
      action: 'view_trends',
      category: 'Trends',
      label: dateRange,
    });
  },

  // Navigation
  navigateTo: (section: string) => {
    trackEvent({
      action: 'navigate',
      category: 'Navigation',
      label: section,
    });
  },
};

// TypeScript augmentation
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
    va?: (event: string, data?: Record<string, unknown>) => void;
  }
}
