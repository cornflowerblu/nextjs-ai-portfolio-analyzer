/**
 * Firebase Client Configuration
 * Used for client-side authentication
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Check if Firebase credentials are configured
function hasFirebaseConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock-api-key-for-testing',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock-project.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:mock',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let initializationAttempted = false;

export function getFirebaseApp(): FirebaseApp | null {
  if (initializationAttempted && !app) {
    // Already tried and failed, return null
    return null;
  }

  if (!app) {
    try {
      const existingApps = getApps();
      app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
      initializationAttempted = true;
    } catch (error) {
      initializationAttempted = true;
      if (!hasFirebaseConfig()) {
        // Silently fail if no config - expected in CI/test environments
        console.warn('Firebase not configured. Authentication features will be disabled.');
      } else {
        console.error('Firebase initialization error:', error);
      }
      return null;
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    if (!firebaseApp) {
      return null;
    }
    try {
      auth = getAuth(firebaseApp);
    } catch (error) {
      console.error('Firebase Auth initialization error:', error);
      return null;
    }
  }
  return auth;
}

export function isFirebaseConfigured(): boolean {
  return hasFirebaseConfig();
}

export { firebaseConfig };
