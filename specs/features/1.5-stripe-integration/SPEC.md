# Feature 1.5 - Stripe Integration Setup

**Feature ID**: 1.5
**Feature Name**: Stripe Integration Setup
**Phase**: Phase 1 - Foundation
**Estimated Time**: 6-8 hours
**Dependencies**: Feature 1.3 (Supabase Integration), Feature 1.4 (Supabase Authentication)
**Status**: Requirements Complete

---

## 📋 Overview

This feature implements comprehensive Stripe billing integration for subscription management in the Radiology Reporting App. It establishes the foundation for monetization by enabling users to subscribe to paid plans, manage their subscriptions, and track usage against plan limits.

The integration connects Stripe's subscription system with the existing Supabase database schema (created in Feature 1.3) and authentication system (created in Feature 1.4), enabling real-time synchronization of subscription data and automated usage limit enforcement.

---

## 🎯 Objectives

1. **Stripe SDK Integration**: Set up Stripe client with TypeScript support
2. **Product & Price Creation**: Create Stripe products matching database subscription plans
3. **Checkout Flow**: Implement subscription purchase via Stripe Checkout
4. **Customer Portal**: Enable users to manage subscriptions via Stripe Customer Portal
5. **Webhook Processing**: Handle Stripe events to keep database synchronized
6. **Usage Tracking**: Enforce plan limits and record usage for billing
7. **Payment Management**: Track payment history and handle failures
8. **Security**: Ensure PCI compliance and webhook signature verification

---

## 📐 Technical Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Actions                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Subscribe   │  │   Upgrade    │  │   Manage     │      │
│  │   to Plan    │  │     Plan     │  │ Subscription │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js API Routes                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  POST /api/billing/checkout                          │   │
│  │  POST /api/billing/portal                            │   │
│  │  GET  /api/billing/usage                             │   │
│  │  POST /api/webhooks/stripe                           │   │
│  └────────────┬────────────┬────────────┬────────────────┘   │
└───────────────┼────────────┼────────────┼────────────────────┘
                │            │            │
                ▼            ▼            ▼
      ┌──────────────┐ ┌─────────────┐ ┌──────────────┐
      │   Stripe     │ │  Supabase   │ │   Vercel     │
      │     API      │ │   Database  │ │  Analytics   │
      └──────────────┘ └─────────────┘ └──────────────┘
                │            ▲
                │ Webhooks   │ RLS Policies
                └────────────┘
```

### Integration Points

1. **Stripe → Next.js**: Webhook events (subscription lifecycle)
2. **Next.js → Stripe**: API calls (checkout, portal, customer management)
3. **Next.js → Supabase**: Database operations (subscriptions, usage, payments)
4. **Client → Next.js**: API requests (authenticated via Supabase Auth)

---

## 🔧 Functional Requirements

### FR-1: Stripe SDK Configuration

**User Story**: As a developer, I want to configure the Stripe SDK with proper credentials and TypeScript support so that I can make type-safe API calls.

**Acceptance Criteria**:

1. **WHEN** the application initializes **THEN** the Stripe client SHALL be created with the secret API key from environment variables
2. **WHEN** making API calls **THEN** the Stripe client SHALL use the latest stable API version (2024-12-18.acacia or newer)
3. **WHEN** TypeScript is enabled **THEN** all Stripe API calls SHALL have full type inference
4. **IF** the Stripe API key is missing **THEN** the application SHALL throw a configuration error at startup
5. **WHEN** price IDs are accessed **THEN** they SHALL be retrieved from environment variables with validation

### FR-2: Subscription Plan Products

**User Story**: As a system administrator, I want Stripe products created for each subscription plan so that users can purchase subscriptions.

**Acceptance Criteria**:

1. **WHEN** Stripe products are created **THEN** they SHALL match the four database plans (free, professional, practice, enterprise)
2. **WHEN** creating prices **THEN** each paid plan SHALL have both monthly and yearly price options
3. **WHEN** a price is created **THEN** it SHALL include metadata linking to the database plan_name
4. **IF** yearly pricing is selected **THEN** the price SHALL include a discount (typically 16-20%)
5. **WHEN** products are configured **THEN** they SHALL include plan features in the product description

**Plan Details**:
- **Free**: $0/month, 5 reports/month, 3 templates, 1GB storage
- **Professional**: $29/month ($290/year), 100 reports/month, 50 templates, 10GB storage
- **Practice**: $99/month ($990/year), 500 reports/month, 200 templates, 50GB storage
- **Enterprise**: Custom pricing, unlimited everything

### FR-3: Checkout Session Creation

**User Story**: As a user, I want to subscribe to a plan through a secure checkout flow so that I can access premium features.

**Acceptance Criteria**:

1. **WHEN** a user selects a plan **THEN** the system SHALL create a Stripe Checkout session with the selected price
2. **WHEN** creating a checkout session **THEN** the system SHALL link it to the user's Stripe customer ID or create a new customer
3. **WHEN** the checkout session is created **THEN** it SHALL include the user's Supabase ID in metadata
4. **WHEN** redirecting to checkout **THEN** the system SHALL provide success and cancel URLs
5. **WHEN** checkout completes successfully **THEN** the user SHALL be redirected to the dashboard with confirmation
6. **IF** the user cancels checkout **THEN** they SHALL be redirected to the pricing page
7. **WHEN** creating a session **THEN** the system SHALL enable promotion codes for discounts
8. **WHEN** collecting billing information **THEN** Stripe SHALL automatically collect the billing address

### FR-4: Stripe Customer Management

**User Story**: As the system, I want to maintain Stripe customer records for each user so that subscriptions and payments can be tracked.

**Acceptance Criteria**:

1. **WHEN** a user first subscribes **THEN** the system SHALL create a Stripe customer with their email
2. **WHEN** creating a customer **THEN** the system SHALL store the Stripe customer ID in the users table
3. **WHEN** a customer is created **THEN** it SHALL include the Supabase user ID in metadata
4. **IF** a user already has a Stripe customer ID **THEN** the system SHALL reuse it for new subscriptions
5. **WHEN** user email changes in Supabase **THEN** the system SHALL update the Stripe customer email
6. **WHEN** a user is deleted **THEN** their Stripe customer SHALL remain for historical records

### FR-5: Customer Portal Access

**User Story**: As a user, I want to manage my subscription through the Stripe Customer Portal so that I can update payment methods and view invoices.

**Acceptance Criteria**:

1. **WHEN** a user clicks "Manage Subscription" **THEN** the system SHALL create a Stripe Customer Portal session
2. **WHEN** creating a portal session **THEN** the system SHALL use the user's Stripe customer ID
3. **WHEN** the portal session is created **THEN** it SHALL redirect the user to the Stripe portal URL
4. **WHEN** the user completes portal actions **THEN** they SHALL be redirected back to the dashboard
5. **IF** the user has no Stripe customer ID **THEN** the system SHALL return an error indicating no billing account exists
6. **WHEN** in the portal **THEN** users SHALL be able to update payment methods, view invoices, and cancel subscriptions

### FR-6: Webhook Signature Verification

**User Story**: As a developer, I want to verify webhook signatures so that only authentic Stripe events are processed.

**Acceptance Criteria**:

1. **WHEN** a webhook is received **THEN** the system SHALL verify the signature using the webhook secret
2. **IF** the signature is invalid **THEN** the system SHALL return a 400 error and log the attempt
3. **WHEN** the signature is valid **THEN** the system SHALL parse the event and process it
4. **IF** the webhook secret is missing **THEN** the application SHALL fail to start with a configuration error
5. **WHEN** an event is processed **THEN** the system SHALL log the event type and processing result

### FR-7: Subscription Lifecycle Webhooks

**User Story**: As the system, I want to handle Stripe subscription events so that the database reflects the current subscription state.

**Acceptance Criteria**:

#### Event: customer.subscription.created

1. **WHEN** a subscription is created **THEN** the system SHALL extract the user ID from metadata
2. **WHEN** the user ID is found **THEN** the system SHALL insert a new subscription record in Supabase
3. **WHEN** inserting the subscription **THEN** it SHALL include stripe_subscription_id, stripe_customer_id, stripe_price_id, plan_name, status, current_period_start, current_period_end, amount, currency, interval
4. **WHEN** the plan_name is determined **THEN** it SHALL map from the price ID using metadata or environment variables
5. **IF** the subscription has a trial **THEN** trial_start and trial_end SHALL be recorded

#### Event: customer.subscription.updated

1. **WHEN** a subscription is updated **THEN** the system SHALL find the subscription by stripe_subscription_id
2. **WHEN** the subscription is found **THEN** the system SHALL update plan_name, status, current_period_start, current_period_end, cancel_at_period_end, canceled_at
3. **IF** the plan changed **THEN** the new plan_name SHALL be reflected immediately
4. **IF** the status changed to 'canceled' **THEN** cancel_at_period_end SHALL be set
5. **WHEN** updating **THEN** the updated_at timestamp SHALL be set to NOW()

#### Event: customer.subscription.deleted

1. **WHEN** a subscription is deleted **THEN** the system SHALL find the subscription by stripe_subscription_id
2. **WHEN** the subscription is found **THEN** the system SHALL update status to 'canceled'
3. **WHEN** canceling **THEN** canceled_at SHALL be set to the current timestamp
4. **WHEN** a subscription is canceled **THEN** the user SHALL retain access until current_period_end

#### Event: invoice.payment_succeeded

1. **WHEN** a payment succeeds **THEN** the system SHALL record it in the payments table
2. **WHEN** recording payment **THEN** it SHALL include stripe_payment_intent_id, stripe_invoice_id, amount, currency, status, payment_method
3. **WHEN** a renewal payment succeeds **THEN** the subscription's current_period_start and current_period_end SHALL be updated
4. **WHEN** a new billing period starts **THEN** usage counters SHALL be reset (handled by usage tracking)
5. **IF** this is the first successful payment **THEN** the subscription status SHALL be set to 'active'

#### Event: invoice.payment_failed

1. **WHEN** a payment fails **THEN** the system SHALL record it in the payments table with status 'failed'
2. **WHEN** recording the failure **THEN** failure_reason SHALL be included if available
3. **WHEN** a payment fails **THEN** the subscription status SHALL be updated to 'past_due'
4. **WHEN** the status is 'past_due' **THEN** the system SHALL restrict user access to paid features
5. **IF** Stripe retries succeed later **THEN** the subscription status SHALL be updated via subscription.updated webhook

#### Event: customer.updated

1. **WHEN** a customer is updated in Stripe **THEN** the system SHALL update the users table if email changed
2. **WHEN** updating the user **THEN** only the Stripe-related fields SHALL be modified
3. **IF** the customer ID doesn't match any user **THEN** the event SHALL be logged and ignored

### FR-8: Usage Tracking and Limit Enforcement

**User Story**: As the system, I want to track usage and enforce plan limits so that users are billed appropriately and cannot exceed their plan allowances.

**Acceptance Criteria**:

1. **WHEN** a user generates a report **THEN** the system SHALL check their current usage against their plan limit
2. **IF** usage is below the limit **THEN** the report SHALL be generated and usage SHALL be recorded
3. **IF** usage equals or exceeds the limit **THEN** the system SHALL return an error indicating the limit is reached
4. **WHEN** recording usage **THEN** the system SHALL insert a record in usage_records with user_id, subscription_id, report_id, usage_type, billing_period_start, billing_period_end
5. **WHEN** a new billing period starts **THEN** usage tracking SHALL automatically count from the new period
6. **WHEN** retrieving current usage **THEN** the system SHALL count records within the current billing period
7. **IF** a user has no active subscription **THEN** they SHALL default to free plan limits
8. **WHEN** a subscription upgrades **THEN** the new limits SHALL apply immediately

### FR-9: Usage Retrieval API

**User Story**: As a user, I want to view my current usage so that I can track how many reports I have left in my billing period.

**Acceptance Criteria**:

1. **WHEN** requesting usage data **THEN** the system SHALL return current usage count, plan limit, percentage used
2. **WHEN** calculating usage **THEN** the system SHALL filter by the current billing period
3. **WHEN** returning usage **THEN** it SHALL include days remaining in the billing period
4. **IF** usage exceeds 80% **THEN** the response SHALL include a warning flag
5. **WHEN** the user has multiple usage types **THEN** each type SHALL be returned separately (reports, transcriptions, exports)
6. **IF** the user has no active subscription **THEN** free plan limits SHALL be returned

### FR-10: Idempotent Webhook Processing

**User Story**: As a developer, I want webhook processing to be idempotent so that duplicate events don't cause data corruption.

**Acceptance Criteria**:

1. **WHEN** a webhook event is received **THEN** the system SHALL check if the event has already been processed
2. **IF** the event was already processed **THEN** the system SHALL return success without re-processing
3. **WHEN** processing an event **THEN** the system SHALL use upsert operations where possible
4. **IF** a subscription already exists **THEN** updates SHALL not create duplicates
5. **WHEN** Stripe retries a webhook **THEN** it SHALL not cause duplicate database records

---

## 🔒 Non-Functional Requirements

### NFR-1: Security

**Acceptance Criteria**:

1. **WHEN** storing API keys **THEN** they SHALL be in environment variables, never in code
2. **WHEN** transmitting payment data **THEN** it SHALL use HTTPS only (enforced by Stripe Checkout)
3. **WHEN** handling webhook events **THEN** signature verification SHALL be mandatory
4. **WHEN** accessing billing APIs **THEN** user authentication SHALL be required
5. **WHEN** storing customer data **THEN** only essential information SHALL be kept in Supabase
6. **WHEN** implementing payment flows **THEN** PCI DSS compliance SHALL be maintained (Stripe handles this)
7. **IF** a security vulnerability is detected **THEN** it SHALL be patched within 24 hours

### NFR-2: Reliability

**Acceptance Criteria**:

1. **WHEN** a webhook fails to process **THEN** Stripe SHALL automatically retry up to 3 times
2. **WHEN** Stripe API calls fail **THEN** the system SHALL retry with exponential backoff
3. **IF** Stripe is unavailable **THEN** the system SHALL queue operations and retry
4. **WHEN** processing webhooks **THEN** the success rate SHALL be > 99%
5. **IF** database operations fail **THEN** webhook processing SHALL return 500 to trigger Stripe retry
6. **WHEN** a subscription is canceled **THEN** access SHALL continue until period end (no immediate revocation)

### NFR-3: Performance

**Acceptance Criteria**:

1. **WHEN** creating a checkout session **THEN** the response SHALL be returned in < 2 seconds
2. **WHEN** processing a webhook **THEN** it SHALL complete in < 5 seconds
3. **WHEN** checking usage limits **THEN** the query SHALL execute in < 200ms
4. **WHEN** creating a portal session **THEN** the response SHALL be returned in < 1 second
5. **IF** API response times exceed thresholds **THEN** alerts SHALL be triggered

### NFR-4: Data Consistency

**Acceptance Criteria**:

1. **WHEN** a subscription changes in Stripe **THEN** Supabase SHALL reflect the change within 30 seconds
2. **IF** a webhook is delayed **THEN** the system SHALL still process it correctly
3. **WHEN** multiple webhooks arrive out of order **THEN** the final state SHALL be correct
4. **WHEN** usage is recorded **THEN** it SHALL immediately affect limit checks
5. **IF** Stripe and Supabase are out of sync **THEN** Stripe SHALL be the source of truth

### NFR-5: Observability

**Acceptance Criteria**:

1. **WHEN** webhooks are received **THEN** they SHALL be logged with timestamp, event type, and processing result
2. **IF** an error occurs **THEN** it SHALL be logged with full context (event ID, user ID, error message)
3. **WHEN** subscriptions change **THEN** the change SHALL be logged for audit purposes
4. **WHEN** usage limits are hit **THEN** it SHALL be logged and tracked in analytics
5. **WHEN** payments fail **THEN** alerts SHALL be sent to administrators

---

## 🔌 API Contracts

### POST /api/billing/checkout

**Purpose**: Create a Stripe Checkout session for subscription purchase

**Request**:
```typescript
{
  priceId: string;           // Stripe price ID (e.g., price_xxx)
  successUrl?: string;       // Optional custom success URL
  cancelUrl?: string;        // Optional custom cancel URL
}
```

**Response**:
```typescript
{
  sessionId: string;         // Stripe Checkout session ID
  url: string;               // Redirect URL to Stripe Checkout
}
```

**Error Responses**:
- 401: User not authenticated
- 400: Invalid price ID
- 500: Failed to create session

### POST /api/billing/portal

**Purpose**: Create a Stripe Customer Portal session

**Request**: Empty body (user derived from auth)

**Response**:
```typescript
{
  url: string;               // Redirect URL to Stripe Portal
}
```

**Error Responses**:
- 401: User not authenticated
- 404: No billing account found
- 500: Failed to create portal session

### GET /api/billing/usage

**Purpose**: Retrieve current usage and limits for authenticated user

**Query Parameters**:
```typescript
?usageType=report_generated  // Optional: filter by usage type
```

**Response**:
```typescript
{
  usage: {
    report_generated: {
      current: number;       // Current usage count
      limit: number;         // Plan limit
      percentage: number;    // Usage percentage (0-100)
      allowed: boolean;      // Whether more usage is allowed
      warningThreshold: boolean; // True if > 80%
    },
    transcription: { /* same structure */ },
    export: { /* same structure */ }
  },
  subscription: {
    plan_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    days_remaining: number;
  }
}
```

**Error Responses**:
- 401: User not authenticated
- 500: Failed to retrieve usage

### POST /api/webhooks/stripe

**Purpose**: Handle Stripe webhook events

**Headers**:
```
stripe-signature: <signature>
```

**Request**: Raw Stripe event JSON

**Response**:
```typescript
{
  received: true
}
```

**Error Responses**:
- 400: Invalid signature
- 500: Webhook processing failed

**Events Handled**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.updated`

---

## 🗄️ Database Integration

### Tables Used

1. **users**: Store stripe_customer_id
2. **subscriptions**: Store subscription records synced from Stripe
3. **subscription_limits**: Read plan limits for enforcement
4. **usage_records**: Record usage for billing periods
5. **payments** (optional): Track payment history

### Key Operations

**Create/Update Subscription**:
```typescript
await supabase.from('subscriptions').upsert({
  user_id: userId,
  stripe_subscription_id: subscription.id,
  stripe_customer_id: subscription.customer,
  stripe_price_id: subscription.items.data[0].price.id,
  plan_name: planName,
  status: subscription.status,
  current_period_start: new Date(subscription.current_period_start * 1000),
  current_period_end: new Date(subscription.current_period_end * 1000),
  amount: subscription.items.data[0].price.unit_amount,
  currency: subscription.currency,
  interval: subscription.items.data[0].price.recurring.interval,
})
```

**Record Usage**:
```typescript
await supabase.from('usage_records').insert({
  user_id: userId,
  subscription_id: subscriptionId,
  report_id: reportId,
  usage_type: 'report_generated',
  quantity: 1,
  billing_period_start: subscription.current_period_start,
  billing_period_end: subscription.current_period_end,
})
```

**Check Usage Limit**:
```typescript
const { count } = await supabase
  .from('usage_records')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('usage_type', 'report_generated')
  .gte('created_at', currentPeriodStart)
  .lte('created_at', currentPeriodEnd);

const limit = subscription.subscription_limits.reports_per_month;
if (count >= limit) {
  throw new Error('Usage limit exceeded');
}
```

---

## 🧪 Testing Requirements

### Unit Tests

1. **Stripe Client Initialization**
   - Validates API key presence
   - Validates TypeScript types
   - Handles missing configuration

2. **Price ID Mapping**
   - Maps Stripe price IDs to plan names
   - Handles unknown price IDs
   - Validates environment variables

3. **Webhook Signature Verification**
   - Validates correct signatures
   - Rejects invalid signatures
   - Handles missing secrets

4. **Usage Limit Calculation**
   - Calculates usage within billing period
   - Handles multiple usage types
   - Respects plan limits

### Integration Tests

1. **Checkout Flow**
   - Creates Stripe customer
   - Creates checkout session
   - Includes correct metadata
   - Returns valid redirect URL

2. **Webhook Processing**
   - Processes subscription.created
   - Processes subscription.updated
   - Processes subscription.deleted
   - Processes invoice.payment_succeeded
   - Processes invoice.payment_failed
   - Handles idempotency

3. **Usage Tracking**
   - Records usage correctly
   - Enforces limits
   - Resets on new billing period

### E2E Tests

1. **Full Subscription Flow**
   - User signs up
   - Selects plan
   - Completes Stripe Checkout
   - Webhook processes subscription
   - Database reflects active subscription
   - User can generate reports

2. **Subscription Management**
   - User opens Customer Portal
   - Updates payment method
   - Upgrades plan
   - Cancels subscription
   - Access continues until period end

---

## 🚀 Implementation Phases

### Phase 1: Setup (2 hours)
- Install Stripe SDK
- Configure environment variables
- Create Stripe client
- Set up price ID mapping

### Phase 2: Checkout & Portal (2 hours)
- Implement checkout session creation
- Implement customer creation/retrieval
- Implement portal session creation
- Add API routes

### Phase 3: Webhooks (3 hours)
- Implement webhook signature verification
- Implement subscription.created handler
- Implement subscription.updated handler
- Implement subscription.deleted handler
- Implement invoice.payment_succeeded handler
- Implement invoice.payment_failed handler
- Add idempotency checks

### Phase 4: Usage Tracking (2 hours)
- Implement usage recording
- Implement limit checking
- Implement usage retrieval API
- Add usage middleware

### Phase 5: Testing (2 hours)
- Write unit tests
- Write integration tests
- Test with Stripe CLI
- Test webhook retry logic

---

## 📚 References

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Node.js SDK**: https://github.com/stripe/stripe-node
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Stripe Checkout**: https://stripe.com/docs/payments/checkout
- **Stripe Customer Portal**: https://stripe.com/docs/billing/subscriptions/customer-portal
- **Feature 1.3 Spec**: Database schema and subscription tables
- **Feature 1.4 Spec**: Authentication system
- **docs/05-INTEGRATIONS/STRIPE.md**: Detailed Stripe integration guide

---

**Specification Version**: 1.0
**Last Updated**: 2025-01-16
**Author**: Requirements Analyst Agent
