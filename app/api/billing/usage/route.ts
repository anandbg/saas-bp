/**
 * Usage API Route
 *
 * GET /api/billing/usage
 * Retrieves current usage statistics and limits for authenticated user
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_STRIPE=true
 *
 * @module app/api/billing/usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError } from '@/lib/auth/api-protection';
import { getUserUsageStats, getUsageStats } from '@/lib/billing';
import { withFeatureGate } from '@/lib/api/feature-gate';
import type { UsageType } from '@/lib/billing/types';

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * GET /api/billing/usage
 *
 * Get usage statistics for authenticated user
 *
 * Query parameters:
 * - usageType (optional): Filter by specific usage type (report_generated, transcription, export)
 *
 * @param request - Next.js request
 * @returns Usage statistics
 *
 * @example
 * ```typescript
 * // Get all usage stats
 * const response = await fetch('/api/billing/usage');
 * const data = await response.json();
 * console.log(data.usage.report_generated.current); // Current reports used
 * console.log(data.usage.report_generated.limit);   // Plan limit
 *
 * // Get specific usage type
 * const response = await fetch('/api/billing/usage?usageType=report_generated');
 * ```
 */
export const GET = withFeatureGate('STRIPE', async (request: NextRequest) => {
  try {
    // 1. Get authenticated user
    const user = getUserFromRequest(request);

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const usageType = searchParams.get('usageType') as UsageType | null;

    // 3. Get usage statistics
    if (usageType) {
      // Return specific usage type
      const validUsageTypes: UsageType[] = [
        'report_generated',
        'transcription',
        'export',
        'api_call',
      ];

      if (!validUsageTypes.includes(usageType)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid usage type',
            code: 'invalid_usage_type',
            details: {
              validTypes: validUsageTypes,
            },
          },
          { status: 400 }
        );
      }

      const stats = await getUsageStats(user.id, usageType);

      return NextResponse.json(
        {
          success: true,
          data: {
            usageType,
            stats,
          },
        },
        { status: 200 }
      );
    } else {
      // Return all usage stats
      const usage = await getUserUsageStats(user.id);

      return NextResponse.json(
        {
          success: true,
          data: usage,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
});

/**
 * POST method not allowed
 */
export function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      code: 'method_not_allowed',
    },
    {
      status: 405,
      headers: { Allow: 'GET' },
    }
  );
}
