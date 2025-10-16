/**
 * Stripe Client Tests
 *
 * Unit tests for Stripe client configuration and utilities
 *
 * @module tests/billing/stripe-client.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  getPlanFromPriceId,
  validatePriceId,
  getPriceIdForPlan,
  isStripeConfigured,
} from '@/lib/billing/stripe-client';

describe('Stripe Client', () => {
  beforeAll(() => {
    // Note: Set test environment variables in .env.test.local
    // See tests/billing/README.md for details
  });

  describe('getPlanFromPriceId', () => {
    it('should return plan info for valid professional monthly price', () => {
      const result = getPlanFromPriceId('price_professional_monthly_mock');
      expect(result).toEqual({
        plan: 'professional',
        interval: 'month',
      });
    });

    it('should return plan info for valid practice yearly price', () => {
      const result = getPlanFromPriceId('price_practice_yearly_mock');
      expect(result).toEqual({
        plan: 'practice',
        interval: 'year',
      });
    });

    it('should return null for invalid price ID', () => {
      const result = getPlanFromPriceId('price_invalid');
      expect(result).toBeNull();
    });
  });

  describe('validatePriceId', () => {
    it('should validate correct price ID', () => {
      const result = validatePriceId('price_professional_monthly_mock');
      expect(result.isValid).toBe(true);
      expect(result.planName).toBe('professional');
      expect(result.interval).toBe('month');
    });

    it('should reject invalid price ID', () => {
      const result = validatePriceId('price_invalid');
      expect(result.isValid).toBe(false);
      expect(result.planName).toBeUndefined();
    });
  });

  describe('getPriceIdForPlan', () => {
    it('should return price ID for professional monthly', () => {
      const priceId = getPriceIdForPlan('professional', 'month');
      expect(priceId).toBe('price_professional_monthly_mock');
    });

    it('should return price ID for practice yearly', () => {
      const priceId = getPriceIdForPlan('practice', 'year');
      expect(priceId).toBe('price_practice_yearly_mock');
    });

    it('should throw error for free plan', () => {
      expect(() => getPriceIdForPlan('free', 'month')).toThrow(
        'Free plan does not have a Stripe price ID'
      );
    });

    it('should throw error for enterprise plan', () => {
      expect(() => getPriceIdForPlan('enterprise', 'month')).toThrow(
        'Enterprise plan requires custom pricing'
      );
    });
  });

  describe('isStripeConfigured', () => {
    it('should return true when configured', () => {
      expect(isStripeConfigured()).toBe(true);
    });
  });
});
