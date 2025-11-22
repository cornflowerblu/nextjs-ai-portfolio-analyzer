/**
 * Login Page
 * Authentication landing page with Google sign-in
 */

import { SignInButton } from '@/components/auth/sign-in-button';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Next.js Rendering Strategy Analyzer',
  description: 'Sign in to access the performance dashboard',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to access the performance dashboard
            </p>
          </div>

          {/* Sign In Button */}
          <SignInButton />

          {/* Info */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Access is restricted</strong> to authorized email addresses and domains.
              Contact your administrator if you need access.
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              By signing in, you agree to our terms and privacy policy.
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Need help? Contact support at{' '}
            <a href="mailto:support@slingshotgrp.com" className="text-blue-600 hover:underline">
              support@slingshotgrp.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
