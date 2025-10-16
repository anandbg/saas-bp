# Feature 1.2: Environment Configuration - Technical Design

## Overview

This document provides the complete technical implementation plan for Feature 1.2: Environment Configuration. It defines the exact steps, file modifications, validation procedures, and error handling required to establish a secure, validated environment configuration system for the Radiology Reporting App.

**Feature ID**: 1.2
**Status**: Ready for Implementation
**Estimated Time**: 1 hour (implementation only - excludes credential acquisition time)
**Prerequisites**: Feature 1.1 (Project Setup) - COMPLETED

---

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Plan](#implementation-plan)
3. [File Modifications Required](#file-modifications-required)
4. [Validation Logic](#validation-logic)
5. [User Workflow](#user-workflow)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)
8. [Security Considerations](#security-considerations)
9. [Rollback Procedures](#rollback-procedures)
10. [Success Criteria](#success-criteria)

---

## Architecture

### Environment Configuration Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   Development Workflow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Developer copies .env.example → .env.local              │
│                                                              │
│  2. Developer obtains credentials from services              │
│     ├── Supabase (https://app.supabase.com)                │
│     ├── OpenAI (https://platform.openai.com)               │
│     ├── Stripe (https://dashboard.stripe.com)              │
│     └── Optional services                                   │
│                                                              │
│  3. Developer fills .env.local with actual credentials      │
│                                                              │
│  4. Developer runs ./scripts/verify-setup.sh                │
│     ├── Loads environment variables from .env.local         │
│     ├── Validates format and presence                       │
│     ├── Tests API connectivity                              │
│     └── Reports success/failure with actionable errors      │
│                                                              │
│  5. Next.js loads .env.local automatically                   │
│     ├── NEXT_PUBLIC_* → Available to client                │
│     └── Other vars → Server-only                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Credential Storage                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Local Development:                                          │
│  ┌─────────────────────┐         ┌─────────────────────┐    │
│  │   .env.example      │  Copy   │    .env.local       │    │
│  │   (Template)        │────────▶│    (Actual Keys)    │    │
│  │   ✓ Committed       │         │    ✗ GITIGNORED     │    │
│  │   ✓ Public          │         │    ✗ NEVER COMMIT   │    │
│  └─────────────────────┘         └─────────────────────┘    │
│                                                               │
│  Vercel Deployment:                                          │
│  ┌─────────────────────┐                                     │
│  │  Vercel Dashboard   │                                     │
│  │  Environment Vars   │                                     │
│  │  ✓ Encrypted        │                                     │
│  │  ✓ Scoped           │                                     │
│  │    (Prod/Preview)   │                                     │
│  └─────────────────────┘                                     │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Git Protection Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Git Protection Layers                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: .gitignore                                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ .env.local                                           │    │
│  │ .env*.local                                          │    │
│  │ credentials.env                                      │    │
│  │ *.env.local                                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 2: Pre-commit Hook (if exists)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Scans for patterns: API keys, tokens, secrets       │    │
│  │ Blocks commit if detected                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Layer 3: git check-ignore validation                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ $ git check-ignore .env.local                       │    │
│  │ → .env.local (confirms it's ignored)                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Verify Existing Files (5 minutes)

**Objective**: Confirm all required template files exist and are properly configured from Feature 1.1.

#### Step 1.1: Verify .env.example

```bash
# Location
/Users/anand/radiology-ai-app/.env.example

# Validation
test -f .env.example && echo "✓ Template exists" || echo "✗ Missing template"
wc -l .env.example  # Expected: 56 lines
```

**Expected Content**: 56 lines containing:

- Application configuration (NEXT_PUBLIC_APP_URL, NODE_ENV)
- Supabase configuration (3 variables)
- OpenAI configuration (1 variable)
- Stripe configuration (4 variables)
- Optional services (5 variables)
- Development flags (1 variable)

#### Step 1.2: Verify .gitignore Protection

```bash
# Location
/Users/anand/radiology-ai-app/.gitignore

# Required entries
grep -q "^\.env\.local$" .gitignore && echo "✓ .env.local protected" || echo "✗ Missing protection"
grep -q "^\.env\*\.local$" .gitignore && echo "✓ .env*.local protected" || echo "✗ Missing pattern"
grep -q "^credentials\.env$" .gitignore && echo "✓ credentials.env protected" || echo "✗ Missing protection"
```

**If missing**, add to `.gitignore`:

```
# Environment files
.env.local
.env*.local
credentials.env
```

#### Step 1.3: Verify verify-setup.sh Exists

```bash
# Location
/Users/anand/radiology-ai-app/scripts/verify-setup.sh

# Validation
test -f scripts/verify-setup.sh && echo "✓ Script exists" || echo "✗ Missing script"
test -x scripts/verify-setup.sh && echo "✓ Script executable" || chmod +x scripts/verify-setup.sh
```

---

### Phase 2: Update verify-setup.sh (20 minutes)

**Objective**: Replace Outseta validation (lines 265-286) with Stripe validation to align with architecture decision.

#### Critical Change: Outseta → Stripe Validation

**Current Code** (lines 265-286 in `/Users/anand/radiology-ai-app/scripts/verify-setup.sh`):

```bash
# ==============================================================================
# Verify Outseta Credentials
# ==============================================================================

print_header "Verifying Outseta Credentials"

check_env_var OUTSETA_API_KEY
check_env_var OUTSETA_DOMAIN
check_env_var_optional OUTSETA_WEBHOOK_SECRET
check_env_var_optional OUTSETA_PLAN_FREE
check_env_var_optional OUTSETA_PLAN_PRO
check_env_var_optional OUTSETA_PLAN_ENTERPRISE

if [ ! -z "$OUTSETA_API_KEY" ] && [ ! -z "$OUTSETA_DOMAIN" ]; then
    print_info "Testing Outseta API access..."
    OUTSETA_RESPONSE=$(curl -s -H "Authorization: Bearer $OUTSETA_API_KEY" "https://$OUTSETA_DOMAIN/api/v1/profile")

    if echo "$OUTSETA_RESPONSE" | jq -e '.Email' > /dev/null 2>&1; then
        print_success "Outseta API access verified"
    else
        print_error "Outseta API access failed - check your API key and domain"
    fi
fi
```

**New Code** (Stripe validation):

```bash
# ==============================================================================
# Verify Stripe Credentials
# ==============================================================================

print_header "Verifying Stripe Credentials"

# Check required variables
check_env_var STRIPE_SECRET_KEY
check_env_var STRIPE_PUBLISHABLE_KEY
check_env_var NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
check_env_var STRIPE_WEBHOOK_SECRET

# Verify format: Secret key
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    if [[ "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
        print_success "STRIPE_SECRET_KEY format is valid"
    else
        print_error "STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'"
    fi
fi

# Verify format: Publishable key
if [ ! -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    if [[ "$STRIPE_PUBLISHABLE_KEY" =~ ^pk_(test|live)_ ]]; then
        print_success "STRIPE_PUBLISHABLE_KEY format is valid"
    else
        print_error "STRIPE_PUBLISHABLE_KEY must start with 'pk_test_' or 'pk_live_'"
    fi
fi

# Verify format: Webhook secret
if [ ! -z "$STRIPE_WEBHOOK_SECRET" ]; then
    if [[ "$STRIPE_WEBHOOK_SECRET" =~ ^whsec_ ]]; then
        print_success "STRIPE_WEBHOOK_SECRET format is valid"
    else
        print_error "STRIPE_WEBHOOK_SECRET must start with 'whsec_'"
    fi
fi

# Verify publishable key consistency
if [ ! -z "$STRIPE_PUBLISHABLE_KEY" ] && [ ! -z "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    if [ "$STRIPE_PUBLISHABLE_KEY" = "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
        print_success "Publishable keys match"
    else
        print_error "STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must match"
    fi
fi

# Test Stripe API access
if [ ! -z "$STRIPE_SECRET_KEY" ]; then
    print_info "Testing Stripe API access..."
    STRIPE_RESPONSE=$(curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/customers?limit=1)

    if echo "$STRIPE_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        print_success "Stripe API access verified"

        # Check if using test mode
        if [[ "$STRIPE_SECRET_KEY" =~ ^sk_test_ ]]; then
            print_info "Using Stripe TEST mode (recommended for development)"
        else
            print_warning "Using Stripe LIVE mode - ensure this is intentional"
        fi
    else
        print_error "Stripe API access failed - check your secret key"

        # Provide helpful error message if available
        ERROR_MSG=$(echo "$STRIPE_RESPONSE" | jq -r '.error.message' 2>/dev/null)
        if [ ! -z "$ERROR_MSG" ] && [ "$ERROR_MSG" != "null" ]; then
            print_info "Error details: $ERROR_MSG"
        fi
    fi
fi
```

#### Additional Updates Required

**Update Line 95-100** (File loading check):

**Current Code**:

```bash
if [ ! -f "credentials.env" ]; then
    print_error "credentials.env file not found!"
    echo ""
    print_info "Please copy credentials.env.template to credentials.env and fill in your credentials"
    exit 1
fi
```

**New Code** (Support both .env.local and credentials.env):

```bash
# Try to load .env.local first (Next.js convention), fall back to credentials.env
if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
    print_success ".env.local file found"
elif [ -f "credentials.env" ]; then
    ENV_FILE="credentials.env"
    print_success "credentials.env file found"
else
    print_error "No environment file found!"
    echo ""
    print_info "Please create .env.local by copying .env.example:"
    print_info "  cp .env.example .env.local"
    print_info "Then fill in your credentials as per SETUP_CREDENTIALS_GUIDE.md"
    exit 1
fi
```

**Update Line 104-109** (Loading variables):

**Current Code**:

```bash
print_success "credentials.env file found"

# Load environment variables
set -a
source credentials.env
set +a
```

**New Code**:

```bash
# Load environment variables
set -a
source "$ENV_FILE"
set +a

print_success "Environment variables loaded from $ENV_FILE"
```

---

### Phase 3: Add Environment Variable Format Validation (15 minutes)

**Objective**: Add format validation for critical environment variables to catch configuration errors early.

#### Add Format Validation Functions

Insert after line 87 (after `check_env_var_optional` function):

```bash
# Validate URL format
check_url_format() {
    local var_name="$1"
    local var_value="${!1}"

    if [ -z "$var_value" ]; then
        return 0  # Already handled by check_env_var
    fi

    if [[ "$var_value" =~ ^https?:// ]]; then
        print_success "$var_name format is valid (URL)"
        return 0
    else
        print_error "$var_name must be a valid URL (http:// or https://)"
        return 1
    fi
}

# Validate JWT format (Supabase keys)
check_jwt_format() {
    local var_name="$1"
    local var_value="${!1}"

    if [ -z "$var_value" ]; then
        return 0  # Already handled by check_env_var
    fi

    if [[ "$var_value" =~ ^eyJ ]]; then
        print_success "$var_name format is valid (JWT)"
        return 0
    else
        print_error "$var_name must be a valid JWT token (starts with 'eyJ')"
        return 1
    fi
}

# Validate OpenAI API key format
check_openai_key_format() {
    local var_name="$1"
    local var_value="${!1}"

    if [ -z "$var_value" ]; then
        return 0  # Already handled by check_env_var
    fi

    if [[ "$var_value" =~ ^sk-proj- ]] || [[ "$var_value" =~ ^sk- ]]; then
        print_success "$var_name format is valid"
        return 0
    else
        print_error "$var_name must start with 'sk-proj-' or 'sk-'"
        return 1
    fi
}
```

#### Update Supabase Validation (Line 202-219)

**Add format checks after variable presence checks**:

```bash
print_header "Verifying Supabase Credentials"

check_env_var NEXT_PUBLIC_SUPABASE_URL
check_env_var NEXT_PUBLIC_SUPABASE_ANON_KEY
check_env_var SUPABASE_SERVICE_ROLE_KEY
check_env_var_optional SUPABASE_PROJECT_REF
check_env_var_optional SUPABASE_ACCESS_TOKEN

# Format validation
check_url_format NEXT_PUBLIC_SUPABASE_URL

# Verify Supabase URL ends with .supabase.co
if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    if [[ "$NEXT_PUBLIC_SUPABASE_URL" =~ \.supabase\.co$ ]]; then
        print_success "NEXT_PUBLIC_SUPABASE_URL domain is valid (.supabase.co)"
    else
        print_warning "NEXT_PUBLIC_SUPABASE_URL does not end with .supabase.co - verify this is correct"
    fi
fi

check_jwt_format NEXT_PUBLIC_SUPABASE_ANON_KEY
check_jwt_format SUPABASE_SERVICE_ROLE_KEY

# [Existing API connectivity test continues...]
```

#### Update OpenAI Validation (Line 225-228)

**Add format check**:

```bash
print_header "Verifying OpenAI Credentials"

check_env_var OPENAI_API_KEY
check_openai_key_format OPENAI_API_KEY
check_env_var_optional OPENAI_ORG_ID
check_env_var_optional CHATKIT_API_KEY
check_env_var_optional CHATKIT_PROJECT_ID

# [Existing API connectivity test continues...]
```

---

### Phase 4: Update Documentation References (10 minutes)

**Objective**: Ensure all documentation correctly references Stripe (not Outseta) and uses .env.local (not credentials.env).

#### Update SETUP.md (if needed)

File: `/Users/anand/radiology-ai-app/docs/04-OPERATIONS/SETUP.md`

**No changes needed** - Already correctly references Stripe and includes comprehensive setup instructions.

#### Update README.md (if exists)

**Add environment setup section**:

````markdown
## Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
````

2. Fill in your credentials following the guide:

   ```bash
   cat docs/04-OPERATIONS/SETUP.md
   ```

3. Validate your setup:

   ```bash
   ./scripts/verify-setup.sh
   ```

4. Start development:
   ```bash
   npm run dev
   ```

**Important**: Never commit `.env.local` - it's automatically gitignored.

````

---

### Phase 5: Create Credential Acquisition Guide (Optional)

**Objective**: Provide quick reference for obtaining each credential.

File: `/Users/anand/radiology-ai-app/docs/specs/features/1.2-environment-configuration/CREDENTIAL_QUICKSTART.md`

```markdown
# Environment Variables - Quick Reference

## Required Credentials

### Supabase
1. Go to: https://app.supabase.com/project/_/settings/api
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### OpenAI
1. Go to: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy → `OPENAI_API_KEY`

### Stripe
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy:
   - Publishable key → `STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`
3. Go to: https://dashboard.stripe.com/test/webhooks
4. Create endpoint
5. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

## Optional Services

### Deepgram (Alternative to OpenAI Whisper)
1. Go to: https://console.deepgram.com/project/default/keys
2. Create API key → `DEEPGRAM_API_KEY`

### Google Custom Search
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create API key → `GOOGLE_API_KEY`
3. Go to: https://programmablesearchengine.google.com/
4. Create search engine → `GOOGLE_SEARCH_ENGINE_ID`

For detailed instructions, see: `docs/04-OPERATIONS/SETUP.md`
````

---

## File Modifications Required

### Summary of Changes

| File                                                                         | Lines   | Change Type | Description                                       |
| ---------------------------------------------------------------------------- | ------- | ----------- | ------------------------------------------------- |
| `scripts/verify-setup.sh`                                                    | 95-100  | MODIFY      | Support .env.local in addition to credentials.env |
| `scripts/verify-setup.sh`                                                    | 104-109 | MODIFY      | Load from detected environment file               |
| `scripts/verify-setup.sh`                                                    | 87+     | ADD         | Format validation functions (60 lines)            |
| `scripts/verify-setup.sh`                                                    | 202-219 | MODIFY      | Add Supabase format validation                    |
| `scripts/verify-setup.sh`                                                    | 225-228 | MODIFY      | Add OpenAI format validation                      |
| `scripts/verify-setup.sh`                                                    | 265-286 | REPLACE     | Replace Outseta with Stripe validation (75 lines) |
| `.gitignore`                                                                 | N/A     | VERIFY      | Ensure .env.local, credentials.env are present    |
| `docs/specs/features/1.2-environment-configuration/CREDENTIAL_QUICKSTART.md` | N/A     | CREATE      | Quick reference guide (optional)                  |

### Exact File Paths

All paths relative to project root: `/Users/anand/radiology-ai-app/`

```
.env.example                     # Template (verify exists)
.env.local                       # Created by user (will be gitignored)
.gitignore                       # Update if needed
scripts/verify-setup.sh          # Primary modification target
docs/04-OPERATIONS/SETUP.md      # Reference (no changes needed)
docs/specs/features/1.2-environment-configuration/
  ├── SPEC.md                    # Requirements (reference)
  ├── ACCEPTANCE.md              # Acceptance criteria (reference)
  ├── DESIGN.md                  # This document
  └── CREDENTIAL_QUICKSTART.md   # Create (optional)
```

---

## Validation Logic

### Validation Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│              Verification Script Flow                          │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Load Environment Variables                                 │
│     ├── Check .env.local exists                                │
│     ├── Load variables into environment                        │
│     └── Count loaded variables                                 │
│                                                                 │
│  2. Prerequisites Check                                        │
│     ├── Node.js >= 18                                          │
│     ├── npm installed                                          │
│     ├── curl installed                                         │
│     └── jq installed                                           │
│                                                                 │
│  3. Required Variable Validation                               │
│     ├── NEXT_PUBLIC_APP_URL                                    │
│     │   ├── Present? ✓                                         │
│     │   └── Valid URL? ✓                                       │
│     │                                                           │
│     ├── Supabase Variables                                     │
│     │   ├── NEXT_PUBLIC_SUPABASE_URL                           │
│     │   │   ├── Present? ✓                                     │
│     │   │   ├── Valid URL? ✓                                   │
│     │   │   └── Ends with .supabase.co? ✓                      │
│     │   │                                                       │
│     │   ├── NEXT_PUBLIC_SUPABASE_ANON_KEY                      │
│     │   │   ├── Present? ✓                                     │
│     │   │   └── Starts with 'eyJ'? ✓ (JWT)                     │
│     │   │                                                       │
│     │   └── SUPABASE_SERVICE_ROLE_KEY                          │
│     │       ├── Present? ✓                                     │
│     │       └── Starts with 'eyJ'? ✓ (JWT)                     │
│     │                                                           │
│     ├── OpenAI Variables                                       │
│     │   └── OPENAI_API_KEY                                     │
│     │       ├── Present? ✓                                     │
│     │       └── Starts with 'sk-' or 'sk-proj-'? ✓            │
│     │                                                           │
│     └── Stripe Variables                                       │
│         ├── STRIPE_SECRET_KEY                                  │
│         │   ├── Present? ✓                                     │
│         │   └── Starts with 'sk_test_' or 'sk_live_'? ✓       │
│         │                                                       │
│         ├── STRIPE_PUBLISHABLE_KEY                             │
│         │   ├── Present? ✓                                     │
│         │   └── Starts with 'pk_test_' or 'pk_live_'? ✓       │
│         │                                                       │
│         ├── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY                 │
│         │   ├── Present? ✓                                     │
│         │   └── Matches STRIPE_PUBLISHABLE_KEY? ✓             │
│         │                                                       │
│         └── STRIPE_WEBHOOK_SECRET                              │
│             ├── Present? ✓                                     │
│             └── Starts with 'whsec_'? ✓                        │
│                                                                 │
│  4. API Connectivity Tests                                     │
│     ├── Supabase API                                           │
│     │   └── curl -H "apikey: $ANON_KEY" $SUPABASE_URL/rest/v1/ │
│     │                                                           │
│     ├── OpenAI API                                             │
│     │   └── curl -H "Authorization: Bearer $KEY" .../models    │
│     │                                                           │
│     └── Stripe API                                             │
│         └── curl -u "$SECRET_KEY:" .../customers?limit=1       │
│                                                                 │
│  5. Model Availability (OpenAI)                                │
│     ├── GPT-5 available? ✓ or ⚠                                │
│     ├── O3 available? ✓ or ⚠                                   │
│     ├── Whisper available? ✓ or ⚠                              │
│     └── GPT-4o fallback? ✓ (REQUIRED)                          │
│                                                                 │
│  6. Optional Services                                          │
│     ├── Deepgram API key? ⚠ (optional)                         │
│     ├── Google API key? ⚠ (optional)                           │
│     └── Sentry DSN? ⚠ (optional)                               │
│                                                                 │
│  7. Summary & Exit Code                                        │
│     ├── Count: Passed, Warnings, Failed                        │
│     ├── If Failed = 0 → Exit 0 (Success)                       │
│     └── If Failed > 0 → Exit 1 (Failure)                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Validation Rules Table

| Variable                             | Presence | Format                               | API Test     | Failure Impact |
| ------------------------------------ | -------- | ------------------------------------ | ------------ | -------------- |
| `NEXT_PUBLIC_APP_URL`                | REQUIRED | Valid HTTP/HTTPS URL                 | No           | CRITICAL       |
| `NODE_ENV`                           | REQUIRED | `development` or `production`        | No           | CRITICAL       |
| `NEXT_PUBLIC_SUPABASE_URL`           | REQUIRED | URL ending in `.supabase.co`         | Yes          | CRITICAL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | REQUIRED | JWT (starts with `eyJ`)              | Yes          | CRITICAL       |
| `SUPABASE_SERVICE_ROLE_KEY`          | REQUIRED | JWT (starts with `eyJ`)              | No           | CRITICAL       |
| `OPENAI_API_KEY`                     | REQUIRED | Starts with `sk-` or `sk-proj-`      | Yes          | CRITICAL       |
| `STRIPE_SECRET_KEY`                  | REQUIRED | Starts with `sk_test_` or `sk_live_` | Yes          | CRITICAL       |
| `STRIPE_PUBLISHABLE_KEY`             | REQUIRED | Starts with `pk_test_` or `pk_live_` | No           | CRITICAL       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | REQUIRED | Must match `STRIPE_PUBLISHABLE_KEY`  | No           | CRITICAL       |
| `STRIPE_WEBHOOK_SECRET`              | REQUIRED | Starts with `whsec_`                 | No           | CRITICAL       |
| `DEEPGRAM_API_KEY`                   | OPTIONAL | Any                                  | Yes (if set) | WARNING        |
| `GOOGLE_API_KEY`                     | OPTIONAL | Any                                  | Yes (if set) | WARNING        |
| `GOOGLE_SEARCH_ENGINE_ID`            | OPTIONAL | Any                                  | No           | WARNING        |
| `NEXT_PUBLIC_SENTRY_DSN`             | OPTIONAL | URL                                  | No           | WARNING        |
| `SENTRY_AUTH_TOKEN`                  | OPTIONAL | Any                                  | No           | WARNING        |

---

## User Workflow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Implementation Steps                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Step 1: Create Local Environment File                          │
│  ────────────────────────────────────────────────               │
│  Command:                                                        │
│    cd /Users/anand/radiology-ai-app                             │
│    cp .env.example .env.local                                   │
│                                                                  │
│  Verification:                                                   │
│    ls -la .env.local                                            │
│    # Should show: -rw-r--r--  1 user staff  1234 date .env.local│
│                                                                  │
│    git check-ignore .env.local                                  │
│    # Should show: .env.local                                    │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  Step 2: Obtain Credentials from Services                       │
│  ────────────────────────────────────────────────               │
│  Reference: docs/04-OPERATIONS/SETUP.md                         │
│                                                                  │
│  Supabase (15-20 minutes):                                      │
│    1. Create project at https://supabase.com                    │
│    2. Navigate to Settings → API                                │
│    3. Copy URL, Anon Key, Service Role Key                      │
│                                                                  │
│  OpenAI (5-10 minutes):                                         │
│    1. Go to https://platform.openai.com/api-keys                │
│    2. Create new secret key                                     │
│    3. Copy key (starts with sk-proj- or sk-)                    │
│                                                                  │
│  Stripe (15-20 minutes):                                        │
│    1. Create account at https://stripe.com                      │
│    2. Go to https://dashboard.stripe.com/test/apikeys           │
│    3. Copy Publishable Key and Secret Key                       │
│    4. Go to https://dashboard.stripe.com/test/webhooks          │
│    5. Create endpoint (URL will be set after deployment)        │
│    6. Copy Webhook Secret                                       │
│                                                                  │
│  Optional Services (10-15 minutes each):                        │
│    - Deepgram: https://console.deepgram.com                     │
│    - Google Search: https://console.cloud.google.com            │
│    - Sentry: https://sentry.io                                  │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  Step 3: Fill .env.local with Credentials                       │
│  ────────────────────────────────────────────────               │
│  Editor:                                                         │
│    nano .env.local                                              │
│    # or: code .env.local (VS Code)                              │
│    # or: vim .env.local                                         │
│                                                                  │
│  Fill in each variable:                                         │
│    NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co          │
│    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...                    │
│    SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...                        │
│    OPENAI_API_KEY=sk-proj-...                                   │
│    STRIPE_SECRET_KEY=sk_test_...                                │
│    STRIPE_PUBLISHABLE_KEY=pk_test_...                           │
│    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...              │
│    STRIPE_WEBHOOK_SECRET=whsec_...                              │
│                                                                  │
│  Save and exit                                                   │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  Step 4: Validate Configuration                                 │
│  ────────────────────────────────────────────────               │
│  Command:                                                        │
│    ./scripts/verify-setup.sh                                    │
│                                                                  │
│  Expected Output (Success):                                     │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    Loading Environment Variables                                │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    ✓ .env.local file found                                      │
│    ✓ Environment variables loaded from .env.local               │
│                                                                  │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    Verifying Supabase Credentials                               │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    ✓ NEXT_PUBLIC_SUPABASE_URL is set                            │
│    ✓ NEXT_PUBLIC_SUPABASE_URL format is valid (URL)            │
│    ✓ NEXT_PUBLIC_SUPABASE_URL domain is valid (.supabase.co)   │
│    ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY is set                       │
│    ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY format is valid (JWT)       │
│    ✓ SUPABASE_SERVICE_ROLE_KEY is set                           │
│    ✓ SUPABASE_SERVICE_ROLE_KEY format is valid (JWT)           │
│    ℹ Testing Supabase API access...                             │
│    ✓ Supabase API access verified                               │
│                                                                  │
│    [... similar output for OpenAI, Stripe ...]                  │
│                                                                  │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    Verification Summary                                         │
│    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│    Passed:   25                                                  │
│    Warnings: 5                                                   │
│    Failed:   0                                                   │
│                                                                  │
│    ✓ Setup verification complete! All required checks passed.   │
│                                                                  │
│    Next steps:                                                   │
│    1. Review any warnings above                                 │
│    2. Start development: npm run dev                            │
│                                                                  │
│  Exit Code: 0                                                    │
│                                                                  │
│  ──────────────────────────────────────────────────────────     │
│                                                                  │
│  Step 5: Start Development Server                               │
│  ────────────────────────────────────────────────               │
│  Command:                                                        │
│    npm run dev                                                   │
│                                                                  │
│  Expected Output:                                                │
│    > radiology-reporting-app@0.1.0 dev                          │
│    > next dev                                                    │
│                                                                  │
│    ▲ Next.js 14.x.x                                             │
│    - Local:        http://localhost:3000                        │
│    - Network:      http://192.168.1.x:3000                      │
│                                                                  │
│    ✓ Ready in 2.5s                                              │
│                                                                  │
│  Verification:                                                   │
│    Open browser: http://localhost:3000                          │
│    Check console (F12):                                         │
│      - NEXT_PUBLIC_* variables should be accessible             │
│      - No environment variable errors                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Commands Reference

```bash
# ========================================
# Quick Command Reference
# ========================================

# 1. Create environment file
cp .env.example .env.local

# 2. Edit environment file
nano .env.local  # or code .env.local, vim .env.local

# 3. Verify git protection
git check-ignore .env.local  # Should output: .env.local

# 4. Validate configuration
./scripts/verify-setup.sh

# 5. Check for unfilled placeholders
grep "=" .env.local | grep -E "^[A-Z_]+=\s*$"
# If output, some variables are empty

# 6. Count configured variables
grep -E "^[A-Z_]+=" .env.local | wc -l
# Should be ~14 (without optional services)

# 7. Start development
npm run dev

# 8. Test environment loading (in Node)
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

---

## Error Handling

### Error Scenarios and Resolutions

#### Scenario 1: Environment File Not Found

**Error**:

```
✗ No environment file found!
ℹ Please create .env.local by copying .env.example:
  cp .env.example .env.local
```

**Cause**: User hasn't created `.env.local` file.

**Resolution**:

```bash
cd /Users/anand/radiology-ai-app
cp .env.example .env.local
```

**Verification**:

```bash
test -f .env.local && echo "✓ File created" || echo "✗ Still missing"
```

---

#### Scenario 2: Variable Not Set

**Error**:

```
✗ OPENAI_API_KEY is not set
```

**Cause**: Variable exists in file but has no value.

**Resolution**:

```bash
nano .env.local
# Find line: OPENAI_API_KEY=
# Add value: OPENAI_API_KEY=sk-proj-xxxxx...
# Save and exit
```

**Verification**:

```bash
./scripts/verify-setup.sh | grep "OPENAI_API_KEY"
# Should show: ✓ OPENAI_API_KEY is set
```

---

#### Scenario 3: Invalid Format - Supabase URL

**Error**:

```
✓ NEXT_PUBLIC_SUPABASE_URL is set
✗ NEXT_PUBLIC_SUPABASE_URL must be a valid URL (http:// or https://)
```

**Cause**: URL doesn't start with `http://` or `https://`.

**Example Bad Value**: `xxxxx.supabase.co`

**Resolution**:

```bash
nano .env.local
# Change: NEXT_PUBLIC_SUPABASE_URL=xxxxx.supabase.co
# To:     NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
```

**Verification**:

```bash
./scripts/verify-setup.sh | grep -A1 "NEXT_PUBLIC_SUPABASE_URL"
# Should show:
# ✓ NEXT_PUBLIC_SUPABASE_URL is set
# ✓ NEXT_PUBLIC_SUPABASE_URL format is valid (URL)
```

---

#### Scenario 4: Invalid Format - JWT Keys

**Error**:

```
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY is set
✗ NEXT_PUBLIC_SUPABASE_ANON_KEY must be a valid JWT token (starts with 'eyJ')
```

**Cause**: Key is not a valid JWT token.

**Resolution**:

1. Go to Supabase Dashboard: https://app.supabase.com/project/_/settings/api
2. Copy the EXACT key shown (it should start with `eyJ`)
3. Paste into `.env.local`

**Common Mistake**: Copying only part of the key, or copying from wrong field.

---

#### Scenario 5: Invalid Format - OpenAI Key

**Error**:

```
✓ OPENAI_API_KEY is set
✗ OPENAI_API_KEY must start with 'sk-proj-' or 'sk-'
```

**Cause**: Key doesn't match expected OpenAI format.

**Resolution**:

1. Go to OpenAI Platform: https://platform.openai.com/api-keys
2. Create new secret key
3. Copy IMMEDIATELY (you won't see it again)
4. Paste into `.env.local`

**Note**: New keys start with `sk-proj-`, older keys start with `sk-`.

---

#### Scenario 6: Invalid Format - Stripe Keys

**Error**:

```
✓ STRIPE_SECRET_KEY is set
✗ STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'
```

**Cause**: Wrong key format or copied publishable key instead of secret key.

**Resolution**:

1. Go to Stripe Dashboard: https://dashboard.stripe.com/test/apikeys
2. Reveal "Secret key" (not "Publishable key")
3. Copy the key starting with `sk_test_`
4. Paste into `.env.local` for both:
   - `STRIPE_SECRET_KEY=sk_test_...`

**Common Mistake**: Copying publishable key (starts with `pk_test_`) into secret key field.

---

#### Scenario 7: Stripe Publishable Key Mismatch

**Error**:

```
✓ STRIPE_PUBLISHABLE_KEY is set
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
✗ STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must match
```

**Cause**: The two variables have different values.

**Resolution**:

```bash
nano .env.local
# Ensure these two lines have IDENTICAL values:
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx...
```

**Why Both?**:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is accessible in browser (Next.js convention)
- `STRIPE_PUBLISHABLE_KEY` is used in server-side code
- They MUST be the same key

---

#### Scenario 8: API Connectivity Failed - Supabase

**Error**:

```
✓ NEXT_PUBLIC_SUPABASE_URL is set
✓ Format validation passed
ℹ Testing Supabase API access...
✗ Supabase API access failed - check your credentials
```

**Possible Causes**:

1. Anon key is invalid or revoked
2. Project is paused (free tier inactivity)
3. Network/firewall blocking access
4. URL is incorrect

**Resolution**:

```bash
# Test manually
curl -H "apikey: YOUR_ANON_KEY" "YOUR_SUPABASE_URL/rest/v1/"

# Expected response (any of these is OK):
# {"message":"..."}
# {"hint":"..."}
# {"details":"..."}

# If connection refused:
# - Check Supabase project status in dashboard
# - Check network connectivity: curl https://supabase.com
# - Try different network (VPN off/on)

# If 401 Unauthorized:
# - Regenerate anon key in Supabase dashboard
# - Update .env.local with new key
```

---

#### Scenario 9: API Connectivity Failed - OpenAI

**Error**:

```
✓ OPENAI_API_KEY is set
✓ Format validation passed
ℹ Testing OpenAI API access...
✗ OpenAI API access failed - check your API key
```

**Possible Causes**:

1. API key is invalid or revoked
2. Insufficient credits/quota
3. API key doesn't have required permissions
4. Network issues

**Resolution**:

```bash
# Test manually
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
     https://api.openai.com/v1/models

# Expected response:
# {"data": [{"id": "gpt-4", ...}, ...]}

# If 401 Unauthorized:
# - Check key at https://platform.openai.com/api-keys
# - Ensure key is active (not revoked)
# - Create new key if needed

# If 429 Rate Limit:
# - Check usage at https://platform.openai.com/usage
# - Add payment method if needed
# - Wait and retry

# If insufficient quota:
# - Add payment method: https://platform.openai.com/account/billing
# - Set usage limits to prevent surprise charges
```

---

#### Scenario 10: API Connectivity Failed - Stripe

**Error**:

```
✓ STRIPE_SECRET_KEY is set
✓ Format validation passed
ℹ Testing Stripe API access...
✗ Stripe API access failed - check your secret key
ℹ Error details: Invalid API Key provided
```

**Possible Causes**:

1. Using publishable key instead of secret key
2. Secret key is from wrong account
3. Secret key has been rolled/revoked
4. Mixing test and live keys

**Resolution**:

```bash
# Test manually
curl -u "YOUR_SECRET_KEY:" https://api.stripe.com/v1/customers?limit=1

# Expected response:
# {"data": [], "has_more": false, ...}

# If authentication error:
# - Go to https://dashboard.stripe.com/test/apikeys
# - Verify you're copying the SECRET key (starts with sk_test_)
# - Ensure you're in TEST mode (not live mode)
# - Click "Reveal test key token" and copy entire key

# If you see "sk_live_" in your .env.local:
# - For development, use TEST keys (sk_test_, pk_test_)
# - Switch to LIVE keys only for production deployment
```

---

#### Scenario 11: Model Unavailable (Warning, Not Error)

**Warning**:

```
⚠ GPT-5 model not available - will use fallback model
⚠ O3 model not available - will use fallback model
```

**Cause**: Your OpenAI account doesn't have access to latest models yet.

**Impact**: App will use GPT-4o as fallback - this is ACCEPTABLE.

**Resolution**: No action required. This is a warning, not an error.

**If You Want Access**:

- GPT-5 access is limited/waitlist
- Check https://platform.openai.com/docs/models for availability
- Ensure billing is active
- Contact OpenAI support if needed

**Verification Script Behavior**: Continues and exits with code 0 (warnings don't cause failure).

---

#### Scenario 12: Optional Services Not Configured (Warning)

**Warning**:

```
⚠ DEEPGRAM_API_KEY is not set (optional)
⚠ GOOGLE_API_KEY is not set (optional)
```

**Cause**: Optional services haven't been configured.

**Impact**: Limited functionality:

- Without Deepgram: Will use OpenAI Whisper for transcription (recommended)
- Without Google Search: Limited literature search capability

**Resolution**: No action required unless you want these features.

**To Add Optional Services**:

```bash
nano .env.local
# Add:
DEEPGRAM_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
GOOGLE_SEARCH_ENGINE_ID=your_id_here
```

---

#### Scenario 13: Git Not Ignoring .env.local

**Problem**: Running `git status` shows `.env.local` as untracked file.

**Error**:

```bash
$ git status
Untracked files:
  .env.local
```

**Cause**: `.env.local` is not in `.gitignore`.

**Resolution**:

```bash
# Check if it's in .gitignore
grep "\.env\.local" .gitignore

# If not found, add it
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
echo "credentials.env" >> .gitignore

# Verify
git check-ignore .env.local
# Should output: .env.local

# If file was already tracked, remove it
git rm --cached .env.local
git commit -m "chore: Remove .env.local from git tracking"
```

---

### Error Resolution Matrix

| Error Type               | Severity | User Action                   | Verification Command               |
| ------------------------ | -------- | ----------------------------- | ---------------------------------- |
| File not found           | CRITICAL | Copy template                 | `test -f .env.local`               |
| Variable empty           | CRITICAL | Fill in value                 | `grep "^VAR_NAME=" .env.local`     |
| Invalid URL format       | CRITICAL | Add https://                  | `curl -I "$URL"`                   |
| Invalid JWT format       | CRITICAL | Re-copy from dashboard        | `echo "$KEY" \| grep ^eyJ`         |
| Invalid API key format   | CRITICAL | Re-copy from service          | `echo "$KEY" \| grep ^sk-`         |
| Key mismatch             | CRITICAL | Ensure identical              | `diff <(echo $KEY1) <(echo $KEY2)` |
| API unreachable          | CRITICAL | Check network, regenerate key | `curl -I service_url`              |
| Insufficient quota       | HIGH     | Add billing                   | Check service dashboard            |
| Model unavailable        | LOW      | None (use fallback)           | N/A                                |
| Optional service missing | INFO     | Add if needed                 | N/A                                |
| Git not ignoring         | CRITICAL | Add to .gitignore             | `git check-ignore .env.local`      |

---

## Testing Strategy

### Testing Phases

#### Phase 1: Unit Testing (Validation Functions)

**Objective**: Test individual validation functions in isolation.

**Test Cases**:

```bash
# Test 1: check_url_format
NEXT_PUBLIC_APP_URL="http://localhost:3000"
check_url_format NEXT_PUBLIC_APP_URL  # Expected: ✓

NEXT_PUBLIC_APP_URL="not-a-url"
check_url_format NEXT_PUBLIC_APP_URL  # Expected: ✗

# Test 2: check_jwt_format
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
check_jwt_format NEXT_PUBLIC_SUPABASE_ANON_KEY  # Expected: ✓

NEXT_PUBLIC_SUPABASE_ANON_KEY="invalid_token"
check_jwt_format NEXT_PUBLIC_SUPABASE_ANON_KEY  # Expected: ✗

# Test 3: check_openai_key_format
OPENAI_API_KEY="sk-proj-abc123"
check_openai_key_format OPENAI_API_KEY  # Expected: ✓

OPENAI_API_KEY="sk-abc123"
check_openai_key_format OPENAI_API_KEY  # Expected: ✓

OPENAI_API_KEY="invalid"
check_openai_key_format OPENAI_API_KEY  # Expected: ✗

# Test 4: Stripe format validation
STRIPE_SECRET_KEY="sk_test_abc123"  # Expected: ✓
STRIPE_SECRET_KEY="sk_live_abc123"  # Expected: ✓
STRIPE_SECRET_KEY="pk_test_abc123"  # Expected: ✗

STRIPE_PUBLISHABLE_KEY="pk_test_abc123"  # Expected: ✓
STRIPE_WEBHOOK_SECRET="whsec_abc123"    # Expected: ✓
```

**Test Script**: Create `/Users/anand/radiology-ai-app/tests/unit/test-validation-functions.sh`

```bash
#!/bin/bash

# Source the validation functions
source scripts/verify-setup.sh

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_url_format() {
    echo "Testing URL format validation..."

    # Valid URL
    export TEST_VAR="https://example.com"
    if check_url_format TEST_VAR > /dev/null 2>&1; then
        echo "✓ Valid HTTPS URL accepted"
        ((TESTS_PASSED++))
    else
        echo "✗ Valid HTTPS URL rejected"
        ((TESTS_FAILED++))
    fi

    # Invalid URL
    export TEST_VAR="not-a-url"
    if ! check_url_format TEST_VAR > /dev/null 2>&1; then
        echo "✓ Invalid URL rejected"
        ((TESTS_PASSED++))
    else
        echo "✗ Invalid URL accepted"
        ((TESTS_FAILED++))
    fi

    unset TEST_VAR
}

test_jwt_format() {
    echo "Testing JWT format validation..."

    # Valid JWT
    export TEST_VAR="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.signature"
    if check_jwt_format TEST_VAR > /dev/null 2>&1; then
        echo "✓ Valid JWT accepted"
        ((TESTS_PASSED++))
    else
        echo "✗ Valid JWT rejected"
        ((TESTS_FAILED++))
    fi

    # Invalid JWT
    export TEST_VAR="not-a-jwt-token"
    if ! check_jwt_format TEST_VAR > /dev/null 2>&1; then
        echo "✓ Invalid JWT rejected"
        ((TESTS_PASSED++))
    else
        echo "✗ Invalid JWT accepted"
        ((TESTS_FAILED++))
    fi

    unset TEST_VAR
}

# Run tests
test_url_format
test_jwt_format

# Summary
echo ""
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All unit tests passed"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
```

---

#### Phase 2: Integration Testing (Full Verification Flow)

**Objective**: Test complete verification script with real credentials.

**Test Case 1: Valid Configuration**

```bash
# Setup: Create .env.local with VALID credentials
cp .env.example .env.local
# Fill with actual valid credentials

# Execute
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Assertions
test $EXIT_CODE -eq 0 || echo "✗ FAILED: Exit code should be 0"
grep -q "All required checks passed" /tmp/verify-output.txt || echo "✗ FAILED: Success message missing"
grep -q "Failed:   0" /tmp/verify-output.txt || echo "✗ FAILED: Should show 0 failures"

echo "✓ Test passed: Valid configuration accepted"
```

**Test Case 2: Missing Required Variable**

```bash
# Setup: Create .env.local with missing OPENAI_API_KEY
cp .env.example .env.local
# Fill all except OPENAI_API_KEY

# Execute
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Assertions
test $EXIT_CODE -eq 1 || echo "✗ FAILED: Exit code should be 1"
grep -q "OPENAI_API_KEY is not set" /tmp/verify-output.txt || echo "✗ FAILED: Error message missing"
grep -q "Failed:.*[1-9]" /tmp/verify-output.txt || echo "✗ FAILED: Should show failures"

echo "✓ Test passed: Missing variable detected"
```

**Test Case 3: Invalid Format**

```bash
# Setup: Create .env.local with invalid OpenAI key format
cp .env.example .env.local
# Set OPENAI_API_KEY=invalid_format

# Execute
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Assertions
test $EXIT_CODE -eq 1 || echo "✗ FAILED: Exit code should be 1"
grep -q "must start with 'sk-proj-' or 'sk-'" /tmp/verify-output.txt || echo "✗ FAILED: Format error missing"

echo "✓ Test passed: Invalid format detected"
```

**Test Case 4: Optional Services Missing (Should Pass)**

```bash
# Setup: Create .env.local with all REQUIRED but NO optional
cp .env.example .env.local
# Fill only required variables, leave optional empty

# Execute
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Assertions
test $EXIT_CODE -eq 0 || echo "✗ FAILED: Exit code should be 0 (warnings OK)"
grep -q "DEEPGRAM_API_KEY.*optional" /tmp/verify-output.txt || echo "✗ FAILED: Optional warning missing"
grep -q "Failed:   0" /tmp/verify-output.txt || echo "✗ FAILED: Should show 0 failures"

echo "✓ Test passed: Optional services handled gracefully"
```

---

#### Phase 3: End-to-End Testing (User Workflow)

**Objective**: Validate complete user workflow from template to running app.

**E2E Test Scenario**:

```bash
#!/bin/bash
# File: tests/e2e/test-environment-setup.sh

set -e
PROJECT_ROOT="/Users/anand/radiology-ai-app"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "E2E Test: Environment Configuration"
echo "=========================================="

# Step 1: Verify template exists
echo "Step 1: Verify template exists..."
test -f .env.example || (echo "✗ .env.example missing" && exit 1)
echo "✓ Template exists"

# Step 2: Create .env.local
echo "Step 2: Create .env.local..."
cp .env.example .env.local
test -f .env.local || (echo "✗ Failed to create .env.local" && exit 1)
echo "✓ .env.local created"

# Step 3: Verify git protection
echo "Step 3: Verify git protection..."
git check-ignore .env.local > /dev/null || (echo "✗ .env.local not gitignored" && exit 1)
echo "✓ Git protection verified"

# Step 4: Fill with test credentials
echo "Step 4: Fill with test credentials..."
# NOTE: This would use actual test credentials in real scenario
# For automated testing, use mock/test credentials
cat > .env.local << 'EOF'
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test
OPENAI_API_KEY=sk-proj-test123
STRIPE_SECRET_KEY=sk_test_test123
STRIPE_PUBLISHABLE_KEY=pk_test_test123
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_test123
STRIPE_WEBHOOK_SECRET=whsec_test123
EOF
echo "✓ Credentials filled"

# Step 5: Run verification (format checks should pass)
echo "Step 5: Run verification..."
./scripts/verify-setup.sh > /tmp/e2e-verify.txt 2>&1 || true
# Note: Will fail on API checks with test credentials, but format should pass

grep -q "format is valid" /tmp/e2e-verify.txt || (echo "✗ Format validation failed" && exit 1)
echo "✓ Format validation passed"

# Step 6: Verify Next.js can load variables
echo "Step 6: Test Next.js environment loading..."
node -e "
require('dotenv').config({ path: '.env.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (url === 'https://test.supabase.co') {
    console.log('✓ Next.js environment loading works');
    process.exit(0);
} else {
    console.log('✗ Environment variable not loaded');
    process.exit(1);
}
"

# Step 7: Verify client/server separation
echo "Step 7: Verify client/server variable separation..."
node -e "
require('dotenv').config({ path: '.env.local' });
// NEXT_PUBLIC_* should be accessible
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Non-public should also be accessible in server context
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (publicUrl && serviceKey) {
    console.log('✓ All variables accessible in server context');
    process.exit(0);
} else {
    console.log('✗ Variable loading issue');
    process.exit(1);
}
"

# Step 8: Clean up
echo "Step 8: Clean up test files..."
rm .env.local
echo "✓ Cleaned up"

echo ""
echo "=========================================="
echo "✓ E2E Test PASSED"
echo "=========================================="
```

---

#### Phase 4: Security Testing

**Objective**: Ensure credentials are never exposed or committed.

**Security Test Cases**:

```bash
# Test 1: Verify .env.local is gitignored
git check-ignore .env.local
# Expected: .env.local

# Test 2: Ensure .env.local doesn't appear in git status
git status --porcelain | grep ".env.local"
# Expected: (no output)

# Test 3: Try to add .env.local to git (should fail or warn)
git add .env.local 2>&1 | grep -i "ignored"
# Expected: message about file being ignored

# Test 4: Verify no secrets in git history
git log --all --pretty=format: --name-only | sort -u | grep -E "\.env\.local|credentials\.env"
# Expected: (no output)

# Test 5: Scan for accidentally committed secrets
git grep -E "sk-proj-|sk_test_|eyJhbGci" -- ':!.env.example'
# Expected: (no output - secrets only in examples)

# Test 6: Verify Next.js doesn't expose server-only vars to client
# (This requires building and inspecting client bundle)
npm run build
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/
# Expected: (no output - should NOT be in client bundle)

grep -r "STRIPE_SECRET_KEY" .next/static/
# Expected: (no output - should NOT be in client bundle)

# Test 7: Verify NEXT_PUBLIC_* vars ARE in client bundle (expected)
grep -r "NEXT_PUBLIC_SUPABASE_URL" .next/static/ > /dev/null
# Expected: exit code 0 (found - this is correct)
```

---

### Test Automation

**Create Test Suite**: `/Users/anand/radiology-ai-app/tests/feature-1.2-suite.sh`

```bash
#!/bin/bash

echo "==========================================="
echo "Feature 1.2 Test Suite"
echo "==========================================="
echo ""

# Initialize counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    local test_name="$1"
    local test_command="$2"

    ((TOTAL_TESTS++))
    echo -n "Running: $test_name... "

    if eval "$test_command" > /dev/null 2>&1; then
        echo "✓ PASSED"
        ((PASSED_TESTS++))
    else
        echo "✗ FAILED"
        ((FAILED_TESTS++))
    fi
}

# Unit Tests
echo "Unit Tests"
echo "----------"
run_test "URL format validation" "bash tests/unit/test-validation-functions.sh"

# Integration Tests
echo ""
echo "Integration Tests"
echo "-----------------"
run_test "Valid configuration" "bash tests/integration/test-valid-config.sh"
run_test "Missing required variable" "bash tests/integration/test-missing-var.sh"
run_test "Invalid format" "bash tests/integration/test-invalid-format.sh"
run_test "Optional services" "bash tests/integration/test-optional-services.sh"

# E2E Tests
echo ""
echo "End-to-End Tests"
echo "----------------"
run_test "Complete user workflow" "bash tests/e2e/test-environment-setup.sh"

# Security Tests
echo ""
echo "Security Tests"
echo "--------------"
run_test "Git ignore protection" "git check-ignore .env.local"
run_test "No secrets in history" "! git log --all --pretty=format: --name-only | grep -E '\.env\.local|credentials\.env'"

# Summary
echo ""
echo "==========================================="
echo "Test Summary"
echo "==========================================="
echo "Total:  $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
```

---

## Security Considerations

### Security Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Security Layers                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Layer 1: File System Protection                             │
│  ────────────────────────────                                │
│  • .env.local has 644 permissions (user read/write only)    │
│  • Not world-readable on Unix systems                        │
│  • Stored in project root (not in public/ directory)        │
│                                                               │
│  Layer 2: Git Protection                                     │
│  ─────────────────────                                       │
│  • .gitignore prevents accidental commits                    │
│  • Pre-commit hooks scan for secrets (optional)             │
│  • .env.example shows structure, not actual values          │
│                                                               │
│  Layer 3: Next.js Runtime Protection                         │
│  ────────────────────────────────                            │
│  • NEXT_PUBLIC_* → Embedded in client bundle (safe)         │
│  • Other vars → Server-only, never sent to browser          │
│  • process.env only available in server context             │
│                                                               │
│  Layer 4: API Key Restrictions                              │
│  ─────────────────────────                                   │
│  • Supabase: RLS policies limit what anon key can access    │
│  • OpenAI: Rate limits and usage quotas                     │
│  • Stripe: Test keys for development, live keys for prod   │
│                                                               │
│  Layer 5: Network Security                                   │
│  ──────────────────────                                      │
│  • All API calls over HTTPS                                  │
│  • Webhook signatures verified                              │
│  • CORS policies enforced                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Security Best Practices

#### 1. Credential Storage

**DO**:

- ✅ Store credentials in `.env.local` (gitignored)
- ✅ Use separate credentials for dev/staging/production
- ✅ Rotate credentials every 90 days
- ✅ Use test/development keys during development
- ✅ Document which credentials are public-safe (NEXT*PUBLIC*\*)

**DON'T**:

- ❌ Commit `.env.local` to git
- ❌ Share credentials in plain text (Slack, email, etc.)
- ❌ Use production credentials in development
- ❌ Store credentials in code files
- ❌ Expose server-only keys to client with NEXT*PUBLIC* prefix

---

#### 2. Key Classification

| Variable                             | Classification    | Exposure    | Rotation Frequency   |
| ------------------------------------ | ----------------- | ----------- | -------------------- |
| `NEXT_PUBLIC_APP_URL`                | PUBLIC            | Client      | Never                |
| `NEXT_PUBLIC_SUPABASE_URL`           | PUBLIC            | Client      | Never                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | PUBLIC (with RLS) | Client      | 90 days              |
| `SUPABASE_SERVICE_ROLE_KEY`          | HIGHLY SENSITIVE  | Server only | 90 days              |
| `OPENAI_API_KEY`                     | SENSITIVE         | Server only | 90 days              |
| `STRIPE_SECRET_KEY`                  | HIGHLY SENSITIVE  | Server only | 90 days              |
| `STRIPE_PUBLISHABLE_KEY`             | PUBLIC            | Client      | Never                |
| `STRIPE_WEBHOOK_SECRET`              | SENSITIVE         | Server only | Never (or on breach) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | PUBLIC            | Client      | Never                |

---

#### 3. Credential Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                   Credential Lifecycle                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Creation                                                  │
│     ├── Generate in service dashboard (Supabase, OpenAI, etc) │
│     ├── Copy immediately (some keys shown only once)         │
│     └── Store in password manager (optional but recommended) │
│                                                               │
│  2. Configuration                                             │
│     ├── Paste into .env.local                                │
│     ├── Verify format (verification script)                  │
│     └── Test connectivity                                     │
│                                                               │
│  3. Usage                                                     │
│     ├── Local development: Load from .env.local              │
│     ├── Vercel deployment: Set in dashboard                  │
│     └── Monitor usage and costs                              │
│                                                               │
│  4. Rotation (Every 90 Days)                                 │
│     ├── Generate new key in service dashboard                │
│     ├── Update .env.local with new key                       │
│     ├── Verify app still works                               │
│     ├── Update Vercel environment variables                  │
│     └── Revoke old key in service dashboard                  │
│                                                               │
│  5. Revocation (On Breach)                                   │
│     ├── Immediately revoke compromised key                   │
│     ├── Generate new key                                      │
│     ├── Update all environments                              │
│     ├── Review access logs for unauthorized usage            │
│     └── Document incident                                    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

#### 4. Breach Detection

**Monitoring**:

```bash
# Check for exposed credentials in git history
git log --all -S "sk-proj-" --pretty=format:"%H %an %ad %s"

# Check for credentials in public files
grep -r "sk-proj-\|sk_test_\|eyJhbGci" public/ app/ components/

# Verify .gitignore is working
git ls-files | grep -E "\.env\.local|credentials\.env"
# Expected: (no output)
```

**If Credentials Exposed**:

1. **Immediate**: Revoke compromised key in service dashboard
2. **Generate**: Create new key
3. **Update**: Replace in all environments (.env.local, Vercel)
4. **Verify**: Test application still works
5. **Audit**: Review service logs for unauthorized access
6. **Document**: Record incident and remediation steps

---

#### 5. Vercel Deployment Security

**Environment Variable Configuration**:

```
┌──────────────────────────────────────────────────────────────┐
│          Vercel Environment Variable Scopes                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Production Environment                                       │
│  ─────────────────────                                        │
│  • Use LIVE credentials (sk_live_, pk_live_)                 │
│  • Production Supabase project                               │
│  • Production Stripe webhook endpoint                        │
│  • Restrict to production branch (main/master)               │
│                                                               │
│  Preview Environment                                          │
│  ───────────────────                                          │
│  • Use TEST credentials (sk_test_, pk_test_)                 │
│  • Development/staging Supabase project                      │
│  • Test Stripe webhook endpoint                              │
│  • Applied to all preview deployments                        │
│                                                               │
│  Development Environment                                      │
│  ──────────────────────                                       │
│  • Same as Preview                                            │
│  • Local development uses .env.local                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Setting Variables in Vercel**:

```bash
# Via CLI
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste value when prompted

vercel env add OPENAI_API_KEY preview development
# Paste value when prompted

# Via Dashboard
1. Go to: https://vercel.com/[your-org]/[your-project]/settings/environment-variables
2. Add variable name
3. Select scopes: Production, Preview, Development
4. Paste value
5. Save
```

---

## Rollback Procedures

### Rollback Scenarios

#### Scenario 1: Verification Script Breaks

**Symptoms**:

- Script crashes with unexpected errors
- False positives/negatives in validation
- Can't proceed with development

**Rollback Steps**:

```bash
# 1. Check git status
git status

# 2. Restore original verification script
git checkout HEAD scripts/verify-setup.sh

# 3. Verify it works
./scripts/verify-setup.sh

# 4. If still broken, restore from backup
cp backups/radiology-app-20251016_135653/scripts/verify-setup.sh scripts/
chmod +x scripts/verify-setup.sh

# 5. Document issue
echo "Rollback reason: [describe issue]" >> docs/specs/features/1.2-environment-configuration/ROLLBACK_LOG.md
```

---

#### Scenario 2: Credentials Accidentally Committed

**Symptoms**:

- `.env.local` appears in `git status`
- Credentials visible in git history
- Security breach alert

**Immediate Actions**:

```bash
# 1. DO NOT PUSH if not already pushed
# If you've already pushed, proceed to step 5 immediately

# 2. Remove from staging
git reset HEAD .env.local

# 3. Remove from git tracking
git rm --cached .env.local

# 4. Commit the removal
git commit -m "chore: Remove accidentally tracked .env.local"

# 5. If already pushed (CRITICAL):
# - Revoke ALL exposed credentials immediately
# - Generate new credentials
# - Update .env.local with new credentials
# - Rewrite git history to remove exposed secrets (advanced)

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# - Force push (WARNING: This rewrites history)
git push origin --force --all

# 6. Verify removal
git log --all --pretty=format: --name-only | sort -u | grep ".env.local"
# Expected: (no output)
```

---

#### Scenario 3: Environment Variables Not Loading in Next.js

**Symptoms**:

- App starts but can't connect to services
- `undefined` for environment variables
- Console errors about missing config

**Debugging Steps**:

```bash
# 1. Verify .env.local exists
ls -la .env.local

# 2. Check file format (no syntax errors)
cat .env.local | grep -v "^#" | grep -v "^$" | grep "="
# All lines should be: VARIABLE_NAME=value

# 3. Test manual loading
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
# Should print URL, not undefined

# 4. Restart dev server
# Next.js only loads .env files on startup
pkill -f "next dev"
npm run dev

# 5. Check Next.js is reading the file
# In app, create a test page:
# app/test-env/page.tsx:
export default function TestEnv() {
  return (
    <div>
      <h1>Environment Test</h1>
      <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
    </div>
  );
}

# Navigate to http://localhost:3000/test-env
# If shows URL: ✓ Working
# If shows "undefined": ✗ Not loading
```

**Resolution**:

```bash
# If not loading:
# 1. Check file name is exactly ".env.local" (not ".env.local.txt")
mv .env.local.txt .env.local  # If needed

# 2. Check file location (must be in project root)
mv somewhere/.env.local /Users/anand/radiology-ai-app/.env.local

# 3. Check for BOM or hidden characters
file .env.local
# Expected: "ASCII text"
# If shows "UTF-8 Unicode (with BOM)", remove BOM:
tail -c +4 .env.local > .env.local.fixed
mv .env.local.fixed .env.local

# 4. Rebuild and restart
rm -rf .next
npm run dev
```

---

#### Scenario 4: Can't Verify Git Protection

**Symptoms**:

- `git check-ignore .env.local` returns nothing
- File appears in `git status`

**Fix**:

```bash
# 1. Check .gitignore exists
test -f .gitignore || echo "✗ .gitignore missing!"

# 2. Check .gitignore contains entry
grep "\.env\.local" .gitignore
# If no output, add it:
echo ".env.local" >> .gitignore
echo ".env*.local" >> .gitignore
echo "credentials.env" >> .gitignore

# 3. Refresh git's ignore cache
git rm -r --cached .
git add .

# 4. Verify
git check-ignore .env.local
# Expected: .env.local

# 5. If file was already committed, remove from history (see Scenario 2)
```

---

### Rollback Checklist

Before rolling back, document:

```markdown
## Rollback Documentation

**Date**: [YYYY-MM-DD]
**Feature**: 1.2 - Environment Configuration
**Reason**: [Why rollback is needed]

### Issues Encountered:

1. [Issue description]
2. [Issue description]

### Rollback Steps Taken:

1. [Step]
2. [Step]

### Files Restored:

- [ ] scripts/verify-setup.sh
- [ ] .gitignore
- [ ] .env.example
- [ ] Other: **\_\_\_**

### Credentials Revoked (if applicable):

- [ ] Supabase keys
- [ ] OpenAI API key
- [ ] Stripe keys
- [ ] Other: **\_\_\_**

### Verification After Rollback:

- [ ] Verification script runs
- [ ] Git protection working
- [ ] Can proceed with development

### Next Steps:

[What needs to be done before retry]
```

---

## Success Criteria

### Implementation Complete When:

#### ✅ **Criterion 1: Files Created/Modified**

- [ ] `scripts/verify-setup.sh` updated with Stripe validation (lines 265-286 replaced)
- [ ] `scripts/verify-setup.sh` updated to load from .env.local (lines 95-109)
- [ ] Format validation functions added (after line 87)
- [ ] `.gitignore` contains `.env.local` protection
- [ ] `.env.example` template verified (56 lines)

**Verification**:

```bash
# Check file modifications
git diff scripts/verify-setup.sh | grep -E "^\+.*Stripe|^\-.*Outseta"
# Should show Stripe additions and Outseta removals

# Check git protection
grep "\.env\.local" .gitignore && echo "✓ Protected"

# Check template
wc -l .env.example | grep -q "56" && echo "✓ Template complete"
```

---

#### ✅ **Criterion 2: Validation Script Functional**

- [ ] Script loads environment variables from .env.local
- [ ] Script validates all required variables
- [ ] Script performs format validation (URL, JWT, API keys)
- [ ] Script tests API connectivity (Supabase, OpenAI, Stripe)
- [ ] Script exits with code 0 on success
- [ ] Script exits with code 1 on failure
- [ ] Script shows clear error messages

**Verification**:

```bash
# Test with valid config
./scripts/verify-setup.sh && echo "✓ Success exit code"

# Test with invalid config (temporarily remove a required var)
unset OPENAI_API_KEY
./scripts/verify-setup.sh || echo "✓ Failure exit code"
```

---

#### ✅ **Criterion 3: User Workflow Works**

- [ ] User can copy .env.example to .env.local
- [ ] User can fill in credentials
- [ ] User can run verification script
- [ ] User receives clear feedback (pass/fail)
- [ ] User can start development server
- [ ] Next.js loads variables correctly

**Verification**:

```bash
# Complete workflow test
cp .env.example .env.local
# [User fills credentials manually]
./scripts/verify-setup.sh
npm run dev
# Navigate to http://localhost:3000
```

---

#### ✅ **Criterion 4: Security Verified**

- [ ] .env.local is gitignored
- [ ] Credentials never appear in git status
- [ ] Server-only vars not exposed to client
- [ ] NEXT*PUBLIC*\* vars ARE accessible in client
- [ ] No credentials in git history

**Verification**:

```bash
# Git protection
git check-ignore .env.local && echo "✓ Gitignored"
! git status | grep ".env.local" && echo "✓ Not tracked"

# Client/server separation
npm run build
! grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static/ && echo "✓ Secret not in client"
grep -r "NEXT_PUBLIC_SUPABASE_URL" .next/static/ && echo "✓ Public var in client"
```

---

#### ✅ **Criterion 5: Documentation Complete**

- [ ] DESIGN.md exists and is comprehensive
- [ ] User workflow clearly documented
- [ ] Error handling procedures documented
- [ ] Rollback procedures documented
- [ ] SETUP.md references correct services (Stripe, not Outseta)

**Verification**:

```bash
# Check documentation exists
test -f docs/specs/features/1.2-environment-configuration/DESIGN.md && echo "✓ Design doc exists"
test -f docs/04-OPERATIONS/SETUP.md && echo "✓ Setup guide exists"

# Check for outdated references
! grep -i "outseta" docs/specs/features/1.2-environment-configuration/DESIGN.md && echo "✓ No Outseta references"
```

---

#### ✅ **Criterion 6: All Acceptance Criteria Met**

From `ACCEPTANCE.md`:

- [ ] AC-1: Environment file creation
- [ ] AC-2: Git ignore protection
- [ ] AC-3: Required variable validation
- [ ] AC-4: API connectivity validation
- [ ] AC-5: Model availability check
- [ ] AC-6: Optional services handling
- [ ] AC-7: Verification script success
- [ ] AC-8: Verification script failure handling
- [ ] AC-9: Next.js environment loading
- [ ] AC-10: Vercel deployment readiness

**Verification**: Run complete acceptance test suite (see Testing Strategy section).

---

### Definition of Done

**Feature 1.2 is COMPLETE when**:

1. ✅ All file modifications implemented correctly
2. ✅ Verification script passes with valid configuration
3. ✅ Verification script fails appropriately with invalid configuration
4. ✅ User can complete setup workflow end-to-end
5. ✅ No credentials exposed in git or client-side code
6. ✅ Next.js loads environment variables correctly
7. ✅ Documentation exists and is accurate
8. ✅ All tests pass (unit, integration, E2E, security)
9. ✅ Feature marked complete in STATUS.md
10. ✅ Git commit made: `feat(config): Complete Feature 1.2 - Environment Configuration`

**Final Verification Command**:

```bash
# Run complete test suite
bash tests/feature-1.2-suite.sh

# Expected output:
# ✓ All tests passed!
# Exit code: 0
```

---

## Appendix

### A. File Locations Reference

All paths relative to: `/Users/anand/radiology-ai-app/`

```
Project Root
├── .env.example                              # Template (56 lines)
├── .env.local                                # Created by user (gitignored)
├── .gitignore                                # Contains .env.local protection
├── scripts/
│   └── verify-setup.sh                       # Main modification target (427 lines)
├── docs/
│   ├── 04-OPERATIONS/
│   │   └── SETUP.md                          # User setup guide
│   └── specs/features/1.2-environment-configuration/
│       ├── SPEC.md                           # Requirements
│       ├── ACCEPTANCE.md                     # Acceptance criteria
│       ├── DESIGN.md                         # This document
│       └── CREDENTIAL_QUICKSTART.md          # Quick reference (optional)
└── tests/
    ├── unit/
    │   └── test-validation-functions.sh      # Unit tests
    ├── integration/
    │   ├── test-valid-config.sh              # Integration tests
    │   ├── test-missing-var.sh
    │   ├── test-invalid-format.sh
    │   └── test-optional-services.sh
    ├── e2e/
    │   └── test-environment-setup.sh         # E2E tests
    └── feature-1.2-suite.sh                  # Complete test suite
```

---

### B. Environment Variables Quick Reference

| Variable                             | Service      | Where to Get               | Format                        |
| ------------------------------------ | ------------ | -------------------------- | ----------------------------- |
| `NEXT_PUBLIC_APP_URL`                | N/A          | Set manually               | `http://localhost:3000`       |
| `NODE_ENV`                           | N/A          | Set manually               | `development` or `production` |
| `NEXT_PUBLIC_SUPABASE_URL`           | Supabase     | Project Settings → API     | `https://xxx.supabase.co`     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Supabase     | Project Settings → API     | JWT starting with `eyJ`       |
| `SUPABASE_SERVICE_ROLE_KEY`          | Supabase     | Project Settings → API     | JWT starting with `eyJ`       |
| `OPENAI_API_KEY`                     | OpenAI       | API Keys page              | `sk-proj-...` or `sk-...`     |
| `STRIPE_SECRET_KEY`                  | Stripe       | Dashboard → API Keys       | `sk_test_...` (test mode)     |
| `STRIPE_PUBLISHABLE_KEY`             | Stripe       | Dashboard → API Keys       | `pk_test_...` (test mode)     |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe       | (Same as above)            | `pk_test_...` (test mode)     |
| `STRIPE_WEBHOOK_SECRET`              | Stripe       | Dashboard → Webhooks       | `whsec_...`                   |
| `DEEPGRAM_API_KEY`                   | Deepgram     | Console → API Keys         | Optional                      |
| `GOOGLE_API_KEY`                     | Google Cloud | Console → Credentials      | Optional                      |
| `GOOGLE_SEARCH_ENGINE_ID`            | Google       | Programmable Search Engine | Optional                      |
| `NEXT_PUBLIC_SENTRY_DSN`             | Sentry       | Project Settings           | Optional                      |
| `SENTRY_AUTH_TOKEN`                  | Sentry       | Organization Settings      | Optional                      |

---

### C. Common Commands

```bash
# Create environment file
cp .env.example .env.local

# Edit environment file
nano .env.local                  # Terminal editor
code .env.local                  # VS Code
vim .env.local                   # Vim

# Verify git protection
git check-ignore .env.local      # Should output: .env.local

# Run verification
./scripts/verify-setup.sh

# Start development server
npm run dev

# Check environment variable in Node
node -e "console.log(process.env.VARIABLE_NAME)"

# Run tests
bash tests/feature-1.2-suite.sh

# Clean up
rm .env.local                    # Only if needed
```

---

### D. Support Resources

- **Next.js Environment Variables**: https://nextjs.org/docs/basic-features/environment-variables
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Supabase API Settings**: https://app.supabase.com/project/_/settings/api
- **OpenAI API Keys**: https://platform.openai.com/api-keys
- **Stripe API Keys**: https://dashboard.stripe.com/apikeys
- **Stripe Webhooks**: https://dashboard.stripe.com/webhooks

---

**Document Version**: 1.0
**Last Updated**: 2025-10-16
**Status**: Ready for Implementation
**Prepared By**: Design Agent
**Next Step**: User approval → Implementation
