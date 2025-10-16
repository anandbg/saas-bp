/**
 * GET /api/auth/session
 *
 * Returns the current session information.
 * Used by client components to check authentication status.
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_AUTH=true
 */

import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { getUserProfile } from '@/lib/auth/session';
import { handleApiError, successResponse, errorResponse } from '@/lib/auth/api-protection';
import { withFeatureGate } from '@/lib/api/feature-gate';

export const GET = withFeatureGate('AUTH', async () => {
  try {
    const supabase = createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return errorResponse('No active session', 401, 'no_session');
    }

    // Get user profile
    const profile = await getUserProfile(user.id);

    // Return session data
    return successResponse({
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
      },
      authenticated: true,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
