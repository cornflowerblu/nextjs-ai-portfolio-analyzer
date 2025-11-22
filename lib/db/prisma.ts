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
 * Singleton PrismaClient instance
 * 
 * In production, creates a new PrismaClient.
 * In development, reuses the same instance to avoid connection exhaustion.
 * 
 * Database URL is configured in prisma.config.ts using Vercel's environment variables:
 * - POSTGRES_PRISMA_URL (pooled - preferred)
 * - POSTGRES_URL (fallback)
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

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
