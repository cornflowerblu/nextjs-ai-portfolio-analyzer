/**
 * StreamingResponse Component
 * Displays real-time AI streaming text with loading animation
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import type { PerformanceContext, OptimizationSuggestion } from '@/types/ai';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { OptimizationCard } from './optimization-card';

interface StreamingResponseProps {
  performanceContext: PerformanceContext;
  autoStart?: boolean;
}

export function StreamingResponse({
  performanceContext,
  autoStart = false,
}: StreamingResponseProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = async () => {
    setIsStreaming(true);
    setContent('');
    setError(null);
    setSuggestions([]);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceContext }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to get insights: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                fullText += parsed.content;
                setContent(fullText);
              } else if (parsed.type === 'suggestions') {
                setSuggestions(parsed.suggestions);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Analysis cancelled');
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'An error occurred while analyzing performance'
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    if (autoStart) {
      void startAnalysis();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        <Button
          onClick={startAnalysis}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!content && !isStreaming && !autoStart) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <Button onClick={startAnalysis} className="gap-2">
          <Loader2 className="h-4 w-4" />
          Analyze Performance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isStreaming && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analyzing performance metrics...</span>
        </div>
      )}

      {content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{content}</div>
          {isStreaming && (
            <span className="inline-block h-4 w-1 animate-pulse bg-primary" />
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold">Optimization Suggestions</h3>
          {suggestions.map((suggestion, index) => (
            <OptimizationCard key={index} suggestion={suggestion} />
          ))}
        </div>
      )}

      {content && !isStreaming && (
        <Button
          onClick={startAnalysis}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Re-analyze
        </Button>
      )}
    </div>
  );
}
