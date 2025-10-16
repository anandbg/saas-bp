# Project Constraints

## 📋 Overview

This document defines all technical, business, and regulatory constraints that must be adhered to during development.

---

## 🔧 Technical Constraints

### Technology Stack (MUST USE)

**Frontend**:
- Next.js 14+ with App Router (mandatory)
- React 18+ (mandatory)
- TypeScript 5+ with strict mode (mandatory)
- Tailwind CSS 3+ for styling (mandatory)

**Backend**:
- Next.js API Routes (mandatory)
- Vercel AI SDK 5 for AI operations (mandatory)
- Node.js 18+ runtime (mandatory)

**Database & Auth**:
- Supabase for PostgreSQL database (mandatory)
- Supabase Auth for authentication (mandatory - NOT Outseta)
- Row Level Security (RLS) must be enabled on all user-facing tables (mandatory)

**Billing**:
- Stripe for subscriptions and payments (mandatory - NOT Outseta)
- Stripe Customer Portal for self-service billing (mandatory)
- Usage tracking before allowing operations (mandatory)

**AI Services**:
- OpenAI GPT-5 for espresso mode (mandatory)
- OpenAI O3 for slow-brewed mode (mandatory)
- OpenAI GPT-4o as fallback model (mandatory)
- OpenAI Whisper for transcription (mandatory)
- Model fallback must be implemented (mandatory)

**Deployment**:
- Vercel for hosting (mandatory)
- Vercel Edge Network (recommended)

### Code Quality Standards (MANDATORY)

**TypeScript**:
- 100% TypeScript coverage (mandatory)
- Strict mode enabled (mandatory)
- No `any` types except where absolutely unavoidable (mandatory)
- All exported functions must have types (mandatory)

**Testing**:
- 80%+ overall test coverage (mandatory)
- 100% coverage on critical business logic (mandatory)
- Unit tests: 60% of test suite (mandatory)
- Integration tests: 30% of test suite (mandatory)
- E2E tests: 10% of test suite (mandatory)

**Linting**:
- ESLint configured (mandatory)
- Prettier configured (mandatory)
- Zero linting errors (mandatory)
- Pre-commit hooks configured (recommended)

---

## 🚨 Critical Business Logic to Preserve

### MUST PRESERVE EXACTLY - No Deviations Allowed

#### 1. Spoken Punctuation Conversion

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:155-184`

**Requirements**:
- ALL regex patterns must be preserved exactly
- Normalization logic must match exactly
- Conversion mappings must be identical:
  - "full stop" → "."
  - "comma" → ","
  - "new line" → "\n"
  - "colon" → ":"
  - "semicolon" → ";"
  - "question mark" → "?"
  - "exclamation mark" → "!"
  - "open parenthesis" / "close parenthesis" → "(", ")"
  - "hyphen" / "dash" → "-"

**Verification**:
- Must pass all original test cases
- Output must match original implementation character-for-character

**Location**: `lib/transcription/spoken-punctuation.ts`

#### 2. Contradiction Cleaning Algorithm

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:701-765`

**Requirements**:
- Organ system keyword mapping must be preserved exactly
- Negative finding detection logic must match exactly
- Adaptation rules must be identical:
  - "at other levels" insertion logic
  - "otherwise" insertion logic
  - "except for" handling
- No contradiction statements can appear in final output

**Verification**:
- Test with template: "The lungs are clear. No pleural effusion."
- With findings: "Nodule in right upper lobe."
- Must remove "The lungs are clear" completely
- Must preserve "No pleural effusion"
- Must NOT introduce new contradictions

**Location**: `lib/ai/contradiction-cleaner.ts`

#### 3. Report Generation Prompt

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/report_prompt.txt` (119 lines)

**Requirements**:
- Prompt text must be preserved EXACTLY (all 119 lines)
- No modifications to wording, structure, or examples
- No additions or deletions
- Placeholder replacement logic must match original

**Verification**:
- Hash/checksum of prompt text must match original
- Output JSON structure must match specifications exactly

**Location**: `lib/ai/prompts/report_prompt.txt`

#### 4. Two-Tier Generation Modes

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:418-897`

**Requirements**:
- **Espresso Mode**:
  - Uses GPT-5 model
  - Temperature: 0.3
  - Max tokens: 4000
  - Target time: < 10 seconds
  - Fallback to GPT-4o on failure

- **Slow-Brewed Mode**:
  - Uses O3 model
  - Temperature: 0.1
  - Max tokens: 8000
  - Target time: < 30 seconds
  - Includes literature references
  - Fallback to GPT-4o on failure

**Location**: `lib/ai/report-generator.ts`

#### 5. Template Integration

**Source**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js:418-897`

**Requirements**:
- Apply spoken punctuation FIRST (before template)
- Load template content
- Integrate findings with template
- Run contradiction cleaning
- Build prompt with integrated content
- Generate report
- Validate JSON structure

**Order of Operations** (MUST NOT CHANGE):
```
1. Apply spoken punctuation to findings
2. Load template (if specified)
3. Integrate findings with template
4. Clean contradictions
5. Build prompt from report_prompt.txt
6. Call OpenAI API with mode-specific settings
7. Implement model fallback if needed
8. Parse and validate JSON response
9. Save report metadata
10. Return structured report
```

**Location**: `lib/ai/report-generator.ts`

---

## 💰 Business Constraints

### Budget Constraints

**Monthly Infrastructure Budget**: $70-125/month

**Breakdown**:
- Vercel Pro: $20/month (mandatory)
- Supabase Pro: $25/month (mandatory)
- OpenAI API: $20-50/month (variable based on usage)
- Stripe: 2.9% + $0.30 per transaction (no monthly fee)
- Optional services: $5-30/month (Deepgram, Google APIs)

**Cost Optimization Requirements**:
- Use Supabase Auth instead of Outseta (saves $50-150/month)
- Use Stripe direct instead of third-party (no platform fees)
- Implement caching to reduce API calls
- Monitor and optimize OpenAI token usage

### Timeline Constraints

**Total Timeline**: 4-6 weeks (88 hours estimated)

**Phase Breakdown**:
- Phase 1 (Foundation): 18 hours (Week 1-2)
- Phase 2 (Core Features): 30 hours (Week 3-4)
- Phase 3 (Advanced Features): 18 hours (Week 5)
- Phase 4 (Testing & Launch): 22 hours (Week 6)

**Constraints**:
- Cannot extend timeline beyond 6 weeks without user approval
- Must obtain user approval before starting each phase
- Must update STATUS.md after completing each feature

### Pricing Tiers (Stripe)

**Must Implement These Plans**:
1. **Free**: 5 reports/month, 3 templates, 1GB storage
2. **Professional** ($29/month): 100 reports/month, 50 templates, 10GB storage
3. **Practice** ($99/month): 500 reports/month, 200 templates, 50GB storage, 10 team members
4. **Enterprise** ($200/month): Unlimited reports, unlimited templates, 500GB storage, 100 team members

**Billing Rules**:
- Usage limits must be enforced BEFORE allowing operations
- Exceeded limits must show upgrade prompt
- Stripe webhooks must handle all subscription events
- Customer Portal must be accessible from app

---

## 🔐 Security Constraints

### Authentication (MANDATORY)

**Supabase Auth Requirements**:
- Email/password authentication (mandatory)
- OAuth providers: Google, GitHub (mandatory)
- JWT tokens for session management (mandatory)
- Secure HTTP-only cookies (mandatory)
- CSRF protection (mandatory)
- Token refresh mechanism (mandatory)

**Authorization**:
- Row Level Security (RLS) on ALL user-facing tables (mandatory)
- Middleware protection on ALL protected routes (mandatory)
- API routes must verify authentication (mandatory)
- User context must be added to request headers (mandatory)

### Data Protection (MANDATORY)

**In Transit**:
- HTTPS only (enforced by Vercel) (mandatory)
- No unencrypted data transmission (mandatory)

**At Rest**:
- Database encryption (Supabase default) (mandatory)
- Secure file storage (Supabase Storage) (mandatory)

**Input Validation**:
- Zod schemas for all API inputs (mandatory)
- SQL injection prevention via parameterized queries (mandatory)
- XSS prevention via output sanitization (mandatory)

**Secrets Management**:
- Environment variables only (mandatory)
- Never commit secrets to git (mandatory)
- Separate dev/prod credentials (mandatory)
- Regular key rotation (recommended)

**API Security**:
- Rate limiting per user (recommended)
- Request size limits (mandatory)
- CORS configuration (mandatory)

---

## 📱 Platform Constraints

### Browser Support (MANDATORY)

**Supported Browsers**:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

**Not Supported**:
- Internet Explorer (all versions)
- Mobile browsers in Phase 1 (future support planned)

### Device Support

**Phase 1** (Current):
- Desktop/Laptop only
- Minimum resolution: 1280x720
- Responsive design for desktop sizes

**Future Phases**:
- Tablet support (iPad, Android tablets)
- Mobile support (iOS, Android)

### Accessibility Requirements (MANDATORY)

**WCAG 2.1 AA Compliance**:
- Keyboard navigation (mandatory)
- Screen reader support (mandatory)
- Color contrast ratios (mandatory)
- Alt text on images (mandatory)
- ARIA labels on interactive elements (mandatory)
- Focus indicators (mandatory)

---

## 🌐 API Constraints

### Rate Limits

**OpenAI API**:
- Respect OpenAI rate limits (mandatory)
- Implement retry logic with exponential backoff (mandatory)
- Monitor token usage (mandatory)

**Stripe API**:
- Respect Stripe rate limits (mandatory)
- Implement webhook idempotency (mandatory)

### Response Time Requirements

**API Endpoints**:
- < 2 seconds for 95th percentile (mandatory)
- < 5 seconds maximum (mandatory)

**Report Generation**:
- Espresso mode: < 10 seconds (mandatory)
- Slow-brewed mode: < 30 seconds (mandatory)

### Error Handling (MANDATORY)

**All API Routes Must**:
- Return proper HTTP status codes
- Return structured error responses
- Log errors server-side
- Never expose sensitive information in errors
- Handle all error scenarios gracefully

---

## 📦 Deployment Constraints

### Environment Requirements

**Three Environments Required**:
1. Development (local)
2. Preview (Vercel preview deployments per PR)
3. Production (Vercel production)

**Environment Variables**:
- Must be configured in Vercel
- Must never be committed to git
- Must have separate values per environment

### CI/CD Requirements

**GitHub Actions** (mandatory):
- Run on all pull requests
- Run linting
- Run type checking
- Run all tests
- Block merge if any check fails

**Vercel Deployment** (mandatory):
- Automatic preview deployments for PRs
- Automatic production deployment on main branch merge
- Post-deploy smoke tests

### Database Migrations

**Supabase Migrations** (mandatory):
- All schema changes via migrations
- Migrations must be reversible
- Test migrations locally before production
- Backup production database before migrations

---

## 🚫 Forbidden Practices

### Code

- ❌ NO `any` types (except unavoidable cases)
- ❌ NO `console.log` in production code
- ❌ NO hardcoded credentials or secrets
- ❌ NO SQL string concatenation (SQL injection risk)
- ❌ NO bypassing RLS policies (use service role key sparingly)
- ❌ NO skipping input validation
- ❌ NO client-side storage of sensitive data

### Architecture

- ❌ NO direct database access from client components
- ❌ NO exposing API keys to client
- ❌ NO skipping authentication checks
- ❌ NO modifying critical business logic behavior
- ❌ NO removing error handling
- ❌ NO circumventing handoff validation gates

### Process

- ❌ NO skipping test writing
- ❌ NO merging without passing tests
- ❌ NO skipping code review (self-review against specs)
- ❌ NO progressing without meeting handoff gates
- ❌ NO deploying without testing

---

## ✅ Compliance Checklist

Before marking any feature complete:

- [ ] All technology stack requirements met
- [ ] Critical business logic preserved exactly
- [ ] TypeScript strict mode passes
- [ ] Test coverage >= 80% (100% on critical logic)
- [ ] Security requirements met
- [ ] Performance requirements met
- [ ] Accessibility requirements met
- [ ] No forbidden practices used
- [ ] All handoff validation gates passed
- [ ] Documentation updated

---

## 📚 Reference

For implementation guidance, see:
- [REQUIREMENTS.md](./REQUIREMENTS.md) - What to build
- [TECHNICAL.md](../02-DESIGN/TECHNICAL.md) - How to build
- [CLAUDE.md](../../.claude/CLAUDE.md) - Development workflow

---

**Last Updated**: October 2025
**Status**: Living Document - Must be reviewed before starting any implementation
**Owner**: Requirements Analyst + Project Manager
