/**
 * Server-side session utilities for Next.js Server Components
 * Provides helpers to retrieve authenticated user from session cookie
 */

import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';

/**
 * Session data structure stored in cookie
 */
export interface SessionData {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  expiresAt: number;
}

/**
 * Get current session from cookie (Server Components)
 * 
 * @returns Session data if valid, null if expired or missing
 * 
 * @example
 * ```ts
 * const session = await getServerSession();
 * if (!session) {
 *   redirect('/login');
 * }
 * const userId = session.uid;
 * ```
 */
export async function getServerSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    // Parse and validate session data
    let sessionData: unknown;
    try {
      sessionData = JSON.parse(sessionCookie.value);
    } catch (parseError) {
      console.error('Invalid session cookie JSON:', parseError);
      return null;
    }

    // Validate session data structure
    if (!sessionData || typeof sessionData !== 'object') {
      return null;
    }

    const data = sessionData as Record<string, unknown>;
    if (
      typeof data.uid !== 'string' ||
      typeof data.expiresAt !== 'number'
    ) {
      return null;
    }

    const validatedSession: SessionData = {
      uid: data.uid,
      email: typeof data.email === 'string' ? data.email : null,
      name: typeof data.name === 'string' ? data.name : null,
      picture: typeof data.picture === 'string' ? data.picture : null,
      expiresAt: data.expiresAt,
    };

    // Check if session is expired or has invalid expiration
    const now = Date.now();
    // Reject if expiresAt is negative, in the past, or more than 1 year in the future
    if (
      validatedSession.expiresAt < now ||
      validatedSession.expiresAt < 0 ||
      validatedSession.expiresAt > now + (365 * 24 * 60 * 60 * 1000) // More than 1 year in future
    ) {
      return null;
    }

    return validatedSession;
  } catch (error) {
    console.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Get current user ID from session (convenience helper)
 * 
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession();
  return session?.uid ?? null;
}
