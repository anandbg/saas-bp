# Feature 1.2: Environment Configuration

## Overview

### Feature ID

1.2

### Feature Name

Environment Configuration

### Description

Configure all required and optional environment variables for the Radiology Reporting App. This feature establishes the foundation for all external service integrations including Supabase, OpenAI, Stripe, and optional services like Deepgram and Google Custom Search.

### Priority

**CRITICAL** - Must be completed before any service integration features (1.3, 1.4, 1.5)

### Estimated Time

1 hour

### Dependencies

- Feature 1.1: Project Setup (COMPLETED)

### Related Documents

- `/Users/anand/radiology-ai-app/SETUP_CREDENTIALS_GUIDE.md` - Credential acquisition guide
- `/Users/anand/radiology-ai-app/.env.example` - Environment template (56 lines)
- `/Users/anand/radiology-ai-app/backups/radiology-app-20251016_135653/credentials.env.template` - Full credentials template (285 lines)
- `/Users/anand/radiology-ai-app/scripts/verify-setup.sh` - Validation script (427 lines)
- `/Users/anand/radiology-ai-app/docs/00-PROJECT/CONSTRAINTS.md` - Security and technical constraints

---

## Technical Approach

### Architecture Pattern

**Environment Configuration Strategy:**

1. Use `.env.local` for local development (Next.js convention)
2. Use `.env.example` as public template (committed to git)
3. Use Vercel environment variables for preview/production deployments
4. Never commit actual credentials to version control

**File Structure:**

```
radiology-ai-app/
├── .env.example              # Public template (56 variables)
├── .env.local               # Local dev (gitignored, created by user)
├── .gitignore               # Must exclude .env.local, credentials.env
├── scripts/
│   ├── verify-setup.sh      # Validates all credentials
│   └── verify-credentials.sh # Focused credential validation
└── docs/
    └── specs/features/1.2-environment-configuration/
        ├── SPEC.md          # This file
        └── ACCEPTANCE.md    # Acceptance criteria
```

### Environment Variable Categories

#### 1. Application Configuration (REQUIRED)

- `NEXT_PUBLIC_APP_URL` - Application base URL
- `NODE_ENV` - Environment mode (development/production)

#### 2. Supabase Configuration (REQUIRED for Feature 1.3)

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Server-side admin key (SENSITIVE)

#### 3. OpenAI Configuration (REQUIRED for Feature 2.2, 2.3)

- `OPENAI_API_KEY` - OpenAI API key (SENSITIVE)

#### 4. Stripe Configuration (REQUIRED for Feature 1.5)

- `STRIPE_SECRET_KEY` - Stripe secret key (SENSITIVE)
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Client-safe Stripe key
- `STRIPE_WEBHOOK_SECRET` - Webhook signature validation (SENSITIVE)

#### 5. Optional Services

- `DEEPGRAM_API_KEY` - Alternative transcription service
- `GOOGLE_API_KEY` - Google Custom Search API
- `GOOGLE_SEARCH_ENGINE_ID` - Search engine identifier
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- `SENTRY_AUTH_TOKEN` - Sentry deployment tracking
- `DEBUG` - Enable verbose logging

### Security Requirements

**MANDATORY Security Rules (from CONSTRAINTS.md:256-283):**

1. ✅ All secrets in environment variables only
2. ✅ Never commit secrets to git
3. ✅ Separate dev/prod credentials
4. ✅ Environment variables configured in Vercel for deployments
5. ✅ .env.local must be in .gitignore
6. ✅ credentials.env must be in .gitignore (if used)

**Forbidden Practices (from CONSTRAINTS.md:394-403):**

- ❌ NO hardcoded credentials or secrets in code
- ❌ NO client-side storage of sensitive data
- ❌ NO exposing API keys to client (except NEXT*PUBLIC*\* keys)

---

## Environment Variables Required

### Complete List from .env.example

```bash
# =============================================================================
# Application Configuration
# =============================================================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# =============================================================================
# Supabase Configuration (Feature 1.3)
# =============================================================================
# Get from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# =============================================================================
# OpenAI Configuration (Feature 2.2)
# =============================================================================
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# =============================================================================
# Stripe Configuration (Feature 1.5)
# =============================================================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# =============================================================================
# Optional Services
# =============================================================================
# Deepgram API (optional transcription alternative)
DEEPGRAM_API_KEY=

# Google Custom Search (optional)
GOOGLE_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=

# Sentry (optional error tracking)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# =============================================================================
# Development Only
# =============================================================================
DEBUG=false
```

### Variable Validation Rules

| Variable                             | Required | Phase | Format  | Validation                               |
| ------------------------------------ | -------- | ----- | ------- | ---------------------------------------- |
| `NEXT_PUBLIC_APP_URL`                | YES      | 1.2   | URL     | Must be valid HTTP/HTTPS URL             |
| `NODE_ENV`                           | YES      | 1.2   | String  | `development` or `production`            |
| `NEXT_PUBLIC_SUPABASE_URL`           | YES      | 1.3   | URL     | Must end in `.supabase.co`               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | YES      | 1.3   | JWT     | Must start with `eyJ`                    |
| `SUPABASE_SERVICE_ROLE_KEY`          | YES      | 1.3   | JWT     | Must start with `eyJ`                    |
| `OPENAI_API_KEY`                     | YES      | 2.2   | String  | Must start with `sk-proj-` or `sk-`      |
| `STRIPE_SECRET_KEY`                  | YES      | 1.5   | String  | Must start with `sk_test_` or `sk_live_` |
| `STRIPE_PUBLISHABLE_KEY`             | YES      | 1.5   | String  | Must start with `pk_test_` or `pk_live_` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | YES      | 1.5   | String  | Must match `STRIPE_PUBLISHABLE_KEY`      |
| `STRIPE_WEBHOOK_SECRET`              | YES      | 1.5   | String  | Must start with `whsec_`                 |
| `DEEPGRAM_API_KEY`                   | NO       | 3.1   | String  | Optional                                 |
| `GOOGLE_API_KEY`                     | NO       | 3.3   | String  | Optional                                 |
| `GOOGLE_SEARCH_ENGINE_ID`            | NO       | 3.3   | String  | Optional                                 |
| `NEXT_PUBLIC_SENTRY_DSN`             | NO       | 4.3   | URL     | Optional                                 |
| `SENTRY_AUTH_TOKEN`                  | NO       | 4.3   | String  | Optional                                 |
| `DEBUG`                              | NO       | All   | Boolean | `true` or `false`                        |

---

## Validation Steps

### Manual Validation Process

#### Step 1: File Creation

```bash
# User action: Copy template to local environment file
cp .env.example .env.local

# Verify file exists
ls -la .env.local
# Expected: File exists with 644 permissions

# Verify file is gitignored
git check-ignore .env.local
# Expected: .env.local (confirms it's ignored)
```

#### Step 2: Credential Population

```bash
# User fills in credentials using SETUP_CREDENTIALS_GUIDE.md
# This is manual - user must obtain credentials from each service

# Required for immediate use (Phase 1):
# - NEXT_PUBLIC_APP_URL
# - NODE_ENV
# - NEXT_PUBLIC_SUPABASE_URL (Feature 1.3)
# - NEXT_PUBLIC_SUPABASE_ANON_KEY (Feature 1.3)
# - SUPABASE_SERVICE_ROLE_KEY (Feature 1.3)
# - STRIPE_SECRET_KEY (Feature 1.5)
# - STRIPE_PUBLISHABLE_KEY (Feature 1.5)
# - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (Feature 1.5)
# - STRIPE_WEBHOOK_SECRET (Feature 1.5)

# Required for Phase 2:
# - OPENAI_API_KEY (Feature 2.2)
```

#### Step 3: Automated Validation

```bash
# Run verification script
./scripts/verify-setup.sh

# Expected output sections:
# 1. Loading Environment Variables ✓
# 2. Checking Prerequisites ✓
# 3. Checking CLI Tools (warnings OK for optional tools)
# 4. Verifying GitHub Credentials ✓
# 5. Verifying Vercel Credentials ✓
# 6. Verifying Supabase Credentials ✓
# 7. Verifying OpenAI Credentials ✓
# 8. Verifying Stripe Credentials ✓
# 9. Verifying Optional Services (warnings OK)
# 10. Checking AI Model Configuration
# 11. Checking Feature Flags
# 12. Checking Project Structure ✓
# 13. Verification Summary
#     - Passed: 20+
#     - Warnings: 5-10 (optional services OK)
#     - Failed: 0
```

### Verification Script Behavior

**Source:** `/Users/anand/radiology-ai-app/scripts/verify-setup.sh` (lines 1-427)

**Key Functions:**

- `check_env_var()` - Validates required variables exist (lines 69-77)
- `check_env_var_optional()` - Validates optional variables (lines 79-87)
- API connectivity tests for each service (lines 156-323)
- Model availability checks for OpenAI (lines 239-258)

**Exit Codes:**

- `0` - All required checks passed (warnings allowed)
- `1` - One or more required checks failed

**Output Format:**

- ✓ Green checkmarks for passed checks
- ✗ Red X marks for failed checks
- ⚠ Yellow warnings for optional services
- ℹ Blue info messages

### Validation Criteria by Service

#### Supabase (Lines 199-219)

```bash
# Tests performed:
1. Check NEXT_PUBLIC_SUPABASE_URL is set
2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set
3. Check SUPABASE_SERVICE_ROLE_KEY is set
4. Check SUPABASE_PROJECT_REF is set
5. Check SUPABASE_ACCESS_TOKEN is set
6. API connectivity: curl with anon key
   - Success: Response contains "message" or "hint"
   - Warning: Database may need setup
```

#### OpenAI (Lines 222-262)

```bash
# Tests performed:
1. Check OPENAI_API_KEY is set
2. Check OPENAI_ORG_ID is set
3. API connectivity: curl /v1/models endpoint
   - Success: Response contains .data array
4. Model availability checks:
   - GPT-5: Warning if not available (will use fallback)
   - O3: Warning if not available (will use fallback)
   - Whisper: Warning if not in models list
```

#### Stripe (Lines 265-286) - Note: Script still references Outseta

**IMPORTANT:** The current verify-setup.sh references Outseta (lines 265-286), but per ARCHITECTURE_DECISION_RECORD.md, we're using Stripe instead. This will need to be updated in implementation.

**Required Stripe Checks:**

```bash
# Should test:
1. Check STRIPE_SECRET_KEY is set
2. Check STRIPE_PUBLISHABLE_KEY is set
3. Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
4. Check STRIPE_WEBHOOK_SECRET is set
5. Verify STRIPE_PUBLISHABLE_KEY == NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
6. API connectivity: curl with secret key
```

---

## Acceptance Criteria

### AC-1: Environment File Creation

**GIVEN** the project is set up (Feature 1.1 complete)
**WHEN** the developer runs `cp .env.example .env.local`
**THEN** a `.env.local` file is created with all template variables
**AND** the file contains 56 lines of environment variable definitions
**AND** all variables are empty (template state)

### AC-2: Git Ignore Protection

**GIVEN** `.env.local` file exists
**WHEN** the developer runs `git status`
**THEN** `.env.local` does NOT appear in untracked files
**AND** running `git check-ignore .env.local` returns `.env.local`
**AND** the file is protected from accidental commit

### AC-3: Required Variable Validation

**GIVEN** `.env.local` is populated with all required credentials
**WHEN** the verification script runs `./scripts/verify-setup.sh`
**THEN** all required environment variables pass validation:

- ✓ NEXT_PUBLIC_APP_URL is set and valid
- ✓ NODE_ENV is set
- ✓ NEXT_PUBLIC_SUPABASE_URL is set and ends with `.supabase.co`
- ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY is set and starts with `eyJ`
- ✓ SUPABASE_SERVICE_ROLE_KEY is set and starts with `eyJ`
- ✓ OPENAI_API_KEY is set and starts with `sk-` or `sk-proj-`
- ✓ STRIPE*SECRET_KEY is set and starts with `sk_test*`or`sk*live*`
- ✓ STRIPE*PUBLISHABLE_KEY is set and starts with `pk_test*`or`pk*live*`
- ✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set and matches STRIPE_PUBLISHABLE_KEY
- ✓ STRIPE*WEBHOOK_SECRET is set and starts with `whsec*`

### AC-4: API Connectivity Validation

**GIVEN** all required credentials are set
**WHEN** the verification script runs API tests
**THEN** the following services respond successfully:

- ✓ Supabase API returns valid response (status 200 or error with message)
- ✓ OpenAI API returns models list (status 200)
- ✓ Stripe API validates secret key (status 200)

### AC-5: Model Availability Check

**GIVEN** OpenAI API is accessible
**WHEN** the verification script checks model availability
**THEN** the script reports:

- ✓ GPT-5 availability (or ⚠ warning with fallback notice)
- ✓ O3 availability (or ⚠ warning with fallback notice)
- ✓ Whisper availability confirmation

### AC-6: Optional Services Handling

**GIVEN** optional environment variables are NOT set
**WHEN** the verification script runs
**THEN** optional services show warnings (not failures):

- ⚠ DEEPGRAM_API_KEY is not set (optional)
- ⚠ GOOGLE_API_KEY is not set (optional)
- ⚠ GOOGLE_SEARCH_ENGINE_ID is not set (optional)
- ⚠ NEXT_PUBLIC_SENTRY_DSN is not set (optional)
- ⚠ SENTRY_AUTH_TOKEN is not set (optional)
  **AND** the script exits with code 0 (success)

### AC-7: Verification Script Success

**GIVEN** all required credentials are valid
**WHEN** `./scripts/verify-setup.sh` completes
**THEN** the summary shows:

- Passed: ≥ 20 checks
- Warnings: 5-15 (optional services and unavailable models)
- Failed: 0 checks
  **AND** the script exits with code 0
  **AND** displays message: "✓ Setup verification complete! All required checks passed."

### AC-8: Verification Script Failure Handling

**GIVEN** one or more required credentials are missing or invalid
**WHEN** `./scripts/verify-setup.sh` runs
**THEN** the summary shows:

- Failed: ≥ 1 check
  **AND** the script exits with code 1
  **AND** displays message: "✗ Setup verification failed with N error(s)"
  **AND** provides actionable guidance: "Refer to SETUP_CREDENTIALS_GUIDE.md"

### AC-9: Next.js Environment Loading

**GIVEN** `.env.local` is properly configured
**WHEN** the developer runs `npm run dev`
**THEN** Next.js loads all environment variables
**AND** `NEXT_PUBLIC_*` variables are accessible in browser console
**AND** server-only variables (SECRET, SERVICE_ROLE) are NOT exposed to client
**AND** the app starts without environment variable errors

### AC-10: Vercel Deployment Readiness

**GIVEN** local environment is validated
**WHEN** the developer prepares for Vercel deployment
**THEN** documentation exists for:

- Setting environment variables in Vercel dashboard
- Separating preview and production environments
- Securing sensitive keys (no NEXT*PUBLIC* prefix)
- Webhook endpoint configuration
  **AND** `.env.example` serves as reference for required variables

---

## Success Metrics

### Quantitative Metrics

1. **Validation Pass Rate:** 100% of required checks pass
2. **Setup Time:** ≤ 30 minutes for credential acquisition and validation
3. **Script Execution Time:** ≤ 60 seconds for full verification
4. **Git Protection:** 0% chance of accidental credential commit

### Qualitative Metrics

1. **Developer Experience:** Clear error messages for missing/invalid credentials
2. **Documentation Quality:** Developer can complete setup with only SETUP_CREDENTIALS_GUIDE.md
3. **Security Posture:** All sensitive credentials properly protected
4. **Service Readiness:** All Phase 1 services can authenticate successfully

### Completion Checklist

- [ ] `.env.example` file exists and is committed to git
- [ ] `.env.local` is added to `.gitignore`
- [ ] `credentials.env` is added to `.gitignore` (if present)
- [ ] All required environment variables documented in `.env.example`
- [ ] `./scripts/verify-setup.sh` script exists and is executable
- [ ] Verification script validates all required services
- [ ] Verification script provides clear pass/fail output
- [ ] Verification script exits with correct status codes
- [ ] SETUP_CREDENTIALS_GUIDE.md provides acquisition instructions
- [ ] Documentation includes Vercel deployment guidance
- [ ] Feature 1.2 marked complete in STATUS.md
- [ ] Git commit made: `git commit -m "feat(config): Complete Feature 1.2 - Environment Configuration"`

---

## Implementation Notes

### Order of Operations

1. ✅ Verify `.env.example` exists (should exist from Feature 1.1)
2. ✅ Verify `.gitignore` excludes `.env.local` and `credentials.env`
3. ✅ Developer copies `.env.example` to `.env.local`
4. ⚠️ Developer obtains credentials (external process, documented in SETUP_CREDENTIALS_GUIDE.md)
5. ⚠️ Developer populates `.env.local` with actual credentials
6. ✅ Developer runs `./scripts/verify-setup.sh`
7. ✅ All required checks pass (warnings for optional services OK)
8. ✅ Feature 1.2 marked complete

### Known Issues and Considerations

1. **Outseta vs Stripe:** Current verify-setup.sh (lines 265-286) checks Outseta credentials, but per ARCHITECTURE_DECISION_RECORD.md, we're using Stripe. This section must be updated to validate Stripe credentials instead.

2. **Model Availability:** GPT-5 and O3 may not be available to all OpenAI accounts. The script should warn but not fail if fallback models (gpt-4o, gpt-4o-mini) are available.

3. **Credential Acquisition Time:** Obtaining credentials from all services (Supabase, OpenAI, Stripe) is an external dependency that may take 15-30 minutes. This is not included in the 1-hour feature estimate.

4. **Local vs Vercel Configuration:** `.env.local` is for local development only. Vercel deployments require separate environment variable configuration in the Vercel dashboard.

5. **Security:** The verify-setup.sh script loads credentials into environment variables for testing. Ensure script is only run locally, never in CI/CD pipelines where credentials might be logged.

### Verification Script Updates Required

The following updates to `verify-setup.sh` are needed during implementation:

```bash
# Line 265-286: Replace Outseta verification with Stripe verification
print_header "Verifying Stripe Credentials"

check_env_var STRIPE_SECRET_KEY
check_env_var STRIPE_PUBLISHABLE_KEY
check_env_var NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
check_env_var STRIPE_WEBHOOK_SECRET

# Verify publishable key consistency
if [ "$STRIPE_PUBLISHABLE_KEY" != "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    print_error "STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must match"
fi

# Test Stripe API access
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    print_info "Testing Stripe API access..."
    STRIPE_RESPONSE=$(curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/customers?limit=1)

    if echo "$STRIPE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        print_success "Stripe API access verified"
    else
        print_error "Stripe API access failed - check your secret key"
    fi
fi
```

---

## Dependencies

### Prerequisite Features

- ✅ Feature 1.1: Project Setup (COMPLETED)

### Downstream Features (Blocked by 1.2)

- ⏸️ Feature 1.3: Supabase Integration (requires Supabase credentials)
- ⏸️ Feature 1.4: Supabase Authentication (requires Supabase credentials)
- ⏸️ Feature 1.5: Stripe Integration Setup (requires Stripe credentials)
- ⏸️ Feature 2.2: Audio Transcription (requires OpenAI credentials)
- ⏸️ Feature 2.3: Report Generation - Espresso Mode (requires OpenAI credentials)

### External Dependencies

- Supabase project creation and configuration
- OpenAI account and API key generation
- Stripe account setup and test mode configuration
- Developer time for credential acquisition (~30 minutes)

---

## Risk Assessment

### High Risks

1. **Credential Exposure**
   - Risk: Developer accidentally commits `.env.local` to git
   - Mitigation: Strong `.gitignore` rules, Git hooks to prevent commit, developer training

2. **Invalid Credentials**
   - Risk: Developer enters malformed or incorrect credentials
   - Mitigation: Verification script with format validation and API testing

### Medium Risks

1. **Service Account Limitations**
   - Risk: OpenAI account lacks access to GPT-5 or O3 models
   - Mitigation: Fallback models configured, clear warnings in verification script

2. **API Rate Limits**
   - Risk: Verification script triggers rate limits during testing
   - Mitigation: Minimal API calls, only essential connectivity tests

### Low Risks

1. **Script Execution Environment**
   - Risk: Missing dependencies (jq, curl) on developer machine
   - Mitigation: Prerequisites check in verification script

2. **Documentation Drift**
   - Risk: .env.example becomes outdated as new variables added
   - Mitigation: Feature specifications must update .env.example

---

## References

### Source Files

- `/Users/anand/radiology-ai-app/.env.example` - Environment template
- `/Users/anand/radiology-ai-app/scripts/verify-setup.sh` - Validation script
- `/Users/anand/radiology-ai-app/SETUP_CREDENTIALS_GUIDE.md` - Setup instructions
- `/Users/anand/radiology-ai-app/docs/00-PROJECT/CONSTRAINTS.md` - Security constraints

### Documentation

- Feature 1.1: Project Setup (COMPLETED)
- ARCHITECTURE_DECISION_RECORD.md: Supabase Auth + Stripe decision
- TECHNICAL_DESIGN.md: Environment configuration patterns

### External Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase API Settings](https://app.supabase.com/project/_/settings/api)
- [OpenAI API Keys](https://platform.openai.com/api-keys)
- [Stripe API Keys](https://dashboard.stripe.com/apikeys)

---

**Last Updated:** 2025-10-16
**Status:** Ready for Implementation
**Approved By:** Requirements Analyst Agent
**Next Phase:** Design (Create technical implementation plan)
