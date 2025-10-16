/**
 * useAuth Hook
 *
 * Provides authentication operations (login, signup, logout, etc.)
 * and authentication state management.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as authHelpers from '@/lib/auth/helpers';
import type { OAuthProvider } from '@/lib/auth/validation';

interface UseAuthReturn {
  // State
  loading: boolean;
  error: string | null;

  // Operations
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for authentication operations
 *
 * Provides functions for signup, login, logout, OAuth, and password management.
 * Handles loading states, errors, and navigation after successful auth.
 *
 * @param redirectTo - URL to redirect to after successful authentication (default: /dashboard)
 *
 * @example
 * ```typescript
 * function LoginForm() {
 *   const { signIn, loading, error } = useAuth();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     await signIn(email, password);
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div>{error}</div>}
 *       <button disabled={loading}>Log In</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuth(redirectTo: string = '/dashboard'): UseAuthReturn {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, name?: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: signUpError } = await authHelpers.signUp(email, password, name);

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        // Don't redirect after signup - show verification message instead
        router.push('/verify-email');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const { error: signInError } = await authHelpers.signIn(email, password);

        if (signInError) {
          setError(signInError.message);
          return;
        }

        // Redirect after successful login
        router.push(redirectTo);
        router.refresh(); // Refresh to update server components
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    },
    [router, redirectTo]
  );

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: signOutError } = await authHelpers.signOut();

      if (signOutError) {
        setError(signOutError.message);
        return;
      }

      // Redirect to login page
      router.push('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider) => {
      try {
        setLoading(true);
        setError(null);

        const { error: oauthError } = await authHelpers.signInWithOAuth(provider);

        if (oauthError) {
          setError(oauthError.message);
          setLoading(false);
          return;
        }

        // Browser will redirect to OAuth provider
        // Loading state will remain true until redirect completes
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        setLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: resetError } = await authHelpers.resetPassword(email);

      if (resetError) {
        setError(resetError.message);
        return;
      }

      // Success - show message to check email
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await authHelpers.updatePassword(newPassword);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      // Password updated successfully
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    clearError,
  };
}
