# Implementation Plan: Prisma Schema + Next.js Integration for Rendering Strategy Analyzer

**Branch**: `001-prisma-schema-integration` | **Date**: 2025-11-22 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/001-prisma-schema-integration/spec.md`

## Summary

Add a Prisma schema and Next.js integration to persist per-user data for the Rendering Strategy Analyzer using Neon Postgres and Firebase Auth. Implement models: User (Firebase UID PK), AnalysisSession, WebVitalsMetric, LighthouseTest, Report. Provide per-user, paginated APIs with indices on `userId+createdAt` and `userId+url+strategy`. Use Prisma Client singleton and Neon connection pooling.

## Technical Context

**Language/Version**: TypeScript (Next.js 16), Node.js 18+/Vercel Runtime  
**Primary Dependencies**: Prisma ORM, `@prisma/client`, Firebase Admin SDK, Neon Postgres, Next.js App Router  
**Storage**: Postgres (Neon/Vercel Postgres) for persistence; Vercel KV already present for caching  
**Testing**: Vitest (unit/integration), Playwright (E2E)  
**Target Platform**: Vercel (Edge for AI streaming; Node.js for DB-backed routes)  
**Project Type**: Web (Next.js App Router)
**Performance Goals**: p95 DB query < 100ms; DB-backed API < 500ms p95; pagination max 100 items; connection pool ≤ 10  
**Constraints**: Server-side Firebase token verification; user data isolation; indices for query patterns; Prisma Client singleton  
**Scale/Scope**: Multi-tenant per user (Firebase UID); history depth O(1e3) per user typical

Unknowns (to resolve in Phase 0 research):

- ENV: Confirm DB URL naming: use `DATABASE_URL` as primary; fallback to Vercel `POSTGRES_PRISMA_URL` if present. [NEEDS CLARIFICATION]
- Pooling: Prefer Neon pooled URL vs Prisma Accelerate; decide default and toggles per env. [NEEDS CLARIFICATION]
- Metrics field: Use INP (modern) with optional legacy FID; field naming convention. [NEEDS CLARIFICATION]
- Report storage location: Keep metadata only; storage provider key naming (e.g., Vercel Blob). [NEEDS CLARIFICATION]
- Auth transport: Authorization Bearer vs cookie for Firebase ID token. [NEEDS CLARIFICATION]

## Constitution Check

Gate items derived from constitution:

- Performance budgets: DB p95 < 100ms, API p95 < 500ms, pagination ≤ 100 → Planned with indices and pagination in contracts. Status: PASS (design-compliant)
- Security: Server-side Firebase verification; per-user filtering; no sensitive data in client; parameterized Prisma queries. Status: PASS (requires implementation validation)
- Platform alignment: Prisma + Neon; KV remains for caching; explicit runtime per route. Status: PASS
- Documentation/tests: Contracts, quickstart, and test coverage to be added. Status: PASS (pending implementation)

Overall Gate: PASS (no violations). Re-check after Phase 1 design finalized. Post-design: PASS — research resolved env/pooling/metrics/report/token decisions within budgets.

## Project Structure

### Documentation (this feature)

```text
specs/001-prisma-schema-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── openapi.yaml
```

### Source Code (repository root)

```text
prisma/
└── schema.prisma

lib/
├── db/
│   └── prisma.ts          # Prisma Client singleton
└── auth/
    └── firebase-admin.ts  # Firebase Admin init + verify helper

app/api/
├── analyses/route.ts      # POST create, GET list (user-scoped)
├── web-vitals/route.ts    # POST create, GET list (user+url+strategy)
├── lighthouse/route.ts    # POST create, GET list (user+url)
└── reports/route.ts       # POST request, GET list
```

**Structure Decision**: Extend existing Next.js app with Prisma schema, DB/auth helpers under `lib/`, and RESTful user-scoped route handlers under `app/api/*`.

## Complexity Tracking

No constitutional violations anticipated; no additional complexity beyond required DB/auth layers.
