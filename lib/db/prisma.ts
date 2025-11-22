/**
 * Prisma Client singleton for database access
 * 
 * This module provides a singleton instance of PrismaClient to prevent
 * creating multiple instances during hot reload in development.
 * 
 * Prisma 7 requires using an adapter. We use @prisma/adapter-pg for PostgreSQL.
 * Database URL is configured using Vercel's environment variables.
 * 
 * @see https://pris.ly/d/help/next-js-best-practices
 * @see https://www.prisma.io/docs/orm/overview/databases/postgresql#postgresql-driver-adapters
 */

import { PrismaClient } from '@/lib/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

/**
 * Get database URL from environment variables
 * Uses Vercel's pooled connection for Prisma, with multiple fallbacks
 */
function getDatabaseUrl(): string {
  return (
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    'postgresql://placeholder:placeholder@placeholder:5432/placeholder'
  );
}

/**
 * Create or reuse PostgreSQL connection pool
 */
function getPool(): Pool {
  if (globalForPrisma.pool) {
    return globalForPrisma.pool;
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool;
  }

  return pool;
}

/**
 * Singleton PrismaClient instance
 * 
 * In production, creates a new PrismaClient with PostgreSQL adapter.
 * In development, reuses the same instance to avoid connection exhaustion.
 * 
 * Database URL is configured using Vercel's environment variables:
 * - POSTGRES_PRISMA_URL (pooled - preferred)
 * - POSTGRES_URL (fallback)
 * - DATABASE_URL (fallback)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter: new PrismaPg(getPool()),
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
