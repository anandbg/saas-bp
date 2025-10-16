/**
 * POST /api/auth/signup
 *
 * Creates a new user account with email and password.
 * Sends a verification email to the provided address.
 */

import { NextRequest } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { signupSchema } from '@/lib/auth/validation';
import { handleApiError, errorResponse, successResponse } from '@/lib/auth/api-protection';

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const validationResult = signupSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0].message,
        400,
        'validation_error'
      );
    }

    const { email, password, name } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseBrowserClient();

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || null,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return errorResponse('Email already registered', 400, 'email_exists');
      }

      if (error.message.includes('password')) {
        return errorResponse('Password does not meet requirements', 400, 'weak_password');
      }

      console.error('Signup error:', error);
      return errorResponse(error.message, 400, 'signup_error');
    }

    if (!data.user) {
      return errorResponse('Failed to create account', 500, 'signup_failed');
    }

    // Return success response
    return successResponse(
      {
        message: `Verification email sent to ${email}`,
        userId: data.user.id,
        requiresVerification: true,
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
