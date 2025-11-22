/**
 * Strategy Cards Component
 * Interactive cards for rendering strategies on the home page
 * Includes explanatory text and links to lab demos
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { RENDERING_STRATEGIES, RenderingStrategyType } from '@/types/strategy';
import { analytics } from '@/lib/utils/analytics';

const strategyOrder: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];

export function StrategyCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleCardClick = (strategyId: string, strategyName: string) => {
    // Track navigation to lab page
    const labPath = `lab-${strategyId.toLowerCase()}`;
    analytics.navigateTo(labPath);
    
    // Also track as a demo trigger for more specific analytics
    analytics.triggerDemo(strategyName);
  };

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8">
        <h2 className="text-center text-3xl font-bold mb-4">Rendering Strategies</h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto">
          Next.js 16 introduces Cache Components alongside other rendering strategies, each optimized for different use cases.
          Explore interactive demos to see how SSR, SSG, ISR, and the new Cache Components work in practice,
          and understand when to use each approach for optimal performance.
        </p>
      </div>
      
      <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">
        {strategyOrder.map((strategyId) => {
          const strategy = RENDERING_STRATEGIES[strategyId];
          const isHovered = hoveredCard === strategyId;
          
          return (
            <Link
              key={strategyId}
              href={`/lab/${strategyId.toLowerCase()}`}
              onClick={() => handleCardClick(strategyId, strategy.name)}
              onMouseEnter={() => setHoveredCard(strategyId)}
              onMouseLeave={() => setHoveredCard(null)}
              className="block"
              aria-label={`Explore ${strategy.name} - ${strategy.description}`}
            >
              <div 
                className={`rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-200 h-full ${
                  isHovered ? 'shadow-lg scale-105' : ''
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl" aria-hidden="true">{strategy.icon}</span>
                  <span 
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      strategyId === 'SSR' ? 'bg-blue-500/10 text-blue-500' :
                      strategyId === 'SSG' ? 'bg-green-500/10 text-green-500' :
                      strategyId === 'ISR' ? 'bg-yellow-500/10 text-yellow-600' :
                      'bg-purple-500/10 text-purple-500'
                    }`}
                  >
                    {strategy.displayName}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold min-h-14">{strategy.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {strategy.description}
                </p>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Render Time</span>
                    <span className="font-mono text-xs capitalize">{strategy.characteristics.renderTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cacheability</span>
                    <span className="font-mono text-xs capitalize">{strategy.characteristics.cacheability}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
