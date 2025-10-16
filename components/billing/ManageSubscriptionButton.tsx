/**
 * Manage Subscription Button Component
 *
 * Button to open Stripe Customer Portal for subscription management
 *
 * @module components/billing/ManageSubscriptionButton
 */

'use client';

import React from 'react';
import { useBilling } from '@/hooks/useBilling';

interface ManageSubscriptionButtonProps {
  returnUrl?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Button to open Stripe Customer Portal
 *
 * Allows users to:
 * - Update payment methods
 * - View invoices
 * - Cancel subscription
 * - Update billing information
 *
 * @example
 * ```tsx
 * <ManageSubscriptionButton>
 *   Manage Subscription
 * </ManageSubscriptionButton>
 * ```
 */
export function ManageSubscriptionButton({
  returnUrl,
  children,
  className = '',
}: ManageSubscriptionButtonProps) {
  const { openPortal, isLoading, error } = useBilling();

  const handleClick = () => {
    void (async () => {
      try {
        await openPortal(returnUrl);
      } catch (err) {
        console.error('Portal error:', err);
      }
    })();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
        } ${className}`}
      >
        {isLoading ? 'Loading...' : children || 'Manage Subscription'}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
