/**
 * InsightsPanel Component
 * Container for AI-powered optimization insights
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StreamingResponse } from './streaming-response';
import { ChatInterface } from './chat-interface';
import type { PerformanceContext } from '@/types/ai';
import { Sparkles } from 'lucide-react';

interface InsightsPanelProps {
  performanceContext: PerformanceContext;
  autoAnalyze?: boolean;
}

export function InsightsPanel({
  performanceContext,
  autoAnalyze = true,
}: InsightsPanelProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-semibold">AI-Powered Insights</h2>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StreamingResponse
            performanceContext={performanceContext}
            autoStart={autoAnalyze}
          />
        </CardContent>
      </Card>

      <ChatInterface performanceContext={performanceContext} />
    </section>
  );
}
