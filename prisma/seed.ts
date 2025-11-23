/**
 * Database Seed Script for Web Vitals Demo Data
 * 
 * Generates 337 realistic Web Vitals metrics across 7 days to populate
 * the dashboard with compelling demo data.
 * 
 * Distribution:
 * - SSG: 100 metrics (fastest strategy)
 * - ISR: 87 metrics
 * - CACHE: 75 metrics
 * - SSR: 75 metrics (slowest strategy)
 * 
 * Usage:
 *   npm run db:seed
 * 
 * Idempotent: Can be run multiple times safely.
 */

// Load environment variables from .env.local BEFORE importing Prisma client
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Must configure dotenv BEFORE any imports that depend on environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

// Import RenderingStrategy type
type RenderingStrategy = 'SSG' | 'ISR' | 'CACHE' | 'SSR';

// Metric distribution constants per strategy
const STRATEGY_MEANS = {
  SSG: {
    LCP: 600,    // Fastest: pre-rendered
    CLS: 0.03,   // Very stable
    INP: 45,     // Excellent responsiveness
    FID: 12,     // Minimal delay
    TTFB: 150,   // CDN cached
  },
  ISR: {
    LCP: 900,    // Fast: cached with revalidation
    CLS: 0.05,   // Stable
    INP: 60,     // Good responsiveness
    FID: 18,     // Low delay
    TTFB: 250,   // Revalidation overhead
  },
  CACHE: {
    LCP: 1200,   // Good: Server Components cached
    CLS: 0.08,   // Acceptable stability
    INP: 85,     // Decent responsiveness
    FID: 28,     // Moderate delay
    TTFB: 400,   // Cache check + render
  },
  SSR: {
    LCP: 1800,   // Slowest: on-demand rendering
    CLS: 0.12,   // More layout shifts
    INP: 120,    // Needs improvement
    FID: 45,     // Noticeable delay
    TTFB: 650,   // Full server render
  },
} as const;

const STRATEGY_STDDEVS = {
  SSG: {
    LCP: 150,
    CLS: 0.01,
    INP: 15,
    FID: 5,
    TTFB: 50,
  },
  ISR: {
    LCP: 200,
    CLS: 0.02,
    INP: 20,
    FID: 8,
    TTFB: 80,
  },
  CACHE: {
    LCP: 250,
    CLS: 0.03,
    INP: 25,
    FID: 10,
    TTFB: 100,
  },
  SSR: {
    LCP: 400,
    CLS: 0.05,
    INP: 35,
    FID: 15,
    TTFB: 150,
  },
} as const;

// Validation ranges from API
const METRIC_RANGES = {
  LCP: { min: 0, max: 30000 },
  CLS: { min: 0, max: 5 },
  INP: { min: 0, max: 5000 },
  FID: { min: 0, max: 2000 },
  TTFB: { min: 0, max: 10000 },
} as const;

// Strategy counts for distribution
const STRATEGY_COUNTS = {
  SSG: 100,
  ISR: 87,
  CACHE: 75,
  SSR: 75,
} as const;

type Strategy = keyof typeof STRATEGY_MEANS;

/**
 * Generate Gaussian random number using Box-Muller transform
 * @param mean - Mean value
 * @param stddev - Standard deviation
 * @returns Random value following Gaussian distribution
 */
function gaussianRandom(mean: number, stddev: number): number {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stddev;
}

/**
 * Apply time-of-day performance variation
 * Simulates peak hours being slower due to higher load
 * @param hour - Hour of day (0-23)
 * @returns Multiplier for metric value (0.8 to 1.3)
 */
function timeFactorMultiplier(hour: number): number {
  if (hour >= 9 && hour <= 17) return 1.3;  // Peak hours (+30%)
  if (hour >= 22 || hour <= 6) return 0.8;   // Off-hours (-20%)
  return 1.0;                                  // Normal hours
}

/**
 * Clamp value to valid range
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate metric value with time-of-day variation
 */
function generateMetricValue(
  strategy: Strategy,
  metricName: keyof typeof STRATEGY_MEANS.SSG,
  hour: number
): number {
  const mean = STRATEGY_MEANS[strategy][metricName];
  const stddev = STRATEGY_STDDEVS[strategy][metricName];
  const timeFactor = timeFactorMultiplier(hour);
  
  let value = gaussianRandom(mean, stddev) * timeFactor;
  
  // Clamp to valid range
  const range = METRIC_RANGES[metricName];
  value = clamp(value, range.min, range.max);
  
  // Round to 2 decimal places
  return Math.round(value * 100) / 100;
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Seeding database with Web Vitals demo data...\n');

  // Import Prisma client after environment variables are loaded
  // Debug: Check if DATABASE_URL is set
  console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
  console.log('POSTGRES_PRISMA_URL present:', !!process.env.POSTGRES_PRISMA_URL);
  console.log('POSTGRES_URL present:', !!process.env.POSTGRES_URL);
  
  const { prisma } = await import('../lib/db/prisma');

  // Get or create demo user
  // In production, you'd get this from Firebase Auth after login
  const demoUserId = process.env.DEMO_USER_ID || 'demo-seed-user-id';
  
  // Create demo user if it doesn't exist
  const demoUser = await prisma.user.upsert({
    where: { id: demoUserId },
    update: {},
    create: {
      id: demoUserId,
      email: 'demo@example.com',
      name: 'Demo User',
      photoURL: null,
    },
  });

  console.log(`📝 Using demo user: ${demoUser.email} (${demoUser.id})\n`);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  let totalCreated = 0;
  const strategies = Object.keys(STRATEGY_COUNTS) as Strategy[];
  const BATCH_SIZE = 20; // Insert in smaller batches to avoid Neon HTTP timeout

  for (let strategyIndex = 0; strategyIndex < strategies.length; strategyIndex++) {
    const strategy = strategies[strategyIndex];
    const count = STRATEGY_COUNTS[strategy];

    console.log(`🔄 Generating ${strategy} metrics... (${strategyIndex + 1}/${strategies.length})`);

    const metricsToCreate = [];

    for (let i = 0; i < count; i++) {
      // Random timestamp within last 7 days
      const timestamp = sevenDaysAgo + Math.random() * (7 * 24 * 60 * 60 * 1000);
      const date = new Date(timestamp);
      const hour = date.getHours();
      
      // Generate all 5 metrics for this page visit with time-of-day variation
      const lcpMs = generateMetricValue(strategy, 'LCP', hour);
      const cls = generateMetricValue(strategy, 'CLS', hour);
      const inpMs = generateMetricValue(strategy, 'INP', hour);
      const fidMs = generateMetricValue(strategy, 'FID', hour);
      const ttfbMs = generateMetricValue(strategy, 'TTFB', hour);

      metricsToCreate.push({
        userId: demoUserId,
        url: `http://localhost:3000/lab/${strategy.toLowerCase()}`,
        strategy: strategy as RenderingStrategy,
        lcpMs,
        cls,
        inpMs,
        fidMs,
        ttfbMs,
        collectedAt: date,
      });
    }

    // Insert in batches to avoid Neon HTTP adapter timeout
    try {
      for (let i = 0; i < metricsToCreate.length; i += BATCH_SIZE) {
        const batch = metricsToCreate.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map((metric) =>
            prisma.webVitalsMetric.create({ data: metric })
          )
        );
        process.stdout.write(`   Progress: ${Math.min(i + BATCH_SIZE, metricsToCreate.length)}/${metricsToCreate.length}\r`);
      }
      
      totalCreated += metricsToCreate.length;
      console.log(`\n✅ Created ${metricsToCreate.length} ${strategy} metrics\n`);
    } catch (error) {
      console.error(`❌ Error creating ${strategy} metrics:`, error);
      throw error;
    }
  }

  console.log(`🎉 Seed complete! Generated ${totalCreated} metrics across 7 days`);
  console.log(`   Total page visits simulated: ${totalCreated}`);
  console.log(`\n📊 Next steps:`);
  console.log(`   1. npm run dev`);
  console.log(`   2. Login at /login`);
  console.log(`   3. View dashboard at /dashboard`);
  console.log(`   4. (Optional) npm run db:studio to inspect data\n`);
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    // Import prisma to disconnect
    const { prisma } = await import('../lib/db/prisma');
    await prisma.$disconnect();
  });
