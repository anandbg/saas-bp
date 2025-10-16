import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Type aliases for convenience
type DbClient = SupabaseClient<Database>;
type User = Database['public']['Tables']['users']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionLimits = Database['public']['Tables']['subscription_limits']['Row'];

/**
 * Database helper functions for common operations
 *
 * These functions:
 * - Provide consistent error handling
 * - Use proper TypeScript types
 * - Handle common edge cases
 * - Can be used with any Supabase client
 */

// =============================================================================
// USER OPERATIONS
// =============================================================================

/**
 * Get user profile by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns User profile data
 * @throws Error if user not found or database error
 *
 * @example
 * ```typescript
 * const profile = await getUserProfile(supabase, 'user-uuid');
 * console.log(profile.email, profile.name);
 * ```
 */
export async function getUserProfile(supabase: DbClient, userId: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  if (!data) {
    throw new Error(`User not found: ${userId}`);
  }

  return data;
}

/**
 * Get user profile by email
 *
 * @param supabase - Supabase client instance
 * @param email - User email address
 * @returns User profile data or null if not found
 *
 * @example
 * ```typescript
 * const profile = await getUserByEmail(supabase, 'user@example.com');
 * if (profile) {
 *   console.log('User exists:', profile.name);
 * }
 * ```
 */
export async function getUserByEmail(supabase: DbClient, email: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }

  return data;
}

/**
 * Update user profile
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param updates - Partial user data to update
 * @returns Updated user profile
 *
 * @example
 * ```typescript
 * const updated = await updateUserProfile(supabase, userId, {
 *   name: 'Dr. Smith',
 *   preferences: { theme: 'dark' }
 * });
 * ```
 */
export async function updateUserProfile(
  supabase: DbClient,
  userId: string,
  updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
}

// =============================================================================
// SUBSCRIPTION OPERATIONS
// =============================================================================

/**
 * Get user's active subscription
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Active subscription or null if none
 *
 * @example
 * ```typescript
 * const subscription = await getActiveSubscription(supabase, userId);
 * if (subscription) {
 *   console.log('Plan:', subscription.plan_name);
 *   console.log('Ends:', subscription.current_period_end);
 * } else {
 *   console.log('User has no active subscription');
 * }
 * ```
 */
export async function getActiveSubscription(
  supabase: DbClient,
  userId: string
): Promise<Subscription | null> {
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
 * Get user's subscription (any status)
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Most recent subscription or null
 */
export async function getUserSubscription(
  supabase: DbClient,
  userId: string
): Promise<Subscription | null> {
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
 * Get subscription limits for a plan
 *
 * @param supabase - Supabase client instance
 * @param planName - Plan name (free, professional, practice, enterprise)
 * @returns Plan limits
 * @throws Error if plan not found
 *
 * @example
 * ```typescript
 * const limits = await getSubscriptionLimits(supabase, 'professional');
 * console.log('Reports per month:', limits.reports_per_month);
 * console.log('Slow-brewed mode:', limits.slow_brewed_mode);
 * ```
 */
export async function getSubscriptionLimits(
  supabase: DbClient,
  planName: string
): Promise<SubscriptionLimits> {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('plan_name', planName)
    .single();

  if (error) {
    throw new Error(`Failed to fetch subscription limits: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Plan not found: ${planName}`);
  }

  return data;
}

/**
 * Get all available plans
 *
 * @param supabase - Supabase client instance
 * @returns Array of all subscription plans
 *
 * @example
 * ```typescript
 * const plans = await getAllPlans(supabase);
 * plans.forEach(plan => {
 *   console.log(`${plan.plan_name}: ${plan.reports_per_month} reports/month`);
 * });
 * ```
 */
export async function getAllPlans(supabase: DbClient): Promise<SubscriptionLimits[]> {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .order('reports_per_month', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch subscription plans: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Count user's usage for current billing period
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param usageType - Type of usage to count
 * @param billingPeriodStart - Start of billing period
 * @param billingPeriodEnd - End of billing period
 * @returns Count of usage records
 *
 * @example
 * ```typescript
 * const count = await getCurrentUsage(
 *   supabase,
 *   userId,
 *   'report_generated',
 *   new Date('2025-01-01'),
 *   new Date('2025-02-01')
 * );
 * console.log('Reports generated this month:', count);
 * ```
 */
export async function getCurrentUsage(
  supabase: DbClient,
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export' | 'api_call',
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<number> {
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

  return count || 0;
}

/**
 * Record usage event
 *
 * Note: This should typically be called with admin client in API routes
 *
 * @param supabase - Supabase client instance (preferably admin)
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @param subscriptionId - Related subscription ID (optional)
 * @param reportId - Related report ID (optional)
 * @param quantity - Quantity to record (default: 1)
 *
 * @example
 * ```typescript
 * // In an API route
 * const adminSupabase = createSupabaseAdminClient();
 * await recordUsage(
 *   adminSupabase,
 *   userId,
 *   'report_generated',
 *   subscriptionId,
 *   reportId
 * );
 * ```
 */
export async function recordUsage(
  supabase: DbClient,
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export' | 'api_call',
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  subscriptionId?: string,
  reportId?: string,
  quantity: number = 1
): Promise<void> {
  const { error } = await supabase.from('usage_records').insert({
    user_id: userId,
    usage_type: usageType,
    subscription_id: subscriptionId,
    report_id: reportId,
    quantity,
    billing_period_start: billingPeriodStart.toISOString(),
    billing_period_end: billingPeriodEnd.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record usage: ${error.message}`);
  }
}

/**
 * Check if user has reached usage limit
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param usageType - Type of usage to check
 * @returns Object with usage info and whether limit is reached
 *
 * @example
 * ```typescript
 * const { current, limit, isLimitReached } = await checkUsageLimit(
 *   supabase,
 *   userId,
 *   'report_generated'
 * );
 *
 * if (isLimitReached) {
 *   throw new Error(`Limit reached: ${current}/${limit} reports used`);
 * }
 * ```
 */
export async function checkUsageLimit(
  supabase: DbClient,
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export' | 'api_call'
): Promise<{
  current: number;
  limit: number;
  isLimitReached: boolean;
  resetDate: Date;
}> {
  // Get active subscription
  const subscription = await getActiveSubscription(supabase, userId);

  if (!subscription) {
    // No subscription = free plan
    const limits = await getSubscriptionLimits(supabase, 'free');
    const current = await getCurrentUsage(
      supabase,
      userId,
      usageType,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First of month
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last of month
    );

    return {
      current,
      limit: usageType === 'report_generated' ? limits.reports_per_month : 0,
      isLimitReached: current >= limits.reports_per_month,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
  }

  // Get plan limits
  const limits = await getSubscriptionLimits(supabase, subscription.plan_name);

  // Count usage in current billing period
  const current = await getCurrentUsage(
    supabase,
    userId,
    usageType,
    new Date(subscription.current_period_start),
    new Date(subscription.current_period_end)
  );

  const limit = usageType === 'report_generated' ? limits.reports_per_month : 0;

  return {
    current,
    limit,
    isLimitReached: current >= limit,
    resetDate: new Date(subscription.current_period_end),
  };
}

// =============================================================================
// TEMPLATE OPERATIONS
// =============================================================================

/**
 * Get user's default template
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Default template or null if none set
 */
export async function getDefaultTemplate(supabase: DbClient, userId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch default template: ${error.message}`);
  }

  return data;
}

/**
 * Get user's templates with optional filters
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param filters - Optional filters (modality, body_part)
 * @returns Array of templates
 */
export async function getUserTemplates(
  supabase: DbClient,
  userId: string,
  filters?: {
    modality?: string;
    body_part?: string;
    tags?: string[];
  }
) {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.modality) {
    query = query.eq('modality', filters.modality);
  }

  if (filters?.body_part) {
    query = query.eq('body_part', filters.body_part);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}
