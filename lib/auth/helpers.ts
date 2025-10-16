/**
 * Client-Side Authentication Helpers
 *
 * This module provides client-side utilities for authentication operations.
 * These functions use the browser Supabase client and should be used in
 * Client Components (with 'use client' directive).
 *
 * For server-side auth operations, use session.ts instead.
 */

import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import type { OAuthProvider } from './validation';

/**
 * Sign up a new user with email and password
 *
 * This creates a new account in Supabase Auth and sends a verification email.
 * The user must verify their email before they can log in.
 *
 * @param email - User's email address
 * @param password - User's password (must meet complexity requirements)
 * @param name - Optional display name
 * @returns Promise with user data or error
 *
 * @example
 * ```typescript
 * const result = await signUp('user@example.com', 'SecurePass123!', 'John Doe');
 * if (result.error) {
 *   console.error('Signup failed:', result.error.message);
 * } else {
 *   console.log('Check your email for verification link');
 * }
 * ```
 */
export async function signUp(email: string, password: string, name?: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || null,
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
}

/**
 * Sign in a user with email and password
 *
 * This authenticates the user and creates a session. The session is
 * stored in HTTP-only cookies automatically by Supabase.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise with session data or error
 *
 * @example
 * ```typescript
 * const result = await signIn('user@example.com', 'SecurePass123!');
 * if (result.error) {
 *   console.error('Login failed:', result.error.message);
 * } else {
 *   // Redirect to dashboard
 *   window.location.href = '/dashboard';
 * }
 * ```
 */
export async function signIn(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

/**
 * Sign out the current user
 *
 * This terminates the user's session and clears all auth cookies.
 * The refresh token is revoked on the server.
 *
 * @returns Promise with success or error
 *
 * @example
 * ```typescript
 * const result = await signOut();
 * if (!result.error) {
 *   // Redirect to login page
 *   window.location.href = '/login';
 * }
 * ```
 */
export async function signOut() {
  const supabase = createSupabaseBrowserClient();

  const { error } = await supabase.auth.signOut();

  return { error };
}

/**
 * Sign in with OAuth provider (Google or GitHub)
 *
 * This initiates the OAuth flow by redirecting to the provider's
 * consent screen. After approval, the user is redirected back to
 * /auth/callback with an authorization code.
 *
 * @param provider - OAuth provider ('google' or 'github')
 * @returns Promise with redirect URL or error
 *
 * @example
 * ```typescript
 * const result = await signInWithOAuth('google');
 * if (result.error) {
 *   console.error('OAuth failed:', result.error.message);
 * } else {
 *   // Browser will redirect to OAuth provider
 * }
 * ```
 */
export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  return { data, error };
}

/**
 * Request a password reset email
 *
 * Sends a password reset link to the user's email address. The link
 * contains a token that expires after 1 hour.
 *
 * @param email - User's email address
 * @returns Promise with success or error
 *
 * @example
 * ```typescript
 * const result = await resetPassword('user@example.com');
 * if (!result.error) {
 *   console.log('Check your email for reset link');
 * }
 * ```
 */
export async function resetPassword(email: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  return { data, error };
}

/**
 * Update user's password
 *
 * This updates the password and invalidates all existing sessions.
 * The user must be authenticated to call this function.
 *
 * @param newPassword - New password (must meet complexity requirements)
 * @returns Promise with user data or error
 *
 * @example
 * ```typescript
 * const result = await updatePassword('NewSecurePass123!');
 * if (result.error) {
 *   console.error('Password update failed:', result.error.message);
 * } else {
 *   console.log('Password updated successfully');
 * }
 * ```
 */
export async function updatePassword(newPassword: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { data, error };
}

/**
 * Get current session
 *
 * This reads the session from local storage. For server-side
 * validation, use getServerSession() from session.ts instead.
 *
 * @returns Promise with session data or null
 *
 * @example
 * ```typescript
 * const session = await getSession();
 * if (session) {
 *   console.log('User is logged in:', session.user.email);
 * }
 * ```
 */
export async function getSession() {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return session;
}

/**
 * Get current user
 *
 * This validates the session token with Supabase server. More secure
 * than getSession() for client-side validation.
 *
 * @returns Promise with user data or null
 *
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Authenticated as:', user.email);
 * }
 * ```
 */
export async function getCurrentUser() {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return user;
}

/**
 * Resend verification email
 *
 * Useful when user didn't receive the initial verification email
 * or the link expired.
 *
 * @param email - User's email address
 * @returns Promise with success or error
 *
 * @example
 * ```typescript
 * const result = await resendVerificationEmail('user@example.com');
 * if (!result.error) {
 *   console.log('Verification email sent');
 * }
 * ```
 */
export async function resendVerificationEmail(email: string) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  return { data, error };
}

/**
 * Update user profile metadata
 *
 * Updates user_metadata in auth.users. This is separate from the
 * public.users table and should be used for auth-specific metadata only.
 *
 * @param updates - Metadata to update
 * @returns Promise with user data or error
 *
 * @example
 * ```typescript
 * const result = await updateUserMetadata({
 *   name: 'John Doe',
 *   avatar_url: 'https://example.com/avatar.jpg'
 * });
 * ```
 */
export async function updateUserMetadata(updates: Record<string, unknown>) {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.auth.updateUser({
    data: updates,
  });

  return { data, error };
}

/**
 * Subscribe to auth state changes
 *
 * Listen for authentication events like sign in, sign out, token refresh, etc.
 * Returns an unsubscribe function.
 *
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 *
 * @example
 * ```typescript
 * const unsubscribe = onAuthStateChange((event, session) => {
 *   console.log('Auth event:', event);
 *   if (event === 'SIGNED_IN') {
 *     console.log('User signed in:', session?.user.email);
 *   }
 * });
 *
 * // Later, to stop listening:
 * unsubscribe();
 * ```
 */
export function onAuthStateChange(
  callback: (event: string, session: unknown) => void
): () => void {
  const supabase = createSupabaseBrowserClient();

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => {
    subscription.unsubscribe();
  };
}
