/**
 * User Menu Component
 * Displays user profile and sign-out option
 */

'use client';

import { useState, useEffect } from 'react';
import { signOut, onAuthStateChange } from '@/lib/firebase/auth';
import { User } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Unified user data structure
interface UserData {
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}

export function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Track if component is still mounted
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    // First, check server-side session
    const checkServerSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.user && isMounted) {
            setUser({
              email: data.user.email,
              displayName: data.user.name,
              photoURL: data.user.picture,
            });
            setIsLoading(false);
            return true; // Session found
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
      return false; // No session found
    };

    // Check server session first, then subscribe to Firebase auth state changes
    checkServerSession().then((hasSession) => {
      if (!isMounted) return;
      
      // Subscribe to Firebase auth state changes
      unsubscribe = onAuthStateChange((authUser: User | null) => {
        if (!isMounted) return;
        
        if (authUser) {
          setUser({
            email: authUser.email,
            displayName: authUser.displayName,
            photoURL: authUser.photoURL,
          });
        } else if (!hasSession) {
          // Only clear user if we also don't have a server session
          setUser(null);
        }
        setIsLoading(false);
      });
    });

    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Use window.location for full page reload after sign out
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full">
        {user.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={user.displayName || 'User'}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:border-blue-500 transition-colors"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-sm border-2 border-white shadow-sm hover:border-blue-500 transition-colors">
            {user.email?.[0].toUpperCase()}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
