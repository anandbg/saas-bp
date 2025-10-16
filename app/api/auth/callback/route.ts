/**
 * GET /api/auth/callback
 *
 * OAuth callback handler for Google and GitHub authentication.
 * Exchanges authorization code for session tokens and creates user profile.
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_AUTH=true
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { syncAuthUser } from '@/lib/auth/session';
import { withFeatureGate } from '@/lib/api/feature-gate';

export const GET = withFeatureGate('AUTH', async (request: NextRequest) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', error);
    loginUrl.searchParams.set('message', errorDescription || 'Authentication failed');
    return NextResponse.redirect(loginUrl);
  }

  // Check for authorization code
  if (!code) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'missing_code');
    loginUrl.searchParams.set('message', 'Authorization code not provided');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createSupabaseServerClient();

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'exchange_failed');
      loginUrl.searchParams.set('message', 'Failed to complete authentication');
      return NextResponse.redirect(loginUrl);
    }

    if (!data.user || !data.session) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'no_session');
      loginUrl.searchParams.set('message', 'Failed to create session');
      return NextResponse.redirect(loginUrl);
    }

    // Sync user profile to database
    try {
      // Type assertion is safe here because we've verified the user exists above
      await syncAuthUser(data.user as unknown as import('@/lib/auth/session').AuthUser);
    } catch (syncError) {
      console.error('Failed to sync user profile:', syncError);
      // Don't fail the authentication, just log the error
      // The profile will be created on first access to protected routes
    }

    // Redirect to dashboard
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('Callback error:', error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'callback_error');
    loginUrl.searchParams.set('message', 'An unexpected error occurred');
    return NextResponse.redirect(loginUrl);
  }
});
