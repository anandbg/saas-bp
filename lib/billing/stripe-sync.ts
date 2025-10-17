/**
 * Stripe Synchronization Utilities
 *
 * This module handles customer management and synchronization between
 * Stripe and Supabase. It manages customer creation, retrieval, and
 * checkout/portal session generation.
 *
 * @module lib/billing/stripe-sync
 */

import { stripe } from './stripe-client';
import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import type {
  CreateStripeCustomerInput,
  CreateCheckoutSessionInput,
  CheckoutSessionResponse,
  CustomerPortalResponse,
} from './types';

// =============================================================================
// CUSTOMER MANAGEMENT
// =============================================================================

/**
 * Get or create Stripe customer for a user
 *
 * Checks if user has a Stripe customer ID in database.
 * If not, creates a new customer in Stripe and stores the ID.
 *
 * @param input - Customer creation input
 * @returns Stripe customer ID
 *
 * @example
 * ```typescript
 * const customerId = await getOrCreateCustomer({
 *   userId: 'user-uuid',
 *   email: 'user@example.com',
 *   name: 'Dr. Smith'
 * });
 * ```
 */
export async function getOrCreateCustomer(input: CreateStripeCustomerInput): Promise<string> {
  const supabase = createSupabaseAdminClient();

  // Check if user already has a Stripe customer ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', input.userId)
    .single();

  if (userError) {
    throw new Error(`Failed to fetch user: ${userError.message}`);
  }

  // Return existing customer ID if present
  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: input.email,
    name: input.name || undefined,
    metadata: {
      supabase_user_id: input.userId,
    },
  });

  // Store customer ID in database
  await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', input.userId);

  console.log(`Created Stripe customer ${customer.id} for user ${input.userId}`);

  return customer.id;
}

/**
 * Get Stripe customer ID for a user
 *
 * @param userId - User UUID
 * @returns Stripe customer ID or null if not found
 */
export async function getCustomerId(userId: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return user?.stripe_customer_id || null;
}

/**
 * Update customer email in Stripe
 *
 * @param userId - User UUID
 * @param newEmail - New email address
 */
export async function updateCustomerEmail(userId: string, newEmail: string): Promise<void> {
  const customerId = await getCustomerId(userId);

  if (!customerId) {
    console.warn(`No Stripe customer found for user ${userId}, skipping email update`);
    return;
  }

  await stripe.customers.update(customerId, {
    email: newEmail,
  });

  console.log(`Updated email for Stripe customer ${customerId}`);
}

// =============================================================================
// CHECKOUT SESSION
// =============================================================================

/**
 * Create Stripe Checkout session for subscription purchase
 *
 * @param input - Checkout session input
 * @returns Checkout session response with URL
 *
 * @example
 * ```typescript
 * const session = await createCheckoutSession({
 *   priceId: 'price_xxx',
 *   userId: 'user-uuid',
 *   userEmail: 'user@example.com',
 *   successUrl: 'https://app.com/dashboard?success=true',
 *   cancelUrl: 'https://app.com/pricing'
 * });
 *
 * // Redirect user to session.url
 * ```
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSessionResponse> {
  const { priceId, userId, userEmail, successUrl, cancelUrl } = input;

  // Get or create Stripe customer
  const customerId = await getOrCreateCustomer({
    userId,
    email: userEmail,
  });

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      user_id: userId,
    },
    subscription_data: {
      metadata: {
        user_id: userId,
      },
    },
  });

  console.log(`Created checkout session ${session.id} for user ${userId}`);

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

// =============================================================================
// CUSTOMER PORTAL
// =============================================================================

/**
 * Create Stripe Customer Portal session
 *
 * Allows users to manage their subscription, payment methods, and view invoices.
 *
 * @param userId - User UUID
 * @param returnUrl - URL to return to after portal session
 * @returns Customer portal response with URL
 *
 * @example
 * ```typescript
 * const portal = await createCustomerPortalSession(
 *   userId,
 *   'https://app.com/dashboard'
 * );
 *
 * // Redirect user to portal.url
 * ```
 */
export async function createCustomerPortalSession(
  userId: string,
  returnUrl?: string
): Promise<CustomerPortalResponse> {
  // Get customer ID
  const customerId = await getCustomerId(userId);

  if (!customerId) {
    throw new Error('No billing account found. Please subscribe to a plan first.');
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  console.log(`Created portal session for customer ${customerId}`);

  return {
    url: session.url,
  };
}

// =============================================================================
// SUBSCRIPTION OPERATIONS
// =============================================================================

/**
 * Cancel subscription in Stripe
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param cancelImmediately - If true, cancel immediately; otherwise at period end
 */
export async function cancelStripeSubscription(
  stripeSubscriptionId: string,
  cancelImmediately: boolean = false
): Promise<void> {
  if (cancelImmediately) {
    await stripe.subscriptions.cancel(stripeSubscriptionId);
  } else {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  console.log(`Canceled subscription ${stripeSubscriptionId} (immediate: ${cancelImmediately})`);
}

/**
 * Reactivate a canceled subscription
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 */
export async function reactivateSubscription(stripeSubscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  console.log(`Reactivated subscription ${stripeSubscriptionId}`);
}

/**
 * Update subscription to a new price
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @param newPriceId - New Stripe price ID
 */
export async function updateSubscriptionPrice(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await stripe.subscriptions.update(stripeSubscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  console.log(`Updated subscription ${stripeSubscriptionId} to price ${newPriceId}`);
}

// =============================================================================
// INVOICE OPERATIONS
// =============================================================================

/**
 * Get customer's invoices
 *
 * @param customerId - Stripe customer ID
 * @param limit - Maximum number of invoices to retrieve
 * @returns Array of invoices
 */
export async function getCustomerInvoices(customerId: string, limit: number = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data;
}

/**
 * Get upcoming invoice for a customer
 *
 * @param customerId - Stripe customer ID
 * @returns Upcoming invoice or null if none
 */
export async function getUpcomingInvoice(customerId: string) {
  try {
    // Note: Stripe SDK method name may vary by version
    // Using type assertion to handle SDK version differences
    const invoice = await (stripe.invoices as any).retrieveUpcoming({
      customer: customerId,
    });

    return invoice;
  } catch (error) {
    // No upcoming invoice or method not available
    return null;
  }
}

// =============================================================================
// PAYMENT METHOD OPERATIONS
// =============================================================================

/**
 * Get customer's payment methods
 *
 * @param customerId - Stripe customer ID
 * @returns Array of payment methods
 */
export async function getPaymentMethods(customerId: string) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  return paymentMethods.data;
}

/**
 * Get customer's default payment method
 *
 * @param customerId - Stripe customer ID
 * @returns Default payment method or null
 */
export async function getDefaultPaymentMethod(customerId: string) {
  const customer = await stripe.customers.retrieve(customerId);

  if ('deleted' in customer && customer.deleted) {
    return null;
  }

  const defaultPaymentMethodId = customer.invoice_settings?.default_payment_method;

  if (!defaultPaymentMethodId) {
    return null;
  }

  const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId as string);

  return paymentMethod;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if customer exists in Stripe
 *
 * @param customerId - Stripe customer ID
 * @returns True if customer exists
 */
export async function customerExists(customerId: string): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return !('deleted' in customer) || !customer.deleted;
  } catch {
    return false;
  }
}

/**
 * Get subscription from Stripe
 *
 * @param subscriptionId - Stripe subscription ID
 * @returns Stripe subscription object
 */
export async function getStripeSubscription(subscriptionId: string) {
  return stripe.subscriptions.retrieve(subscriptionId);
}
