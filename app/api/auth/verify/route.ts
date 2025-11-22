/**
 * Token Verification API Route
 * Verifies Firebase ID tokens server-side and upserts user to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyFirebaseToken } from '@/lib/auth/firebase-admin';
import { upsertUser } from '@/lib/db/user';
import { isUserAllowed } from '@/lib/firebase/access-control';

// Use Node.js runtime for database operations
export const runtime = 'nodejs';

/**
 * POST /api/auth/verify
 * Verify a Firebase ID token and upsert user record
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

    // Upsert user to database
    try {
      await upsertUser({
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        photoURL: decodedToken.picture,
      });
    } catch (dbError) {
      console.error('Failed to upsert user:', dbError);
      return NextResponse.json(
        { error: 'Failed to upsert user to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}
