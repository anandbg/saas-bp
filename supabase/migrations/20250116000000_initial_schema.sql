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
