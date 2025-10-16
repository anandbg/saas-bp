/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Creates a session stored in HTTP-only cookies.
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_AUTH=true
 */

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { loginSchema } from '@/lib/auth/validation';
import { handleApiError, errorResponse, successResponse } from '@/lib/auth/api-protection';
import { getUserProfile } from '@/lib/auth/session';
import { withFeatureGate } from '@/lib/api/feature-gate';

export const POST = withFeatureGate('AUTH', async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0].message,
        400,
        'validation_error'
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseServerClient();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Add delay to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Handle specific errors
      if (error.message.includes('Invalid login credentials')) {
        return errorResponse(
          'Invalid email or password',
          401,
          'invalid_credentials'
        );
      }

      if (error.message.includes('Email not confirmed')) {
        return errorResponse(
          'Please verify your email address',
          401,
          'email_not_verified'
        );
      }

      console.error('Login error:', error);
      return errorResponse('Authentication failed', 401, 'auth_failed');
    }

    if (!data.user || !data.session) {
      return errorResponse('Authentication failed', 401, 'auth_failed');
    }

    // Get or create user profile
    const profile = await getUserProfile(data.user.id);

    // Return success response with user data
    return successResponse({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
      },
      session: {
        access_token: data.session.access_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
