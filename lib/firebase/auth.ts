/**
 * Firebase Authentication Utilities
 * Client-side authentication helpers
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirebaseAuth } from './config';
import { isUserAllowed } from './access-control';

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    throw new Error('Firebase authentication is not configured. Please contact the administrator.');
  }
  
  const provider = new GoogleAuthProvider();
  
  // Force account selection
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check access control
    if (!isUserAllowed(user.email)) {
      await firebaseSignOut(auth);
      throw new Error('Access denied. Your email is not authorized to access this application.');
    }

    // Get ID token for session creation
    const idToken = await user.getIdToken();
    
    // Create session on server (optional - don't block on failure)
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        console.warn('Failed to create server session, continuing with client-only auth');
      }
    } catch (sessionError) {
      console.warn('Session creation failed, continuing with client-only auth:', sessionError);
    }

    return user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  const auth = getFirebaseAuth();

  if (!auth) {
    console.warn('Firebase authentication is not configured.');
    return;
  }

  try {
    // Stop automatic token refresh
    stopTokenRefresh();

    // Clear session on server
    await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    // Sign out from Firebase
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Get current user
 */
export function getCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return Promise.resolve(null);
  }
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    // Call callback with null immediately if auth not configured
    callback(null);
    return () => {}; // Return no-op unsubscribe function
  }
  
  return onAuthStateChanged(auth, callback);
}

/**
 * Get fresh ID token for API calls
 * @param forceRefresh - Force token refresh even if not expired
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const auth = getFirebaseAuth();

  if (!auth) {
    return null;
  }

  const user = auth.currentUser;

  if (!user) return null;

  try {
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Refresh the server session using current Firebase token
 * Should be called periodically to keep session alive
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const idToken = await getIdToken(true); // Force fresh token

    if (!idToken) {
      console.warn('No ID token available for session refresh');
      return false;
    }

    const response = await fetch('/api/auth/session', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      console.warn('Session refresh failed:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return false;
  }
}

// Token refresh interval: 50 minutes (tokens expire after 60 minutes)
const TOKEN_REFRESH_INTERVAL_MS = 50 * 60 * 1000;
let refreshIntervalId: NodeJS.Timeout | null = null;

/**
 * Start automatic token and session refresh
 * Call this after successful sign-in
 */
export function startTokenRefresh() {
  // Clear any existing interval
  stopTokenRefresh();

  // Set up periodic refresh
  refreshIntervalId = setInterval(async () => {
    const auth = getFirebaseAuth();

    if (!auth?.currentUser) {
      console.log('No user signed in, stopping token refresh');
      stopTokenRefresh();
      return;
    }

    console.log('Auto-refreshing token and session...');
    const success = await refreshSession();

    if (!success) {
      console.warn('Auto-refresh failed - user may need to sign in again');
    }
  }, TOKEN_REFRESH_INTERVAL_MS);

  console.log('Token auto-refresh started (every 50 minutes)');
}

/**
 * Stop automatic token refresh
 * Call this on sign-out
 */
export function stopTokenRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
    console.log('Token auto-refresh stopped');
  }
}
