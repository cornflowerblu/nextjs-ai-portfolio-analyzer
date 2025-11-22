/**
 * Token Verification API Route
 * Verifies Firebase ID tokens server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';
import { isUserAllowed } from '@/lib/firebase/access-control';

/**
 * POST /api/auth/verify
 * Verify a Firebase ID token
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await verifyIdToken(idToken);

    // Check access control using shared utility
    if (!isUserAllowed(decodedToken.email)) {
      return NextResponse.json(
        { error: 'Access denied. Your email is not authorized.' },
        { status: 403 }
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
