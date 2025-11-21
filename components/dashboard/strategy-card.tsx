/**
 * StrategyCard Component
 * Displays a single rendering strategy with its metadata and visual identity
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RenderingStrategy } from '@/types/strategy';
import { getStrategyColorClasses } from '@/lib/utils/colors';
import { FlaskConical } from 'lucide-react';

interface StrategyCardProps {
  strategy: RenderingStrategy;
  isActive?: boolean;
  onClick?: () => void;
}

export function StrategyCard({ strategy, isActive = false, onClick }: StrategyCardProps) {
  // Use full set of Tailwind classes for strategy color
  const color = getStrategyColorClasses(strategy.id);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
    }
  };

  const handleDemoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link
      href={`/lab/${strategy.id.toLowerCase()}`}
      className={`block h-full ${isActive ? 'ring-2 ring-primary' : ''}`}
    >
      <Card
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="transition-all hover:shadow-lg cursor-pointer flex flex-col h-full"
      >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              {/* Colored circle */}
              <span
                className={`w-3 h-3 rounded-full ${color.bg}`}
                aria-hidden="true"
              />
              {strategy.name}
            </CardTitle>
            <CardDescription>{strategy.description}</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-sm ${color.bg}`} />
            {strategy.id.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-full">
        <div className="space-y-4 text-sm flex-grow">
          <div>
            <span className="font-medium">Use Cases:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.useCases.slice(0, 2).map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <span className="font-medium">Pros:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.tradeoffs.pros.slice(0, 2).map((pro, index) => (
                <li key={index}>{pro}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* Lab Demo Link aligned to bottom */}
        <div
          onClick={handleDemoClick}
          className="mt-auto flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium border rounded-md bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all"
        >
          <FlaskConical className="h-4 w-4" />
          Try Live Demo
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
