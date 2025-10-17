/**
 * Usage Tracker
 *
 * This module handles usage tracking and limit enforcement for subscription plans.
 * It records usage events, checks usage limits, and retrieves usage statistics.
 *
 * @module lib/billing/usage-tracker
 */

import { createSupabaseAdminClient } from '@/lib/database/supabase-admin';
import { getSubscriptionLimits } from '@/lib/database/helpers';
import { getActiveSubscription } from './subscription-manager';
import type {
  UsageType,
  RecordUsageInput,
  UsageLimitCheck,
  UsageStats,
  UsageResponse,
} from './types';

// =============================================================================
// USAGE RECORDING
// =============================================================================

/**
 * Record a usage event
 *
 * This should be called after a successful operation (e.g., report generated)
 * to track usage for billing purposes.
 *
 * @param input - Usage recording data
 *
 * @example
 * ```typescript
 * await recordUsage({
 *   user_id: userId,
 *   usage_type: 'report_generated',
 *   report_id: reportId,
 *   quantity: 1
 * });
 * ```
 */
export async function recordUsage(input: RecordUsageInput): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Get user's subscription to determine billing period
  const subscription = await getActiveSubscription(input.user_id);

  let billingPeriodStart: string;
  let billingPeriodEnd: string;
  let subscriptionId: string | null = null;

  if (subscription) {
    // Use subscription billing period
    billingPeriodStart = subscription.current_period_start;
    billingPeriodEnd = subscription.current_period_end;
    subscriptionId = subscription.id;
  } else {
    // Free plan: use calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    billingPeriodStart = startOfMonth.toISOString();
    billingPeriodEnd = endOfMonth.toISOString();
  }

  // Insert usage record
  const { error } = await supabase.from('usage_records').insert({
    user_id: input.user_id,
    usage_type: input.usage_type,
    subscription_id: input.subscription_id || subscriptionId,
    report_id: input.report_id,
    quantity: input.quantity || 1,
    billing_period_start: billingPeriodStart,
    billing_period_end: billingPeriodEnd,
  });

  if (error) {
    throw new Error(`Failed to record usage: ${error.message}`);
  }
}

// =============================================================================
// USAGE LIMIT CHECKING
// =============================================================================

/**
 * Check if user has reached usage limit for a specific type
 *
 * This should be called BEFORE performing an operation to enforce limits.
 * Throws UsageLimitError if limit is reached.
 *
 * @param userId - User UUID
 * @param usageType - Type of usage to check
 * @throws UsageLimitError if limit is reached
 *
 * @example
 * ```typescript
 * try {
 *   await checkUsageLimit(userId, 'report_generated');
 *   // Proceed with report generation
 * } catch (error) {
 *   if (error instanceof UsageLimitError) {
 *     // Show upgrade prompt
 *   }
 * }
 * ```
 */
export async function checkUsageLimit(userId: string, usageType: UsageType): Promise<void> {
  const limitCheck = await getUsageLimitCheck(userId, usageType);

  if (limitCheck.isLimitReached) {
    const UsageLimitError = class extends Error {
      constructor(type: UsageType, current: number, limit: number) {
        super(`Usage limit exceeded for ${type}: ${current}/${limit}`);
        this.name = 'UsageLimitError';
      }
    };
    throw new UsageLimitError(usageType, limitCheck.current, limitCheck.limit);
  }
}

/**
 * Get usage limit check result without throwing
 *
 * @param userId - User UUID
 * @param usageType - Type of usage to check
 * @returns Usage limit check result
 */
export async function getUsageLimitCheck(
  userId: string,
  usageType: UsageType
): Promise<UsageLimitCheck> {
  const supabase = createSupabaseAdminClient();

  // Get user's subscription
  const subscription = await getActiveSubscription(userId);

  let planName = 'free';
  let billingPeriodStart: Date;
  let billingPeriodEnd: Date;

  if (subscription) {
    planName = subscription.plan_name;
    billingPeriodStart = new Date(subscription.current_period_start);
    billingPeriodEnd = new Date(subscription.current_period_end);
  } else {
    // Free plan: use calendar month
    const now = new Date();
    billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  // Get plan limits
  const limits = await getSubscriptionLimits(supabase, planName);

  // Determine limit based on usage type
  let limit: number;
  switch (usageType) {
    case 'report_generated':
      limit = limits.reports_per_month;
      break;
    case 'transcription':
      limit = limits.reports_per_month; // Same limit for now
      break;
    case 'export':
      limit = limits.reports_per_month * 2; // Allow more exports
      break;
    case 'api_call':
      limit = limits.api_access ? 10000 : 0; // 10k API calls for API-enabled plans
      break;
    default:
      limit = 0;
  }

  // Count current usage in billing period
  const { count, error } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('billing_period_start', billingPeriodStart.toISOString())
    .lte('billing_period_end', billingPeriodEnd.toISOString());

  if (error) {
    throw new Error(`Failed to count usage: ${error.message}`);
  }

  const current = count || 0;

  return {
    current,
    limit,
    isLimitReached: current >= limit,
    resetDate: billingPeriodEnd,
  };
}

// =============================================================================
// USAGE STATISTICS
// =============================================================================

/**
 * Get complete usage statistics for a user
 *
 * Returns usage for all tracked types along with subscription info.
 *
 * @param userId - User UUID
 * @returns Complete usage response
 *
 * @example
 * ```typescript
 * const usage = await getUserUsageStats(userId);
 * console.log(`Reports: ${usage.usage.report_generated.current}/${usage.usage.report_generated.limit}`);
 * console.log(`Days remaining: ${usage.subscription.days_remaining}`);
 * ```
 */
export async function getUserUsageStats(userId: string): Promise<UsageResponse> {
  const subscription = await getActiveSubscription(userId);

  const planName = subscription?.plan_name || 'free';
  const status = subscription?.status || 'active';

  let currentPeriodStart: string;
  let currentPeriodEnd: string;
  let daysRemaining: number;

  if (subscription) {
    currentPeriodStart = subscription.current_period_start;
    currentPeriodEnd = subscription.current_period_end;
    const endDate = new Date(currentPeriodEnd);
    const now = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } else {
    // Free plan: use calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    currentPeriodStart = startOfMonth.toISOString();
    currentPeriodEnd = endOfMonth.toISOString();
    daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Get usage for each type
  const reportUsage = await getUsageStats(userId, 'report_generated');
  const transcriptionUsage = await getUsageStats(userId, 'transcription');
  const exportUsage = await getUsageStats(userId, 'export');

  return {
    usage: {
      report_generated: reportUsage,
      transcription: transcriptionUsage,
      export: exportUsage,
    },
    subscription: {
      plan_name: planName,
      status,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      days_remaining: daysRemaining,
    },
  };
}

/**
 * Get usage statistics for a specific usage type
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns Usage statistics
 */
export async function getUsageStats(userId: string, usageType: UsageType): Promise<UsageStats> {
  const limitCheck = await getUsageLimitCheck(userId, usageType);

  const percentage = limitCheck.limit > 0 ? (limitCheck.current / limitCheck.limit) * 100 : 0;
  const warningThreshold = percentage > 80;
  const allowed = !limitCheck.isLimitReached;

  return {
    current: limitCheck.current,
    limit: limitCheck.limit,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
    allowed,
    warningThreshold,
  };
}

// =============================================================================
// USAGE QUERIES
// =============================================================================

/**
 * Get usage count for a specific type in current billing period
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns Current usage count
 */
export async function getCurrentUsageCount(userId: string, usageType: UsageType): Promise<number> {
  const limitCheck = await getUsageLimitCheck(userId, usageType);
  return limitCheck.current;
}

/**
 * Get usage records for a user (with pagination)
 *
 * @param userId - User UUID
 * @param usageType - Optional filter by usage type
 * @param limit - Maximum number of records (default: 50)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of usage records
 */
export async function getUserUsageRecords(
  userId: string,
  usageType?: UsageType,
  limit: number = 50,
  offset: number = 0
) {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (usageType) {
    query = query.eq('usage_type', usageType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch usage records: ${error.message}`);
  }

  return data || [];
}

/**
 * Check if user can perform an action based on usage limits
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns True if allowed, false if limit reached
 */
export async function canPerformAction(userId: string, usageType: UsageType): Promise<boolean> {
  try {
    await checkUsageLimit(userId, usageType);
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'UsageLimitError') {
      return false;
    }
    throw error; // Re-throw other errors
  }
}

// =============================================================================
// USAGE UTILITIES
// =============================================================================

/**
 * Get usage percentage for a specific type
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns Usage percentage (0-100)
 */
export async function getUsagePercentage(userId: string, usageType: UsageType): Promise<number> {
  const stats = await getUsageStats(userId, usageType);
  return stats.percentage;
}

/**
 * Check if usage is approaching limit (> 80%)
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns True if usage > 80%
 */
export async function isApproachingLimit(userId: string, usageType: UsageType): Promise<boolean> {
  const stats = await getUsageStats(userId, usageType);
  return stats.warningThreshold;
}

/**
 * Get remaining usage for a specific type
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @returns Remaining usage count
 */
export async function getRemainingUsage(userId: string, usageType: UsageType): Promise<number> {
  const limitCheck = await getUsageLimitCheck(userId, usageType);
  return Math.max(0, limitCheck.limit - limitCheck.current);
}
