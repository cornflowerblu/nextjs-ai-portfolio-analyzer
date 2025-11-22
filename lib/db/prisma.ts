/**
 * Prisma Client singleton for database access
 * 
 * This module provides a singleton instance of PrismaClient to prevent
 * creating multiple instances during hot reload in development.
 * 
 * Database URL is configured in prisma.config.ts and uses Vercel's
 * POSTGRES_PRISMA_URL (pooled) with fallback to POSTGRES_URL.
 * 
 * @see https://pris.ly/d/help/next-js-best-practices
 */

import { PrismaClient } from '@/lib/generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client instance
 * 
 * Uses database connection string from environment:
 * - POSTGRES_PRISMA_URL (pooled - preferred for Vercel)
 * - POSTGRES_URL (fallback)
 * - DATABASE_URL (final fallback)
 * 
 * Prisma automatically handles connection pooling via the DATABASE_URL.
 */
function createPrismaClient() {
  const connectionString = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Database connection string not found. Set POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL.');
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Singleton PrismaClient instance
 * 
 * In production, creates a new PrismaClient.
 * In development, reuses the same instance to avoid connection exhaustion.
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
