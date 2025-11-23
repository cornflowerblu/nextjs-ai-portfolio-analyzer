# Feature Specification: Live Web Vitals Dashboard Integration

**Feature ID**: 004  
**Status**: Planning  
**Created**: 2025-11-22  
**Priority**: High

## Overview

Wire up end-to-end database integration to demonstrate real-time Web Vitals tracking, persistence to Neon PostgreSQL, and aggregated metrics display on the dashboard. This feature transforms the existing mock data dashboard into a production-grade Real User Monitoring (RUM) system that showcases Next.js + Neon serverless Postgres integration.

## Problem Statement

The current Prisma + Neon integration (spec 003) successfully implements user authentication persistence, but provides no visible user actions that demonstrate database capabilities. The dashboard displays mock data, Web Vitals are captured but only logged to console, and users cannot see their actual performance metrics accumulate over time.

**Key Issues**:

- No user action persistence beyond login
- Dashboard shows fake/static metrics
- Cannot demonstrate Neon's serverless Postgres value
- Missing compelling demo for Next.js + database integration
- No real-world use case (RUM monitoring is production-grade)

## Solution

Implement a complete data flow: Client-side Web Vitals capture → API persistence → Neon database → Server Component queries → Dashboard display with real-time aggregation.

### User Stories

1. **As a developer**, I want to see my actual browsing performance metrics so I can understand which rendering strategies perform best
2. **As a portfolio viewer**, I want to see live database interactions to understand Next.js + Neon integration patterns
3. **As a performance engineer**, I want historical metrics to identify performance regressions and trends
4. **As a demo presenter**, I want instant seed data to show dashboard populated with realistic metrics

## Requirements

### Functional Requirements

**FR1**: WebVitalsReporter sends metrics to `/api/web-vitals` POST endpoint

- Extract session from HTTP-only cookie (no explicit auth header needed)
- POST metrics with url, strategy, and Core Web Vitals (LCP, CLS, INP, FID, TTFB)
- Determine rendering strategy from URL pathname (`/lab/ssr` → "SSR")
- Handle unauthenticated gracefully (fail silently, don't break UX)
- Debounce to avoid excessive API calls (max 1 per metric type per page)

**FR2**: Dashboard queries real metrics from database

- Server Component queries last 24 hours of user's metrics
- Aggregate by rendering strategy using SQL GROUP BY
- Calculate averages: AVG(lcpMs), AVG(cls), AVG(inpMs), AVG(ttfbMs)
- Display sample count per strategy
- Show "No data yet" empty state for new users

**FR3**: Seed script generates demo data

- Create 7 days of historical metrics (50-100 per strategy)
- Realistic distributions: SSG fastest (600ms LCP), SSR slowest (1800ms)
- Time-of-day variations (slower during simulated "peak hours")
- Occasional outliers (simulate slow network or large pages)
- Runnable via `npm run db:seed` command

**FR4**: Optional time-series visualization

- Line chart showing LCP trend over last 24 hours
- Group by hour with average per hour
- Show all strategies on same chart for comparison
- Use existing Recharts library (already in dependencies)

### Non-Functional Requirements

**NFR1**: Performance

- Database queries < 100ms (p95) as per constitution
- API endpoint < 500ms including DB write
- Dashboard loads with data in < 2s (Server Component advantage)
- Web Vitals capture doesn't degrade app performance

**NFR2**: Reliability

- Graceful degradation if database unavailable (show cached/mock data)
- Web Vitals capture errors don't break user experience
- Seed script idempotent (can run multiple times safely)

**NFR3**: Maintainability

- Reuse existing `/api/web-vitals` endpoint (already tested)
- Minimal changes to existing components
- Clear separation: capture → API → DB → query → display

**NFR4**: Demo Quality

- Seed data looks realistic (not obviously fake)
- Dashboard updates immediately after browsing
- Clear visual distinction between strategies

## Technical Approach

### Architecture

```
Client (Browser)
    ↓
WebVitalsReporter (components/web-vitals-reporter.tsx)
    ↓ POST /api/web-vitals
API Route (app/api/web-vitals/route.ts) [EXISTING]
    ↓ prisma.webVitalsMetric.create()
Neon PostgreSQL (web_vitals_metrics table) [EXISTING]
    ↑ prisma.webVitalsMetric.groupBy()
Dashboard Server Component (app/dashboard/@metrics/page.tsx)
    ↓
MetricsPanel (components/dashboard/metrics-panel.tsx)
```

### Key Components

1. **WebVitalsReporter**: Modified to POST to API
2. **Dashboard Server Component**: New query logic for real data
3. **Seed Script**: New file `prisma/seed.ts`
4. **Package Scripts**: Add `db:seed`, `db:studio` commands

### Technology Stack

- **Database**: Neon PostgreSQL (already configured)
- **ORM**: Prisma 7 with @prisma/adapter-neon (already integrated)
- **Auth**: Firebase session cookie (already implemented)
- **Charts**: Recharts (already in dependencies)
- **Runtime**: Node.js for API routes, Server Components for queries

## Success Criteria

1. ✅ Run `npm run db:seed` → dashboard shows 337 metrics across 4 strategies
2. ✅ Browse to `/lab/ssr` → new metric appears in dashboard within 2 seconds
3. ✅ Dashboard displays different averages per strategy (SSG < ISR < CACHE < SSR)
4. ✅ Database queries logged in development show proper indexing
5. ✅ Unauthenticated users don't cause errors (graceful fallback)
6. ✅ Seed script can be run multiple times without duplicates (uses timestamps)

## Dependencies

- ✅ Spec 003: Prisma + Neon + Firebase Auth (complete)
- ✅ Web Vitals schema model (exists in Prisma schema)
- ✅ `/api/web-vitals` endpoint (implemented and tested)
- ✅ `listWebVitalsMetrics` query function (implemented)
- ❌ Database seed script (needs creation)
- ❌ Dashboard query integration (needs implementation)

## Risks & Mitigation

**Risk 1**: Database queries slow down dashboard load

- **Mitigation**: Use Server Components (parallel loading), add database indexes, limit query to 24h

**Risk 2**: Web Vitals capture floods API with requests

- **Mitigation**: Debounce in WebVitalsReporter, rate limit API endpoint

**Risk 3**: Seed data looks obviously fake

- **Mitigation**: Use realistic distributions from web.dev research, add variations

**Risk 4**: Dashboard breaks without data

- **Mitigation**: Keep mock data as fallback, show empty state gracefully

## Out of Scope

- Real-time streaming updates (not needed, page refresh sufficient)
- User-facing metric comparison tool (dashboard aggregation sufficient)
- Advanced analytics (percentiles, histograms) - simple averages sufficient
- Multi-user comparison (single-user MVP)
- Historical data export (report generation is spec 003 Phase 7)

## Future Enhancements

- Phase 2: Lighthouse test history (spec 003 Phase 6)
- Phase 3: AI-generated performance insights persistence (spec 003 Phase 4)
- Phase 4: Comparative analysis across rendering strategies
- Phase 5: Alerting for performance regressions

## References

- [Web Vitals](https://web.dev/vitals/)
- [Neon Serverless Postgres](https://neon.tech)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Prisma with Neon](https://www.prisma.io/docs/orm/overview/databases/neon)
- Spec 003: Prisma Schema Integration (`specs/003-prisma-schema-integration/`)
