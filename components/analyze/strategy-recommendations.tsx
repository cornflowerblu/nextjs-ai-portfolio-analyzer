'use client';

/**
 * Strategy Recommendations Component
 * Displays rendering strategy recommendations with priorities
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StrategyRecommendation } from '@/types/lighthouse';

interface StrategyRecommendationsProps {
  recommendations: StrategyRecommendation[];
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function StrategyRecommendations({ recommendations }: StrategyRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy Recommendations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec, index) => {
          const { strategy, priority, expectedGain, implementationComplexity, reasoning } = rec;

          return (
            <div
              key={strategy.id}
              className={`p-4 border-2 rounded-lg ${getPriorityColor(priority)}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{strategy.name}</h3>
                    {index === 0 && (
                      <Badge className="bg-blue-600 text-white">Recommended</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{strategy.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <Badge variant="outline" className="text-xs">
                    Priority: {priority.toUpperCase()}
                  </Badge>
                  <Badge className={`text-xs ${getComplexityColor(implementationComplexity)}`}>
                    {implementationComplexity} complexity
                  </Badge>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-700">{reasoning}</p>
              </div>

              {expectedGain.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Expected Performance Gains:</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {expectedGain.map((gain) => (
                      <div key={gain.metric} className="text-xs bg-white/50 p-2 rounded">
                        <p className="font-medium">{gain.metric}</p>
                        <p className="text-green-600">↓ {gain.improvement}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-medium mb-1 text-green-700">✓ Pros:</p>
                  <ul className="space-y-1">
                    {strategy.pros.map((pro, i) => (
                      <li key={i} className="text-gray-700">• {pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1 text-red-700">⚠ Cons:</p>
                  <ul className="space-y-1">
                    {strategy.cons.map((con, i) => (
                      <li key={i} className="text-gray-700">• {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
