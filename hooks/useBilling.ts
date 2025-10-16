/**
 * useBilling Hook
 *
 * React hook for Stripe billing operations (checkout, portal)
 *
 * @module hooks/useBilling
 */

'use client';

import { useState } from 'react';

interface CheckoutOptions {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

interface PortalResponse {
  url: string;
}

export function useBilling() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Create Stripe Checkout session and redirect
   */
  const startCheckout = async (options: CheckoutOptions): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data: { data: CheckoutResponse } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = data.data.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Open Stripe Customer Portal
   */
  const openPortal = async (returnUrl?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }

      const data: { data: PortalResponse } = await response.json();

      // Redirect to Stripe Portal
      window.location.href = data.data.url;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsLoading(false);
      throw error;
    }
  };

  return {
    startCheckout,
    openPortal,
    isLoading,
    error,
  };
}
