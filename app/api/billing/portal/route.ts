/**
 * Customer Portal API Route
 *
 * POST /api/billing/portal
 * Creates a Stripe Customer Portal session for subscription management
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_STRIPE=true
 *
 * @module app/api/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError } from '@/lib/auth/api-protection';
import { createCustomerPortalSession } from '@/lib/billing';
import { withFeatureGate } from '@/lib/api/feature-gate';
import { z } from 'zod';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const PortalRequestSchema = z.object({
  returnUrl: z.string().url().optional(),
});

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * POST /api/billing/portal
 *
 * Create Stripe Customer Portal session
 *
 * Allows users to:
 * - Update payment methods
 * - View invoices and payment history
 * - Cancel or modify subscriptions
 * - Update billing information
 *
 * @param request - Next.js request
 * @returns Portal session with redirect URL
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/billing/portal', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     returnUrl: 'https://app.com/dashboard'
 *   })
 * });
 *
 * const { url } = await response.json();
 * // Redirect to url
 * ```
 */
export const POST = withFeatureGate('STRIPE', async (request: NextRequest) => {
  try {
    // 1. Get authenticated user
    const user = getUserFromRequest(request);

    // 2. Parse and validate request body (optional returnUrl)
    let returnUrl: string | undefined;
    try {
      const body = await request.json();
      const validatedData = PortalRequestSchema.parse(body);
      returnUrl = validatedData.returnUrl;
    } catch {
      // Empty body is fine, returnUrl is optional
      returnUrl = undefined;
    }

    // 3. Create Stripe Customer Portal session
    const portal = await createCustomerPortalSession(user.id, returnUrl);

    // 4. Return portal URL
    return NextResponse.json(
      {
        success: true,
        data: portal,
      },
      { status: 200 }
    );
  } catch (error) {
    // Handle specific error: no billing account
    if (error instanceof Error && error.message.includes('No billing account')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No billing account found. Please subscribe to a plan first.',
          code: 'no_billing_account',
        },
        { status: 404 }
      );
    }

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          code: 'validation_error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return handleApiError(error);
  }
});

/**
 * GET method not allowed
 */
export function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed',
      code: 'method_not_allowed',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    }
  );
}
