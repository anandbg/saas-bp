/**
 * Feature Gate Utilities for API Routes
 *
 * Provides utilities to conditionally enable/disable API routes based on feature flags.
 * When a feature is disabled, routes return 404 to indicate they don't exist.
 */

import { NextResponse } from 'next/server';
import { FEATURES } from '@/lib/config/features';

/**
 * Check if a feature is enabled and return 404 response if not
 * @param feature - Feature flag to check
 * @returns NextResponse with 404 if feature disabled, null if enabled
 */
export function checkFeatureEnabled(
  feature: keyof typeof FEATURES
): NextResponse | null {
  if (!FEATURES[feature]) {
    return NextResponse.json(
      {
        success: false,
        error: 'This feature is currently disabled',
        code: 'feature_disabled',
      },
      { status: 404 }
    );
  }
  return null;
}

/**
 * Wrapper to make API routes feature-gated
 * Usage:
 * ```typescript
 * export const POST = withFeatureGate('AUTH', async (request) => {
 *   // Your route logic here
 * });
 * ```
 */
export function withFeatureGate<T extends any[]>(
  feature: keyof typeof FEATURES,
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const featureCheck = checkFeatureEnabled(feature);
    if (featureCheck) {
      return featureCheck;
    }
    return handler(...args);
  };
}

/**
 * Check if authentication feature is enabled
 */
export function isAuthEnabled(): boolean {
  return FEATURES.AUTH;
}

/**
 * Check if billing/Stripe feature is enabled
 */
export function isBillingEnabled(): boolean {
  return FEATURES.STRIPE;
}

/**
 * Check if database feature is enabled
 */
export function isDatabaseEnabled(): boolean {
  return FEATURES.DATABASE;
}
