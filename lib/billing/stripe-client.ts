/**
 * Stripe Client Configuration
 *
 * This module initializes the Stripe SDK with proper configuration
 * and provides price ID mappings for subscription plans.
 *
 * @module lib/billing/stripe-client
 */

import Stripe from 'stripe';
import { FEATURES } from '@/lib/config/features';
import type { StripePriceIds, PlanName, BillingInterval, PriceIdValidation } from './types';

// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// =============================================================================

/**
 * Validate required Stripe environment variables at module load time
 * This ensures the app fails fast if configuration is missing
 */
function validateStripeConfig(): void {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
    'STRIPE_PRICE_PROFESSIONAL_YEARLY',
    'STRIPE_PRICE_PRACTICE_MONTHLY',
    'STRIPE_PRICE_PRACTICE_YEARLY',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Stripe environment variables: ${missing.join(', ')}\n` +
        'Please check your .env.local file and ensure all Stripe configuration is present.'
    );
  }

  // Validate format (basic check)
  const secretKey = process.env.STRIPE_SECRET_KEY!;
  if (!secretKey.startsWith('sk_')) {
    throw new Error(
      'Invalid STRIPE_SECRET_KEY format. Expected key to start with "sk_".\n' +
        'Make sure you are using the secret key, not the publishable key.'
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  if (!webhookSecret.startsWith('whsec_')) {
    throw new Error(
      'Invalid STRIPE_WEBHOOK_SECRET format. Expected key to start with "whsec_".\n' +
        'Make sure you copied the webhook signing secret correctly from Stripe Dashboard.'
    );
  }
}

// Validate configuration on module load (only if STRIPE feature is enabled)
if (FEATURES.STRIPE) {
  validateStripeConfig();
}

// =============================================================================
// STRIPE CLIENT INITIALIZATION
// =============================================================================

/**
 * Stripe client instance
 * Configured with secret key and latest API version
 * Returns a dummy client when STRIPE feature is disabled
 */
export const stripe = FEATURES.STRIPE
  ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
      appInfo: {
        name: 'Radiology Reporting App',
        version: '1.0.0',
      },
    })
  : ({} as Stripe); // Dummy client when feature is disabled

// =============================================================================
// PRICE ID MAPPING
// =============================================================================

/**
 * Stripe price IDs from environment variables
 * These should be set after creating products in Stripe Dashboard
 * Uses dummy values when STRIPE feature is disabled
 */
export const STRIPE_PRICE_IDS: StripePriceIds = FEATURES.STRIPE
  ? {
      professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
      professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!,
      practice_monthly: process.env.STRIPE_PRICE_PRACTICE_MONTHLY!,
      practice_yearly: process.env.STRIPE_PRICE_PRACTICE_YEARLY!,
    }
  : {
      professional_monthly: 'price_dummy',
      professional_yearly: 'price_dummy',
      practice_monthly: 'price_dummy',
      practice_yearly: 'price_dummy',
    };

/**
 * Map Stripe price IDs to plan names
 * Used in webhook processing to determine which plan was purchased
 */
const PRICE_TO_PLAN_MAP: Record<string, { plan: PlanName; interval: BillingInterval }> = {
  [STRIPE_PRICE_IDS.professional_monthly]: {
    plan: 'professional',
    interval: 'month',
  },
  [STRIPE_PRICE_IDS.professional_yearly]: {
    plan: 'professional',
    interval: 'year',
  },
  [STRIPE_PRICE_IDS.practice_monthly]: {
    plan: 'practice',
    interval: 'month',
  },
  [STRIPE_PRICE_IDS.practice_yearly]: {
    plan: 'practice',
    interval: 'year',
  },
};

/**
 * Get plan name and interval from Stripe price ID
 *
 * @param priceId - Stripe price ID
 * @returns Plan name and billing interval, or null if not found
 *
 * @example
 * ```typescript
 * const result = getPlanFromPriceId('price_xxx');
 * if (result) {
 *   console.log(`Plan: ${result.plan}, Interval: ${result.interval}`);
 * }
 * ```
 */
export function getPlanFromPriceId(
  priceId: string
): { plan: PlanName; interval: BillingInterval } | null {
  return PRICE_TO_PLAN_MAP[priceId] || null;
}

/**
 * Validate if a price ID is valid and get associated plan info
 *
 * @param priceId - Stripe price ID to validate
 * @returns Validation result with plan info if valid
 *
 * @example
 * ```typescript
 * const validation = validatePriceId(priceId);
 * if (!validation.isValid) {
 *   throw new Error('Invalid price ID');
 * }
 * console.log(`Valid plan: ${validation.planName}`);
 * ```
 */
export function validatePriceId(priceId: string): PriceIdValidation {
  const planInfo = getPlanFromPriceId(priceId);

  if (!planInfo) {
    return { isValid: false };
  }

  return {
    isValid: true,
    planName: planInfo.plan,
    interval: planInfo.interval,
  };
}

/**
 * Get price ID for a specific plan and interval
 *
 * @param planName - Plan name (professional or practice)
 * @param interval - Billing interval (month or year)
 * @returns Stripe price ID
 * @throws Error if plan/interval combination is invalid
 *
 * @example
 * ```typescript
 * const priceId = getPriceIdForPlan('professional', 'month');
 * // Returns: price_xxx (professional monthly price ID)
 * ```
 */
export function getPriceIdForPlan(planName: PlanName, interval: BillingInterval): string {
  if (planName === 'free') {
    throw new Error('Free plan does not have a Stripe price ID');
  }

  if (planName === 'enterprise') {
    throw new Error('Enterprise plan requires custom pricing - contact sales');
  }

  const key = `${planName}_${interval}` as keyof StripePriceIds;
  const priceId = STRIPE_PRICE_IDS[key];

  if (!priceId) {
    throw new Error(`No price ID configured for ${planName} (${interval})`);
  }

  return priceId;
}

/**
 * Get all available price IDs for a plan
 *
 * @param planName - Plan name
 * @returns Object with monthly and yearly price IDs
 * @throws Error if plan doesn't support Stripe billing
 *
 * @example
 * ```typescript
 * const prices = getAvailablePricesForPlan('professional');
 * console.log('Monthly:', prices.monthly);
 * console.log('Yearly:', prices.yearly);
 * ```
 */
export function getAvailablePricesForPlan(planName: PlanName): {
  monthly: string;
  yearly: string;
} {
  if (planName === 'free' || planName === 'enterprise') {
    throw new Error(`Plan ${planName} does not support direct Stripe billing`);
  }

  return {
    monthly: STRIPE_PRICE_IDS[`${planName}_monthly`],
    yearly: STRIPE_PRICE_IDS[`${planName}_yearly`],
  };
}

// =============================================================================
// WEBHOOK CONFIGURATION
// =============================================================================

/**
 * Webhook signing secret from environment
 * Used to verify webhook signatures
 * Uses dummy value when STRIPE feature is disabled
 */
export const STRIPE_WEBHOOK_SECRET = FEATURES.STRIPE
  ? process.env.STRIPE_WEBHOOK_SECRET!
  : 'whsec_dummy';

/**
 * Verify webhook signature
 *
 * @param payload - Raw webhook payload (as string or Buffer)
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 * @throws Error if signature verification fails
 *
 * @example
 * ```typescript
 * const event = verifyWebhookSignature(rawBody, signature);
 * console.log('Verified event:', event.type);
 * ```
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  try {
    return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
    throw new Error('Webhook signature verification failed');
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if Stripe is properly configured
 *
 * @returns True if Stripe is configured, false otherwise
 *
 * @example
 * ```typescript
 * if (!isStripeConfigured()) {
 *   console.warn('Stripe is not configured');
 * }
 * ```
 */
export function isStripeConfigured(): boolean {
  try {
    validateStripeConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Stripe publishable key for client-side use
 *
 * @returns Stripe publishable key
 * @throws Error if key is not configured
 *
 * @example
 * ```typescript
 * const publishableKey = getPublishableKey();
 * // Use in client-side Stripe.js initialization
 * ```
 */
export function getPublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured in environment variables'
    );
  }

  if (!key.startsWith('pk_')) {
    throw new Error(
      'Invalid NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY format. Expected key to start with "pk_"'
    );
  }

  return key;
}

/**
 * Log Stripe client information (for debugging)
 * Should only be used in development
 */
export function logStripeConfig(): void {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Do not log Stripe configuration in production');
    return;
  }

  console.log('🔧 Stripe Configuration:');
  console.log('  API Version:', '2025-09-30.clover');
  console.log('  Secret Key:', process.env.STRIPE_SECRET_KEY?.slice(0, 10) + '...');
  console.log('  Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 15) + '...');
  console.log('  Price IDs:', {
    professional_monthly: STRIPE_PRICE_IDS.professional_monthly.slice(0, 15) + '...',
    professional_yearly: STRIPE_PRICE_IDS.professional_yearly.slice(0, 15) + '...',
    practice_monthly: STRIPE_PRICE_IDS.practice_monthly.slice(0, 15) + '...',
    practice_yearly: STRIPE_PRICE_IDS.practice_yearly.slice(0, 15) + '...',
  });
}
