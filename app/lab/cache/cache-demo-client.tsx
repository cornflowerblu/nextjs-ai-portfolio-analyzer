/**
 * Cache Components Demo Client Component
 * Extends the lab page with the 60-minute dynamic data demo.
 */

'use client';

import {
  FormEvent,
  useCallback,
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Clock,
  Database,
  Layers,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { DemoContainer } from '@/components/lab/demo-container';
import { useDemo } from '@/lib/lab/use-demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  AnalysisStrategy,
  CreateAnalysisActionResult,
  RecentAnalysis,
  RecentAnalysesResult,
} from '@/types/analysis';

type CreateAnalysisAction = (formData: FormData) => Promise<CreateAnalysisActionResult>;

type CacheProvider = 'kv' | 'redis' | 'none';

type CachedRouteResponse = RecentAnalysesResult & {
  cacheTTL: number;
  kvEnabled: boolean;
  redisEnabled: boolean;
  cacheProvider: CacheProvider;
  postgresEnabled: boolean;
  servedAt: string;
};

type LiveRouteResponse = {
  analyses: RecentAnalysis[];
  latency: number;
  mode: 'live' | 'demo';
  servedAt: string;
  runtime: string;
};

interface CacheDemoClientProps {
  cachedData: {
    type: string;
    timestamp: number;
    renderTime: number;
    value: string;
    cacheHit?: boolean;
  };
  dynamicData: {
    type: string;
    timestamp: number;
    renderTime: number;
    value: string;
  };
  sourceCode: string;
  createAnalysisAction: CreateAnalysisAction;
  clearCacheAction: () => Promise<void>;
}

const STRATEGY_OPTIONS: { label: string; value: AnalysisStrategy; helper: string }[] = [
  { label: 'ISR (ISR + cache)', value: 'ISR', helper: 'Stale-while-revalidate @ 60s' },
  { label: 'SSR (force-dynamic)', value: 'SSR', helper: 'Always-render, no cache' },
  { label: 'SSG (build-time)', value: 'SSG', helper: 'Static snapshot' },
  { label: 'Cache Component', value: 'CACHE', helper: 'use cache directive' },
  { label: 'Dynamic Route', value: 'DYNAMIC', helper: 'force-dynamic fetch' },
];

const CACHE_TTL_SECONDS = 30;

const formatAbsoluteTime = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
};

const formatRelativeTime = (value?: string) => {
  if (!value) return '—';
  const deltaMs = Date.now() - new Date(value).getTime();
  if (deltaMs < 1000) return 'just now';
  const seconds = Math.round(deltaMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
};

const getStrategyAccent = (strategy: AnalysisStrategy) => {
  switch (strategy) {
    case 'ISR':
      return 'border-green-300 text-green-900 bg-green-50';
    case 'SSR':
      return 'border-blue-300 text-blue-900 bg-blue-50';
    case 'SSG':
      return 'border-purple-300 text-purple-900 bg-purple-50';
    case 'CACHE':
      return 'border-amber-300 text-amber-900 bg-amber-50';
    case 'DYNAMIC':
    default:
      return 'border-orange-300 text-orange-900 bg-orange-50';
  }
};

const scoreBadgeClass = (score: number) => {
  if (score >= 90) return 'bg-emerald-100 text-emerald-900';
  if (score >= 70) return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
};

const RecentAnalysesList = ({ items }: { items: RecentAnalysis[] }) => {
  if (!items.length) {
    return <p className="text-sm text-muted-foreground">No analyses recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((analysis) => {
        const isOptimistic = analysis.id.startsWith('temp-');
        return (
          <div
            key={analysis.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border bg-background/40 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-sm">{analysis.url}</p>
              <p className="text-xs text-muted-foreground">
                {formatAbsoluteTime(analysis.createdAt)} • {formatRelativeTime(analysis.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${scoreBadgeClass(analysis.score)} font-semibold`}>
                Score {analysis.score}
              </Badge>
              <Badge variant="outline" className={`${getStrategyAccent(analysis.strategy)} font-semibold`}>
                {analysis.strategy}
              </Badge>
              {isOptimistic && (
                <Badge variant="secondary" className="uppercase tracking-wide">
                  pending
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function CacheDemoClient({
  cachedData,
  dynamicData,
  sourceCode,
  createAnalysisAction,
  clearCacheAction,
}: CacheDemoClientProps) {
  const { metrics, isLoading, reRender, refresh } = useDemo({
    strategy: 'CACHE',
  });
  
  // Override cacheInfo with actual cache hit/miss status
  const cacheInfo = {
    status: (cachedData.cacheHit ? 'hit' : 'miss') as 'hit' | 'miss',
    age: cachedData.cacheHit ? Math.floor((Date.now() - cachedData.timestamp) / 1000) : undefined,
  };
  
  // Wrap clearCacheAction to call it and then reRender
  const handleClearCache = useCallback(async () => {
    await clearCacheAction();
    reRender();
  }, [clearCacheAction, reRender]);

  // State for the cached vs live API demo
  const [cachedResponse, setCachedResponse] = useState<CachedRouteResponse | null>(null);
  const [liveResponse, setLiveResponse] = useState<LiveRouteResponse | null>(null);
  const [analyses, setAnalyses] = useState<RecentAnalysis[]>([]);
  const [optimisticAnalyses, addOptimisticAnalysis] = useOptimistic<RecentAnalysis[], RecentAnalysis>(
    analyses,
    (state, newEntry) => [newEntry, ...state].slice(0, 5),
  );
  const [cacheLoading, setCacheLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchCachedData = useCallback(async () => {
    setCacheLoading(true);
    try {
      const response = await fetch('/api/analyses', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Cached route failed to load');
      }
      const data: CachedRouteResponse = await response.json();
      setCachedResponse(data);
      setAnalyses(data.items);
      setClientError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load cached data';
      setClientError(message);
    } finally {
      setCacheLoading(false);
    }
  }, []);

  const fetchLiveData = useCallback(async () => {
    setLiveLoading(true);
    try {
      const response = await fetch('/api/analyses/live', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Live route failed to load');
      }
      const data: LiveRouteResponse = await response.json();
      setLiveResponse(data);
      setClientError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load live data';
      setClientError(message);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCachedData();
    fetchLiveData();
  }, [fetchCachedData, fetchLiveData]);

  const handleCreateAnalysis = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const url = (formData.get('url') as string | null)?.trim();
      const strategy = (formData.get('strategy') as AnalysisStrategy | null) ?? 'ISR';
      const score = Number(formData.get('score') ?? 95);

      if (!url) {
        setClientError('URL is required');
        return;
      }

      const normalizedScore = Number.isNaN(score) ? 95 : Math.max(0, Math.min(100, score));
      formData.set('url', url);
      formData.set('strategy', strategy);
      formData.set('score', String(normalizedScore));

      event.currentTarget.reset();
      const optimisticEntry: RecentAnalysis = {
        id: `temp-${Date.now()}`,
        url,
        strategy,
        score: normalizedScore,
        createdAt: new Date().toISOString(),
      };

      addOptimisticAnalysis(optimisticEntry);

      startTransition(async () => {
        try {
          const result = await createAnalysisAction(formData);
          if (!result?.success && result?.error) {
            setClientError(result.error);
          } else {
            setClientError(null);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create analysis';
          setClientError(message);
        } finally {
          await fetchCachedData();
          await fetchLiveData();
        }
      });
    },
    [addOptimisticAnalysis, createAnalysisAction, fetchCachedData, fetchLiveData],
  );

  // Existing component-level cache demo state
  const [cachedAge, setCachedAge] = useState(0);
  const [dynamicAge, setDynamicAge] = useState(0);
  const [dynamicJustUpdated, setDynamicJustUpdated] = useState(true);
  const previousDynamicValueRef = useRef(dynamicData.value);

  useEffect(() => {
    const updateAges = () => {
      setCachedAge(Date.now() - cachedData.timestamp);
      setDynamicAge(Date.now() - dynamicData.timestamp);
    };

    updateAges();
    const interval = setInterval(updateAges, 1000);
    return () => clearInterval(interval);
  }, [cachedData.timestamp, dynamicData.timestamp]);

  useEffect(() => {
    if (dynamicData.value !== previousDynamicValueRef.current) {
      previousDynamicValueRef.current = dynamicData.value;
      const updateTimer = setTimeout(() => setDynamicJustUpdated(true), 0);
      const hideTimer = setTimeout(() => setDynamicJustUpdated(false), 2000);
      return () => {
        clearTimeout(updateTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [dynamicData.value]);

  const cacheBadgeClass = cachedResponse?.cacheHit ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white';
  const modeBadge =
    cachedResponse?.mode === 'demo'
      ? 'bg-amber-100 text-amber-900'
      : cachedResponse?.mode === 'database-only'
      ? 'bg-blue-100 text-blue-900'
      : 'bg-emerald-100 text-emerald-900';

  return (
    <div className="container mx-auto py-8 px-4">
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/lab">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lab
        </Link>
      </Button>

      <div className="space-y-10">
        <section className="space-y-4 rounded-2xl border bg-card/60 p-6 shadow-sm">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Dynamic Data Demo</p>
            <h1 className="text-3xl font-bold">Vercel Postgres + Cache (KV/Redis) vs Dynamic Fetch</h1>
            <p className="text-muted-foreground">
              Insert analyses via a Server Action, compare the cached `/api/analyses` route (ISR + cache) with the
              `force-dynamic` live endpoint, and watch cache hits/misses update in real-time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Cached Snapshot</CardTitle>
                    <CardDescription>ISR (revalidate=60) + cache TTL {CACHE_TTL_SECONDS}s</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={cacheBadgeClass}>
                    {cachedResponse?.cacheHit ? 'Cache Hit' : 'Cache Miss'}
                  </Badge>
                  {cachedResponse && (
                    <Badge className={modeBadge}>
                      {cachedResponse.mode === 'demo'
                        ? 'Demo Mode (no Postgres)'
                        : cachedResponse.mode === 'database-only'
                        ? 'Postgres only'
                        : 'Live cache + Postgres'}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Revalidate: {cachedResponse?.cacheTTL ?? 60}s · Cache TTL: {CACHE_TTL_SECONDS}s
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Last Revalidated</p>
                    <p className="text-sm font-semibold">{formatAbsoluteTime(cachedResponse?.refreshedAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(cachedResponse?.refreshedAt)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Cache Hit/Miss</p>
                    <p className="text-sm font-semibold">
                      {cachedResponse?.kvStats?.hits ?? 0} hits · {cachedResponse?.kvStats?.misses ?? 0} misses
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Provider: {describeCacheProvider(cachedResponse?.cacheProvider)} · KV{' '}
                      {cachedResponse?.kvEnabled ? 'on' : 'off'} · Redis{' '}
                      {cachedResponse?.redisEnabled ? 'on' : 'off'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="sm" onClick={fetchCachedData} disabled={cacheLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${cacheLoading ? 'animate-spin' : ''}`} />
                    Refresh Cached Route
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchLiveData}
                    disabled={liveLoading}
                  >
                    <Server className="mr-2 h-4 w-4" />
                    Bypass Cache (Live Fetch)
                  </Button>
                  {!cachedResponse?.postgresEnabled && (
                    <Badge variant="destructive">POSTGRES_URL missing</Badge>
                  )}
                </div>

                <RecentAnalysesList items={optimisticAnalyses} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>Live Route</CardTitle>
                    <CardDescription>force-dynamic fetch (Edge runtime)</CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Latency: {liveResponse ? `${liveResponse.latency.toFixed(2)}ms` : '—'}
                  </Badge>
                  {liveResponse && (
                    <Badge className={liveResponse.mode === 'live' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}>
                      {liveResponse.mode === 'live' ? 'Live Postgres' : 'Demo Mode'}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Runtime: {liveResponse?.runtime ?? 'edge'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Served At</p>
                    <p className="text-sm font-semibold">{formatAbsoluteTime(liveResponse?.servedAt)}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(liveResponse?.servedAt)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">Rows Returned</p>
                    <p className="text-sm font-semibold">{liveResponse?.analyses?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Direct from Postgres</p>
                  </div>
                </div>
                <RecentAnalysesList items={liveResponse?.analyses ?? []} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Insert a new analysis (Server Action)</CardTitle>
                  <CardDescription>
                    Uses @vercel/postgres for writes, invalidates the cache store (KV or Redis), and revalidates the ISR route.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAnalysis} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="font-semibold">URL</span>
                    <input
                      name="url"
                      type="url"
                      placeholder="https://example.com"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="font-semibold">Rendering Strategy</span>
                    <select
                      name="strategy"
                      defaultValue="ISR"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      {STRATEGY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Switch between ISR and force-dynamic to compare cache behavior.
                    </p>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <span className="font-semibold">Score</span>
                    <input
                      name="score"
                      type="number"
                      min={0}
                      max={100}
                      defaultValue={95}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-muted-foreground">0–100 Lighthouse-style score.</p>
                  </label>
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="font-semibold">Postgres</p>
                    <p className="text-xs text-muted-foreground">
                      {cachedResponse?.postgresEnabled
                        ? 'Connected via @vercel/postgres'
                        : 'Set POSTGRES_URL to enable writes'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="font-semibold">Cache Store</p>
                    <p className="text-xs text-muted-foreground">
                      {cachedResponse?.cacheProvider === 'kv'
                        ? 'Vercel KV stores the cached list'
                        : cachedResponse?.cacheProvider === 'redis'
                        ? 'Redis (REDIS_URL) powers the cache'
                        : 'Set KV_REST_API_* or REDIS_URL to enable caching'}
                    </p>
                  </div>
                </div>

                {clientError && (
                  <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {clientError}
                  </p>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  <Button type="submit" disabled={isPending}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
                    Insert Analysis &amp; Revalidate
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <DemoContainer
          strategy="CACHE"
          title="Cache Components (Next.js 16)"
          description="Component-level caching for granular control"
          metrics={metrics}
          cacheInfo={cacheInfo}
          sourceCode={sourceCode}
          onReRender={handleClearCache}
          onRefresh={refresh}
          isLoading={isLoading}
        >
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Cache Components Demo</h2>
              <p className="text-muted-foreground">
                Mix cached and dynamic components in the same page
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative overflow-hidden rounded-lg border-2 border-green-500/50 bg-green-50 p-4 dark:bg-green-950/20">
                <div className="absolute right-0 top-0 rounded-bl-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                  💾 CACHED
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Database className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900 dark:text-green-100">Cached Component</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="space-y-1 rounded border-2 border-green-200 bg-white p-3 dark:border-green-800 dark:bg-gray-900">
                    <p className="text-muted-foreground">Component Value:</p>
                    <Badge variant="secondary" className="font-mono text-base ring-2 ring-green-500">
                      {cachedData.value}
                    </Badge>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">🔒 This value stays the same</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-green-200 bg-white p-2 dark:border-green-800 dark:bg-gray-900">
                      <p className="text-xs text-muted-foreground">Render Time</p>
                      <p className="font-semibold text-green-700">{cachedData.renderTime.toFixed(2)}ms</p>
                    </div>
                    <div className="rounded border border-green-200 bg-white p-2 dark:border-green-800 dark:bg-gray-900">
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-semibold text-green-700">{(cachedAge / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  <div className="rounded bg-green-100 p-2 dark:bg-green-900/30">
                    <p className="text-xs font-medium text-green-800 dark:text-green-200">
                      ✓ Rendered once, reused across all requests
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      Click &quot;Trigger New Request&quot; and watch this stay the same!
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`relative overflow-hidden rounded-lg border-2 border-blue-500/50 bg-blue-50 p-4 transition-all dark:bg-blue-950/20 ${
                  dynamicJustUpdated ? 'ring-4 ring-blue-500 will-change-transform' : ''
                }`}
                style={dynamicJustUpdated ? { transform: 'scale(1.05)' } : undefined}
              >
                <div
                  className={`absolute right-0 top-0 rounded-bl-lg px-3 py-1 text-xs font-semibold text-white transition-all ${
                    dynamicJustUpdated ? 'animate-pulse bg-blue-500' : 'bg-blue-600'
                  }`}
                >
                  ⚡ {dynamicJustUpdated ? 'UPDATING' : 'DYNAMIC'}
                </div>
                <div className="mb-3 flex items-center gap-2">
                  <Zap
                    className={`h-5 w-5 text-blue-600 transition-all ${
                      dynamicJustUpdated ? 'animate-pulse' : ''
                    }`}
                  />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    Dynamic Component
                    {dynamicJustUpdated && <span className="ml-2 text-blue-600 dark:text-blue-400">✨</span>}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div
                    className={`space-y-1 rounded border-2 p-3 transition-all duration-500 dark:bg-gray-900 ${
                      dynamicJustUpdated
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950/50'
                        : 'border-blue-200 dark:border-blue-800 bg-white'
                    }`}
                  >
                    <p className="text-muted-foreground">Component Value:</p>
                    <Badge
                      variant="secondary"
                      className={`font-mono text-base transition-all duration-500 ${
                        dynamicJustUpdated ? 'ring-2 ring-blue-500 scale-110' : ''
                      }`}
                    >
                      {dynamicData.value}
                    </Badge>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {dynamicJustUpdated ? '🎉 Value just changed!' : '🔄 Changes every request'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`rounded border p-2 transition-all ${
                        dynamicJustUpdated ? 'border-blue-500 ring-1 ring-blue-500' : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Render Time</p>
                      <p className="font-semibold text-blue-700">{dynamicData.renderTime.toFixed(2)}ms</p>
                    </div>
                    <div
                      className={`rounded border p-2 transition-all ${
                        dynamicJustUpdated ? 'border-blue-500 ring-1 ring-blue-500' : 'border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="font-semibold text-blue-700">{(dynamicAge / 1000).toFixed(1)}s</p>
                    </div>
                  </div>
                  <div
                    className={`rounded p-2 transition-all ${
                      dynamicJustUpdated ? 'bg-blue-200 dark:bg-blue-800/50' : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}
                  >
                    <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                      {dynamicJustUpdated ? '✨ Fresh render completed!' : '✓ Regenerates on every request'}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {dynamicJustUpdated
                        ? 'This component was just re-rendered with new data'
                        : 'Click &quot;Trigger New Request&quot; to see this change!'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-dashed bg-muted/50 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Component-Level Caching</h3>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                Next.js 16 introduces the <code className="rounded bg-muted px-1 py-0.5">&apos;use cache&apos;</code>{' '}
                directive, allowing you to cache individual components while keeping others dynamic:
              </p>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="rounded bg-white p-3 dark:bg-gray-900">
                  <p className="font-semibold mb-1">Cached Component:</p>
                  <code className="text-xs text-green-600 dark:text-green-400">&apos;use cache&apos;</code>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>• Rendered once, reused</li>
                    <li>• Perfect for expensive operations</li>
                    <li>• Same across all users</li>
                  </ul>
                </div>
                <div className="rounded bg-white p-3 dark:bg-gray-900">
                  <p className="font-semibold mb-1">Dynamic Component:</p>
                  <code className="text-xs text-blue-600 dark:text-blue-400">(no directive)</code>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>• Fresh on every request</li>
                    <li>• User-specific content</li>
                    <li>• Always up-to-date</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
              <h3 className="mb-2 font-semibold text-violet-900 dark:text-violet-100">Cache Components Advantages</h3>
              <ul className="space-y-1 text-sm text-violet-800 dark:text-violet-200">
                <li>✓ Granular control - cache what you need</li>
                <li>✓ Flexible architecture - mix static and dynamic</li>
                <li>✓ Performance optimization - reduce render overhead</li>
                <li>✓ Fine-grained revalidation - per component</li>
                <li>⚡ Best for complex pages with mixed requirements</li>
              </ul>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <h3 className="mb-2 font-semibold">Perfect Use Cases</h3>
              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="mb-1 font-medium">Cache these components:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Navigation menus</li>
                    <li>• Product listings</li>
                    <li>• Blog post content</li>
                    <li>• Static sections</li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium">Keep these dynamic:</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• User profiles</li>
                    <li>• Shopping carts</li>
                    <li>• Real-time data</li>
                    <li>• Personalized content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DemoContainer>
      </div>
    </div>
  );
}
const describeCacheProvider = (provider?: CacheProvider) => {
  switch (provider) {
    case 'kv':
      return 'Vercel KV';
    case 'redis':
      return 'Redis';
    case 'none':
      return 'Disabled';
    default:
      return '—';
  }
};
