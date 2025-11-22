/**
 * Prisma Client singleton for database access
 * 
 * This module provides a singleton instance of PrismaClient to prevent
 * creating multiple instances during hot reload in development.
 * 
 * Database URL is configured in prisma.config.ts and uses Vercel's
 * POSTGRES_PRISMA_URL (pooled) with fallback to POSTGRES_URL.
 * 
 * Uses Vercel Postgres adapter for serverless/edge compatibility.
 * 
 * @see https://pris.ly/d/help/next-js-best-practices
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client with Vercel Postgres adapter
 */
function createPrismaClient() {
  // Check if database URL is available (skip during builds without DB access)
  const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl === 'postgresql://placeholder') {
    // Return a client that will be initialized later at runtime
    // This allows builds to succeed without database access
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  // Use Vercel Postgres adapter for connection pooling
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Singleton PrismaClient instance
 * 
 * In production, creates a new PrismaClient.
 * In development, reuses the same instance to avoid connection exhaustion.
 * 
 * Database URL is configured in prisma.config.ts using Vercel's environment variables:
 * - POSTGRES_PRISMA_URL (pooled - preferred)
 * - POSTGRES_URL (fallback)
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper to disconnect Prisma Client
 * Useful for cleanup in tests or serverless functions
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
