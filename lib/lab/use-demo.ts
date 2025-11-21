/**
 * useDemo hook
 * Manages demo state, metrics, and re-render logic
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';
import { RenderingStrategyType } from '@/types/strategy';
import { DemoMetrics, CacheInfo } from '@/components/lab/demo-container';

interface UseDemoOptions {
  strategy: RenderingStrategyType;
  autoCapture?: boolean;
}

interface UseDemoReturn {
  metrics: DemoMetrics;
  cacheInfo: CacheInfo;
  isLoading: boolean;
  reRender: () => void;
  refresh: () => void;
}

export function useDemo({ strategy, autoCapture = true }: UseDemoOptions): UseDemoReturn {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DemoMetrics>({
    renderTime: 0,
    timestamp: Date.now(),
  });
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({
    status: 'miss',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState(`${strategy}-${Date.now()}`);

  // Capture web vitals
  useEffect(() => {
    if (!autoCapture) return;

    const updateMetric = (metric: Metric) => {
      setMetrics((prev) => ({
        ...prev,
        [metric.name.toLowerCase()]: metric.value,
      }));
    };

    // Register web vitals listeners
    onCLS(updateMetric);
    onFCP(updateMetric);
    onINP(updateMetric);
    onLCP(updateMetric);
    onTTFB(updateMetric);
  }, [autoCapture]);

  // Fetch demo metrics from API
  const fetchMetrics = useCallback(async (newRequestId?: string) => {
    try {
      const id = newRequestId || requestId;
      const cacheBust = Date.now();
      const response = await fetch(
        `/api/demo/${strategy.toLowerCase()}?requestId=${id}&cacheBust=${cacheBust}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();

      // Update metrics with server-side render time
      setMetrics((prev) => ({
        ...prev,
        renderTime: data.renderTime,
        timestamp: data.timestamp,
        cacheAge: data.cacheAge,
      }));

      // Update cache info
      setCacheInfo({
        status: data.cacheStatus,
        age: data.cacheAge,
        maxAge: strategy === 'ISR' ? 60000 : undefined, // ISR revalidates every 60s
      });
    } catch (error) {
      console.error('Error fetching demo metrics:', error);
    }
  }, [strategy, requestId]);

  // Initial metrics fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Re-render: Generate new request with cache busting
  const reRender = useCallback(async () => {
    setIsLoading(true);
    setCacheInfo((prev) => ({ ...prev, status: 'revalidating' }));

    try {
      // Generate new request ID for cache busting
      const newRequestId = `${strategy}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setRequestId(newRequestId);

      // For SSR/ISR, clear the cache
      if (['SSR', 'ISR'].includes(strategy)) {
        await fetch(`/api/demo/${strategy.toLowerCase()}`, {
          method: 'POST',
        });
      }

      // Fetch new metrics
      await fetchMetrics(newRequestId);

      // Reset web vitals by triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.set('refresh', Date.now().toString());
      router.replace(url.pathname + url.search);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [strategy, router, fetchMetrics]);

  // Soft refresh: Use Next.js router refresh
  const refresh = useCallback(() => {
    setIsLoading(true);
    setCacheInfo((prev) => ({ ...prev, status: 'revalidating' }));

    try {
      router.refresh();
      
      // Fetch updated metrics
      setTimeout(() => {
        fetchMetrics();
      }, 100);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [router, fetchMetrics]);

  return {
    metrics,
    cacheInfo,
    isLoading,
    reRender,
    refresh,
  };
}
