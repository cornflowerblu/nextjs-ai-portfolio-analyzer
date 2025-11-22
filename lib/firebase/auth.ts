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

/**
 * Access control configuration
 * Combines email allowlist and domain restriction
 */
const ACCESS_CONTROL = {
  // Allowed email addresses (exact match)
  allowedEmails: (process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '').split(',').filter(Boolean),
  
  // Allowed domains (e.g., 'slingshotgrp.com')
  allowedDomains: (process.env.NEXT_PUBLIC_ALLOWED_DOMAINS || '').split(',').filter(Boolean),
};

/**
 * Check if user has access based on email allowlist and domain restriction
 */
export function isUserAllowed(email: string | null | undefined): boolean {
  if (!email) return false;

  const emailLower = email.toLowerCase();
  
  // Check exact email match
  if (ACCESS_CONTROL.allowedEmails.some(allowed => allowed.toLowerCase() === emailLower)) {
    return true;
  }

  // Check domain match
  const emailDomain = emailLower.split('@')[1];
  if (emailDomain && ACCESS_CONTROL.allowedDomains.some(domain => domain.toLowerCase() === emailDomain)) {
    return true;
  }

  return false;
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
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
    
    // Create session on server
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
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
  
  try {
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
  return onAuthStateChanged(auth, callback);
}

/**
 * Get fresh ID token for API calls
 */
export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}
