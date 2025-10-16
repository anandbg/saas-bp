/**
 * POST /api/auth/logout
 *
 * Signs out the current user and terminates the session.
 * Clears all auth cookies and revokes the refresh token.
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_AUTH=true
 */

import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { handleApiError, successResponse } from '@/lib/auth/api-protection';
import { withFeatureGate } from '@/lib/api/feature-gate';

export const POST = withFeatureGate('AUTH', async () => {
  try {
    const supabase = createSupabaseServerClient();

    // Sign out user (revokes refresh token)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we'll still clear cookies on client side
    }

    // Return success response
    return successResponse({
      message: 'Logged out successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
});
