# Database Verification Scripts

This directory contains scripts for verifying database configuration and performance as part of **Phase 5: User Story 3 - Historical Metrics Verification**.

## Available Scripts

### `verify-indexes.ts`

**Command**: `npm run db:verify-indexes`

Verifies that required database indexes exist on the `web_vitals_metrics` table for optimal query performance.

**Usage**:
```bash
npm run db:verify-indexes
```

**What it checks**:
- Primary index: `userId + collectedAt (DESC)`
- Secondary index: `userId + url + strategy + collectedAt (DESC)`

**Exit codes**:
- `0`: All required indexes found
- `1`: Missing indexes or database error

**Requirements**:
- `DATABASE_URL` or `POSTGRES_PRISMA_URL` environment variable
- Database schema pushed: `npm run db:push`

---

### `test-query-performance.ts`

**Command**: `npm run db:test-performance`

Tests database query performance using EXPLAIN ANALYZE and measures actual Prisma query execution time.

**Usage**:
```bash
npm run db:test-performance
```

**What it measures**:
- Query planning time (target: <10ms)
- Query execution time (target: <100ms)
- Index scan vs sequential scan usage
- Prisma query round-trip time (3 runs with statistics)

**Exit codes**:
- `0`: All performance checks passed
- `1`: Performance issues detected or no data

**Requirements**:
- Database with test data: `npm run db:seed`
- `DEMO_USER_ID` environment variable (optional, defaults to `demo-seed-user-id`)

---

### `verify-env.mjs`

**Command**: `npm run verify-env`

Verifies that required environment variables are set for the application.

**Usage**:
```bash
npm run verify-env
```

## Quick Start

```bash
# 1. Ensure database is configured
# .env.local should contain DATABASE_URL or POSTGRES_PRISMA_URL

# 2. Push schema to database
npm run db:push

# 3. Seed test data (optional but recommended)
npm run db:seed

# 4. Verify indexes exist
npm run db:verify-indexes

# 5. Test query performance
npm run db:test-performance
```

## When to Run

### During Development
- After schema changes: `npm run db:verify-indexes`
- When investigating slow queries: `npm run db:test-performance`
- Before committing database changes: Both scripts

### In CI/CD
```bash
# Example: Add to GitHub Actions workflow
- name: Verify database indexes
  run: npm run db:verify-indexes
```

### In Production
- After deployments
- Weekly performance checks
- When investigating performance regressions

## Troubleshooting

### Missing indexes
```bash
# Ensure Prisma schema has indexes defined
# In prisma/schema.prisma:
@@index([userId, collectedAt(sort: Desc)])
@@index([userId, url, strategy, collectedAt(sort: Desc)])

# Push to database
npm run db:push
```

### Slow queries
```bash
# 1. Verify indexes exist
npm run db:verify-indexes

# 2. Update database statistics
# Connect to database and run:
VACUUM ANALYZE web_vitals_metrics;

# 3. Check performance
npm run db:test-performance
```

### Connection errors
```bash
# Check environment variables
cat .env.local | grep -E "(DATABASE_URL|POSTGRES)"

# Test connection
npx prisma db execute --stdin <<< "SELECT 1;"
```

## Documentation

For detailed documentation, see:
- [Historical Metrics Verification Guide](../docs/HISTORICAL_METRICS_VERIFICATION.md)
- [Spec 004 Tasks](../specs/004-database-interactions/tasks.md)
- [Data Model](../specs/004-database-interactions/data-model.md)

## Testing

These scripts have comprehensive test coverage:

```bash
# Run all tests
npm test

# Test files
# - __tests__/scripts/verify-indexes.test.ts
# - __tests__/scripts/test-query-performance.test.ts
```

## Implementation Details

**Technologies**:
- TypeScript with `tsx` runtime
- Prisma Client for database access
- PostgreSQL system catalog queries (`pg_indexes`)
- EXPLAIN/EXPLAIN ANALYZE for query analysis

**Performance Targets**:
- Planning time: <10ms
- Execution time: <100ms (p95)
- Prisma round-trip: <500ms

**Index Strategy**:
- B-tree indexes with DESC ordering on `collectedAt`
- Compound indexes for multi-column filtering
- Optimized for time-range queries (last 24h, 7d, 30d)

## Related Files

```
├── prisma/
│   ├── schema.prisma          # Index definitions
│   └── seed.ts                # Test data generator
├── lib/db/
│   ├── web-vitals.ts         # Query functions
│   └── prisma.ts             # Prisma client
└── __tests__/scripts/
    ├── verify-indexes.test.ts
    └── test-query-performance.test.ts
```
