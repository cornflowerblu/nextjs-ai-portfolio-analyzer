/**
 * DemoContainer Component
 * Wrapper for lab demos with controls and metrics overlay
 */

'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RenderingStrategyType } from '@/types/strategy';
import { MetricsDisplay } from './metrics-display';
import { CacheStatus } from './cache-status';
import { ReRenderControls } from './re-render-controls';
import { SourceCodeViewer } from './source-code-viewer';

export interface DemoMetrics {
  renderTime: number;
  timestamp: number;
  cacheAge?: number;
  fcp?: number;
  lcp?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
}

export interface CacheInfo {
  status: 'hit' | 'miss' | 'stale' | 'revalidating';
  age?: number;
  maxAge?: number;
}

interface DemoContainerProps {
  strategy: RenderingStrategyType;
  title: string;
  description: string;
  children: ReactNode;
  metrics: DemoMetrics;
  cacheInfo: CacheInfo;
  sourceCode?: string;
  onReRender: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function DemoContainer({
  strategy,
  title,
  description,
  children,
  metrics,
  cacheInfo,
  sourceCode,
  onReRender,
  onRefresh,
  isLoading = false,
}: DemoContainerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left side: Demo content */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{title}</span>
              <CacheStatus status={cacheInfo.status} age={cacheInfo.age} maxAge={cacheInfo.maxAge} />
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ReRenderControls
                strategy={strategy}
                onReRender={onReRender}
                onRefresh={onRefresh}
                isLoading={isLoading}
              />
              <div className="border rounded-lg p-4 bg-muted/50">
                {children}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right side: Metrics and source code */}
      <div className="space-y-4">
        <MetricsDisplay metrics={metrics} strategy={strategy} />
        {sourceCode && (
          <SourceCodeViewer code={sourceCode} language="typescript" title={`${strategy} Implementation`} />
        )}
      </div>
    </div>
  );
}
