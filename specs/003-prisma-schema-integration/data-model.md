# Data Model: Prisma Schema for Rendering Strategy Analyzer

This document defines entities, fields, relations, indices, and validation rules.

## Entities

### User

- id: string (Firebase UID, PK)
- email: string (nullable: true)
- name: string (nullable: true)
- photoURL: string (nullable: true)
- createdAt: DateTime (default now)
- updatedAt: DateTime (updatedAt)

Relations: 1-to-many with AnalysisSession, WebVitalsMetric, LighthouseTest, Report

Indexes: (id) primary

Validation: id must match Firebase UID from verified token

---

### AnalysisSession

- id: string (cuid, PK)
- userId: string (FK -> User.id)
- url: string
- summary: string (JSON or text; store text for portability)
- recommendations: string (text)
- createdAt: DateTime (default now)

Indexes:

- (userId, createdAt DESC)
- (userId, url, createdAt DESC)

Validation: url must be a valid URL; length constraints on text fields

---

### RenderingStrategy (enum)

- SSR | SSG | ISR | CACHE

---

### WebVitalsMetric

- id: string (cuid, PK)
- userId: string (FK -> User.id)
- url: string
- strategy: RenderingStrategy (enum)
- lcpMs: Float (nullable: true)
- cls: Float (nullable: true)
- inpMs: Float (nullable: true)
- fidMs: Float (nullable: true)
- ttfbMs: Float (nullable: true)
- collectedAt: DateTime (default now)

Indexes:

- (userId, collectedAt DESC)
- (userId, url, strategy, collectedAt DESC)

Validation: 0 <= cls < 1; non-negative ms values

---

### LighthouseTest

- id: string (cuid, PK)
- userId: string (FK -> User.id)
- url: string
- performance: Int (0..100)
- accessibility: Int (0..100)
- bestPractices: Int (0..100)
- seo: Int (0..100)
- createdAt: DateTime (default now)

Indexes:

- (userId, url, createdAt DESC)
- (userId, createdAt DESC)

Validation: scores in range 0..100

---

### Report

- id: string (cuid, PK)
- userId: string (FK -> User.id)
- format: enum (PDF | MARKDOWN | JSON)
- status: enum (pending | processing | ready | failed)
- storageKey: string (nullable: true)
- url: string (nullable: true)
- createdAt: DateTime (default now)
- updatedAt: DateTime (updatedAt)

Indexes:

- (userId, createdAt DESC)

Validation: if status == ready then storageKey OR url must be present

## Notes

- All writes must derive userId from verified Firebase token; never from client payload.
- Pagination is required for all list endpoints with max page size 100.
- Choose TEXT for summaries/recommendations to keep schema simple and portable; consider JSON later if structure needed.
