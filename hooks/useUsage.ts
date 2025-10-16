/**
 * useUsage Hook
 *
 * React hook for fetching and monitoring usage statistics
 *
 * @module hooks/useUsage
 */

'use client';

import { useState, useEffect } from 'react';
import type { UsageResponse, UsageStats } from '@/lib/billing/types';

interface UsageState {
  usage: UsageResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to manage usage statistics
 *
 * @param autoRefresh - Automatically refetch every N milliseconds (default: disabled)
 * @returns Usage state and refetch function
 *
 * @example
 * ```typescript
 * function UsageCard() {
 *   const { usage, isLoading, error, refetch } = useUsage();
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   if (!usage) return null;
 *
 *   const reports = usage.usage.report_generated;
 *
 *   return (
 *     <div>
 *       <h3>Reports Used</h3>
 *       <p>{reports.current} / {reports.limit}</p>
 *       <ProgressBar value={reports.percentage} />
 *       {reports.warningThreshold && (
 *         <Warning>Approaching limit!</Warning>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUsage(autoRefresh?: number): UsageState {
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/billing/usage');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch usage');
      }

      const data = await response.json();
      setUsage(data.data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setUsage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();

    // Set up auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchUsage, autoRefresh);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  return {
    usage,
    isLoading,
    error,
    refetch: fetchUsage,
  };
}

/**
 * Get usage color based on percentage
 */
export function getUsageColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage >= 90) return 'red';
  if (percentage >= 80) return 'yellow';
  return 'green';
}

/**
 * Format usage display
 */
export function formatUsageDisplay(stats: UsageStats): string {
  return `${stats.current} / ${stats.limit}`;
}

/**
 * Check if usage is approaching limit
 */
export function isApproachingLimit(stats: UsageStats): boolean {
  return stats.warningThreshold;
}

/**
 * Check if usage limit is reached
 */
export function isLimitReached(stats: UsageStats): boolean {
  return !stats.allowed;
}

/**
 * Get remaining usage
 */
export function getRemainingUsage(stats: UsageStats): number {
  return Math.max(0, stats.limit - stats.current);
}
