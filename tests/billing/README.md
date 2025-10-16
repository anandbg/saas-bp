# Billing Tests

This directory contains tests for the Stripe billing integration.

## Test Structure

- **stripe-client.test.ts**: Tests for Stripe client configuration and utilities
- **subscription-manager.test.ts**: Tests for subscription CRUD operations
- **usage-tracker.test.ts**: Tests for usage tracking and limit enforcement
- **webhook-handlers.test.ts**: Tests for webhook event processing
- **checkout.test.ts**: Integration tests for checkout flow
- **portal.test.ts**: Integration tests for customer portal

## Running Tests

```bash
# Run all billing tests
npm run test tests/billing

# Run specific test file
npm run test tests/billing/stripe-client.test.ts

# Run with coverage
npm run test:coverage tests/billing
```

## Testing with Stripe CLI

To test webhooks locally:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
```

## Test Environment Variables

Set these in `.env.test.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_test_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_test_...
STRIPE_PRICE_PRACTICE_MONTHLY=price_test_...
STRIPE_PRICE_PRACTICE_YEARLY=price_test_...
```

## Writing New Tests

Follow these patterns:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mockSupabaseClient } from '../mocks/supabase';
import { createSubscription } from '@/lib/billing/subscription-manager';

describe('Subscription Manager', () => {
  beforeEach(() => {
    // Reset mocks
  });

  it('should create subscription', async () => {
    // Arrange
    const input = { /* ... */ };

    // Act
    const result = await createSubscription(input);

    // Assert
    expect(result.plan_name).toBe('professional');
  });
});
```

## Coverage Goals

- Unit tests: > 90% coverage
- Integration tests: Key flows covered
- E2E tests: Critical user journeys

## Common Test Scenarios

### Subscription Lifecycle
1. User subscribes to plan
2. Subscription becomes active
3. User upgrades plan
4. User cancels subscription
5. Subscription expires

### Payment Scenarios
1. Successful payment
2. Failed payment
3. Payment retry success
4. Payment retry failure
5. Invoice creation

### Usage Tracking
1. Record usage within limit
2. Block usage at limit
3. Reset usage on new period
4. Upgrade increases limit
5. Downgrade reduces limit
