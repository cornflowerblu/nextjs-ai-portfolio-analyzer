/**
 * Firebase Admin SDK initialization and authentication helpers
 * 
 * Provides server-side Firebase authentication verification for protected routes.
 * Uses service account credentials from environment variables.
 * 
 * @see https://firebase.google.com/docs/admin/setup
 */

import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * 
 * Uses service account credentials from environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (with newlines replaced by \\n in env)
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // During build time, environment variables might not be available
    // We'll throw the error only when the functions are actually called
    return null;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// Initialize on module load (may return null during build)
const firebaseAdmin = initializeFirebaseAdmin();

/**
 * Get Firebase Admin instance, initializing if necessary
 * Throws error if credentials are missing
 */
function getFirebaseAdminInstance() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  // Try to initialize again (in case env vars were not available during module load)
  const app = initializeFirebaseAdmin();
  if (!app) {
    throw new Error(
      'Missing Firebase Admin credentials. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
    );
  }
  return app;
}

/**
 * Verify Firebase ID token from Authorization header
 * 
 * @param idToken - Firebase ID token from client (from Authorization: Bearer header)
 * @returns Decoded token containing user claims (uid, email, etc.)
 * @throws Error if token is invalid or expired
 * 
 * @example
 * ```ts
 * const authHeader = request.headers.get('authorization');
 * const token = authHeader?.replace('Bearer ', '');
 * const decodedToken = await verifyFirebaseToken(token);
 * const userId = decodedToken.uid;
 * ```
 */
export async function verifyFirebaseToken(idToken: string | null | undefined) {
  if (!idToken) {
    throw new Error('No authentication token provided');
  }

  try {
    const app = getFirebaseAdminInstance();
    const decodedToken = await app.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract and verify user from Authorization header
 * 
 * Convenience helper that extracts the Bearer token from the Authorization header,
 * verifies it, and returns the user information.
 * 
 * @param authorizationHeader - Full Authorization header value (e.g., "Bearer <token>")
 * @returns Object containing userId and full decoded token
 * @throws Error if header is missing, malformed, or token is invalid
 * 
 * @example
 * ```ts
 * const authHeader = request.headers.get('authorization');
 * const { userId, decodedToken } = await getUserFromToken(authHeader);
 * ```
 */
export async function getUserFromToken(authorizationHeader: string | null | undefined) {
  if (!authorizationHeader) {
    throw new Error('Missing Authorization header');
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    throw new Error('Invalid Authorization header format. Expected: Bearer <token>');
  }

  const token = authorizationHeader.replace('Bearer ', '');
  const decodedToken = await verifyFirebaseToken(token);

  return {
    userId: decodedToken.uid,
    email: decodedToken.email,
    decodedToken,
  };
}

/**
 * Get Firebase Admin instance
 * Useful for direct access to Admin SDK features
 */
export function getFirebaseAdmin() {
  return getFirebaseAdminInstance();
}
