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
 * Supports two authentication methods:
 * 1. Service Account JSON (FIREBASE_SERVICE_ACCOUNT_KEY)
 * 2. Individual credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 
 * Method 1 is easier for local development, Method 2 is better for production with secret managers.
 */
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Method 1: Try service account JSON first (easiest for local dev)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      // Fall through to try individual credentials
    }
  }

  // Method 2: Try individual credentials (better for production)
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Method 3: Try application default credentials (for local development with gcloud)
  try {
    console.log('Attempting Method 3: Application Default Credentials...');
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: projectId,
    });
  } catch (error) {
    console.log('Application Default Credentials not available:', error);
    // Fall through to error
  }

  // No valid credentials found
  return null;
}

// Lazy initialization - only initialize when needed
const firebaseAdmin: admin.app.App | null = null;

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
      'Missing Firebase Admin credentials. Please set one of:\n' +
      '1. FIREBASE_SERVICE_ACCOUNT_KEY (full JSON service account), or\n' +
      '2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (individual values)'
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
    const app = getFirebaseAdmin();
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
