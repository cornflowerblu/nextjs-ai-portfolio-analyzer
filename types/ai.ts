/**
 * AI Types
 * Type definitions for AI-powered insights and chat functionality
 */

import type { CoreWebVitals } from './performance';
import type { RenderingStrategyType } from './strategy';

/**
 * Performance context data passed to AI for analysis
 */
export interface PerformanceContext {
  strategies: {
    strategy: RenderingStrategyType;
    metrics: CoreWebVitals;
  }[];
  timestamp: string;
  currentUrl?: string;
}

/**
 * AI insight suggestion with metric references
 */
export interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metricReferences: {
    metric: 'fcp' | 'lcp' | 'cls' | 'inp' | 'ttfb';
    currentValue: number;
    expectedImprovement: number;
  }[];
  actionItems: string[];
  strategy?: RenderingStrategyType;
}

/**
 * AI chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  suggestions?: OptimizationSuggestion[];
}

/**
 * AI insights response
 */
export interface InsightsResponse {
  id: string;
  summary: string;
  suggestions: OptimizationSuggestion[];
  timestamp: string;
  performanceContext: PerformanceContext;
}

/**
 * Streaming state for AI responses
 */
export interface StreamingState {
  isStreaming: boolean;
  content: string;
  error?: string;
}

/**
 * Chat conversation context
 */
export interface ChatContext {
  messages: ChatMessage[];
  performanceContext: PerformanceContext;
}

/**
 * AI provider configuration
 */
export interface AIConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
}
