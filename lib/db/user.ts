/**
 * User database operations
 * 
 * Provides functions for managing user records tied to Firebase authentication.
 * User records use Firebase UID as the primary key for seamless integration.
 */

import { prisma } from '@/lib/db/prisma';

/**
 * User data for upserting
 */
export interface UpsertUserData {
  id: string; // Firebase UID
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
}

/**
 * Upsert a user record based on Firebase UID
 * 
 * Creates a new user if one doesn't exist, or updates the existing user's profile
 * fields (email, name, photoURL) if the user already exists.
 * 
 * @param data - User data containing Firebase UID and optional profile fields
 * @returns The created or updated user record
 * @throws Error if the database operation fails or if id is empty
 * 
 * @example
 * ```ts
 * const user = await upsertUser({
 *   id: 'firebase-uid-123',
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   photoURL: 'https://example.com/photo.jpg',
 * });
 * ```
 */
export async function upsertUser(data: UpsertUserData) {
  if (!data.id || data.id.trim() === '') {
    throw new Error('User ID (Firebase UID) is required');
  }

  return await prisma.user.upsert({
    where: {
      id: data.id,
    },
    update: {
      email: data.email,
      name: data.name,
      photoURL: data.photoURL,
    },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
      photoURL: data.photoURL,
    },
  });
}
