#!/usr/bin/env tsx
/**
 * T014: Test database query performance with EXPLAIN ANALYZE
 * 
 * This script measures the performance of the dashboard query that filters
 * Web Vitals metrics by userId and time range (last 24 hours).
 * 
 * Usage:
 *   npm run db:test-performance
 *   or
 *   tsx scripts/test-query-performance.ts
 * 
 * Performance targets:
 * - Query time: <100ms (p95)
 * - Index usage: Should use index scan, not sequential scan
 * - Planning time: <10ms
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
// Try multiple environment files in order of precedence
import { existsSync } from 'fs';

const envFiles = ['.env.local', '.env.development', '.env'];
for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Import Prisma types
import type { PrismaClient as PrismaClientType } from '@/lib/generated/prisma';

interface ExplainResult {
  'QUERY PLAN': string;
}

// Constants for performance testing
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const PERFORMANCE_TEST_RUNS = 3;

// Import Prisma client after environment variables are loaded
let prisma: PrismaClientType;

async function main() {
  console.log('⚡ Testing database query performance...\n');

  const prismaModule = await import('../lib/db/prisma');
  prisma = prismaModule.prisma;

  try {
    // Get or use demo user ID
    const demoUserId = process.env.DEMO_USER_ID || 'demo-seed-user-id';
    
    // Check if user has any data
    const metricCount = await prisma.webVitalsMetric.count({
      where: { userId: demoUserId },
    });

    console.log(`📊 User has ${metricCount} metrics in database`);
    
    if (metricCount === 0) {
      console.log('\n⚠️  No data found for demo user.');
      console.log('💡 Run: npm run db:seed to generate test data\n');
      process.exit(1);
    }

    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
    
    console.log(`\n🔍 Testing dashboard query (last 24 hours)...\n`);

    // Test 1: EXPLAIN (planning only, no execution)
    console.log('1️⃣  Running EXPLAIN (query planning analysis)...\n');
    
    const explainPlan = await prisma.$queryRaw<ExplainResult[]>`
      EXPLAIN
      SELECT strategy, 
             AVG(lcp_ms) as avg_lcp,
             AVG(cls) as avg_cls,
             AVG(inp_ms) as avg_inp,
             AVG(fid_ms) as avg_fid,
             AVG(ttfb_ms) as avg_ttfb,
             COUNT(*) as sample_count
      FROM web_vitals_metrics
      WHERE user_id = ${demoUserId}
        AND collected_at >= ${twentyFourHoursAgo}
      GROUP BY strategy;
    `;

    explainPlan.forEach((row) => {
      console.log(`   ${row['QUERY PLAN']}`);
    });

    // Test 2: EXPLAIN ANALYZE (actual execution with timing)
    console.log('\n2️⃣  Running EXPLAIN ANALYZE (with actual execution timing)...\n');
    
    const startTime = Date.now();
    const explainAnalyze = await prisma.$queryRaw<ExplainResult[]>`
      EXPLAIN ANALYZE
      SELECT strategy, 
             AVG(lcp_ms) as avg_lcp,
             AVG(cls) as avg_cls,
             AVG(inp_ms) as avg_inp,
             AVG(fid_ms) as avg_fid,
             AVG(ttfb_ms) as avg_ttfb,
             COUNT(*) as sample_count
      FROM web_vitals_metrics
      WHERE user_id = ${demoUserId}
        AND collected_at >= ${twentyFourHoursAgo}
      GROUP BY strategy;
    `;
    const endTime = Date.now();
    const queryTime = endTime - startTime;

    explainAnalyze.forEach((row) => {
      console.log(`   ${row['QUERY PLAN']}`);
    });

    // Extract execution time from EXPLAIN ANALYZE output
    let executionTime: number | null = null;
    let planningTime: number | null = null;
    let usesIndexScan = false;
    let usesSeqScan = false;

    for (const row of explainAnalyze) {
      const line = row['QUERY PLAN'];
      
      // Check for execution time
      if (line.includes('Execution Time:')) {
        const match = line.match(/Execution Time:\s*([\d.]+)\s*ms/);
        if (match) {
          executionTime = parseFloat(match[1]);
        }
      }
      
      // Check for planning time
      if (line.includes('Planning Time:')) {
        const match = line.match(/Planning Time:\s*([\d.]+)\s*ms/);
        if (match) {
          planningTime = parseFloat(match[1]);
        }
      }
      
      // Check for index usage
      if (line.includes('Index Scan') || line.includes('Index Only Scan')) {
        usesIndexScan = true;
      }
      
      // Check for sequential scan (bad performance)
      if (line.includes('Seq Scan')) {
        usesSeqScan = true;
      }
    }

    // Performance analysis
    console.log('\n📊 Performance Analysis:\n');
    
    if (planningTime !== null) {
      console.log(`   Planning Time: ${planningTime.toFixed(2)}ms`);
      if (planningTime > 10) {
        console.log(`   ⚠️  Planning time is high (>10ms)`);
      } else {
        console.log(`   ✅ Planning time is good (<10ms)`);
      }
    }
    
    if (executionTime !== null) {
      console.log(`   Execution Time: ${executionTime.toFixed(2)}ms`);
      if (executionTime < 50) {
        console.log(`   ✅ Excellent performance (<50ms)`);
      } else if (executionTime < 100) {
        console.log(`   ✅ Good performance (<100ms target)`);
      } else if (executionTime < 200) {
        console.log(`   ⚠️  Acceptable performance but above target (100ms)`);
      } else {
        console.log(`   ❌ Poor performance (>200ms)`);
      }
    }
    
    console.log(`   Total Round-trip Time: ${queryTime}ms (includes network latency)`);
    
    console.log('\n   Index Usage:');
    if (usesIndexScan) {
      console.log(`   ✅ Query uses index scan (efficient)`);
    } else if (usesSeqScan) {
      console.log(`   ❌ Query uses sequential scan (inefficient)`);
      console.log(`   💡 Run: npm run db:verify-indexes to check index configuration`);
    } else {
      console.log(`   ℹ️  Unable to determine scan type from EXPLAIN output`);
    }

    // Test 3: Measure actual query performance with Prisma
    console.log(`\n3️⃣  Testing actual Prisma query performance (${PERFORMANCE_TEST_RUNS} runs)...\n`);
    
    const times: number[] = [];
    
    for (let i = 0; i < PERFORMANCE_TEST_RUNS; i++) {
      const start = Date.now();
      
      await prisma.webVitalsMetric.groupBy({
        by: ['strategy'],
        where: {
          userId: demoUserId,
          collectedAt: {
            gte: twentyFourHoursAgo,
          },
        },
        _avg: {
          lcpMs: true,
          cls: true,
          inpMs: true,
          fidMs: true,
          ttfbMs: true,
        },
        _count: {
          id: true,
        },
      });
      
      const elapsed = Date.now() - start;
      times.push(elapsed);
      console.log(`   Run ${i + 1}: ${elapsed}ms`);
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`\n   Average: ${avgTime.toFixed(2)}ms`);
    console.log(`   Min: ${minTime}ms`);
    console.log(`   Max: ${maxTime}ms`);

    // Final verdict
    console.log('\n🎯 Final Verdict:\n');
    
    const issues: string[] = [];
    const passed: string[] = [];
    
    if (executionTime !== null && executionTime < 100) {
      passed.push('Query execution time is within target (<100ms)');
    } else if (executionTime !== null) {
      issues.push(`Query execution time (${executionTime.toFixed(2)}ms) exceeds target (100ms)`);
    }
    
    if (usesIndexScan) {
      passed.push('Query uses index scan for efficient filtering');
    } else if (usesSeqScan) {
      issues.push('Query uses sequential scan instead of index');
    }
    
    if (avgTime < 500) {
      passed.push('Prisma query response time is acceptable');
    } else {
      issues.push(`Prisma query response time (${avgTime.toFixed(2)}ms) is high`);
    }

    if (passed.length > 0) {
      console.log('✅ Passed checks:');
      passed.forEach((msg) => console.log(`   - ${msg}`));
      console.log('');
    }

    if (issues.length > 0) {
      console.log('⚠️  Issues found:');
      issues.forEach((msg) => console.log(`   - ${msg}`));
      console.log('');
      console.log('💡 Recommendations:');
      console.log('   1. Ensure indexes are properly created (npm run db:verify-indexes)');
      console.log('   2. Consider running VACUUM ANALYZE on the database');
      console.log('   3. Check database connection pool settings');
      console.log('   4. Verify database is not under heavy load\n');
    } else {
      console.log('🎉 All performance checks passed!\n');
    }

    process.exit(issues.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error testing query performance:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. DATABASE_URL is set in .env.local');
    console.log('   2. Database is accessible');
    console.log('   3. You have run: npm run db:seed\n');
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
