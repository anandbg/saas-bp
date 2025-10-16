/**
 * Checkout Button Component
 *
 * Button to initiate Stripe Checkout for subscription purchase
 *
 * @module components/billing/CheckoutButton
 */

'use client';

import React from 'react';
import { useBilling } from '@/hooks/useBilling';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
  successUrl?: string;
  cancelUrl?: string;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * Checkout button that initiates Stripe Checkout session
 *
 * @example
 * ```tsx
 * <CheckoutButton
 *   priceId={STRIPE_PRICE_IDS.professional_monthly}
 *   planName="Professional"
 * >
 *   Subscribe to Professional
 * </CheckoutButton>
 * ```
 */
export function CheckoutButton({
  priceId,
  planName,
  successUrl,
  cancelUrl,
  children,
  className = '',
  disabled = false,
}: CheckoutButtonProps) {
  const { startCheckout, isLoading, error } = useBilling();

  const handleClick = () => {
    void (async () => {
      try {
        await startCheckout({
          priceId,
          successUrl,
          cancelUrl,
        });
      } catch (err) {
        console.error('Checkout error:', err);
      }
    })();
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          disabled || isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } ${className}`}
      >
        {isLoading ? 'Loading...' : children || `Subscribe to ${planName}`}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error.message}</p>}
    </div>
  );
}
