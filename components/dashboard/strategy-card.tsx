/**
 * StrategyCard Component
 * Displays a single rendering strategy with its metadata and visual identity
 */

'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RenderingStrategy } from '@/types/strategy';
import { getStrategyColor } from '@/lib/utils/colors';
import { FlaskConical } from 'lucide-react';

interface StrategyCardProps {
  strategy: RenderingStrategy;
  isActive?: boolean;
  onClick?: () => void;
}

export function StrategyCard({ strategy, isActive = false, onClick }: StrategyCardProps) {
  const colorClasses = getStrategyColor(strategy.id);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`transition-all hover:shadow-lg cursor-pointer ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="flex items-center gap-2">
              <span className={`text-2xl ${colorClasses}`}>●</span>
              {strategy.name}
            </CardTitle>
            <CardDescription>{strategy.description}</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 rounded-sm ${colorClasses}`} />
            {strategy.id.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium">Use Cases:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.useCases.slice(0, 2).map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium">Pros:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.tradeoffs.pros.slice(0, 2).map((pro, index) => (
                <li key={index}>{pro}</li>
              ))}
            </ul>
          </div>
          
          {/* Lab Demo Link */}
          <Link
            href={`/lab/${strategy.id.toLowerCase()}`}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium border rounded-md bg-background shadow-xs hover:bg-accent hover:text-accent-foreground transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <FlaskConical className="h-4 w-4" />
            Try Live Demo
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
