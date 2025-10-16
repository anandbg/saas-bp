# 🔐 Complete Setup & Credentials Guide
## Radiology AI Web Application - Autonomous Development Setup

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Credential Collection](#credential-collection)
5. [Verification](#verification)
6. [Sample Data Preparation](#sample-data-preparation)
7. [Troubleshooting](#troubleshooting)

---

## Overview

This guide will walk you through setting up all the necessary accounts, API keys, and credentials needed for autonomous development of your Radiology AI application.

**Total Estimated Time**: 2-3 hours
**Cost**: Most services have free tiers, ~$70-125/month for production usage

### What You'll Set Up
- ✅ GitHub (code repository)
- ✅ Vercel (hosting & deployment)
- ✅ Supabase (database, storage & authentication)
- ✅ OpenAI (AI models & ChatKit)
- ✅ Stripe (billing & subscriptions)
- ⚠️ Deepgram (audio transcription) - OPTIONAL
- ⚠️ Google Custom Search (literature search) - OPTIONAL

### Key Architecture Decision
**We're using Supabase Auth + Stripe** instead of Outseta for:
- ✅ Cost savings ($50-150/month)
- ✅ Better integration with Supabase database
- ✅ Full control and customization
- ✅ Native Row Level Security (RLS)

See `ARCHITECTURE_DECISION_RECORD.md` for full rationale.

---

## Prerequisites

### Required Accounts (Must Create)
- [ ] GitHub account
- [ ] Vercel account
- [ ] Supabase account
- [ ] OpenAI account (with API access)
- [ ] Stripe account
- [ ] Valid credit card (for API services, won't be charged during development)

### Optional Accounts
- [ ] Deepgram account (or use OpenAI Whisper instead)
- [ ] Google Cloud account (for Custom Search API)

### Tools to Install
```bash
# Install required CLIs
brew install gh              # GitHub CLI
npm install -g vercel        # Vercel CLI
brew install supabase/tap/supabase  # Supabase CLI

# Verify installations
gh --version
vercel --version
supabase --version
```

---

## Step-by-Step Setup

### 1️⃣ GitHub Setup

#### Create Repository
```bash
# Login to GitHub CLI
gh auth login
# Follow the prompts to authenticate

# Create new private repository
gh repo create radiology-ai-app \
  --private \
  --description "Radiology AI Web Application with ChatKit" \
  --clone

cd radiology-ai-app
```

#### Generate Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Set name: `Radiology AI App - Claude Development`
4. Set expiration: `90 days`
5. Select scopes:
   - ✅ `repo` (all)
   - ✅ `workflow`
   - ✅ `write:packages`
6. Click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again)

**Save this as**: `GITHUB_TOKEN=ghp_...`

---

### 2️⃣ Vercel Setup

#### Create Account & Login
```bash
# Login to Vercel
vercel login
# Follow email verification

# Create new project (run from your repo)
cd radiology-ai-app
vercel link
# Choose: Create new project
# Project name: radiology-ai-app
# Framework: Next.js
```

#### Get Vercel Token
```bash
# Generate deployment token
vercel token create radiology-ai-claude

# Copy the output token
```

**Save this as**: `VERCEL_TOKEN=...`

#### Get Organization & Project IDs
```bash
# Get your Vercel organization ID
vercel whoami
# Note the "Team" or "User" ID

# Get project ID
vercel project ls
# Note the project ID for radiology-ai-app
```

**Save these as**:
```
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
```

---

### 3️⃣ Supabase Setup

#### Create Project
1. Go to: https://supabase.com/dashboard
2. Click **"New Project"**
3. Settings:
   - Name: `radiology-ai-app`
   - Database Password: **Generate strong password** (save it!)
   - Region: Choose closest to you
4. Wait for project to initialize (~2 minutes)

#### Get Supabase Credentials
1. In your project dashboard, go to **Settings** → **API**
2. Copy the following:

**Project URL**:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
```

**Anon Key** (public):
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Service Role Key** (secret - NEVER expose to client):
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Go to **Settings** → **General**
4. Copy **Reference ID**:
```
SUPABASE_PROJECT_ID=xxxxxxxxxxxxx
```

#### Link CLI to Project
```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID
# Enter your database password when prompted
```

#### Database Password
**Save the password you created**:
```
SUPABASE_DB_PASSWORD=your_strong_password_here
```

#### Configure Supabase Auth

1. Go to **Authentication** → **Providers**
2. Enable providers you want:
   - ✅ **Email** (enabled by default)
   - ✅ **Google** (optional - configure OAuth)
   - ✅ **GitHub** (optional - configure OAuth)

**For Google OAuth** (optional):
1. Create OAuth client at: https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret to Supabase

**For GitHub OAuth** (optional):
1. Create OAuth app at: https://github.com/settings/developers
2. Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret to Supabase

---

### 4️⃣ OpenAI Setup

#### Get API Key
1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Name: `Radiology AI App`
4. Permissions: **All** (or select specific models)
5. Click **"Create secret key"**
6. **COPY THE KEY** (starts with `sk-proj-...`)

**Save as**:
```
OPENAI_API_KEY=sk-proj-...
```

#### Get Organization ID (if applicable)
1. Go to: https://platform.openai.com/settings/organization
2. Copy your Organization ID

**Save as**:
```
OPENAI_ORG_ID=org-...
```

#### ChatKit Setup (No Separate Credentials Needed!)

**Good News**: ChatKit uses your existing OpenAI API key - no separate credentials needed!

ChatKit is part of OpenAI's AgentKit (launched October 2025) and integrates seamlessly with your OpenAI account.

**What You Need**:
- ✅ Your OpenAI API key (already obtained above)
- ✅ That's it! No separate ChatKit project or credentials

**To use ChatKit in your app**:
1. Install the package: `npm install @openai/chatkit-react`
2. Create an agent in the OpenAI platform (optional, or use default)
3. Use your existing `OPENAI_API_KEY` environment variable

**Resources**:
- ChatKit Docs: https://platform.openai.com/docs/guides/chatkit
- GitHub: https://github.com/openai/chatkit-js
- Starter App: https://github.com/openai/openai-chatkit-starter-app

**Note**: If you want to create a custom agent for ChatKit:
1. Go to: https://platform.openai.com/assistants
2. Create a new assistant
3. Note the Assistant ID (starts with `asst_`)
4. Use this ID when initializing ChatKit (optional)

#### Check API Access & Credits
1. Go to: https://platform.openai.com/usage
2. Verify you have:
   - ✅ Access to GPT-4o (required)
   - ✅ Access to Whisper (required)
   - ✅ At least $10 in credits or active billing
3. If not, add payment method: https://platform.openai.com/account/billing

---

### 5️⃣ Stripe Setup

#### Create Account
1. Go to: https://stripe.com/
2. Sign up for account
3. Complete business profile
4. Activate account (may require verification)

#### Get API Keys
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy both keys:

**Publishable Key** (public - safe for client):
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Secret Key** (secret - server only):
```
STRIPE_SECRET_KEY=sk_test_...
```

**Note**: Start with test keys, switch to live keys for production.

#### Create Products & Prices

1. Go to: https://dashboard.stripe.com/test/products
2. Create subscription products:

**Free Tier**:
- Name: `Free Plan`
- Price: $0/month
- Metadata: `plan_name=free`, `reports_per_month=5`

**Professional**:
- Name: `Professional Plan`
- Price: $29/month (recurring)
- Metadata: `plan_name=professional`, `reports_per_month=100`

**Practice**:
- Name: `Practice Plan`
- Price: $99/month (recurring)
- Metadata: `plan_name=practice`, `reports_per_month=500`

**Enterprise**:
- Name: `Enterprise Plan`
- Price: $200/month (recurring)
- Metadata: `plan_name=enterprise`, `reports_per_month=unlimited`

3. Note the Price IDs (start with `price_...`):
```
STRIPE_PRICE_ID_FREE=price_...
STRIPE_PRICE_ID_PROFESSIONAL=price_...
STRIPE_PRICE_ID_PRACTICE=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...
```

#### Configure Webhooks

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe` (update after deployment)
4. Events to listen for:
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
   - ✅ `checkout.session.completed`
5. Click **"Add endpoint"**
6. **Copy the Signing Secret** (starts with `whsec_...`)

**Save as**:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Configure Customer Portal

1. Go to: https://dashboard.stripe.com/test/settings/billing/portal
2. Enable features:
   - ✅ **Update subscription** (allow plan changes)
   - ✅ **Cancel subscription** (allow cancellation)
   - ✅ **Update payment method**
   - ✅ **Invoice history**
3. Configure cancellation:
   - Choose: **Cancel at period end** (avoid immediate cancellation)
4. Save settings

**Note**: Stripe Customer Portal is free and automatically hosted by Stripe!

---

### 6️⃣ Deepgram Setup (OPTIONAL - Can Use OpenAI Whisper Instead)

If you want to use Deepgram for transcription (it's specialized for medical audio):

#### Create Account
1. Go to: https://deepgram.com/
2. Sign up for free account
3. Get $200 free credits

#### Get API Key
1. Go to: https://console.deepgram.com/project/default/keys
2. Click **"Create a New API Key"**
3. Name: `Radiology AI App`
4. Copy the key

**Save as**:
```
DEEPGRAM_API_KEY=...
```

**Note**: If you skip this, the app will use OpenAI Whisper instead (recommended for simplicity).

---

### 7️⃣ Google Custom Search Setup (OPTIONAL)

For PubMed/Radiopaedia/Google literature search feature:

#### Create API Key
1. Go to: https://console.cloud.google.com/apis/credentials
2. Create new project: `Radiology AI Search`
3. Enable **Custom Search API**
4. Create **API Key**
5. Restrict key to Custom Search API only

**Save as**:
```
GOOGLE_API_KEY=AIza...
```

#### Create Custom Search Engine
1. Go to: https://programmablesearchengine.google.com/
2. Click **"Add"**
3. Settings:
   - Sites to search: `pubmed.ncbi.nlm.nih.gov`, `radiopaedia.org`
   - Name: `Medical Literature Search`
4. Get Search Engine ID

**Save as**:
```
GOOGLE_SEARCH_ENGINE_ID=...
```

**Note**: If you skip this, literature search will be limited to PubMed only (which is free).

---

## Credential Collection

### Create Your Credentials File

Create a file named `credentials.env` in a **secure location** (NOT in the repo):

```bash
# Create secure credentials file
cd ~
mkdir -p .secure/radiology-ai
nano .secure/radiology-ai/credentials.env
```

Copy and fill in the template below:

```bash
# ============================================
# RADIOLOGY AI APP - CREDENTIALS
# ============================================
# IMPORTANT: Keep this file secure and NEVER commit to git
# Last updated: [DATE]

# --------------------------------------------
# Environment
# --------------------------------------------
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# --------------------------------------------
# GitHub
# --------------------------------------------
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=yourusername/radiology-ai-app

# --------------------------------------------
# Vercel
# --------------------------------------------
VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VERCEL_ORG_ID=team_xxxxxxxxxxxxxxxxxxxx
VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxxxxxxxxx

# --------------------------------------------
# Supabase
# --------------------------------------------
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=xxxxxxxxxxxxx
SUPABASE_DB_PASSWORD=your_strong_password

# --------------------------------------------
# OpenAI
# --------------------------------------------
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxxxxxxxx

# --------------------------------------------
# ChatKit (uses OpenAI API key - no separate credentials needed)
# --------------------------------------------
# Optional: If you created a custom assistant for ChatKit:
# OPENAI_ASSISTANT_ID=asst_xxxxxxxxxxxx

# --------------------------------------------
# Stripe
# --------------------------------------------
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx

# Price IDs for subscription plans
STRIPE_PRICE_ID_FREE=price_xxxxxxxxxxxx
STRIPE_PRICE_ID_PROFESSIONAL=price_xxxxxxxxxxxx
STRIPE_PRICE_ID_PRACTICE=price_xxxxxxxxxxxx
STRIPE_PRICE_ID_ENTERPRISE=price_xxxxxxxxxxxx

# --------------------------------------------
# Deepgram (OPTIONAL)
# --------------------------------------------
DEEPGRAM_API_KEY=xxxxxxxxxxxx

# --------------------------------------------
# Google Custom Search (OPTIONAL)
# --------------------------------------------
GOOGLE_API_KEY=AIzaxxxxxxxxxxxx
GOOGLE_SEARCH_ENGINE_ID=xxxxxxxxxxxx

# --------------------------------------------
# Test Accounts
# --------------------------------------------
TEST_USER_EMAIL_1=testuser1@yourdomain.com
TEST_USER_EMAIL_2=testuser2@yourdomain.com
TEST_USER_PASSWORD=TestPassword123!
```

### Verify Your File

Run this to check you've filled everything:

```bash
# Check for any unfilled placeholders
grep "xxxx" ~/.secure/radiology-ai/credentials.env
# Should return nothing if all filled

# Count total credentials
grep -c "=" ~/.secure/radiology-ai/credentials.env
# Should show ~30-35 lines
```

---

## Verification

Now let's verify all your credentials work!

### Run Verification Script

```bash
# Make sure you're in the project directory
cd radiology-ai-app

# Run the verification script
bash scripts/verify-setup.sh ~/.secure/radiology-ai/credentials.env
```

This script will:
- ✅ Test GitHub API access
- ✅ Test Vercel deployment access
- ✅ Test Supabase connection
- ✅ Test Supabase Auth configuration
- ✅ Test OpenAI API (check credits)
- ✅ Test ChatKit access
- ✅ Test Stripe API
- ✅ Verify Stripe webhook configuration
- ✅ Test Deepgram API (if provided)
- ✅ Test Google Custom Search (if provided)

### Expected Output

```
🔍 Verifying Radiology AI Setup...

✅ GitHub: Connected (user: yourusername)
✅ Vercel: Connected (org: yourteam)
✅ Supabase: Connected (project: radiology-ai-app)
✅ Supabase Auth: Configured (Email enabled)
✅ OpenAI: Connected (credits: $50.00)
✅ ChatKit: Connected (using OpenAI API key)
✅ Stripe: Connected (test mode)
✅ Stripe Webhooks: Configured (6 events)
⚠️  Deepgram: Not configured (will use OpenAI Whisper)
⚠️  Google Search: Not configured (limited search)

🎉 All required services verified!
📝 2 optional services not configured (acceptable)

Ready to start development!
```

### Troubleshooting Failed Verifications

If any check fails, see the [Troubleshooting](#troubleshooting) section below.

---

## Sample Data Preparation

To fully test the application autonomously, I need sample radiology data.

### Required Sample Data

Create a directory structure:

```bash
cd radiology-ai-app
mkdir -p sample-data/{findings,templates,audio,reports}
```

### 1. Sample Findings (Text)

Create: `sample-data/findings/chest-ct-pneumonia.txt`
```
Bilateral patchy ground-glass opacities predominantly in the lower lobes.
Crazy-paving pattern noted in the right middle lobe.
No pleural effusion.
No significant mediastinal lymphadenopathy.
Heart size is normal.
```

Create: `sample-data/findings/brain-mri-stroke.txt`
```
Acute infarct in the left middle cerebral artery territory.
No hemorrhagic transformation.
Mass effect with 3mm midline shift to the right.
Preserved gray-white differentiation.
No hydrocephalus.
```

**Create 3-5 more examples** covering different modalities (CT, MRI, X-Ray).

### 2. Sample Templates

Create: `sample-data/templates/chest-ct-template.txt`
```
CT CHEST WITH CONTRAST

TECHNIQUE:
Axial images of the chest were obtained with IV contrast.

COMPARISON:
No prior studies available for comparison.

FINDINGS:
The lungs are clear without focal consolidation, pleural effusion, or pneumothorax.
The heart is normal in size.
No mediastinal or hilar lymphadenopathy.
The visualized upper abdomen is unremarkable.

IMPRESSION:
Normal CT chest.
```

**Create 3-5 templates** for different scan types.

### 3. Sample Audio Files

Record or provide 2-3 audio files of you reading radiology findings:

```bash
# Example using Mac (or use your phone):
# Record yourself saying findings for 30-60 seconds
# Save as: sample-data/audio/chest-findings-01.wav

# If you don't want to record:
# I can generate test audio files programmatically
```

**Minimum**: 2 audio files (MP3 or WAV format)

### 4. Quick Setup Script

Create all sample data at once:

```bash
# Run from project root
bash scripts/create-sample-data.sh
```

This will create realistic sample data if you don't want to write it manually.

---

## Sharing Credentials with Me (Claude)

### Option 1: Secure Paste (Recommended)

1. Copy your `credentials.env` file
2. Share with me in the chat
3. I will **NOT store it** (ephemeral session only)
4. You can delete the message after I confirm receipt

### Option 2: Encrypted File

```bash
# Encrypt the file
gpg -c ~/.secure/radiology-ai/credentials.env
# Enter a passphrase

# This creates: credentials.env.gpg
# Share the encrypted file + passphrase separately
```

### Option 3: Environment Variable Export

```bash
# Export all variables
set -a
source ~/.secure/radiology-ai/credentials.env
set +a

# Print all (I'll read from your terminal output)
env | grep -E "GITHUB|VERCEL|SUPABASE|OPENAI|STRIPE|DEEPGRAM|GOOGLE"
```

---

## Troubleshooting

### GitHub Issues

**Problem**: `gh auth login` fails
```bash
# Solution: Use token directly
export GITHUB_TOKEN=ghp_your_token
gh auth login --with-token <<< "$GITHUB_TOKEN"
```

**Problem**: Permission denied
```bash
# Solution: Check token scopes
gh auth status
# Regenerate token with correct scopes if needed
```

### Vercel Issues

**Problem**: `vercel: command not found`
```bash
# Solution: Reinstall globally
npm install -g vercel@latest
```

**Problem**: `Error: No existing credentials found`
```bash
# Solution: Login again
vercel logout
vercel login
```

### Supabase Issues

**Problem**: `supabase link` fails
```bash
# Solution: Check project ID
supabase projects list
# Use exact Reference ID from web dashboard
```

**Problem**: Connection timeout
```bash
# Solution: Check network/firewall
# Ensure you can access: https://your-project.supabase.co
curl https://your-project.supabase.co
```

**Problem**: Auth providers not working
- Check callback URLs match exactly
- Verify OAuth credentials are correct
- Test with simple email/password first

### OpenAI Issues

**Problem**: API key invalid
- Check key starts with `sk-proj-` (new format) or `sk-` (old format)
- Verify key hasn't been revoked at: https://platform.openai.com/api-keys

**Problem**: Insufficient quota
- Add payment method: https://platform.openai.com/account/billing
- Set monthly limit: $50 recommended for development

**Problem**: ChatKit integration not working
- Ensure you have `@openai/chatkit-react` installed: `npm install @openai/chatkit-react`
- Verify your OpenAI API key has sufficient credits
- Check ChatKit docs: https://platform.openai.com/docs/guides/chatkit
- ChatKit is generally available (no beta access needed)

### Stripe Issues

**Problem**: Webhook signature verification fails
- Ensure you're using the correct webhook secret
- Check that raw request body is passed to verification
- Test webhooks using: https://dashboard.stripe.com/test/webhooks

**Problem**: Product/Price creation fails
- Ensure all required fields are filled
- Check that currency is supported (USD recommended)
- Verify billing period is valid

**Problem**: Customer Portal not configured
- Complete configuration at: https://dashboard.stripe.com/test/settings/billing/portal
- Enable all required features

### Network/Firewall Issues

If verification script fails for all services:

```bash
# Check internet connection
curl -I https://www.google.com

# Check if corporate firewall blocks APIs
curl -I https://api.openai.com
curl -I https://api.supabase.com
curl -I https://api.stripe.com

# If behind proxy, set:
export HTTP_PROXY=http://your-proxy:8080
export HTTPS_PROXY=http://your-proxy:8080
```

---

## Next Steps

Once you've completed this guide:

1. ✅ Run verification script
2. ✅ Confirm all checks pass
3. ✅ Share credentials with me securely
4. ✅ Provide sample data (or let me generate it)
5. 🚀 I'll begin autonomous development!

---

## Security Reminders

- 🔒 **NEVER commit credentials to git**
- 🔒 **Add `credentials.env` to `.gitignore`**
- 🔒 **Rotate keys every 90 days**
- 🔒 **Use different keys for dev/production**
- 🔒 **Use test keys for Stripe during development**
- 🔒 **Enable webhook signature verification**
- 🔒 **Delete test credentials after project completion**

---

## Support Links

- **GitHub CLI**: https://cli.github.com/manual/
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **OpenAI**: https://platform.openai.com/docs
- **ChatKit**: https://platform.openai.com/docs/guides/chatkit
- **Stripe**: https://stripe.com/docs
- **Stripe Webhooks**: https://stripe.com/docs/webhooks
- **Deepgram**: https://developers.deepgram.com/docs

---

## Cost Comparison

### With Supabase Auth + Stripe:
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- OpenAI API: $20-50/month (usage-based)
- Stripe: 2.9% + $0.30 per transaction (no base fee)
- **Total Base**: ~$65-95/month

### Savings vs. Outseta:
- **Monthly**: $50-150 saved
- **Annual**: $600-1,800 saved
- **Full control**: Priceless 😊

---

## Questions?

If you get stuck at any step:
1. Check the Troubleshooting section
2. Review the specific service's documentation
3. Ask me for clarification before proceeding

**Ready to start? Share your completed `credentials.env` file when ready!** 🚀
