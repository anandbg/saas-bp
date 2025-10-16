/**
 * Stripe Webhook Handler
 *
 * POST /api/webhooks/stripe
 * Handles Stripe webhook events and syncs data with Supabase
 *
 * IMPORTANT: This endpoint does NOT require authentication
 * Security is provided by webhook signature verification
 *
 * @module app/api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, routeWebhookEvent } from '@/lib/billing';
import type Stripe from 'stripe';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Disable body parsing to get raw request body for signature verification
 * This is critical for webhook signature validation
 */
export const runtime = 'nodejs';

// =============================================================================
// WEBHOOK HANDLER
// =============================================================================

/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events
 *
 * Supported events:
 * - customer.subscription.created: New subscription
 * - customer.subscription.updated: Subscription changed (plan, status, period)
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Payment successful
 * - invoice.payment_failed: Payment failed
 * - customer.updated: Customer info changed
 *
 * @param request - Next.js request with raw Stripe event
 * @returns Success response or error
 *
 * @example
 * ```bash
 * # Test with Stripe CLI
 * stripe listen --forward-to localhost:3000/api/webhooks/stripe
 * stripe trigger customer.subscription.created
 * ```
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Webhook error: Missing stripe-signature header');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing stripe-signature header',
          code: 'missing_signature',
        },
        { status: 400 }
      );
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signature',
          code: 'invalid_signature',
        },
        { status: 400 }
      );
    }

    // 3. Log event receipt
    console.log(`📨 Webhook received: ${event.type} (ID: ${event.id})`);

    // 4. Route event to appropriate handler
    const result = await routeWebhookEvent(event);

    // 5. Log processing result
    const duration = Date.now() - startTime;
    if (result.success) {
      // eslint-disable-next-line no-console
      console.log(`✅ Webhook processed successfully in ${duration}ms: ${result.message}`);
    } else {
      // eslint-disable-next-line no-console
      console.error(`❌ Webhook processing failed in ${duration}ms: ${result.message}`);

      // Return 500 to trigger Stripe retry
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: 'processing_failed',
        },
        { status: 500 }
      );
    }

    // 6. Return success response
    return NextResponse.json(
      {
        received: true,
        eventId: event.id,
        eventType: event.type,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    // Catch any unexpected errors
    console.error('❌ Unexpected webhook error:', error);

    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'internal_error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET method not allowed
 * Webhooks only accept POST requests
 */
export function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Webhooks only accept POST requests.',
      code: 'method_not_allowed',
      hint: 'Configure this URL in Stripe Dashboard: https://dashboard.stripe.com/webhooks',
    },
    {
      status: 405,
      headers: { Allow: 'POST' },
    }
  );
}

/**
 * Handle other HTTP methods
 */
export async function PUT() {
  return GET();
}

export async function PATCH() {
  return GET();
}

export async function DELETE() {
  return GET();
}
