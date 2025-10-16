/**
 * Stripe Webhook Event Handlers
 *
 * This module processes individual Stripe webhook events and updates
 * the database accordingly. Each handler is idempotent to handle
 * Stripe's retry mechanism safely.
 *
 * @module lib/billing/webhook-handlers
 */

import type Stripe from 'stripe';
import { getPlanFromPriceId } from './stripe-client';
import {
  createSubscription,
  updateSubscription,
  cancelSubscription,
  upsertSubscription,
} from './subscription-manager';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type { WebhookHandlerResult, CreatePaymentInput } from './types';

// =============================================================================
// SUBSCRIPTION EVENT HANDLERS
// =============================================================================

/**
 * Handle customer.subscription.created event
 *
 * Creates a new subscription record in Supabase when a user subscribes.
 *
 * @param event - Stripe subscription.created event
 * @returns Handler result
 */
export async function handleSubscriptionCreated(
  event: Stripe.CustomerSubscriptionCreatedEvent
): Promise<WebhookHandlerResult> {
  const subscription = event.data.object;

  try {
    // Extract user ID from metadata
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      return {
        success: false,
        message: 'No user_id found in subscription metadata',
      };
    }

    // Get plan info from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const planInfo = getPlanFromPriceId(priceId);

    if (!planInfo) {
      return {
        success: false,
        message: `Unknown price ID: ${priceId}`,
      };
    }

    // Create subscription record
    await upsertSubscription({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      stripe_price_id: priceId,
      plan_name: planInfo.plan,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      currency: subscription.currency,
      interval: planInfo.interval,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    });

    return {
      success: true,
      message: `Subscription created for user ${userId}, plan ${planInfo.plan}`,
    };
  } catch (error) {
    console.error('Error handling subscription.created:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle customer.subscription.updated event
 *
 * Updates subscription record when status, plan, or billing period changes.
 *
 * @param event - Stripe subscription.updated event
 * @returns Handler result
 */
export async function handleSubscriptionUpdated(
  event: Stripe.CustomerSubscriptionUpdatedEvent
): Promise<WebhookHandlerResult> {
  const subscription = event.data.object;

  try {
    // Get plan info from price ID
    const priceId = subscription.items.data[0]?.price.id;
    const planInfo = getPlanFromPriceId(priceId);

    if (!planInfo) {
      return {
        success: false,
        message: `Unknown price ID: ${priceId}`,
      };
    }

    // Update subscription record
    await updateSubscription(subscription.id, {
      plan_name: planInfo.plan,
      status: subscription.status as any,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      amount: subscription.items.data[0]?.price.unit_amount || 0,
      stripe_price_id: priceId,
    });

    return {
      success: true,
      message: `Subscription ${subscription.id} updated`,
    };
  } catch (error) {
    console.error('Error handling subscription.updated:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle customer.subscription.deleted event
 *
 * Marks subscription as canceled when it's deleted in Stripe.
 *
 * @param event - Stripe subscription.deleted event
 * @returns Handler result
 */
export async function handleSubscriptionDeleted(
  event: Stripe.CustomerSubscriptionDeletedEvent
): Promise<WebhookHandlerResult> {
  const subscription = event.data.object;

  try {
    await cancelSubscription(subscription.id);

    return {
      success: true,
      message: `Subscription ${subscription.id} canceled`,
    };
  } catch (error) {
    console.error('Error handling subscription.deleted:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// INVOICE/PAYMENT EVENT HANDLERS
// =============================================================================

/**
 * Handle invoice.payment_succeeded event
 *
 * Records successful payment and updates subscription if needed.
 *
 * @param event - Stripe invoice.payment_succeeded event
 * @returns Handler result
 */
export async function handleInvoicePaymentSucceeded(
  event: Stripe.InvoicePaymentSucceededEvent
): Promise<WebhookHandlerResult> {
  const invoice = event.data.object;
  const supabase = createSupabaseAdminClient();

  try {
    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single();

    if (!subscription) {
      return {
        success: false,
        message: `Subscription not found: ${invoice.subscription}`,
      };
    }

    // Record payment in payments table (if table exists)
    try {
      const paymentData: CreatePaymentInput = {
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method: invoice.payment_intent
          ? ((await supabase
              .from('payments')
              .select('payment_method')
              .eq('stripe_payment_intent_id', invoice.payment_intent as string)
              .single()
              .then((r) => r.data?.payment_method)) as string)
          : null,
      };

      await supabase.from('payments').insert(paymentData);
    } catch (paymentError) {
      console.warn('Failed to record payment (table may not exist):', paymentError);
    }

    // Update subscription status to active if it was past_due
    if (subscription.status === 'past_due') {
      await updateSubscription(subscription.stripe_subscription_id, {
        status: 'active',
      });
    }

    return {
      success: true,
      message: `Payment recorded for subscription ${subscription.stripe_subscription_id}`,
    };
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle invoice.payment_failed event
 *
 * Records failed payment and updates subscription status.
 *
 * @param event - Stripe invoice.payment_failed event
 * @returns Handler result
 */
export async function handleInvoicePaymentFailed(
  event: Stripe.InvoicePaymentFailedEvent
): Promise<WebhookHandlerResult> {
  const invoice = event.data.object;
  const supabase = createSupabaseAdminClient();

  try {
    // Get subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single();

    if (!subscription) {
      return {
        success: false,
        message: `Subscription not found: ${invoice.subscription}`,
      };
    }

    // Record failed payment (if payments table exists)
    try {
      const paymentData: CreatePaymentInput = {
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        stripe_payment_intent_id: invoice.payment_intent as string,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        failure_reason: invoice.last_finalization_error?.message || 'Payment failed',
      };

      await supabase.from('payments').insert(paymentData);
    } catch (paymentError) {
      console.warn('Failed to record payment failure (table may not exist):', paymentError);
    }

    // Update subscription status to past_due
    await updateSubscription(subscription.stripe_subscription_id, {
      status: 'past_due',
    });

    return {
      success: true,
      message: `Payment failure recorded for subscription ${subscription.stripe_subscription_id}`,
    };
  } catch (error) {
    console.error('Error handling invoice.payment_failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// CUSTOMER EVENT HANDLERS
// =============================================================================

/**
 * Handle customer.updated event
 *
 * Updates user record when customer email changes in Stripe.
 *
 * @param event - Stripe customer.updated event
 * @returns Handler result
 */
export async function handleCustomerUpdated(
  event: Stripe.CustomerUpdatedEvent
): Promise<WebhookHandlerResult> {
  const customer = event.data.object;
  const supabase = createSupabaseAdminClient();

  try {
    // Find user by Stripe customer ID
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('stripe_customer_id', customer.id)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: `User not found for customer ${customer.id}`,
      };
    }

    // Update user email if changed
    if (customer.email && customer.email !== user.email) {
      await supabase.from('users').update({ email: customer.email }).eq('id', user.id);

      return {
        success: true,
        message: `User email updated for customer ${customer.id}`,
      };
    }

    return {
      success: true,
      message: `No updates needed for customer ${customer.id}`,
    };
  } catch (error) {
    console.error('Error handling customer.updated:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// WEBHOOK EVENT ROUTER
// =============================================================================

/**
 * Route webhook event to appropriate handler
 *
 * @param event - Stripe event
 * @returns Handler result
 */
export async function routeWebhookEvent(event: Stripe.Event): Promise<WebhookHandlerResult> {
  console.log(`Processing webhook event: ${event.type} (${event.id})`);

  switch (event.type) {
    case 'customer.subscription.created':
      return handleSubscriptionCreated(event as Stripe.CustomerSubscriptionCreatedEvent);

    case 'customer.subscription.updated':
      return handleSubscriptionUpdated(event as Stripe.CustomerSubscriptionUpdatedEvent);

    case 'customer.subscription.deleted':
      return handleSubscriptionDeleted(event as Stripe.CustomerSubscriptionDeletedEvent);

    case 'invoice.payment_succeeded':
      return handleInvoicePaymentSucceeded(event as Stripe.InvoicePaymentSucceededEvent);

    case 'invoice.payment_failed':
      return handleInvoicePaymentFailed(event as Stripe.InvoicePaymentFailedEvent);

    case 'customer.updated':
      return handleCustomerUpdated(event as Stripe.CustomerUpdatedEvent);

    default:
      console.warn(`Unhandled webhook event type: ${event.type}`);
      return {
        success: true,
        message: `Event type ${event.type} not handled (ignored)`,
      };
  }
}
