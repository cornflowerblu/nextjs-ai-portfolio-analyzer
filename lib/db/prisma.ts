/**
 * Prisma Client singleton for database access
 * 
 * This module provides a singleton instance of PrismaClient to prevent
 * creating multiple instances during hot reload in development.
 * 
 * Prisma 7 requires using an adapter. We use @prisma/adapter-pg for PostgreSQL.
 * Database URL is configured using Vercel's environment variables.
 * 
 * Uses @prisma/adapter-neon for Prisma 7 compatibility in production/development.
 * Test environments use a mocked Prisma client.
 * 
 * @see https://pris.ly/d/help/next-js-best-practices
 * @see https://pris.ly/d/prisma7-client-config
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create Prisma Client instance with Neon adapter
 * 
 * Uses database connection string from environment:
 * - POSTGRES_PRISMA_URL (pooled - preferred for Vercel)
 * - POSTGRES_URL (fallback)
 * - DATABASE_URL (final fallback)
 * 
 * In test environments, the Prisma client should be mocked before import.
 */
function createPrismaClient() {
  const connectionString = 
    process.env.POSTGRES_PRISMA_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Database connection string not found. Set POSTGRES_PRISMA_URL, POSTGRES_URL, or DATABASE_URL.');
  }

  // Use Neon adapter with connection string for Prisma 7
  // PrismaNeon expects { connectionString } object parameter
  // See: https://www.prisma.io/docs/orm/overview/databases/neon
  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Get singleton PrismaClient instance
 * 
 * Lazy-loads the Prisma client on first use to ensure environment variables
 * are loaded before attempting to connect to the database.
 * 
 * In production, creates a new PrismaClient with PostgreSQL adapter.
 * In development, reuses the same instance to avoid connection exhaustion.
 */
export function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Singleton PrismaClient instance (lazy-loaded via getter)
 * 
 * This getter ensures the client is only created when first accessed,
 * after Next.js has loaded all environment variables.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrismaClient()[prop as keyof PrismaClient];
  }
});

/**
 * Helper to disconnect Prisma Client
 * Useful for cleanup in tests or serverless functions
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
