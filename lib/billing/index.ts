/**
 * Billing Module Exports
 *
 * Central export file for all billing-related functionality.
 * This provides a clean API for importing billing utilities.
 *
 * @module lib/billing
 */

// Type definitions
export type * from './types';

// Stripe client and configuration
export {
  stripe,
  STRIPE_PRICE_IDS,
  STRIPE_WEBHOOK_SECRET,
  getPlanFromPriceId,
  validatePriceId,
  getPriceIdForPlan,
  getAvailablePricesForPlan,
  verifyWebhookSignature,
  isStripeConfigured,
  getPublishableKey,
  logStripeConfig,
} from './stripe-client';

// Subscription management
export {
  getActiveSubscription,
  getSubscriptionByStripeId,
  getUserSubscription,
  getUserSubscriptions,
  createSubscription,
  updateSubscription,
  upsertSubscription,
  cancelSubscription,
  cancelSubscriptionAtPeriodEnd,
  hasActiveSubscription,
  getUserPlanName,
  isSubscriptionActive,
  getDaysUntilRenewal,
  isSubscriptionNotFoundError,
} from './subscription-manager';

// Usage tracking
export {
  recordUsage,
  checkUsageLimit,
  getUsageLimitCheck,
  getUserUsageStats,
  getUsageStats,
  getCurrentUsageCount,
  getUserUsageRecords,
  canPerformAction,
  getUsagePercentage,
  isApproachingLimit,
  getRemainingUsage,
} from './usage-tracker';

// Webhook handlers
export {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleCustomerUpdated,
  routeWebhookEvent,
} from './webhook-handlers';

// Stripe synchronization
export {
  getOrCreateCustomer,
  getCustomerId,
  updateCustomerEmail,
  createCheckoutSession,
  createCustomerPortalSession,
  cancelStripeSubscription,
  reactivateSubscription,
  updateSubscriptionPrice,
  getCustomerInvoices,
  getUpcomingInvoice,
  getPaymentMethods,
  getDefaultPaymentMethod,
  customerExists,
  getStripeSubscription,
} from './stripe-sync';
