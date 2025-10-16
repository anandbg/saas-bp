# Feature 1.5 - Stripe Integration - Acceptance Criteria

**Feature**: Stripe Integration Setup
**Version**: 1.0
**Date**: January 2025

---

## 🎯 Overview

This document defines detailed acceptance criteria, test scenarios, edge cases, and success metrics for the Stripe integration feature. All criteria must be met before the feature is considered complete.

---

## ✅ Acceptance Criteria by Requirement

### AC-1: Stripe SDK Configuration

**Requirement**: FR-1

- [ ] Stripe client initialized with secret key from `STRIPE_SECRET_KEY` environment variable
- [ ] API version set to `2024-12-18.acacia` or newer
- [ ] TypeScript types fully inferred for all Stripe API calls
- [ ] Application throws error on startup if `STRIPE_SECRET_KEY` is missing
- [ ] Application throws error if any price ID environment variables are missing
- [ ] Price IDs loaded from environment variables: `STRIPE_PRICE_PROFESSIONAL_MONTHLY`, `STRIPE_PRICE_PROFESSIONAL_YEARLY`, `STRIPE_PRICE_PRACTICE_MONTHLY`, `STRIPE_PRICE_PRACTICE_YEARLY`

**Test Scenarios**:

1. **Valid Configuration**
   - Start application with all Stripe environment variables
   - Verify Stripe client created successfully
   - Verify API calls work

2. **Missing API Key**
   - Remove `STRIPE_SECRET_KEY` from environment
   - Start application
   - Verify startup error with clear message

3. **Invalid API Key**
   - Set invalid API key
   - Make Stripe API call
   - Verify error handling

---

### AC-2: Subscription Plan Products

**Requirement**: FR-2

- [ ] Four Stripe products created: Free, Professional, Practice, Enterprise
- [ ] Professional plan has monthly price ($29) and yearly price ($290)
- [ ] Practice plan has monthly price ($99) and yearly price ($990)
- [ ] Yearly prices include ~16-20% discount
- [ ] Each price includes metadata: `plan_name` field matching database
- [ ] Product descriptions include plan features
- [ ] Free plan does not have Stripe product (handled in code)
- [ ] Enterprise plan configured for custom pricing

**Test Scenarios**:

1. **Verify Product Creation**
   - List products in Stripe Dashboard
   - Verify 3 products exist (Professional, Practice, Enterprise)
   - Verify metadata is correct

2. **Verify Price Configuration**
   - Check Professional monthly: $29.00
   - Check Professional yearly: $290.00 (16.55% discount)
   - Check Practice monthly: $99.00
   - Check Practice yearly: $990.00 (16.67% discount)

3. **Verify Metadata**
   - Check each price has `plan_name` in metadata
   - Verify plan_name matches database values

---

### AC-3: Checkout Session Creation

**Requirement**: FR-3

- [ ] API endpoint `/api/billing/checkout` accepts POST requests
- [ ] Endpoint requires authentication (returns 401 if not authenticated)
- [ ] Validates `priceId` parameter (returns 400 if missing/invalid)
- [ ] Creates or retrieves Stripe customer for user
- [ ] Stores `stripe_customer_id` in users table
- [ ] Creates checkout session with correct price
- [ ] Includes user's Supabase ID in session metadata
- [ ] Sets success URL (default: `/dashboard?session_id={CHECKOUT_SESSION_ID}`)
- [ ] Sets cancel URL (default: `/pricing`)
- [ ] Enables promotion codes
- [ ] Collects billing address automatically
- [ ] Returns `sessionId` and `url` in response

**Test Scenarios**:

1. **New User Subscription**
   - Authenticate as new user (no Stripe customer)
   - Call `/api/billing/checkout` with Professional monthly price
   - Verify Stripe customer created
   - Verify customer ID saved in database
   - Verify checkout session created
   - Visit checkout URL
   - Complete payment with test card (4242 4242 4242 4242)
   - Verify redirect to success URL

2. **Existing Customer Subscription**
   - Authenticate as user with existing Stripe customer
   - Call `/api/billing/checkout` with Practice monthly price
   - Verify existing customer ID reused
   - Verify checkout session created

3. **Authentication Required**
   - Call `/api/billing/checkout` without authentication
   - Verify 401 error returned

4. **Invalid Price ID**
   - Call endpoint with non-existent price ID
   - Verify 400 error returned

5. **Promotion Code**
   - Create promotion code in Stripe
   - Complete checkout flow
   - Enter promotion code
   - Verify discount applied

---

### AC-4: Stripe Customer Management

**Requirement**: FR-4

- [ ] Stripe customer created on first subscription with user's email
- [ ] Customer includes `supabase_user_id` in metadata
- [ ] Customer ID stored in `users.stripe_customer_id`
- [ ] Existing customer ID reused for subsequent subscriptions
- [ ] Customer email updated if user email changes

**Test Scenarios**:

1. **First Subscription**
   - User has no Stripe customer
   - Create checkout session
   - Verify new customer created in Stripe
   - Verify customer has user's email
   - Verify metadata includes Supabase user ID
   - Verify customer ID saved to database

2. **Repeat Subscription**
   - User already has Stripe customer
   - Create new checkout session
   - Verify same customer ID used
   - Verify no duplicate customer created

3. **Email Update Synchronization**
   - User updates email in Supabase
   - Trigger customer update webhook
   - Verify user record updated

---

### AC-5: Customer Portal Access

**Requirement**: FR-5

- [ ] API endpoint `/api/billing/portal` accepts POST requests
- [ ] Endpoint requires authentication
- [ ] Retrieves user's Stripe customer ID from database
- [ ] Returns 404 if user has no Stripe customer
- [ ] Creates Stripe Customer Portal session
- [ ] Sets return URL to `/dashboard`
- [ ] Returns portal `url` in response
- [ ] Portal allows payment method updates
- [ ] Portal shows invoice history
- [ ] Portal allows subscription cancellation

**Test Scenarios**:

1. **Access Portal**
   - Authenticate as user with active subscription
   - Call `/api/billing/portal`
   - Verify portal session created
   - Visit portal URL
   - Verify user can see subscription details
   - Verify user can update payment method
   - Verify user can download invoices

2. **No Billing Account**
   - Authenticate as user with no Stripe customer
   - Call `/api/billing/portal`
   - Verify 404 error returned

3. **Cancel Subscription via Portal**
   - Access portal
   - Cancel subscription
   - Verify cancellation scheduled for period end
   - Verify user retains access until period end
   - Verify webhook updates database

---

### AC-6: Webhook Signature Verification

**Requirement**: FR-6

- [ ] Webhook endpoint `/api/webhooks/stripe` accepts POST requests
- [ ] Endpoint does NOT require authentication (verified via signature)
- [ ] Verifies `stripe-signature` header using webhook secret
- [ ] Returns 400 if signature invalid
- [ ] Logs invalid signature attempts
- [ ] Parses event if signature valid
- [ ] Application fails to start if `STRIPE_WEBHOOK_SECRET` missing

**Test Scenarios**:

1. **Valid Signature**
   - Send webhook with correct signature
   - Verify event processed
   - Verify 200 response

2. **Invalid Signature**
   - Send webhook with incorrect signature
   - Verify 400 error returned
   - Verify event not processed
   - Verify attempt logged

3. **Missing Signature**
   - Send webhook without signature header
   - Verify 400 error returned

4. **Test with Stripe CLI**
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Trigger test event
   - Verify event received and processed

---

### AC-7: Subscription Created Webhook

**Requirement**: FR-7 (customer.subscription.created)

- [ ] Extracts `supabase_user_id` from subscription metadata
- [ ] Maps price ID to plan name
- [ ] Inserts subscription record in database with:
  - user_id
  - stripe_subscription_id
  - stripe_customer_id
  - stripe_price_id
  - plan_name
  - status
  - current_period_start (converted from Unix timestamp)
  - current_period_end (converted from Unix timestamp)
  - amount
  - currency
  - interval
  - trial_start (if applicable)
  - trial_end (if applicable)
- [ ] Returns 200 response

**Test Scenarios**:

1. **New Subscription**
   - Complete checkout for new subscription
   - Wait for webhook (usually < 5 seconds)
   - Verify subscription record created in database
   - Verify all fields populated correctly
   - Verify timestamps converted correctly

2. **Subscription with Trial**
   - Create subscription with trial period
   - Verify trial_start and trial_end recorded
   - Verify status is 'trialing'

3. **Missing User Metadata**
   - Send webhook without user metadata
   - Verify error logged
   - Verify graceful failure

---

### AC-8: Subscription Updated Webhook

**Requirement**: FR-7 (customer.subscription.updated)

- [ ] Finds subscription by stripe_subscription_id
- [ ] Updates plan_name if price changed
- [ ] Updates status
- [ ] Updates current_period_start and current_period_end
- [ ] Updates cancel_at_period_end
- [ ] Updates canceled_at if subscription canceled
- [ ] Updates updated_at timestamp
- [ ] Returns 200 response

**Test Scenarios**:

1. **Plan Upgrade**
   - User upgrades from Professional to Practice
   - Verify plan_name updated to 'practice'
   - Verify amount updated
   - Verify proration handling

2. **Subscription Cancellation Scheduled**
   - User cancels subscription via portal
   - Verify cancel_at_period_end set to true
   - Verify status remains 'active'
   - Verify access continues

3. **Status Change**
   - Subscription moves to 'past_due' (payment failed)
   - Verify status updated
   - Verify access restricted

---

### AC-9: Subscription Deleted Webhook

**Requirement**: FR-7 (customer.subscription.deleted)

- [ ] Finds subscription by stripe_subscription_id
- [ ] Updates status to 'canceled'
- [ ] Sets canceled_at to current timestamp
- [ ] User loses access to paid features
- [ ] Returns 200 response

**Test Scenarios**:

1. **End of Canceled Period**
   - Subscription canceled, period ends
   - Webhook fires
   - Verify status set to 'canceled'
   - Verify canceled_at timestamp
   - Verify user access removed

2. **Immediate Cancellation**
   - Admin cancels subscription immediately in Stripe
   - Verify database updated
   - Verify access removed

---

### AC-10: Payment Succeeded Webhook

**Requirement**: FR-7 (invoice.payment_succeeded)

- [ ] Records payment in payments table (optional)
- [ ] Updates subscription billing period if renewal
- [ ] Resets usage counters for new period
- [ ] Sets subscription status to 'active' if first payment
- [ ] Returns 200 response

**Test Scenarios**:

1. **First Payment**
   - Complete checkout
   - Verify payment recorded
   - Verify subscription active
   - Verify usage counter at 0

2. **Renewal Payment**
   - Wait for subscription renewal
   - Verify payment recorded
   - Verify billing period updated
   - Verify usage reset

3. **Payment After Past Due**
   - Subscription in 'past_due'
   - Payment succeeds
   - Verify status returns to 'active'
   - Verify access restored

---

### AC-11: Payment Failed Webhook

**Requirement**: FR-7 (invoice.payment_failed)

- [ ] Records failed payment in payments table with failure_reason
- [ ] Updates subscription status to 'past_due'
- [ ] Restricts user access to paid features
- [ ] Logs failure for admin notification
- [ ] Returns 200 response

**Test Scenarios**:

1. **Card Declined**
   - Renewal payment fails (use test card 4000 0000 0000 0002)
   - Verify payment failure recorded
   - Verify status set to 'past_due'
   - Verify user cannot generate reports
   - Verify error message to user

2. **Retry Successful**
   - Payment fails initially
   - Stripe retries
   - Payment succeeds
   - Verify status restored to 'active'

---

### AC-12: Usage Recording

**Requirement**: FR-8

- [ ] Records usage when report generated
- [ ] Includes user_id, subscription_id, report_id, usage_type
- [ ] Includes billing_period_start and billing_period_end
- [ ] Timestamps usage with created_at
- [ ] Usage query filters by current billing period

**Test Scenarios**:

1. **Record Report Generation**
   - User generates report
   - Verify usage record created
   - Verify all fields populated
   - Verify billing period matches subscription

2. **Multiple Usage Types**
   - Generate report (usage_type: report_generated)
   - Transcribe audio (usage_type: transcription)
   - Export report (usage_type: export)
   - Verify separate records for each type

---

### AC-13: Usage Limit Enforcement

**Requirement**: FR-8

- [ ] Checks usage before allowing report generation
- [ ] Counts usage within current billing period
- [ ] Compares count to plan limit
- [ ] Allows generation if under limit
- [ ] Blocks generation if at/over limit with clear error message
- [ ] Free plan users restricted to 5 reports/month

**Test Scenarios**:

1. **Under Limit**
   - User with Professional plan (100 reports/month)
   - Generate 50 reports
   - Verify all succeed
   - Check usage: 50/100

2. **At Limit**
   - User with Professional plan
   - Generate 100 reports
   - Attempt 101st report
   - Verify blocked with error: "Usage limit exceeded"

3. **New Billing Period**
   - User at limit in current period
   - Billing period ends (simulate or wait)
   - Verify usage resets
   - Verify user can generate reports again

4. **Free Plan Enforcement**
   - User with no subscription
   - Generate 5 reports
   - Attempt 6th report
   - Verify blocked

5. **Plan Upgrade Mid-Period**
   - User with Professional plan at 98/100
   - Upgrade to Practice plan (500/month)
   - Verify new limit applied immediately
   - Verify user can generate more reports

---

### AC-14: Usage Retrieval API

**Requirement**: FR-9

- [ ] Endpoint `/api/billing/usage` requires authentication
- [ ] Returns current usage for all usage types
- [ ] Returns plan limits
- [ ] Returns percentage used
- [ ] Returns days remaining in billing period
- [ ] Includes warning flag if usage > 80%
- [ ] Returns free plan limits if no subscription

**Test Scenarios**:

1. **Active Subscription Usage**
   - User with Professional plan
   - Generated 45 reports in current period
   - Call `/api/billing/usage`
   - Verify response:
     ```json
     {
       "usage": {
         "report_generated": {
           "current": 45,
           "limit": 100,
           "percentage": 45,
           "allowed": true,
           "warningThreshold": false
         }
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

2. **Warning Threshold**
   - User at 85/100 reports
   - Call endpoint
   - Verify `warningThreshold: true`

3. **No Subscription**
   - User without subscription
   - Call endpoint
   - Verify free plan limits returned (5 reports/month)

---

### AC-15: Webhook Idempotency

**Requirement**: FR-10

- [ ] Duplicate webhook events do not create duplicate records
- [ ] Uses upsert operations for subscriptions
- [ ] Handles out-of-order webhook delivery
- [ ] Stripe event IDs could be tracked to prevent reprocessing (optional enhancement)

**Test Scenarios**:

1. **Duplicate Event**
   - Process subscription.created webhook
   - Verify subscription created
   - Replay same webhook
   - Verify no duplicate subscription
   - Verify 200 response (idempotent)

2. **Out of Order Events**
   - Receive subscription.updated before subscription.created (edge case)
   - Verify system handles gracefully
   - Verify final state is correct

---

## 🧪 Edge Cases and Error Handling

### Edge Case 1: Stripe API Timeout

**Scenario**: Stripe API call times out during checkout session creation

**Expected Behavior**:
- Return 500 error to user
- Log timeout error
- User can retry

**Test**:
- Mock Stripe API timeout
- Verify error handling
- Verify user sees retry option

---

### Edge Case 2: Webhook Out of Sync

**Scenario**: User's subscription changes in Stripe but webhook hasn't arrived yet

**Expected Behavior**:
- User sees old subscription data temporarily
- Webhook arrives within 30 seconds (per NFR-4)
- Database updates
- User sees new subscription on next page load

**Test**:
- Delay webhook processing
- Verify eventual consistency
- Verify no data corruption

---

### Edge Case 3: User Deleted During Active Subscription

**Scenario**: User account deleted while subscription active

**Expected Behavior**:
- Stripe customer and subscription remain
- Database records soft-deleted or marked inactive
- No automatic cancellation of Stripe subscription
- Admin must manually handle

**Test**:
- Delete user with active subscription
- Verify subscription not canceled
- Verify Stripe customer accessible

---

### Edge Case 4: Multiple Simultaneous Subscriptions

**Scenario**: User attempts to create multiple subscriptions simultaneously

**Expected Behavior**:
- Database constraint prevents multiple active subscriptions per user
- Second subscription fails with error
- User can cancel first, then create second

**Test**:
- Create checkout session
- Before completing, create another checkout session
- Complete first checkout
- Attempt to complete second checkout
- Verify error or second subscription cancels first

---

### Edge Case 5: Webhook Replay Attack

**Scenario**: Attacker replays valid webhook with same signature

**Expected Behavior**:
- Signature verification passes (valid)
- Idempotency prevents duplicate processing
- No harm done

**Test**:
- Capture valid webhook
- Replay multiple times
- Verify no duplicates created

---

### Edge Case 6: Price ID Environment Variable Missing

**Scenario**: One price ID not configured

**Expected Behavior**:
- Application startup fails with clear error
- Indicates which price ID is missing

**Test**:
- Remove STRIPE_PRICE_PROFESSIONAL_MONTHLY
- Start application
- Verify startup error

---

### Edge Case 7: User at Exactly 100% Usage

**Scenario**: User has used exactly their limit (100/100 reports)

**Expected Behavior**:
- Next report blocked
- Clear error message
- Usage API shows 100% with warningThreshold: true

**Test**:
- Set user at 100/100
- Attempt report generation
- Verify blocked
- Check usage API

---

### Edge Case 8: Subscription Cancels Before Webhook Processed

**Scenario**: User cancels subscription immediately after subscribing

**Expected Behavior**:
- subscription.created webhook creates subscription
- subscription.deleted webhook updates status
- Final state: canceled subscription in database
- User sees canceled status

**Test**:
- Complete checkout
- Immediately cancel in Stripe Dashboard
- Verify both webhooks process
- Verify final status is 'canceled'

---

### Edge Case 9: Payment Method Update

**Scenario**: User updates payment method in Customer Portal

**Expected Behavior**:
- Payment method updated in Stripe
- No webhook sent (Stripe only sends subscription webhooks)
- Next renewal uses new payment method

**Test**:
- Access Customer Portal
- Update payment method
- Verify change reflected in Stripe
- Wait for renewal
- Verify new method charged

---

### Edge Case 10: Proration on Plan Change

**Scenario**: User upgrades from Professional ($29/mo) to Practice ($99/mo) mid-cycle

**Expected Behavior**:
- Stripe automatically prorates
- subscription.updated webhook fires
- Database reflects new plan
- New limits apply immediately
- Usage count preserved

**Test**:
- Subscribe to Professional plan
- Generate 50 reports (under 100 limit)
- Upgrade to Practice plan
- Verify plan_name updated
- Verify can generate 450 more reports (500 limit - 50 used)

---

## 📊 Success Metrics

### Critical Metrics

1. **Webhook Processing Success Rate**
   - Target: > 99%
   - Measurement: (Successful webhooks / Total webhooks) × 100
   - Threshold: Alert if < 99%

2. **Checkout Completion Rate**
   - Target: > 70%
   - Measurement: (Completed checkouts / Started checkouts) × 100
   - Threshold: Investigate if < 60%

3. **Payment Success Rate**
   - Target: > 95%
   - Measurement: (Successful payments / Total payment attempts) × 100
   - Threshold: Alert if < 90%

4. **Webhook Processing Time**
   - Target: < 5 seconds
   - Measurement: Time from webhook received to database updated
   - Threshold: Alert if > 10 seconds

5. **Data Sync Accuracy**
   - Target: 100%
   - Measurement: Periodic audit of Stripe vs Supabase
   - Threshold: Alert on any discrepancy

### Performance Metrics

1. **Checkout Session Creation Time**
   - Target: < 2 seconds (NFR-3)
   - p50: < 1 second
   - p95: < 2 seconds
   - p99: < 3 seconds

2. **Usage Check Latency**
   - Target: < 200ms (NFR-3)
   - p50: < 100ms
   - p95: < 200ms
   - p99: < 300ms

3. **Portal Session Creation Time**
   - Target: < 1 second (NFR-3)
   - p50: < 500ms
   - p95: < 1 second
   - p99: < 1.5 seconds

### Business Metrics

1. **Subscription Conversion Rate**
   - Measurement: (Paid subscriptions / Total signups) × 100
   - Baseline: Track for first month

2. **Churn Rate**
   - Measurement: (Canceled subscriptions / Active subscriptions) × 100
   - Baseline: Track for first month

3. **Average Revenue Per User (ARPU)**
   - Measurement: Total MRR / Active subscriptions
   - Baseline: Track for first month

4. **Failed Payment Recovery Rate**
   - Measurement: (Recovered payments / Failed payments) × 100
   - Target: > 30%

---

## 🔍 Verification Checklist

### Pre-Implementation

- [ ] All environment variables documented in .env.example
- [ ] Stripe test mode keys configured for development
- [ ] Stripe products created in test mode
- [ ] Webhook endpoint URL configured in Stripe Dashboard (test mode)

### Post-Implementation

- [ ] All acceptance criteria passing
- [ ] Unit tests written and passing (> 80% coverage)
- [ ] Integration tests written and passing
- [ ] E2E test for full subscription flow passing
- [ ] Tested with Stripe CLI (`stripe listen`)
- [ ] Tested with test cards (success, decline, 3D Secure)
- [ ] Error messages clear and user-friendly
- [ ] Loading states implemented for async operations
- [ ] Logs include sufficient context for debugging
- [ ] Alerts configured for critical failures
- [ ] Documentation updated (API docs, setup guide)
- [ ] Code reviewed by another developer
- [ ] Security review completed
- [ ] Performance benchmarks met

### Production Readiness

- [ ] Stripe production mode keys configured
- [ ] Stripe products created in production mode
- [ ] Webhook endpoint URL configured in Stripe Dashboard (production mode)
- [ ] Webhook signing secret rotated for production
- [ ] Monitoring dashboards configured
- [ ] Alerts connected to notification system
- [ ] Runbook created for common issues
- [ ] Rollback plan documented
- [ ] Tested in staging environment
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Compliance review passed (PCI DSS)

---

## 📝 Notes

- Stripe test mode and production mode are completely separate
- Always test webhooks using Stripe CLI before deploying
- Idempotency is critical for webhook processing
- Usage limits enforced in real-time (not batch)
- Stripe is source of truth for subscription state
- Database should always sync within 30 seconds of Stripe changes
- Free plan users don't have Stripe subscriptions (handled in code logic)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
**Approved By**: Requirements Analyst Agent
