/**
 * Type definitions for Lighthouse analysis results and recommendations
 */

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface CoreWebVitalsMetrics {
  FCP: number; // First Contentful Paint (ms)
  LCP: number; // Largest Contentful Paint (ms)
  CLS: number; // Cumulative Layout Shift
  INP: number; // Interaction to Next Paint (ms)
  TTFB: number; // Time to First Byte (ms)
  SI: number; // Speed Index
  TBT: number; // Total Blocking Time (ms)
}

export interface LighthouseMetrics extends CoreWebVitalsMetrics {
  speedIndex: number;
  totalBlockingTime: number;
  interactive: number; // Time to Interactive (ms)
}

export interface RenderingStrategy {
  id: 'ssr' | 'ssg' | 'isr' | 'cache';
  name: string;
  description: string;
  estimatedScores: LighthouseScores;
  estimatedMetrics: Partial<CoreWebVitalsMetrics>;
  improvement: number; // Percentage improvement over current
  pros: string[];
  cons: string[];
}

export interface StrategyRecommendation {
  strategy: RenderingStrategy;
  priority: 'high' | 'medium' | 'low';
  expectedGain: {
    metric: keyof CoreWebVitalsMetrics;
    current: number;
    projected: number;
    improvement: string;
  }[];
  implementationComplexity: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface AnalysisResult {
  url: string;
  timestamp: number;
  currentScores: LighthouseScores;
  currentMetrics: LighthouseMetrics;
  recommendations: StrategyRecommendation[];
  bestStrategy: RenderingStrategy;
  analysisTime: number; // Time taken to analyze (ms)
}

export interface AnalysisError {
  message: string;
  code: 'TIMEOUT' | 'UNREACHABLE' | 'INVALID_URL' | 'API_NOT_ENABLED' | 'RATE_LIMIT' | 'ANALYSIS_ERROR' | 'UNKNOWN';
  details?: string;
}

export interface AnalysisRequest {
  url: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: AnalysisError;
  cached?: boolean;
}
