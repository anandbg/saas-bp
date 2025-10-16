/**
 * Subscription Manager
 *
 * This module handles all subscription CRUD operations in Supabase.
 * It provides functions to create, update, retrieve, and manage subscriptions
 * synced from Stripe.
 *
 * @module lib/billing/subscription-manager
 */

import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type {
  SubscriptionData,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  PlanName,
  BillingError,
} from './types';

// =============================================================================
// SUBSCRIPTION RETRIEVAL
// =============================================================================

/**
 * Get user's active subscription
 *
 * @param userId - User UUID
 * @returns Active subscription or null if none
 *
 * @example
 * ```typescript
 * const subscription = await getActiveSubscription(userId);
 * if (subscription) {
 *   console.log('User has active subscription:', subscription.plan_name);
 * }
 * ```
 */
export async function getActiveSubscription(userId: string): Promise<SubscriptionData | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch active subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get subscription by Stripe subscription ID
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @returns Subscription or null if not found
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<SubscriptionData | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch subscription by Stripe ID: ${error.message}`);
  }

  return data;
}

/**
 * Get user's most recent subscription (any status)
 *
 * @param userId - User UUID
 * @returns Most recent subscription or null
 */
export async function getUserSubscription(userId: string): Promise<SubscriptionData | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get all subscriptions for a user (with pagination)
 *
 * @param userId - User UUID
 * @param limit - Maximum number of results (default: 10)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of subscriptions
 */
export async function getUserSubscriptions(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<SubscriptionData[]> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(`Failed to fetch user subscriptions: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// SUBSCRIPTION CREATION
// =============================================================================

/**
 * Create a new subscription record in Supabase
 * Called when Stripe webhook receives subscription.created event
 *
 * @param input - Subscription creation data
 * @returns Created subscription
 *
 * @example
 * ```typescript
 * const subscription = await createSubscription({
 *   user_id: 'user-uuid',
 *   stripe_subscription_id: 'sub_xxx',
 *   stripe_customer_id: 'cus_xxx',
 *   stripe_price_id: 'price_xxx',
 *   plan_name: 'professional',
 *   status: 'active',
 *   current_period_start: new Date(),
 *   current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
 *   amount: 2900,
 *   currency: 'usd',
 *   interval: 'month',
 * });
 * ```
 */
export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<SubscriptionData> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: input.user_id,
      stripe_subscription_id: input.stripe_subscription_id,
      stripe_customer_id: input.stripe_customer_id,
      stripe_price_id: input.stripe_price_id,
      plan_name: input.plan_name,
      status: input.status,
      current_period_start: input.current_period_start.toISOString(),
      current_period_end: input.current_period_end.toISOString(),
      amount: input.amount,
      currency: input.currency,
      interval: input.interval,
      trial_start: input.trial_start?.toISOString() || null,
      trial_end: input.trial_end?.toISOString() || null,
      cancel_at_period_end: false,
      canceled_at: null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create subscription: ${error.message}`);
  }

  return data;
}

// =============================================================================
// SUBSCRIPTION UPDATES
// =============================================================================

/**
 * Update an existing subscription
 * Called when Stripe webhook receives subscription.updated event
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param updates - Fields to update
 * @returns Updated subscription
 *
 * @example
 * ```typescript
 * const updated = await updateSubscription('sub_xxx', {
 *   status: 'active',
 *   current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
 * });
 * ```
 */
export async function updateSubscription(
  stripeSubscriptionId: string,
  updates: UpdateSubscriptionInput
): Promise<SubscriptionData> {
  const supabase = createSupabaseAdminClient();

  // Convert Date objects to ISO strings
  const updateData: Record<string, unknown> = { ...updates };
  if (updates.current_period_start) {
    updateData.current_period_start = updates.current_period_start.toISOString();
  }
  if (updates.current_period_end) {
    updateData.current_period_end = updates.current_period_end.toISOString();
  }
  if (updates.canceled_at) {
    updateData.canceled_at = updates.canceled_at.toISOString();
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Subscription not found: ${stripeSubscriptionId}`);
  }

  return data;
}

/**
 * Upsert subscription (create or update)
 * Useful for idempotent webhook processing
 *
 * @param input - Subscription data
 * @returns Upserted subscription
 */
export async function upsertSubscription(
  input: CreateSubscriptionInput
): Promise<SubscriptionData> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: input.user_id,
        stripe_subscription_id: input.stripe_subscription_id,
        stripe_customer_id: input.stripe_customer_id,
        stripe_price_id: input.stripe_price_id,
        plan_name: input.plan_name,
        status: input.status,
        current_period_start: input.current_period_start.toISOString(),
        current_period_end: input.current_period_end.toISOString(),
        amount: input.amount,
        currency: input.currency,
        interval: input.interval,
        trial_start: input.trial_start?.toISOString() || null,
        trial_end: input.trial_end?.toISOString() || null,
        cancel_at_period_end: false,
      },
      {
        onConflict: 'stripe_subscription_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert subscription: ${error.message}`);
  }

  return data;
}

// =============================================================================
// SUBSCRIPTION CANCELLATION
// =============================================================================

/**
 * Mark subscription as canceled
 * Called when Stripe webhook receives subscription.deleted event
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @returns Updated subscription
 */
export async function cancelSubscription(stripeSubscriptionId: string): Promise<SubscriptionData> {
  return updateSubscription(stripeSubscriptionId, {
    status: 'canceled',
    canceled_at: new Date(),
  });
}

/**
 * Mark subscription for cancellation at period end
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @returns Updated subscription
 */
export async function cancelSubscriptionAtPeriodEnd(
  stripeSubscriptionId: string
): Promise<SubscriptionData> {
  return updateSubscription(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

// =============================================================================
// SUBSCRIPTION QUERIES
// =============================================================================

/**
 * Check if user has an active paid subscription
 *
 * @param userId - User UUID
 * @returns True if user has active paid subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  return subscription !== null && subscription.plan_name !== 'free';
}

/**
 * Get user's current plan name
 * Returns 'free' if no active subscription
 *
 * @param userId - User UUID
 * @returns Current plan name
 */
export async function getUserPlanName(userId: string): Promise<PlanName> {
  const subscription = await getActiveSubscription(userId);
  return subscription?.plan_name || 'free';
}

/**
 * Check if subscription is in good standing
 * (active or trialing, not past_due or canceled)
 *
 * @param subscription - Subscription data
 * @returns True if subscription is in good standing
 */
export function isSubscriptionActive(subscription: SubscriptionData): boolean {
  return subscription.status === 'active' || subscription.status === 'trialing';
}

/**
 * Get days until subscription renewal or expiry
 *
 * @param subscription - Subscription data
 * @returns Days remaining
 */
export function getDaysUntilRenewal(subscription: SubscriptionData): number {
  const endDate = new Date(subscription.current_period_end);
  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Check if subscription error is due to non-existent subscription
 *
 * @param error - Error object
 * @returns True if error indicates no subscription found
 */
export function isSubscriptionNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('not found') || error.message.includes('No subscription');
  }
  return false;
}
