/**
 * useSubscription Hook
 *
 * React hook for fetching and managing subscription data
 *
 * @module hooks/useSubscription
 */

'use client';

import { useState, useEffect } from 'react';
import type { SubscriptionData } from '@/lib/billing/types';

interface SubscriptionState {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage subscription state
 *
 * Note: This is a simple implementation. In production, consider using
 * SWR or React Query for better caching and revalidation.
 *
 * @returns Subscription state and refetch function
 *
 * @example
 * ```typescript
 * function SubscriptionCard() {
 *   const { subscription, isLoading, error, refetch } = useSubscription();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (!subscription) return <FreePlanBanner />;
 *
 *   return (
 *     <div>
 *       <h3>{subscription.plan_name}</h3>
 *       <p>Status: {subscription.status}</p>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSubscription(): SubscriptionState {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/user/subscription');

      if (!response.ok) {
        if (response.status === 404) {
          // No subscription (free plan)
          setSubscription(null);
          return;
        }

        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    isLoading,
    error,
    refetch: fetchSubscription,
  };
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(planName: string): string {
  const names: Record<string, string> = {
    free: 'Free',
    professional: 'Professional',
    practice: 'Practice',
    enterprise: 'Enterprise',
  };

  return names[planName] || planName;
}

/**
 * Get subscription status display
 */
export function getStatusDisplay(status: string): {
  label: string;
  color: 'green' | 'yellow' | 'red' | 'gray';
} {
  switch (status) {
    case 'active':
      return { label: 'Active', color: 'green' };
    case 'trialing':
      return { label: 'Trial', color: 'green' };
    case 'past_due':
      return { label: 'Past Due', color: 'red' };
    case 'canceled':
      return { label: 'Canceled', color: 'gray' };
    case 'incomplete':
      return { label: 'Incomplete', color: 'yellow' };
    default:
      return { label: status, color: 'gray' };
  }
}
