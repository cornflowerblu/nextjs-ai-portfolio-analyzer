'use client';

/**
 * Lighthouse Scores Component
 * Displays the 4 main Lighthouse metrics with visual indicators
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LighthouseScores } from '@/types/lighthouse';

interface LighthouseScoresProps {
  scores: LighthouseScores;
}

interface ScoreConfig {
  label: string;
  key: keyof LighthouseScores;
  icon: string;
}

const scoreConfigs: ScoreConfig[] = [
  { label: 'Performance', key: 'performance', icon: '⚡' },
  { label: 'Accessibility', key: 'accessibility', icon: '♿' },
  { label: 'Best Practices', key: 'bestPractices', icon: '✓' },
  { label: 'SEO', key: 'seo', icon: '🔍' },
];

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 50) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' {
  if (score >= 90) return 'default';
  if (score >= 50) return 'secondary';
  return 'destructive';
}

function getScoreGrade(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 50) return 'Good';
  return 'Needs Work';
}

export function LighthouseScores({ scores }: LighthouseScoresProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lighthouse Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scoreConfigs.map((config) => {
            const score = scores[config.key];
            const scoreColor = getScoreColor(score);
            const grade = getScoreGrade(score);

            return (
              <div
                key={config.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {config.icon}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{config.label}</p>
                    <Badge variant={getScoreBadgeVariant(score)} className="mt-1">
                      {grade}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-bold ${scoreColor}`}>
                    {Math.round(score)}
                  </p>
                  <p className="text-xs text-gray-500">/ 100</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
