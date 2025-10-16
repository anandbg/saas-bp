/**
 * Billing Type Definitions
 *
 * This module contains TypeScript types for Stripe billing integration,
 * including subscription management, usage tracking, and payment processing.
 *
 * @module lib/billing/types
 */

import type Stripe from 'stripe';

// =============================================================================
// STRIPE PRICE IDS
// =============================================================================

/**
 * Stripe Price ID mapping
 * These should match environment variables
 */
export interface StripePriceIds {
  professional_monthly: string;
  professional_yearly: string;
  practice_monthly: string;
  practice_yearly: string;
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

/**
 * Subscription plan names
 */
export type PlanName = 'free' | 'professional' | 'practice' | 'enterprise';

/**
 * Subscription status from Stripe
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'unpaid';

/**
 * Billing interval
 */
export type BillingInterval = 'month' | 'year';

/**
 * Subscription data from database
 */
export interface SubscriptionData {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_name: PlanName;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  amount: number;
  currency: string;
  interval: BillingInterval;
  trial_start: string | null;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Subscription creation input
 */
export interface CreateSubscriptionInput {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  plan_name: PlanName;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  amount: number;
  currency: string;
  interval: BillingInterval;
  trial_start?: Date | null;
  trial_end?: Date | null;
}

/**
 * Subscription update input
 */
export interface UpdateSubscriptionInput {
  plan_name?: PlanName;
  status?: SubscriptionStatus;
  current_period_start?: Date;
  current_period_end?: Date;
  cancel_at_period_end?: boolean;
  canceled_at?: Date | null;
  amount?: number;
  stripe_price_id?: string;
}

// =============================================================================
// USAGE TRACKING TYPES
// =============================================================================

/**
 * Usage type enum
 */
export type UsageType = 'report_generated' | 'transcription' | 'export' | 'api_call';

/**
 * Usage record from database
 */
export interface UsageRecord {
  id: string;
  user_id: string;
  subscription_id: string | null;
  report_id: string | null;
  usage_type: UsageType;
  quantity: number;
  billing_period_start: string;
  billing_period_end: string;
  created_at: string;
}

/**
 * Usage recording input
 */
export interface RecordUsageInput {
  user_id: string;
  usage_type: UsageType;
  subscription_id?: string | null;
  report_id?: string | null;
  quantity?: number;
}

/**
 * Usage statistics for a single type
 */
export interface UsageStats {
  current: number;
  limit: number;
  percentage: number;
  allowed: boolean;
  warningThreshold: boolean; // True if > 80%
}

/**
 * Complete usage response for all types
 */
export interface UsageResponse {
  usage: {
    report_generated: UsageStats;
    transcription: UsageStats;
    export: UsageStats;
  };
  subscription: {
    plan_name: PlanName;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    days_remaining: number;
  };
}

/**
 * Usage limit check result
 */
export interface UsageLimitCheck {
  current: number;
  limit: number;
  isLimitReached: boolean;
  resetDate: Date;
}

// =============================================================================
// PAYMENT TYPES
// =============================================================================

/**
 * Payment status
 */
export type PaymentStatus = 'succeeded' | 'failed' | 'pending' | 'refunded';

/**
 * Payment record
 */
export interface PaymentRecord {
  id: string;
  user_id: string;
  subscription_id: string;
  stripe_payment_intent_id: string;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string | null;
  failure_reason: string | null;
  created_at: string;
}

/**
 * Payment creation input
 */
export interface CreatePaymentInput {
  user_id: string;
  subscription_id: string;
  stripe_payment_intent_id: string;
  stripe_invoice_id?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string | null;
  failure_reason?: string | null;
}

// =============================================================================
// STRIPE API TYPES
// =============================================================================

/**
 * Checkout session creation input
 */
export interface CreateCheckoutSessionInput {
  priceId: string;
  userId: string;
  userEmail: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout session response
 */
export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Customer portal session response
 */
export interface CustomerPortalResponse {
  url: string;
}

/**
 * Stripe customer creation input
 */
export interface CreateStripeCustomerInput {
  email: string;
  userId: string;
  name?: string | null;
}

// =============================================================================
// WEBHOOK TYPES
// =============================================================================

/**
 * Webhook event types we handle
 */
export type WebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.updated';

/**
 * Webhook event handler result
 */
export interface WebhookHandlerResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Webhook processing context
 */
export interface WebhookContext {
  event: Stripe.Event;
  eventType: WebhookEventType;
  eventId: string;
}

// =============================================================================
// SUBSCRIPTION LIMITS TYPES
// =============================================================================

/**
 * Subscription limits from database
 */
export interface SubscriptionLimits {
  id: string;
  plan_name: string;
  reports_per_month: number;
  templates_limit: number | null;
  storage_gb: number | null;
  team_members: number;
  real_time_transcription: boolean;
  priority_support: boolean;
  custom_branding: boolean;
  api_access: boolean;
  slow_brewed_mode: boolean;
  created_at: string;
}

// =============================================================================
// ERROR TYPES
// =============================================================================

/**
 * Billing-specific error
 */
export class BillingError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BillingError';
  }
}

/**
 * Usage limit exceeded error
 */
export class UsageLimitError extends BillingError {
  constructor(usageType: UsageType, current: number, limit: number) {
    super(
      `Usage limit exceeded for ${usageType}: ${current}/${limit}`,
      'usage_limit_exceeded',
      429,
      { usageType, current, limit }
    );
    this.name = 'UsageLimitError';
  }
}

/**
 * Stripe API error wrapper
 */
export class StripeApiError extends BillingError {
  constructor(message: string, originalError: unknown) {
    super(message, 'stripe_api_error', 500, originalError);
    this.name = 'StripeApiError';
  }
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Map Stripe price ID to plan name
 */
export type PriceToPlanMap = Record<string, PlanName>;

/**
 * Price ID validation result
 */
export interface PriceIdValidation {
  isValid: boolean;
  planName?: PlanName;
  interval?: BillingInterval;
}
