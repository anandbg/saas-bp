# Claude Development Guide - Radiology Reporting App

## 📋 Overview

This document serves as the comprehensive guide for developing the Radiology Reporting App. It consolidates all architectural decisions, technical specifications, and development processes.

**Project**: Migration from Node.js/Express to Next.js 14+ with modern integrations
**Status**: Phase 1 - Foundation
**Architecture**: Monolithic Next.js with Supabase Auth + Stripe Billing

---

## 🎯 Core Principles

### 1. Preserve Critical Business Logic
**MUST PRESERVE EXACTLY**:
- Prompt engineering from `report_prompt.txt`
- Spoken punctuation conversion logic
- Template integration with contradiction detection
- Two-tier generation modes (espresso/slow-brewed)
- Model fallback patterns (GPT-5→GPT-4o, O3→GPT-4o)

### 2. Modern Stack
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+, Tailwind CSS
- **Backend**: Next.js API Routes, Vercel AI SDK 5
- **Database**: Supabase (PostgreSQL 15+)
- **Auth**: Supabase Auth (Email/Password + OAuth)
- **Billing**: Stripe (Subscriptions + Customer Portal)
- **AI**: OpenAI (GPT-5, O3, Whisper), OpenAI ChatKit
- **Deployment**: Vercel

### 3. Quality Standards
- 100% TypeScript type coverage
- 80%+ test coverage (Unit + Integration + E2E)
- Strict ESLint + Prettier
- Row Level Security (RLS) on all tables
- Comprehensive error handling
- Performance monitoring

---

## 📐 Architecture Overview

### High-Level Flow
```
User Browser
    ↓
Next.js App (Vercel)
    ├── Server Components (SSR)
    ├── Client Components (Interactivity)
    ├── API Routes (Business Logic)
    └── Middleware (Auth Protection)
    ↓
External Services
    ├── Supabase (Database + Auth + Storage)
    ├── Stripe (Billing + Subscriptions)
    ├── OpenAI (GPT-5, O3, Whisper, ChatKit)
    ├── PubMed (Literature Search)
    └── Radiopaedia (Reference Search)
```

### Key Architectural Decisions
- **Auth**: Supabase Auth (not Outseta) - saves $50-150/month
- **Billing**: Stripe direct integration - full control + cost savings
- **AI**: Vercel AI SDK 5 + OpenAI direct API
- **ChatKit**: Embedded using `@openai/chatkit-react` (launched Oct 2025)

---

## 🗂️ Project Structure

```
radiology-reporting-app/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Public auth routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── audio/            # Audio recording/transcription
│   ├── templates/        # Template management
│   ├── reports/          # Report generation/management
│   └── chatkit/          # ChatKit integration
├── lib/                   # Core business logic
│   ├── auth/             # Authentication
│   ├── ai/               # AI services
│   ├── transcription/    # Transcription services
│   ├── templates/        # Template services
│   ├── reports/          # Report services
│   ├── billing/          # Stripe integration
│   ├── database/         # Supabase client
│   └── utils/            # Utilities
├── types/                 # TypeScript types
├── hooks/                 # Custom React hooks
└── tests/                 # Test suites
```

---

## 🔄 Development Workflow

### Before Starting Any Task

1. **Check Current Phase**
   - Read `IMPLEMENTATION_STATUS.md` to see what's completed
   - Identify which phase you're working on

2. **Understand Requirements**
   - Read `BLUEPRINT.md` for high-level architecture
   - Read `TECHNICAL_DESIGN.md` for implementation details
   - Check `ARCHITECTURE_DECISION_RECORD.md` for key decisions

3. **Plan Your Work**
   - Break down task into subtasks
   - Use TodoWrite tool to track progress
   - Identify dependencies

### When Implementing Features

#### Step 1: Read Existing Code
- **ALWAYS** read the original implementation first:
  - `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js`
  - Look for the specific function/logic you're migrating
  - Understand the EXACT behavior

#### Step 2: Create Types First
```typescript
// types/api.ts
export interface ReportGenerationInput {
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

#### Step 3: Implement Business Logic
```typescript
// lib/transcription/spoken-punctuation.ts
/**
 * CRITICAL: Must preserve exact behavior from original app
 * Source: RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:155-184
 */
export function applySpokenPunctuation(input: string): string {
  // Implementation with detailed comments
}
```

#### Step 4: Create API Routes
```typescript
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/api-protection';
import { ReportGenerationSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    // 1. Get authenticated user
    const user = getUserFromRequest(request);

    // 2. Validate input
    const body = await request.json();
    const validatedData = ReportGenerationSchema.parse(body);

    // 3. Check subscription limits
    await checkUsageLimit(user.id, 'report_generated');

    // 4. Generate report
    const result = await generateRadiologyReport(validatedData);

    // 5. Track usage
    await recordUsage(user.id, 'report_generated');

    // 6. Return result
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

#### Step 5: Build UI Components
```typescript
// components/reports/ReportForm.tsx
'use client';

import { useReportGeneration } from '@/hooks/useReportGeneration';
import { ReportGenerationInput } from '@/types/api';

export function ReportForm() {
  const { generate, isLoading, error } = useReportGeneration();

  const handleSubmit = async (data: ReportGenerationInput) => {
    const result = await generate(data);
    // Handle result
  };

  return (
    // Form UI
  );
}
```

#### Step 6: Write Tests
```typescript
// tests/unit/spoken-punctuation.test.ts
import { describe, it, expect } from 'vitest';
import { applySpokenPunctuation } from '@/lib/transcription/spoken-punctuation';

describe('applySpokenPunctuation', () => {
  it('converts "full stop" to period', () => {
    expect(applySpokenPunctuation('No fracture full stop'))
      .toBe('No fracture.');
  });

  // More test cases
});
```

### Git Workflow (MANDATORY)

**ALL developers and agents MUST follow Git workflow. See `docs/04-PROCESSES/GIT-WORKFLOW.md` for complete details.**

#### Quick Git Workflow Summary

1. **Create Feature Branch:**
   ```bash
   git checkout -b feature/X.Y-feature-name
   ```

2. **Commit at Validation Gates:**
   - After requirements approved: `git commit -m "docs(specs): Add requirements for Feature X.Y"`
   - After design approved: `git commit -m "docs(design): Add technical design for Feature X.Y"`
   - After implementation complete: `git commit -m "feat(scope): Implement Feature X.Y"`
   - After tests pass: `git commit -m "test(scope): Add test suite for Feature X.Y"`
   - After feature complete: `git commit -m "chore: Complete Feature X.Y"`

3. **Use Conventional Commits:**
   ```
   <type>(<scope>): <subject>

   Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
   Subject: At least 10 characters, imperative mood
   ```

4. **Push Regularly:**
   ```bash
   git push origin feature/X.Y-feature-name
   ```

5. **Create PR When Feature Complete:**
   ```bash
   gh pr create --title "Feature X.Y: Description" --body "Summary..."
   ```

#### Git Hooks (Automatic Validation)

- **Pre-commit**: Prevents committing credentials or sensitive files
- **Commit-msg**: Validates commit message follows conventional format

#### Never Commit

- ❌ `credentials.env` or any `.env*` files
- ❌ API keys, secrets, tokens, passwords
- ❌ `node_modules/`, `.next/`, build artifacts
- ❌ Log files, IDE settings

**📖 Full Documentation**: `docs/04-PROCESSES/GIT-WORKFLOW.md`

---

### When Working with Critical Logic

#### Spoken Punctuation Conversion
**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:155-184`
**Location**: `lib/transcription/spoken-punctuation.ts`
**Process**:
1. Read original implementation line-by-line
2. Preserve all regex patterns exactly
3. Maintain normalization logic
4. Add comprehensive test cases
5. Verify output matches original

#### Contradiction Cleaning
**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:701-765`
**Location**: `lib/ai/contradiction-cleaner.ts`
**Process**:
1. Understand organ system mapping
2. Preserve keyword detection logic
3. Maintain adaptation rules (e.g., "at other levels")
4. Test with real radiology findings
5. Verify no contradictions in output

#### Report Generation
**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:418-897`
**Location**: `lib/ai/report-generator.ts`
**Process**:
1. Apply spoken punctuation first
2. Load template if specified
3. Integrate findings with template
4. Build prompt from report_prompt.txt
5. Call OpenAI with model fallback
6. Validate JSON structure
7. Track usage and metadata

---

## 🔐 Authentication & Authorization

### Supabase Auth Flow
```
1. User clicks "Sign Up"
   ↓
2. Supabase Auth API creates account
   ↓
3. JWT token issued
   ↓
4. User profile created in public.users table
   ↓
5. RLS policies enforce data access
   ↓
6. User can access protected routes
```

### Implementation Pattern
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession(request);

  if (!session && isProtectedRoute(request.pathname)) {
    return redirectToLogin();
  }

  // Add user context to headers
  const headers = new Headers(request.headers);
  headers.set('x-user-id', session.user.id);

  return NextResponse.next({ request: { headers } });
}
```

### API Protection
```typescript
// lib/auth/api-protection.ts
export function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) throw new Error('Unauthorized');
  return { id: userId };
}
```

---

## 💳 Stripe Billing Integration

### Subscription Flow
```
1. User selects plan
   ↓
2. Create Stripe Checkout Session
   ↓
3. User completes payment
   ↓
4. Stripe webhook: subscription.created
   ↓
5. Create subscription record in Supabase
   ↓
6. Apply plan limits and features
   ↓
7. User can access features per tier
```

### Webhook Handler Pattern
```typescript
// app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Usage Tracking
```typescript
// lib/billing/usage-tracker.ts
export async function recordUsage(
  userId: string,
  usageType: 'report_generated' | 'transcription' | 'export'
) {
  // 1. Get user's subscription
  const subscription = await getActiveSubscription(userId);

  // 2. Record usage
  await supabase.from('usage_records').insert({
    user_id: userId,
    subscription_id: subscription.id,
    usage_type: usageType,
    billing_period_start: subscription.current_period_start,
    billing_period_end: subscription.current_period_end,
  });
}

export async function checkUsageLimit(
  userId: string,
  usageType: string
): Promise<void> {
  // 1. Get subscription limits
  const limits = await getSubscriptionLimits(userId);

  // 2. Count current usage
  const usage = await getCurrentUsage(userId, usageType);

  // 3. Check limit
  if (usage >= limits[usageType]) {
    throw new Error('Usage limit exceeded');
  }
}
```

---

## 🤖 AI Integration Patterns

### OpenAI Report Generation
```typescript
// lib/ai/vercel-ai-sdk.ts
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function generateReport(
  prompt: string,
  mode: 'espresso' | 'slow_brewed'
) {
  const model = mode === 'espresso' ? 'gpt-5' : 'o3';
  const fallbackModel = 'gpt-4o';

  try {
    const { text, usage } = await generateText({
      model: openai(model),
      prompt,
      temperature: mode === 'espresso' ? 0.3 : 0.1,
      maxTokens: mode === 'espresso' ? 4000 : 8000,
    });

    return { report: JSON.parse(text), metadata: { model_used: model, ...usage } };
  } catch (error) {
    console.error(`${model} failed, falling back to ${fallbackModel}`);

    // Fallback
    const { text, usage } = await generateText({
      model: openai(fallbackModel),
      prompt,
    });

    return {
      report: JSON.parse(text),
      metadata: { model_used: fallbackModel, fallback: true, ...usage }
    };
  }
}
```

### OpenAI Whisper Transcription
```typescript
// lib/transcription/whisper-client.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioFile: File) {
  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'verbose_json',
  });

  return {
    transcript: response.text,
    confidence: response.segments?.[0]?.avg_logprob || null,
    duration: response.duration,
  };
}
```

### OpenAI ChatKit Integration
```typescript
// components/chatkit/ChatKitWidget.tsx
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';

export function RadiologyChatWidget() {
  const { control } = useChatKit({
    api: {
      async getClientSecret() {
        const res = await fetch('/api/chatkit/session', { method: 'POST' });
        const { client_secret } = await res.json();
        return client_secret;
      },
    },
  });

  return (
    <ChatKit
      control={control}
      className="fixed bottom-4 right-4 w-[400px] h-[600px]"
    />
  );
}
```

---

## 🗄️ Database Design Principles

### Row Level Security (RLS)
**ALWAYS enable RLS on all user-facing tables**:
```sql
-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own reports
CREATE POLICY reports_select_own ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY reports_insert_own ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY reports_update_own ON reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY reports_delete_own ON reports
  FOR DELETE USING (auth.uid() = user_id);
```

### Query Optimization
```typescript
// ❌ BAD: Select all fields
const { data } = await supabase
  .from('reports')
  .select('*');

// ✅ GOOD: Select only needed fields
const { data } = await supabase
  .from('reports')
  .select('id, scan_type, created_at, status')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

### Indexes
```sql
-- Create indexes for common queries
CREATE INDEX idx_reports_user_created ON reports(user_id, created_at DESC);
CREATE INDEX idx_reports_scan_type ON reports(scan_type);
CREATE INDEX idx_templates_user_modality ON templates(user_id, modality);
```

---

## 🧪 Testing Strategy

### Test Pyramid
- **Unit Tests (60%)**: Individual functions
- **Integration Tests (30%)**: API routes + services
- **E2E Tests (10%)**: Complete user workflows

### Critical Test Cases

#### Spoken Punctuation
```typescript
const tests = [
  { input: 'No fracture full stop', expected: 'No fracture.' },
  { input: 'Nodule comma mass comma effusion', expected: 'Nodule, mass, effusion' },
  { input: 'Finding new line Finding', expected: 'Finding\nFinding' },
];
```

#### Contradiction Cleaning
```typescript
const template = `The lungs are clear. No pleural effusion.`;
const findings = 'Nodule in right upper lobe.';
const result = cleanConflictingNormals(findings, template);
// Should NOT contain "lungs are clear"
// Should preserve "no pleural effusion"
```

#### Report Generation
```typescript
// Test full generation pipeline
const result = await generateRadiologyReport({
  scan_type: 'CT Chest',
  findings: 'Spiculated nodule in RUL',
  mode: 'espresso',
});
// Verify structure, content, metadata
```

---

## 🚀 Deployment Process

### Environment Variables
```bash
# .env.local (Development)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx
STRIPE_SECRET_KEY=xxx
STRIPE_WEBHOOK_SECRET=xxx
STRIPE_PUBLISHABLE_KEY=xxx
```

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add STRIPE_SECRET_KEY
# ... (add all required env vars)

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Database Migration
```bash
# Create migration
npx supabase migration new add_billing_tables

# Edit migration file
# supabase/migrations/YYYYMMDD_add_billing_tables.sql

# Apply to local
npx supabase db push

# Apply to production
npx supabase db push --db-url $PRODUCTION_DATABASE_URL
```

---

## 📊 Monitoring & Debugging

### Key Metrics
- Report generation success rate
- Average generation time (< 10s espresso, < 30s slow-brewed)
- API response times (< 2s 95th percentile)
- Auth error rate (< 0.1%)
- Webhook processing success rate (> 99%)

### Debugging Checklist
1. **Auth Issues**:
   - Check JWT token validity
   - Verify RLS policies
   - Check middleware execution

2. **API Errors**:
   - Check request validation
   - Verify user authentication
   - Check external service status

3. **Report Generation**:
   - Verify prompt construction
   - Check OpenAI API status
   - Test model fallback

4. **Billing Issues**:
   - Check Stripe webhook delivery
   - Verify subscription status
   - Check usage limits

---

## 📚 Reference Documents

### Primary Documents
- **BLUEPRINT.md**: High-level architecture and requirements
- **TECHNICAL_DESIGN.md**: Implementation patterns and code structure
- **ARCHITECTURE_DECISION_RECORD.md**: Key architectural decisions
- **IMPLEMENTATION_STATUS.md**: Current progress and phase tracking

### Integration Guides
- **STRIPE_INTEGRATION.md**: Stripe setup and patterns
- **SETUP_CREDENTIALS_GUIDE.md**: Credential configuration

### Source Code
- **Original App**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/`
- **Sample Data**: `sample-data/`

---

## 🎯 Quick Command Reference

### Common Development Tasks

#### Start Development Server
```bash
npm run dev
```

#### Run Tests
```bash
npm run test           # All tests
npm run test:unit      # Unit tests only
npm run test:e2e       # E2E tests only
```

#### Type Checking
```bash
npm run type-check
```

#### Linting
```bash
npm run lint
npm run lint:fix
```

#### Database
```bash
npx supabase start      # Start local Supabase
npx supabase db reset   # Reset local database
npx supabase db push    # Apply migrations
```

#### Build
```bash
npm run build          # Production build
npm run start          # Start production server
```

---

## ✅ Pre-Implementation Checklist

Before starting any major feature:

- [ ] Read relevant section in BLUEPRINT.md
- [ ] Read implementation details in TECHNICAL_DESIGN.md
- [ ] Check IMPLEMENTATION_STATUS.md for dependencies
- [ ] Review original code in source app
- [ ] **Create feature branch** (e.g., `feature/X.Y-feature-name`)
- [ ] Create types first
- [ ] Write tests alongside implementation
- [ ] **Commit at each validation gate** with conventional format
- [ ] Update TodoWrite tool with progress
- [ ] **Push regularly** to backup work
- [ ] Document any deviations from plan
- [ ] **Create PR** when feature complete

---

## 🎯 Success Criteria

### Technical
- [ ] All API endpoints functional
- [ ] 100% TypeScript coverage
- [ ] 80%+ test coverage
- [ ] All RLS policies in place
- [ ] All critical logic migrated exactly
- [ ] Performance benchmarks met

### Functional
- [ ] Users can authenticate (email/password + OAuth)
- [ ] Users can manage subscriptions
- [ ] Audio recording/transcription works
- [ ] Report generation matches original quality
- [ ] Templates integrate without contradictions
- [ ] Reports can be exported

### Quality
- [ ] No console errors in production
- [ ] Mobile responsive
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Fast page loads (< 3s)
- [ ] Comprehensive error handling

---

## 💡 Development Tips

1. **Always Verify Against Original**: When migrating logic, compare output with original app
2. **Test Early**: Write tests alongside implementation
3. **Use Type Safety**: Let TypeScript catch errors at compile time
4. **Follow Patterns**: Maintain consistency with established patterns
5. **Document Decisions**: Update ADR when making architectural choices
6. **Monitor Performance**: Use Vercel Analytics and browser dev tools
7. **Security First**: Never expose secrets, always validate input
8. **User-Centric**: Prioritize user experience and error messages

---

**Last Updated**: January 2025
**Status**: Living Document - Update as project evolves
