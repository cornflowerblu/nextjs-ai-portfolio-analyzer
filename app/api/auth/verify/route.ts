/**
 * Token Verification API Route
 * Verifies Firebase ID tokens server-side
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase/admin';

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

    // Check access control
    const allowedEmails = (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').filter(Boolean);
    const allowedDomains = (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || '').split(',').filter(Boolean);
    
    const email = decodedToken.email?.toLowerCase() || '';
    const emailDomain = email.split('@')[1];
    
    const isEmailAllowed = allowedEmails.some(allowed => allowed.toLowerCase() === email);
    const isDomainAllowed = emailDomain && allowedDomains.some(domain => domain.toLowerCase() === emailDomain);
    
    if (!isEmailAllowed && !isDomainAllowed) {
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
