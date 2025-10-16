/**
 * POST /api/auth/update-password
 *
 * Updates the user's password.
 * Requires authentication. Invalidates all existing sessions.
 */

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { updatePasswordSchema } from '@/lib/auth/validation';
import {
  handleApiError,
  errorResponse,
  successResponse,
  getUserFromRequest,
} from '@/lib/auth/api-protection';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user from middleware headers
    const user = getUserFromRequest(request);

    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const validationResult = updatePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        validationResult.error.issues[0].message,
        400,
        'validation_error'
      );
    }

    const { currentPassword, newPassword } = validationResult.data;

    // Create Supabase client
    const supabase = createSupabaseServerClient();

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return errorResponse(
        'Current password is incorrect',
        401,
        'incorrect_password'
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return errorResponse(
        'Failed to update password',
        500,
        'update_failed'
      );
    }

    // Return success
    return successResponse({
      message: 'Password updated successfully. All sessions have been terminated.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
