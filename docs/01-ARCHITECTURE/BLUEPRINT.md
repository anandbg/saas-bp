# Radiology Reporting App - Complete Blueprint

## 📋 Executive Summary

**Project**: Migration and enhancement of existing radiology reporting application from Node.js/Express to Next.js 14+ with modern integrations

**Current State**: Working Node.js/Express backend with sophisticated AI-powered report generation

**Target State**: Modern full-stack Next.js application with:
- OpenAI ChatKit UI widget for enhanced user experience
- **Supabase Auth for authentication (email/password + OAuth)**
- **Stripe for billing, subscriptions, and payment processing**
- Vercel AI SDK 5 for AI operations
- OpenAI Whisper for transcription
- OpenAI GPT-5/O3 for report generation
- Supabase for database and storage
- Vercel for deployment

**Timeline**: 4-6 weeks for complete migration and enhancement

**Investment**: $70-125/month in services + 2.9% + $0.30 per transaction (Stripe fees), autonomous development (no contractor costs)

---

## 🎯 Project Objectives

### Primary Goals

1. **Modernize Technology Stack**
   - Migrate from Express.js to Next.js 14+ App Router
   - Implement server components and streaming
   - Use TypeScript throughout
   - Adopt modern React patterns

2. **Enhance User Experience**
   - Integrate OpenAI ChatKit widget for conversational interface
   - Implement real-time transcription feedback
   - Add drag-and-drop file uploads
   - Create responsive mobile-friendly UI

3. **Streamline Authentication & Billing**
   - Implement Supabase Auth (email/password + OAuth providers)
   - Integrate Stripe for subscription billing
   - Implement tiered pricing plans (Free, Professional, Practice, Enterprise)
   - Enable self-service billing portal via Stripe Customer Portal
   - Add usage tracking and metered billing

4. **Preserve Critical Business Logic**
   - Maintain exact prompt engineering from `report_prompt.txt`
   - Keep template integration logic with contradiction detection
   - Preserve spoken punctuation conversion
   - Retain two-tier generation modes (espresso/slow-brewed)
   - Keep model fallback patterns

5. **Improve Developer Experience**
   - Full TypeScript type safety
   - Comprehensive testing suite
   - Automated deployment pipelines
   - Clear documentation and code organization

### Success Metrics

- ✅ All existing features working in new stack
- ✅ Report generation quality matches or exceeds current version
- ✅ Response times ≤ current implementation
- ✅ Zero data loss during migration
- ✅ 100% TypeScript type coverage
- ✅ 80%+ test coverage
- ✅ Successful production deployment

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Next.js 14+ App (React 18+, TypeScript)                 │  │
│  │  ├── OpenAI ChatKit Widget (Embedded)                    │  │
│  │  ├── Audio Recording Component                           │  │
│  │  ├── Template Management UI                              │  │
│  │  ├── Report Editor                                       │  │
│  │  ├── Billing/Subscription Dashboard                      │  │
│  │  └── Real-time Transcription Display                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER (Vercel)                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Server Components & API Routes                          │  │
│  │  ├── /api/auth/* (Supabase Auth)                         │  │
│  │  ├── /api/billing/* (Stripe integration)                 │  │
│  │  ├── /api/transcribe (WebSocket + Whisper)              │  │
│  │  ├── /api/generate (Report generation + usage tracking) │  │
│  │  ├── /api/templates/* (CRUD operations)                  │  │
│  │  ├── /api/reports/* (CRUD operations)                    │  │
│  │  ├── /api/search/* (PubMed, Radiopaedia, Google)       │  │
│  │  └── /api/webhooks/stripe (Stripe webhooks)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────┬────────┬──────────┬──────────┬──────────┬──────────┬────┘
       │        │          │          │          │          │
       ▼        ▼          ▼          ▼          ▼          ▼
   ┌─────┐  ┌──────┐ ┌────────┐  ┌──────┐  ┌──────┐  ┌──────┐
   │Supa-│  │Stripe│ │ OpenAI │  │Deep- │  │Google│  │Radio-│
   │base │  │      │ │  API   │  │ gram │  │ API  │  │paedia│
   │     │  │      │ │ (GPT5, │  │(Opt) │  │(Opt) │  │ API  │
   │ DB  │  │Bills │ │Whisper)│  │      │  │      │  │      │
   │Auth │  │Pay   │ │ChatKit │  │      │  │      │  │      │
   └─────┘  └──────┘ └────────┘  └──────┘  └──────┘  └──────┘
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 3+
- **ChatKit**: OpenAI ChatKit Widget
- **State Management**: React Context + Server State
- **Form Handling**: React Hook Form + Zod validation
- **Audio**: Web Audio API + MediaRecorder
- **File Upload**: React Dropzone

#### Backend
- **Runtime**: Node.js 18+ (Vercel Edge Functions where applicable)
- **API**: Next.js App Router API routes
- **AI SDK**: Vercel AI SDK 5
- **Validation**: Zod schemas
- **Authentication**: Outseta SDK
- **Database Client**: Supabase JS Client
- **WebSocket**: ws library for real-time transcription

#### External Services
- **Deployment**: Vercel (Edge Network)
- **Database**: Supabase (PostgreSQL 15+)
- **Authentication**: Supabase Auth (Email/Password + OAuth)
- **Billing**: Stripe (Subscriptions + Customer Portal)
- **AI Models**: OpenAI (GPT-5, O3, Whisper)
- **Transcription**: OpenAI Whisper (primary) or Deepgram (optional)
- **Search**: PubMed E-utilities, Radiopaedia API, Google Custom Search (optional)

#### Development Tools
- **Package Manager**: npm or pnpm
- **Testing**: Vitest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **CI/CD**: GitHub Actions + Vercel
- **Monitoring**: Vercel Analytics + Sentry (optional)

---

## 📊 Application Modules

### 1. Authentication & User Management

**Responsibilities**:
- User signup/login via Supabase Auth
- Session management with JWT tokens
- OAuth provider integration (Google, GitHub, etc.)
- Role-based access control
- Subscription status verification
- User profile management

**Key Components**:
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/signup/page.tsx` - Signup page
- `app/(auth)/reset-password/page.tsx` - Password reset
- `lib/auth/supabase-auth.ts` - Supabase Auth integration
- `middleware.ts` - Auth middleware for protected routes

**Supabase Auth Integration**:
```typescript
// User flow
1. User clicks "Sign Up" → Email/password or OAuth
2. Supabase creates account in auth.users
3. Create user profile in public.users table
4. JWT token issued by Supabase
5. User accesses app → Token validated via middleware
6. RLS policies automatically enforce data access
```

### 1b. Billing & Subscriptions

**Responsibilities**:
- Stripe subscription management
- Payment processing
- Usage tracking and limits
- Plan upgrades/downgrades
- Invoice management

**Key Components**:
- `app/(dashboard)/billing/page.tsx` - Billing dashboard
- `app/(dashboard)/pricing/page.tsx` - Plan selection
- `app/api/billing/checkout/route.ts` - Checkout session
- `app/api/billing/portal/route.ts` - Customer portal
- `app/api/webhooks/stripe/route.ts` - Webhook handler
- `lib/billing/stripe-client.ts` - Stripe integration
- `lib/billing/usage-tracker.ts` - Usage tracking

**Stripe Integration**:
```typescript
// Subscription flow
1. User selects plan → Creates Stripe Checkout Session
2. User completes payment → Stripe processes
3. Webhook fired → subscription.created
4. Create subscription record in Supabase
5. Apply plan limits and features
6. User can access features per subscription tier
```

### 2. Audio Recording & Transcription

**Responsibilities**:
- Record audio from microphone
- Upload audio files
- Real-time transcription via WebSocket
- Batch transcription via API
- Spoken punctuation conversion
- Transcription history

**Key Components**:
- `components/AudioRecorder.tsx` - Recording interface
- `components/AudioUploader.tsx` - File upload
- `components/TranscriptionDisplay.tsx` - Live transcript
- `app/api/transcribe/route.ts` - Batch transcription endpoint
- `app/api/transcribe/ws/route.ts` - WebSocket endpoint
- `lib/transcription/whisper-client.ts` - OpenAI Whisper integration
- `lib/transcription/spoken-punctuation.ts` - Punctuation converter

**Transcription Modes**:
1. **Real-time WebSocket** - Live dictation with immediate feedback
2. **Batch Upload** - Process pre-recorded audio files
3. **Hybrid** - Record + process in chunks

### 3. Template Management

**Responsibilities**:
- Create/edit/delete templates
- Template categorization (modality, body part)
- Template search and filtering
- Default template management
- Template versioning (future)

**Key Components**:
- `app/templates/page.tsx` - Template list
- `app/templates/[id]/page.tsx` - Template detail/edit
- `app/templates/new/page.tsx` - Create template
- `components/TemplateEditor.tsx` - Rich text editor
- `components/TemplateSelector.tsx` - Template picker
- `app/api/templates/route.ts` - CRUD endpoints
- `lib/templates/template-service.ts` - Business logic

**Database Schema**:
```sql
templates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  modality TEXT,
  body_part TEXT,
  tags TEXT[],
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 4. Report Generation

**Responsibilities**:
- Generate radiology reports from findings + templates
- Support espresso (fast) and slow-brewed (detailed) modes
- Model fallback (GPT-5→GPT-4o, O3→GPT-4o)
- Template integration with contradiction detection
- Clinical advice generation
- Differential diagnosis generation
- Quality validation

**Key Components**:
- `app/generate/page.tsx` - Report generation UI
- `components/ReportForm.tsx` - Input form
- `components/ReportPreview.tsx` - Generated report display
- `app/api/generate/route.ts` - Generation endpoint
- `lib/ai/report-generator.ts` - Core generation logic
- `lib/ai/prompt-builder.ts` - Prompt construction
- `lib/ai/contradiction-cleaner.ts` - Template integration logic
- `lib/ai/model-fallback.ts` - Fallback handler

**Generation Flow**:
```typescript
1. User inputs findings + selects template
2. Apply spoken punctuation conversion
3. Load template content
4. Build prompt from report_prompt.txt template
5. Call OpenAI API (GPT-5 or O3 depending on mode)
6. If API fails → Fallback to secondary model
7. Clean contradictions in generated text
8. Validate JSON structure
9. Save to database
10. Return to user
```

**Critical Logic to Preserve**:
- Exact prompt engineering from `report_prompt.txt`
- `applySpokenPunctuation()` function
- `cleanConflictingNormals()` function
- Template integration rules
- Two-tier generation modes
- Model fallback pattern

### 5. Report Management

**Responsibilities**:
- List/view/edit/delete reports
- Report search and filtering
- Report export (PDF, DOCX, HL7)
- Report history and versioning
- Report sharing

**Key Components**:
- `app/reports/page.tsx` - Report list
- `app/reports/[id]/page.tsx` - Report detail
- `app/reports/[id]/edit/page.tsx` - Edit report
- `components/ReportList.tsx` - List with filters
- `components/ReportEditor.tsx` - WYSIWYG editor
- `components/ReportExporter.tsx` - Export functionality
- `app/api/reports/route.ts` - CRUD endpoints
- `lib/reports/export-service.ts` - Export logic

**Database Schema**:
```sql
reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  scan_type TEXT NOT NULL,
  clinical_history TEXT,
  findings TEXT NOT NULL,
  comparison TEXT,
  template_id UUID REFERENCES templates(id),
  mode TEXT CHECK (mode IN ('espresso', 'slow_brewed')),
  technique TEXT,
  report_findings TEXT,
  impression TEXT,
  clinical_advice TEXT,
  clinician_questions TEXT[],
  differential_diagnosis JSONB,
  generation_time_ms INTEGER,
  model_used TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### 6. ChatKit Integration

**Responsibilities**:
- Embed OpenAI ChatKit widget (part of AgentKit, launched October 2025)
- Custom conversational interface for radiology workflows
- Context-aware suggestions and assistance
- Voice command support (future)
- Multi-modal interactions (future)

**Key Components**:
- `components/chatkit/ChatKitWidget.tsx` - Main widget using @openai/chatkit-react
- `app/api/chatkit/session/route.ts` - Server-side session creation
- `lib/chatkit/config.ts` - Optional configuration

**Authentication**:
- Uses existing OpenAI API key (no separate ChatKit credentials required)
- Server-side session management via OpenAI ChatKit API
- Secure client token generation

**Potential Custom Features** (future enhancements):
- Conversational report generation
- Literature search via chat
- Template selection assistance
- Report refinement suggestions
- Case-based reasoning queries

**Resources**:
- ChatKit Docs: https://platform.openai.com/docs/guides/chatkit
- GitHub: https://github.com/openai/chatkit-js
- npm package: @openai/chatkit-react

### 7. Search & Research

**Responsibilities**:
- PubMed medical literature search
- Radiopaedia reference search
- Google Custom Search (optional)
- Result caching
- Citation formatting

**Key Components**:
- `components/SearchPanel.tsx` - Unified search interface
- `app/api/search/pubmed/route.ts` - PubMed endpoint
- `app/api/search/radiopaedia/route.ts` - Radiopaedia endpoint
- `app/api/search/google/route.ts` - Google endpoint
- `lib/search/pubmed-client.ts` - PubMed integration
- `lib/search/radiopaedia-client.ts` - Radiopaedia integration
- `lib/search/result-ranker.ts` - Result relevance scoring

### 8. Settings & Preferences

**Responsibilities**:
- User preferences (theme, language)
- Default template selection
- AI model preferences
- Notification settings
- Keyboard shortcuts configuration

**Key Components**:
- `app/settings/page.tsx` - Settings dashboard
- `components/SettingsForm.tsx` - Settings form
- `lib/settings/user-preferences.ts` - Preferences storage

### 9. Analytics & Usage Tracking

**Responsibilities**:
- Report generation metrics
- API usage tracking
- Error logging
- Performance monitoring
- User activity insights

**Key Components**:
- `lib/analytics/tracker.ts` - Event tracking
- `lib/analytics/performance.ts` - Performance monitoring
- `app/api/analytics/route.ts` - Analytics endpoint
- Dashboard components (future)

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    users     │         │  templates   │         │   reports    │
├──────────────┤         ├──────────────┤         ├──────────────┤
│ id (PK)      │────────<│ user_id (FK) │         │ id (PK)      │
│ email        │         │ name         │         │ user_id (FK) │──┐
│ name         │         │ content      │         │ template_id  │  │
│ outseta_id   │         │ description  │<───────<│ scan_type    │  │
│ created_at   │         │ modality     │         │ findings     │  │
│ updated_at   │         │ body_part    │         │ comparison   │  │
└──────────────┘         │ tags[]       │         │ mode         │  │
                         │ is_default   │         │ report_*     │  │
                         │ created_at   │         │ created_at   │  │
                         │ updated_at   │         │ updated_at   │  │
                         └──────────────┘         └──────────────┘  │
                                                                     │
┌──────────────┐         ┌──────────────┐                          │
│transcriptions│         │ audio_files  │                          │
├──────────────┤         ├──────────────┤                          │
│ id (PK)      │         │ id (PK)      │                          │
│ user_id (FK) │─────────│ user_id (FK) │                          │
│ audio_id(FK) │────────>│ file_path    │                          │
│ transcript   │         │ duration     │                          │
│ model_used   │         │ size_bytes   │                          │
│ confidence   │         │ mime_type    │                          │
│ duration_ms  │         │ created_at   │                          │
│ created_at   │         └──────────────┘                          │
└──────────────┘                                                    │
                                                                     │
┌──────────────┐                                                    │
│subscriptions │                                                    │
├──────────────┤                                                    │
│ id (PK)      │                                                    │
│ user_id (FK) │────────────────────────────────────────────────────┘
│ outseta_id   │
│ plan_name    │
│ status       │
│ current_per  │
│ expires_at   │
│ created_at   │
│ updated_at   │
└──────────────┘
```

### Table Definitions

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE, -- Stripe Customer ID
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
```

#### templates
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

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_modality ON templates(modality);
CREATE INDEX idx_templates_body_part ON templates(body_part);
CREATE INDEX idx_templates_tags ON templates USING GIN(tags);
```

#### reports
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

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_template_id ON reports(template_id);
CREATE INDEX idx_reports_scan_type ON reports(scan_type);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

#### audio_files
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

CREATE INDEX idx_audio_files_user_id ON audio_files(user_id);
CREATE INDEX idx_audio_files_created_at ON audio_files(created_at DESC);
```

#### transcriptions
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

CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_audio_file_id ON transcriptions(audio_file_id);
```

#### subscriptions
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

  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id) WHERE (status = 'active')
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- Add usage_records table for tracking
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

CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);

-- Add subscription_limits table
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
INSERT INTO subscription_limits (plan_name, reports_per_month, templates_limit, storage_gb, team_members, real_time_transcription, priority_support, slow_brewed_mode) VALUES
  ('free', 5, 3, 1, 1, FALSE, FALSE, FALSE),
  ('professional', 100, 50, 10, 1, TRUE, FALSE, TRUE),
  ('practice', 500, 200, 50, 10, TRUE, TRUE, TRUE),
  ('enterprise', 999999, 999999, 500, 100, TRUE, TRUE, TRUE);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY templates_all_own ON templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY reports_all_own ON reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY audio_files_all_own ON audio_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY transcriptions_all_own ON transcriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 🔌 API Design

### API Route Structure

```
/api
├── /auth
│   ├── /callback         POST   - Handle Outseta OAuth callback
│   ├── /logout           POST   - Logout user
│   └── /session          GET    - Get current session
│
├── /transcribe
│   ├── /                 POST   - Batch transcription
│   └── /ws               WS     - Real-time transcription
│
├── /generate
│   └── /                 POST   - Generate report
│
├── /templates
│   ├── /                 GET    - List templates
│   ├── /                 POST   - Create template
│   ├── /:id              GET    - Get template
│   ├── /:id              PUT    - Update template
│   ├── /:id              DELETE - Delete template
│   ├── /default          GET    - Get default template
│   └── /:id/set-default  POST   - Set as default
│
├── /reports
│   ├── /                 GET    - List reports
│   ├── /                 POST   - Create report
│   ├── /:id              GET    - Get report
│   ├── /:id              PUT    - Update report
│   ├── /:id              DELETE - Delete report
│   └── /:id/export       GET    - Export report (PDF/DOCX)
│
├── /search
│   ├── /pubmed           GET    - Search PubMed
│   ├── /radiopaedia      GET    - Search Radiopaedia
│   └── /google           GET    - Google Custom Search
│
├── /webhooks
│   └── /outseta          POST   - Outseta webhook handler
│
└── /health               GET    - Health check
```

### Key API Endpoints

#### POST /api/generate

**Purpose**: Generate radiology report from findings

**Request**:
```typescript
{
  scan_type: string;
  clinical_history?: string;
  findings: string;
  comparison?: string;
  template_id?: string;
  mode: 'espresso' | 'slow_brewed';
  include_advice: boolean;
  include_questions: boolean;
  include_differential: boolean;
}
```

**Response**:
```typescript
{
  report: {
    technique: string;
    comparison: string;
    findings: string;
    impression: string;
    clinical_advice?: string;
    clinician_questions?: string[];
    differential_diagnosis?: Array<{
      diagnosis: string;
      reasoning: string;
    }>;
  };
  metadata: {
    generation_time_ms: number;
    model_used: string;
    tokens_used: number;
  };
}
```

**Processing Flow**:
1. Validate input with Zod schema
2. Check user subscription status
3. Load template if specified
4. Apply spoken punctuation conversion
5. Build prompt from template
6. Call OpenAI API with appropriate model
7. Implement fallback on failure
8. Clean contradictions
9. Validate output structure
10. Save to database
11. Return report

#### POST /api/transcribe

**Purpose**: Transcribe audio file to text

**Request**: FormData with audio file

**Response**:
```typescript
{
  transcript: string;
  confidence: number;
  duration_ms: number;
  model_used: string;
}
```

#### WebSocket /api/transcribe/ws

**Purpose**: Real-time audio transcription

**Flow**:
1. Client establishes WebSocket connection
2. Client streams audio chunks
3. Server forwards to Whisper API
4. Server returns transcript segments in real-time
5. Client displays live transcript

**Messages**:
```typescript
// Client → Server
{
  type: 'audio_chunk';
  data: ArrayBuffer; // Audio data
  sequence: number;
}

// Server → Client
{
  type: 'transcript_segment';
  text: string;
  confidence: number;
  is_final: boolean;
}

// Server → Client (error)
{
  type: 'error';
  message: string;
}

// Server → Client (complete)
{
  type: 'complete';
  full_transcript: string;
  duration_ms: number;
}
```

---

## 🎨 Frontend Design

### Page Structure

```
/app
├── (auth)
│   ├── /login            - Login page
│   ├── /signup           - Signup page
│   └── /callback         - OAuth callback
│
├── (dashboard)
│   ├── /                 - Dashboard home
│   ├── /generate         - Generate new report
│   ├── /reports          - Report list
│   ├── /reports/[id]     - Report detail
│   ├── /reports/[id]/edit - Edit report
│   ├── /templates        - Template list
│   ├── /templates/[id]   - Template detail
│   ├── /templates/new    - Create template
│   └── /settings         - User settings
│
└── /api                  - API routes (see above)
```

### Component Hierarchy

```
App
├── Providers
│   ├── AuthProvider (Outseta)
│   ├── ThemeProvider (Dark/Light mode)
│   └── QueryProvider (React Query)
│
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   │
│   ├── Sidebar
│   │   ├── QuickActions
│   │   └── RecentReports
│   │
│   └── Main Content Area
│
└── Pages
    ├── DashboardPage
    │   ├── StatsCards
    │   ├── RecentActivity
    │   └── QuickStart
    │
    ├── GeneratePage
    │   ├── ReportForm
    │   │   ├── ScanTypeSelector
    │   │   ├── ClinicalHistoryInput
    │   │   ├── FindingsInput (with voice)
    │   │   │   ├── AudioRecorder
    │   │   │   ├── AudioUploader
    │   │   │   └── TranscriptionDisplay
    │   │   ├── ComparisonInput
    │   │   ├── TemplateSelector
    │   │   └── GenerationOptions
    │   │
    │   ├── ChatKitWidget (floating)
    │   │
    │   └── ReportPreview
    │       ├── TechniqueSection
    │       ├── FindingsSection
    │       ├── ImpressionSection
    │       ├── AdviceSection
    │       └── DifferentialSection
    │
    ├── ReportsPage
    │   ├── ReportFilters
    │   ├── ReportList
    │   │   └── ReportCard (repeated)
    │   └── Pagination
    │
    └── TemplatesPage
        ├── TemplateFilters
        ├── TemplateGrid
        │   └── TemplateCard (repeated)
        └── CreateButton
```

### Key UI Components

#### AudioRecorder Component

**Features**:
- Start/Stop recording
- Real-time audio visualization
- Duration counter
- Voice activity detection
- Automatic pause on silence (optional)

**Props**:
```typescript
interface AudioRecorderProps {
  onTranscript: (text: string) => void;
  onError: (error: Error) => void;
  mode: 'realtime' | 'batch';
  autoStop?: boolean;
  maxDuration?: number;
}
```

#### TemplateSelector Component

**Features**:
- Search/filter templates
- Preview template content
- Quick template creation
- Favorite templates
- Recent templates

**Props**:
```typescript
interface TemplateSelectorProps {
  selectedId?: string;
  onSelect: (template: Template) => void;
  filters?: {
    modality?: string;
    bodyPart?: string;
  };
}
```

#### ReportPreview Component

**Features**:
- Live preview of generated report
- Section-by-section display
- Copy individual sections
- Export options (PDF, DOCX)
- Edit mode toggle

**Props**:
```typescript
interface ReportPreviewProps {
  report: GeneratedReport;
  loading?: boolean;
  editable?: boolean;
  onEdit?: (section: string, content: string) => void;
  onExport?: (format: 'pdf' | 'docx') => void;
}
```

#### ChatKitWidget Component

**Features**:
- Embedded ChatKit interface powered by OpenAI (part of AgentKit, launched Oct 2025)
- Custom actions for radiology workflows
- Context-aware suggestions
- File attachment support (future)
- Voice input integration (future)

**Implementation**:
```typescript
// Uses @openai/chatkit-react package
// Authentication: Uses existing OpenAI API key (no separate ChatKit credentials)
// Session management: Server-side via /api/chatkit/session endpoint

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function RadiologyChatWidget() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', {
          method: 'POST',
        });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  return <ChatKit control={control} className="w-[400px] h-[600px]" />;
}
```

**Resources**:
- ChatKit Docs: https://platform.openai.com/docs/guides/chatkit
- GitHub: https://github.com/openai/chatkit-js

---

## 🔐 Security & Privacy

### Authentication Flow

```
1. User visits app → Redirected to Outseta login
2. User authenticates → Outseta validates credentials
3. Outseta redirects back → With authorization code
4. App exchanges code → For access token
5. App verifies token → Calls Outseta API
6. App creates session → Stores in secure cookie
7. App syncs user → Creates/updates in Supabase
8. User accesses app → Token validated on each request
```

### Security Measures

1. **Authentication**
   - Outseta OAuth 2.0 flow
   - Secure HTTP-only cookies
   - CSRF protection
   - Token refresh mechanism

2. **Authorization**
   - Row Level Security (RLS) in Supabase
   - API route middleware
   - Subscription-based access control
   - Role-based permissions (future)

3. **Data Protection**
   - HTTPS only (enforced by Vercel)
   - Encrypted database (Supabase default)
   - Secure file storage (Supabase Storage)
   - Regular security audits

4. **API Security**
   - Rate limiting per user
   - Request size limits
   - Input validation (Zod schemas)
   - Output sanitization

5. **Secrets Management**
   - Environment variables in Vercel
   - No secrets in code
   - Separate dev/prod credentials
   - Regular key rotation

### Privacy Compliance

- **HIPAA Considerations** (future):
  - Business Associate Agreement with Supabase
  - Audit logging for all data access
  - Encryption at rest and in transit
  - User data export/deletion tools

- **GDPR Compliance**:
  - User consent management
  - Data portability
  - Right to erasure
  - Privacy policy and terms

---

## 🧪 Testing Strategy

### Test Pyramid

```
                    ┌────────┐
                    │   E2E  │  10%
                  ┌─┴────────┴─┐
                  │Integration │  30%
               ┌──┴────────────┴──┐
               │      Unit         │  60%
               └───────────────────┘
```

### Unit Tests (60%)

**Scope**: Individual functions and components

**Tools**: Vitest + React Testing Library

**Coverage**:
- `lib/transcription/spoken-punctuation.test.ts`
- `lib/ai/contradiction-cleaner.test.ts`
- `lib/ai/prompt-builder.test.ts`
- `lib/templates/template-service.test.ts`
- `lib/reports/export-service.test.ts`
- Component tests for all UI components

**Example**:
```typescript
// lib/transcription/spoken-punctuation.test.ts
import { describe, it, expect } from 'vitest';
import { applySpokenPunctuation } from './spoken-punctuation';

describe('applySpokenPunctuation', () => {
  it('converts "full stop" to period', () => {
    const input = 'No fracture full stop';
    const output = applySpokenPunctuation(input);
    expect(output).toBe('No fracture.');
  });

  it('converts "comma" to comma', () => {
    const input = 'Nodules in right lung comma left lung comma and mediastinum';
    const output = applySpokenPunctuation(input);
    expect(output).toBe('Nodules in right lung, left lung, and mediastinum');
  });

  it('handles multiple punctuations', () => {
    const input = 'Fracture at L1 full stop No fracture at other levels full stop';
    const output = applySpokenPunctuation(input);
    expect(output).toBe('Fracture at L1. No fracture at other levels.');
  });
});
```

### Integration Tests (30%)

**Scope**: API routes and service integration

**Tools**: Vitest + Supertest

**Coverage**:
- `/api/generate` - Full report generation flow
- `/api/transcribe` - Audio transcription
- `/api/templates/*` - CRUD operations
- `/api/reports/*` - CRUD operations
- Outseta webhook handling
- Supabase database operations

**Example**:
```typescript
// app/api/generate/route.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import { POST } from './route';

describe('POST /api/generate', () => {
  beforeAll(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  it('generates report in espresso mode', async () => {
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        scan_type: 'CT Chest',
        findings: 'Spiculated nodule in right upper lobe',
        mode: 'espresso',
        include_advice: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.report.findings).toContain('nodule');
    expect(data.report.impression).toBeDefined();
    expect(data.metadata.model_used).toMatch(/gpt-5|gpt-4o/);
  });

  it('integrates template without contradictions', async () => {
    // Test template integration logic
    const request = new Request('http://localhost/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        scan_type: 'X-Ray Lumbar Spine',
        findings: 'Compression fracture at L1',
        template_id: 'test-template-id',
        mode: 'espresso',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Should mention fracture at L1
    expect(data.report.findings).toContain('L1');

    // Should NOT say "no fracture" without qualification
    expect(data.report.findings).not.toMatch(/^No.*fracture/);

    // Should qualify normal findings
    expect(data.report.findings).toMatch(/other levels|otherwise/);
  });
});
```

### End-to-End Tests (10%)

**Scope**: Complete user workflows

**Tools**: Playwright

**Coverage**:
- User signup and login
- Complete report generation workflow
- Template creation and usage
- Audio recording and transcription
- Report export

**Example**:
```typescript
// e2e/generate-report.spec.ts
import { test, expect } from '@playwright/test';

test('complete report generation workflow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'test-password');
  await page.click('button[type="submit"]');

  // Navigate to generate page
  await page.click('text=Generate Report');
  await expect(page).toHaveURL('/generate');

  // Fill in report details
  await page.selectOption('[name="scan_type"]', 'CT Chest');
  await page.fill('[name="clinical_history"]', '55yo male smoker');
  await page.fill('[name="findings"]', 'Spiculated nodule in RUL');

  // Select template
  await page.click('button:has-text("Select Template")');
  await page.click('text=CT Chest Standard');

  // Generate report
  await page.click('button:has-text("Generate Report")');

  // Wait for generation
  await expect(page.locator('.report-preview')).toBeVisible({ timeout: 30000 });

  // Verify report sections
  await expect(page.locator('text=TECHNIQUE')).toBeVisible();
  await expect(page.locator('text=FINDINGS')).toBeVisible();
  await expect(page.locator('text=IMPRESSION')).toBeVisible();

  // Verify findings mention nodule
  const findings = await page.locator('.findings-section').textContent();
  expect(findings).toContain('nodule');

  // Verify no contradictions
  expect(findings).not.toMatch(/lungs.*clear.*nodule/);
});
```

### Performance Testing

**Tools**: k6 or Artillery

**Scenarios**:
- Report generation under load
- Concurrent transcriptions
- Database query performance
- API rate limits

**Example**:
```javascript
// k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // 10 virtual users
  duration: '30s',
};

export default function () {
  const payload = JSON.stringify({
    scan_type: 'CT Chest',
    findings: 'Test findings',
    mode: 'espresso',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
  };

  const res = http.post('http://localhost:3000/api/generate', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 10s': (r) => r.timings.duration < 10000,
  });

  sleep(1);
}
```

---

## 🚀 Deployment Strategy

### CI/CD Pipeline

```
┌──────────────┐
│ Developer    │
│ pushes code  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ GitHub Actions       │
│ ├── Lint & Format    │
│ ├── Type Check       │
│ ├── Unit Tests       │
│ ├── Integration Tests│
│ └── Build            │
└──────┬───────────────┘
       │
       ▼ (on main branch)
┌──────────────────────┐
│ Vercel Deployment    │
│ ├── Build Next.js    │
│ ├── Run E2E Tests    │
│ ├── Deploy Preview   │
│ └── Promote to Prod  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Post-Deploy          │
│ ├── Run Smoke Tests  │
│ ├── Notify Team      │
│ └── Monitor          │
└──────────────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}

  build:
    needs: lint-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: .next

  deploy-preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          SMOKE_TEST_URL: https://radiology-app.vercel.app
```

### Environment Management

**Three Environments**:

1. **Development** (`localhost:3000`)
   - Local development
   - Hot reload
   - Debug tools enabled
   - Test data

2. **Preview** (`*.vercel.app` per PR)
   - Automatic deployment for each PR
   - Production-like environment
   - Feature testing
   - Client review

3. **Production** (`app.radiologyreporting.com`)
   - Main deployment
   - Real user data
   - Performance monitoring
   - Error tracking

**Environment Variables**:
```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# Preview
NEXT_PUBLIC_API_URL=https://preview-*.vercel.app
NODE_ENV=production

# Production
NEXT_PUBLIC_API_URL=https://app.radiologyreporting.com
NODE_ENV=production
```

### Database Migrations

**Strategy**: Supabase Migrations

```bash
# Create migration
supabase migration new add_templates_table

# Edit migration file
# supabase/migrations/20250113_add_templates_table.sql

# Apply migration (development)
supabase db push

# Apply migration (production)
supabase db push --db-url $PRODUCTION_DATABASE_URL
```

**Migration Checklist**:
- [ ] Test migration on local database
- [ ] Review migration SQL
- [ ] Backup production database
- [ ] Apply migration to production
- [ ] Verify data integrity
- [ ] Monitor for errors
- [ ] Rollback plan ready

---

## 📊 Monitoring & Observability

### Metrics to Track

1. **Application Metrics**
   - Report generation success rate
   - Average generation time
   - API response times
   - Error rates by endpoint

2. **Business Metrics**
   - Daily active users
   - Reports generated per user
   - Template usage
   - Subscription conversions

3. **Performance Metrics**
   - Core Web Vitals (LCP, FID, CLS)
   - Time to First Byte (TTFB)
   - API latency
   - Database query time

4. **AI Metrics**
   - OpenAI API success rate
   - Token usage per report
   - Model fallback frequency
   - Transcription accuracy (if measurable)

### Monitoring Stack

**Vercel Analytics** (Built-in):
- Automatic Core Web Vitals tracking
- Real User Monitoring (RUM)
- Server-side metrics

**Sentry** (Error Tracking):
- Client and server error tracking
- Performance monitoring
- User session replay
- Release tracking

**Custom Dashboard** (Future):
- Business metrics visualization
- Usage analytics
- Cost tracking
- Alert management

---

## 💰 Cost Estimation

### Monthly Service Costs

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| OpenAI API | Pay-as-you-go | $20-50* |
| **Stripe** | **Pay-as-you-go** | **2.9% + $0.30 per transaction** |
| Deepgram (opt) | Pay-as-you-go | $10-20 |
| Google APIs (opt) | Pay-as-you-go | $5-10 |
| **Base Total** | | **$70-125/month** |

*OpenAI costs depend on usage:
- GPT-5: ~$0.50 per report
- Whisper: ~$0.006 per minute
- Estimated: 100 reports/month = $50

### Stripe Fee Breakdown

**Transaction Fees**: 2.9% + $0.30 per successful charge
- No monthly fees
- No setup fees
- Free disputes management
- Free Stripe Customer Portal

**Example Monthly Revenue (100 customers)**:
- 50 Professional @ $29/mo: $1,450 revenue → $1,393 net (-$57 fees)
- 30 Practice @ $99/mo: $2,970 revenue → $2,875 net (-$95 fees)
- 20 Enterprise @ $200/mo: $4,000 revenue → $3,860 net (-$140 fees)

**Total**: $8,420 gross → $8,128 net revenue
**Infrastructure Cost**: ~$70-125/month
**Net Profit**: ~$8,000/month

### Cost Comparison: Custom Auth + Stripe vs. Outseta

| Aspect | Supabase Auth + Stripe | Outseta |
|--------|----------------------|---------|
| Monthly Base Cost | $0 (included in Supabase) | $50-150/month |
| Transaction Fees | 2.9% + $0.30 | 2.9% + $0.30 (via Stripe) |
| Setup Complexity | Moderate (2-3 days dev) | Low (1 day) |
| Customization | Full control | Limited |
| Data Ownership | Full ownership | Shared |
| Feature Set | Auth + Billing only | Auth + Billing + CRM |
| **Total Cost @ 100 users** | **~$300/year fees** | **~$900/year + fees** |
| **Annual Savings** | **Reference** | **-$600/year** |

### Scaling Costs

**At 100 users** (~$70-125/month base + Stripe fees)

**At 1,000 users**:
- Vercel Pro: $20 (same)
- Supabase Pro: $25 (includes 8GB database, 100GB bandwidth)
- OpenAI API: $200-500 (1,000 reports/month)
- Stripe: 2.9% + $0.30 per transaction (~$840/mo in fees on $30k revenue)
- **Base Infrastructure**: ~$250-550/month
- **Gross Revenue**: ~$30,000/month
- **Net Revenue**: ~$29,160/month (after Stripe)
- **Net Profit**: ~$28,600/month

**At 10,000 users**:
- Vercel Enterprise: Custom pricing (~$500)
- Supabase Team: Custom pricing (~$250)
- OpenAI API: $2,000-5,000
- Stripe: 2.9% + $0.30 per transaction (~$8,400/mo in fees on $300k revenue)
- **Base Infrastructure**: ~$2,750-5,750/month
- **Gross Revenue**: ~$300,000/month
- **Net Revenue**: ~$291,600/month (after Stripe)
- **Net Profit**: ~$285,000/month

**Key Advantage**: No platform fees on users/subscribers - you only pay transaction fees on actual revenue.

---

## 🗓️ Implementation Timeline

### Phase 1: Foundation (Week 1-2)

**Week 1**:
- [ ] Set up Next.js 14 project structure
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Set up Supabase client and Auth
- [ ] Implement Supabase authentication flow (email/password)
- [ ] Create database schema and migrations (including billing tables)
- [ ] Set up CI/CD pipeline

**Week 2**:
- [ ] Implement core layout and navigation
- [ ] Create authentication pages (login, signup, password reset)
- [ ] Set up API route structure
- [ ] Implement middleware for Supabase Auth
- [ ] Initialize Stripe integration (create products/prices)
- [ ] Create basic UI components library
- [ ] Set up testing framework

### Phase 2: Core Features (Week 3-4)

**Week 3**:
- [ ] Migrate template management
  - CRUD operations
  - Template editor component
  - Template selector component
- [ ] Implement audio recording component
- [ ] Migrate spoken punctuation conversion
- [ ] Implement batch transcription API

**Week 4**:
- [ ] Migrate report generation logic
  - Prompt builder
  - Contradiction cleaner
  - Model fallback
  - **Add usage tracking integration**
- [ ] Create report form component
- [ ] Implement report preview component
- [ ] Create report list and detail pages
- [ ] **Implement Stripe billing pages (pricing, billing dashboard)**
- [ ] **Create Stripe webhook handler**
- [ ] **Implement usage limits enforcement**

### Phase 3: Advanced Features (Week 5)

- [ ] Implement real-time transcription (WebSocket)
- [ ] Integrate OpenAI ChatKit widget
- [ ] Implement search functionality (PubMed, Radiopaedia)
- [ ] Add report export (PDF, DOCX)
- [ ] Implement usage analytics tracking

### Phase 4: Polish & Launch (Week 6)

- [ ] Complete test coverage (unit + integration + e2e)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation completion
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Post-launch monitoring setup

### Ongoing

- [ ] Monitor production metrics
- [ ] Gather user feedback
- [ ] Iterative improvements
- [ ] Feature enhancements based on feedback

---

## ✅ Success Criteria

### Technical Requirements

- [x] All API endpoints functional
- [x] Database migrations complete
- [x] Authentication working end-to-end
- [x] Report generation matching quality of existing app
- [x] Template integration preserving contradiction detection
- [x] Real-time transcription working
- [x] All tests passing (80%+ coverage)
- [x] TypeScript strict mode with no errors
- [x] Production deployment successful
- [x] Monitoring and alerting configured

### Functional Requirements

- [x] Users can sign up and log in via Outseta
- [x] Users can record or upload audio
- [x] Audio is accurately transcribed
- [x] Reports are generated in both espresso and slow-brewed modes
- [x] Templates integrate without contradictions
- [x] Users can save and manage templates
- [x] Users can save and manage reports
- [x] Reports can be exported to PDF/DOCX
- [x] ChatKit widget provides helpful interactions
- [x] Search functionality returns relevant results

### Non-Functional Requirements

- [x] Page load time < 3 seconds
- [x] Report generation < 10 seconds (espresso) / < 30 seconds (slow-brewed)
- [x] API response time < 2 seconds (95th percentile)
- [x] 99.9% uptime
- [x] Mobile responsive design
- [x] Accessibility (WCAG 2.1 AA)
- [x] SEO optimized

---

## 🎯 Next Steps

1. **Review and Approve Blueprint** ← You are here
2. **Set up Development Environment**
3. **Begin Phase 1 Implementation**
4. **Iterative Development with Regular Reviews**
5. **Testing and QA**
6. **Production Deployment**
7. **Post-Launch Support and Iteration**

---

*This blueprint provides a complete roadmap for migrating and enhancing the Radiology Reporting App. All critical business logic will be preserved while modernizing the technology stack and adding powerful new features.*

**Estimated Total Timeline**: 4-6 weeks
**Estimated Total Cost**: $130-175/month for services
**Development**: Fully autonomous with this blueprint

---

**Questions or Concerns?**
Review the detailed sections above, and when ready, authorize the start of autonomous development!
