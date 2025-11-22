# Research: Prisma + Neon + Firebase for Rendering Strategy Analyzer

**Date**: 2025-11-22
**Scope**: Resolve all NEEDS CLARIFICATION items from plan.md and select best practices.

## Decisions

- Decision: Use `DATABASE_URL` for Prisma; fallback to `POSTGRES_PRISMA_URL`
  - Rationale: Prisma defaults to `DATABASE_URL`. Vercel Postgres exposes a Prisma-optimized URL (`POSTGRES_PRISMA_URL`). Supporting both eases local/dev/prod.
  - Alternatives considered: Only `DATABASE_URL` (less flexible); Custom env name (unnecessary divergence).

- Decision: Neon pooled connection string in prod; non-pooled in dev
  - Rationale: Serverless environments benefit from pooling to avoid connection storms; local dev prefers a direct connection for simplicity.
  - Implementation: Prefer `POSTGRES_PRISMA_URL` (pooled) if set; otherwise `DATABASE_URL`. Document `NON_POOLING` variant for scripts.
  - Alternatives: Prisma Accelerate; PgBouncer self-managed. Chosen approach aligns with Vercel/Neon managed infra.

- Decision: Store INP as primary; keep FID optional
  - Rationale: INP supersedes FID. Model `inpMs` (nullable) and `fidMs` (nullable) to support legacy data.
  - Alternatives: Only FID (obsolete), only INP (drops older clients).

- Decision: Report storage metadata only
  - Rationale: Constitution requires persistence but favors performance. Keep `format`, `status`, `storageKey` (string URL or blob key). Binary storage delegated to platform (e.g., Vercel Blob) outside schema.
  - Alternatives: Storing binary in DB (expensive, unnecessary).

- Decision: Authorization via `Authorization: Bearer <Firebase ID token>`
  - Rationale: Standard practice for server-side verification. Compatible with Edge/Node handlers; can add cookie support later.
  - Alternatives: Cookies-only; custom headers. Bearer is simplest and explicit.

- Decision: Strategy enum as `SSR | SSG | ISR | CACHE`
  - Rationale: Aligns with constitution rendering strategies. Stored as Prisma enum.
  - Alternatives: Free-text string (error-prone), numeric code (opaque).

## Best Practices

- Prisma Client singleton: create once per process; re-use across hot reload to avoid connection storms.
- Indexes: Composite indices `(userId, createdAt)` and `(userId, url, strategy, collectedAt)` to accelerate list/trend queries.
- Pagination: Cursor-based preferred for stability under writes; fall back to limit/offset if needed.
- Security: Verify Firebase ID token on every protected request; derive `userId` from token only; never accept `userId` from the client body.
- Observability: Log query durations at debug level in dev to validate budgets; avoid logging PII.

## Implementation Notes

- Env Vars (documented in quickstart):
  - `DATABASE_URL` (primary)
  - `POSTGRES_PRISMA_URL` (optional pooled, preferred in prod)
  - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

- Route Runtimes:
  - DB-backed routes use `export const runtime = 'nodejs'`.
  - AI streaming/edge paths unchanged.

- Data Retention:
  - No hard retention policy in schema; app-level policies can prune beyond N records per user per entity if needed.
