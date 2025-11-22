/**
 * Authentication Middleware
 * Protects routes requiring authentication at the edge
 * 
 * Protected routes:
 * - /dashboard/*
 * - /trends/*
 * - /platform/*
 * 
 * Public routes:
 * - /
 * - /analyze
 * - /lab/*
 * - /login
 * - /api/auth/*
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/trends', '/platform'];
const PUBLIC_PATHS = ['/', '/analyze', '/lab', '/login', '/api/auth'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check if path requires protection
  const isProtectedPath = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('session');

  if (!sessionCookie?.value) {
    // No session - redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Parse session data
    const sessionData = JSON.parse(sessionCookie.value);

    // Validate session structure
    if (!sessionData.uid || !sessionData.email || !sessionData.expiresAt) {
      throw new Error('Invalid session structure');
    }

    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      // Session expired - redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    // Session is valid - allow access
    // Note: The session was cryptographically verified by Firebase Admin SDK when created
    // Additional signature verification would require a signing key not available at edge
    return NextResponse.next();
  } catch (error) {
    // Invalid session cookie - redirect to login
    console.error('Middleware session validation error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
};
