# Historical Metrics Verification Guide

**Phase 5: User Story 3 - Historical Metrics Verification**

This guide documents the verification process for ensuring that historical Web Vitals metrics are stored correctly and can be queried efficiently.

## Overview

The verification process includes:
1. **Index Verification** - Confirm that database indexes exist for optimal query performance
2. **Performance Testing** - Measure query execution time and validate index usage

## Quick Start

```bash
# Verify database indexes exist
npm run db:verify-indexes

# Test query performance
npm run db:test-performance
```

## Prerequisites

Before running verification:

1. **Database Setup**: Ensure your database is configured and accessible
   ```bash
   # .env.local should contain:
   DATABASE_URL="postgresql://..."
   # or
   POSTGRES_PRISMA_URL="postgresql://..."
   ```

2. **Schema Applied**: Run Prisma migrations/push
   ```bash
   npm run db:push
   ```

3. **Test Data** (optional but recommended for performance testing):
   ```bash
   npm run db:seed
   ```

## Verification Scripts

### 1. Index Verification (`npm run db:verify-indexes`)

**Purpose**: Confirms that required indexes exist on the `web_vitals_metrics` table.

**What it checks**:
- ✅ `userId + collectedAt (DESC)` index - for user-scoped time filtering
- ✅ `userId + url + strategy + collectedAt (DESC)` index - for page-level analysis

**Expected Output** (Success):
```
🔍 Verifying database indexes on web_vitals_metrics table...

📊 Found 3 index(es) on web_vitals_metrics table:

1. web_vitals_metrics_pkey
   CREATE UNIQUE INDEX web_vitals_metrics_pkey ON public.web_vitals_metrics USING btree (id)

2. web_vitals_metrics_userId_collectedAt_idx
   CREATE INDEX web_vitals_metrics_userId_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, collected_at DESC)

✅ Required index found: userId + collectedAt
   Index: web_vitals_metrics_userId_collectedAt_idx

3. web_vitals_metrics_userId_url_strategy_collectedAt_idx
   CREATE INDEX web_vitals_metrics_userId_url_strategy_collectedAt_idx ON public.web_vitals_metrics USING btree (user_id, url, strategy, collected_at DESC)

✅ Required index found: userId + url + strategy + collectedAt
   Index: web_vitals_metrics_userId_url_strategy_collectedAt_idx


✅ All required indexes are present!

📈 Performance impact:
   - Dashboard queries will use userId+collectedAt index
   - Page-specific queries will use userId+url+strategy+collectedAt index
   - Both indexes support efficient date range filtering
```

**Troubleshooting**:

If indexes are missing:
```bash
# 1. Check your Prisma schema has the indexes defined
# In prisma/schema.prisma:
model WebVitalsMetric {
  // ... fields ...
  
  @@index([userId, collectedAt(sort: Desc)])
  @@index([userId, url, strategy, collectedAt(sort: Desc)])
  @@map("web_vitals_metrics")
}

# 2. Push schema to database
npm run db:push

# 3. Verify again
npm run db:verify-indexes
```

### 2. Performance Testing (`npm run db:test-performance`)

**Purpose**: Measures query performance and validates that indexes are being used efficiently.

**What it does**:
1. Runs `EXPLAIN` (planning analysis only)
2. Runs `EXPLAIN ANALYZE` (with actual execution)
3. Measures Prisma query performance (3 runs with statistics)

**Expected Output** (Success):
```
⚡ Testing database query performance...

📊 User has 337 metrics in database

🔍 Testing dashboard query (last 24 hours)...

1️⃣  Running EXPLAIN (query planning analysis)...

   HashAggregate  (cost=100.00..110.00 rows=4 width=40)
     Group Key: strategy
     ->  Index Scan using web_vitals_metrics_userId_collectedAt_idx on web_vitals_metrics  (cost=0.29..95.00 rows=337 width=32)
           Index Cond: ((user_id = 'demo-seed-user-id') AND (collected_at >= '2025-11-22 06:24:00'::timestamp))

2️⃣  Running EXPLAIN ANALYZE (with actual execution timing)...

   HashAggregate  (cost=100.00..110.00 rows=4 width=40) (actual time=42.123..42.125 rows=4 loops=1)
     Group Key: strategy
     ->  Index Scan using web_vitals_metrics_userId_collectedAt_idx on web_vitals_metrics  (cost=0.29..95.00 rows=337 width=32) (actual time=0.015..35.234 rows=337 loops=1)
           Index Cond: ((user_id = 'demo-seed-user-id') AND (collected_at >= '2025-11-22 06:24:00'::timestamp))
   Planning Time: 5.678 ms
   Execution Time: 45.123 ms

📊 Performance Analysis:

   Planning Time: 5.68ms
   ✅ Planning time is good (<10ms)
   Execution Time: 45.12ms
   ✅ Excellent performance (<50ms)
   Total Round-trip Time: 125ms (includes network latency)

   Index Usage:
   ✅ Query uses index scan (efficient)

3️⃣  Testing actual Prisma query performance (3 runs)...

   Run 1: 123ms
   Run 2: 115ms
   Run 3: 118ms

   Average: 118.67ms
   Min: 115ms
   Max: 123ms

🎯 Final Verdict:

✅ Passed checks:
   - Query execution time is within target (<100ms)
   - Query uses index scan for efficient filtering
   - Prisma query response time is acceptable

🎉 All performance checks passed!
```

**Performance Targets**:
- ✅ Planning Time: <10ms
- ✅ Execution Time: <100ms (p95 target)
- ✅ Prisma Query Time: <500ms (includes network latency)
- ✅ Index Usage: Should use index scan, not sequential scan

**Troubleshooting**:

**Issue**: Execution time > 100ms
- **Cause**: Sequential scan instead of index scan, or database under load
- **Solution**:
  1. Run `npm run db:verify-indexes` to confirm indexes exist
  2. Run `VACUUM ANALYZE` on the database to update statistics
  3. Check database connection pool settings
  4. Verify database is not under heavy load

**Issue**: Sequential scan detected
- **Cause**: Missing indexes or outdated statistics
- **Solution**:
  1. Ensure indexes exist: `npm run db:verify-indexes`
  2. Update database statistics: `VACUUM ANALYZE web_vitals_metrics`
  3. If indexes exist, check query planner settings

**Issue**: High network latency (Prisma time >> Execution time)
- **Cause**: Network connection to database is slow
- **Solution**:
  1. Use Vercel's serverless Postgres (Neon) for optimal latency
  2. Enable connection pooling
  3. Consider using Edge runtime for read queries

## Query Details

The verification scripts test the core dashboard query that aggregates metrics by strategy:

```sql
SELECT strategy, 
       AVG(lcp_ms) as avg_lcp,
       AVG(cls) as avg_cls,
       AVG(inp_ms) as avg_inp,
       AVG(fid_ms) as avg_fid,
       AVG(ttfb_ms) as avg_ttfb,
       COUNT(*) as sample_count
FROM web_vitals_metrics
WHERE user_id = $1
  AND collected_at >= $2
GROUP BY strategy;
```

**Why this query matters**:
- Used by dashboard to show performance comparison across rendering strategies
- Runs on every dashboard page load
- Must complete in <100ms for good user experience
- Processes 7 days of historical data (typically 300-500 rows per user)

## Index Strategy

### Primary Index: `userId + collectedAt (DESC)`

**Purpose**: Optimize time-range queries for a specific user

**Use cases**:
- Dashboard query (last 24 hours)
- Historical trends (last 7 days)
- All user-scoped queries with time filtering

**Why DESC ordering**: Results are typically sorted newest-first

### Secondary Index: `userId + url + strategy + collectedAt (DESC)`

**Purpose**: Optimize page-specific analysis

**Use cases**:
- Analyze performance of a specific URL
- Compare strategies for the same page
- URL-level historical trends

**Index selectivity**: Very high - combines user, URL, and strategy filters

## Continuous Monitoring

For production deployments, consider:

1. **Automated Verification**:
   ```bash
   # Add to CI/CD pipeline
   npm run db:verify-indexes || exit 1
   ```

2. **Regular Performance Checks**:
   ```bash
   # Run weekly or after schema changes
   npm run db:test-performance
   ```

3. **Database Monitoring**:
   - Set up alerts for query times >100ms
   - Monitor index usage with `pg_stat_user_indexes`
   - Track sequential scans with `pg_stat_user_tables`

4. **Neon Dashboard**:
   - Monitor query performance in Neon dashboard
   - Review slow query logs
   - Check connection pool usage

## Integration with Spec 004

These verification scripts are part of **Phase 5: User Story 3** from spec 004 (Live Web Vitals Dashboard Integration):

**Tasks completed**:
- ✅ T013: Verify Prisma indexes exist on web_vitals_metrics table
- ✅ T014: Test database query performance with EXPLAIN ANALYZE

**Related phases**:
- Phase 1-2: Setup + Seed script infrastructure
- Phase 3: Real-time metrics capture (WebVitalsReporter)
- Phase 4: Dashboard display with real data
- **Phase 5**: Historical metrics verification (this document)
- Phase 6: Polish + empty states + error handling

## Testing

The verification scripts have comprehensive test coverage:

```bash
# Run all tests including verification script tests
npm test

# Test files:
# - __tests__/scripts/verify-indexes.test.ts (11 tests)
# - __tests__/scripts/test-query-performance.test.ts (18 tests)
```

## References

- **Spec 004**: [specs/004-database-interactions/spec.md](../specs/004-database-interactions/spec.md)
- **Tasks**: [specs/004-database-interactions/tasks.md](../specs/004-database-interactions/tasks.md)
- **Data Model**: [specs/004-database-interactions/data-model.md](../specs/004-database-interactions/data-model.md)
- **Prisma Schema**: [prisma/schema.prisma](../prisma/schema.prisma)

## FAQ

**Q: How often should I run these scripts?**
A: Run `db:verify-indexes` after any schema changes. Run `db:test-performance` weekly or when investigating performance issues.

**Q: What if my query is slower than 100ms?**
A: Check that indexes exist, run VACUUM ANALYZE, and review EXPLAIN output. Network latency to database can also add overhead.

**Q: Do I need seed data to verify indexes?**
A: No. `db:verify-indexes` works without data. However, `db:test-performance` requires data to measure query performance accurately.

**Q: Can I run these against production?**
A: Yes, but use caution with `db:test-performance` on production. It runs actual queries and EXPLAIN ANALYZE can add load. Consider using a read replica.

**Q: What PostgreSQL version is required?**
A: These scripts are tested with PostgreSQL 14+ (Neon uses PostgreSQL 15). EXPLAIN ANALYZE syntax is stable across versions 9.6+.
