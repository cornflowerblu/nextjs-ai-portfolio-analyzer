/**
 * Session Management API Route
 * Handles session creation and deletion with database persistence
 * CACHE BUST: v2.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth/firebase-admin';
import { cookies } from 'next/headers';
import { isUserAllowed } from '@/lib/firebase/access-control';
import { SESSION_COOKIE_NAME } from '@/lib/auth/constants';

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

/**
 * POST /api/auth/session
 * Create a new session cookie from Firebase ID token and persist user to database
 */
export async function POST(request: NextRequest) {

  try {
    const { idToken } = await request.json();


    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the ID token  
  
    const decodedToken = await verifyFirebaseToken(idToken);
  

    // Check access control using shared utility
  
    if (!isUserAllowed(decodedToken.email)) {
      return NextResponse.json(
        { error: 'Access denied. Your email is not authorized.' },
        { status: 403 }
      );
    }
  

    // Try to upsert user to database (optional - won't block login if it fails)
    try {
      const { upsertUser } = await import('@/lib/db/user');
      await upsertUser({
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        photoURL: decodedToken.picture,
      });
    } catch (dbError) {
      // Log error but continue with session creation
      console.error('⚠️ Database persistence unavailable (continuing without it):', dbError instanceof Error ? dbError.message : 'Unknown error');
      // Continue with session creation even if DB fails
    }
    // Create session data
    const sessionData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      picture: decodedToken.picture,
      expiresAt: Date.now() + SESSION_DURATION,
    };

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION / 1000, // Convert to seconds
      path: '/',
    });

    return NextResponse.json({ success: true, user: sessionData });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clear the session cookie
 */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * Get current session data
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: sessionData });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ user: null });
  }
}
