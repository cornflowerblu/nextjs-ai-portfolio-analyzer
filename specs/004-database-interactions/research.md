# Phase 0: Research - Live Web Vitals Dashboard Integration

**Date**: 2025-01-22 | **Branch**: `004-database-interactions`

## Technical Decisions & Research Findings

### 1. Web Vitals Capture Pattern

**Decision**: Use `web-vitals` npm library (v4.2.4) with onCLS/onLCP/onINP/onFID/onTTFB reporters

**Rationale**:

- Industry standard library maintained by Google Chrome team
- Handles all Core Web Vitals with proper attribution
- TypeScript types included
- Non-blocking implementation (doesn't affect measured metrics)
- Battle-tested across millions of websites
- Provides stable callback API for metric reporting

**Alternatives Considered**:

1. **Custom PerformanceObserver**
   - Pros: No dependency, full control
   - Cons: Complex implementation, easy to get wrong, no CLS calculation logic
   - Rejected: Reinventing the wheel, high risk of measurement errors

2. **Analytics SDK** (e.g., Google Analytics, Vercel Analytics)
   - Pros: Turnkey solution, visualization included
   - Cons: Vendor lock-in, no raw data access, limited customization
   - Rejected: Portfolio needs to demonstrate custom implementation

**Implementation Notes**:

- Import from `web-vitals` package
- Use `onCLS`, `onLCP`, `onINP`, `onFID`, `onTTFB` functions
- Each provides a callback with `Metric` object containing name, value, delta, etc.
- Metrics report when finalized (e.g., LCP when page visibility changes)

### 2. Real User Monitoring (RUM) Data Flow Architecture

**Decision**: Browser → WebVitalsReporter (Client Component) → POST /api/web-vitals → Prisma → Neon → Dashboard (Server Component)

**Rationale**:

- Standard Next.js pattern: Client Component for browser APIs, Server Component for database
- Session cookie authentication handled automatically by Next.js middleware
- Leverages Server Components for efficient database queries (no client-side overhead)
- Prisma provides type-safe database access with optimized queries
- Neon's HTTP-based driver perfect for serverless functions (no connection pooling needed)

**Alternatives Considered**:

1. **Client-side fetch from dashboard**
   - Pros: Real-time updates
   - Cons: Breaks Server Component pattern, requires API endpoint for read, slower initial render
   - Rejected: Goes against Next.js 16 best practices

2. **Server Actions for write, Server Component for read**
   - Pros: Type-safe end-to-end, no API route needed
   - Cons: Server Actions are for mutations from forms, not programmatic calls
   - Rejected: Web Vitals capture is not form-based

3. **WebSocket for real-time streaming**
   - Pros: True real-time dashboard updates
   - Cons: Complex infrastructure, Neon HTTP driver doesn't support long connections
   - Rejected: Overkill for portfolio demo, adds deployment complexity

**Implementation Notes**:

- WebVitalsReporter: Client Component with `'use client'` directive
- Dashboard metrics page: Server Component (async function, no 'use client')
- API route uses NextRequest/NextResponse for standard REST endpoint
- Prisma query uses `@prisma/adapter-neon` for HTTP-based connections

### 3. Seed Data Distribution & Realism

**Decision**: Gaussian-like distribution with strategy-specific means and time-of-day variations

**Strategy-Specific LCP Targets** (based on Next.js rendering characteristics):

- **SSG** (Static Site Generation): 600ms mean (fastest, pre-rendered HTML)
- **ISR** (Incremental Static Regeneration): 900ms mean (cached with occasional regeneration)
- **CACHE** (Cache Components): 1200ms mean (Server Components with caching)
- **SSR** (Server-Side Rendering): 1800ms mean (slowest, on-demand rendering)

**Time-of-Day Variations**:

- Peak hours (9 AM - 5 PM): +30% to mean (simulating server load)
- Off-hours (10 PM - 6 AM): -20% to mean (simulating low traffic)
- Weekend slowdown: +10% across all hours

**Distribution Algorithm**:

```
value = mean + (random_gaussian * stddev) + time_factor + weekend_factor
```

**Rationale**:

- Realistic demo showcases performance differences between strategies
- Matches expected production behavior (SSG fastest, SSR slowest)
- Time variations demonstrate monitoring over different load conditions
- Gaussian distribution mimics real-world network/server performance

**Alternatives Considered**:

1. **Uniform Random Distribution**
   - Pros: Simple implementation
   - Cons: Unrealistic, no clear performance patterns
   - Rejected: Doesn't demonstrate value of different rendering strategies

2. **Real Traffic Capture**
   - Pros: Genuinely realistic
   - Cons: No historical data available, requires manual browsing
   - Rejected: Portfolio demo needs instant data for presentation

3. **Recorded Production Data Replay**
   - Pros: True production patterns
   - Cons: Privacy concerns, not available for new projects
   - Rejected: This is a new demo application

**Implementation Notes**:

- Use Box-Muller transform for Gaussian random numbers
- Store strategy-specific constants: `STRATEGY_MEANS`, `STRATEGY_STDDEVS`
- Calculate time factor: `(hour >= 9 && hour <= 17) ? mean * 0.3 : -mean * 0.2`
- Weekend detection: `day === 0 || day === 6` (Sunday/Saturday)

### 4. Database Query Optimization for Dashboard

**Decision**: Single Prisma `groupBy` query with `collectedAt` filter and `_avg` aggregation

**Query Structure**:

```typescript
const metrics = await prisma.webVitalsMetric.groupBy({
  by: ["strategy"],
  where: {
    userId: session.userId,
    collectedAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
    },
  },
  _avg: {
    lcpMs: true,
    cls: true,
    inpMs: true,
    fidMs: true,
    ttfbMs: true,
  },
});
```

**Rationale**:

- Single query for all strategies (no N+1 problem)
- `collectedAt` indexed for fast filtering (from spec 003 schema)
- `groupBy` leverages SQL GROUP BY (efficient database operation)
- Aggregation happens in database (not in Node.js)
- Returns 4 rows max (one per strategy, with all metrics averaged)
- Prisma generates optimized SQL for Neon's Postgres dialect

**Alternatives Considered**:

1. **Multiple queries per strategy**
   - Pros: Simple logic
   - Cons: N+1 problem, 4× database round-trips, slower
   - Rejected: Violates performance constitution (p95 < 100ms)

2. **Client-side grouping with `findMany`**
   - Pros: Flexible filtering in Node.js
   - Cons: Transfers all rows to server, memory overhead, slow
   - Rejected: Doesn't leverage database power

3. **Raw SQL query**
   - Pros: Maximum control, potentially faster
   - Cons: Loses type safety, Prisma benefits, harder to maintain
   - Rejected: Prisma `groupBy` is efficient enough, type safety valuable

**Implementation Notes**:

- Query returns array of `{ strategy, _avg: { lcpMs, cls, inpMs, fidMs, ttfbMs } }`
- Transform to `Map<strategy, MetricAverages>` for display components
- Empty result = show empty state (no error)
- Uses existing Prisma client from `lib/db/prisma.ts`

### 5. Time-Series Visualization (Optional Phase 2)

**Decision**: Recharts `LineChart` with hourly aggregation (if time permits)

**Rationale**:

- Recharts already in `package.json` (from existing dependencies)
- Responsive design out-of-box
- TypeScript support with proper types
- Simple API for common chart types
- Good documentation and examples
- Smaller bundle size than D3.js

**Alternatives Considered**:

1. **D3.js**
   - Pros: Maximum flexibility, powerful
   - Cons: Steep learning curve, verbose code, large bundle
   - Rejected: Overkill for simple line chart

2. **Chart.js**
   - Pros: Popular, lots of examples
   - Cons: Not React-native (requires react-chartjs-2 wrapper), imperative API
   - Rejected: Recharts more idiomatic for React

3. **Victory**
   - Pros: React-native, composable
   - Cons: Heavier bundle than Recharts, less popular
   - Rejected: Recharts already available

**Implementation Notes** (if implemented):

- Component: `components/dashboard/vitals-chart.tsx`
- Query: Add `groupBy` with `collectedAt` bucketed by hour
- Data: `{ hour: string, SSG: number, SSR: number, ISR: number, CACHE: number }`
- Chart: Multiple `<Line>` components with strategy colors
- Defer to Phase 2 (optional), focus on core functionality first

### 6. Error Handling & Graceful Degradation

**Decision**: Silent failure in WebVitalsReporter, empty state in dashboard

**Reporter Error Handling**:

- Try-catch around fetch to `/api/web-vitals`
- On error: `console.warn('Failed to save metric', error)` but continue
- No user-facing error messages (metrics capture must not break UX)
- Metrics accumulate in browser (future: retry queue)

**Dashboard Error Handling**:

- Query returns empty array: Show empty state with helpful message
- Database connection error: Let Next.js error boundary handle (error.tsx)
- No special retry logic (Server Component re-renders on navigation)

**Rationale**:

- Web Vitals capture is observability feature, not user-facing
- Failed metric saves should not break page functionality
- Empty dashboard is acceptable state (user can run seed script)
- Error boundaries provide fallback UI for critical failures

**Alternatives Considered**:

1. **Retry Logic with Exponential Backoff**
   - Pros: Higher reliability
   - Cons: Adds complexity, delays page interactions
   - Rejected: Overkill for portfolio demo, metrics loss acceptable

2. **Error Boundary Around Reporter**
   - Pros: Isolates failures
   - Cons: Too aggressive, would hide all metrics
   - Rejected: Reporter should fail silently per metric

3. **User-Facing Error Toasts**
   - Pros: User awareness
   - Cons: Annoying, exposes implementation details
   - Rejected: Users shouldn't care about monitoring failures

**Implementation Notes**:

- Reporter: `try { await fetch(...) } catch (err) { console.warn(err) }`
- Dashboard: `if (metrics.length === 0) return <EmptyState />`
- EmptyState message: "No metrics yet. Run `npm run db:seed` to generate demo data."

## Prisma Aggregation Queries Reference

### `groupBy` API Documentation

**Basic Usage**:

```typescript
const result = await prisma.model.groupBy({
  by: ['field1', 'field2'],      // Group by these columns
  where: { ... },                 // Filter before grouping
  _count: { fieldName: true },    // Count aggregation
  _avg: { fieldName: true },      // Average aggregation
  _sum: { fieldName: true },      // Sum aggregation
  _min: { fieldName: true },      // Minimum aggregation
  _max: { fieldName: true },      // Maximum aggregation
  having: { ... },                // Filter after grouping (like SQL HAVING)
  orderBy: { ... },               // Sort results
  take: 100,                      // Limit results
  skip: 0,                        // Offset for pagination
});
```

**Return Type**:

```typescript
Array<{
  field1: string;
  field2: string;
  _count: { fieldName: number };
  _avg: { fieldName: number | null };
  // ... other aggregations
}>;
```

**Performance Considerations**:

- Always filter with indexed columns in `where` (e.g., `collectedAt`, `userId`)
- `groupBy` generates SQL GROUP BY (efficient database operation)
- Avoid grouping by high-cardinality fields (e.g., `url` without LIMIT)
- Use `having` for post-aggregation filtering (applied after GROUP BY)

### Seed Script Data Generation Strategies

**Idempotency Pattern**:

```typescript
// Use predictable timestamps to avoid duplicates
const baseTimestamp = new Date('2025-01-15T00:00:00Z').getTime();
for (let i = 0; i < count; i++) {
  const timestamp = new Date(baseTimestamp + i * 1000 * 60); // 1 min apart
  // Check existence or use upsert
  await prisma.web_vitals_metrics.create({ data: { collectedAt: timestamp, ... } });
}
```

**Batch Insert Optimization**:

```typescript
// Use createMany for bulk inserts (much faster)
await prisma.web_vitals_metrics.createMany({
  data: metricsArray, // Array of objects
  skipDuplicates: true, // Idempotent (requires unique constraint)
});
```

**Progress Logging**:

```typescript
for (let i = 0; i < strategies.length; i++) {
  console.log(
    `🔄 Generating ${strategy} metrics... (${i + 1}/${strategies.length})`
  );
  // Generate metrics for strategy
  console.log(`✅ Created ${count} ${strategy} metrics`);
}
console.log(`🎉 Seed complete! Generated ${total} metrics across ${days} days`);
```

## Web Vitals API Reference

### Core Metrics Definitions

| Metric   | Full Name                 | Unit  | Good  | Needs Improvement | Poor  | Description                                     |
| -------- | ------------------------- | ----- | ----- | ----------------- | ----- | ----------------------------------------------- |
| **LCP**  | Largest Contentful Paint  | ms    | <2500 | 2500-4000         | >4000 | Time until largest content element visible      |
| **CLS**  | Cumulative Layout Shift   | score | <0.1  | 0.1-0.25          | >0.25 | Visual stability (layout shift amount)          |
| **INP**  | Interaction to Next Paint | ms    | <200  | 200-500           | >500  | Responsiveness to user interactions             |
| **FID**  | First Input Delay         | ms    | <100  | 100-300           | >300  | Time from first interaction to browser response |
| **TTFB** | Time to First Byte        | ms    | <800  | 800-1800          | >1800 | Server response time                            |

### `web-vitals` Library Usage

**Installation**: `npm install web-vitals` (already installed)

**Import**:

```typescript
import { onCLS, onLCP, onINP, onFID, onTTFB } from "web-vitals";
```

**Metric Callback**:

```typescript
onLCP((metric) => {
  console.log("LCP:", metric);
  // metric.name = 'LCP'
  // metric.value = 1234 (in ms)
  // metric.delta = 1234 (change since last report)
  // metric.id = 'v3-1234567890' (unique ID for this metric)
  // metric.entries = [PerformanceEntry, ...] (underlying browser API data)
});
```

**All Metrics Setup**:

```typescript
function reportWebVitals(metric: Metric) {
  // Save to database
}

onCLS(reportWebVitals);
onLCP(reportWebVitals);
onINP(reportWebVitals);
onFID(reportWebVitals);
onTTFB(reportWebVitals);
```

**TypeScript Types**:

```typescript
import type {
  Metric,
  CLSMetric,
  LCPMetric,
  INPMetric,
  FIDMetric,
  TTFBMetric,
} from "web-vitals";

// Metric is union type of all metric types
type Metric = CLSMetric | LCPMetric | INPMetric | FIDMetric | TTFBMetric;
```

## Recharts Time-Series Patterns (Optional Phase 2)

### Basic LineChart Setup

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { hour: '00:00', SSG: 600, SSR: 1800, ISR: 900, CACHE: 1200 },
  { hour: '01:00', SSG: 580, SSR: 1750, ISR: 880, CACHE: 1180 },
  // ...
];

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="hour" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="SSG" stroke="#10b981" />
    <Line type="monotone" dataKey="SSR" stroke="#ef4444" />
    <Line type="monotone" dataKey="ISR" stroke="#f59e0b" />
    <Line type="monotone" dataKey="CACHE" stroke="#3b82f6" />
  </LineChart>
</ResponsiveContainer>
```

### Data Transformation for Hourly Aggregation

```typescript
// Query: Group by hour (truncate timestamp)
const hourlyMetrics = await prisma.$queryRaw<
  Array<{
    hour: string;
    strategy: string;
    avg_lcp: number;
  }>
>`
  SELECT
    DATE_TRUNC('hour', collected_at) as hour,
    strategy,
    AVG(lcp_ms) as avg_lcp
  FROM web_vitals_metrics
  WHERE user_id = ${userId} AND lcp_ms IS NOT NULL
  GROUP BY DATE_TRUNC('hour', collected_at), strategy
  ORDER BY hour ASC
`;

// Transform to Recharts format
const chartData = Object.entries(
  hourlyMetrics.reduce(
    (acc, row) => {
      const key = row.hour.toISOString().slice(11, 16); // "HH:MM"
      if (!acc[key]) acc[key] = { hour: key };
      acc[key][row.strategy] = row.avg_lcp;
      return acc;
    },
    {} as Record<string, any>
  )
);
```

## Summary of Research-Based Decisions

1. ✅ **Web Vitals Capture**: `web-vitals` library (industry standard, TypeScript, non-blocking)
2. ✅ **RUM Data Flow**: Browser → Reporter → API → Prisma → Neon → Server Component
3. ✅ **Seed Data**: Gaussian distribution with strategy-specific means (SSG=600ms, SSR=1800ms)
4. ✅ **Database Query**: Single `groupBy` with timestamp filter and `_avg` aggregation
5. ✅ **Visualization**: Recharts LineChart (optional Phase 2, already in deps)
6. ✅ **Error Handling**: Silent failure in reporter, empty state in dashboard

**No NEEDS CLARIFICATION items remaining**. All technical decisions researched and documented with rationale, alternatives, and implementation notes. Ready to proceed to Phase 1 (Design & Contracts).
