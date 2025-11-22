/**
 * StreamingResponse Component
 * Displays real-time AI streaming text with loading animation
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { TextSkeleton } from '@/components/ui/skeleton';
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
  const hasStartedRef = useRef(false);
  const performanceContextRef = useRef(performanceContext);

  // Update ref when context changes, but don't trigger re-analysis
  useEffect(() => {
    performanceContextRef.current = performanceContext;
  }, [performanceContext]);

  const startAnalysis = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (isStreaming) return;

    setIsStreaming(true);
    setContent('');
    setError(null);
    setSuggestions([]);
    hasStartedRef.current = true;

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performanceContext: performanceContextRef.current }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        // Try to parse error message from JSON response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to get insights: ${response.statusText}`);
        }
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
        if (done) {
          if (fullText.trim() === '') {
            throw new Error('AI service returned an empty response. Please try again.');
          }
          break;
        }

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
              } else if (parsed.type === 'error') {
                // Intentional error from server
                throw new Error(parsed.content || 'AI service error');
              }
            } catch (parseError) {
              // Re-throw intentional errors, skip JSON parsing errors
              if (parseError instanceof SyntaxError) {
                // Skip JSON parsing errors like "Unexpected token" or "Unexpected end of JSON input"
                continue;
              }
              // Re-throw all other errors (including intentional errors from server)
              throw parseError;
            }
          }
        }
      }
    } catch (err) {
      // Only set error if this wasn't an intentional abort
      if (err instanceof Error && err.name === 'AbortError') {
        // Don't show error for aborts - user cancelled or component unmounted
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while analyzing performance'
      );
    } finally {
      setIsStreaming(false);
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [isStreaming]);

  // Auto-start analysis when component mounts if autoStart is true
  useEffect(() => {
    let mounted = true;

    if (autoStart && !hasStartedRef.current && mounted) {
      void startAnalysis();
    }

    return () => {
      mounted = false;
      // Don't abort immediately - give the request a chance to complete
      // This prevents React Strict Mode from cancelling valid requests
    };
    // startAnalysis is intentionally omitted from deps to prevent re-triggering on state changes
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
      {/* Loading indicator */}
      {isStreaming && !content && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing performance metrics...</span>
          </div>
          <TextSkeleton lines={8} />
        </div>
      )}

      {/* Content container with fixed minimum height to prevent layout shifts */}
      {content && (
        <div className="min-h-[300px]">
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing performance metrics...</span>
            </div>
          )}

          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            style={{
              contain: 'layout',
            }}
          >
            <div className="whitespace-pre-wrap">
              {content}
              {isStreaming && (
                <span className="inline-block h-4 w-1 animate-pulse bg-primary ml-1" />
              )}
            </div>
          </div>
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
