/**
 * Server-Side Session Management Utilities
 *
 * This module provides utilities for managing user sessions in Server Components.
 * Uses Supabase Auth with cookie-based sessions.
 *
 * IMPORTANT: These functions should only be used in Server Components, API routes,
 * or server actions. For client-side auth, use the auth helpers in helpers.ts.
 */

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/database/supabase-server';
import { Database } from '@/types/database';
import { cache } from 'react';

/**
 * User object shape from Supabase Auth
 */
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  app_metadata: {
    provider: 'email' | 'google' | 'github';
    providers: string[];
  };
  user_metadata: {
    name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

/**
 * User profile from database
 */
export type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * Get the current session from Server Components
 *
 * This function is cached using React's cache() to avoid multiple
 * calls within the same request.
 *
 * @returns Session object or null if not authenticated
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const session = await getServerSession();
 *   if (!session) {
 *     redirect('/login');
 *   }
 *   return <div>Welcome {session.user.email}</div>;
 * }
 * ```
 */
export const getServerSession = cache(async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
});

/**
 * Get the current authenticated user from Server Components
 *
 * SECURITY NOTE: This validates the JWT token with Supabase server,
 * ensuring the token hasn't been tampered with. This is MORE secure
 * than getSession() which only reads the JWT without validation.
 *
 * This function is cached using React's cache() to avoid multiple
 * calls within the same request.
 *
 * @returns User object or null if not authenticated
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const user = await getServerUser();
 *   if (!user) {
 *     redirect('/login');
 *   }
 *   return <div>Email: {user.email}</div>;
 * }
 * ```
 */
export const getServerUser = cache(async () => {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
});

/**
 * Require authentication in Server Components
 *
 * Throws an error if user is not authenticated. Use this at the top
 * of Server Components that require authentication.
 *
 * @throws {AuthenticationError} If user is not authenticated
 *
 * @example
 * ```typescript
 * export default async function ProtectedPage() {
 *   const user = await requireAuth();
 *   // User is guaranteed to be authenticated here
 *   return <div>Hello {user.email}</div>;
 * }
 * ```
 */
export async function requireAuth(): Promise<NonNullable<Awaited<ReturnType<typeof getServerUser>>>> {
  const user = await getServerUser();

  if (!user) {
    throw new AuthenticationError('Authentication required');
  }

  return user;
}

/**
 * Get or create user profile from database
 *
 * This function syncs the auth.users table with public.users table.
 * If the user doesn't exist in public.users, it creates a profile.
 *
 * @param userId - User ID from auth.users
 * @returns User profile from database
 *
 * @example
 * ```typescript
 * const user = await requireAuth();
 * const profile = await getUserProfile(user.id);
 * console.log(profile.name, profile.avatar_url);
 * ```
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabase = createSupabaseServerClient();

  // Try to get existing profile
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  // If profile exists, return it
  if (profile && !fetchError) {
    return profile;
  }

  // If profile doesn't exist, we need to create it
  // Get user info from auth
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Failed to get user information');
  }

  // Create profile with user info from auth
  const { data: newProfile, error: createError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: user.email!,
      name: user.user_metadata.name || null,
      avatar_url: user.user_metadata.avatar_url || null,
      preferences: {},
    })
    .select()
    .single();

  if (createError || !newProfile) {
    console.error('Failed to create user profile:', createError);
    throw new Error('Failed to create user profile');
  }

  return newProfile;
}

/**
 * Sync auth user to database (used after OAuth login)
 *
 * This creates or updates the user profile in public.users table
 * based on data from auth.users.
 *
 * Should be called after successful OAuth authentication to ensure
 * the user profile exists in the database.
 *
 * @param authUser - User object from Supabase Auth
 * @returns Updated user profile
 *
 * @example
 * ```typescript
 * // In OAuth callback handler
 * const { data: { user } } = await supabase.auth.getUser();
 * if (user) {
 *   await syncAuthUser(user);
 * }
 * ```
 */
export async function syncAuthUser(authUser: AuthUser): Promise<UserProfile> {
  const adminSupabase = createSupabaseAdminClient();

  // Check if user exists
  const { data: existingUser } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (existingUser) {
    // Update existing user with latest OAuth data
    const { data: updatedUser, error } = await adminSupabase
      .from('users')
      .update({
        email: authUser.email,
        name: authUser.user_metadata.name || existingUser.name,
        avatar_url: authUser.user_metadata.avatar_url || existingUser.avatar_url,
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }

    return updatedUser;
  }

  // Create new user profile
  const { data: newUser, error } = await adminSupabase
    .from('users')
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata.name || null,
      avatar_url: authUser.user_metadata.avatar_url || null,
      preferences: {},
    })
    .select()
    .single();

  if (error || !newUser) {
    console.error('Failed to create user profile:', error);
    throw new Error('Failed to create user profile');
  }

  return newUser;
}

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Check if user has verified their email
 *
 * @param user - User object from Supabase Auth
 * @returns True if email is verified
 */
export function isEmailVerified(user: AuthUser): boolean {
  return user.email_confirmed_at !== null;
}

/**
 * Get OAuth provider from user metadata
 *
 * @param user - User object from Supabase Auth
 * @returns OAuth provider name or 'email' if email/password
 */
export function getAuthProvider(user: AuthUser): string {
  return user.app_metadata.provider || 'email';
}
