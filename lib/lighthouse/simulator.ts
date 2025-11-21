/**
 * Strategy simulator
 * Estimates performance improvements with different rendering strategies
 */

import type {
  RenderingStrategy,
  StrategyRecommendation,
  LighthouseScores,
  LighthouseMetrics,
  CoreWebVitalsMetrics,
} from '@/types/lighthouse';

/**
 * Simulate performance with different rendering strategies
 */
export function simulateStrategies(
  currentScores: LighthouseScores,
  currentMetrics: LighthouseMetrics
): RenderingStrategy[] {
  const strategies: RenderingStrategy[] = [
    simulateSSR(currentScores, currentMetrics),
    simulateSSG(currentScores, currentMetrics),
    simulateISR(currentScores, currentMetrics),
    simulateCacheComponents(currentScores, currentMetrics),
  ];

  return strategies;
}

/**
 * Simulate SSR (Server-Side Rendering)
 */
function simulateSSR(
  currentScores: LighthouseScores,
  currentMetrics: LighthouseMetrics
): RenderingStrategy {
  // SSR typically improves TTFB slightly but maintains good FCP/LCP
  const estimatedMetrics: Partial<CoreWebVitalsMetrics> = {
    TTFB: currentMetrics.TTFB * 0.9, // 10% improvement
    FCP: currentMetrics.FCP * 0.95, // 5% improvement
    LCP: currentMetrics.LCP * 0.95, // 5% improvement
  };

  const estimatedScores: LighthouseScores = {
    performance: Math.min(100, currentScores.performance + 5),
    accessibility: currentScores.accessibility,
    bestPractices: currentScores.bestPractices,
    seo: Math.min(100, currentScores.seo + 5),
  };

  return {
    id: 'ssr',
    name: 'Server-Side Rendering (SSR)',
    description: 'Render pages on the server for each request. Great for dynamic, personalized content.',
    estimatedScores,
    estimatedMetrics,
    improvement: calculateImprovement(currentScores.performance, estimatedScores.performance),
    pros: [
      'Always up-to-date content',
      'Good for personalized experiences',
      'Better SEO than client-side rendering',
      'Secure data handling on server',
    ],
    cons: [
      'Slower TTFB than static',
      'Higher server load',
      'Requires server infrastructure',
      'More expensive to scale',
    ],
  };
}

/**
 * Simulate SSG (Static Site Generation)
 */
function simulateSSG(
  currentScores: LighthouseScores,
  currentMetrics: LighthouseMetrics
): RenderingStrategy {
  // SSG provides best performance for static content
  const estimatedMetrics: Partial<CoreWebVitalsMetrics> = {
    TTFB: currentMetrics.TTFB * 0.3, // 70% improvement
    FCP: currentMetrics.FCP * 0.6, // 40% improvement
    LCP: currentMetrics.LCP * 0.6, // 40% improvement
    TBT: currentMetrics.TBT * 0.8, // 20% improvement
  };

  const estimatedScores: LighthouseScores = {
    performance: Math.min(100, currentScores.performance + 20),
    accessibility: currentScores.accessibility,
    bestPractices: currentScores.bestPractices,
    seo: Math.min(100, currentScores.seo + 10),
  };

  return {
    id: 'ssg',
    name: 'Static Site Generation (SSG)',
    description: 'Pre-render pages at build time. Ideal for content that rarely changes.',
    estimatedScores,
    estimatedMetrics,
    improvement: calculateImprovement(currentScores.performance, estimatedScores.performance),
    pros: [
      'Fastest possible load times',
      'Lowest server costs',
      'Excellent SEO',
      'Can be served from CDN globally',
    ],
    cons: [
      'Content only updates on rebuild',
      'Build times increase with page count',
      'Not suitable for dynamic content',
      'Requires rebuild for updates',
    ],
  };
}

/**
 * Simulate ISR (Incremental Static Regeneration)
 */
function simulateISR(
  currentScores: LighthouseScores,
  currentMetrics: LighthouseMetrics
): RenderingStrategy {
  // ISR balances static performance with fresh content
  const estimatedMetrics: Partial<CoreWebVitalsMetrics> = {
    TTFB: currentMetrics.TTFB * 0.4, // 60% improvement
    FCP: currentMetrics.FCP * 0.7, // 30% improvement
    LCP: currentMetrics.LCP * 0.7, // 30% improvement
    TBT: currentMetrics.TBT * 0.85, // 15% improvement
  };

  const estimatedScores: LighthouseScores = {
    performance: Math.min(100, currentScores.performance + 15),
    accessibility: currentScores.accessibility,
    bestPractices: currentScores.bestPractices,
    seo: Math.min(100, currentScores.seo + 8),
  };

  return {
    id: 'isr',
    name: 'Incremental Static Regeneration (ISR)',
    description: 'Static pages that regenerate in the background. Best of both worlds for semi-dynamic content.',
    estimatedScores,
    estimatedMetrics,
    improvement: calculateImprovement(currentScores.performance, estimatedScores.performance),
    pros: [
      'Near-static performance',
      'Content stays fresh',
      'No rebuild required',
      'Scales well with page count',
    ],
    cons: [
      'First visitor after revalidation sees slower load',
      'Eventual consistency (not real-time)',
      'More complex cache invalidation',
      'Requires Next.js on Vercel or similar platform',
    ],
  };
}

/**
 * Simulate Cache Components (Next.js 16)
 */
function simulateCacheComponents(
  currentScores: LighthouseScores,
  currentMetrics: LighthouseMetrics
): RenderingStrategy {
  // Cache Components provide granular caching for optimal performance
  const estimatedMetrics: Partial<CoreWebVitalsMetrics> = {
    TTFB: currentMetrics.TTFB * 0.5, // 50% improvement
    FCP: currentMetrics.FCP * 0.65, // 35% improvement
    LCP: currentMetrics.LCP * 0.65, // 35% improvement
    TBT: currentMetrics.TBT * 0.75, // 25% improvement
  };

  const estimatedScores: LighthouseScores = {
    performance: Math.min(100, currentScores.performance + 18),
    accessibility: currentScores.accessibility,
    bestPractices: Math.min(100, currentScores.bestPractices + 5),
    seo: Math.min(100, currentScores.seo + 8),
  };

  return {
    id: 'cache',
    name: 'Cache Components',
    description: 'Fine-grained component caching in Next.js 16. Mix static and dynamic parts optimally.',
    estimatedScores,
    estimatedMetrics,
    improvement: calculateImprovement(currentScores.performance, estimatedScores.performance),
    pros: [
      'Granular control over caching',
      'Best performance for mixed content',
      'Flexible revalidation strategies',
      'Reduces server load significantly',
    ],
    cons: [
      'Requires Next.js 16+',
      'More complex implementation',
      'Learning curve for cache directives',
      'Debugging can be challenging',
    ],
  };
}

/**
 * Generate recommendations based on simulated strategies
 */
export function generateRecommendations(
  strategies: RenderingStrategy[],
  currentMetrics: LighthouseMetrics
): StrategyRecommendation[] {
  // Sort strategies by improvement potential
  const sortedStrategies = [...strategies].sort((a, b) => b.improvement - a.improvement);

  return sortedStrategies.map((strategy, index) => {
    const priority = index === 0 ? 'high' : index === 1 ? 'medium' : 'low';
    
    const expectedGain = Object.entries(strategy.estimatedMetrics)
      .map(([metric, projected]) => {
        const current = currentMetrics[metric as keyof LighthouseMetrics];
        const improvement = current > 0 ? ((current - (projected || 0)) / current * 100) : 0;
        
        return {
          metric: metric as keyof CoreWebVitalsMetrics,
          current,
          projected: projected || 0,
          improvement: `${Math.round(improvement)}%`,
        };
      })
      .filter(gain => gain.current > 0);

    const complexityMap: Record<string, 'low' | 'medium' | 'high'> = {
      ssg: 'low',
      ssr: 'medium',
      isr: 'medium',
      cache: 'high',
    };

    return {
      strategy,
      priority,
      expectedGain,
      implementationComplexity: complexityMap[strategy.id] || 'medium',
      reasoning: generateReasoning(strategy, currentMetrics),
    };
  });
}

/**
 * Calculate improvement percentage
 */
function calculateImprovement(current: number, estimated: number): number {
  if (current === 0) return 0;
  return Math.round(((estimated - current) / current) * 100);
}

/**
 * Generate reasoning for recommendation
 */
function generateReasoning(strategy: RenderingStrategy, currentMetrics: LighthouseMetrics): string {
  const bottlenecks: string[] = [];

  if (currentMetrics.TTFB > 800) {
    bottlenecks.push('high server response time');
  }
  if (currentMetrics.LCP > 2500) {
    bottlenecks.push('slow largest contentful paint');
  }
  if (currentMetrics.TBT > 200) {
    bottlenecks.push('significant main thread blocking');
  }

  const bottleneckText = bottlenecks.length > 0
    ? ` Your site currently has ${bottlenecks.join(', ')}.`
    : '';

  const strategyBenefits: Record<string, string> = {
    ssg: 'Static generation will dramatically reduce server response time and provide instant page loads from the CDN.',
    ssr: 'Server-side rendering will improve initial load performance while keeping content fresh on every request.',
    isr: 'Incremental regeneration combines static performance with automatic content updates, ideal for semi-dynamic pages.',
    cache: 'Component-level caching provides the best of all worlds, optimizing static and dynamic parts independently.',
  };

  return `${strategyBenefits[strategy.id]}${bottleneckText}`;
}
