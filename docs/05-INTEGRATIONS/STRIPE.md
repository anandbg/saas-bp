# Stripe Integration Guide - Radiology Reporting App

**Version**: 1.0
**Date**: January 2025
**Status**: Design Complete

---

## 📋 Overview

This document details the Stripe billing integration for the Radiology Reporting App, replacing Outseta's billing functionality while using Supabase for authentication.

**Architecture**: Supabase Auth + Stripe Billing + Custom Subscription Management

---

## 🎯 Billing Requirements

### Subscription Plans

| Plan | Price | Features | Target Users |
|------|-------|----------|--------------|
| **Free** | $0/month | 5 reports/month, Basic templates, Community support | Trial users |
| **Professional** | $29/month | 100 reports/month, All templates, Real-time transcription, Email support | Individual practitioners |
| **Practice** | $99/month | 500 reports/month, Team collaboration, Priority support, Custom templates | Small practices |
| **Enterprise** | Custom | Unlimited reports, Dedicated support, Custom integrations, SLA | Large institutions |

### Metered Billing (Optional Add-on)
- **Extra Reports**: $0.50 per report beyond plan limit
- **Premium AI Models**: $1.00 per slow-brewed report with O3

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Next.js App)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  User Interface                                       │  │
│  │  ├── Signup/Login (Supabase Auth)                    │  │
│  │  ├── Subscription Management (Stripe Portal)         │  │
│  │  ├── Usage Dashboard                                 │  │
│  │  └── Payment Methods                                 │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  NEXT.JS API ROUTES                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  /api/billing                                         │  │
│  │  ├── /checkout (Create Checkout Session)             │  │
│  │  ├── /portal (Customer Portal)                       │  │
│  │  ├── /usage (Track usage)                            │  │
│  │  └── /webhooks/stripe (Handle events)                │  │
│  └───────────────────────────────────────────────────────┘  │
└──────┬────────────────────────┬────────────────────────┬────┘
       │                        │                        │
       ▼                        ▼                        ▼
  ┌─────────┐            ┌──────────┐           ┌──────────┐
  │Supabase │            │  Stripe  │           │ Vercel   │
  │   DB    │            │   API    │           │Analytics │
  │         │            │          │           │          │
  │• users  │            │• Payment │           │• Usage   │
  │• subs   │            │• Billing │           │• Metrics │
  │• usage  │            │• Portal  │           │          │
  └─────────┘            └──────────┘           └──────────┘
```

---

## 🗄️ Database Schema

### Updated Tables with Stripe

```sql
-- Users table (unchanged, managed by Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE, -- NEW: Link to Stripe Customer
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Subscription details
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'professional', 'practice', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),

  -- Billing periods
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Pricing
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),

  -- Metadata
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id) WHERE (status = 'active')
);

-- Usage tracking table
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage details
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('report_generated', 'transcription', 'export', 'api_call')),
  quantity INTEGER DEFAULT 1,

  -- Billing tracking
  metered BOOLEAN DEFAULT FALSE,
  cost_usd DECIMAL(10, 4),
  stripe_usage_record_id TEXT,

  -- Period tracking
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription limits table
CREATE TABLE subscription_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT UNIQUE NOT NULL,

  -- Feature limits
  reports_per_month INTEGER NOT NULL,
  templates_limit INTEGER,
  storage_gb INTEGER,
  team_members INTEGER DEFAULT 1,

  -- Feature flags
  real_time_transcription BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  slow_brewed_mode BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment history table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT,

  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'pending', 'failed')),

  payment_method TEXT,
  failure_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage"
  ON usage_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

-- Seed subscription limits
INSERT INTO subscription_limits (plan_name, reports_per_month, templates_limit, storage_gb, team_members, real_time_transcription, priority_support, custom_branding, api_access, slow_brewed_mode) VALUES
  ('free', 5, 3, 1, 1, FALSE, FALSE, FALSE, FALSE, FALSE),
  ('professional', 100, 50, 10, 1, TRUE, FALSE, FALSE, FALSE, TRUE),
  ('practice', 500, 200, 50, 10, TRUE, TRUE, TRUE, FALSE, TRUE),
  ('enterprise', 999999, 999999, 500, 100, TRUE, TRUE, TRUE, TRUE, TRUE);
```

---

## 🔌 Stripe Integration

### 1. Stripe Setup

```bash
# Install Stripe SDK
npm install stripe @stripe/stripe-js

# Install Stripe React components (optional)
npm install @stripe/react-stripe-js
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_PRACTICE_MONTHLY=price_...
STRIPE_PRICE_PRACTICE_YEARLY=price_...
STRIPE_PRICE_METERED_REPORTS=price_... # For usage-based billing
```

### 3. Stripe Client Setup

```typescript
// lib/billing/stripe-client.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

// Price mapping
export const STRIPE_PRICES = {
  professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
  professional_yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!,
  practice_monthly: process.env.STRIPE_PRICE_PRACTICE_MONTHLY!,
  practice_yearly: process.env.STRIPE_PRICE_PRACTICE_YEARLY!,
  metered_reports: process.env.STRIPE_PRICE_METERED_REPORTS!,
} as const;
```

---

## 🔄 User Flows

### Flow 1: New User Signup

```
1. User signs up via Supabase Auth (email/password or OAuth)
   ↓
2. Account created in Supabase auth.users
   ↓
3. User redirected to plan selection page
   ↓
4. User selects plan → Redirected to Stripe Checkout
   ↓
5. User completes payment in Stripe
   ↓
6. Stripe webhook fired → subscription.created
   ↓
7. Create subscription record in Supabase
   ↓
8. User redirected to dashboard with active subscription
```

### Flow 2: Existing User Upgrade

```
1. User clicks "Upgrade Plan" in dashboard
   ↓
2. Fetch current subscription from Supabase
   ↓
3. Create Stripe Checkout Session with upgrade price
   ↓
4. User completes checkout
   ↓
5. Stripe webhook → subscription.updated
   ↓
6. Update subscription in Supabase
   ↓
7. Apply new plan limits immediately
```

### Flow 3: Subscription Renewal

```
1. Stripe automatically charges customer
   ↓
2. Payment successful → invoice.paid webhook
   ↓
3. Update subscription period in Supabase
   ↓
4. Reset usage counters
   ↓
5. Send receipt email (Stripe handles this)
```

### Flow 4: Usage Tracking

```
1. User generates report
   ↓
2. Check usage limits for current billing period
   ↓
3. If under limit → Allow generation
   ↓
4. Record usage in usage_records table
   ↓
5. If metered billing → Report usage to Stripe
   ↓
6. Display usage on dashboard
```

---

## 🛠️ Implementation

### API Route: Create Checkout Session

```typescript
// app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe, STRIPE_PRICES } from '@/lib/billing/stripe-client';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get authenticated user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, successUrl, cancelUrl } = await req.json();

    // Get or create Stripe customer
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', session.user.id)
      .single();

    let customerId = user?.stripe_customer_id;

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user?.email || session.user.email,
        metadata: {
          supabase_user_id: session.user.id,
        },
      });

      customerId = customer.id;

      // Save to database
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id);
    }

    // Create Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        supabase_user_id: session.user.id,
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

### API Route: Customer Portal

```typescript
// app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { stripe } from '@/lib/billing/stripe-client';

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Stripe customer ID
    const { data: user } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      );
    }

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
```

### Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/billing/stripe-client';
import { createClient } from '@/lib/database/supabase-client';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          await handleSubscriptionCreated(supabase, subscription);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleSubscriptionCreated(supabase: any, subscription: Stripe.Subscription) {
  const userId = subscription.metadata.supabase_user_id;

  const planName = getPlanNameFromPriceId(subscription.items.data[0].price.id);

  await supabase.from('subscriptions').insert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer as string,
    stripe_price_id: subscription.items.data[0].price.id,
    plan_name: planName,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    amount: subscription.items.data[0].price.unit_amount || 0,
    currency: subscription.currency,
    interval: subscription.items.data[0].price.recurring?.interval || 'month',
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
  });
}

async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const planName = getPlanNameFromPriceId(subscription.items.data[0].price.id);

  await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: subscription.items.data[0].price.id,
      plan_name: planName,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaid(supabase: any, invoice: Stripe.Invoice) {
  // Record payment
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (subscription) {
    await supabase.from('payments').insert({
      user_id: subscription.user_id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      payment_method: invoice.payment_intent ? 'card' : 'other',
    });

    // Reset usage counters for new billing period
    const periodStart = new Date(invoice.period_start * 1000).toISOString();
    const periodEnd = new Date(invoice.period_end * 1000).toISOString();

    await supabase
      .from('subscriptions')
      .update({
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .eq('stripe_subscription_id', invoice.subscription);
  }
}

async function handleInvoicePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (subscription) {
    await supabase.from('payments').insert({
      user_id: subscription.user_id,
      stripe_payment_intent_id: invoice.payment_intent as string,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      failure_reason: 'Payment failed',
    });

    // Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);
  }
}

function getPlanNameFromPriceId(priceId: string): string {
  // Map price IDs to plan names
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!]: 'professional',
    [process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY!]: 'professional',
    [process.env.STRIPE_PRICE_PRACTICE_MONTHLY!]: 'practice',
    [process.env.STRIPE_PRICE_PRACTICE_YEARLY!]: 'practice',
  };

  return priceMap[priceId] || 'professional';
}
```

### Usage Tracking Service

```typescript
// lib/billing/usage-tracker.ts
import { createClient } from '@/lib/database/supabase-client';
import { stripe } from './stripe-client';

export async function trackUsage(
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export' | 'api_call',
  reportId?: string,
  quantity: number = 1
) {
  const supabase = createClient();

  // Get active subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, subscription_limits(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    throw new Error('No active subscription found');
  }

  // Check usage limits
  const currentPeriodStart = new Date(subscription.current_period_start);
  const currentPeriodEnd = new Date(subscription.current_period_end);

  const { count: currentUsage } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('created_at', currentPeriodStart.toISOString())
    .lte('created_at', currentPeriodEnd.toISOString());

  const limit = subscription.subscription_limits?.reports_per_month || 0;

  if (usageType === 'report_generated' && (currentUsage || 0) >= limit) {
    throw new Error('Usage limit exceeded');
  }

  // Record usage
  await supabase.from('usage_records').insert({
    user_id: userId,
    subscription_id: subscription.id,
    report_id: reportId,
    usage_type: usageType,
    quantity,
    billing_period_start: currentPeriodStart.toISOString(),
    billing_period_end: currentPeriodEnd.toISOString(),
    metered: false, // Set to true for metered billing
  });

  // If metered billing, report to Stripe
  if (subscription.metered) {
    await stripe.subscriptionItems.createUsageRecord(
      subscription.stripe_subscription_item_id,
      {
        quantity,
        timestamp: Math.floor(Date.now() / 1000),
      }
    );
  }
}

export async function checkUsageLimits(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  percentage: number;
}> {
  const supabase = createClient();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, subscription_limits(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!subscription) {
    return { allowed: false, current: 0, limit: 0, percentage: 100 };
  }

  const currentPeriodStart = new Date(subscription.current_period_start);
  const currentPeriodEnd = new Date(subscription.current_period_end);

  const { count: currentUsage } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', 'report_generated')
    .gte('created_at', currentPeriodStart.toISOString())
    .lte('created_at', currentPeriodEnd.toISOString());

  const limit = subscription.subscription_limits?.reports_per_month || 0;
  const current = currentUsage || 0;
  const percentage = (current / limit) * 100;

  return {
    allowed: current < limit,
    current,
    limit,
    percentage,
  };
}
```

---

## 🧪 Testing Stripe Integration

### Test Mode Setup

```bash
# Use Stripe test mode keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Use Stripe CLI for webhook testing
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Authentication: 4000 0027 6000 3184
```

### Test Scenarios

1. **New Subscription**
   - Sign up new user
   - Select plan and complete checkout
   - Verify subscription created in database
   - Verify webhook received

2. **Upgrade Plan**
   - Create user with basic plan
   - Upgrade to higher tier
   - Verify proration
   - Verify limits updated

3. **Usage Tracking**
   - Generate reports up to limit
   - Verify usage blocked at limit
   - Verify usage resets after period

4. **Payment Failure**
   - Use test card that declines
   - Verify subscription marked as past_due
   - Verify user access restricted

---

## 📊 Cost Analysis

### Stripe Fees

| Transaction Type | Stripe Fee |
|------------------|------------|
| Subscription charge | 2.9% + $0.30 |
| International cards | +1.5% |
| Currency conversion | +1% |

### Example Costs

**Professional Plan ($29/month)**
- Stripe fee: $1.14 per charge
- Net revenue: $27.86

**Practice Plan ($99/month)**
- Stripe fee: $3.17 per charge
- Net revenue: $95.83

### Total Monthly Cost Estimate

For 100 paying customers:
- 50 Professional: 50 × $27.86 = $1,393
- 30 Practice: 30 × $95.83 = $2,875
- 20 Enterprise: 20 × $200 = $4,000
- **Total Revenue: $8,268/month**

Infrastructure costs: ~$70-125/month
**Net profit: ~$8,140/month**

---

## 🔐 Security Best Practices

1. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS endpoints only
   - Implement idempotency

2. **API Key Security**
   - Never expose secret keys to client
   - Use environment variables
   - Rotate keys regularly

3. **Customer Data**
   - Store minimal data locally
   - Use Stripe Customer Portal for sensitive operations
   - Comply with PCI DSS (Stripe handles this)

4. **Usage Tracking**
   - Validate limits server-side
   - Prevent usage manipulation
   - Log all usage events

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Next.js Quickstart](https://stripe.com/docs/payments/quickstart)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)

---

**Status**: Ready for Implementation
**Next Step**: Create Stripe products and prices in Stripe Dashboard
