/**
 * Server-side session utilities for Next.js Server Components
 * Provides helpers to retrieve authenticated user from session cookie
 */

import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'session';

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

    const sessionData = JSON.parse(sessionCookie.value) as SessionData;

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      return null;
    }

    return sessionData;
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
