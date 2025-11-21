'use client';

/**
 * URL Analyzer Page
 * Allows users to analyze custom website URLs and get rendering strategy recommendations
 */

import { useState } from 'react';
import { UrlInputForm } from '@/components/analyze/url-input-form';
import { LighthouseScores } from '@/components/analyze/lighthouse-scores';
import { StrategyRecommendations } from '@/components/analyze/strategy-recommendations';
import { PerformanceComparison } from '@/components/analyze/performance-comparison';
import type { AnalysisResponse } from '@/types/lighthouse';

export default function AnalyzePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string | null>(null);

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setResult(null);
    setAnalyzedUrl(url);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json() as AnalysisResponse;
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: {
          message: 'Failed to analyze URL',
          code: 'UNKNOWN',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Website Performance Analyzer
          </h1>
          <p className="text-lg text-gray-600">
            Analyze any website and get personalized rendering strategy recommendations
          </p>
        </div>

        {/* URL Input Form */}
        <UrlInputForm onSubmit={handleAnalyze} loading={loading} />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Analyzing {analyzedUrl}...</p>
            <p className="text-sm text-gray-500">This typically takes 30-60 seconds</p>
          </div>
        )}

        {/* Error State */}
        {result && !result.success && result.error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Analysis Failed
            </h3>
            <p className="text-red-700 mb-2">{result.error.message}</p>
            {result.error.details && (
              <p className="text-sm text-red-600">{result.error.details}</p>
            )}
          </div>
        )}

        {/* Success State */}
        {result && result.success && result.data && (
          <div className="space-y-6">
            {/* Analysis Info */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Analyzed URL</p>
                <p className="font-mono text-sm font-medium break-all">{result.data.url}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Analysis Time</p>
                <p className="font-medium">{(result.data.analysisTime / 1000).toFixed(1)}s</p>
                {result.cached && (
                  <p className="text-xs text-blue-600 mt-1">From cache</p>
                )}
              </div>
            </div>

            {/* Lighthouse Scores */}
            <LighthouseScores scores={result.data.currentScores} />

            {/* Performance Comparison */}
            <PerformanceComparison
              currentMetrics={result.data.currentMetrics}
              bestStrategy={result.data.bestStrategy}
            />

            {/* Strategy Recommendations */}
            <StrategyRecommendations recommendations={result.data.recommendations} />

            {/* Additional Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Next Steps</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>
                  • Review the recommended strategy and consider implementing it for your project
                </li>
                <li>
                  • Check the pros and cons to understand trade-offs
                </li>
                <li>
                  • Compare the estimated performance improvements with your current metrics
                </li>
                <li>
                  • Explore the live demos in the Lab section to see strategies in action
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Initial Instructions */}
        {!loading && !result && (
          <div className="bg-white border rounded-lg p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div>
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="font-medium mb-1">1. Enter URL</h3>
                <p className="text-sm text-gray-600">
                  Provide any website URL you want to analyze
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-medium mb-1">2. Run Analysis</h3>
                <p className="text-sm text-gray-600">
                  We run Lighthouse tests and analyze Core Web Vitals
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-medium mb-1">3. Get Recommendations</h3>
                <p className="text-sm text-gray-600">
                  Receive personalized rendering strategy suggestions
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
