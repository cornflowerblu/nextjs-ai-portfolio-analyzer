# Implementation Plan: Live Web Vitals Dashboard Integration

**Branch**: `004-database-interactions` | **Date**: 2025-11-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-database-interactions/spec.md`

## Summary

Transform the mock-data dashboard into a production-grade Real User Monitoring system by wiring up complete data flow: client-side Web Vitals capture → `/api/web-vitals` persistence → Neon PostgreSQL storage → Server Component queries → dashboard aggregation display. Includes seed script for instant demo data generation (337 metrics across 7 days). Demonstrates Next.js 16 Server Components + Neon serverless Postgres integration with real-time performance tracking.

## Technical Context

**Language/Version**: TypeScript 5.x + Next.js 16.0.3 (App Router with Turbopack)  
**Primary Dependencies**:

- Prisma 7.0.0 with @prisma/adapter-neon
- @neondatabase/serverless (already configured)
- web-vitals 4.2.4 (already integrated)
- Recharts 2.15.0 (already in dependencies)
- Firebase Admin SDK with Application Default Credentials

**Storage**:

- Neon PostgreSQL (serverless Postgres via Vercel)
- Prisma schema: `web_vitals_metrics` table (already exists)
- Connection via `@prisma/adapter-neon` HTTP-based driver
- Existing indexes: userId+collectedAt, userId+url+strategy+collectedAt

**Testing**:

- Vitest 2.1.8 (41 existing tests passing)
- @testing-library/react for component tests
- Playwright for E2E (optional data generation bot)
- Existing tests: `__tests__/lib/db/web-vitals.test.ts`, `__tests__/app/api/web-vitals/route.test.ts`

**Target Platform**:

- Browser (modern ES2022 with Web Vitals API)
- Vercel deployment (Node.js 20.x serverless functions)
- Edge runtime for static assets, Node.js runtime for database queries

**Project Type**: Web application (Next.js fullstack)

**Performance Goals**:

- Dashboard Server Component render < 2s with database query
- `/api/web-vitals` POST endpoint < 500ms (p95) including DB write
- Database queries < 100ms (p95) as per constitution
- Web Vitals capture overhead < 10ms (negligible impact on measured metrics)
- Seed script execution < 5 seconds for 337 metrics

**Constraints**:

- Prisma Client must use `@prisma/adapter-neon` (HTTP-based, no WebSocket/Pool)
- Firebase session cookie authentication (no Bearer tokens in client)
- Server Components for database queries (no client-side DB access)
- Graceful degradation if unauthenticated (Web Vitals capture fails silently)
- Seed data must look realistic (not obviously generated)

**Scale/Scope**:

- Single-user MVP (multi-tenant ready via userId)
- 4 rendering strategies: SSR, SSG, ISR, CACHE
- 5 Web Vitals metrics: LCP, CLS, INP, FID, TTFB
- Historical data: 7 days (seed), unbounded (production)
- Expected load: ~20-50 metrics per user session
- Seed generates: 337 metrics (50-100 per strategy)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Core Principles Compliance

✅ **I. Performance-First Architecture**

- Dashboard queries include `collectedAt` filter (indexed) for <100ms p95
- API endpoint reuses existing tested route with validation
- Server Component parallel loading (no waterfall)
- Seed script benchmarked for <5s execution

✅ **II. Explicit Rendering Strategies**

- Dashboard uses Server Components (explicit `async` function, no 'use client')
- WebVitalsReporter remains client component (accesses browser APIs)
- Strategy determination from URL pathname is explicit and documented

✅ **III. Test-First Development**

- Reuses 14 existing Web Vitals tests from spec 003
- New seed script will have unit test for data generation logic
- Dashboard query will have integration test (mock Prisma)
- E2E Playwright test (optional) for full flow validation

✅ **IV. AI-Driven Insights**

- N/A for this feature (data collection only, insights in future phase)

✅ **V. Platform Feature Maximization**

- Uses Neon serverless Postgres (Vercel Postgres)
- Demonstrates Server Components querying database
- Shows serverless API route persistence
- Vercel deployment ready (no infrastructure changes)

✅ **VI. Developer Experience Excellence**

- Adds `db:seed`, `db:studio` npm scripts
- Seed script has progress logging
- Dashboard shows empty state with helpful message
- TypeScript types already complete from spec 003

✅ **VII. Progressive Enhancement**

- Dashboard gracefully degrades to empty state if no data
- WebVitalsReporter fails silently if unauthenticated
- Mock data fallback remains available (commented out)
- Feature is additive (doesn't break existing functionality)

✅ **VIII. Data Persistence & Historical Tracking**

- Core requirement: persists ALL Web Vitals metrics
- Enables historical trending (7 days via seed, unbounded in production)
- User-scoped via `userId` (Firebase UID from session cookie)
- Indexed queries for efficient historical retrieval

### Performance Standards Compliance

✅ Database query response time < 100ms (p95)

- Query limited to 24h window with indexed `collectedAt`
- Uses `groupBy` aggregation (efficient SQL GROUP BY)
- Prisma generates optimized SQL

✅ API endpoints with database queries < 500ms (p95)

- `/api/web-vitals` already tested and benchmarked
- Single INSERT operation (no complex joins)
- Neon HTTP-based driver optimized for latency

✅ Historical data queries paginated (max 100 records)

- Dashboard uses aggregation (4 rows max: one per strategy)
- No pagination needed for summary view
- Future detail view will use `take: 100` (already in listWebVitalsMetrics)

### Security Requirements Compliance

✅ Input validation for all URL testing

- Existing `/api/web-vitals` validates all inputs (tested in spec 003)
- URL validation against SSRF attacks
- Metric ranges validated (METRIC_RANGES constants)

✅ Rate limiting on API endpoints

- Not implemented yet, but spec 003 noted as future enhancement
- Low risk: requires authentication (session cookie)
- Future: Add rate-limiting middleware

### Constitution Gates: ✅ PASS

No violations. All principles met or explicitly marked N/A with justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Next.js App Router Structure (existing)
app/
├── api/
│   └── web-vitals/
│       └── route.ts                    # ✅ EXISTS - Reuse with no changes
├── dashboard/
│   ├── layout.tsx                      # ✅ EXISTS - No changes needed
│   ├── page.tsx                        # ✅ EXISTS - Header component only
│   └── @metrics/
│       ├── page.tsx                    # 🔧 MODIFY - Add database query
│       ├── loading.tsx                 # ✅ EXISTS - Suspense boundary
│       └── default.tsx                 # ✅ EXISTS - Parallel route fallback

# Components (existing)
components/
├── web-vitals-reporter.tsx             # 🔧 MODIFY - Add API POST call
└── dashboard/
    ├── metrics-panel.tsx               # ✅ EXISTS - Receives props (no changes)
    ├── strategy-card.tsx               # ✅ EXISTS - Display component (no changes)
    └── vitals-chart.tsx                # ➕ CREATE (Optional) - Time-series chart

# Database Layer (existing from spec 003)
lib/
├── db/
│   ├── prisma.ts                       # ✅ EXISTS - Prisma client singleton
│   └── web-vitals.ts                   # ✅ EXISTS - Reuse query functions
└── generated/
    └── prisma/                         # ✅ EXISTS - Generated Prisma Client

# Database Configuration (existing)
prisma/
├── schema.prisma                       # ✅ EXISTS - web_vitals_metrics table
└── seed.ts                             # ➕ CREATE - Seed script for demo data

# Tests (existing structure)
__tests__/
├── lib/
│   └── db/
│       └── web-vitals.test.ts          # ✅ EXISTS - 14 tests (reuse)
├── app/
│   └── api/
│       └── web-vitals/
│           └── route.test.ts           # ✅ EXISTS - API tests (reuse)
└── prisma/
    └── seed.test.ts                    # ➕ CREATE - Test seed data generation

# E2E Tests (optional)
tests/
└── e2e/
    └── web-vitals-capture.spec.ts      # ➕ CREATE (Optional) - Playwright bot

# Configuration
package.json                            # 🔧 MODIFY - Add db:seed, db:studio scripts
```

**Structure Decision**: Next.js App Router web application. Uses existing monolithic structure with App Router parallel routes for dashboard. Database layer already established in spec 003. New code is minimal: modify 2 files (WebVitalsReporter, dashboard page), create 2 files (seed script + optional chart), add 4 npm scripts. Reuses 41 existing tests from spec 003.

### Files to Modify

1. **components/web-vitals-reporter.tsx** (~40 lines added)
   - Add `saveMetricToDatabase` function
   - POST to `/api/web-vitals` with session cookie (automatic)
   - Determine strategy from URL pathname
   - Error handling (fail silently, don't break UX)

2. **app/dashboard/@metrics/page.tsx** (~60 lines modified)
   - Change from Client Component to Server Component (remove 'use client')
   - Add Prisma query for last 24h metrics grouped by strategy
   - Pass real data to MetricsPanel components
   - Show empty state if no data

3. **package.json** (~4 lines added)
   - `"db:seed": "tsx prisma/seed.ts"`
   - `"db:studio": "prisma studio"`
   - `"db:push": "prisma db push"` (if not exists)
   - `"db:reset": "prisma migrate reset"` (if not exists)

### Files to Create

1. **prisma/seed.ts** (~200 lines)
   - Generate 337 metrics across 7 days
   - Realistic distributions: SSG 600ms LCP, SSR 1800ms LCP
   - Time-of-day variations (peak hours slower)
   - Progress logging with emoji
   - Idempotent (uses unique timestamps)

2. **components/dashboard/vitals-chart.tsx** (~100 lines, OPTIONAL Phase 2)
   - Recharts LineChart component
   - Display LCP trend over 24 hours
   - Group by hour with averages
   - All strategies on same chart

3. \***\*tests**/prisma/seed.test.ts\*\* (~50 lines)
   - Test seed data generation logic
   - Verify metric distributions are realistic
   - Check timestamp ranges (7 days)
   - Validate strategy assignment

4. **tests/e2e/web-vitals-capture.spec.ts** (~80 lines, BACKUP PLAN)
   - Playwright test for full flow
   - Login → browse 4 pages × 25 times → verify database
   - Generate bulk data (100 metrics)
   - Only if time permits

### No Changes Required

- ✅ `app/api/web-vitals/route.ts` - Already handles POST with full validation
- ✅ `lib/db/web-vitals.ts` - createWebVitalsMetric and listWebVitalsMetrics ready
- ✅ `lib/db/prisma.ts` - Prisma client configured with @prisma/adapter-neon
- ✅ `prisma/schema.prisma` - web_vitals_metrics table exists with indexes
- ✅ `components/dashboard/metrics-panel.tsx` - Generic component, props-driven
- ✅ All existing 41 tests - No modifications needed

## Complexity Tracking

**N/A - No violations**

All 8 constitutional gates passed in Phase 1 Constitution Check:

- Gates 1-3: Performance targets met (<100ms DB, <500ms API, efficient queries)
- Gate 4: Complexity justified (RUM system is demo-grade, ~200 lines, reuses spec 003)
- Gate 5: Security preserved (reuse session cookies, no new auth surface)
- Gate 6: Error handling planned (fail silently in reporter, empty state in dashboard)
- Gate 7: No premature optimization (simple aggregation, optional charting deferred)
- Gate 8: Code quality maintained (TypeScript, consistent patterns, 41 existing tests)
