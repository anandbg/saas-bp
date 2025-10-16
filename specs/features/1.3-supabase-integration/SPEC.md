# Feature 1.3 - Supabase Integration Specification

**Feature ID**: 1.3
**Feature Name**: Supabase Integration
**Phase**: Phase 1 - Foundation
**Estimated Time**: 3 hours
**Dependencies**: Feature 1.2 (Environment Configuration)
**Status**: Not Started

---

## 📋 Overview

This feature establishes the complete Supabase database infrastructure for the Radiology Reporting App. It includes:

- Database schema creation for all application tables
- Row Level Security (RLS) policies for data isolation
- Supabase client configuration for both server and client components
- Database connection verification
- Initial data seeding

The database will support:

- User profiles and authentication
- Templates management
- Reports storage
- Audio files and transcriptions
- Subscription and billing management
- Usage tracking

---

## 🎯 Objectives

1. Create complete database schema with all required tables
2. Implement Row Level Security (RLS) policies on all user-facing tables
3. Configure Supabase clients for server-side and client-side usage
4. Verify database connectivity and RLS enforcement
5. Seed initial data (subscription limits)
6. Establish migration management process

---

## 🏗️ Technical Approach

### Architecture Overview

```
Next.js Application
    ├── Server Components (SSR)
    │   └── Supabase Server Client (uses service role key for admin operations)
    │
    ├── Client Components
    │   └── Supabase Browser Client (uses anon key + RLS)
    │
    ├── API Routes
    │   └── Supabase Server Client (user context from auth)
    │
    └── Middleware
        └── Supabase Auth Helpers (session validation)

                    ↓
            Supabase PostgreSQL
            ├── auth.users (managed by Supabase Auth)
            ├── public.users
            ├── public.templates
            ├── public.reports
            ├── public.audio_files
            ├── public.transcriptions
            ├── public.subscriptions
            ├── public.usage_records
            └── public.subscription_limits
```

### Implementation Steps

1. **Create Supabase Project** (if not exists)
2. **Create Database Schema** (SQL migrations)
3. **Enable RLS on All Tables** (security policies)
4. **Configure Supabase Clients** (server + browser)
5. **Create Utility Functions** (database helpers)
6. **Seed Initial Data** (subscription limits)
7. **Verify Setup** (connection + RLS tests)

---

## 🗄️ Database Schema

### 1. users

**Purpose**: Stores user profile information linked to Supabase Auth

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Updated trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. templates

**Purpose**: Stores user-created radiology report templates

```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  modality TEXT,
  body_part TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_default_per_user UNIQUE (user_id, is_default)
    WHERE is_default = true
);

-- Indexes
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_modality ON templates(modality);
CREATE INDEX idx_templates_body_part ON templates(body_part);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);

-- Updated trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. reports

**Purpose**: Stores generated radiology reports with metadata

```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- Input data
  scan_type TEXT NOT NULL,
  clinical_history TEXT,
  findings TEXT NOT NULL,
  comparison TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('espresso', 'slow_brewed')),

  -- Generated content
  technique TEXT,
  report_findings TEXT,
  impression TEXT,
  clinical_advice TEXT,
  clinician_questions TEXT[],
  differential_diagnosis JSONB,

  -- Metadata
  generation_time_ms INTEGER,
  model_used TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finalized_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_scan_type ON reports(scan_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Updated trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. audio_files

**Purpose**: Stores metadata for uploaded/recorded audio files

```sql
CREATE TABLE audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  duration_seconds DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at DESC);
```

### 5. transcriptions

**Purpose**: Stores audio transcription results

```sql
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_file_id UUID REFERENCES audio_files(id) ON DELETE SET NULL,
  transcript TEXT NOT NULL,
  model_used TEXT NOT NULL,
  confidence DECIMAL(5, 4),
  duration_ms INTEGER,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
```

### 6. subscriptions

**Purpose**: Stores Stripe subscription information

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'professional', 'practice', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id)
    WHERE (status = 'active')
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Updated trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 7. usage_records

**Purpose**: Tracks user usage for billing and limits enforcement

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  usage_type TEXT NOT NULL CHECK (usage_type IN ('report_generated', 'transcription', 'export', 'api_call')),
  quantity INTEGER DEFAULT 1,
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX idx_usage_records_usage_type ON usage_records(usage_type);
```

### 8. subscription_limits

**Purpose**: Defines plan limits (reference table)

```sql
CREATE TABLE subscription_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name TEXT UNIQUE NOT NULL,
  reports_per_month INTEGER NOT NULL,
  templates_limit INTEGER,
  storage_gb INTEGER,
  team_members INTEGER DEFAULT 1,
  real_time_transcription BOOLEAN DEFAULT FALSE,
  priority_support BOOLEAN DEFAULT FALSE,
  custom_branding BOOLEAN DEFAULT FALSE,
  api_access BOOLEAN DEFAULT FALSE,
  slow_brewed_mode BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default limits
INSERT INTO subscription_limits (
  plan_name,
  reports_per_month,
  templates_limit,
  storage_gb,
  team_members,
  real_time_transcription,
  priority_support,
  slow_brewed_mode
) VALUES
  ('free', 5, 3, 1, 1, FALSE, FALSE, FALSE),
  ('professional', 100, 50, 10, 1, TRUE, FALSE, TRUE),
  ('practice', 500, 200, 50, 10, TRUE, TRUE, TRUE),
  ('enterprise', 999999, 999999, 500, 100, TRUE, TRUE, TRUE)
ON CONFLICT (plan_name) DO NOTHING;
```

---

## 🔐 Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
-- subscription_limits is a reference table (public read-only)
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;
```

### Users Table Policies

```sql
-- Users can only see their own profile
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- New users can insert their own profile
CREATE POLICY users_insert_own ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Templates Table Policies

```sql
-- Users can perform all operations on their own templates
CREATE POLICY templates_all_own ON templates
  FOR ALL USING (auth.uid() = user_id);
```

### Reports Table Policies

```sql
-- Users can perform all operations on their own reports
CREATE POLICY reports_all_own ON reports
  FOR ALL USING (auth.uid() = user_id);
```

### Audio Files Table Policies

```sql
-- Users can perform all operations on their own audio files
CREATE POLICY audio_files_all_own ON audio_files
  FOR ALL USING (auth.uid() = user_id);
```

### Transcriptions Table Policies

```sql
-- Users can perform all operations on their own transcriptions
CREATE POLICY transcriptions_all_own ON transcriptions
  FOR ALL USING (auth.uid() = user_id);
```

### Subscriptions Table Policies

```sql
-- Users can only view their own subscriptions
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions can only be inserted/updated by service role (via webhooks)
-- No INSERT/UPDATE policies for regular users
```

### Usage Records Table Policies

```sql
-- Users can only view their own usage records
CREATE POLICY usage_records_select_own ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- Usage records can only be inserted by service role (via API)
-- No INSERT policy for regular users
```

### Subscription Limits Table Policies

```sql
-- Everyone can read subscription limits (public reference data)
CREATE POLICY subscription_limits_select_all ON subscription_limits
  FOR SELECT USING (true);
```

---

## 🔌 Supabase Client Configuration

### 1. Server Client (for API Routes and Server Components)

**File**: `lib/database/supabase-server.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server component - can't set cookies
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server component - can't remove cookies
          }
        },
      },
    }
  );
}

// Service role client for admin operations (use sparingly)
export function createSupabaseAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {},
    }
  );
}
```

### 2. Browser Client (for Client Components)

**File**: `lib/database/supabase-browser.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 3. Middleware Client (for Auth Middleware)

**File**: `lib/database/supabase-middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export function createSupabaseMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}
```

### 4. Database Utilities

**File**: `lib/database/helpers.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get user profile by ID
 */
export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) throw error;
  return data;
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No active subscription found
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get subscription limits for a plan
 */
export async function getSubscriptionLimits(supabase: SupabaseClient, planName: string) {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('plan_name', planName)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Count user's usage for current billing period
 */
export async function getCurrentUsage(
  supabase: SupabaseClient,
  userId: string,
  usageType: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
) {
  const { count, error } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('billing_period_start', billingPeriodStart.toISOString())
    .lte('billing_period_end', billingPeriodEnd.toISOString());

  if (error) throw error;
  return count || 0;
}
```

---

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. Environment Variables

Already configured in Feature 1.2. Verify:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Create Supabase Migration

```bash
# Create migration file
mkdir -p supabase/migrations
touch supabase/migrations/20250116_initial_schema.sql
```

**File**: `supabase/migrations/20250116_initial_schema.sql`

Place all SQL statements from the Database Schema section into this file.

### 4. Apply Migration

**Option A: Using Supabase CLI** (recommended)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to project
npx supabase link --project-ref <your-project-ref>

# Apply migration
npx supabase db push
```

**Option B: Using Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire migration SQL
3. Execute

---

## ✅ Acceptance Criteria

### Database Schema

- [ ] All 8 tables created successfully
- [ ] All foreign key constraints properly defined
- [ ] All indexes created
- [ ] All triggers for `updated_at` functioning
- [ ] All CHECK constraints enforced
- [ ] Subscription limits table seeded with 4 plans

### Row Level Security

- [ ] RLS enabled on all 8 tables
- [ ] Users can only access their own data
- [ ] Attempting to access another user's data returns empty result
- [ ] Service role key bypasses RLS (for admin operations)
- [ ] Subscription limits table readable by all authenticated users

### Supabase Clients

- [ ] Server client created and functional
- [ ] Browser client created and functional
- [ ] Middleware client created and functional
- [ ] Admin client created and functional (service role)
- [ ] All clients properly configured with environment variables

### Database Utilities

- [ ] `getUserProfile()` retrieves user data correctly
- [ ] `getActiveSubscription()` returns active subscription or null
- [ ] `getSubscriptionLimits()` returns plan limits
- [ ] `getCurrentUsage()` counts usage records accurately

### Connection & Verification

- [ ] Database connection successful from server components
- [ ] Database connection successful from API routes
- [ ] Database connection successful from client components
- [ ] RLS policies verified (test data isolation)
- [ ] No TypeScript errors in client files
- [ ] All migrations applied successfully

### Documentation

- [ ] Migration file documented with comments
- [ ] Client usage examples documented
- [ ] Database schema documented in BLUEPRINT.md
- [ ] RLS policies documented

---

## 🧪 Verification Tests

### Test 1: Database Connection

```bash
# Create test script
node scripts/test-supabase-connection.js
```

**Expected Output**:

```
✓ Connected to Supabase
✓ Database version: PostgreSQL 15.x
✓ All tables exist
✓ RLS enabled on all tables
```

### Test 2: RLS Enforcement

Create test data with two users and verify data isolation.

**Expected Behavior**:

- User A can only see User A's data
- User B can only see User B's data
- Service role can see all data

### Test 3: CRUD Operations

Test create, read, update, delete on each table to ensure schema is functional.

---

## 📁 File Structure

```
radiology-reporting-app/
├── lib/
│   └── database/
│       ├── supabase-server.ts         ← Server client
│       ├── supabase-browser.ts        ← Browser client
│       ├── supabase-middleware.ts     ← Middleware client
│       └── helpers.ts                 ← Database utilities
│
├── supabase/
│   └── migrations/
│       └── 20250116_initial_schema.sql ← Database schema
│
└── scripts/
    └── test-supabase-connection.js    ← Verification script
```

---

## 🚧 Dependencies

**Requires**:

- Feature 1.2 (Environment Configuration) - Complete

**Blocks**:

- Feature 1.4 (Supabase Authentication)
- Feature 2.1 (Template Management)
- Feature 2.3 (Report Generation)
- All features requiring database access

---

## 📊 Success Metrics

- All tables created: 8/8 ✓
- RLS policies applied: 8/8 ✓
- Client configurations: 4/4 ✓
- Test scripts passing: 3/3 ✓
- Zero RLS bypass vulnerabilities
- Database connection latency < 100ms
- Migration executed in < 60 seconds

---

## 📚 References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Auth](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- BLUEPRINT.md - Database Design section
- CONSTRAINTS.md - Security requirements

---

**Specification Version**: 1.0
**Last Updated**: 2025-01-16
**Author**: Requirements Analyst Agent
