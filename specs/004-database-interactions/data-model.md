# Data Model: Live Web Vitals Dashboard Integration

**Date**: 2025-11-22 | **Branch**: `004-database-interactions`

## Overview

This document describes the data model for Live Web Vitals tracking, including the complete data flow from browser capture to dashboard display. The schema is already implemented in spec 003; this feature adds the wiring to populate and query the data.

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│  (Firebase) │
└──────┬──────┘
       │ 1
       │
       │ *
┌──────▼─────────────────┐
│ web_vitals_metrics     │
├────────────────────────┤
│ id (uuid, PK)          │
│ userId (string, FK)    │  ← Firebase UID from session cookie
│ url (string)           │  ← Page URL where metric captured
│ strategy (enum)        │  ← SSR | SSG | ISR | CACHE
│ name (enum)            │  ← LCP | CLS | INP | FID | TTFB
│ value (float)          │  ← Metric value (ms or score)
│ collectedAt (datetime) │  ← Timestamp (indexed)
└────────────────────────┘

Indexes (from spec 003):
- userId + collectedAt (for user-scoped time filtering)
- userId + url + strategy + collectedAt (for page-level analysis)
```

## Entities

### web_vitals_metrics (Existing Table)

**Purpose**: Store all Real User Monitoring (RUM) metrics captured from browser

**Schema** (already defined in `prisma/schema.prisma`):

```prisma
model web_vitals_metrics {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  url         String
  strategy    String   // "SSR" | "SSG" | "ISR" | "CACHE"
  name        String   // "LCP" | "CLS" | "INP" | "FID" | "TTFB"
  value       Float
  collectedAt DateTime @default(now()) @map("collected_at")

  @@index([userId, collectedAt])
  @@index([userId, url, strategy, collectedAt])
  @@map("web_vitals_metrics")
}
```

**Fields**:

- `id`: Unique identifier (UUID v4)
- `userId`: Firebase UID from session cookie (links to User table in Firebase, not Postgres)
- `url`: Full URL where metric was captured (e.g., `http://localhost:3000/lab/ssr`)
- `strategy`: Rendering strategy inferred from URL pathname
  - `/lab/ssr` → `"SSR"`
  - `/lab/ssg` → `"SSG"`
  - `/lab/isr` → `"ISR"`
  - `/lab/cache` → `"CACHE"`
  - `/dashboard` → (not tracked, meta page)
- `name`: Web Vitals metric name (5 possible values)
- `value`: Numeric value
  - LCP: milliseconds (e.g., 1234.5)
  - CLS: unitless score (e.g., 0.05)
  - INP: milliseconds (e.g., 89.2)
  - FID: milliseconds (e.g., 12.8)
  - TTFB: milliseconds (e.g., 345.1)
- `collectedAt`: Timestamp when metric was captured (browser time)

**Validation Rules** (enforced in API, see `app/api/web-vitals/route.ts`):

```typescript
const METRIC_RANGES = {
  LCP: { min: 0, max: 30000 }, // 0-30s (extreme outlier = 30s)
  CLS: { min: 0, max: 5 }, // 0-5 score (extreme = 5)
  INP: { min: 0, max: 5000 }, // 0-5s
  FID: { min: 0, max: 2000 }, // 0-2s
  TTFB: { min: 0, max: 10000 }, // 0-10s
};
```

**State Transitions**: N/A (immutable records, append-only log)

## Data Flow

### Capture → Persistence Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Browser (web-vitals library)                                  │
│    - onLCP, onCLS, onINP, onFID, onTTFB callbacks               │
│    - Fires when metric finalized (e.g., page visibility change)  │
└───────────────────────┬──────────────────────────────────────────┘
                        │ Metric { name, value, ... }
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. components/web-vitals-reporter.tsx (Client Component)         │
│    - Receives metric callback                                    │
│    - Determines strategy from window.location.pathname           │
│    - POSTs to /api/web-vitals with metric + strategy            │
│    - Error: console.warn (fail silently)                         │
└───────────────────────┬──────────────────────────────────────────┘
                        │ POST /api/web-vitals
                        │ Body: { url, strategy, name, value }
                        │ Cookie: session cookie (Firebase UID)
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. app/api/web-vitals/route.ts (API Route Handler)              │
│    - Validates session cookie → userId                           │
│    - Validates metric name, value range, strategy               │
│    - Calls createWebVitalsMetric()                               │
│    - Returns: { success: true, metricId }                        │
└───────────────────────┬──────────────────────────────────────────┘
                        │ userId + validated data
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. lib/db/web-vitals.ts (Database Layer)                        │
│    - createWebVitalsMetric(data)                                 │
│    - Prisma: prisma.web_vitals_metrics.create()                  │
│    - Returns: created record                                     │
└───────────────────────┬──────────────────────────────────────────┘
                        │ INSERT INTO web_vitals_metrics
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. Neon PostgreSQL (Serverless Postgres)                         │
│    - Row inserted with indexed collectedAt                       │
│    - HTTP-based connection via @prisma/adapter-neon              │
└──────────────────────────────────────────────────────────────────┘
```

### Query → Display Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /dashboard                                  │
└───────────────────────┬──────────────────────────────────────────┘
                        │ GET /dashboard
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. app/dashboard/@metrics/page.tsx (Server Component)           │
│    - async function MetricsPage()                                │
│    - Get session from cookies()                                  │
│    - Query: listWebVitalsMetrics with groupBy                    │
│    - Transform: Map<strategy, Map<metric, avgValue>>            │
│    - Render: <MetricsPanel> with real data                       │
└───────────────────────┬──────────────────────────────────────────┘
                        │ userId + timeRange (last 24h)
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. lib/db/web-vitals.ts (Database Layer)                        │
│    - Custom query: prisma.web_vitals_metrics.groupBy()          │
│    - Group by: [strategy, name]                                 │
│    - Where: userId + collectedAt >= 24h ago                     │
│    - Aggregate: _avg { value }                                   │
└───────────────────────┬──────────────────────────────────────────┘
                        │ SELECT strategy, name, AVG(value)
                        │ FROM web_vitals_metrics
                        │ WHERE user_id = ? AND collected_at >= ?
                        │ GROUP BY strategy, name
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Neon PostgreSQL                                                │
│    - Index scan on (userId, collectedAt)                         │
│    - GROUP BY aggregation                                        │
│    - Returns ~20 rows (4 strategies × 5 metrics)                 │
└───────────────────────┬──────────────────────────────────────────┘
                        │ Array<{ strategy, name, _avg: { value } }>
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│ 5. components/dashboard/metrics-panel.tsx (Display)             │
│    - Receives: avgLCP, avgCLS, avgINP, avgFID, avgTTFB          │
│    - Renders StrategyCard with color-coded metrics              │
│    - Shows empty state if no data                                │
└──────────────────────────────────────────────────────────────────┘
```

## Seed Data Generation

### Seed Script Strategy

**File**: `prisma/seed.ts`

**Goal**: Generate 337 realistic metrics across 7 days for compelling demo

**Distribution**:

- SSG: 100 metrics (fastest strategy)
- ISR: 87 metrics
- CACHE: 75 metrics
- SSR: 75 metrics (slowest strategy)
- Total: 337 metrics

**Temporal Spread**: 7 days back from `now()`, evenly distributed

**Metric Values** (LCP as example):

| Strategy | Mean LCP | StdDev | Good (<2500ms) % |
| -------- | -------- | ------ | ---------------- |
| SSG      | 600ms    | 150ms  | ~99%             |
| ISR      | 900ms    | 200ms  | ~95%             |
| CACHE    | 1200ms   | 250ms  | ~85%             |
| SSR      | 1800ms   | 400ms  | ~60%             |

**Time-of-Day Variations**:

```typescript
const timeFactorMultiplier = (hour: number): number => {
  if (hour >= 9 && hour <= 17) return 1.3; // Peak hours (+30%)
  if (hour >= 22 || hour <= 6) return 0.8; // Off-hours (-20%)
  return 1.0; // Normal hours
};
```

**Generation Algorithm**:

```typescript
for (const strategy of ["SSG", "SSR", "ISR", "CACHE"]) {
  const count = strategyCount[strategy];
  for (let i = 0; i < count; i++) {
    const timestamp = now - Math.random() * 7 * 24 * 60 * 60 * 1000; // Random time in last 7 days
    const hour = new Date(timestamp).getHours();
    const timeFactor = timeFactorMultiplier(hour);

    for (const metricName of ["LCP", "CLS", "INP", "FID", "TTFB"]) {
      const mean = STRATEGY_MEANS[strategy][metricName];
      const stddev = STRATEGY_STDDEVS[strategy][metricName];
      const value = gaussianRandom(mean, stddev) * timeFactor;

      await prisma.web_vitals_metrics.create({
        data: {
          userId: demoUserId,
          url: `http://localhost:3000/lab/${strategy.toLowerCase()}`,
          strategy,
          name: metricName,
          value: clamp(
            value,
            METRIC_RANGES[metricName].min,
            METRIC_RANGES[metricName].max
          ),
          collectedAt: new Date(timestamp),
        },
      });
    }
  }
}
```

**Idempotency**: Use `createMany` with `skipDuplicates: true` (requires unique constraint on timestamp + strategy + name)

## Aggregation Patterns

### Dashboard Metrics (Current Implementation)

**Query**: Last 24 hours, average per strategy per metric

```typescript
const metrics = await prisma.web_vitals_metrics.groupBy({
  by: ["strategy", "name"],
  where: {
    userId: session.userId,
    collectedAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
  _avg: {
    value: true,
  },
});
```

**Result Shape**:

```typescript
[
  { strategy: "SSG", name: "LCP", _avg: { value: 615.3 } },
  { strategy: "SSG", name: "CLS", _avg: { value: 0.03 } },
  { strategy: "SSG", name: "INP", _avg: { value: 45.2 } },
  // ... (20 rows total for 4 strategies × 5 metrics)
];
```

**Transformation for Display**:

```typescript
const strategyMetrics = new Map<string, Map<string, number>>();

for (const row of metrics) {
  if (!strategyMetrics.has(row.strategy)) {
    strategyMetrics.set(row.strategy, new Map());
  }
  strategyMetrics.get(row.strategy)!.set(row.name, row._avg.value!);
}

// Usage:
const ssgMetrics = strategyMetrics.get("SSG");
const avgLCP = ssgMetrics?.get("LCP") ?? null;
```

### Time-Series Chart (Optional Phase 2)

**Query**: Hourly averages for LCP over last 24 hours

```typescript
const hourlyLCP = await prisma.$queryRaw<
  Array<{
    hour: string;
    strategy: string;
    avg_lcp: number;
  }>
>`
  SELECT
    DATE_TRUNC('hour', collected_at)::text as hour,
    strategy,
    AVG(value) as avg_lcp
  FROM web_vitals_metrics
  WHERE
    name = 'LCP'
    AND user_id = ${userId}
    AND collected_at >= NOW() - INTERVAL '24 hours'
  GROUP BY DATE_TRUNC('hour', collected_at), strategy
  ORDER BY hour ASC
`;
```

**Result**: Array of { hour, strategy, avg_lcp } for Recharts LineChart

## Data Lifecycle

### Data Retention (Future Enhancement)

Currently: **No automatic deletion** (unbounded growth)

**Future**: Implement retention policy

- Keep 30 days of raw metrics
- Aggregate older data into daily summaries
- Use Postgres partitioning for performance
- Neon autoscaling handles storage growth

### Data Privacy

- **User-scoped**: All queries filtered by `userId` from session cookie
- **No PII**: URLs are localhost (demo) or portfolio domain (production)
- **No tracking consent required**: First-party RUM on own website

### Performance Characteristics

**Write Load**:

- 5 metrics per page load
- ~20-50 metrics per user session
- Single INSERT per metric (no batching needed)
- <500ms p95 latency per write

**Read Load**:

- 1 query per dashboard page load
- <100ms p95 latency (indexed timestamp filter)
- Result size: ~20 rows (small)
- Server Component caching reduces queries

## Summary

The data model is simple and already implemented in spec 003. This feature adds:

1. **Capture Flow**: WebVitalsReporter → POST /api/web-vitals → Prisma → Neon
2. **Query Flow**: Dashboard Server Component → groupBy query → display
3. **Seed Data**: 337 realistic metrics across 7 days for demo
4. **Aggregation**: Strategy-level averages with time filtering

No schema changes required. All tables, indexes, and types already exist. Implementation focuses on wiring up the data flow.
