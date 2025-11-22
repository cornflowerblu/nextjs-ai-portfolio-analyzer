/**
 * Firebase Admin SDK Configuration
 * Used for server-side token verification and user management
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App;
let adminAuth: Auth;

/**
 * Initialize Firebase Admin SDK
 * Uses service account credentials from environment variables
 */
function initializeAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0];
    return adminApp;
  }

  // For Vercel/production: use service account key JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
      throw new Error('Invalid Firebase service account configuration');
    }
  } else {
    // For local development: use application default credentials
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }

  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeAdminApp();
    adminAuth = getAuth(adminApp);
  }
  return adminAuth;
}

/**
 * Verify Firebase ID token
 * @param idToken - Firebase ID token from client
 * @returns Decoded token with user information
 */
export async function verifyIdToken(idToken: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string) {
  try {
    const auth = getAdminAuth();
    return await auth.getUser(uid);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}
