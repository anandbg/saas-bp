/**
 * Feature Flags Configuration
 *
 * This system allows toggling features on/off to support:
 * 1. Gradual rollout of new features
 * 2. A/B testing
 * 3. Preserving code for future use (muted features)
 *
 * Usage:
 * ```typescript
 * import { FEATURES, isFeatureEnabled } from '@/lib/config/features';
 *
 * if (FEATURES.DATABASE) {
 *   // Database-dependent code
 * }
 * ```
 */

// Feature flags - read from environment variables
export const FEATURES = {
  // Existing features (currently muted but preserved for future use)
  DATABASE: process.env.NEXT_PUBLIC_ENABLE_DATABASE === 'true',
  AUTH: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
  STRIPE: process.env.NEXT_PUBLIC_ENABLE_STRIPE === 'true',

  // New features (active)
  DIAGRAM_GENERATOR: true, // Always enabled
  FILE_PARSING: true,
  MCP_VALIDATION: false, // Disabled - slows down generation
  AI_GENERATION: true,
  WEB_SEARCH: process.env.PERPLEXITY_API_KEY ? true : false, // Feature 6.0
} as const;

/**
 * Check if a feature is enabled
 * @param feature - The feature to check
 * @returns true if the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof FEATURES): boolean {
  return FEATURES[feature];
}

/**
 * Require a feature to be enabled, throw error if not
 * @param feature - The feature to require
 * @param errorMessage - Custom error message
 */
export function requireFeature(
  feature: keyof typeof FEATURES,
  errorMessage?: string
): void {
  if (!isFeatureEnabled(feature)) {
    throw new Error(
      errorMessage || `Feature "${feature}" is not enabled`
    );
  }
}

/**
 * Get all enabled features
 * @returns Array of enabled feature names
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([name]) => name);
}

/**
 * Get all disabled features
 * @returns Array of disabled feature names
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURES)
    .filter(([_, enabled]) => !enabled)
    .map(([name]) => name);
}

// Type guard for feature names
export type FeatureName = keyof typeof FEATURES;
