# Feature 1.2: Environment Configuration - Acceptance Criteria

## Overview

This document defines the complete acceptance criteria for Feature 1.2: Environment Configuration. All criteria must be met before marking the feature as complete.

---

## AC-1: Environment File Creation

### User Story

As a developer, I want to create a local environment configuration file so that I can store credentials securely without committing them to version control.

### Given-When-Then

**GIVEN:**

- Feature 1.1 (Project Setup) is complete
- The project repository exists at `/Users/anand/radiology-ai-app`
- The `.env.example` template file exists

**WHEN:**

- The developer runs: `cp .env.example .env.local`

**THEN:**

- A new file `.env.local` is created in the project root
- The file contains exactly 56 lines (matching `.env.example`)
- All environment variable definitions are present
- All values are empty (template placeholders)
- File permissions are readable (644 or similar)

### Validation Steps

```bash
# 1. Check file exists
test -f .env.local && echo "✓ File exists" || echo "✗ File missing"

# 2. Count lines
LINE_COUNT=$(wc -l < .env.local)
test $LINE_COUNT -eq 56 && echo "✓ Correct line count" || echo "✗ Wrong line count: $LINE_COUNT"

# 3. Verify structure
grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local && echo "✓ Supabase vars present" || echo "✗ Missing Supabase vars"
grep -q "OPENAI_API_KEY=" .env.local && echo "✓ OpenAI vars present" || echo "✗ Missing OpenAI vars"
grep -q "STRIPE_SECRET_KEY=" .env.local && echo "✓ Stripe vars present" || echo "✗ Missing Stripe vars"
```

### Success Criteria

- ✅ File `.env.local` exists
- ✅ File contains all required environment variables
- ✅ File is ready for credential population

---

## AC-2: Git Ignore Protection

### User Story

As a developer, I want my local environment file to be automatically ignored by git so that I cannot accidentally commit sensitive credentials.

### Given-When-Then

**GIVEN:**

- The `.env.local` file exists in the project root
- The `.gitignore` file exists and includes `.env.local`

**WHEN:**

- The developer runs: `git status`

**THEN:**

- `.env.local` does NOT appear in "Untracked files" section
- `.env.local` does NOT appear in "Changes not staged for commit" section
- Running `git check-ignore .env.local` returns: `.env.local`
- The file is protected from accidental commit

### Validation Steps

```bash
# 1. Check .gitignore contains .env.local
grep -q "^\.env\.local$" .gitignore && echo "✓ .env.local in .gitignore" || echo "✗ Missing from .gitignore"

# 2. Verify git ignores the file
git check-ignore .env.local > /dev/null && echo "✓ Git ignores .env.local" || echo "✗ Git does NOT ignore .env.local"

# 3. Confirm file not in git status
! git status --short | grep -q ".env.local" && echo "✓ Not in git status" || echo "✗ Appears in git status"

# 4. Test accidental add (should fail or be ignored)
git add .env.local 2>&1 | grep -q "\.env\.local.*ignored" && echo "✓ Protected from git add" || echo "⚠ Warning: not explicitly prevented"
```

### Success Criteria

- ✅ `.env.local` is in `.gitignore`
- ✅ Git does not track `.env.local`
- ✅ Credentials cannot be accidentally committed

---

## AC-3: Required Variable Validation

### User Story

As a developer, I want to validate that all required environment variables are set correctly so that I can proceed with confidence to service integration features.

### Given-When-Then

**GIVEN:**

- The `.env.local` file exists
- All required credentials have been obtained and populated:
  - Application: `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `NODE_ENV=development`
  - Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - OpenAI: `OPENAI_API_KEY`
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

**WHEN:**

- The developer runs: `./scripts/verify-setup.sh`

**THEN:**

- The script validates all required variables are set (non-empty)
- The script performs format validation on each variable
- All required checks display ✓ green checkmarks
- No required checks display ✗ red X marks

### Validation Steps

```bash
# Run verification script and capture output
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
VERIFY_EXIT_CODE=$?

# Check for required variable validations
grep -q "✓.*NEXT_PUBLIC_APP_URL" /tmp/verify-output.txt
grep -q "✓.*NODE_ENV" /tmp/verify-output.txt
grep -q "✓.*NEXT_PUBLIC_SUPABASE_URL" /tmp/verify-output.txt
grep -q "✓.*NEXT_PUBLIC_SUPABASE_ANON_KEY" /tmp/verify-output.txt
grep -q "✓.*SUPABASE_SERVICE_ROLE_KEY" /tmp/verify-output.txt
grep -q "✓.*OPENAI_API_KEY" /tmp/verify-output.txt
grep -q "✓.*STRIPE_SECRET_KEY" /tmp/verify-output.txt
grep -q "✓.*STRIPE_PUBLISHABLE_KEY" /tmp/verify-output.txt
grep -q "✓.*NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" /tmp/verify-output.txt
grep -q "✓.*STRIPE_WEBHOOK_SECRET" /tmp/verify-output.txt

# Verify no failures on required variables
! grep -q "✗.*NEXT_PUBLIC_SUPABASE_URL" /tmp/verify-output.txt
! grep -q "✗.*OPENAI_API_KEY" /tmp/verify-output.txt
! grep -q "✗.*STRIPE_SECRET_KEY" /tmp/verify-output.txt
```

### Format Validation Requirements

| Variable                        | Format Rule                          | Example Valid             | Example Invalid       |
| ------------------------------- | ------------------------------------ | ------------------------- | --------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Ends with `.supabase.co`             | `https://xyz.supabase.co` | `https://example.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Starts with `eyJ` (JWT)              | `eyJhbGci...`             | `abc123`              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Starts with `eyJ` (JWT)              | `eyJhbGci...`             | `abc123`              |
| `OPENAI_API_KEY`                | Starts with `sk-` or `sk-proj-`      | `sk-proj-abc123`          | `abc123`              |
| `STRIPE_SECRET_KEY`             | Starts with `sk_test_` or `sk_live_` | `sk_test_abc123`          | `abc123`              |
| `STRIPE_PUBLISHABLE_KEY`        | Starts with `pk_test_` or `pk_live_` | `pk_test_abc123`          | `abc123`              |
| `STRIPE_WEBHOOK_SECRET`         | Starts with `whsec_`                 | `whsec_abc123`            | `abc123`              |

### Success Criteria

- ✅ All 10 required variables are set
- ✅ All variables pass format validation
- ✅ No required variable checks fail

---

## AC-4: API Connectivity Validation

### User Story

As a developer, I want to verify that all required services are accessible with my credentials so that I know the configuration is correct before proceeding.

### Given-When-Then

**GIVEN:**

- All required environment variables are set and valid
- Internet connectivity is available
- Service APIs are operational

**WHEN:**

- The verification script runs API connectivity tests
- Each service is contacted via its public API endpoint

**THEN:**

- Supabase API responds successfully (HTTP 200 or valid error response)
- OpenAI API responds with models list (HTTP 200)
- Stripe API validates the secret key (HTTP 200)
- All connectivity checks display ✓ green checkmarks

### Validation Steps

```bash
# Supabase connectivity test
SUPABASE_TEST=$(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")
echo "$SUPABASE_TEST" | grep -q "message\|hint" && echo "✓ Supabase API accessible"

# OpenAI connectivity test
OPENAI_TEST=$(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models)
echo "$OPENAI_TEST" | jq -e '.data' > /dev/null && echo "✓ OpenAI API accessible"

# Stripe connectivity test
STRIPE_TEST=$(curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/customers?limit=1)
echo "$STRIPE_TEST" | jq -e '.data' > /dev/null && echo "✓ Stripe API accessible"
```

### Expected Script Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying Supabase Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ NEXT_PUBLIC_SUPABASE_URL is set
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY is set
✓ SUPABASE_SERVICE_ROLE_KEY is set
ℹ Testing Supabase API access...
✓ Supabase API access verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying OpenAI Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ OPENAI_API_KEY is set
ℹ Testing OpenAI API access...
✓ OpenAI API access verified

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying Stripe Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ STRIPE_SECRET_KEY is set
✓ STRIPE_PUBLISHABLE_KEY is set
✓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set
✓ STRIPE_WEBHOOK_SECRET is set
ℹ Testing Stripe API access...
✓ Stripe API access verified
```

### Success Criteria

- ✅ Supabase API responds (HTTP 200 or valid error)
- ✅ OpenAI API responds with models list
- ✅ Stripe API validates credentials
- ✅ No connectivity checks fail

---

## AC-5: Model Availability Check

### User Story

As a developer, I want to know which OpenAI models are available to my account so that I understand if fallback models will be used during report generation.

### Given-When-Then

**GIVEN:**

- OpenAI API is accessible with valid credentials
- The verification script queries `/v1/models` endpoint

**WHEN:**

- The script checks for model availability:
  - GPT-5 (espresso mode primary)
  - O3 (slow-brewed mode primary)
  - Whisper-1 (transcription)
  - GPT-4o (fallback model)

**THEN:**

- Script reports ✓ for available models
- Script reports ⚠ warning (not failure) for unavailable models
- Script confirms fallback models are available
- Developer understands which models will be used

### Validation Steps

```bash
# Query OpenAI models
MODELS_JSON=$(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models)

# Check GPT-5 availability
echo "$MODELS_JSON" | jq -e '.data[] | select(.id | contains("gpt-5"))' > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ GPT-5 model access confirmed"
else
    echo "⚠ GPT-5 model not available - will use fallback model"
fi

# Check O3 availability
echo "$MODELS_JSON" | jq -e '.data[] | select(.id | contains("o3"))' > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ O3 model access confirmed"
else
    echo "⚠ O3 model not available - will use fallback model"
fi

# Check Whisper availability
echo "$MODELS_JSON" | jq -e '.data[] | select(.id | contains("whisper"))' > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Whisper model access confirmed"
else
    echo "⚠ Whisper model not found in models list"
fi

# Check GPT-4o fallback availability (REQUIRED)
echo "$MODELS_JSON" | jq -e '.data[] | select(.id | contains("gpt-4o"))' > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ GPT-4o fallback model available"
else
    echo "✗ GPT-4o fallback model NOT available - critical issue"
fi
```

### Expected Behavior

**Scenario 1: All models available (ideal)**

```
✓ GPT-5 model access confirmed
✓ O3 model access confirmed
✓ Whisper model access confirmed
✓ GPT-4o fallback model available
```

**Scenario 2: GPT-5 and O3 unavailable (acceptable)**

```
⚠ GPT-5 model not available - will use fallback model
⚠ O3 model not available - will use fallback model
✓ Whisper model access confirmed
✓ GPT-4o fallback model available
```

**Scenario 3: No fallback available (FAIL)**

```
⚠ GPT-5 model not available - will use fallback model
⚠ O3 model not available - will use fallback model
✓ Whisper model access confirmed
✗ GPT-4o fallback model NOT available - critical issue
```

### Success Criteria

- ✅ Script checks for GPT-5, O3, Whisper, GPT-4o models
- ✅ Unavailable primary models show warnings (not errors)
- ✅ At least one fallback model (gpt-4o or gpt-4o-mini) is available
- ✅ Script does NOT fail if primary models unavailable

---

## AC-6: Optional Services Handling

### User Story

As a developer, I want the verification script to handle optional services gracefully so that I'm not blocked by missing credentials for features I'm not using yet.

### Given-When-Then

**GIVEN:**

- Required environment variables are set and valid
- Optional environment variables are NOT set:
  - `DEEPGRAM_API_KEY` (optional transcription)
  - `GOOGLE_API_KEY` (optional literature search)
  - `GOOGLE_SEARCH_ENGINE_ID` (optional literature search)
  - `NEXT_PUBLIC_SENTRY_DSN` (optional error tracking)
  - `SENTRY_AUTH_TOKEN` (optional error tracking)

**WHEN:**

- The verification script runs: `./scripts/verify-setup.sh`

**THEN:**

- Optional services show ⚠ warnings (not ✗ failures)
- Each warning includes "(optional)" designation
- The script exits with code 0 (success)
- Summary shows: "Failed: 0"
- Summary includes message: "⚠ Some optional services are not configured"

### Validation Steps

```bash
# Run verification with optional services missing
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Check for warning indicators (not errors)
grep -q "⚠.*DEEPGRAM_API_KEY.*optional" /tmp/verify-output.txt && echo "✓ Deepgram warning present"
grep -q "⚠.*GOOGLE_API_KEY.*optional" /tmp/verify-output.txt && echo "✓ Google API warning present"
grep -q "⚠.*NEXT_PUBLIC_SENTRY_DSN.*optional" /tmp/verify-output.txt && echo "✓ Sentry warning present"

# Verify no failures on optional variables
! grep -q "✗.*DEEPGRAM_API_KEY" /tmp/verify-output.txt
! grep -q "✗.*GOOGLE_API_KEY" /tmp/verify-output.txt
! grep -q "✗.*SENTRY" /tmp/verify-output.txt

# Check exit code is success
test $EXIT_CODE -eq 0 && echo "✓ Script exits successfully despite warnings"
```

### Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying Optional Services
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ DEEPGRAM_API_KEY is not set (optional)
⚠ GOOGLE_API_KEY is not set (optional)
⚠ GOOGLE_SEARCH_ENGINE_ID is not set (optional)
⚠ NEXT_PUBLIC_SENTRY_DSN is not set (optional)
⚠ SENTRY_AUTH_TOKEN is not set (optional)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verification Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Passed:   25
Warnings: 8
Failed:   0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Setup verification complete! All required checks passed.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠ Some optional services are not configured.
  The app will work but some features may be limited.
```

### Success Criteria

- ✅ Optional services show warnings, not failures
- ✅ Script exits with code 0 when only optional services missing
- ✅ Summary indicates optional services status
- ✅ Developer can proceed without optional credentials

---

## AC-7: Verification Script Success

### User Story

As a developer, I want clear confirmation that my environment is properly configured so that I can proceed with confidence to the next feature.

### Given-When-Then

**GIVEN:**

- All required environment variables are set and valid
- All required services are accessible
- Optional services may or may not be configured

**WHEN:**

- Developer runs: `./scripts/verify-setup.sh`
- Script completes all validation checks

**THEN:**

- Summary displays statistics:
  - **Passed:** ≥ 20 checks (exact count may vary)
  - **Warnings:** 5-15 (optional services and unavailable models)
  - **Failed:** 0 checks
- Script displays success banner:
  ```
  ✓ Setup verification complete! All required checks passed.
  ```
- Script provides next steps:
  ```
  Next steps:
  1. Review any warnings above
  2. Set up sample data (see sample-data/README.md)
  3. Start development: npm run dev
  ```
- Script exits with code 0

### Validation Steps

```bash
# Run full verification
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Check summary section
grep -A5 "Verification Summary" /tmp/verify-output.txt | grep -q "Failed:   0"
grep -A5 "Verification Summary" /tmp/verify-output.txt | grep -q "Passed:.*[2-9][0-9]" # At least 20

# Check success banner
grep -q "✓ Setup verification complete! All required checks passed" /tmp/verify-output.txt

# Check next steps provided
grep -q "Next steps:" /tmp/verify-output.txt

# Verify exit code
test $EXIT_CODE -eq 0 && echo "✓ Script exits with success code"
```

### Success Criteria

- ✅ Passed checks ≥ 20
- ✅ Failed checks = 0
- ✅ Success banner displayed
- ✅ Next steps provided
- ✅ Exit code = 0

---

## AC-8: Verification Script Failure Handling

### User Story

As a developer, I want clear error messages when my environment is misconfigured so that I can quickly identify and fix issues.

### Given-When-Then

**GIVEN:**

- One or more required environment variables are missing or invalid
- For example: `OPENAI_API_KEY` is not set

**WHEN:**

- Developer runs: `./scripts/verify-setup.sh`
- Script detects the missing/invalid credential

**THEN:**

- Failed check displays ✗ red X mark with variable name
- Summary shows: "Failed: ≥ 1"
- Script displays failure banner:
  ```
  ✗ Setup verification failed with N error(s)
  ```
- Script provides actionable guidance:
  ```
  Please fix the errors above before proceeding.
  Refer to SETUP_CREDENTIALS_GUIDE.md for detailed instructions.
  ```
- Script exits with code 1

### Validation Steps

```bash
# Test with missing required variable
unset OPENAI_API_KEY
./scripts/verify-setup.sh > /tmp/verify-output.txt 2>&1
EXIT_CODE=$?

# Check for failure indicator
grep -q "✗.*OPENAI_API_KEY" /tmp/verify-output.txt

# Check summary shows failure
grep -A3 "Verification Summary" /tmp/verify-output.txt | grep -q "Failed:.*[1-9]"

# Check failure banner
grep -q "✗ Setup verification failed" /tmp/verify-output.txt

# Check guidance provided
grep -q "SETUP_CREDENTIALS_GUIDE.md" /tmp/verify-output.txt

# Verify exit code is failure
test $EXIT_CODE -eq 1 && echo "✓ Script exits with error code"
```

### Expected Output (Failure Scenario)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verifying OpenAI Credentials
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✗ OPENAI_API_KEY is not set

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verification Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Passed:   19
Warnings: 8
Failed:   1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ Setup verification failed with 1 error(s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please fix the errors above before proceeding.
Refer to SETUP_CREDENTIALS_GUIDE.md for detailed instructions.
```

### Success Criteria

- ✅ Failed checks clearly identified with ✗
- ✅ Summary shows failure count
- ✅ Failure banner displayed
- ✅ Actionable guidance provided
- ✅ Exit code = 1

---

## AC-9: Next.js Environment Loading

### User Story

As a developer, I want Next.js to load my environment variables correctly so that my application can access required credentials at runtime.

### Given-When-Then

**GIVEN:**

- `.env.local` is properly configured with all required variables
- Next.js project is set up (Feature 1.1 complete)

**WHEN:**

- Developer runs: `npm run dev`
- Next.js development server starts

**THEN:**

- Server starts without environment variable errors
- `NEXT_PUBLIC_*` variables are accessible in browser:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Server-only variables are NOT exposed to client:
  - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
  - `OPENAI_API_KEY` (server-only)
  - `STRIPE_SECRET_KEY` (server-only)
  - `STRIPE_WEBHOOK_SECRET` (server-only)
- Application can access server-side variables in API routes

### Validation Steps

```bash
# 1. Start development server
npm run dev &
DEV_PID=$!
sleep 5 # Wait for server to start

# 2. Check browser console can access NEXT_PUBLIC_ variables
curl -s http://localhost:3000 | grep -q "NEXT_PUBLIC_SUPABASE_URL"

# 3. Verify server-only variables NOT in client bundle
curl -s http://localhost:3000/_next/static/ | grep -q "SUPABASE_SERVICE_ROLE_KEY"
if [ $? -ne 0 ]; then
    echo "✓ Service role key NOT exposed to client"
else
    echo "✗ SECURITY ISSUE: Service role key exposed!"
fi

# 4. Test API route can access server variables
# (Requires basic API route to test, created in Feature 1.3)

# Clean up
kill $DEV_PID
```

### Browser Console Test

Open browser console at `http://localhost:3000` and verify:

```javascript
// Should be accessible (NEXT_PUBLIC_ prefix)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
// Expected: "https://xyz.supabase.co"

console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
// Expected: "pk_test_..."

// Should be undefined (server-only)
console.log(process.env.SUPABASE_SERVICE_ROLE_KEY);
// Expected: undefined

console.log(process.env.OPENAI_API_KEY);
// Expected: undefined

console.log(process.env.STRIPE_SECRET_KEY);
// Expected: undefined
```

### Success Criteria

- ✅ Next.js server starts without errors
- ✅ `NEXT_PUBLIC_*` variables accessible in browser
- ✅ Server-only variables NOT exposed to client
- ✅ API routes can access server-side variables
- ✅ No environment variable errors in console

---

## AC-10: Vercel Deployment Readiness

### User Story

As a developer, I want clear documentation on configuring environment variables in Vercel so that I can deploy the application to preview and production environments.

### Given-When-Then

**GIVEN:**

- Local environment is validated and working
- Developer is ready to deploy to Vercel

**WHEN:**

- Developer reviews documentation for Vercel deployment

**THEN:**

- Documentation exists for:
  - Setting environment variables in Vercel dashboard
  - Separating preview and production environments
  - Securing sensitive keys
  - Webhook endpoint configuration
- `.env.example` serves as reference checklist
- Documentation includes links to Vercel's environment variable guide

### Required Documentation Sections

**1. Vercel Environment Variable Setup**

- Step-by-step guide to adding variables in Vercel dashboard
- Screenshot or description of Environment Variables page
- Explanation of environment scopes (Production, Preview, Development)

**2. Variable Categorization**

- **Production + Preview + Development:** `NEXT_PUBLIC_*` variables
- **Production only:** Sensitive keys (Stripe live keys, production webhooks)
- **Preview + Development only:** Test keys (Stripe test keys, development webhooks)

**3. Security Best Practices**

- Use test/development keys for Preview environment
- Only use production keys in Production environment
- Never expose `SERVICE_ROLE_KEY` or `SECRET_KEY` variables as `NEXT_PUBLIC_`
- Rotate keys if accidentally exposed

**4. Webhook Configuration**

- Set `NEXT_PUBLIC_APP_URL` to actual Vercel deployment URL
- Update Stripe webhook endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
- Configure Stripe webhook secret for production environment

### Validation Steps

```bash
# Check documentation exists
test -f docs/deployment/VERCEL_SETUP.md || test -f README.md # Or similar

# Verify .env.example is up-to-date
diff <(grep -E "^[A-Z_]+" .env.example | cut -d= -f1 | sort) \
     <(grep -E "^[A-Z_]+" .env.local | cut -d= -f1 | sort)
# Expected: No differences (all vars documented)

# Check for Vercel-specific instructions
grep -i "vercel" README.md || grep -i "vercel" docs/deployment/*.md
```

### Checklist for Vercel Deployment

- [ ] All variables from `.env.example` are documented
- [ ] Instructions for accessing Vercel environment variables
- [ ] Guidance on Production vs Preview vs Development scopes
- [ ] Security warnings for sensitive variables
- [ ] Webhook endpoint configuration instructions
- [ ] Links to official Vercel documentation
- [ ] Example of setting variables via Vercel CLI (optional)

### Success Criteria

- ✅ Documentation exists for Vercel environment setup
- ✅ All required variables documented with scopes
- ✅ Security best practices included
- ✅ Webhook configuration guidance provided
- ✅ `.env.example` serves as complete reference

---

## Summary Checklist

### Pre-Implementation

- [ ] Read SPEC.md completely
- [ ] Understand all 10 acceptance criteria
- [ ] Review source files (`.env.example`, `verify-setup.sh`)
- [ ] Confirm Feature 1.1 is complete

### During Implementation

- [ ] AC-1: Environment file creation works
- [ ] AC-2: Git ignore protection verified
- [ ] AC-3: Required variable validation passes
- [ ] AC-4: API connectivity validation passes
- [ ] AC-5: Model availability check works
- [ ] AC-6: Optional services handled gracefully
- [ ] AC-7: Success scenario tested
- [ ] AC-8: Failure scenario tested
- [ ] AC-9: Next.js environment loading verified
- [ ] AC-10: Vercel documentation complete

### Post-Implementation

- [ ] All acceptance criteria met
- [ ] Verification script exits 0 with valid config
- [ ] Verification script exits 1 with invalid config
- [ ] Security audit passed (no exposed secrets)
- [ ] Documentation updated
- [ ] Feature marked complete in STATUS.md
- [ ] Git commit made with conventional format

---

## Definition of Done

Feature 1.2 is COMPLETE when:

1. ✅ All 10 acceptance criteria are met
2. ✅ Verification script passes with valid credentials
3. ✅ Verification script fails appropriately with invalid credentials
4. ✅ No credentials exposed in git or client-side code
5. ✅ Next.js loads environment variables correctly
6. ✅ Documentation exists for Vercel deployment
7. ✅ Feature marked complete in `docs/03-IMPLEMENTATION/STATUS.md`
8. ✅ Git commit made: `feat(config): Complete Feature 1.2 - Environment Configuration`

---

**Last Updated:** 2025-10-16
**Status:** Ready for Implementation
**Approved By:** Requirements Analyst Agent
**Next Phase:** Design and Implementation
