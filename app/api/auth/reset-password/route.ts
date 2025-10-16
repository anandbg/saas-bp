/**
 * POST /api/auth/reset-password
 *
 * Requests a password reset email for the given address.
 * Always returns success to prevent email enumeration attacks.
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_AUTH=true
 */

import { NextRequest } from 'next/server';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { resetPasswordSchema } from '@/lib/auth/validation';
import { errorResponse, successResponse } from '@/lib/auth/api-protection';
import { withFeatureGate } from '@/lib/api/feature-gate';

export const POST = withFeatureGate('AUTH', async (request: NextRequest) => {
  try {
    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const validationResult = resetPasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0].message,
        400,
        'validation_error'
      );
    }

    const { email } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseBrowserClient();

    // Request password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`,
    });

    // Always return success to prevent email enumeration
    // Even if there's an error, don't expose it to the client
    if (error) {
      console.error('Password reset error:', error);
    }

    return successResponse({
      message: 'If that email exists, we sent a password reset link',
    });
  } catch (error) {
    // Still return success for unexpected errors
    console.error('Unexpected password reset error:', error);
    return successResponse({
      message: 'If that email exists, we sent a password reset link',
    });
  }
});
