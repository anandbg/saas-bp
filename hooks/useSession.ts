/**
 * useSession Hook
 *
 * Provides access to the current session and user information.
 * Automatically refreshes when authentication state changes.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import * as authHelpers from '@/lib/auth/helpers';
import type { Session, User } from '@supabase/supabase-js';

interface UseSessionReturn {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing session state
 *
 * Subscribes to auth state changes and provides current session information.
 * Automatically updates when user logs in, logs out, or token refreshes.
 *
 * @example
 * ```typescript
 * function Profile() {
 *   const { user, loading, isAuthenticated } = useSession();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!isAuthenticated) return <div>Please log in</div>;
 *
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      // Get current session
      const currentSession = await authHelpers.getSession();
      setSession(currentSession);

      // Get current user
      const currentUser = await authHelpers.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing session:', error);
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial session
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = authHelpers.onAuthStateChange((event, newSession) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(newSession as Session);
        setUser((newSession as Session)?.user || null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    loading,
    isAuthenticated: !!session && !!user,
    refresh,
  };
}
