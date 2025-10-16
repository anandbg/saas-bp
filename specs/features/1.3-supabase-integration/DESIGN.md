# Feature 1.3 - Supabase Integration: Technical Design Document

**Feature ID**: 1.3
**Feature Name**: Supabase Integration
**Phase**: Phase 1 - Foundation
**Designer**: Feature Design Architect
**Created**: 2025-01-16
**Status**: Design Phase

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema Design](#database-schema-design)
4. [Row Level Security Implementation](#row-level-security-implementation)
5. [Client Configuration](#client-configuration)
6. [Database Utilities](#database-utilities)
7. [TypeScript Type Definitions](#typescript-type-definitions)
8. [Implementation Plan](#implementation-plan)
9. [Testing Strategy](#testing-strategy)
10. [Error Handling](#error-handling)
11. [Rollback Procedures](#rollback-procedures)
12. [Performance Considerations](#performance-considerations)
13. [Security Considerations](#security-considerations)
14. [Success Criteria](#success-criteria)

---

## Executive Summary

### Overview

This design document provides a complete, implementation-ready specification for integrating Supabase as the primary database solution for the Radiology Reporting App. The implementation establishes a PostgreSQL 15+ database with comprehensive Row Level Security (RLS), four distinct Supabase client configurations for different application contexts, and a complete set of database utilities.

### Key Design Decisions

1. **Multi-Client Architecture**: Four distinct Supabase clients (server, browser, middleware, admin) to handle different Next.js 14 contexts correctly
2. **RLS-First Security**: All user-facing tables protected by RLS policies, with admin operations using service role key
3. **Migration-Based Schema Management**: SQL migrations for version control and reproducibility
4. **Comprehensive Type Safety**: Full TypeScript types generated from database schema
5. **Utility-First Approach**: Reusable database helper functions to prevent code duplication

### Timeline & Milestones

- **Phase 1**: Database Schema Creation & Migration (1 hour)
- **Phase 2**: Client Configuration & Utilities (1 hour)
- **Phase 3**: Testing & Verification (1 hour)
- **Total Estimated Time**: 3 hours

### Dependencies

- **Requires**: Feature 1.2 (Environment Configuration) - COMPLETE
- **Blocks**: Feature 1.4 (Supabase Authentication), Feature 2.1 (Template Management), Feature 2.3 (Report Generation)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Next.js 14 Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────┐      ┌──────────────────┐           │
│  │ Server Components │      │ Client Components│           │
│  │ (SSR/RSC)        │      │ (Browser)        │           │
│  │                   │      │                  │           │
│  │ Uses:             │      │ Uses:            │           │
│  │ - Server Client   │      │ - Browser Client │           │
│  │ - Cookie-based    │      │ - localStorage   │           │
│  │   sessions        │      │ - RLS enforced   │           │
│  └─────────┬─────────┘      └────────┬─────────┘           │
│            │                         │                      │
│  ┌─────────▼─────────┐      ┌───────▼──────────┐           │
│  │   API Routes      │      │   Middleware     │           │
│  │                   │      │                  │           │
│  │ Uses:             │      │ Uses:            │           │
│  │ - Server Client   │      │ - Middleware     │           │
│  │ - User context    │      │   Client         │           │
│  │ - Service Role    │      │ - Session check  │           │
│  │   (admin ops)     │      │                  │           │
│  └─────────┬─────────┘      └────────┬─────────┘           │
│            │                         │                      │
└────────────┼─────────────────────────┼──────────────────────┘
             │                         │
             ▼                         ▼
    ┌────────────────────────────────────────────┐
    │         Supabase PostgreSQL 15+            │
    ├────────────────────────────────────────────┤
    │                                            │
    │  ┌──────────────────────────────────┐    │
    │  │   auth.users (Supabase Auth)     │    │
    │  └──────────────┬───────────────────┘    │
    │                 │                         │
    │  ┌──────────────▼───────────────────┐    │
    │  │   public.users (User Profiles)   │    │
    │  │   ├── RLS: auth.uid() = user_id  │    │
    │  └──────────────┬───────────────────┘    │
    │                 │                         │
    │  ┌──────────────┴───────────────────┐    │
    │  │   User-Facing Tables:            │    │
    │  │   - templates                    │    │
    │  │   - reports                      │    │
    │  │   - audio_files                  │    │
    │  │   - transcriptions               │    │
    │  │   - subscriptions                │    │
    │  │   - usage_records                │    │
    │  │   All protected by RLS           │    │
    │  └──────────────────────────────────┘    │
    │                                            │
    │  ┌──────────────────────────────────┐    │
    │  │   subscription_limits            │    │
    │  │   (Reference table - public)     │    │
    │  └──────────────────────────────────┘    │
    │                                            │
    └────────────────────────────────────────────┘
```

### Data Flow Patterns

#### Pattern 1: User Data Query (RLS Protected)

```
User Request → Next.js Route → Supabase Client (with user context)
                                      ↓
                         PostgreSQL applies RLS policy
                                      ↓
                         Returns only user's own data
```

#### Pattern 2: Admin Operation (Service Role)

```
Admin Operation → API Route → Admin Client (service role key)
                                     ↓
                        PostgreSQL bypasses RLS
                                     ↓
                           Returns all data
```

#### Pattern 3: Public Reference Data

```
Any User → Supabase Client → subscription_limits table
                                     ↓
                     RLS policy: SELECT allowed for all
                                     ↓
                         Returns all plan limits
```

---

## Database Schema Design

### Complete Migration SQL

**File Location**: `/Users/anand/radiology-ai-app/supabase/migrations/20250116000000_initial_schema.sql`

This migration creates all tables, indexes, triggers, RLS policies, and seeds initial data in a single atomic transaction.

```sql
-- =============================================================================
-- RADIOLOGY REPORTING APP - INITIAL DATABASE SCHEMA
-- =============================================================================
-- Version: 1.0
-- Created: 2025-01-16
-- Description: Complete database schema with RLS policies
-- =============================================================================

BEGIN;

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS
  'Trigger function to automatically update the updated_at column';

-- =============================================================================
-- TABLE: users
-- =============================================================================
-- Purpose: User profiles linked to Supabase Auth
-- RLS: Users can only access their own profile
-- =============================================================================

CREATE TABLE users (
  -- Primary identifier (matches auth.users)
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic information
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,

  -- Billing integration
  stripe_customer_id TEXT UNIQUE,

  -- User preferences (JSON structure for flexibility)
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE users IS 'User profiles and settings';
COMMENT ON COLUMN users.preferences IS 'JSON structure for user preferences: theme, notifications, etc.';

-- =============================================================================
-- TABLE: templates
-- =============================================================================
-- Purpose: User-created radiology report templates
-- RLS: Users can only access their own templates
-- =============================================================================

CREATE TABLE templates (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Template metadata
  name TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,

  -- Classification
  modality TEXT, -- e.g., 'CT', 'MRI', 'X-Ray'
  body_part TEXT, -- e.g., 'Chest', 'Abdomen', 'Brain'
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Template behavior
  is_default BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT template_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT template_content_not_empty CHECK (LENGTH(TRIM(content)) > 0),
  CONSTRAINT unique_default_per_user UNIQUE (user_id, is_default)
    WHERE (is_default = TRUE)
);

-- Indexes for performance
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_modality ON templates(modality) WHERE modality IS NOT NULL;
CREATE INDEX idx_templates_body_part ON templates(body_part) WHERE body_part IS NOT NULL;
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
CREATE INDEX idx_templates_is_default ON templates(user_id, is_default) WHERE is_default = TRUE;

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_templates
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE templates IS 'User-created radiology report templates';
COMMENT ON COLUMN templates.is_default IS 'Only one template per user can be default';

-- =============================================================================
-- TABLE: reports
-- =============================================================================
-- Purpose: Generated radiology reports with metadata
-- RLS: Users can only access their own reports
-- =============================================================================

CREATE TABLE reports (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner and template references
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- Input data (what user provided)
  scan_type TEXT NOT NULL,
  clinical_history TEXT,
  findings TEXT NOT NULL,
  comparison TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('espresso', 'slow_brewed')),

  -- Generated content (AI output)
  technique TEXT,
  report_findings TEXT,
  impression TEXT,
  clinical_advice TEXT,
  clinician_questions TEXT[],
  differential_diagnosis JSONB,

  -- Generation metadata
  generation_time_ms INTEGER,
  model_used TEXT,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),

  -- Report lifecycle
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'archived')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT findings_not_empty CHECK (LENGTH(TRIM(findings)) > 0),
  CONSTRAINT scan_type_not_empty CHECK (LENGTH(TRIM(scan_type)) > 0),
  CONSTRAINT positive_generation_time CHECK (generation_time_ms IS NULL OR generation_time_ms > 0),
  CONSTRAINT positive_tokens CHECK (tokens_used IS NULL OR tokens_used > 0),
  CONSTRAINT positive_cost CHECK (cost_usd IS NULL OR cost_usd >= 0)
);

-- Indexes for performance and common queries
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_template_id ON reports(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_reports_scan_type ON reports(scan_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_mode ON reports(mode);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX idx_reports_user_status ON reports(user_id, status);
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reports IS 'Generated radiology reports with AI metadata';
COMMENT ON COLUMN reports.mode IS 'Generation mode: espresso (fast, GPT-5) or slow_brewed (thorough, O3)';
COMMENT ON COLUMN reports.differential_diagnosis IS 'JSON structure: {diagnoses: [{name, probability, evidence}]}';

-- =============================================================================
-- TABLE: audio_files
-- =============================================================================
-- Purpose: Metadata for uploaded/recorded audio files
-- RLS: Users can only access their own audio files
-- =============================================================================

CREATE TABLE audio_files (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- File information
  file_path TEXT NOT NULL, -- Path in Supabase Storage
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  duration_seconds DECIMAL(10, 2),

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT file_name_not_empty CHECK (LENGTH(TRIM(file_name)) > 0),
  CONSTRAINT valid_mime_type CHECK (mime_type ~* '^audio/'),
  CONSTRAINT positive_size CHECK (size_bytes > 0),
  CONSTRAINT positive_duration CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- Indexes for performance
CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at DESC);
CREATE INDEX idx_audio_files_user_created ON audio_files(user_id, created_at DESC);

COMMENT ON TABLE audio_files IS 'Metadata for user-uploaded audio recordings';
COMMENT ON COLUMN audio_files.file_path IS 'Path in Supabase Storage bucket';

-- =============================================================================
-- TABLE: transcriptions
-- =============================================================================
-- Purpose: Audio transcription results from Whisper
-- RLS: Users can only access their own transcriptions
-- =============================================================================

CREATE TABLE transcriptions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner and audio references
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_file_id UUID REFERENCES audio_files(id) ON DELETE SET NULL,

  -- Transcription data
  transcript TEXT NOT NULL,
  model_used TEXT NOT NULL,
  confidence DECIMAL(5, 4),
  duration_ms INTEGER,
  language TEXT DEFAULT 'en',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT transcript_not_empty CHECK (LENGTH(TRIM(transcript)) > 0),
  CONSTRAINT valid_confidence CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  CONSTRAINT positive_duration CHECK (duration_ms IS NULL OR duration_ms > 0)
);

-- Indexes for performance
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id) WHERE audio_file_id IS NOT NULL;
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);

COMMENT ON TABLE transcriptions IS 'Transcription results from audio files';
COMMENT ON COLUMN transcriptions.confidence IS 'Transcription confidence score (0-1)';

-- =============================================================================
-- TABLE: subscriptions
-- =============================================================================
-- Purpose: Stripe subscription information
-- RLS: Users can only view their own subscriptions (create/update via webhooks)
-- =============================================================================

CREATE TABLE subscriptions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner reference
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe references
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,

  -- Plan information
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'professional', 'practice', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')),

  -- Billing period
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,

  -- Pricing
  amount INTEGER NOT NULL, -- in cents
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),

  -- Trial information
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id)
    WHERE (status = 'active'),
  CONSTRAINT valid_period CHECK (current_period_end > current_period_start),
  CONSTRAINT positive_amount CHECK (amount >= 0),
  CONSTRAINT valid_trial CHECK (
    (trial_start IS NULL AND trial_end IS NULL) OR
    (trial_start IS NOT NULL AND trial_end IS NOT NULL AND trial_end > trial_start)
  )
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_name ON subscriptions(plan_name);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end) WHERE status = 'active';

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking';
COMMENT ON CONSTRAINT one_active_subscription_per_user ON subscriptions IS
  'Users can only have one active subscription at a time';

-- =============================================================================
-- TABLE: usage_records
-- =============================================================================
-- Purpose: Track user usage for billing and limits
-- RLS: Users can only view their own usage (create via API)
-- =============================================================================

CREATE TABLE usage_records (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,

  -- Usage information
  usage_type TEXT NOT NULL CHECK (usage_type IN ('report_generated', 'transcription', 'export', 'api_call')),
  quantity INTEGER DEFAULT 1 NOT NULL,

  -- Billing period (for accurate counting)
  billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT positive_quantity CHECK (quantity > 0),
  CONSTRAINT valid_billing_period CHECK (billing_period_end > billing_period_start)
);

-- Indexes for performance (usage counting queries)
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_subscription_id ON usage_records(subscription_id) WHERE subscription_id IS NOT NULL;
CREATE INDEX idx_usage_records_usage_type ON usage_records(usage_type);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);
CREATE INDEX idx_usage_records_user_type_period ON usage_records(user_id, usage_type, billing_period_start, billing_period_end);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at DESC);

COMMENT ON TABLE usage_records IS 'Usage tracking for billing and limit enforcement';
COMMENT ON INDEX idx_usage_records_user_type_period IS
  'Optimized for counting usage by user, type, and billing period';

-- =============================================================================
-- TABLE: subscription_limits
-- =============================================================================
-- Purpose: Reference table defining limits for each plan
-- RLS: Public read-only (everyone can see plan limits)
-- =============================================================================

CREATE TABLE subscription_limits (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Plan identifier
  plan_name TEXT UNIQUE NOT NULL,

  -- Usage limits
  reports_per_month INTEGER NOT NULL,
  templates_limit INTEGER,
  storage_gb INTEGER,
  team_members INTEGER DEFAULT 1 NOT NULL,

  -- Feature flags
  real_time_transcription BOOLEAN DEFAULT FALSE NOT NULL,
  priority_support BOOLEAN DEFAULT FALSE NOT NULL,
  custom_branding BOOLEAN DEFAULT FALSE NOT NULL,
  api_access BOOLEAN DEFAULT FALSE NOT NULL,
  slow_brewed_mode BOOLEAN DEFAULT FALSE NOT NULL,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT plan_name_not_empty CHECK (LENGTH(TRIM(plan_name)) > 0),
  CONSTRAINT positive_reports CHECK (reports_per_month > 0),
  CONSTRAINT positive_templates CHECK (templates_limit IS NULL OR templates_limit > 0),
  CONSTRAINT positive_storage CHECK (storage_gb IS NULL OR storage_gb > 0),
  CONSTRAINT positive_team_members CHECK (team_members > 0)
);

-- Index for fast plan lookup
CREATE INDEX idx_subscription_limits_plan_name ON subscription_limits(plan_name);

COMMENT ON TABLE subscription_limits IS 'Reference data: plan limits and features';

-- Seed subscription limits
INSERT INTO subscription_limits (
  plan_name,
  reports_per_month,
  templates_limit,
  storage_gb,
  team_members,
  real_time_transcription,
  priority_support,
  custom_branding,
  api_access,
  slow_brewed_mode
) VALUES
  ('free', 5, 3, 1, 1, FALSE, FALSE, FALSE, FALSE, FALSE),
  ('professional', 100, 50, 10, 1, TRUE, FALSE, FALSE, FALSE, TRUE),
  ('practice', 500, 200, 50, 10, TRUE, TRUE, TRUE, TRUE, TRUE),
  ('enterprise', 999999, 999999, 500, 100, TRUE, TRUE, TRUE, TRUE, TRUE)
ON CONFLICT (plan_name) DO NOTHING;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- users: Users can manage their own profile
-- -----------------------------------------------------------------------------

CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id);

COMMENT ON POLICY users_select_own ON users IS 'Users can view their own profile';
COMMENT ON POLICY users_insert_own ON users IS 'Users can create their own profile';
COMMENT ON POLICY users_update_own ON users IS 'Users can update their own profile';

-- -----------------------------------------------------------------------------
-- templates: Users have full control over their own templates
-- -----------------------------------------------------------------------------

CREATE POLICY templates_all_own ON templates
  FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON POLICY templates_all_own ON templates IS
  'Users have full CRUD access to their own templates';

-- -----------------------------------------------------------------------------
-- reports: Users have full control over their own reports
-- -----------------------------------------------------------------------------

CREATE POLICY reports_all_own ON reports
  FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON POLICY reports_all_own ON reports IS
  'Users have full CRUD access to their own reports';

-- -----------------------------------------------------------------------------
-- audio_files: Users have full control over their own audio files
-- -----------------------------------------------------------------------------

CREATE POLICY audio_files_all_own ON audio_files
  FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON POLICY audio_files_all_own ON audio_files IS
  'Users have full CRUD access to their own audio files';

-- -----------------------------------------------------------------------------
-- transcriptions: Users have full control over their own transcriptions
-- -----------------------------------------------------------------------------

CREATE POLICY transcriptions_all_own ON transcriptions
  FOR ALL
  USING (auth.uid() = user_id);

COMMENT ON POLICY transcriptions_all_own ON transcriptions IS
  'Users have full CRUD access to their own transcriptions';

-- -----------------------------------------------------------------------------
-- subscriptions: Users can only view their subscriptions
-- Note: INSERT/UPDATE only via service role (Stripe webhooks)
-- -----------------------------------------------------------------------------

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY subscriptions_select_own ON subscriptions IS
  'Users can view their own subscriptions (create/update via webhooks)';

-- -----------------------------------------------------------------------------
-- usage_records: Users can only view their usage
-- Note: INSERT only via service role (API routes)
-- -----------------------------------------------------------------------------

CREATE POLICY usage_records_select_own ON usage_records
  FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY usage_records_select_own ON usage_records IS
  'Users can view their own usage records (create via API)';

-- -----------------------------------------------------------------------------
-- subscription_limits: Everyone can read plan limits (public reference data)
-- -----------------------------------------------------------------------------

CREATE POLICY subscription_limits_select_all ON subscription_limits
  FOR SELECT
  USING (true);

COMMENT ON POLICY subscription_limits_select_all ON subscription_limits IS
  'All authenticated users can view plan limits';

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify all tables created
DO $$
DECLARE
  expected_tables TEXT[] := ARRAY[
    'users', 'templates', 'reports', 'audio_files',
    'transcriptions', 'subscriptions', 'usage_records', 'subscription_limits'
  ];
  actual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO actual_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = ANY(expected_tables);

  IF actual_count != array_length(expected_tables, 1) THEN
    RAISE EXCEPTION 'Expected % tables, found %', array_length(expected_tables, 1), actual_count;
  END IF;

  RAISE NOTICE 'SUCCESS: All % tables created', actual_count;
END $$;

-- Verify RLS enabled
DO $$
DECLARE
  tables_without_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO tables_without_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = FALSE;

  IF tables_without_rls > 0 THEN
    RAISE EXCEPTION 'RLS not enabled on % tables', tables_without_rls;
  END IF;

  RAISE NOTICE 'SUCCESS: RLS enabled on all tables';
END $$;

-- Verify subscription limits seeded
DO $$
DECLARE
  limits_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO limits_count FROM subscription_limits;

  IF limits_count != 4 THEN
    RAISE EXCEPTION 'Expected 4 subscription limits, found %', limits_count;
  END IF;

  RAISE NOTICE 'SUCCESS: Subscription limits seeded (% plans)', limits_count;
END $$;

COMMIT;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
```

### Schema Design Rationale

#### Table Design Decisions

1. **users Table**
   - Links to `auth.users` via foreign key to maintain referential integrity
   - `preferences` as JSONB for flexible user settings without schema changes
   - Email validation regex in CHECK constraint
   - Stripe customer ID for billing integration

2. **templates Table**
   - Unique constraint on `(user_id, is_default)` WHERE `is_default = TRUE` ensures only one default template per user
   - GIN index on `tags` array for efficient text search
   - Versioning support via `version` column for future template history

3. **reports Table**
   - Comprehensive metadata tracking (generation time, model used, cost)
   - `differential_diagnosis` as JSONB for flexible structure
   - Multiple indexes for common query patterns (by user, by status, by date)
   - CHECK constraints ensure data validity

4. **subscriptions Table**
   - Unique constraint ensures only one active subscription per user
   - Billing period tracking for usage calculations
   - Trial period support built-in

5. **usage_records Table**
   - Denormalized billing period dates for faster queries
   - Composite index on `(user_id, usage_type, billing_period)` for limit checks
   - Quantity field allows batching if needed

### Index Strategy

All indexes are designed based on expected query patterns:

- **Single-column indexes**: For simple equality filters
- **Composite indexes**: For multi-column queries (e.g., `user_id + created_at`)
- **Partial indexes**: WHERE clauses to reduce index size (e.g., only index non-null values)
- **GIN indexes**: For array and JSONB searches

---

## Row Level Security Implementation

### RLS Architecture

```
User Request (authenticated)
        ↓
Supabase Client with JWT
        ↓
PostgreSQL auth.uid() = <user_id>
        ↓
RLS Policy Check
        ↓
If USING clause = TRUE → Allow access
If USING clause = FALSE → Deny access (returns empty)
```

### Policy Patterns

#### Pattern 1: Full Ownership (templates, reports, audio_files, transcriptions)

```sql
CREATE POLICY <table>_all_own ON <table>
  FOR ALL
  USING (auth.uid() = user_id);
```

**Rationale**: Users need complete control over these resources.

#### Pattern 2: Read-Only (subscriptions, usage_records)

```sql
CREATE POLICY <table>_select_own ON <table>
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Rationale**: These records are created/updated by system (webhooks, API), users can only view.

#### Pattern 3: Public Read (subscription_limits)

```sql
CREATE POLICY subscription_limits_select_all ON subscription_limits
  FOR SELECT
  USING (true);
```

**Rationale**: Plan limits are public information needed for pricing pages.

### RLS Testing Strategy

**Test Case 1: Data Isolation**

```typescript
// User A creates data
const { data: templateA } = await supabaseA
  .from('templates')
  .insert({ name: 'Test', content: 'Test', user_id: userA.id })
  .select()
  .single();

// User B cannot access User A's data
const { data: templatesB } = await supabaseB.from('templates').select('*').eq('id', templateA.id);

expect(templatesB).toEqual([]); // Empty array
```

**Test Case 2: Admin Access**

```typescript
// Admin client bypasses RLS
const adminSupabase = createSupabaseAdminClient();
const { data: allTemplates } = await adminSupabase.from('templates').select('*');

expect(allTemplates.length).toBeGreaterThan(0); // All data visible
```

---

## Client Configuration

### 1. Server Client

**File**: `/Users/anand/radiology-ai-app/lib/database/supabase-server.ts`

````typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Server Components and API Routes
 *
 * This client:
 * - Uses cookies for session management
 * - Respects RLS policies based on authenticated user
 * - Should be used in Server Components and API Routes
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { createSupabaseServerClient } from '@/lib/database/supabase-server';
 *
 * export default async function Page() {
 *   const supabase = createSupabaseServerClient();
 *   const { data: templates } = await supabase.from('templates').select('*');
 *   return <TemplateList templates={templates} />;
 * }
 * ```
 *
 * @returns Supabase client with user context from cookies
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role privileges
 *
 * This client:
 * - Bypasses Row Level Security (RLS)
 * - Should ONLY be used for admin operations
 * - Must never be exposed to the client
 * - Should be used sparingly and with caution
 *
 * @example
 * ```typescript
 * // In an API route for admin operations
 * import { createSupabaseAdminClient } from '@/lib/database/supabase-server';
 *
 * export async function POST(request: Request) {
 *   // Verify user is admin first!
 *   const adminSupabase = createSupabaseAdminClient();
 *
 *   // Can access all data (bypasses RLS)
 *   const { data: allUsers } = await adminSupabase
 *     .from('users')
 *     .select('*');
 *
 *   return Response.json(allUsers);
 * }
 * ```
 *
 * @returns Supabase client with service role privileges
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not defined. ' + 'This client requires service role access.'
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
}
````

### 2. Browser Client

**File**: `/Users/anand/radiology-ai-app/lib/database/supabase-browser.ts`

````typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Client Components
 *
 * This client:
 * - Runs in the browser
 * - Uses localStorage for session persistence
 * - Respects RLS policies based on authenticated user
 * - Should be used in Client Components (with 'use client' directive)
 *
 * Implementation Note:
 * - Client is created once and reused (singleton pattern)
 * - Safe to call multiple times - returns the same instance
 *
 * @example
 * ```typescript
 * // In a Client Component
 * 'use client';
 *
 * import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
 * import { useEffect, useState } from 'react';
 *
 * export function TemplateList() {
 *   const [templates, setTemplates] = useState([]);
 *   const supabase = createSupabaseBrowserClient();
 *
 *   useEffect(() => {
 *     async function loadTemplates() {
 *       const { data } = await supabase.from('templates').select('*');
 *       setTemplates(data || []);
 *     }
 *     loadTemplates();
 *   }, []);
 *
 *   return <div>{templates.map(t => <div key={t.id}>{t.name}</div>)}</div>;
 * }
 * ```
 *
 * @returns Supabase client for browser environment
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
````

### 3. Middleware Client

**File**: `/Users/anand/radiology-ai-app/lib/database/supabase-middleware.ts`

````typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Middleware
 *
 * This client:
 * - Runs in Edge Runtime
 * - Manages session refresh
 * - Updates cookies in the response
 * - Should be used in middleware.ts only
 *
 * Implementation Note:
 * - Returns both the client AND modified response
 * - MUST use the returned response object (contains updated cookies)
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * import { createSupabaseMiddlewareClient } from '@/lib/database/supabase-middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createSupabaseMiddlewareClient(request);
 *
 *   // Check auth session
 *   const { data: { session } } = await supabase.auth.getSession();
 *
 *   if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *
 *   // IMPORTANT: Return the response object (has updated cookies)
 *   return response;
 * }
 * ```
 *
 * @param request - The Next.js request object
 * @returns Object containing supabase client and response object
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  // Create a response object to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies
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
        remove(name: string, options: CookieOptions) {
          // Remove from both request and response cookies
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
````

### 4. Database Utilities

**File**: `/Users/anand/radiology-ai-app/lib/database/helpers.ts`

````typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Type aliases for convenience
type DbClient = SupabaseClient<Database>;
type User = Database['public']['Tables']['users']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionLimits = Database['public']['Tables']['subscription_limits']['Row'];

/**
 * Database helper functions for common operations
 *
 * These functions:
 * - Provide consistent error handling
 * - Use proper TypeScript types
 * - Handle common edge cases
 * - Can be used with any Supabase client
 */

// =============================================================================
// USER OPERATIONS
// =============================================================================

/**
 * Get user profile by ID
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns User profile data
 * @throws Error if user not found or database error
 *
 * @example
 * ```typescript
 * const profile = await getUserProfile(supabase, 'user-uuid');
 * console.log(profile.email, profile.name);
 * ```
 */
export async function getUserProfile(supabase: DbClient, userId: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`);
  }

  if (!data) {
    throw new Error(`User not found: ${userId}`);
  }

  return data;
}

/**
 * Get user profile by email
 *
 * @param supabase - Supabase client instance
 * @param email - User email address
 * @returns User profile data or null if not found
 *
 * @example
 * ```typescript
 * const profile = await getUserByEmail(supabase, 'user@example.com');
 * if (profile) {
 *   console.log('User exists:', profile.name);
 * }
 * ```
 */
export async function getUserByEmail(supabase: DbClient, email: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user by email: ${error.message}`);
  }

  return data;
}

/**
 * Update user profile
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param updates - Partial user data to update
 * @returns Updated user profile
 *
 * @example
 * ```typescript
 * const updated = await updateUserProfile(supabase, userId, {
 *   name: 'Dr. Smith',
 *   preferences: { theme: 'dark' }
 * });
 * ```
 */
export async function updateUserProfile(
  supabase: DbClient,
  userId: string,
  updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  return data;
}

// =============================================================================
// SUBSCRIPTION OPERATIONS
// =============================================================================

/**
 * Get user's active subscription
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Active subscription or null if none
 *
 * @example
 * ```typescript
 * const subscription = await getActiveSubscription(supabase, userId);
 * if (subscription) {
 *   console.log('Plan:', subscription.plan_name);
 *   console.log('Ends:', subscription.current_period_end);
 * } else {
 *   console.log('User has no active subscription');
 * }
 * ```
 */
export async function getActiveSubscription(
  supabase: DbClient,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch active subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get user's subscription (any status)
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Most recent subscription or null
 */
export async function getUserSubscription(
  supabase: DbClient,
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user subscription: ${error.message}`);
  }

  return data;
}

/**
 * Get subscription limits for a plan
 *
 * @param supabase - Supabase client instance
 * @param planName - Plan name (free, professional, practice, enterprise)
 * @returns Plan limits
 * @throws Error if plan not found
 *
 * @example
 * ```typescript
 * const limits = await getSubscriptionLimits(supabase, 'professional');
 * console.log('Reports per month:', limits.reports_per_month);
 * console.log('Slow-brewed mode:', limits.slow_brewed_mode);
 * ```
 */
export async function getSubscriptionLimits(
  supabase: DbClient,
  planName: string
): Promise<SubscriptionLimits> {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .eq('plan_name', planName)
    .single();

  if (error) {
    throw new Error(`Failed to fetch subscription limits: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Plan not found: ${planName}`);
  }

  return data;
}

/**
 * Get all available plans
 *
 * @param supabase - Supabase client instance
 * @returns Array of all subscription plans
 *
 * @example
 * ```typescript
 * const plans = await getAllPlans(supabase);
 * plans.forEach(plan => {
 *   console.log(`${plan.plan_name}: ${plan.reports_per_month} reports/month`);
 * });
 * ```
 */
export async function getAllPlans(supabase: DbClient): Promise<SubscriptionLimits[]> {
  const { data, error } = await supabase
    .from('subscription_limits')
    .select('*')
    .order('reports_per_month', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch subscription plans: ${error.message}`);
  }

  return data || [];
}

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * Count user's usage for current billing period
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param usageType - Type of usage to count
 * @param billingPeriodStart - Start of billing period
 * @param billingPeriodEnd - End of billing period
 * @returns Count of usage records
 *
 * @example
 * ```typescript
 * const count = await getCurrentUsage(
 *   supabase,
 *   userId,
 *   'report_generated',
 *   new Date('2025-01-01'),
 *   new Date('2025-02-01')
 * );
 * console.log('Reports generated this month:', count);
 * ```
 */
export async function getCurrentUsage(
  supabase: DbClient,
  userId: string,
  usageType: string,
  billingPeriodStart: Date,
  billingPeriodEnd: Date
): Promise<number> {
  const { count, error } = await supabase
    .from('usage_records')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('usage_type', usageType)
    .gte('billing_period_start', billingPeriodStart.toISOString())
    .lte('billing_period_end', billingPeriodEnd.toISOString());

  if (error) {
    throw new Error(`Failed to count usage: ${error.message}`);
  }

  return count || 0;
}

/**
 * Record usage event
 *
 * Note: This should typically be called with admin client in API routes
 *
 * @param supabase - Supabase client instance (preferably admin)
 * @param userId - User UUID
 * @param usageType - Type of usage
 * @param subscriptionId - Related subscription ID (optional)
 * @param reportId - Related report ID (optional)
 * @param quantity - Quantity to record (default: 1)
 *
 * @example
 * ```typescript
 * // In an API route
 * const adminSupabase = createSupabaseAdminClient();
 * await recordUsage(
 *   adminSupabase,
 *   userId,
 *   'report_generated',
 *   subscriptionId,
 *   reportId
 * );
 * ```
 */
export async function recordUsage(
  supabase: DbClient,
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export' | 'api_call',
  billingPeriodStart: Date,
  billingPeriodEnd: Date,
  subscriptionId?: string,
  reportId?: string,
  quantity: number = 1
): Promise<void> {
  const { error } = await supabase.from('usage_records').insert({
    user_id: userId,
    usage_type: usageType,
    subscription_id: subscriptionId,
    report_id: reportId,
    quantity,
    billing_period_start: billingPeriodStart.toISOString(),
    billing_period_end: billingPeriodEnd.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record usage: ${error.message}`);
  }
}

/**
 * Check if user has reached usage limit
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param usageType - Type of usage to check
 * @returns Object with usage info and whether limit is reached
 *
 * @example
 * ```typescript
 * const { current, limit, isLimitReached } = await checkUsageLimit(
 *   supabase,
 *   userId,
 *   'report_generated'
 * );
 *
 * if (isLimitReached) {
 *   throw new Error(`Limit reached: ${current}/${limit} reports used`);
 * }
 * ```
 */
export async function checkUsageLimit(
  supabase: DbClient,
  userId: string,
  usageType: string
): Promise<{
  current: number;
  limit: number;
  isLimitReached: boolean;
  resetDate: Date;
}> {
  // Get active subscription
  const subscription = await getActiveSubscription(supabase, userId);

  if (!subscription) {
    // No subscription = free plan
    const limits = await getSubscriptionLimits(supabase, 'free');
    const current = await getCurrentUsage(
      supabase,
      userId,
      usageType,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First of month
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0) // Last of month
    );

    return {
      current,
      limit: usageType === 'report_generated' ? limits.reports_per_month : 0,
      isLimitReached: current >= limits.reports_per_month,
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    };
  }

  // Get plan limits
  const limits = await getSubscriptionLimits(supabase, subscription.plan_name);

  // Count usage in current billing period
  const current = await getCurrentUsage(
    supabase,
    userId,
    usageType,
    new Date(subscription.current_period_start),
    new Date(subscription.current_period_end)
  );

  const limit = usageType === 'report_generated' ? limits.reports_per_month : 0;

  return {
    current,
    limit,
    isLimitReached: current >= limit,
    resetDate: new Date(subscription.current_period_end),
  };
}

// =============================================================================
// TEMPLATE OPERATIONS
// =============================================================================

/**
 * Get user's default template
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @returns Default template or null if none set
 */
export async function getDefaultTemplate(supabase: DbClient, userId: string) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch default template: ${error.message}`);
  }

  return data;
}

/**
 * Get user's templates with optional filters
 *
 * @param supabase - Supabase client instance
 * @param userId - User UUID
 * @param filters - Optional filters (modality, body_part)
 * @returns Array of templates
 */
export async function getUserTemplates(
  supabase: DbClient,
  userId: string,
  filters?: {
    modality?: string;
    body_part?: string;
    tags?: string[];
  }
) {
  let query = supabase
    .from('templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.modality) {
    query = query.eq('modality', filters.modality);
  }

  if (filters?.body_part) {
    query = query.eq('body_part', filters.body_part);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}
````

---

## TypeScript Type Definitions

### Generated Database Types

**File**: `/Users/anand/radiology-ai-app/types/database.ts`

```typescript
/**
 * Database type definitions
 *
 * These types are derived from the database schema and provide
 * full type safety for Supabase queries.
 *
 * Note: In production, these should be auto-generated using:
 * npx supabase gen types typescript --project-id <project-id> > types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      templates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          content: string;
          modality: string | null;
          body_part: string | null;
          tags: string[];
          is_default: boolean;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          content: string;
          modality?: string | null;
          body_part?: string | null;
          tags?: string[];
          is_default?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          content?: string;
          modality?: string | null;
          body_part?: string | null;
          tags?: string[];
          is_default?: boolean;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'templates_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          user_id: string;
          template_id: string | null;
          scan_type: string;
          clinical_history: string | null;
          findings: string;
          comparison: string | null;
          mode: 'espresso' | 'slow_brewed';
          technique: string | null;
          report_findings: string | null;
          impression: string | null;
          clinical_advice: string | null;
          clinician_questions: string[] | null;
          differential_diagnosis: Json | null;
          generation_time_ms: number | null;
          model_used: string | null;
          tokens_used: number | null;
          cost_usd: string | null;
          status: 'draft' | 'final' | 'archived';
          created_at: string;
          updated_at: string;
          finalized_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id?: string | null;
          scan_type: string;
          clinical_history?: string | null;
          findings: string;
          comparison?: string | null;
          mode: 'espresso' | 'slow_brewed';
          technique?: string | null;
          report_findings?: string | null;
          impression?: string | null;
          clinical_advice?: string | null;
          clinician_questions?: string[] | null;
          differential_diagnosis?: Json | null;
          generation_time_ms?: number | null;
          model_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: string | null;
          status?: 'draft' | 'final' | 'archived';
          created_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string | null;
          scan_type?: string;
          clinical_history?: string | null;
          findings?: string;
          comparison?: string | null;
          mode?: 'espresso' | 'slow_brewed';
          technique?: string | null;
          report_findings?: string | null;
          impression?: string | null;
          clinical_advice?: string | null;
          clinician_questions?: string[] | null;
          differential_diagnosis?: Json | null;
          generation_time_ms?: number | null;
          model_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: string | null;
          status?: 'draft' | 'final' | 'archived';
          created_at?: string;
          updated_at?: string;
          finalized_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reports_template_id_fkey';
            columns: ['template_id'];
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          },
        ];
      };
      audio_files: {
        Row: {
          id: string;
          user_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          duration_seconds: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          duration_seconds?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_path?: string;
          file_name?: string;
          mime_type?: string;
          size_bytes?: number;
          duration_seconds?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'audio_files_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      transcriptions: {
        Row: {
          id: string;
          user_id: string;
          audio_file_id: string | null;
          transcript: string;
          model_used: string;
          confidence: string | null;
          duration_ms: number | null;
          language: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_file_id?: string | null;
          transcript: string;
          model_used: string;
          confidence?: string | null;
          duration_ms?: number | null;
          language?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_file_id?: string | null;
          transcript?: string;
          model_used?: string;
          confidence?: string | null;
          duration_ms?: number | null;
          language?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'transcriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'transcriptions_audio_file_id_fkey';
            columns: ['audio_file_id'];
            referencedRelation: 'audio_files';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: 'free' | 'professional' | 'practice' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          amount: number;
          currency: string;
          interval: 'month' | 'year';
          trial_start: string | null;
          trial_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          stripe_price_id: string;
          plan_name: 'free' | 'professional' | 'practice' | 'enterprise';
          status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          amount: number;
          currency?: string;
          interval: 'month' | 'year';
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          stripe_price_id?: string;
          plan_name?: 'free' | 'professional' | 'practice' | 'enterprise';
          status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'unpaid';
          current_period_start?: string;
          current_period_end?: string;
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          amount?: number;
          currency?: string;
          interval?: 'month' | 'year';
          trial_start?: string | null;
          trial_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      usage_records: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          report_id: string | null;
          usage_type: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity: number;
          billing_period_start: string;
          billing_period_end: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          report_id?: string | null;
          usage_type: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity?: number;
          billing_period_start: string;
          billing_period_end: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          report_id?: string | null;
          usage_type?: 'report_generated' | 'transcription' | 'export' | 'api_call';
          quantity?: number;
          billing_period_start?: string;
          billing_period_end?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'usage_records_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_records_subscription_id_fkey';
            columns: ['subscription_id'];
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'usage_records_report_id_fkey';
            columns: ['report_id'];
            referencedRelation: 'reports';
            referencedColumns: ['id'];
          },
        ];
      };
      subscription_limits: {
        Row: {
          id: string;
          plan_name: string;
          reports_per_month: number;
          templates_limit: number | null;
          storage_gb: number | null;
          team_members: number;
          real_time_transcription: boolean;
          priority_support: boolean;
          custom_branding: boolean;
          api_access: boolean;
          slow_brewed_mode: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          plan_name: string;
          reports_per_month: number;
          templates_limit?: number | null;
          storage_gb?: number | null;
          team_members?: number;
          real_time_transcription?: boolean;
          priority_support?: boolean;
          custom_branding?: boolean;
          api_access?: boolean;
          slow_brewed_mode?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          plan_name?: string;
          reports_per_month?: number;
          templates_limit?: number | null;
          storage_gb?: number | null;
          team_members?: number;
          real_time_transcription?: boolean;
          priority_support?: boolean;
          custom_branding?: boolean;
          api_access?: boolean;
          slow_brewed_mode?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
```

### Additional Type Definitions

**File**: `/Users/anand/radiology-ai-app/types/supabase.ts`

```typescript
import type { Database } from './database';

// Convenience type aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type User = Tables<'users'>;
export type Template = Tables<'templates'>;
export type Report = Tables<'reports'>;
export type AudioFile = Tables<'audio_files'>;
export type Transcription = Tables<'transcriptions'>;
export type Subscription = Tables<'subscriptions'>;
export type UsageRecord = Tables<'usage_records'>;
export type SubscriptionLimits = Tables<'subscription_limits'>;

// Insert types
export type UserInsert = Inserts<'users'>;
export type TemplateInsert = Inserts<'templates'>;
export type ReportInsert = Inserts<'reports'>;

// Update types
export type UserUpdate = Updates<'users'>;
export type TemplateUpdate = Updates<'templates'>;
export type ReportUpdate = Updates<'reports'>;

// Enums
export type ReportMode = 'espresso' | 'slow_brewed';
export type ReportStatus = 'draft' | 'final' | 'archived';
export type PlanName = 'free' | 'professional' | 'practice' | 'enterprise';
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'unpaid';
export type UsageType = 'report_generated' | 'transcription' | 'export' | 'api_call';

// Complex types
export interface DifferentialDiagnosis {
  diagnoses: Array<{
    name: string;
    probability: number;
    evidence: string[];
  }>;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    browser?: boolean;
  };
  defaultMode?: ReportMode;
  autoSave?: boolean;
}
```

---

## Implementation Plan

### Phase 1: Database Schema Setup (1 hour)

#### Step 1.1: Install Dependencies (5 minutes)

```bash
# Navigate to project root
cd /Users/anand/radiology-ai-app

# Install Supabase packages
npm install @supabase/supabase-js@latest @supabase/ssr@latest

# Install Supabase CLI (optional but recommended)
npm install -g supabase

# Verify installation
npm list @supabase/supabase-js @supabase/ssr
```

**Expected Output**:

```
@supabase/supabase-js@2.x.x
@supabase/ssr@0.x.x
```

#### Step 1.2: Create Migration Directory (2 minutes)

```bash
# Create migration directory structure
mkdir -p /Users/anand/radiology-ai-app/supabase/migrations

# Create the migration file
touch /Users/anand/radiology-ai-app/supabase/migrations/20250116000000_initial_schema.sql
```

#### Step 1.3: Write Migration SQL (15 minutes)

Copy the complete SQL migration from the [Database Schema Design](#database-schema-design) section into:

**File**: `/Users/anand/radiology-ai-app/supabase/migrations/20250116000000_initial_schema.sql`

#### Step 1.4: Verify Environment Variables (5 minutes)

```bash
# Check .env.local exists
test -f /Users/anand/radiology-ai-app/.env.local && echo "✓ .env.local exists" || echo "✗ .env.local missing"

# Verify Supabase variables are set (do NOT print values)
grep -q "NEXT_PUBLIC_SUPABASE_URL=" /Users/anand/radiology-ai-app/.env.local && echo "✓ SUPABASE_URL set" || echo "✗ SUPABASE_URL missing"
grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" /Users/anand/radiology-ai-app/.env.local && echo "✓ ANON_KEY set" || echo "✗ ANON_KEY missing"
grep -q "SUPABASE_SERVICE_ROLE_KEY=" /Users/anand/radiology-ai-app/.env.local && echo "✓ SERVICE_ROLE_KEY set" || echo "✗ SERVICE_ROLE_KEY missing"
```

#### Step 1.5: Apply Migration (10 minutes)

**Option A: Using Supabase Dashboard (Recommended for first-time)**

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New Query**
5. Copy entire contents of `20250116000000_initial_schema.sql`
6. Paste into editor
7. Click **Run**
8. Verify success messages

**Option B: Using Supabase CLI**

```bash
# Link project (first time only)
npx supabase link --project-ref <your-project-ref>

# Push migration to database
npx supabase db push

# Verify migration applied
npx supabase db diff
```

#### Step 1.6: Verify Schema Creation (10 minutes)

Run these verification queries in Supabase SQL Editor:

```sql
-- 1. Verify all tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 8 tables

-- 2. Verify RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Expected: All tables have rowsecurity = true

-- 3. Verify subscription limits seeded
SELECT plan_name, reports_per_month, slow_brewed_mode
FROM subscription_limits
ORDER BY reports_per_month;
-- Expected: 4 rows (free, professional, practice, enterprise)

-- 4. Verify indexes created
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Expected: 20+ indexes

-- 5. Verify foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';
-- Expected: 11 foreign keys
```

**Checklist**:

- [ ] All 8 tables created
- [ ] RLS enabled on all tables
- [ ] 4 subscription limits seeded
- [ ] 20+ indexes created
- [ ] 11 foreign keys defined
- [ ] 4 triggers created (updated_at)

#### Step 1.7: Update package.json (3 minutes)

Add Supabase dependencies to `/Users/anand/radiology-ai-app/package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0"
  }
}
```

Run `npm install` to ensure they're installed.

---

### Phase 2: Client Configuration & Utilities (1 hour)

#### Step 2.1: Create Directory Structure (2 minutes)

```bash
# Create database directory
mkdir -p /Users/anand/radiology-ai-app/lib/database

# Create types directory
mkdir -p /Users/anand/radiology-ai-app/types
```

#### Step 2.2: Create Database Type Definitions (10 minutes)

Create `/Users/anand/radiology-ai-app/types/database.ts` with content from [TypeScript Type Definitions](#typescript-type-definitions) section.

Create `/Users/anand/radiology-ai-app/types/supabase.ts` with additional type definitions.

#### Step 2.3: Create Server Client (10 minutes)

Create `/Users/anand/radiology-ai-app/lib/database/supabase-server.ts` with content from [Client Configuration](#client-configuration) section (Server Client).

#### Step 2.4: Create Browser Client (5 minutes)

Create `/Users/anand/radiology-ai-app/lib/database/supabase-browser.ts` with content from [Client Configuration](#client-configuration) section (Browser Client).

#### Step 2.5: Create Middleware Client (8 minutes)

Create `/Users/anand/radiology-ai-app/lib/database/supabase-middleware.ts` with content from [Client Configuration](#client-configuration) section (Middleware Client).

#### Step 2.6: Create Database Helpers (15 minutes)

Create `/Users/anand/radiology-ai-app/lib/database/helpers.ts` with content from [Database Utilities](#database-utilities) section.

#### Step 2.7: Type Check (5 minutes)

```bash
# Run TypeScript type checker
cd /Users/anand/radiology-ai-app
npm run type-check
```

**Expected**: No TypeScript errors.

If errors occur:

- Check import paths are correct
- Verify all files created
- Check environment variable types

#### Step 2.8: Create Index Export (5 minutes)

Create `/Users/anand/radiology-ai-app/lib/database/index.ts`:

```typescript
/**
 * Database Module - Central export for all database functionality
 */

// Clients
export { createSupabaseServerClient, createSupabaseAdminClient } from './supabase-server';
export { createSupabaseBrowserClient } from './supabase-browser';
export { createSupabaseMiddlewareClient } from './supabase-middleware';

// Helpers
export {
  // User operations
  getUserProfile,
  getUserByEmail,
  updateUserProfile,

  // Subscription operations
  getActiveSubscription,
  getUserSubscription,
  getSubscriptionLimits,
  getAllPlans,

  // Usage tracking
  getCurrentUsage,
  recordUsage,
  checkUsageLimit,

  // Template operations
  getDefaultTemplate,
  getUserTemplates,
} from './helpers';

// Types
export type { Database } from '@/types/database';
export type {
  User,
  Template,
  Report,
  AudioFile,
  Transcription,
  Subscription,
  UsageRecord,
  SubscriptionLimits,
  UserInsert,
  TemplateInsert,
  ReportInsert,
  UserUpdate,
  TemplateUpdate,
  ReportUpdate,
  ReportMode,
  ReportStatus,
  PlanName,
  SubscriptionStatus,
  UsageType,
  DifferentialDiagnosis,
  UserPreferences,
} from '@/types/supabase';
```

---

### Phase 3: Testing & Verification (1 hour)

#### Step 3.1: Create Test Utilities (10 minutes)

Create `/Users/anand/radiology-ai-app/scripts/test-supabase-connection.ts`:

```typescript
/**
 * Supabase Connection Test Script
 *
 * Run with: npx tsx scripts/test-supabase-connection.ts
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    const supabase = createSupabaseAdminClient();

    // Test 1: Database connection
    console.log('Test 1: Database Connection');
    const { data: healthCheck, error: healthError } = await supabase
      .from('subscription_limits')
      .select('count')
      .limit(1);

    if (healthError) throw healthError;
    console.log('✅ Connection successful\n');

    // Test 2: Table verification
    console.log('Test 2: Table Verification');
    const tables = [
      'users',
      'templates',
      'reports',
      'audio_files',
      'transcriptions',
      'subscriptions',
      'usage_records',
      'subscription_limits',
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) throw new Error(`Table ${table} not accessible: ${error.message}`);
      console.log(`✅ ${table}`);
    }
    console.log('');

    // Test 3: Subscription limits seeded
    console.log('Test 3: Subscription Limits');
    const { data: limits, error: limitsError } = await supabase
      .from('subscription_limits')
      .select('*')
      .order('reports_per_month');

    if (limitsError) throw limitsError;
    if (!limits || limits.length !== 4) {
      throw new Error(`Expected 4 plans, found ${limits?.length || 0}`);
    }

    limits.forEach((plan) => {
      console.log(`✅ ${plan.plan_name}: ${plan.reports_per_month} reports/month`);
    });
    console.log('');

    // Test 4: RLS policies
    console.log('Test 4: RLS Policy Check');
    // Note: Admin client bypasses RLS, so we can't test enforcement here
    // RLS testing requires actual user sessions (tested in integration tests)
    console.log('⚠️  RLS enforcement requires user sessions (see integration tests)');
    console.log('');

    console.log('🎉 All connection tests passed!\n');
    console.log('Next steps:');
    console.log('1. Run integration tests with actual user sessions');
    console.log('2. Test RLS enforcement with non-admin clients');
    console.log('3. Verify data isolation between users\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Add script to run with tsx:

```bash
# Install tsx for running TypeScript scripts
npm install --save-dev tsx
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test:db": "tsx scripts/test-supabase-connection.ts"
  }
}
```

#### Step 3.2: Run Connection Test (5 minutes)

```bash
npm run test:db
```

**Expected Output**:

```
🔍 Testing Supabase Connection...

Test 1: Database Connection
✅ Connection successful

Test 2: Table Verification
✅ users
✅ templates
✅ reports
✅ audio_files
✅ transcriptions
✅ subscriptions
✅ usage_records
✅ subscription_limits

Test 3: Subscription Limits
✅ free: 5 reports/month
✅ professional: 100 reports/month
✅ practice: 500 reports/month
✅ enterprise: 999999 reports/month

Test 4: RLS Policy Check
⚠️  RLS enforcement requires user sessions (see integration tests)

🎉 All connection tests passed!
```

#### Step 3.3: Create Integration Test (15 minutes)

Create `/Users/anand/radiology-ai-app/tests/integration/supabase.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createSupabaseAdminClient } from '@/lib/database';
import {
  getUserProfile,
  getActiveSubscription,
  getSubscriptionLimits,
  getCurrentUsage,
} from '@/lib/database/helpers';

describe('Supabase Integration', () => {
  const supabase = createSupabaseAdminClient();

  describe('Database Connection', () => {
    it('should connect to database', async () => {
      const { data, error } = await supabase.from('subscription_limits').select('count').limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Subscription Limits', () => {
    it('should have 4 plans seeded', async () => {
      const { data, error } = await supabase.from('subscription_limits').select('*');

      expect(error).toBeNull();
      expect(data).toHaveLength(4);
    });

    it('should retrieve free plan limits', async () => {
      const limits = await getSubscriptionLimits(supabase, 'free');

      expect(limits.plan_name).toBe('free');
      expect(limits.reports_per_month).toBe(5);
      expect(limits.templates_limit).toBe(3);
      expect(limits.slow_brewed_mode).toBe(false);
    });

    it('should retrieve professional plan limits', async () => {
      const limits = await getSubscriptionLimits(supabase, 'professional');

      expect(limits.plan_name).toBe('professional');
      expect(limits.reports_per_month).toBe(100);
      expect(limits.templates_limit).toBe(50);
      expect(limits.slow_brewed_mode).toBe(true);
    });
  });

  describe('Helper Functions', () => {
    it('should throw error for invalid user', async () => {
      await expect(
        getUserProfile(supabase, '00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    it('should return null for user without subscription', async () => {
      // This would require a test user setup
      // Skipped for now - to be implemented with auth
    });
  });
});
```

#### Step 3.4: Manual RLS Testing (15 minutes)

Create test users in Supabase Dashboard:

1. Go to **Authentication** → **Users**
2. Create 2 test users:
   - `testuser1@example.com`
   - `testuser2@example.com`

Create test script `/Users/anand/radiology-ai-app/scripts/test-rls.ts`:

```typescript
/**
 * RLS Policy Testing Script
 *
 * Prerequisites:
 * 1. Create 2 test users in Supabase Dashboard
 * 2. Get their auth tokens (use Supabase Dashboard)
 * 3. Set environment variables:
 *    - TEST_USER1_ID
 *    - TEST_USER2_ID
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testRLS() {
  console.log('🔐 Testing Row Level Security...\n');

  const adminSupabase = createSupabaseAdminClient();

  try {
    // Get test user IDs from environment
    const user1Id = process.env.TEST_USER1_ID;
    const user2Id = process.env.TEST_USER2_ID;

    if (!user1Id || !user2Id) {
      throw new Error('Set TEST_USER1_ID and TEST_USER2_ID environment variables');
    }

    // Test 1: Create user profiles
    console.log('Test 1: Creating user profiles');
    await adminSupabase.from('users').upsert([
      { id: user1Id, email: 'testuser1@example.com', name: 'Test User 1' },
      { id: user2Id, email: 'testuser2@example.com', name: 'Test User 2' },
    ]);
    console.log('✅ Profiles created\n');

    // Test 2: Create data for User 1
    console.log('Test 2: Creating template for User 1');
    const { data: template1 } = await adminSupabase
      .from('templates')
      .insert({
        user_id: user1Id,
        name: 'User 1 Template',
        content: 'Test content',
      })
      .select()
      .single();
    console.log('✅ Template created:', template1?.id, '\n');

    // Test 3: Create data for User 2
    console.log('Test 3: Creating template for User 2');
    const { data: template2 } = await adminSupabase
      .from('templates')
      .insert({
        user_id: user2Id,
        name: 'User 2 Template',
        content: 'Test content',
      })
      .select()
      .single();
    console.log('✅ Template created:', template2?.id, '\n');

    // Test 4: Admin can see all data
    console.log('Test 4: Admin access (should see both templates)');
    const { data: allTemplates } = await adminSupabase
      .from('templates')
      .select('*')
      .in('user_id', [user1Id, user2Id]);
    console.log(`✅ Admin sees ${allTemplates?.length} templates\n`);

    // Test 5: RLS enforcement (manual verification needed)
    console.log('Test 5: RLS Enforcement');
    console.log('⚠️  Manual verification required:');
    console.log('1. Log in as testuser1@example.com in your app');
    console.log('2. Query templates - should only see User 1 template');
    console.log('3. Log in as testuser2@example.com in your app');
    console.log('4. Query templates - should only see User 2 template\n');

    console.log('🎉 RLS test setup complete!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testRLS();
```

#### Step 3.5: Performance Testing (10 minutes)

Create `/Users/anand/radiology-ai-app/scripts/test-performance.ts`:

```typescript
/**
 * Database Performance Test
 */

import { createSupabaseAdminClient } from '../lib/database';

async function testPerformance() {
  console.log('⚡ Testing Database Performance...\n');

  const supabase = createSupabaseAdminClient();

  // Test 1: Connection latency
  console.log('Test 1: Connection Latency');
  const iterations = 10;
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    await supabase.from('subscription_limits').select('count').limit(1);
    const latency = Date.now() - start;
    latencies.push(latency);
  }

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  const minLatency = Math.min(...latencies);

  console.log(`Average: ${avgLatency.toFixed(2)}ms`);
  console.log(`Min: ${minLatency}ms`);
  console.log(`Max: ${maxLatency}ms`);

  if (avgLatency < 100) {
    console.log('✅ Latency within acceptable range (<100ms)\n');
  } else {
    console.log('⚠️  High latency detected (>100ms)\n');
  }

  // Test 2: Query performance with indexes
  console.log('Test 2: Indexed Query Performance');
  const start = Date.now();
  await supabase.from('subscription_limits').select('*').eq('plan_name', 'professional');
  const queryTime = Date.now() - start;

  console.log(`Query time: ${queryTime}ms`);
  if (queryTime < 50) {
    console.log('✅ Indexed query is fast (<50ms)\n');
  } else {
    console.log('⚠️  Slow query detected (>50ms)\n');
  }

  console.log('🎉 Performance tests complete!\n');
}

testPerformance();
```

Add to package.json:

```json
{
  "scripts": {
    "test:db:rls": "tsx scripts/test-rls.ts",
    "test:db:perf": "tsx scripts/test-performance.ts"
  }
}
```

#### Step 3.6: Documentation Check (5 minutes)

Verify all files have been created:

```bash
# Check database files
ls -la /Users/anand/radiology-ai-app/lib/database/

# Expected:
# - supabase-server.ts
# - supabase-browser.ts
# - supabase-middleware.ts
# - helpers.ts
# - index.ts

# Check type files
ls -la /Users/anand/radiology-ai-app/types/

# Expected:
# - database.ts
# - supabase.ts

# Check migration files
ls -la /Users/anand/radiology-ai-app/supabase/migrations/

# Expected:
# - 20250116000000_initial_schema.sql

# Check test scripts
ls -la /Users/anand/radiology-ai-app/scripts/

# Expected:
# - test-supabase-connection.ts
# - test-rls.ts
# - test-performance.ts
```

---

## Testing Strategy

### Unit Tests

Test individual helper functions in isolation:

```typescript
// tests/unit/database-helpers.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getUserProfile, getActiveSubscription } from '@/lib/database/helpers';

describe('Database Helpers', () => {
  describe('getUserProfile', () => {
    it('should fetch user profile successfully', async () => {
      const mockSupabase = createMockSupabase({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: 'test-id', email: 'test@example.com' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const profile = await getUserProfile(mockSupabase, 'test-id');
      expect(profile.email).toBe('test@example.com');
    });

    it('should throw error for invalid user', async () => {
      const mockSupabase = createMockSupabase({
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: { message: 'User not found' },
              }),
            }),
          }),
        }),
      });

      await expect(getUserProfile(mockSupabase, 'invalid')).rejects.toThrow();
    });
  });
});
```

### Integration Tests

Test with actual database (test environment):

```typescript
// tests/integration/database.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSupabaseAdminClient } from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

describe('Database Integration Tests', () => {
  const supabase = createSupabaseAdminClient();
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    testUserId = uuidv4();
    await supabase.from('users').insert({
      id: testUserId,
      email: `test-${testUserId}@example.com`,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await supabase.from('users').delete().eq('id', testUserId);
  });

  it('should create and retrieve user', async () => {
    const { data } = await supabase.from('users').select('*').eq('id', testUserId).single();

    expect(data?.id).toBe(testUserId);
  });

  it('should enforce foreign key constraints', async () => {
    const { error } = await supabase.from('templates').insert({
      user_id: 'invalid-user-id',
      name: 'Test',
      content: 'Test',
    });

    expect(error).toBeTruthy();
  });
});
```

### RLS Tests

Test Row Level Security enforcement:

```typescript
// tests/integration/rls.test.ts
import { describe, it, expect } from 'vitest';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/database';

describe('Row Level Security', () => {
  it('should isolate user data', async () => {
    // Setup: Create 2 users with data
    const adminSupabase = createSupabaseAdminClient();
    const user1Id = 'user1-uuid';
    const user2Id = 'user2-uuid';

    // User 1 creates template
    await adminSupabase.from('templates').insert({
      user_id: user1Id,
      name: 'User 1 Template',
      content: 'Content',
    });

    // User 2 creates template
    await adminSupabase.from('templates').insert({
      user_id: user2Id,
      name: 'User 2 Template',
      content: 'Content',
    });

    // Test: User 1 client should only see User 1's templates
    // (Requires mocking auth session)
    const user1Supabase = createSupabaseServerClient();
    // Mock auth.uid() to return user1Id

    const { data: user1Templates } = await user1Supabase.from('templates').select('*');

    expect(user1Templates?.every((t) => t.user_id === user1Id)).toBe(true);
  });
});
```

### Performance Tests

Test query performance and latency:

```typescript
// tests/performance/database.test.ts
import { describe, it, expect } from 'vitest';
import { createSupabaseAdminClient } from '@/lib/database';

describe('Database Performance', () => {
  const supabase = createSupabaseAdminClient();

  it('should have low latency (<100ms)', async () => {
    const start = Date.now();
    await supabase.from('subscription_limits').select('count').limit(1);
    const latency = Date.now() - start;

    expect(latency).toBeLessThan(100);
  });

  it('should use indexes for fast queries', async () => {
    const start = Date.now();
    await supabase.from('templates').select('*').eq('user_id', 'test-user-id').limit(10);
    const queryTime = Date.now() - start;

    expect(queryTime).toBeLessThan(50);
  });
});
```

---

## Error Handling

### Error Patterns

#### Pattern 1: Database Connection Errors

```typescript
import { createSupabaseServerClient } from '@/lib/database';

export async function fetchData() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from('templates').select('*');

    if (error) {
      // Log error for debugging
      console.error('Database query failed:', error);

      // Throw user-friendly error
      throw new Error('Failed to load templates. Please try again.');
    }

    return data;
  } catch (error) {
    // Handle unexpected errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}
```

#### Pattern 2: RLS Policy Violations

```typescript
// RLS violations return empty results (not errors)
const { data, error } = await supabase.from('templates').select('*').eq('id', templateId);

if (error) {
  throw new Error('Database error');
}

if (!data || data.length === 0) {
  throw new Error('Template not found or access denied');
}
```

#### Pattern 3: Foreign Key Violations

```typescript
try {
  await supabase.from('templates').insert({
    user_id: 'invalid-user-id',
    name: 'Test',
    content: 'Test',
  });
} catch (error) {
  if (error.code === '23503') {
    throw new Error('Invalid user reference');
  }
  throw error;
}
```

#### Pattern 4: Unique Constraint Violations

```typescript
const { error } = await supabase.from('users').insert({
  id: userId,
  email: 'existing@example.com',
});

if (error) {
  if (error.code === '23505') {
    throw new Error('Email already exists');
  }
  throw new Error('Failed to create user');
}
```

### Error Codes Reference

| Code       | Meaning                     | Handling                                 |
| ---------- | --------------------------- | ---------------------------------------- |
| `23503`    | Foreign key violation       | Invalid reference to parent table        |
| `23505`    | Unique constraint violation | Duplicate value in unique column         |
| `23514`    | Check constraint violation  | Value fails CHECK constraint             |
| `PGRST116` | No rows found               | Query returned no results (not an error) |

---

## Rollback Procedures

### Rollback Migration

If migration needs to be reverted:

#### Step 1: Create Rollback SQL

Create `/Users/anand/radiology-ai-app/supabase/migrations/20250116000001_rollback_initial_schema.sql`:

```sql
-- =============================================================================
-- ROLLBACK: Initial Schema
-- =============================================================================
-- WARNING: This will delete ALL data in these tables!
-- Only use in development or emergency situations
-- =============================================================================

BEGIN;

-- Drop policies first (depend on tables)
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS templates_all_own ON templates;
DROP POLICY IF EXISTS reports_all_own ON reports;
DROP POLICY IF EXISTS audio_files_all_own ON audio_files;
DROP POLICY IF EXISTS transcriptions_all_own ON transcriptions;
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
DROP POLICY IF EXISTS usage_records_select_own ON usage_records;
DROP POLICY IF EXISTS subscription_limits_select_all ON subscription_limits;

-- Drop tables (cascade to drop dependent objects)
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS transcriptions CASCADE;
DROP TABLE IF EXISTS audio_files CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS subscription_limits CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop utility function
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

COMMIT;
```

#### Step 2: Apply Rollback

**Option A: Via Dashboard**

1. Copy rollback SQL
2. Run in SQL Editor

**Option B: Via CLI**

```bash
npx supabase db push
```

#### Step 3: Verify Rollback

```sql
-- Should return 0 tables
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public';
```

### Partial Rollback

If only specific changes need to be reverted:

#### Rollback RLS Policies Only

```sql
BEGIN;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files DISABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_limits DISABLE ROW LEVEL SECURITY;

-- Drop policies
-- (policies are automatically dropped when RLS is disabled)

COMMIT;
```

#### Rollback Indexes Only

```sql
BEGIN;

-- Drop all custom indexes (keep primary keys and foreign keys)
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_stripe_customer_id;
DROP INDEX IF EXISTS idx_templates_user_id;
-- ... (drop all custom indexes)

COMMIT;
```

### Data Backup Before Rollback

```bash
# Create backup using Supabase CLI
npx supabase db dump -f backup-$(date +%Y%m%d-%H%M%S).sql

# Or via pg_dump if you have direct access
pg_dump -h db.xxxxx.supabase.co -U postgres -d postgres > backup.sql
```

---

## Performance Considerations

### Query Optimization

#### Use Selective Column Selection

```typescript
// ❌ BAD: Select all columns
const { data } = await supabase.from('reports').select('*');

// ✅ GOOD: Select only needed columns
const { data } = await supabase.from('reports').select('id, scan_type, status, created_at');
```

#### Use Pagination

```typescript
// ✅ Paginate large result sets
const { data, count } = await supabase.from('reports').select('*', { count: 'exact' }).range(0, 19); // First 20 rows
```

#### Use Indexes

All queries should leverage indexes. Common patterns:

```typescript
// Uses idx_reports_user_status
await supabase.from('reports').select('*').eq('user_id', userId).eq('status', 'draft');

// Uses idx_templates_tags (GIN index)
await supabase.from('templates').select('*').contains('tags', ['chest', 'ct']);
```

### Connection Pooling

Supabase handles connection pooling automatically. Best practices:

1. **Reuse clients**: Don't create new clients for each query
2. **Use server-side clients**: Better connection management than browser clients for heavy operations
3. **Batch operations**: Use batch inserts/updates when possible

```typescript
// ✅ Batch insert
await supabase.from('usage_records').insert([
  { user_id, usage_type: 'report_generated', ... },
  { user_id, usage_type: 'export', ... },
  { user_id, usage_type: 'transcription', ... },
]);
```

### Caching Strategy

For frequently accessed, rarely changing data:

```typescript
// Example: Cache subscription limits (changes infrequently)
let limitsCache: SubscriptionLimits[] | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 3600000; // 1 hour

export async function getCachedSubscriptionLimits(
  supabase: SupabaseClient
): Promise<SubscriptionLimits[]> {
  const now = Date.now();

  if (limitsCache && now - cacheTime < CACHE_TTL) {
    return limitsCache;
  }

  const { data, error } = await supabase.from('subscription_limits').select('*');

  if (error) throw error;

  limitsCache = data;
  cacheTime = now;

  return data;
}
```

### Database Monitoring

Monitor these metrics:

1. **Query latency**: Should be <100ms for simple queries
2. **Connection count**: Monitor for connection leaks
3. **Index usage**: Verify indexes are being used
4. **Table sizes**: Monitor growth rates

Use Supabase Dashboard → Database → Performance insights.

---

## Security Considerations

### RLS Best Practices

1. **Always enable RLS**: Never disable RLS on user-facing tables
2. **Test policies thoroughly**: Verify users cannot access other users' data
3. **Use service role sparingly**: Only in API routes for admin operations
4. **Audit policy changes**: Document all RLS policy modifications

### Service Role Key Protection

```typescript
// ✅ GOOD: Service role in server-side code only
// /app/api/admin/route.ts
import { createSupabaseAdminClient } from '@/lib/database/supabase-server';

export async function GET() {
  const adminSupabase = createSupabaseAdminClient();
  // ... admin operations
}

// ❌ BAD: Never expose service role client to browser
// This would bypass RLS!
('use client');
import { createSupabaseAdminClient } from '@/lib/database/supabase-server';
```

### Input Validation

Always validate user input before database operations:

```typescript
import { z } from 'zod';

const TemplateSchema = z.object({
  name: z.string().min(1).max(255),
  content: z.string().min(1),
  modality: z.string().optional(),
  body_part: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function createTemplate(input: unknown) {
  // Validate input
  const validated = TemplateSchema.parse(input);

  // Proceed with database operation
  const { data, error } = await supabase.from('templates').insert(validated);

  // ...
}
```

### SQL Injection Protection

Supabase client library handles parameterization automatically:

```typescript
// ✅ SAFE: Supabase parameterizes queries
await supabase.from('templates').select('*').eq('name', userInput); // Safe, even if userInput contains SQL

// ❌ DANGEROUS: Raw SQL (avoid)
await supabase.rpc('execute_raw_sql', { sql: userInput });
```

---

## Success Criteria

### Feature Completion Checklist

- [ ] **Database Schema**
  - [ ] All 8 tables created successfully
  - [ ] All foreign keys defined and enforced
  - [ ] All indexes created
  - [ ] All triggers functioning (updated_at)
  - [ ] All CHECK constraints enforced
  - [ ] Subscription limits seeded (4 plans)

- [ ] **Row Level Security**
  - [ ] RLS enabled on all 8 tables
  - [ ] All policies created and tested
  - [ ] Users can only access their own data
  - [ ] Service role bypasses RLS correctly
  - [ ] No data leakage between users

- [ ] **Client Configuration**
  - [ ] Server client created and functional
  - [ ] Browser client created and functional
  - [ ] Middleware client created and functional
  - [ ] Admin client created and functional
  - [ ] All clients use correct environment variables

- [ ] **Database Utilities**
  - [ ] All helper functions implemented
  - [ ] Functions properly typed
  - [ ] Error handling implemented
  - [ ] Functions tested with real database

- [ ] **TypeScript Types**
  - [ ] Database types defined
  - [ ] Table types exported
  - [ ] Enum types defined
  - [ ] No TypeScript errors

- [ ] **Testing**
  - [ ] Connection test script passes
  - [ ] RLS test script setup complete
  - [ ] Performance tests pass
  - [ ] Integration tests written
  - [ ] All acceptance criteria met (32/32)

- [ ] **Documentation**
  - [ ] Migration file commented
  - [ ] Client usage examples provided
  - [ ] RLS policies documented
  - [ ] Error handling documented
  - [ ] Rollback procedure documented

### Performance Benchmarks

- [ ] Database connection latency < 100ms
- [ ] Simple queries execute in < 50ms
- [ ] Indexed queries use indexes (verify with EXPLAIN)
- [ ] No N+1 query patterns in helper functions

### Security Validation

- [ ] RLS policies tested with multiple users
- [ ] Service role key not exposed to browser
- [ ] All user input validated before database operations
- [ ] No SQL injection vulnerabilities
- [ ] Audit log shows all policy enforcement

---

## Next Steps

After Feature 1.3 is complete:

1. **Feature 1.4 - Supabase Authentication**
   - Implement auth flows (sign up, sign in, sign out)
   - Create auth middleware
   - Implement session management
   - Build auth UI components

2. **Feature 2.1 - Template Management**
   - Build template CRUD operations
   - Create template UI components
   - Implement template validation
   - Test with database

3. **Feature 2.3 - Report Generation**
   - Implement report generation logic
   - Save reports to database
   - Track usage in usage_records
   - Enforce subscription limits

---

## Appendix

### Environment Variables Reference

```bash
# Required for Feature 1.3
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### File Paths Summary

All files created by this feature:

```
/Users/anand/radiology-ai-app/
├── lib/
│   └── database/
│       ├── supabase-server.ts        (Server + Admin clients)
│       ├── supabase-browser.ts       (Browser client)
│       ├── supabase-middleware.ts    (Middleware client)
│       ├── helpers.ts                (Database utilities)
│       └── index.ts                  (Exports)
├── types/
│   ├── database.ts                   (Generated types)
│   └── supabase.ts                   (Additional types)
├── supabase/
│   └── migrations/
│       └── 20250116000000_initial_schema.sql (Migration)
├── scripts/
│   ├── test-supabase-connection.ts   (Connection test)
│   ├── test-rls.ts                   (RLS test)
│   └── test-performance.ts           (Performance test)
└── tests/
    └── integration/
        └── supabase.test.ts          (Integration tests)
```

### SQL Quick Reference

```sql
-- Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'users'
);

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Troubleshooting Guide

#### Issue: "Failed to connect to database"

**Solution**:

1. Verify environment variables are set
2. Check Supabase project is running
3. Verify network connection
4. Check Supabase service status

#### Issue: "RLS policy violation" or empty results

**Solution**:

1. Verify user is authenticated
2. Check auth.uid() matches user_id in query
3. Verify RLS policy exists for operation
4. Test with admin client to confirm data exists

#### Issue: "Foreign key constraint violation"

**Solution**:

1. Ensure parent record exists before creating child
2. Verify UUID format is correct
3. Check foreign key column matches parent primary key

#### Issue: "Unique constraint violation"

**Solution**:

1. Check for existing records with same unique value
2. Consider using UPSERT instead of INSERT
3. Verify constraint definition is correct

#### Issue: "Type errors in TypeScript"

**Solution**:

1. Regenerate types: `npx supabase gen types typescript > types/database.ts`
2. Verify import paths use `@/` alias
3. Run `npm run type-check` for detailed errors

---

**Document Version**: 1.0
**Last Updated**: 2025-01-16
**Author**: Feature Design Architect
**Status**: Ready for Implementation
**Estimated Implementation Time**: 3 hours

---

## Design Review Checklist

Before proceeding to implementation, verify:

- [ ] All SQL is complete and tested
- [ ] All client configurations are exact and functional
- [ ] All utility functions have complete implementations
- [ ] All TypeScript types are defined
- [ ] Testing strategy is comprehensive
- [ ] Error handling covers all scenarios
- [ ] Rollback procedures are documented
- [ ] Performance considerations addressed
- [ ] Security measures implemented
- [ ] File paths are absolute
- [ ] No ambiguities in implementation steps

**Ready for Implementation**: ✅
