# Feature 1.5 - Stripe Integration Setup - Technical Design

**Feature ID**: 1.5
**Feature Name**: Stripe Integration Setup
**Phase**: Phase 1 - Foundation
**Status**: Design Complete
**Version**: 1.0
**Date**: 2025-01-16

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Implementation Plan](#implementation-plan)
4. [Component Specifications](#component-specifications)
5. [Stripe Product Configuration](#stripe-product-configuration)
6. [Database Integration](#database-integration)
7. [Security Implementation](#security-implementation)
8. [Usage Tracking Implementation](#usage-tracking-implementation)
9. [Testing Strategy](#testing-strategy)
10. [Environment Configuration](#environment-configuration)
11. [Error Handling](#error-handling)
12. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

### Overview

This design document provides complete technical specifications for implementing Stripe billing integration in the Radiology Reporting App. It builds upon the existing Supabase authentication (Feature 1.4) and database schema (Feature 1.3) to enable subscription management, usage tracking, and payment processing.

### Key Architectural Decisions

1. **Stripe-Only Billing**: Direct Stripe integration (no third-party billing middleware)
2. **Supabase Auth Integration**: Leverage existing authentication system from Feature 1.4
3. **Database-First Design**: Use existing subscription tables from Feature 1.3
4. **Webhook-Driven Sync**: Stripe webhooks maintain data consistency
5. **Client-Side Checkout**: Use Stripe Checkout for PCI compliance
6. **Server-Side Enforcement**: All usage limits enforced server-side

### Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Setup | 2 hours | Stripe client, environment config, type definitions |
| Phase 2: Checkout & Portal | 2 hours | Checkout session API, portal API, customer management |
| Phase 3: Webhooks | 3 hours | Webhook handler, event processors, idempotency |
| Phase 4: Usage Tracking | 2 hours | Usage recording, limit checking, usage API |
| Phase 5: Testing | 2 hours | Unit tests, integration tests, E2E tests |
| **Total** | **11 hours** | Complete Stripe integration |

### Success Criteria

- ✅ All 6 webhook events processed successfully
- ✅ Checkout flow completes end-to-end
- ✅ Usage limits enforced in real-time
- ✅ Customer Portal accessible to subscribers
- ✅ Webhook processing > 99% success rate
- ✅ All tests passing with > 80% coverage

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER BROWSER                              │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Components                                          │ │
│  │  • SubscriptionPlans (plan selection)                      │ │
│  │  • CheckoutButton (initiate checkout)                      │ │
│  │  • SubscriptionStatus (current plan display)              │ │
│  │  • UsageDisplay (usage metrics)                            │ │
│  │  • ManageSubscriptionButton (portal access)               │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              │ HTTPS API Requests
                              │ (Authenticated via Supabase)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (Vercel)                          │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  API Routes (app/api/billing/)                             │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ POST /api/billing/checkout                           │  │ │
│  │  │ • Validate user authentication                       │  │ │
│  │  │ • Get/create Stripe customer                         │  │ │
│  │  │ • Create checkout session                            │  │ │
│  │  │ • Return redirect URL                                │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ POST /api/billing/portal                             │  │ │
│  │  │ • Validate user authentication                       │  │ │
│  │  │ • Retrieve Stripe customer ID                        │  │ │
│  │  │ • Create portal session                              │  │ │
│  │  │ • Return portal URL                                  │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ GET /api/billing/usage                               │  │ │
│  │  │ • Validate user authentication                       │  │ │
│  │  │ • Retrieve subscription & limits                     │  │ │
│  │  │ • Count usage in current period                      │  │ │
│  │  │ • Return usage statistics                            │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ POST /api/webhooks/stripe (NO AUTH)                  │  │ │
│  │  │ • Verify webhook signature                           │  │ │
│  │  │ • Route event to handler                             │  │ │
│  │  │ • Process event idempotently                         │  │ │
│  │  │ • Return 200 OK                                      │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Business Logic (lib/billing/)                             │ │
│  │  • stripe-client.ts (Stripe SDK instance)                  │ │
│  │  • subscription-manager.ts (CRUD operations)               │ │
│  │  • usage-tracker.ts (usage recording/checking)             │ │
│  │  • webhook-handlers.ts (event processors)                  │ │
│  │  • stripe-sync.ts (Stripe ↔ Supabase sync)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└────┬──────────────────────┬──────────────────────┬─────────────┘
     │                      │                      │
     │                      │                      │
     ▼                      ▼                      ▼
┌──────────┐         ┌───────────┐         ┌──────────────┐
│ Supabase │         │  Stripe   │         │   Stripe     │
│ Database │◄────────│   API     │────────►│  Webhooks    │
│          │         │           │         │              │
│ Tables:  │         │ Services: │         │ Events:      │
│ • users  │         │ • Customer│         │ • sub.create │
│ • subs   │         │ • Checkout│         │ • sub.update │
│ • usage  │         │ • Portal  │         │ • sub.delete │
│ • limits │         │ • Webhooks│         │ • inv.paid   │
│ • payments│        │           │         │ • inv.failed │
└──────────┘         └───────────┘         └──────────────┘
```

### Data Flow Diagrams

#### Flow 1: Subscription Purchase

```
User                  Next.js API              Stripe                Database
 │                         │                     │                      │
 │ 1. Click "Subscribe"    │                     │                      │
 ├────────────────────────►│                     │                      │
 │                         │ 2. Get/Create       │                      │
 │                         │    Customer         │                      │
 │                         ├────────────────────►│                      │
 │                         │◄────────────────────┤                      │
 │                         │    customer_id      │                      │
 │                         │                     │                      │
 │                         │ 3. Save customer_id │                      │
 │                         ├─────────────────────┼─────────────────────►│
 │                         │                     │                      │
 │                         │ 4. Create Checkout  │                      │
 │                         │    Session          │                      │
 │                         ├────────────────────►│                      │
 │                         │◄────────────────────┤                      │
 │                         │    session_url      │                      │
 │◄────────────────────────┤                     │                      │
 │ 5. Redirect URL         │                     │                      │
 │                         │                     │                      │
 │ 6. Complete Payment     │                     │                      │
 ├─────────────────────────┼────────────────────►│                      │
 │                         │                     │                      │
 │                         │    7. Webhook:      │                      │
 │                         │       sub.created   │                      │
 │                         │◄────────────────────┤                      │
 │                         │                     │                      │
 │                         │ 8. Insert           │                      │
 │                         │    Subscription     │                      │
 │                         ├─────────────────────┼─────────────────────►│
 │                         │                     │                      │
 │ 9. Redirect Success URL │                     │                      │
 │◄────────────────────────┤                     │                      │
```

#### Flow 2: Usage Tracking & Limit Enforcement

```
User                  API Route               Usage Tracker         Database
 │                         │                         │                   │
 │ 1. Generate Report      │                         │                   │
 ├────────────────────────►│                         │                   │
 │                         │ 2. Check Usage Limit    │                   │
 │                         ├────────────────────────►│                   │
 │                         │                         │ 3. Get            │
 │                         │                         │    Subscription   │
 │                         │                         ├──────────────────►│
 │                         │                         │◄──────────────────┤
 │                         │                         │    subscription   │
 │                         │                         │                   │
 │                         │                         │ 4. Count Usage    │
 │                         │                         │    in Period      │
 │                         │                         ├──────────────────►│
 │                         │                         │◄──────────────────┤
 │                         │                         │    count=45       │
 │                         │                         │                   │
 │                         │◄────────────────────────┤                   │
 │                         │    allowed=true         │                   │
 │                         │    (45 < 100)           │                   │
 │                         │                         │                   │
 │                         │ 5. Generate Report      │                   │
 │                         │    [business logic]     │                   │
 │                         │                         │                   │
 │                         │ 6. Record Usage         │                   │
 │                         ├────────────────────────►│                   │
 │                         │                         │ 7. Insert Usage   │
 │                         │                         │    Record         │
 │                         │                         ├──────────────────►│
 │                         │                         │                   │
 │◄────────────────────────┤                         │                   │
 │ 8. Report + Usage       │                         │                   │
```

#### Flow 3: Subscription Lifecycle via Webhooks

```
Stripe                 Webhook Handler         Event Processor      Database
 │                           │                       │                   │
 │ 1. subscription.created   │                       │                   │
 ├──────────────────────────►│                       │                   │
 │                           │ 2. Verify Signature   │                   │
 │                           │    ✓ Valid            │                   │
 │                           │                       │                   │
 │                           │ 3. Route Event        │                   │
 │                           ├──────────────────────►│                   │
 │                           │                       │ 4. Insert Sub     │
 │                           │                       ├──────────────────►│
 │◄──────────────────────────┤                       │                   │
 │ 5. 200 OK                 │                       │                   │
 │                           │                       │                   │
 │ 6. subscription.updated   │                       │                   │
 ├──────────────────────────►│                       │                   │
 │                           │ 7. Verify Signature   │                   │
 │                           │                       │                   │
 │                           │ 8. Route Event        │                   │
 │                           ├──────────────────────►│                   │
 │                           │                       │ 9. Update Sub     │
 │                           │                       ├──────────────────►│
 │◄──────────────────────────┤                       │                   │
 │ 10. 200 OK                │                       │                   │
 │                           │                       │                   │
 │ 11. invoice.payment_succeeded                     │                   │
 ├──────────────────────────►│                       │                   │
 │                           │ 12. Verify Signature  │                   │
 │                           │                       │                   │
 │                           │ 13. Route Event       │                   │
 │                           ├──────────────────────►│                   │
 │                           │                       │ 14. Record        │
 │                           │                       │     Payment       │
 │                           │                       ├──────────────────►│
 │                           │                       │ 15. Update        │
 │                           │                       │     Period        │
 │                           │                       ├──────────────────►│
 │◄──────────────────────────┤                       │                   │
 │ 16. 200 OK                │                       │                   │
```

### Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Layer (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ Subscription    │  │  Usage           │  │  Checkout      │ │
│  │ Plans Component │  │  Display         │  │  Button        │ │
│  └────────┬────────┘  └─────────┬────────┘  └───────┬────────┘ │
│           │                     │                    │          │
│           └─────────────┬───────┴────────────────────┘          │
│                         │                                        │
│                         │ Uses Hooks                             │
│                         ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React Hooks (hooks/)                                    │   │
│  │  • useSubscription() - Get/manage subscription           │   │
│  │  • useUsage() - Track usage and limits                   │   │
│  │  • useBilling() - Checkout/portal actions                │   │
│  └────────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  │ API Calls
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  /checkout   │  │  /portal     │  │  /usage      │          │
│  │  route.ts    │  │  route.ts    │  │  route.ts    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┼──────────────────┘                   │
│                           │                                      │
│                           │ Calls Business Logic                 │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Business Logic (lib/billing/)                           │   │
│  │  • subscription-manager.ts                               │   │
│  │  • usage-tracker.ts                                      │   │
│  │  • stripe-client.ts                                      │   │
│  └────────────────────────────┬─────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────┘
                                  │
                                  │ Database Queries
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Layer (Supabase)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Subscriptions│  │ Usage Records│  │ Subscription │          │
│  │ Table        │  │ Table        │  │ Limits Table │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Subscription State Diagram

```
                    ┌──────────────┐
                    │  New User    │
                    │  (No Sub)    │
                    └──────┬───────┘
                           │
                           │ Purchase
                           ▼
                    ┌──────────────┐
             ┌─────►│   Trialing   │
             │      │  (Optional)  │
             │      └──────┬───────┘
             │             │
             │             │ Trial Ends
             │             ▼
             │      ┌──────────────┐      Payment Fails
             │      │    Active    │◄──────────────────┐
             │      │              │                   │
             │      └──────┬───────┘                   │
             │             │                           │
             │             │ User Cancels         ┌────┴──────┐
             │             ▼                      │ Past Due  │
             │      ┌──────────────┐              │           │
             │      │Cancel Pending│              └────┬──────┘
             │      │(Active until │                   │
             │      │ period end)  │                   │ Retry Success
             │      └──────┬───────┘                   │
             │             │                           │
             │             │ Period Ends               │
             │             ▼                           │
             │      ┌──────────────┐                   │
             └──────│   Canceled   │◄──────────────────┘
                    │              │      Max Retries
                    └──────────────┘
                           │
                           │ Resubscribe
                           │
                           ▼
                    ┌──────────────┐
                    │   Active     │
                    │   (New)      │
                    └──────────────┘
```

---

## Implementation Plan

### File Structure

```
radiology-ai-app/
├── app/
│   └── api/
│       ├── billing/
│       │   ├── checkout/
│       │   │   └── route.ts          # NEW: Checkout session creation
│       │   ├── portal/
│       │   │   └── route.ts          # NEW: Customer portal session
│       │   └── usage/
│       │       └── route.ts          # NEW: Usage retrieval API
│       └── webhooks/
│           └── stripe/
│               └── route.ts          # NEW: Webhook handler
│
├── lib/
│   └── billing/
│       ├── stripe-client.ts          # NEW: Stripe SDK instance
│       ├── subscription-manager.ts   # NEW: Subscription CRUD
│       ├── usage-tracker.ts          # NEW: Usage tracking
│       ├── webhook-handlers.ts       # NEW: Event processors
│       ├── stripe-sync.ts            # NEW: Stripe ↔ Supabase sync
│       └── types.ts                  # NEW: Billing type definitions
│
├── hooks/
│   ├── useSubscription.ts            # NEW: Subscription hook
│   ├── useUsage.ts                   # NEW: Usage tracking hook
│   └── useBilling.ts                 # NEW: Billing operations hook
│
├── components/
│   └── billing/
│       ├── SubscriptionPlans.tsx     # NEW: Plan selection UI
│       ├── CheckoutButton.tsx        # NEW: Checkout trigger
│       ├── SubscriptionStatus.tsx    # NEW: Subscription display
│       ├── UsageDisplay.tsx          # NEW: Usage metrics
│       └── ManageSubscriptionButton.tsx  # NEW: Portal button
│
└── tests/
    └── billing/
        ├── stripe-client.test.ts     # NEW: Client tests
        ├── checkout.test.ts          # NEW: Checkout tests
        ├── webhooks.test.ts          # NEW: Webhook tests
        ├── usage-tracker.test.ts     # NEW: Usage tests
        └── e2e/
            └── subscription-flow.test.ts  # NEW: E2E tests
```

### Implementation Sequence

#### Phase 1: Foundation Setup (2 hours)

1. **Install Dependencies**
   ```bash
   npm install stripe@14.12.0 --save
   npm install @stripe/stripe-js@2.4.0 --save
   ```

2. **Create Type Definitions** (`lib/billing/types.ts`)
3. **Create Stripe Client** (`lib/billing/stripe-client.ts`)
4. **Configure Environment Variables**
5. **Create Products in Stripe Dashboard**

#### Phase 2: API Routes (2 hours)

1. **Checkout Route** (`app/api/billing/checkout/route.ts`)
2. **Portal Route** (`app/api/billing/portal/route.ts`)
3. **Usage Route** (`app/api/billing/usage/route.ts`)
4. **Test with Postman/curl**

#### Phase 3: Webhook Processing (3 hours)

1. **Webhook Handler** (`app/api/webhooks/stripe/route.ts`)
2. **Event Processors** (`lib/billing/webhook-handlers.ts`)
3. **Subscription Manager** (`lib/billing/subscription-manager.ts`)
4. **Test with Stripe CLI**

#### Phase 4: Usage Tracking (2 hours)

1. **Usage Tracker** (`lib/billing/usage-tracker.ts`)
2. **Stripe Sync** (`lib/billing/stripe-sync.ts`)
3. **Integration with Report Generation**
4. **Test Limit Enforcement**

#### Phase 5: UI Components & Testing (2 hours)

1. **React Hooks**
2. **UI Components**
3. **Unit Tests**
4. **Integration Tests**
5. **E2E Tests**

---

## Component Specifications

### 1. Stripe Client (`lib/billing/stripe-client.ts`)

**Purpose**: Initialize Stripe SDK with proper configuration

**Complete Implementation**:

```typescript
/**
 * Stripe Client Configuration
 *
 * This module initializes the Stripe SDK with proper configuration
 * and provides price ID mappings for subscription plans.
 *
 * @module lib/billing/stripe-client
 */

import Stripe from 'stripe';

// Validate required environment variables at startup
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
  'STRIPE_PRICE_PROFESSIONAL_YEARLY',
  'STRIPE_PRICE_PRACTICE_MONTHLY',
  'STRIPE_PRICE_PRACTICE_YEARLY',
] as const;

// Check for missing environment variables
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Stripe environment variables: ${missingVars.join(', ')}\n` +
      `Please configure these in your .env.local file.`
  );
}

/**
 * Stripe SDK Instance
 *
 * Configured with:
 * - API version: 2024-12-18.acacia (latest stable)
 * - TypeScript: enabled for full type inference
 * - API key: from STRIPE_SECRET_KEY environment variable
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
  appInfo: {
    name: 'Radiology Reporting App',
    version: '1.0.0',
  },
});

/**
 * Stripe Price IDs
 *
 * Maps plan names and intervals to Stripe price IDs.
 * These must be created in the Stripe Dashboard first.
 */
export const STRIPE_PRICES = {
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
  professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!,
  practice_monthly: process.env.STRIPE_PRICE_PRACTICE_MONTHLY!,
  practice_yearly: process.env.STRIPE_PRICE_PRACTICE_YEARLY!,
} as const;

/**
 * Reverse mapping: Price ID → Plan Name
 *
 * Used in webhook handlers to determine plan from price ID
 */
export const PRICE_TO_PLAN_MAP: Record<string, 'professional' | 'practice'> = {
  [STRIPE_PRICES.professional_monthly]: 'professional',
  [STRIPE_PRICES.professional_yearly]: 'professional',
  [STRIPE_PRICES.practice_monthly]: 'practice',
  [STRIPE_PRICES.practice_yearly]: 'practice',
};

/**
 * Get plan name from Stripe price ID
 *
 * @param priceId - Stripe price ID
 * @returns Plan name or throws error if not found
 * @throws Error if price ID is not recognized
 */
export function getPlanNameFromPriceId(
  priceId: string
): 'free' | 'professional' | 'practice' | 'enterprise' {
  const planName = PRICE_TO_PLAN_MAP[priceId];

  if (!planName) {
    // Check if it's an enterprise custom price
    if (priceId.startsWith('price_')) {
      console.warn(`Unknown price ID: ${priceId}, defaulting to professional`);
      return 'professional';
    }

    throw new Error(`Unknown Stripe price ID: ${priceId}`);
  }

  return planName;
}

/**
 * Validate price ID exists in configuration
 *
 * @param priceId - Stripe price ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidPriceId(priceId: string): boolean {
  return Object.values(STRIPE_PRICES).includes(priceId);
}

/**
 * Get price ID for plan and interval
 *
 * @param plan - Plan name (professional or practice)
 * @param interval - Billing interval (month or year)
 * @returns Stripe price ID
 * @throws Error if combination is invalid
 */
export function getPriceId(
  plan: 'professional' | 'practice',
  interval: 'month' | 'year'
): string {
  const key = `${plan}_${interval === 'month' ? 'monthly' : 'yearly'}` as keyof typeof STRIPE_PRICES;

  const priceId = STRIPE_PRICES[key];

  if (!priceId) {
    throw new Error(`No price configured for ${plan} ${interval}`);
  }

  return priceId;
}

/**
 * Stripe webhook secret
 *
 * Used to verify webhook signatures
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Type guard to check if error is a Stripe error
 *
 * @param error - Error object
 * @returns true if error is a Stripe error
 */
export function isStripeError(error: unknown): error is Stripe.StripeError {
  return typeof error === 'object' && error !== null && 'type' in error;
}
```

### 2. Billing Type Definitions (`lib/billing/types.ts`)

**Purpose**: TypeScript types for billing operations

**Complete Implementation**:

```typescript
/**
 * Billing Type Definitions
 *
 * Shared types for Stripe integration and billing operations
 *
 * @module lib/billing/types
 */

import type { Database } from '@/types/database';
import type Stripe from 'stripe';

// Database types
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
export type SubscriptionLimits = Database['public']['Tables']['subscription_limits']['Row'];
export type UsageRecord = Database['public']['Tables']['usage_records']['Row'];
export type UsageRecordInsert = Database['public']['Tables']['usage_records']['Insert'];

/**
 * Plan name type
 */
export type PlanName = 'free' | 'professional' | 'practice' | 'enterprise';

/**
 * Subscription status type
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'unpaid';

/**
 * Billing interval type
 */
export type BillingInterval = 'month' | 'year';

/**
 * Usage type
 */
export type UsageType = 'report_generated' | 'transcription' | 'export' | 'api_call';

/**
 * Checkout session creation request
 */
export interface CreateCheckoutSessionRequest {
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Checkout session response
 */
export interface CreateCheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Customer portal session response
 */
export interface CreatePortalSessionResponse {
  url: string;
}

/**
 * Usage statistics for a single usage type
 */
export interface UsageStats {
  current: number;
  limit: number;
  percentage: number;
  allowed: boolean;
  warningThreshold: boolean; // true if > 80%
}

/**
 * Complete usage response
 */
export interface UsageResponse {
  usage: {
    report_generated: UsageStats;
    transcription: UsageStats;
    export: UsageStats;
  };
  subscription: {
    plan_name: PlanName;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    days_remaining: number;
  };
}

/**
 * Webhook event type
 */
export type WebhookEventType =
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_succeeded'
  | 'invoice.payment_failed'
  | 'customer.updated';

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  success: boolean;
  message: string;
  eventId: string;
  eventType: WebhookEventType;
}

/**
 * Subscription with limits (joined data)
 */
export interface SubscriptionWithLimits extends Subscription {
  limits: SubscriptionLimits;
}

/**
 * Usage check result
 */
export interface UsageCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resetDate: Date;
}

/**
 * Customer creation options
 */
export interface CreateCustomerOptions {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Stripe customer with metadata
 */
export interface StripeCustomerWithMetadata extends Stripe.Customer {
  metadata: {
    supabase_user_id: string;
  };
}

/**
 * Error response from API
 */
export interface BillingErrorResponse {
  success: false;
  error: string;
  code: string;
}

/**
 * Success response from API
 */
export interface BillingSuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * API response type
 */
export type BillingApiResponse<T> = BillingSuccessResponse<T> | BillingErrorResponse;
```

### 3. Checkout API Route (`app/api/billing/checkout/route.ts`)

**Purpose**: Create Stripe Checkout session for subscription purchase

**Complete Implementation**:

```typescript
/**
 * Checkout Session API Route
 *
 * Creates a Stripe Checkout session for subscription purchase.
 * Handles customer creation/retrieval and session configuration.
 *
 * @route POST /api/billing/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError, errorResponse } from '@/lib/auth/api-protection';
import { stripe, STRIPE_PRICES, isValidPriceId } from '@/lib/billing/stripe-client';
import { getOrCreateStripeCustomer } from '@/lib/billing/stripe-sync';
import type { CreateCheckoutSessionRequest } from '@/lib/billing/types';

/**
 * POST /api/billing/checkout
 *
 * Create a Stripe Checkout session
 *
 * @param request - Next.js request object
 * @returns Checkout session ID and URL
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = getUserFromRequest(request);

    // 2. Parse and validate request body
    const body = (await request.json()) as CreateCheckoutSessionRequest;

    if (!body.priceId) {
      return errorResponse('Price ID is required', 400, 'missing_price_id');
    }

    if (!isValidPriceId(body.priceId)) {
      return errorResponse('Invalid price ID', 400, 'invalid_price_id');
    }

    // 3. Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);

    // 4. Configure success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = body.successUrl || `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = body.cancelUrl || `${baseUrl}/pricing`;

    // 5. Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: body.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        supabase_user_id: user.id,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
    });

    // 6. Return session details
    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return handleApiError(error);
  }
}
```

### 4. Customer Portal API Route (`app/api/billing/portal/route.ts`)

**Purpose**: Create Stripe Customer Portal session for subscription management

**Complete Implementation**:

```typescript
/**
 * Customer Portal API Route
 *
 * Creates a Stripe Customer Portal session for users to manage
 * their subscription, payment methods, and view invoices.
 *
 * @route POST /api/billing/portal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError, errorResponse } from '@/lib/auth/api-protection';
import { stripe } from '@/lib/billing/stripe-client';
import { getStripeCustomerId } from '@/lib/billing/stripe-sync';

/**
 * POST /api/billing/portal
 *
 * Create a Stripe Customer Portal session
 *
 * @param request - Next.js request object
 * @returns Portal URL
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = getUserFromRequest(request);

    // 2. Get Stripe customer ID from database
    const customerId = await getStripeCustomerId(user.id);

    if (!customerId) {
      return errorResponse(
        'No billing account found. Please subscribe to a plan first.',
        404,
        'no_billing_account'
      );
    }

    // 3. Configure return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/dashboard`;

    // 4. Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    // 5. Return portal URL
    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error('Portal session creation error:', error);
    return handleApiError(error);
  }
}
```

### 5. Usage API Route (`app/api/billing/usage/route.ts`)

**Purpose**: Retrieve current usage statistics and limits

**Complete Implementation**:

```typescript
/**
 * Usage Statistics API Route
 *
 * Retrieves current usage statistics, limits, and billing period
 * information for the authenticated user.
 *
 * @route GET /api/billing/usage
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, handleApiError } from '@/lib/auth/api-protection';
import { getUserUsageStats } from '@/lib/billing/usage-tracker';

/**
 * GET /api/billing/usage
 *
 * Get usage statistics for authenticated user
 *
 * @param request - Next.js request object
 * @returns Usage statistics and subscription details
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = getUserFromRequest(request);

    // 2. Get usage statistics
    const usageStats = await getUserUsageStats(user.id);

    // 3. Return usage data
    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Usage retrieval error:', error);
    return handleApiError(error);
  }
}
```

### 6. Webhook Handler (`app/api/webhooks/stripe/route.ts`)

**Purpose**: Process Stripe webhook events

**Complete Implementation**:

```typescript
/**
 * Stripe Webhook Handler
 *
 * Processes Stripe webhook events to keep the database synchronized
 * with Stripe's subscription and payment state.
 *
 * @route POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe-client';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentSucceeded,
  handleInvoicePaymentFailed,
  handleCustomerUpdated,
} from '@/lib/billing/webhook-handlers';
import type Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe
 *
 * Process Stripe webhook events
 *
 * Security: Validates webhook signature before processing
 * No authentication required - signature verification is the auth mechanism
 *
 * @param request - Next.js request object
 * @returns 200 OK if processed successfully
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 3. Log event receipt
    console.log(`Received webhook: ${event.type} [${event.id}]`);

    // 4. Route event to appropriate handler
    try {
      switch (event.type) {
        case 'customer.subscription.created': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionCreated(subscription);
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionUpdated(subscription);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await handleSubscriptionDeleted(subscription);
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentSucceeded(invoice);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(invoice);
          break;
        }

        case 'customer.updated': {
          const customer = event.data.object as Stripe.Customer;
          await handleCustomerUpdated(customer);
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      // 5. Return success
      console.log(`Successfully processed: ${event.type} [${event.id}]`);
      return NextResponse.json({ received: true });
    } catch (handlerError) {
      // Log error but return 500 to trigger Stripe retry
      console.error(`Handler error for ${event.type}:`, handlerError);
      return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Disable body parsing for webhook route
 * We need the raw body for signature verification
 */
export const config = {
  api: {
    bodyParser: false,
  },
};
```

### 7. Webhook Event Handlers (`lib/billing/webhook-handlers.ts`)

**Purpose**: Individual handlers for each webhook event type

**Complete Implementation**:

```typescript
/**
 * Stripe Webhook Event Handlers
 *
 * Individual handlers for each Stripe webhook event type.
 * Each handler processes the event and updates the database accordingly.
 *
 * @module lib/billing/webhook-handlers
 */

import type Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getPlanNameFromPriceId } from './stripe-client';
import type { Database } from '@/types/database';

// Create Supabase admin client for webhook operations
// Webhooks need to bypass RLS policies
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Handle customer.subscription.created event
 *
 * Creates a new subscription record in the database when a user
 * completes checkout and their subscription is created.
 *
 * @param subscription - Stripe subscription object
 */
export async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`Processing subscription.created: ${subscription.id}`);

  // Extract user ID from metadata
  const userId = subscription.metadata.supabase_user_id;

  if (!userId) {
    console.error('Missing supabase_user_id in subscription metadata');
    throw new Error('Missing user ID in subscription metadata');
  }

  // Get plan name from price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    throw new Error('No price found in subscription');
  }

  const planName = getPlanNameFromPriceId(priceId);

  // Prepare subscription data
  const subscriptionData = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status as any,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    amount: subscription.items.data[0]?.price.unit_amount || 0,
    currency: subscription.currency,
    interval: (subscription.items.data[0]?.price.recurring?.interval as 'month' | 'year') || 'month',
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  };

  // Insert subscription (upsert to handle potential duplicates)
  const { error } = await supabase.from('subscriptions').upsert(subscriptionData, {
    onConflict: 'stripe_subscription_id',
  });

  if (error) {
    console.error('Failed to insert subscription:', error);
    throw error;
  }

  console.log(`Subscription created: ${subscription.id} for user ${userId}`);
}

/**
 * Handle customer.subscription.updated event
 *
 * Updates an existing subscription record when the subscription
 * changes (plan upgrade, cancellation scheduled, status change, etc.)
 *
 * @param subscription - Stripe subscription object
 */
export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`Processing subscription.updated: ${subscription.id}`);

  // Get plan name from price ID
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    throw new Error('No price found in subscription');
  }

  const planName = getPlanNameFromPriceId(priceId);

  // Prepare update data
  const updateData = {
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status as any,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
    amount: subscription.items.data[0]?.price.unit_amount || 0,
    interval: (subscription.items.data[0]?.price.recurring?.interval as 'month' | 'year') || 'month',
    updated_at: new Date().toISOString(),
  };

  // Update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription:', error);
    throw error;
  }

  console.log(`Subscription updated: ${subscription.id}`);
}

/**
 * Handle customer.subscription.deleted event
 *
 * Marks a subscription as canceled when it is deleted in Stripe
 * (typically at the end of a cancellation period).
 *
 * @param subscription - Stripe subscription object
 */
export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`Processing subscription.deleted: ${subscription.id}`);

  // Update subscription status to canceled
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
    throw error;
  }

  console.log(`Subscription canceled: ${subscription.id}`);
}

/**
 * Handle invoice.payment_succeeded event
 *
 * Records successful payments and updates subscription billing periods.
 * Also used to reset usage counters for new billing periods.
 *
 * @param invoice - Stripe invoice object
 */
export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`Processing invoice.payment_succeeded: ${invoice.id}`);

  if (!invoice.subscription) {
    console.log('Invoice not related to subscription, skipping');
    return;
  }

  // Get subscription from database
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (fetchError || !subscription) {
    console.error('Failed to find subscription:', fetchError);
    return;
  }

  // Record payment in payments table (optional)
  if (invoice.payment_intent) {
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      payment_method: 'card', // Stripe Checkout always uses cards
    });

    if (paymentError) {
      console.error('Failed to record payment:', paymentError);
      // Don't throw - payment was successful in Stripe
    }
  }

  // Update subscription billing period (for renewals)
  if (invoice.billing_reason === 'subscription_cycle') {
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        current_period_start: new Date(invoice.period_start * 1000).toISOString(),
        current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        status: 'active', // Restore to active if was past_due
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription as string);

    if (updateError) {
      console.error('Failed to update billing period:', updateError);
    }
  }

  console.log(`Payment recorded: ${invoice.id}`);
}

/**
 * Handle invoice.payment_failed event
 *
 * Records failed payments and updates subscription status to past_due.
 * This restricts user access to paid features.
 *
 * @param invoice - Stripe invoice object
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`Processing invoice.payment_failed: ${invoice.id}`);

  if (!invoice.subscription) {
    console.log('Invoice not related to subscription, skipping');
    return;
  }

  // Get subscription from database
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('user_id, id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (fetchError || !subscription) {
    console.error('Failed to find subscription:', fetchError);
    return;
  }

  // Record failed payment
  if (invoice.payment_intent) {
    const { error: paymentError } = await supabase.from('payments').insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      payment_method: 'card',
      failure_reason: 'Payment declined',
    });

    if (paymentError) {
      console.error('Failed to record payment failure:', paymentError);
    }
  }

  // Update subscription status to past_due
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);

  if (updateError) {
    console.error('Failed to update subscription status:', updateError);
  }

  console.log(`Payment failure recorded: ${invoice.id}`);
}

/**
 * Handle customer.updated event
 *
 * Syncs customer email updates from Stripe to the database.
 *
 * @param customer - Stripe customer object
 */
export async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log(`Processing customer.updated: ${customer.id}`);

  // Only update if email changed
  if (!customer.email) {
    return;
  }

  // Update user email (if needed)
  const { error } = await supabase
    .from('users')
    .update({
      email: customer.email,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);

  if (error) {
    console.error('Failed to update user email:', error);
    // Don't throw - not critical
  }

  console.log(`Customer updated: ${customer.id}`);
}
```

### 8. Subscription Manager (`lib/billing/subscription-manager.ts`)

**Purpose**: CRUD operations for subscriptions

**Complete Implementation**:

```typescript
/**
 * Subscription Manager
 *
 * Provides high-level functions for subscription management.
 * Abstracts database operations and provides consistent error handling.
 *
 * @module lib/billing/subscription-manager
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { Subscription, SubscriptionWithLimits, PlanName } from './types';

/**
 * Create Supabase client
 * Uses service role key for admin operations
 */
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get user's active subscription
 *
 * @param userId - User UUID
 * @returns Active subscription or null
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get active subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get user's subscription with limits
 *
 * @param userId - User UUID
 * @returns Subscription with limits or null
 */
export async function getSubscriptionWithLimits(
  userId: string
): Promise<SubscriptionWithLimits | null> {
  // Get active subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (subError) {
    throw new Error(`Failed to get subscription: ${subError.message}`);
  }

  if (!subscription) {
    return null;
  }

  // Get limits for plan
  const { data: limits, error: limitsError } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('plan_name', subscription.plan_name)
    .single();

  if (limitsError) {
    throw new Error(`Failed to get subscription limits: ${limitsError.message}`);
  }

  return {
    ...subscription,
    limits,
  };
}

/**
 * Get subscription by Stripe subscription ID
 *
 * @param stripeSubscriptionId - Stripe subscription ID
 * @returns Subscription or null
 */
export async function getSubscriptionByStripeId(
  stripeSubscriptionId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('stripe_subscription_id', stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to get subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get plan limits
 *
 * @param planName - Plan name
 * @returns Subscription limits
 */
export async function getPlanLimits(planName: PlanName) {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('plan_name', planName)
    .single();

  if (error) {
    throw new Error(`Failed to get plan limits: ${error.message}`);
  }

  return data;
}

/**
 * Check if user has active subscription
 *
 * @param userId - User UUID
 * @returns true if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(userId);
  return subscription !== null;
}

/**
 * Get user's plan name
 *
 * Returns 'free' if no active subscription
 *
 * @param userId - User UUID
 * @returns Plan name
 */
export async function getUserPlanName(userId: string): Promise<PlanName> {
  const subscription = await getActiveSubscription(userId);
  return subscription?.plan_name || 'free';
}

/**
 * Check if user has access to feature
 *
 * @param userId - User UUID
 * @param feature - Feature name
 * @returns true if user has access
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof Pick<
    Database['public']['Tables']['subscription_limits']['Row'],
    | 'real_time_transcription'
    | 'priority_support'
    | 'custom_branding'
    | 'api_access'
    | 'slow_brewed_mode'
  >
): Promise<boolean> {
  const subscriptionWithLimits = await getSubscriptionWithLimits(userId);

  if (!subscriptionWithLimits) {
    // Check free plan limits
    const freeLimits = await getPlanLimits('free');
    return freeLimits[feature];
  }

  return subscriptionWithLimits.limits[feature];
}
```

### 9. Usage Tracker (`lib/billing/usage-tracker.ts`)

**Purpose**: Track usage and enforce limits

**Complete Implementation**:

```typescript
/**
 * Usage Tracker
 *
 * Handles usage recording, limit checking, and usage statistics.
 * Enforces plan limits and provides usage data for billing.
 *
 * @module lib/billing/usage-tracker
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  getActiveSubscription,
  getSubscriptionWithLimits,
  getPlanLimits,
} from './subscription-manager';
import type { UsageType, UsageResponse, UsageCheckResult } from './types';

/**
 * Create Supabase client
 */
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Check if user can perform action based on usage limits
 *
 * @param userId - User UUID
 * @param usageType - Type of usage to check
 * @returns Usage check result
 * @throws Error if user is over limit
 */
export async function checkUsageLimit(
  userId: string,
  usageType: UsageType
): Promise<UsageCheckResult> {
  // Get subscription with limits
  const subscriptionWithLimits = await getSubscriptionWithLimits(userId);

  let planLimits;
  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;

  if (!subscriptionWithLimits) {
    // No subscription = free plan
    planLimits = await getPlanLimits('free');

    // Free plan uses calendar month
    const now = new Date();
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    planLimits = subscriptionWithLimits.limits;
    currentPeriodStart = new Date(subscriptionWithLimits.current_period_start);
    currentPeriodEnd = new Date(subscriptionWithLimits.current_period_end);
  }

  // Get limit for usage type
  const limit = getLimitForUsageType(planLimits, usageType);

  // Count current usage
  const { count, error } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('billing_period_start', currentPeriodStart.toISOString())
    .lte('billing_period_end', currentPeriodEnd.toISOString());

  if (error) {
    throw new Error(`Failed to count usage: ${error.message}`);
  }

  const current = count || 0;
  const allowed = current < limit;
  const remaining = Math.max(0, limit - current);

  return {
    allowed,
    current,
    limit,
    remaining,
    resetDate: currentPeriodEnd,
  };
}

/**
 * Record usage event
 *
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @param reportId - Related report ID (optional)
 * @param quantity - Quantity to record (default: 1)
 */
export async function recordUsage(
  userId: string,
  usageType: UsageType,
  reportId?: string,
  quantity: number = 1
): Promise<void> {
  // Get subscription
  const subscription = await getActiveSubscription(userId);

  let billingPeriodStart: Date;
  let billingPeriodEnd: Date;

  if (!subscription) {
    // Free plan - use calendar month
    const now = new Date();
    billingPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    billingPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  } else {
    billingPeriodStart = new Date(subscription.current_period_start);
    billingPeriodEnd = new Date(subscription.current_period_end);
  }

  // Insert usage record
  const { error } = await supabase.from('usage_records').insert({
    user_id: userId,
    subscription_id: subscription?.id || null,
    report_id: reportId || null,
    usage_type: usageType,
    quantity,
    billing_period_start: billingPeriodStart.toISOString(),
    billing_period_end: billingPeriodEnd.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record usage: ${error.message}`);
  }

  console.log(`Recorded usage: ${usageType} for user ${userId}`);
}

/**
 * Get complete usage statistics for user
 *
 * @param userId - User UUID
 * @returns Complete usage response
 */
export async function getUserUsageStats(userId: string): Promise<UsageResponse> {
  // Get subscription with limits
  const subscriptionWithLimits = await getSubscriptionWithLimits(userId);

  let planLimits;
  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;
  let planName: 'free' | 'professional' | 'practice' | 'enterprise';
  let status: any;

  if (!subscriptionWithLimits) {
    // No subscription = free plan
    planLimits = await getPlanLimits('free');
    const now = new Date();
    currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    planName = 'free';
    status = 'active';
  } else {
    planLimits = subscriptionWithLimits.limits;
    currentPeriodStart = new Date(subscriptionWithLimits.current_period_start);
    currentPeriodEnd = new Date(subscriptionWithLimits.current_period_end);
    planName = subscriptionWithLimits.plan_name;
    status = subscriptionWithLimits.status;
  }

  // Get usage for each type
  const usageTypes: UsageType[] = ['report_generated', 'transcription', 'export'];
  const usageStats: any = {};

  for (const usageType of usageTypes) {
    const { count, error } = await supabase
      .from('usage_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('usage_type', usageType)
      .gte('billing_period_start', currentPeriodStart.toISOString())
      .lte('billing_period_end', currentPeriodEnd.toISOString());

    if (error) {
      throw new Error(`Failed to count usage: ${error.message}`);
    }

    const current = count || 0;
    const limit = getLimitForUsageType(planLimits, usageType);
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    const allowed = current < limit;
    const warningThreshold = percentage >= 80;

    usageStats[usageType] = {
      current,
      limit,
      percentage: Math.round(percentage * 100) / 100,
      allowed,
      warningThreshold,
    };
  }

  // Calculate days remaining
  const now = new Date();
  const daysRemaining = Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    usage: usageStats,
    subscription: {
      plan_name: planName,
      status,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      days_remaining: daysRemaining,
    },
  };
}

/**
 * Helper: Get limit for usage type from plan limits
 */
function getLimitForUsageType(
  planLimits: Database['public']['Tables']['subscription_limits']['Row'],
  usageType: UsageType
): number {
  switch (usageType) {
    case 'report_generated':
      return planLimits.reports_per_month;
    case 'transcription':
      return planLimits.reports_per_month; // Same as reports
    case 'export':
      return planLimits.reports_per_month * 2; // Allow 2x exports
    case 'api_call':
      return planLimits.api_access ? 10000 : 0; // 10k API calls if enabled
    default:
      return 0;
  }
}
```

### 10. Stripe Sync Utilities (`lib/billing/stripe-sync.ts`)

**Purpose**: Synchronize data between Stripe and Supabase

**Complete Implementation**:

```typescript
/**
 * Stripe Sync Utilities
 *
 * Functions to synchronize data between Stripe and Supabase.
 * Handles customer creation, retrieval, and updates.
 *
 * @module lib/billing/stripe-sync
 */

import { createClient } from '@supabase/supabase-js';
import { stripe } from './stripe-client';
import type { Database } from '@/types/database';

/**
 * Create Supabase client
 */
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get or create Stripe customer for user
 *
 * Checks if user has a Stripe customer ID in the database.
 * If not, creates a new customer in Stripe and saves the ID.
 *
 * @param userId - User UUID
 * @param email - User email
 * @param name - User name (optional)
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if customer exists in database
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch user: ${fetchError.message}`);
  }

  // Return existing customer ID
  if (user?.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  // Create new Stripe customer
  console.log(`Creating Stripe customer for user ${userId}`);

  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      supabase_user_id: userId,
    },
  });

  // Save customer ID to database
  const { error: updateError } = await supabase
    .from('users')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId);

  if (updateError) {
    console.error('Failed to save customer ID:', updateError);
    // Don't throw - customer was created successfully in Stripe
  }

  console.log(`Created Stripe customer: ${customer.id}`);
  return customer.id;
}

/**
 * Get Stripe customer ID from database
 *
 * @param userId - User UUID
 * @returns Stripe customer ID or null
 */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return data?.stripe_customer_id || null;
}

/**
 * Update customer email in Stripe
 *
 * @param userId - User UUID
 * @param newEmail - New email address
 */
export async function updateStripeCustomerEmail(userId: string, newEmail: string): Promise<void> {
  const customerId = await getStripeCustomerId(userId);

  if (!customerId) {
    console.log(`No Stripe customer for user ${userId}, skipping email update`);
    return;
  }

  await stripe.customers.update(customerId, {
    email: newEmail,
  });

  console.log(`Updated Stripe customer email: ${customerId}`);
}
```

---

## Stripe Product Configuration

### Product Setup in Stripe Dashboard

**IMPORTANT**: These products must be created in Stripe Dashboard before the application can process subscriptions.

#### Step-by-Step Configuration

**1. Navigate to Stripe Dashboard**
- Go to https://dashboard.stripe.com
- Switch to Test Mode for development
- Navigate to Products → Add Product

**2. Create Professional Plan**

```yaml
Product Name: Professional Plan
Description: |
  Perfect for individual practitioners

  Features:
  • 100 radiology reports per month
  • 50 custom templates
  • 10GB secure storage
  • Real-time voice transcription
  • Slow-brewed AI mode (O3 model)
  • Email support

Statement Descriptor: RADIOLOGY PRO
```

**Pricing Configuration**:

```yaml
Monthly Price:
  - Amount: $29.00 USD
  - Billing Period: Monthly
  - Price ID: (save to STRIPE_PRICE_PROFESSIONAL_MONTHLY)
  - Metadata:
      plan_name: professional
      interval: month

Yearly Price:
  - Amount: $290.00 USD (16.55% discount)
  - Billing Period: Yearly
  - Price ID: (save to STRIPE_PRICE_PROFESSIONAL_YEARLY)
  - Metadata:
      plan_name: professional
      interval: year
```

**3. Create Practice Plan**

```yaml
Product Name: Practice Plan
Description: |
  Designed for small medical practices

  Features:
  • 500 radiology reports per month
  • 200 custom templates
  • 50GB secure storage
  • Real-time voice transcription
  • Slow-brewed AI mode (O3 model)
  • Team collaboration (up to 10 members)
  • Priority email & phone support
  • Custom branding

Statement Descriptor: RADIOLOGY PRAC
```

**Pricing Configuration**:

```yaml
Monthly Price:
  - Amount: $99.00 USD
  - Billing Period: Monthly
  - Price ID: (save to STRIPE_PRICE_PRACTICE_MONTHLY)
  - Metadata:
      plan_name: practice
      interval: month

Yearly Price:
  - Amount: $990.00 USD (16.67% discount)
  - Billing Period: Yearly
  - Price ID: (save to STRIPE_PRICE_PRACTICE_YEARLY)
  - Metadata:
      plan_name: practice
      interval: year
```

**4. Create Enterprise Plan (Contact Sales)**

```yaml
Product Name: Enterprise Plan
Description: |
  Custom solution for large institutions

  Features:
  • Unlimited radiology reports
  • Unlimited custom templates
  • 500GB+ secure storage
  • Dedicated infrastructure
  • API access
  • Priority support with SLA
  • Custom integrations
  • HIPAA BAA included
  • Dedicated account manager

Statement Descriptor: RADIOLOGY ENT
```

**Pricing**: Custom (handled via Stripe Invoices, not Checkout)

**5. Configure Metadata (CRITICAL)**

Each price **MUST** include metadata:

```json
{
  "plan_name": "professional",
  "interval": "month"
}
```

This metadata is used by the webhook handlers to map price IDs to plan names.

**6. Save Price IDs**

After creating each price, copy the price ID (format: `price_xxxxx`) and add to environment variables:

```bash
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxx
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_xxxxx
STRIPE_PRICE_PRACTICE_MONTHLY=price_xxxxx
STRIPE_PRICE_PRACTICE_YEARLY=price_xxxxx
```

### Webhook Configuration

**1. Create Webhook Endpoint**

- Navigate to Developers → Webhooks
- Click "Add endpoint"
- Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
- Description: "Subscription and payment webhooks"

**2. Select Events to Listen To**:

```yaml
Subscription Events:
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted

Payment Events:
  - invoice.payment_succeeded
  - invoice.payment_failed

Customer Events:
  - customer.updated
```

**3. Save Signing Secret**

Copy the webhook signing secret (format: `whsec_xxxxx`) and add to environment variables:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Customer Portal Configuration

**1. Navigate to Settings → Billing → Customer Portal**

**2. Enable Features**:

```yaml
Customer Information:
  ☑ Allow customers to update email

Payment Methods:
  ☑ Allow customers to update payment methods
  ☑ Allow customers to remove payment methods

Subscriptions:
  ☑ Allow customers to cancel subscriptions
  ☑ Allow customers to pause subscriptions (optional)
  ☑ Allow customers to switch plans
  ☑ Enable proration for plan changes

Invoices:
  ☑ Allow customers to view invoice history
  ☑ Allow customers to download invoices

Cancellation:
  Cancellation Behavior: At period end
  Cancellation Reasons: Required
  ☑ Save canceled subscriptions
```

**3. Customize Branding**:

- Upload logo
- Set brand colors
- Configure support email

---

## Database Integration

### Using Existing Tables from Feature 1.3

The Stripe integration uses the following tables created in Feature 1.3:

#### 1. `users` Table

**Stripe Integration Field**:
- `stripe_customer_id` (TEXT, UNIQUE) - Links user to Stripe customer

**Usage**:
```typescript
// Save Stripe customer ID when first created
await supabase
  .from('users')
  .update({ stripe_customer_id: customer.id })
  .eq('id', userId);

// Retrieve for portal access
const { data } = await supabase
  .from('users')
  .select('stripe_customer_id')
  .eq('id', userId)
  .single();
```

#### 2. `subscriptions` Table

**All fields used by Stripe integration**:
```typescript
{
  id: UUID,                          // Primary key
  user_id: UUID,                     // Foreign key to users
  stripe_subscription_id: TEXT,      // Stripe subscription ID (unique)
  stripe_customer_id: TEXT,          // Stripe customer ID
  stripe_price_id: TEXT,             // Stripe price ID
  plan_name: TEXT,                   // Plan name (free/professional/practice/enterprise)
  status: TEXT,                      // active/canceled/past_due/trialing/incomplete/unpaid
  current_period_start: TIMESTAMP,   // Billing period start
  current_period_end: TIMESTAMP,     // Billing period end
  cancel_at_period_end: BOOLEAN,     // Cancellation scheduled
  canceled_at: TIMESTAMP,            // Cancellation timestamp
  amount: INTEGER,                   // Amount in cents
  currency: TEXT,                    // Currency code (usd)
  interval: TEXT,                    // month/year
  trial_start: TIMESTAMP,            // Trial start (optional)
  trial_end: TIMESTAMP,              // Trial end (optional)
  created_at: TIMESTAMP,             // Creation timestamp
  updated_at: TIMESTAMP,             // Last update timestamp
}
```

#### 3. `usage_records` Table

**All fields used for usage tracking**:
```typescript
{
  id: UUID,                          // Primary key
  user_id: UUID,                     // Foreign key to users
  subscription_id: UUID,             // Foreign key to subscriptions
  report_id: UUID,                   // Foreign key to reports (optional)
  usage_type: TEXT,                  // report_generated/transcription/export/api_call
  quantity: INTEGER,                 // Quantity used (default: 1)
  billing_period_start: TIMESTAMP,   // Start of billing period
  billing_period_end: TIMESTAMP,     // End of billing period
  created_at: TIMESTAMP,             // Usage timestamp
}
```

#### 4. `subscription_limits` Table

**Read-only reference for plan limits**:
```typescript
{
  id: UUID,                          // Primary key
  plan_name: TEXT,                   // Plan name (unique)
  reports_per_month: INTEGER,        // Report limit
  templates_limit: INTEGER,          // Template limit
  storage_gb: INTEGER,               // Storage limit
  team_members: INTEGER,             // Team member limit
  real_time_transcription: BOOLEAN,  // Feature flag
  priority_support: BOOLEAN,         // Feature flag
  custom_branding: BOOLEAN,          // Feature flag
  api_access: BOOLEAN,               // Feature flag
  slow_brewed_mode: BOOLEAN,         // Feature flag
  created_at: TIMESTAMP,             // Creation timestamp
}
```

### Database Helper Functions

The Stripe integration uses existing helpers from `lib/database/helpers.ts`:

```typescript
import {
  getActiveSubscription,        // Get user's active subscription
  getSubscriptionLimits,         // Get limits for plan
  getCurrentUsage,               // Count usage in period
  recordUsage,                   // Insert usage record
  checkUsageLimit,               // Check if limit reached
} from '@/lib/database/helpers';
```

### Transaction Handling

**Critical: Webhook processing should be idempotent**

Use `upsert` operations to handle duplicate webhook events:

```typescript
// Idempotent subscription creation
await supabase.from('subscriptions').upsert(subscriptionData, {
  onConflict: 'stripe_subscription_id',
});

// Idempotent subscription update
await supabase
  .from('subscriptions')
  .update(updateData)
  .eq('stripe_subscription_id', subscription.id);
```

### RLS Policies

All billing tables have Row Level Security enabled. The Stripe integration uses the **service role key** to bypass RLS for webhook operations:

```typescript
// Webhook handlers use service role key
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypasses RLS
);
```

---

## Security Implementation

### 1. Webhook Signature Verification

**Purpose**: Ensure webhooks are from Stripe, not attackers

**Implementation** (in `app/api/webhooks/stripe/route.ts`):

```typescript
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe-client';

// Get raw body and signature
const body = await request.text();
const signature = headers().get('stripe-signature');

// Verify signature
try {
  const event = stripe.webhooks.constructEvent(
    body,
    signature!,
    STRIPE_WEBHOOK_SECRET
  );
  // Process event...
} catch (err) {
  // Invalid signature - return 400
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

**Security Notes**:
- Webhook route does NOT require authentication
- Signature verification IS the authentication
- Always verify before processing
- Log invalid signature attempts for monitoring

### 2. API Key Management

**Environment Variables** (`.env.local`):

```bash
# Stripe Keys (NEVER commit these)
STRIPE_SECRET_KEY=sk_test_xxx          # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Server-side only

# Public key (safe to expose)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Validation at Startup**:

```typescript
// lib/billing/stripe-client.ts validates all required keys
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
```

### 3. Idempotency Key Generation

**Purpose**: Prevent duplicate charges on retry

**Implementation**:

```typescript
import { randomUUID } from 'crypto';

// Generate idempotency key for Stripe API calls
const idempotencyKey = randomUUID();

await stripe.checkout.sessions.create({
  // ... session config
}, {
  idempotencyKey, // Stripe will deduplicate using this key
});
```

### 4. Rate Limiting for Billing Endpoints

**Implementation** (using Vercel rate limiting):

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/billing')) {
    const ip = request.ip ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}
```

### 5. Input Validation

**Validation using Zod**:

```typescript
// lib/billing/validation.ts
import { z } from 'zod';

export const CheckoutRequestSchema = z.object({
  priceId: z.string().startsWith('price_'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// In API route
const validatedData = CheckoutRequestSchema.parse(body);
```

---

## Usage Tracking Implementation

### 1. Recording Usage

**When**: Called after successful report generation, transcription, or export

**Implementation**:

```typescript
// In report generation API route
import { recordUsage, checkUsageLimit } from '@/lib/billing/usage-tracker';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);

  // 1. Check limit BEFORE generation
  const usageCheck = await checkUsageLimit(user.id, 'report_generated');

  if (!usageCheck.allowed) {
    return errorResponse(
      `Usage limit exceeded. You've used ${usageCheck.current}/${usageCheck.limit} reports this period.`,
      403,
      'usage_limit_exceeded'
    );
  }

  // 2. Generate report
  const report = await generateReport(/* ... */);

  // 3. Record usage AFTER successful generation
  await recordUsage(user.id, 'report_generated', report.id);

  return NextResponse.json({ report });
}
```

### 2. Checking Limits

**Implementation**:

```typescript
// lib/billing/usage-tracker.ts
export async function checkUsageLimit(
  userId: string,
  usageType: UsageType
): Promise<UsageCheckResult> {
  // Get subscription and limits
  const subscriptionWithLimits = await getSubscriptionWithLimits(userId);

  // Determine billing period
  const { currentPeriodStart, currentPeriodEnd } = getBillingPeriod(subscriptionWithLimits);

  // Count usage in period
  const { count } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('billing_period_start', currentPeriodStart.toISOString())
    .lte('billing_period_end', currentPeriodEnd.toISOString());

  const current = count || 0;
  const limit = getLimitForUsageType(planLimits, usageType);
  const allowed = current < limit;

  return { allowed, current, limit, remaining: limit - current };
}
```

### 3. Aggregating Usage

**For displaying usage statistics**:

```typescript
// GET /api/billing/usage
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  const usageStats = await getUserUsageStats(user.id);

  return NextResponse.json(usageStats);
}

// Returns:
{
  "usage": {
    "report_generated": {
      "current": 45,
      "limit": 100,
      "percentage": 45,
      "allowed": true,
      "warningThreshold": false
    },
    "transcription": { /* ... */ },
    "export": { /* ... */ }
  },
  "subscription": {
    "plan_name": "professional",
    "status": "active",
    "current_period_start": "2025-01-01T00:00:00Z",
    "current_period_end": "2025-02-01T00:00:00Z",
    "days_remaining": 15
  }
}
```

### 4. Handling Usage Resets

**Automatic on subscription renewal**:

Webhooks automatically update billing periods:

```typescript
// webhook-handlers.ts - handleInvoicePaymentSucceeded
if (invoice.billing_reason === 'subscription_cycle') {
  await supabase
    .from('subscriptions')
    .update({
      current_period_start: new Date(invoice.period_start * 1000).toISOString(),
      current_period_end: new Date(invoice.period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);
}
```

Usage counting automatically respects new period:

```typescript
// Usage queries filter by billing period
.gte('billing_period_start', currentPeriodStart.toISOString())
.lte('billing_period_end', currentPeriodEnd.toISOString())
```

---

## Testing Strategy

### Unit Tests

**Test File**: `tests/billing/stripe-client.test.ts`

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { stripe, getPlanNameFromPriceId, isValidPriceId } from '@/lib/billing/stripe-client';

describe('Stripe Client', () => {
  it('should initialize Stripe client', () => {
    expect(stripe).toBeDefined();
    expect(stripe.apiVersion).toBe('2024-12-18.acacia');
  });

  it('should validate price IDs', () => {
    expect(isValidPriceId(process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!)).toBe(true);
    expect(isValidPriceId('price_invalid')).toBe(false);
  });

  it('should map price ID to plan name', () => {
    const planName = getPlanNameFromPriceId(process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!);
    expect(planName).toBe('professional');
  });
});
```

**Test File**: `tests/billing/usage-tracker.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { checkUsageLimit, recordUsage } from '@/lib/billing/usage-tracker';
import { createTestUser, createTestSubscription, cleanupTestData } from '../helpers';

describe('Usage Tracker', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = await createTestUser();
    await createTestSubscription(testUserId, 'professional');
  });

  afterEach(async () => {
    await cleanupTestData(testUserId);
  });

  it('should allow usage under limit', async () => {
    const result = await checkUsageLimit(testUserId, 'report_generated');

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(100); // Professional plan
    expect(result.current).toBe(0);
  });

  it('should record usage correctly', async () => {
    await recordUsage(testUserId, 'report_generated');

    const result = await checkUsageLimit(testUserId, 'report_generated');
    expect(result.current).toBe(1);
  });

  it('should block usage at limit', async () => {
    // Record 100 usages
    for (let i = 0; i < 100; i++) {
      await recordUsage(testUserId, 'report_generated');
    }

    const result = await checkUsageLimit(testUserId, 'report_generated');
    expect(result.allowed).toBe(false);
    expect(result.current).toBe(100);
  });
});
```

### Integration Tests

**Test File**: `tests/billing/checkout.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/billing/checkout/route';
import { createMockRequest, createTestUser } from '../helpers';

describe('Checkout API', () => {
  it('should create checkout session for valid request', async () => {
    const userId = await createTestUser();

    const request = createMockRequest({
      method: 'POST',
      headers: {
        'x-user-id': userId,
        'x-user-email': 'test@example.com',
      },
      body: {
        priceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBeDefined();
    expect(data.url).toContain('checkout.stripe.com');
  });

  it('should return 401 for unauthenticated request', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        priceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid price ID', async () => {
    const userId = await createTestUser();

    const request = createMockRequest({
      method: 'POST',
      headers: {
        'x-user-id': userId,
        'x-user-email': 'test@example.com',
      },
      body: {
        priceId: 'price_invalid',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
```

### Webhook Testing with Stripe CLI

**Setup Stripe CLI**:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Test Webhook Events**:

```bash
# Test subscription created
stripe trigger customer.subscription.created

# Test subscription updated
stripe trigger customer.subscription.updated

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed
```

**Manual Webhook Testing**:

```typescript
// tests/billing/webhooks.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/webhooks/stripe/route';
import { stripe } from '@/lib/billing/stripe-client';
import { createMockWebhookRequest } from '../helpers';

describe('Webhook Handler', () => {
  it('should process subscription.created event', async () => {
    // Create test subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: 'cus_test',
      items: [{ price: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY }],
      metadata: {
        supabase_user_id: 'test-user-id',
      },
    });

    // Create mock webhook request
    const request = createMockWebhookRequest('customer.subscription.created', subscription);

    // Process webhook
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify subscription created in database
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    expect(data).toBeDefined();
    expect(data.plan_name).toBe('professional');
  });
});
```

### E2E Tests

**Test File**: `tests/billing/e2e/subscription-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Subscription Flow', () => {
  test('complete subscription purchase', async ({ page }) => {
    // 1. Sign up
    await page.goto('/signup');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Test123!');
    await page.click('button[type="submit"]');

    // 2. Select plan
    await page.goto('/pricing');
    await page.click('text=Professional Plan');
    await page.click('text=Subscribe Monthly');

    // 3. Redirected to Stripe Checkout
    await expect(page).toHaveURL(/checkout\.stripe\.com/);

    // 4. Fill payment details (test mode)
    await page.fill('[name="cardnumber"]', '4242 4242 4242 4242');
    await page.fill('[name="exp-date"]', '12/34');
    await page.fill('[name="cvc"]', '123');
    await page.fill('[name="postal"]', '12345');

    // 5. Complete payment
    await page.click('button:has-text("Subscribe")');

    // 6. Redirected to success page
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=Subscription Active')).toBeVisible();

    // 7. Verify subscription in database
    // (Use API call to verify)
  });

  test('manage subscription via portal', async ({ page }) => {
    // Assume user is logged in with active subscription
    await page.goto('/dashboard');

    // Click manage subscription
    await page.click('text=Manage Subscription');

    // Redirected to Stripe Portal
    await expect(page).toHaveURL(/billing\.stripe\.com/);

    // Verify portal elements
    await expect(page.locator('text=Subscription')).toBeVisible();
    await expect(page.locator('text=Payment method')).toBeVisible();
  });
});
```

---

## Environment Configuration

### Development Environment (`.env.local`)

```bash
# ============================================================================
# STRIPE CONFIGURATION (Test Mode)
# ============================================================================

# Stripe API Keys (Test Mode)
# Get from: https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Stripe Webhook Secret (Test Mode)
# Get from: https://dashboard.stripe.com/test/webhooks
# OR use Stripe CLI: stripe listen --print-secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Stripe Price IDs (Test Mode)
# Create products/prices in Stripe Dashboard, then copy IDs
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRACTICE_MONTHLY=price_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRACTICE_YEARLY=price_xxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================

# Supabase Project URL
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxxx.supabase.co

# Supabase Anon Key (Public)
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxx

# Supabase Service Role Key (Secret - DO NOT EXPOSE)
# Get from: https://app.supabase.com/project/_/settings/api
# Used for webhook processing and admin operations
SUPABASE_SERVICE_ROLE_KEY=xxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

# Application Base URL
# Used for Stripe redirect URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production Environment

**Vercel Environment Variables**:

```bash
# Navigate to: Vercel Dashboard → Project → Settings → Environment Variables

# Add each variable:
# - Name: STRIPE_SECRET_KEY
# - Value: sk_live_xxxxxxxxxxxxxxxxxxxxx
# - Environment: Production
# - ☑ Encrypt

# CRITICAL: Use LIVE keys in production, not TEST keys
```

**Production Checklist**:

- [ ] Switch from `sk_test_` to `sk_live_` keys
- [ ] Switch from `pk_test_` to `pk_live_` keys
- [ ] Update webhook secret from live webhook endpoint
- [ ] Create products/prices in live mode
- [ ] Update price IDs to live price IDs
- [ ] Test webhook delivery to production URL
- [ ] Configure Stripe Customer Portal for production
- [ ] Enable production rate limiting

---

## Error Handling

### 1. Stripe API Errors

**Error Types**:

```typescript
import type Stripe from 'stripe';

function handleStripeError(error: Stripe.StripeError) {
  switch (error.type) {
    case 'card_error':
      // Card declined, insufficient funds, etc.
      return {
        message: error.message,
        userMessage: 'Your card was declined. Please try a different payment method.',
        code: 'card_declined',
      };

    case 'invalid_request_error':
      // Invalid parameters
      return {
        message: error.message,
        userMessage: 'Invalid request. Please try again.',
        code: 'invalid_request',
      };

    case 'api_error':
      // Stripe API down
      return {
        message: error.message,
        userMessage: 'Payment service temporarily unavailable. Please try again later.',
        code: 'api_error',
      };

    case 'authentication_error':
      // Invalid API key
      return {
        message: error.message,
        userMessage: 'Configuration error. Please contact support.',
        code: 'config_error',
      };

    default:
      return {
        message: error.message,
        userMessage: 'An unexpected error occurred. Please try again.',
        code: 'unknown_error',
      };
  }
}
```

### 2. Webhook Retry Logic

**Stripe Automatic Retries**:

- Stripe automatically retries failed webhooks
- Retry schedule: 1h, 6h, 12h (3 attempts total)
- After 3 failures, webhook is marked as failed

**Implementation**:

```typescript
// Webhook handler should be idempotent
export async function POST(request: NextRequest) {
  try {
    // Process event
    await handleEvent(event);

    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);

    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}
```

### 3. Duplicate Event Handling

**Problem**: Stripe may send duplicate webhook events

**Solution**: Idempotent operations

```typescript
// Use upsert instead of insert
await supabase.from('subscriptions').upsert(data, {
  onConflict: 'stripe_subscription_id',
});

// Check before update
const { data: existing } = await supabase
  .from('subscriptions')
  .select('updated_at')
  .eq('stripe_subscription_id', subscription.id)
  .single();

// Only update if newer
if (!existing || new Date(existing.updated_at) < new Date(subscription.updated_at)) {
  await supabase.from('subscriptions').update(data);
}
```

### 4. User Deletion with Active Subscription

**Scenario**: User deletes account while subscription active

**Approach**:

```typescript
// Don't cancel subscription automatically
// Stripe subscription remains active
// User can no longer access but subscription continues billing

async function handleUserDeletion(userId: string) {
  // 1. Get active subscription
  const subscription = await getActiveSubscription(userId);

  if (subscription) {
    // 2. Log warning
    console.warn(`User ${userId} deleted with active subscription ${subscription.stripe_subscription_id}`);

    // 3. Send email to admins
    await sendAdminAlert({
      subject: 'User deleted with active subscription',
      userId,
      subscriptionId: subscription.stripe_subscription_id,
    });

    // 4. Mark subscription for review
    await supabase
      .from('subscriptions')
      .update({ metadata: { user_deleted: true } })
      .eq('id', subscription.id);
  }

  // 5. Soft delete user (don't hard delete)
  await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);
}
```

### 5. Network Timeouts

**Timeout Configuration**:

```typescript
// Stripe client with timeout
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  timeout: 30000, // 30 second timeout
  maxNetworkRetries: 2, // Retry failed requests
});
```

**Handling Timeouts**:

```typescript
async function createCheckoutSessionWithRetry(data: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await stripe.checkout.sessions.create(data);
    } catch (error) {
      if (error.code === 'ETIMEDOUT' && attempt < maxRetries) {
        console.log(`Retry attempt ${attempt} after timeout`);
        await sleep(1000 * attempt); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

### 6. Usage Limit Exceeded

**User-Friendly Error**:

```typescript
if (!usageCheck.allowed) {
  return NextResponse.json(
    {
      success: false,
      error: `You've reached your plan limit of ${usageCheck.limit} reports per month.`,
      code: 'usage_limit_exceeded',
      details: {
        current: usageCheck.current,
        limit: usageCheck.limit,
        resetDate: usageCheck.resetDate,
        upgradeUrl: '/pricing',
      },
    },
    { status: 403 }
  );
}
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Stripe Products Created**: All plans configured in Stripe Dashboard (production mode)
- [ ] **Price IDs Configured**: All price environment variables set
- [ ] **Webhook Endpoint Created**: Production webhook URL configured in Stripe
- [ ] **Webhook Secret Set**: `STRIPE_WEBHOOK_SECRET` environment variable set
- [ ] **Customer Portal Configured**: Branding and features enabled
- [ ] **All Tests Passing**: Unit, integration, and E2E tests green
- [ ] **Environment Variables Set**: All Stripe and Supabase variables in Vercel
- [ ] **Database Seeded**: `subscription_limits` table populated

### Deployment

```bash
# 1. Build locally to verify
npm run build

# 2. Run type checking
npm run type-check

# 3. Run tests
npm run test

# 4. Deploy to Vercel
vercel --prod

# 5. Verify deployment
curl https://your-app.vercel.app/api/health
```

### Post-Deployment

- [ ] **Test Checkout Flow**: Complete test purchase in production
- [ ] **Test Webhook Delivery**: Trigger test events from Stripe Dashboard
- [ ] **Verify Portal Access**: Open customer portal for test account
- [ ] **Monitor Webhook Logs**: Check Stripe Dashboard → Webhooks for errors
- [ ] **Set Up Alerts**: Configure monitoring for failed webhooks
- [ ] **Test Usage Limits**: Generate reports to verify limit enforcement
- [ ] **Verify Database Sync**: Check subscriptions table matches Stripe
- [ ] **Test Error Scenarios**: Declined card, expired card, etc.

### Monitoring Setup

**Vercel Analytics**:
- Track checkout conversions
- Monitor API response times
- Alert on error rate spikes

**Stripe Dashboard**:
- Monitor webhook delivery success rate (should be > 99%)
- Track failed payments
- Review customer feedback

**Supabase Logs**:
- Monitor database query performance
- Check for RLS policy violations
- Track usage record insertions

---

## Summary

This technical design provides complete, production-ready code for Stripe billing integration. All components are fully implemented and ready for the backend engineer to copy and deploy.

**Key Implementation Points**:

1. ✅ **Complete Code**: All files include full, runnable implementations
2. ✅ **Type Safety**: Full TypeScript coverage with strict mode
3. ✅ **Security**: Webhook verification, API protection, environment validation
4. ✅ **Error Handling**: Comprehensive error handling and retries
5. ✅ **Testing**: Unit, integration, and E2E test examples
6. ✅ **Documentation**: Clear comments and usage examples
7. ✅ **Production Ready**: Deployment checklist and monitoring setup

**Next Steps**:

1. Review this design document
2. Approve to proceed with implementation
3. Backend engineer copies code from this document
4. Configure Stripe products and webhooks
5. Set environment variables
6. Run tests
7. Deploy to production

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
**Status**: Ready for Review
**Author**: Design Architect Agent
