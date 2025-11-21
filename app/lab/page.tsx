/**
 * Lab Overview Page
 * Navigation hub for all rendering strategy demos
 */

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RENDERING_STRATEGIES, RenderingStrategyType } from '@/types/strategy';
import { ArrowRight, FlaskConical } from 'lucide-react';

export const metadata = {
  title: 'Lab - Interactive Rendering Demos',
  description: 'Hands-on demonstrations of Next.js rendering strategies with live metrics',
};

const strategyOrder: RenderingStrategyType[] = ['SSR', 'SSG', 'ISR', 'CACHE'];

export default function LabPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Rendering Strategy Lab</h1>
            <p className="text-muted-foreground text-lg mt-2">
              Interactive demos to explore how each Next.js rendering strategy works in practice
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="mb-8 border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-lg">What you&apos;ll learn:</h3>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>See real-time render metrics and Core Web Vitals</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Observe cache behavior with hit/miss indicators</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Trigger re-renders to compare performance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>View implementation source code</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Demo Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {strategyOrder.map((strategyId) => {
          const strategy = RENDERING_STRATEGIES[strategyId];
          const demoPath = `/lab/${strategyId.toLowerCase()}`;

          return (
            <Card key={strategyId} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{strategy.icon}</span>
                      {strategy.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {strategy.description}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{strategy.displayName}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Characteristics */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Render:</span>
                    <p className="text-muted-foreground capitalize">
                      {strategy.characteristics.renderTime}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Cache:</span>
                    <p className="text-muted-foreground capitalize">
                      {strategy.characteristics.cacheability}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Data:</span>
                    <p className="text-muted-foreground capitalize">
                      {strategy.characteristics.dataFreshness.replace(/-/g, ' ')}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Scale:</span>
                    <p className="text-muted-foreground capitalize">
                      {strategy.characteristics.scalability}
                    </p>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <span className="text-sm font-medium">Best for:</span>
                  <ul className="mt-1 text-sm text-muted-foreground">
                    {strategy.useCases.slice(0, 2).map((useCase, index) => (
                      <li key={index} className="flex items-start gap-1.5">
                        <span className="text-primary mt-1">•</span>
                        <span>{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Launch Demo Button */}
                <Link href={demoPath} className="block">
                  <Button className="w-full" size="lg">
                    Launch Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Each demo is fully interactive. Click buttons to trigger re-renders and observe how
          different strategies handle caching, revalidation, and performance optimization.
        </p>
      </div>
    </div>
  );
}
