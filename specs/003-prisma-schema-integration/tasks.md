# Tasks: Prisma Schema + Next.js Integration for Rendering Strategy Analyzer

**Input**: Design documents from `/specs/001-prisma-schema-integration/`
**Prerequisites**: plan.md (✓), spec.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

**Tests**: TDD required per constitution Principle III. Tests MUST be written first and MUST fail before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and Prisma/Firebase basic structure

- [x] T001 Install Prisma dependencies: `npm install prisma @prisma/client`
- [x] T002 Install Firebase Admin SDK: `npm install firebase-admin`
- [x] T003 [P] Add DATABASE_URL and POSTGRES_PRISMA_URL to .env.example
- [x] T004 [P] Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to .env.example
- [x] T005 Initialize Prisma: `npx prisma init --datasource-provider postgresql`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create Prisma schema with User model (Firebase UID PK) in prisma/schema.prisma
- [ ] T007 [P] Create RenderingStrategy enum (SSR|SSG|ISR|CACHE) in prisma/schema.prisma
- [ ] T008 [P] Create AnalysisSession model with userId FK and indices in prisma/schema.prisma
- [ ] T009 [P] Create WebVitalsMetric model with userId FK, strategy, indices in prisma/schema.prisma
- [ ] T010 [P] Create LighthouseTest model with userId FK and indices in prisma/schema.prisma
- [ ] T011 [P] Create Report model with userId FK, format/status enums, indices in prisma/schema.prisma
- [ ] T012 Generate Prisma Client: `npx prisma generate`
- [ ] T013 Create initial migration: `npx prisma migrate dev --name init_persistence`
- [ ] T014 Create Prisma Client singleton in lib/db/prisma.ts
- [ ] T015 Create Firebase Admin initialization in lib/auth/firebase-admin.ts
- [ ] T016 Create verifyFirebaseToken helper in lib/auth/firebase-admin.ts
- [ ] T017 [P] Create auth middleware helper getUserFromToken in lib/auth/firebase-admin.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Upsert user on Firebase sign-in (Priority: P1) 🎯 MVP

**Goal**: Establish user identity via Firebase Auth and persist to database for per-user data isolation

**Independent Test**: Sign in with Firebase test user, call protected endpoint, verify User record created/updated with Firebase UID

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T018 [P] [US1] Unit test for verifyFirebaseToken in **tests**/lib/auth/firebase-admin.test.ts
- [ ] T019 [P] [US1] Unit test for upsertUser function in **tests**/lib/db/user.test.ts
- [ ] T020 [US1] Integration test for user upsert on auth in **tests**/app/api/auth/verify.test.ts

### Implementation for User Story 1

- [ ] T021 [US1] Create upsertUser function in lib/db/user.ts
- [ ] T022 [US1] Create POST /api/auth/verify route in app/api/auth/verify/route.ts with Firebase token verification and user upsert
- [ ] T023 [US1] Add runtime='nodejs' export to app/api/auth/verify/route.ts

**Checkpoint**: User Story 1 complete - users can sign in and have their profile persisted

---

## Phase 4: User Story 2 - Store AI analysis insights per user (Priority: P1)

**Goal**: Persist AI-generated summaries and recommendations per user for longitudinal intelligence

**Independent Test**: POST analysis session, GET list filtered by user, verify persistence and timestamp ordering

### Tests for User Story 2

- [ ] T024 [P] [US2] Unit test for createAnalysisSession in **tests**/lib/db/analysis.test.ts
- [ ] T025 [P] [US2] Unit test for listAnalysisSessions with pagination in **tests**/lib/db/analysis.test.ts
- [ ] T026 [US2] Integration test for POST /api/analyses in **tests**/app/api/analyses/route.test.ts
- [ ] T027 [US2] Integration test for GET /api/analyses with pagination in **tests**/app/api/analyses/route.test.ts

### Implementation for User Story 2

- [ ] T028 [P] [US2] Create createAnalysisSession function in lib/db/analysis.ts
- [ ] T029 [P] [US2] Create listAnalysisSessions function with cursor pagination in lib/db/analysis.ts
- [ ] T030 [US2] Implement POST handler in app/api/analyses/route.ts with auth and validation
- [ ] T031 [US2] Implement GET handler in app/api/analyses/route.ts with pagination (limit, cursor)
- [ ] T032 [US2] Add runtime='nodejs' export to app/api/analyses/route.ts

**Checkpoint**: User Story 2 complete - AI analyses are persisted and retrievable per user

---

## Phase 5: User Story 3 - Track Core Web Vitals by strategy (Priority: P1)

**Goal**: Record and query Core Web Vitals metrics per URL+strategy for performance comparison

**Independent Test**: POST metrics for URL+strategy, GET with filters, verify index-accelerated queries

### Tests for User Story 3

- [ ] T033 [P] [US3] Unit test for createWebVitalsMetric in **tests**/lib/db/web-vitals.test.ts
- [ ] T034 [P] [US3] Unit test for listWebVitalsMetrics with url+strategy filters in **tests**/lib/db/web-vitals.test.ts
- [ ] T035 [US3] Integration test for POST /api/web-vitals in **tests**/app/api/web-vitals/route.test.ts
- [ ] T036 [US3] Integration test for GET /api/web-vitals with filters in **tests**/app/api/web-vitals/route.test.ts

### Implementation for User Story 3

- [ ] T037 [P] [US3] Create createWebVitalsMetric function in lib/db/web-vitals.ts
- [ ] T038 [P] [US3] Create listWebVitalsMetrics function with url, strategy, pagination in lib/db/web-vitals.ts
- [ ] T039 [US3] Implement POST handler in app/api/web-vitals/route.ts with validation
- [ ] T040 [US3] Implement GET handler in app/api/web-vitals/route.ts with url/strategy query params
- [ ] T041 [US3] Add runtime='nodejs' export to app/api/web-vitals/route.ts

**Checkpoint**: User Story 3 complete - Core Web Vitals tracking operational across strategies

---

## Phase 6: User Story 4 - Record Lighthouse test history (Priority: P2)

**Goal**: Store Lighthouse scores over time for historical quality comparison

**Independent Test**: POST lighthouse test, GET by user+url, verify historical ordering

### Tests for User Story 4

- [ ] T042 [P] [US4] Unit test for createLighthouseTest in **tests**/lib/db/lighthouse.test.ts
- [ ] T043 [P] [US4] Unit test for listLighthouseTests with url filter in **tests**/lib/db/lighthouse.test.ts
- [ ] T044 [US4] Integration test for POST /api/lighthouse in **tests**/app/api/lighthouse/route.test.ts
- [ ] T045 [US4] Integration test for GET /api/lighthouse with url filter in **tests**/app/api/lighthouse/route.test.ts

### Implementation for User Story 4

- [ ] T046 [P] [US4] Create createLighthouseTest function in lib/db/lighthouse.ts
- [ ] T047 [P] [US4] Create listLighthouseTests function with url filter and pagination in lib/db/lighthouse.ts
- [ ] T048 [US4] Implement POST handler in app/api/lighthouse/route.ts with score validation
- [ ] T049 [US4] Implement GET handler in app/api/lighthouse/route.ts with url query param
- [ ] T050 [US4] Add runtime='nodejs' export to app/api/lighthouse/route.ts

**Checkpoint**: User Story 4 complete - Lighthouse history tracking enabled

---

## Phase 7: User Story 5 - Generate and track reports (Priority: P2)

**Goal**: Create report metadata records for exportable artifacts (PDF/Markdown/JSON)

**Independent Test**: POST report request, GET reports list, verify user ownership and pagination

### Tests for User Story 5

- [ ] T051 [P] [US5] Unit test for createReport in **tests**/lib/db/reports.test.ts
- [ ] T052 [P] [US5] Unit test for listReports with pagination in **tests**/lib/db/reports.test.ts
- [ ] T053 [P] [US5] Unit test for updateReportStatus in **tests**/lib/db/reports.test.ts
- [ ] T054 [US5] Integration test for POST /api/reports in **tests**/app/api/reports/route.test.ts
- [ ] T055 [US5] Integration test for GET /api/reports with pagination in **tests**/app/api/reports/route.test.ts

### Implementation for User Story 5

- [ ] T056 [P] [US5] Create createReport function in lib/db/reports.ts
- [ ] T057 [P] [US5] Create listReports function with pagination in lib/db/reports.ts
- [ ] T058 [P] [US5] Create updateReportStatus function in lib/db/reports.ts
- [ ] T059 [US5] Implement POST handler in app/api/reports/route.ts (sets status=pending)
- [ ] T060 [US5] Implement GET handler in app/api/reports/route.ts with pagination
- [ ] T061 [US5] Add runtime='nodejs' export to app/api/reports/route.ts

**Checkpoint**: All user stories complete - full persistence layer operational

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Add JSDoc comments to all lib/db/\* functions
- [ ] T063 [P] Add input validation schemas using Zod for all API routes
- [ ] T064 [P] Add error handling middleware for consistent API error responses
- [ ] T065 [P] Add database query performance logging (debug level)
- [ ] T066 Update package.json scripts with Prisma commands (migrate, generate, studio)
- [ ] T067 Update README.md with database setup instructions
- [ ] T068 [P] Add E2E test for complete user flow (auth → create analysis → query) in tests/e2e/persistence.spec.ts
- [ ] T069 Verify quickstart.md accuracy with actual implementation
- [ ] T070 Run test coverage report and verify ≥80% coverage for lib/db/_ and lib/auth/_

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 3 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 4 (P2): Can start after Foundational - No dependencies on other stories
  - User Story 5 (P2): Can start after Foundational - No dependencies on other stories
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- DB functions before API routes
- POST handlers before GET handlers (data must exist to query)
- Story complete before moving to next priority

### Parallel Opportunities

- Phase 1 Setup: T003, T004 can run in parallel
- Phase 2 Foundational: T007-T011 (all models) and T017 can run in parallel after T006
- Once Foundational completes, ALL user stories (US1-US5) can start in parallel
- Within each story: All tests marked [P] can run in parallel
- Within each story: DB functions marked [P] can run in parallel
- Phase 8 Polish: T062-T065, T068 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for verifyFirebaseToken in __tests__/lib/auth/firebase-admin.test.ts"
Task: "Unit test for upsertUser function in __tests__/lib/db/user.test.ts"

# Then implementation (after tests fail):
Task: "Create upsertUser function in lib/db/user.ts"
Task: "Create POST /api/auth/verify route..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP: Auth + User persistence!)
3. Add User Story 2 → Test independently → Deploy/Demo (AI insights persistence)
4. Add User Story 3 → Test independently → Deploy/Demo (Web Vitals tracking)
5. Add User Story 4 → Test independently → Deploy/Demo (Lighthouse history)
6. Add User Story 5 → Test independently → Deploy/Demo (Report tracking)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Auth/Users)
   - Developer B: User Story 2 (Analyses)
   - Developer C: User Story 3 (Web Vitals)
   - Developer D: User Story 4 (Lighthouse)
   - Developer E: User Story 5 (Reports)
3. Stories complete and integrate independently

---

## Summary

**Total Tasks**: 70
**Task Count per User Story**:

- Setup: 5 tasks
- Foundational: 12 tasks (BLOCKING)
- User Story 1 (P1): 6 tasks (3 tests + 3 implementation)
- User Story 2 (P1): 9 tasks (4 tests + 5 implementation)
- User Story 3 (P1): 9 tasks (4 tests + 5 implementation)
- User Story 4 (P2): 9 tasks (4 tests + 5 implementation)
- User Story 5 (P2): 10 tasks (5 tests + 6 implementation)
- Polish: 9 tasks

**Parallel Opportunities**: 35+ tasks can run in parallel once dependencies are met

**MVP Scope**: Phases 1-3 (Setup + Foundational + User Story 1) = 23 tasks

- Delivers: Firebase Auth integration, user persistence, per-user data isolation
- Can be deployed and validated independently

**Constitutional Compliance**:

- ✅ TDD: Tests written first for all user stories
- ✅ Performance: Indices, pagination, connection pooling
- ✅ Security: Server-side token verification, user isolation
- ✅ Type Safety: Prisma Client generation
- ✅ Documentation: JSDoc, quickstart validation

**Next Steps**: Start with Phase 1 (Setup) and proceed through Foundational before tackling user stories in priority order (or in parallel with team).
