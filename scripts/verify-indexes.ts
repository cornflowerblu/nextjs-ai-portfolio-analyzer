#!/usr/bin/env tsx
/**
 * T013: Verify Prisma indexes exist on web_vitals_metrics table
 * 
 * This script checks that the required indexes are present in the database
 * for optimal query performance on historical metrics.
 * 
 * Usage:
 *   npm run db:verify-indexes
 *   or
 *   tsx scripts/verify-indexes.ts
 * 
 * Expected indexes on web_vitals_metrics:
 * 1. userId + collectedAt (DESC) - for user-scoped time filtering
 * 2. userId + url + strategy + collectedAt (DESC) - for page-level analysis
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
// Try multiple environment files in order of precedence
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

interface IndexInfo {
  indexname: string;
  tablename: string;
  indexdef: string;
}

// Import Prisma client after environment variables are loaded
let prisma: PrismaClientType;

async function main() {
  console.log('🔍 Verifying database indexes on web_vitals_metrics table...\n');

  const prismaModule = await import('../lib/db/prisma');
  prisma = prismaModule.prisma;

  try {
    // Query PostgreSQL system catalog to get indexes on web_vitals_metrics table
    const indexes = await prisma.$queryRaw<IndexInfo[]>`
      SELECT
        indexname,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'web_vitals_metrics'
      AND schemaname = 'public'
      ORDER BY indexname;
    `;

    console.log(`📊 Found ${indexes.length} index(es) on web_vitals_metrics table:\n`);

    if (indexes.length === 0) {
      console.log('❌ No indexes found! This will cause poor query performance.\n');
      console.log('💡 Run: npm run db:push');
      process.exit(1);
    }

    // Display all indexes
    indexes.forEach((idx, i) => {
      console.log(`${i + 1}. ${idx.indexname}`);
      console.log(`   ${idx.indexdef}\n`);
    });

    // Check for required indexes
    const requiredIndexes = [
      {
        name: 'userId + collectedAt',
        pattern: /user_id.*collected_at/i,
        found: false,
      },
      {
        name: 'userId + url + strategy + collectedAt',
        pattern: /user_id.*url.*strategy.*collected_at/i,
        found: false,
      },
    ];

    for (const idx of indexes) {
      const def = idx.indexdef.toLowerCase();
      
      for (const req of requiredIndexes) {
        if (req.pattern.test(def)) {
          req.found = true;
          console.log(`✅ Required index found: ${req.name}`);
          console.log(`   Index: ${idx.indexname}\n`);
        }
      }
    }

    // Check if all required indexes are present
    const missingIndexes = requiredIndexes.filter((req) => !req.found);

    if (missingIndexes.length > 0) {
      console.log('\n❌ Missing required indexes:');
      missingIndexes.forEach((req) => {
        console.log(`   - ${req.name}`);
      });
      console.log('\n💡 Ensure your Prisma schema has these indexes defined:');
      console.log('   @@index([userId, collectedAt(sort: Desc)])');
      console.log('   @@index([userId, url, strategy, collectedAt(sort: Desc)])');
      console.log('\n💡 Then run: npm run db:push\n');
      process.exit(1);
    }

    console.log('\n✅ All required indexes are present!\n');
    console.log('📈 Performance impact:');
    console.log('   - Dashboard queries will use userId+collectedAt index');
    console.log('   - Page-specific queries will use userId+url+strategy+collectedAt index');
    console.log('   - Both indexes support efficient date range filtering\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verifying indexes:', error);
    console.log('\n💡 Make sure:');
    console.log('   1. DATABASE_URL is set in .env.local');
    console.log('   2. Database is accessible');
    console.log('   3. Prisma schema is pushed (npm run db:push)\n');
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
