/**
 * StrategyCard Component
 * Displays a single rendering strategy with its metadata and visual identity
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RenderingStrategy } from '@/types/strategy';
import { getStrategyColor } from '@/lib/utils/colors';

interface StrategyCardProps {
  strategy: RenderingStrategy;
  isActive?: boolean;
  onClick?: () => void;
}

export function StrategyCard({ strategy, isActive = false, onClick }: StrategyCardProps) {
  const colorClasses = getStrategyColor(strategy.id);
  
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
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
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Use Cases:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.useCases.map((useCase, index) => (
                <li key={index}>{useCase}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium">Pros:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.tradeoffs.pros.map((pro, index) => (
                <li key={index}>{pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="font-medium">Cons:</span>
            <ul className="mt-1 ml-4 list-disc text-muted-foreground">
              {strategy.tradeoffs.cons.map((con, index) => (
                <li key={index}>{con}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
