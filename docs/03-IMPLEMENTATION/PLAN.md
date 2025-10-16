# Implementation Plan - Radiology Reporting App
## Supabase Auth + Stripe Billing Edition

**Version**: 2.0 (Revised)
**Date**: January 2025
**Architecture**: Next.js 14 + Supabase Auth + Stripe + OpenAI

---

## 📋 Executive Summary

This implementation plan details the migration of the Radiology Reporting App to a modern stack using:
- **Authentication**: Supabase Auth (email/password + OAuth)
- **Billing**: Stripe (subscriptions + usage tracking)
- **Database**: Supabase PostgreSQL
- **AI**: OpenAI (GPT-5, O3, Whisper)
- **Deployment**: Vercel

**Timeline**: 5-6 weeks
**Cost**: $70-125/month base + 2.9% + $0.30 per transaction

---

## 🎯 Key Changes from Original Plan

| Aspect | Original Plan | Revised Plan | Rationale |
|--------|--------------|-------------|-----------|
| Authentication | Outseta | Supabase Auth | Better integration, lower cost |
| Billing | Outseta | Stripe | Industry standard, full control |
| Monthly Cost | $130-175 | $70-125 + transaction fees | 40-45% savings on base costs |
| Setup Complexity | Low | Moderate | Trade-off for customization |
| Feature Control | Limited | Full | Complete ownership of auth & billing |

---

## 📅 Phase-by-Phase Implementation

### Phase 1: Foundation & Auth (Week 1-2) - 18 hours

#### Week 1: Project Setup & Database (10 hours)

**1.1 Project Initialization** (2 hours)
```bash
# Create Next.js project
npx create-next-app@latest radiology-app --typescript --tailwind --app

# Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install stripe @stripe/stripe-js
npm install zod react-hook-form @hookform/resolvers
npm install openai ai @ai-sdk/openai
```

**Deliverables**:
- ✅ Next.js 14 project structure
- ✅ TypeScript configuration
- ✅ Tailwind CSS setup
- ✅ ESLint + Prettier

**1.2 Supabase Setup** (3 hours)

```bash
# Initialize Supabase
npx supabase init
npx supabase start
```

**Tasks**:
- Create Supabase project
- Generate TypeScript types from schema
- Set up environment variables
- Configure Supabase Auth providers (Email, Google, GitHub)

**Deliverables**:
- ✅ Supabase client configured
- ✅ Environment variables set
- ✅ Auth providers enabled

**1.3 Database Schema** (5 hours)

Create migration files:
```bash
# Create migration
npx supabase migration new initial_schema
```

**Schema Implementation**:
1. **Users table** - Linked to auth.users
2. **Subscriptions table** - Stripe subscription data
3. **Usage_records table** - Track report generation
4. **Subscription_limits table** - Plan features
5. **Templates table** - Report templates
6. **Reports table** - Generated reports
7. **Audio_files table** - Uploaded audio
8. **Transcriptions table** - Transcription history
9. **Payments table** - Payment records

**Run migrations**:
```bash
npx supabase db push
```

**Deliverables**:
- ✅ All tables created
- ✅ RLS policies enabled
- ✅ Indexes created
- ✅ Sample data seeded

#### Week 2: Authentication & Stripe Setup (8 hours)

**2.1 Supabase Auth Implementation** (4 hours)

**Files to create**:
```
lib/auth/
  ├── supabase-auth.ts       # Auth helpers
  ├── auth-context.tsx       # React context
  └── protected-route.tsx    # Route guard

app/(auth)/
  ├── login/page.tsx
  ├── signup/page.tsx
  ├── reset-password/page.tsx
  └── callback/route.ts

middleware.ts                # Auth middleware
```

**Key Implementation**:
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
}
```

**Deliverables**:
- ✅ Login page functional
- ✅ Signup page functional
- ✅ Password reset working
- ✅ Protected routes enforced
- ✅ OAuth providers configured

**2.2 Stripe Integration** (4 hours)

**Stripe Dashboard Setup**:
1. Create Stripe account
2. Create products:
   - Professional Plan ($29/month or $290/year)
   - Practice Plan ($99/month or $990/year)
   - Enterprise Plan (custom)
3. Create webhook endpoint
4. Get API keys

**Files to create**:
```
lib/billing/
  ├── stripe-client.ts       # Stripe SDK
  ├── usage-tracker.ts       # Usage tracking
  └── subscription-manager.ts # Subscription helpers

app/api/billing/
  ├── checkout/route.ts      # Create checkout
  ├── portal/route.ts        # Customer portal
  └── usage/route.ts         # Usage endpoint

app/api/webhooks/
  └── stripe/route.ts        # Webhook handler

app/(dashboard)/
  ├── billing/page.tsx       # Billing dashboard
  └── pricing/page.tsx       # Plan selection
```

**Environment Variables**:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_PRACTICE_MONTHLY=price_...
STRIPE_PRICE_PRACTICE_YEARLY=price_...
```

**Test Webhook**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Deliverables**:
- ✅ Stripe checkout working
- ✅ Subscription creation functional
- ✅ Webhook handler processing events
- ✅ Billing dashboard displays data
- ✅ Customer portal accessible

---

### Phase 2: Core Features (Week 3-4) - 30 hours

#### Week 3: Templates & Transcription (14 hours)

**3.1 Template Management** (6 hours)

**Files**:
```
app/(dashboard)/templates/
  ├── page.tsx               # List templates
  ├── [id]/page.tsx          # View/edit template
  └── new/page.tsx           # Create template

app/api/templates/
  ├── route.ts               # GET, POST
  └── [id]/route.ts          # GET, PUT, DELETE

lib/templates/
  ├── template-service.ts    # CRUD operations
  └── template-validator.ts  # Validation logic

components/templates/
  ├── TemplateCard.tsx
  ├── TemplateEditor.tsx
  ├── TemplateSelector.tsx
  └── TemplateFilters.tsx
```

**Deliverables**:
- ✅ Template CRUD operations
- ✅ Template editor with rich text
- ✅ Template categorization (modality, body part)
- ✅ Default template selection
- ✅ Template search and filters

**3.2 Audio Transcription** (8 hours)

**Files**:
```
app/api/transcribe/
  ├── route.ts               # Batch transcription
  └── ws/route.ts            # WebSocket (Phase 3)

lib/transcription/
  ├── whisper-client.ts      # OpenAI Whisper
  ├── spoken-punctuation.ts  # CRITICAL: Preserve from original
  └── transcription-service.ts

components/audio/
  ├── AudioRecorder.tsx
  ├── AudioUploader.tsx
  ├── AudioVisualizer.tsx
  └── TranscriptionDisplay.tsx
```

**Critical Migration**:
```typescript
// lib/transcription/spoken-punctuation.ts
// MUST preserve exact logic from original index.js:155-184

export function applySpokenPunctuation(input: string): string {
  // Exact logic from original implementation
  // ...
}
```

**Deliverables**:
- ✅ Audio file upload working
- ✅ Whisper transcription functional
- ✅ Spoken punctuation conversion (preserved from original)
- ✅ Transcription display in UI
- ✅ Audio storage in Supabase Storage

#### Week 4: Report Generation & Billing Integration (16 hours)

**4.1 Report Generation** (10 hours)

**Files**:
```
app/api/generate/
  └── route.ts               # Report generation

lib/ai/
  ├── report-generator.ts    # Main generator
  ├── prompt-builder.ts      # Preserve report_prompt.txt logic
  ├── contradiction-cleaner.ts # CRITICAL: Preserve from original
  ├── model-fallback.ts      # GPT-5 → O3 → GPT-4o
  └── vercel-ai-sdk.ts      # Vercel AI SDK wrapper

app/(dashboard)/generate/
  └── page.tsx               # Generation UI

components/reports/
  ├── ReportForm.tsx
  ├── ReportPreview.tsx
  ├── GenerationOptions.tsx
  └── ModelSelector.tsx
```

**Critical Business Logic**:
1. **Spoken Punctuation** - lib/transcription/spoken-punctuation.ts
2. **Contradiction Cleaning** - lib/ai/contradiction-cleaner.ts
3. **Prompt Engineering** - lib/ai/prompt-builder.ts (preserve report_prompt.txt)
4. **Model Fallback** - lib/ai/model-fallback.ts

**Generation Flow**:
```typescript
1. Check user subscription & usage limits
2. Apply spoken punctuation conversion
3. Load template if specified
4. Clean contradictions
5. Build prompt from report_prompt.txt template
6. Call OpenAI API with model fallback
7. Validate JSON structure
8. Track usage
9. Save report
10. Return to user
```

**Deliverables**:
- ✅ Espresso mode (GPT-5) working
- ✅ Slow-brewed mode (O3) working
- ✅ Template integration functional
- ✅ Contradiction cleaning preserved
- ✅ Model fallback operational

**4.2 Usage Tracking & Limits** (4 hours)

**Files**:
```
lib/billing/
  ├── usage-tracker.ts       # Track usage
  └── limit-enforcer.ts      # Enforce limits

app/api/usage/
  └── route.ts               # Usage endpoint

components/billing/
  ├── UsageDisplay.tsx
  ├── UsageLimitWarning.tsx
  └── UpgradePrompt.tsx
```

**Usage Tracking Implementation**:
```typescript
// Before generating report
const limits = await checkUsageLimits(userId);
if (!limits.allowed) {
  throw new Error('Usage limit exceeded');
}

// After generating report
await trackUsage(userId, 'report_generated', reportId);
```

**Deliverables**:
- ✅ Usage tracking functional
- ✅ Limits enforced per plan
- ✅ Usage displayed in dashboard
- ✅ Warnings before limit reached
- ✅ Upgrade prompts shown

**4.3 Billing Dashboard** (2 hours)

**Files**:
```
app/(dashboard)/billing/
  └── page.tsx               # Billing overview

components/billing/
  ├── SubscriptionCard.tsx
  ├── PaymentMethodCard.tsx
  ├── InvoiceList.tsx
  └── PlanComparison.tsx
```

**Deliverables**:
- ✅ Current plan displayed
- ✅ Usage metrics shown
- ✅ Payment history visible
- ✅ Customer Portal link functional
- ✅ Upgrade/downgrade options

---

### Phase 3: Advanced Features (Week 5) - 18 hours

**3.1 Real-time Transcription** (6 hours)
```
app/api/transcribe/ws/route.ts  # WebSocket endpoint
components/audio/RealTimeTranscription.tsx
```

**3.2 OpenAI ChatKit Widget** (4 hours)
```
npm install @openai/chatkit-react

app/api/chatkit/session/route.ts
components/chatkit/ChatKitWidget.tsx
```

**3.3 Literature Search** (5 hours)
```
lib/search/
  ├── pubmed-client.ts
  ├── radiopaedia-client.ts
  └── google-client.ts (optional)

app/api/search/
  ├── pubmed/route.ts
  ├── radiopaedia/route.ts
  └── google/route.ts
```

**3.4 Report Export** (3 hours)
```
lib/reports/
  ├── pdf-exporter.ts
  └── docx-exporter.ts

app/api/reports/[id]/export/route.ts
```

**Deliverables**:
- ✅ Real-time transcription working
- ✅ ChatKit widget integrated
- ✅ Literature search functional
- ✅ PDF/DOCX export working

---

### Phase 4: Testing & Launch (Week 6) - 22 hours

**4.1 Testing** (10 hours)
- Unit tests (60% coverage)
- Integration tests (API routes)
- E2E tests (Playwright)
- Billing flow tests

**4.2 Security & Performance** (6 hours)
- Security audit
- Rate limiting
- Performance optimization
- Load testing

**4.3 Deployment** (4 hours)
- Vercel production deployment
- Stripe production webhook
- Environment variables
- Monitoring setup

**4.4 Documentation** (2 hours)
- API documentation
- User guide
- Deployment guide
- Billing guide

---

## 🧪 Testing Strategy

### Critical Tests

**1. Authentication Tests**
```typescript
// auth.test.ts
test('user can sign up with email/password')
test('user can log in')
test('user can reset password')
test('protected routes redirect to login')
test('OAuth providers work')
```

**2. Billing Tests**
```typescript
// billing.test.ts
test('user can create subscription')
test('webhook processes subscription.created')
test('usage limits enforced correctly')
test('user can upgrade plan')
test('user can access customer portal')
```

**3. Report Generation Tests**
```typescript
// report-generation.test.ts
test('espresso mode generates valid report')
test('slow-brewed mode generates detailed report')
test('contradiction cleaning works')
test('template integration preserves logic')
test('usage tracked after generation')
test('generation blocked when limit exceeded')
```

**4. Business Logic Tests**
```typescript
// spoken-punctuation.test.ts
test('converts "full stop" to period')
test('converts "comma" to comma')
test('handles multiple punctuation')

// contradiction-cleaner.test.ts
test('removes "lungs clear" when nodule present')
test('adapts "no fracture" for specific level')
test('preserves normals for unaffected systems')
```

---

## 📊 Success Criteria

### Phase 1
- [ ] User can sign up and log in
- [ ] Subscription can be created via Stripe
- [ ] Database populated correctly
- [ ] Protected routes work
- [ ] Tests passing

### Phase 2
- [ ] Templates can be created/edited
- [ ] Audio can be transcribed
- [ ] Reports can be generated
- [ ] Usage limits enforced
- [ ] Critical logic preserved
- [ ] Tests passing

### Phase 3
- [ ] Real-time features working
- [ ] ChatKit integrated
- [ ] Export functional
- [ ] Tests passing

### Phase 4
- [ ] All tests passing (80%+ coverage)
- [ ] Production deployment successful
- [ ] Performance benchmarks met
- [ ] Security audit complete
- [ ] Documentation complete

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables set in Vercel
- [ ] Stripe products created in production
- [ ] Supabase production database migrated
- [ ] Webhook endpoints configured

### Deployment
- [ ] Deploy to Vercel
- [ ] Verify production build
- [ ] Test authentication flow
- [ ] Test subscription creation
- [ ] Test report generation
- [ ] Verify webhook receiving events

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check Stripe webhook events
- [ ] Verify database connections
- [ ] Test end-to-end user flows
- [ ] Set up monitoring alerts

---

## 🛠️ Development Commands

```bash
# Development
npm run dev                    # Start dev server
npm run type-check            # Check TypeScript
npm run lint                  # Lint code
npm run test                  # Run tests
npm run test:watch            # Watch tests

# Supabase
npx supabase start            # Start local Supabase
npx supabase db reset         # Reset database
npx supabase gen types typescript --local > types/database.ts

# Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger subscription.created  # Test webhook

# Build
npm run build                 # Production build
npm run start                 # Start production server
```

---

## 📚 Key Resources

### Documentation
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/build-subscriptions)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

### Code References
- Original App: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/`
- Critical Logic: `index.js:155-184` (spoken punctuation), `index.js:701-765` (contradiction cleaning)
- Prompt Template: `report_prompt.txt` (119 lines)

---

## 💡 Implementation Tips

1. **Start Small**: Get auth working first before adding billing
2. **Test Stripe in Test Mode**: Use test cards and test webhooks
3. **Preserve Critical Logic**: Copy exact functions for spoken punctuation and contradiction cleaning
4. **Use TypeScript Strictly**: Enable strict mode for type safety
5. **Monitor Webhook Events**: Use Stripe dashboard to debug
6. **Track Usage from Day 1**: Implement usage tracking early
7. **Test Limits**: Verify plan limits work before launch

---

## 📞 Support & Resources

**If Blocked**:
1. Check Supabase logs
2. Check Stripe webhook events
3. Review error logs in Vercel
4. Consult STRIPE_INTEGRATION.md
5. Consult TECHNICAL_DESIGN.md

**Common Issues**:
- Webhook not receiving events → Check webhook secret
- RLS blocking queries → Verify user context set
- Usage limits not enforcing → Check subscription status query
- Auth redirect loop → Verify middleware configuration

---

**Status**: Ready for Implementation
**Next Step**: Phase 1.1 - Project Initialization
**Estimated Completion**: 5-6 weeks from start
**Total Effort**: ~88 hours
