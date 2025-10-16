/**
 * useUser Hook
 *
 * Provides access to the current user's profile from the database.
 * Includes profile updates and preferences management.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { useSession } from './useSession';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];
type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

interface UseUserReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for accessing and managing user profile
 *
 * Fetches user profile from database and provides update functionality.
 * Automatically loads profile when user is authenticated.
 *
 * @example
 * ```typescript
 * function ProfileSettings() {
 *   const { profile, loading, updateProfile } = useUser();
 *
 *   const handleSave = async () => {
 *     await updateProfile({ name: 'New Name' });
 *   };
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!profile) return <div>No profile found</div>;
 *
 *   return <div>{profile.name}</div>;
 * }
 * ```
 */
export function useUser(): UseUserReturn {
  const { user, isAuthenticated } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createSupabaseBrowserClient();

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        setError(fetchError.message);
        setProfile(null);
        return;
      }

      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user, isAuthenticated]);

  const updateProfile = useCallback(
    async (updates: UserProfileUpdate) => {
      if (!user || !isAuthenticated) {
        throw new Error('User not authenticated');
      }

      try {
        setLoading(true);
        setError(null);

        const supabase = createSupabaseBrowserClient();

        const { data, error: updateError } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
          throw updateError;
        }

        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update profile');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, isAuthenticated]
  );

  // Load profile when user changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refresh,
  };
}
