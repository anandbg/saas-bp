/**
 * Checkout API Route
 *
 * POST /api/billing/checkout
 * Creates a Stripe Checkout session for subscription purchase
 *
 * FEATURE FLAG: Requires NEXT_PUBLIC_ENABLE_STRIPE=true
 *
 * @module app/api/billing/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError } from '@/lib/auth/api-protection';
import { validatePriceId, createCheckoutSession } from '@/lib/billing';
import { withFeatureGate } from '@/lib/api/feature-gate';
import { z } from 'zod';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const CheckoutRequestSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// =============================================================================
// API HANDLER
// =============================================================================

/**
 * POST /api/billing/checkout
 *
 * Create Stripe Checkout session for subscription purchase
 *
 * @param request - Next.js request
 * @returns Checkout session with redirect URL
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/billing/checkout', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     priceId: 'price_xxx',
 *     successUrl: 'https://app.com/dashboard?success=true',
 *     cancelUrl: 'https://app.com/pricing'
 *   })
 * });
 *
 * const { sessionId, url } = await response.json();
 * // Redirect to url
 * ```
 */
export const POST = withFeatureGate('STRIPE', async (request: NextRequest) => {
  try {
    // 1. Get authenticated user
    const user = getUserFromRequest(request);

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = CheckoutRequestSchema.parse(body);

    // 3. Validate price ID
    const priceValidation = validatePriceId(validatedData.priceId);
    if (!priceValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid price ID',
          code: 'invalid_price_id',
        },
        { status: 400 }
      );
    }

    // 4. Create Stripe Checkout session
    const session = await createCheckoutSession({
      priceId: validatedData.priceId,
      userId: user.id,
      userEmail: user.email,
      successUrl: validatedData.successUrl,
      cancelUrl: validatedData.cancelUrl,
    });

    // 5. Return checkout session
    return NextResponse.json(
      {
        success: true,
        data: session,
      },
      { status: 200 }
    );
  } catch (error) {
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
