# Feature Specification: Prisma Schema + Next.js Integration for Rendering Strategy Analyzer

**Feature Branch**: `001-prisma-schema-integration`  
**Created**: 2025-11-22  
**Status**: Draft  
**Input**: "Create Prisma schema and Next.js integration for Rendering Strategy Analyzer with Neon Postgres, Prisma ORM, Firebase Auth (Firebase UID PK). Models: User, AnalysisSession, WebVitalsMetric, LighthouseTest, Report. Index by userId+timestamp and userId+url+strategy. Upsert user on sign-in; per-user history; Prisma Client singleton; type-safe queries; Neon pooling."

## User Scenarios & Testing (mandatory)

### User Story 1 - Upsert user on Firebase sign-in (Priority: P1)

When a user signs in via Firebase, the system creates or updates a User record keyed by the Firebase UID and stores profile fields (email, name, photoURL). All subsequent data is associated with this UID.

**Why this priority**: Establishes identity and per-user data isolation. Required for any personalized dashboards and history.

**Independent Test**: Sign in with a Firebase test user and call a protected endpoint that triggers upsert; verify a single User row exists with correct UID and profile fields.

**Acceptance Scenarios**:

1. Given no existing record, When a valid Firebase ID token is verified server-side, Then a User row is created with `id = Firebase UID`, `email`, `name`, `photoURL`.
2. Given an existing record, When the same user signs in with updated profile info, Then the User row is updated without creating duplicates.

---

### User Story 2 - Store AI analysis insights per user (Priority: P1)

Users can persist AI-generated analysis summaries and recommendations for specific URLs, tied to their account, and retrieve them later on dashboards.

**Why this priority**: Core value—turns transient insights into longitudinal, user-specific intelligence.

**Independent Test**: Call a protected endpoint to save an AnalysisSession with URL, strategy context, and AI summary; then fetch the latest N sessions for that user to confirm persistence and ordering by timestamp.

**Acceptance Scenarios**:

1. Given an authenticated user and URL, When the client submits an AI summary and recommendations, Then an AnalysisSession is stored with `userId`, `url`, `summary`, `recommendations`, and `createdAt`.
2. Given multiple sessions for a user, When fetching sessions with pagination, Then results are ordered by `createdAt` desc and limited by page size.

---

### User Story 3 - Track Core Web Vitals by strategy (Priority: P1)

System records Core Web Vitals (LCP, INP/FID, CLS, TTFB) for each rendering strategy (SSR, SSG, ISR, Cache) per URL and timestamp.

**Why this priority**: Enables comparison across strategies and trend analysis mandated by the constitution.

**Independent Test**: Submit a WebVitalsMetric payload for a URL+strategy and verify it appears in per-user trend queries filtered by `userId`, `url`, and `strategy`.

**Acceptance Scenarios**:

1. Given authenticated context, When metrics for `url=strategy` are submitted, Then a WebVitalsMetric is saved with `userId`, `url`, `strategy`, `lcp`, `cls`, `inpfid`, `ttfb`, `collectedAt`.
2. Given many metrics, When querying by `userId+url+strategy`, Then results are index-accelerated and paginated.

---

### User Story 4 - Record Lighthouse test history (Priority: P2)

Users can store and retrieve Lighthouse scores (performance, accessibility, best practices, SEO) over time for a URL.

**Why this priority**: Complements Core Web Vitals with broader quality signals; supports historical comparisons.

**Independent Test**: Persist a LighthouseTest entry and then query by `userId+url` to verify historical series ordering and pagination.

**Acceptance Scenarios**:

1. Given a completed test, When scores and details are posted, Then a LighthouseTest is stored with `userId`, `url`, scores, `createdAt`.
2. Given many tests, When querying history, Then results are limited to page size and ordered by `createdAt` desc.

---

### User Story 5 - Generate and track reports (Priority: P2)

Users can trigger report generation (PDF/Markdown/JSON) and see generated artifacts listed in their account.

**Why this priority**: Provides exportable artifacts for stakeholders and audits.

**Independent Test**: Create a Report record with `format`, `status`, and `storageKey/link`; verify visibility and ownership by `userId`.

**Acceptance Scenarios**:

1. Given authenticated user, When a report generation is requested, Then a Report row is created in `pending` or `processing` state and later updated to `ready` with `storageKey`/`url`.
2. Given multiple reports, When listing reports, Then only the owner’s reports are returned, paginated and ordered by `createdAt` desc.

### Edge Cases

- Invalid/expired Firebase token: requests to protected endpoints are rejected with 401 and no DB operations occur.
- Duplicate submissions: idempotent upsert for User; metrics and tests are append-only with timestamp ordering; client de-dup can be based on rounded timestamps.
- Extremely high-frequency metrics: enforce pagination limits (max 100 per request) and recommend client-side sampling.
- Large reports: store only metadata and a `storageKey`/URL, not binary content.

## Requirements (mandatory)

### Functional Requirements

- **FR-001**: System MUST verify Firebase ID tokens server-side and upsert a User with `id = Firebase UID`, `email`, `name`, `photoURL`.
- **FR-002**: System MUST associate all persisted data with `userId` equal to the Firebase UID.
- **FR-003**: System MUST persist AI analysis sessions with fields: `userId`, `url`, `summary`, `recommendations`, `createdAt`.
- **FR-004**: System MUST persist Core Web Vitals metrics per `userId+url+strategy` including `lcp`, `cls`, `inpfid`, `ttfb`, `collectedAt`.
- **FR-005**: System MUST persist Lighthouse test results with `userId`, `url`, `performance`, `accessibility`, `bestPractices`, `seo`, `createdAt`.
- **FR-006**: System MUST track report metadata with `userId`, `format` (PDF/Markdown/JSON), `status`, `storageKey/url`, `createdAt`, `updatedAt`.
- **FR-007**: Queries MUST support pagination (limit, cursor/offset) and ordering by timestamp desc.
- **FR-008**: Indices MUST exist for `userId+createdAt` and `userId+url+strategy` to optimize common queries.
- **FR-009**: Prisma Client MUST be initialized via a singleton to avoid connection storms under hot reload.
- **FR-010**: Database connections MUST use connection pooling suitable for serverless Postgres (Neon).
- **FR-011**: All protected routes MUST enforce user isolation—filtering by authenticated `userId`.
- **FR-012**: Type generation MUST enable type-safe queries throughout the codebase.

### Key Entities (data overview)

- **User**: Firebase-authenticated person; attributes: `id` (Firebase UID, PK), `email`, `name`, `photoURL`, `createdAt`, `updatedAt`.
- **AnalysisSession**: AI summary and recommendations for a URL; attributes: `id`, `userId`, `url`, `summary`, `recommendations`, `createdAt`.
- **WebVitalsMetric**: Core Web Vitals for URL+strategy; attributes: `id`, `userId`, `url`, `strategy` (SSR|SSG|ISR|CACHE), `lcp`, `cls`, `inpfid`, `ttfb`, `collectedAt`.
- **LighthouseTest**: Lighthouse scores snapshot; attributes: `id`, `userId`, `url`, `performance`, `accessibility`, `bestPractices`, `seo`, `createdAt`.
- **Report**: Generated artifact metadata; attributes: `id`, `userId`, `format`, `status`, `storageKey`/`url`, `createdAt`, `updatedAt`.

Relations: All entities belong to `User` via `userId` (FK). No cross-user access.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: 100% of protected writes associate data with the authenticated `userId` (verified via tests).
- **SC-002**: Trend queries (userId + url + strategy) return first page in under 500ms p95 with up to 100 records.
- **SC-003**: Database queries for common dashboards meet <100ms p95 per query under nominal load.
- **SC-004**: User upsert on sign-in completes in <250ms p95 and is idempotent (no duplicates).
- **SC-005**: At least 90% of dashboard views load with persisted data (not empty state) after first successful analysis per user.
- **SC-006**: Reports list endpoint returns the owner’s reports only and supports pagination without leakage across users.
