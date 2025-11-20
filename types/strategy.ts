/**
 * Next.js rendering strategy types
 * Covers SSR, SSG, ISR, and Cache Components (Next.js 16)
 */

/**
 * Available rendering strategies in Next.js
 */
export type RenderingStrategyType = 'SSR' | 'SSG' | 'ISR' | 'CACHE';

/**
 * Complete rendering strategy definition
 */
export interface RenderingStrategy {
  id: RenderingStrategyType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string; // CSS variable reference
  characteristics: {
    renderTime: 'request' | 'build' | 'hybrid';
    cacheability: 'none' | 'full' | 'partial' | 'component-level';
    dataFreshness: 'always-fresh' | 'stale-while-revalidate' | 'static';
    scalability: 'low' | 'medium' | 'high' | 'very-high';
  };
  useCases: string[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  nextjsConfig?: {
    dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static';
    revalidate?: number | false;
    cache?: 'force-cache' | 'no-store';
  };
}

/**
 * Predefined rendering strategies
 */
export const RENDERING_STRATEGIES: Record<RenderingStrategyType, RenderingStrategy> = {
  SSR: {
    id: 'SSR',
    name: 'Server-Side Rendering',
    displayName: 'SSR',
    description: 'Render on every request with always-fresh data',
    icon: '🔄',
    color: 'var(--strategy-ssr)',
    characteristics: {
      renderTime: 'request',
      cacheability: 'none',
      dataFreshness: 'always-fresh',
      scalability: 'low',
    },
    useCases: [
      'User-specific content',
      'Real-time dashboards',
      'Frequently changing data',
      'Personalized experiences',
    ],
    tradeoffs: {
      pros: [
        'Always up-to-date data',
        'No stale content',
        'Dynamic per-request',
      ],
      cons: [
        'Slower initial load',
        'Higher server cost',
        'TTFB depends on data fetch',
      ],
    },
    nextjsConfig: {
      dynamic: 'force-dynamic',
      cache: 'no-store',
    },
  },
  SSG: {
    id: 'SSG',
    name: 'Static Site Generation',
    displayName: 'SSG',
    description: 'Pre-render at build time for maximum performance',
    icon: '⚡',
    color: 'var(--strategy-ssg)',
    characteristics: {
      renderTime: 'build',
      cacheability: 'full',
      dataFreshness: 'static',
      scalability: 'very-high',
    },
    useCases: [
      'Marketing pages',
      'Blog posts',
      'Documentation',
      'Product catalogs (infrequent updates)',
    ],
    tradeoffs: {
      pros: [
        'Fastest initial load',
        'Lowest TTFB',
        'No server compute cost',
        'Perfect for CDN',
      ],
      cons: [
        'Data can be stale',
        'Requires rebuild for updates',
        'Long build times with many pages',
      ],
    },
    nextjsConfig: {
      dynamic: 'force-static',
    },
  },
  ISR: {
    id: 'ISR',
    name: 'Incremental Static Regeneration',
    displayName: 'ISR',
    description: 'Static generation with periodic revalidation',
    icon: '🔄⚡',
    color: 'var(--strategy-isr)',
    characteristics: {
      renderTime: 'hybrid',
      cacheability: 'partial',
      dataFreshness: 'stale-while-revalidate',
      scalability: 'high',
    },
    useCases: [
      'E-commerce product pages',
      'News articles',
      'Content that updates periodically',
      'High-traffic dynamic content',
    ],
    tradeoffs: {
      pros: [
        'Fast initial load',
        'Automatic revalidation',
        'Scales well',
        'Balance of fresh and fast',
      ],
      cons: [
        'Can serve stale content',
        'Revalidation delays',
        'More complex caching',
      ],
    },
    nextjsConfig: {
      revalidate: 60, // seconds
    },
  },
  CACHE: {
    id: 'CACHE',
    name: 'Cache Components',
    displayName: 'Cache Components',
    description: 'Next.js 16 component-level caching with cache directive',
    icon: '💾',
    color: 'var(--strategy-cache)',
    characteristics: {
      renderTime: 'hybrid',
      cacheability: 'component-level',
      dataFreshness: 'stale-while-revalidate',
      scalability: 'high',
    },
    useCases: [
      'Mixed static/dynamic pages',
      'Partial page caching',
      'Expensive component renders',
      'Fine-grained cache control',
    ],
    tradeoffs: {
      pros: [
        'Granular cache control',
        'Mix static and dynamic',
        'Optimize hot paths',
        'Flexible revalidation',
      ],
      cons: [
        'Complex cache strategy',
        'Newer feature (learning curve)',
        'Requires careful planning',
      ],
    },
    nextjsConfig: {
      cache: 'force-cache',
    },
  },
};

/**
 * Strategy comparison metrics
 */
export interface StrategyComparison {
  strategies: RenderingStrategyType[];
  metrics: {
    [key in RenderingStrategyType]: {
      avgFCP: number;
      avgLCP: number;
      avgCLS: number;
      avgINP: number;
      avgTTFB: number;
      sampleSize: number;
    };
  };
  winner: {
    fcp: RenderingStrategyType;
    lcp: RenderingStrategyType;
    cls: RenderingStrategyType;
    inp: RenderingStrategyType;
    ttfb: RenderingStrategyType;
  };
}

/**
 * Strategy recommendation based on analysis
 */
export interface StrategyRecommendation {
  recommended: RenderingStrategyType;
  confidence: number; // 0-1
  reasoning: string[];
  expectedImprovement: {
    fcp?: number; // percentage
    lcp?: number;
    cls?: number;
    inp?: number;
    ttfb?: number;
  };
  migrationComplexity: 'low' | 'medium' | 'high';
  estimatedEffort: string; // e.g., "2-3 days"
}
