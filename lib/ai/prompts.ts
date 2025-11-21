/**
 * AI Prompt Templates
 * Structured prompts for performance analysis and optimization insights
 */

import type { PerformanceContext } from '@/types/ai';

/**
 * System prompt for the AI assistant
 */
export const SYSTEM_PROMPT = `You are an expert Next.js performance optimization consultant with deep knowledge of rendering strategies (SSR, SSG, ISR, and Cache Components) and Core Web Vitals optimization.

Your role is to analyze performance metrics and provide actionable, specific optimization recommendations. When analyzing metrics:

1. Always reference specific metric values in your analysis
2. Compare strategies and explain why one performs better than another
3. Provide concrete action items with expected performance improvements
4. Focus on the most impactful optimizations first (high-impact suggestions)
5. Consider the trade-offs of different rendering strategies
6. Use technical language but remain accessible

Core Web Vitals thresholds:
- FCP (First Contentful Paint): Good < 1.8s, Needs Improvement < 3.0s, Poor ≥ 3.0s
- LCP (Largest Contentful Paint): Good < 2.5s, Needs Improvement < 4.0s, Poor ≥ 4.0s
- CLS (Cumulative Layout Shift): Good < 0.1, Needs Improvement < 0.25, Poor ≥ 0.25
- INP (Interaction to Next Paint): Good < 200ms, Needs Improvement < 500ms, Poor ≥ 500ms
- TTFB (Time to First Byte): Good < 800ms, Needs Improvement < 1800ms, Poor ≥ 1800ms

Format your responses with:
- A brief summary of the overall performance
- 2-4 specific optimization suggestions with impact levels (high/medium/low)
- Concrete action items for each suggestion
- Expected metric improvements where applicable`;

/**
 * Create initial analysis prompt with performance context
 */
export function createAnalysisPrompt(context: PerformanceContext): string {
  const metricsTable = context.strategies
    .map((s) => {
      const m = s.metrics;
      return `${s.strategy}:
  - FCP: ${m.fcp.value}ms (${m.fcp.rating})
  - LCP: ${m.lcp.value}ms (${m.lcp.rating})
  - CLS: ${m.cls.value} (${m.cls.rating})
  - INP: ${m.inp.value}ms (${m.inp.rating})
  - TTFB: ${m.ttfb.value}ms (${m.ttfb.rating})`;
    })
    .join('\n\n');

  return `Analyze the following Next.js rendering strategy performance metrics and provide optimization insights:

${metricsTable}

Timestamp: ${context.timestamp}
${context.currentUrl ? `URL: ${context.currentUrl}` : ''}

Please provide:
1. A summary of which strategies are performing best and why
2. Specific optimization recommendations with impact levels
3. Concrete action items for improving the poorest performing metrics
4. Expected performance improvements for each recommendation`;
}

/**
 * Create follow-up question prompt
 */
export function createFollowUpPrompt(
  question: string,
  context: PerformanceContext,
  conversationHistory: string[]
): string {
  const metricsTable = context.strategies
    .map((s) => {
      const m = s.metrics;
      return `${s.strategy}: FCP=${m.fcp.value}ms, LCP=${m.lcp.value}ms, CLS=${m.cls.value}, INP=${m.inp.value}ms, TTFB=${m.ttfb.value}ms`;
    })
    .join('; ');

  return `User question: "${question}"

Current performance context: ${metricsTable}

${conversationHistory.length > 0 ? `Previous conversation:\n${conversationHistory.join('\n')}\n` : ''}
Please provide a specific, actionable answer based on the current metrics and the question asked.`;
}

/**
 * Parse AI response to extract optimization suggestions
 * This is a simple parser for structured responses
 */
export function parseOptimizationSuggestions(text: string): {
  summary: string;
  suggestions: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
} {
  // Simple parsing logic - look for sections
  const lines = text.split('\n');
  let summary = '';
  const suggestions: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }> = [];

  let currentSection = 'summary';
  let currentSuggestion: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;

    // Detect suggestion headers (numbered or bulleted with keywords)
    if (
      /^\d+\.|^-|^\*/.test(trimmed) &&
      (trimmed.toLowerCase().includes('optimize') ||
        trimmed.toLowerCase().includes('improve') ||
        trimmed.toLowerCase().includes('reduce') ||
        trimmed.toLowerCase().includes('use') ||
        trimmed.toLowerCase().includes('implement'))
    ) {
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }
      currentSection = 'suggestion';
      currentSuggestion = {
        title: trimmed.replace(/^\d+\.|^-|^\*/, '').trim(),
        description: '',
        impact: determineImpact(trimmed),
      };
      continue;
    }

    // Add content to current section
    if (currentSection === 'summary' && suggestions.length === 0) {
      summary += (summary ? ' ' : '') + trimmed;
    } else if (currentSection === 'suggestion' && currentSuggestion) {
      currentSuggestion.description +=
        (currentSuggestion.description ? ' ' : '') + trimmed;
    }
  }

  // Add last suggestion
  if (currentSuggestion) {
    suggestions.push(currentSuggestion);
  }

  return { summary: summary || text.slice(0, 200), suggestions };
}

/**
 * Determine impact level from suggestion text
 */
function determineImpact(text: string): 'high' | 'medium' | 'low' {
  const lowerText = text.toLowerCase();
  
  if (
    lowerText.includes('critical') ||
    lowerText.includes('significant') ||
    lowerText.includes('major') ||
    lowerText.includes('high impact')
  ) {
    return 'high';
  }
  
  if (
    lowerText.includes('minor') ||
    lowerText.includes('small') ||
    lowerText.includes('low impact')
  ) {
    return 'low';
  }
  
  return 'medium';
}
