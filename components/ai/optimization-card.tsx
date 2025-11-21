/**
 * OptimizationCard Component
 * Displays individual optimization suggestion with impact level
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { OptimizationSuggestion } from '@/types/ai';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';

interface OptimizationCardProps {
  suggestion: OptimizationSuggestion;
}

export function OptimizationCard({ suggestion }: OptimizationCardProps) {
  const impactConfig = {
    high: {
      icon: TrendingUp,
      className: 'border-red-500/50 bg-red-500/10',
      badgeVariant: 'destructive' as const,
    },
    medium: {
      icon: AlertCircle,
      className: 'border-yellow-500/50 bg-yellow-500/10',
      badgeVariant: 'default' as const,
    },
    low: {
      icon: Info,
      className: 'border-blue-500/50 bg-blue-500/10',
      badgeVariant: 'secondary' as const,
    },
  };

  const config = impactConfig[suggestion.impact];
  const Icon = config.icon;

  return (
    <Card className={config.className}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm">{suggestion.title}</h4>
              <Badge variant={config.badgeVariant} className="text-xs">
                {suggestion.impact} impact
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">
              {suggestion.description}
            </p>

            {suggestion.metricReferences &&
              suggestion.metricReferences.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {suggestion.metricReferences.map((ref, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs font-mono"
                    >
                      {ref.metric.toUpperCase()}: {ref.currentValue}
                      {ref.metric !== 'cls' && 'ms'} → ~
                      {Math.round(
                        ref.currentValue - ref.expectedImprovement
                      )}
                      {ref.metric !== 'cls' && 'ms'}
                    </Badge>
                  ))}
                </div>
              )}

            {suggestion.actionItems && suggestion.actionItems.length > 0 && (
              <ul className="text-xs space-y-1 mt-2 ml-5 list-disc text-muted-foreground">
                {suggestion.actionItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            )}

            {suggestion.strategy && (
              <Badge variant="outline" className="text-xs mt-2">
                Recommended: {suggestion.strategy}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
