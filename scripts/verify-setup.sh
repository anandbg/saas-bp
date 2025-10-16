#!/bin/bash

# ==============================================================================
# SETUP VERIFICATION SCRIPT FOR RADIOLOGY REPORTING APP
# ==============================================================================
#
# This script verifies that all credentials and services are properly configured
# Run this after completing the setup guide and filling in credentials.env
#
# Usage: ./scripts/verify-setup.sh
#
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# ==============================================================================
# Helper Functions
# ==============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

check_env_var() {
    if [ -z "${!1}" ]; then
        print_error "$1 is not set"
        return 1
    else
        print_success "$1 is set"
        return 0
    fi
}

check_env_var_optional() {
    if [ -z "${!1}" ]; then
        print_warning "$1 is not set (optional)"
        return 0
    else
        print_success "$1 is set"
        return 0
    fi
}

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

# ==============================================================================
# Load Environment Variables
# ==============================================================================

print_header "Loading Environment Variables"

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

# Load environment variables
set -a
source "$ENV_FILE"
set +a

print_success "Environment variables loaded from $ENV_FILE"

# ==============================================================================
# Check Prerequisites
# ==============================================================================

print_header "Checking Prerequisites"

check_command node
check_command npm
check_command git
check_command curl
check_command jq

# Check Node version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -ge 18 ]; then
    print_success "Node.js version $NODE_VERSION is >= 18"
else
    print_error "Node.js version $NODE_VERSION is < 18 (required: >= 18)"
fi

# ==============================================================================
# Check Required CLI Tools
# ==============================================================================

print_header "Checking CLI Tools"

if check_command gh; then
    GH_VERSION=$(gh --version | head -n1)
    print_info "GitHub CLI version: $GH_VERSION"
fi

if check_command vercel; then
    VERCEL_VERSION=$(vercel --version)
    print_info "Vercel CLI version: $VERCEL_VERSION"
fi

if check_command supabase; then
    SUPABASE_VERSION=$(supabase --version)
    print_info "Supabase CLI version: $SUPABASE_VERSION"
fi

# ==============================================================================
# Verify GitHub Credentials
# ==============================================================================

print_header "Verifying GitHub Credentials"

check_env_var GITHUB_TOKEN
check_env_var GITHUB_USERNAME
check_env_var GITHUB_REPO_NAME

if [ ! -z "$GITHUB_TOKEN" ]; then
    print_info "Testing GitHub API access..."
    GITHUB_USER=$(curl -s -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user | jq -r '.login')

    if [ "$GITHUB_USER" != "null" ] && [ ! -z "$GITHUB_USER" ]; then
        print_success "GitHub API access verified (user: $GITHUB_USER)"

        if [ "$GITHUB_USER" != "$GITHUB_USERNAME" ]; then
            print_warning "GitHub username mismatch: token user is '$GITHUB_USER' but GITHUB_USERNAME is '$GITHUB_USERNAME'"
        fi
    else
        print_error "GitHub API access failed - check your token"
    fi
fi

# ==============================================================================
# Verify Vercel Credentials
# ==============================================================================

print_header "Verifying Vercel Credentials"

check_env_var VERCEL_TOKEN
check_env_var VERCEL_ORG_ID
check_env_var VERCEL_PROJECT_ID

if [ ! -z "$VERCEL_TOKEN" ]; then
    print_info "Testing Vercel API access..."
    VERCEL_USER=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" https://api.vercel.com/v2/user | jq -r '.user.username')

    if [ "$VERCEL_USER" != "null" ] && [ ! -z "$VERCEL_USER" ]; then
        print_success "Vercel API access verified (user: $VERCEL_USER)"
    else
        print_error "Vercel API access failed - check your token"
    fi
fi

# ==============================================================================
# Verify Supabase Credentials
# ==============================================================================

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

if [ ! -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ ! -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_info "Testing Supabase API access..."
    SUPABASE_RESPONSE=$(curl -s -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/")

    if [[ "$SUPABASE_RESPONSE" == *"\"message\""* ]] || [[ "$SUPABASE_RESPONSE" == *"\"hint\""* ]]; then
        print_success "Supabase API access verified"
    else
        print_warning "Supabase API access test inconclusive - may need database setup"
    fi
fi

# ==============================================================================
# Verify OpenAI Credentials
# ==============================================================================

print_header "Verifying OpenAI Credentials"

check_env_var OPENAI_API_KEY
check_openai_key_format OPENAI_API_KEY
check_env_var_optional OPENAI_ORG_ID
check_env_var_optional CHATKIT_API_KEY
check_env_var_optional CHATKIT_PROJECT_ID

if [ ! -z "$OPENAI_API_KEY" ]; then
    print_info "Testing OpenAI API access..."
    OPENAI_RESPONSE=$(curl -s -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models)

    if echo "$OPENAI_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
        print_success "OpenAI API access verified"

        # Check for GPT-5 availability
        if echo "$OPENAI_RESPONSE" | jq -e '.data[] | select(.id | contains("gpt-5"))' > /dev/null 2>&1; then
            print_success "GPT-5 model access confirmed"
        else
            print_warning "GPT-5 model not available - will use fallback model"
        fi

        # Check for O3 availability
        if echo "$OPENAI_RESPONSE" | jq -e '.data[] | select(.id | contains("o3"))' > /dev/null 2>&1; then
            print_success "O3 model access confirmed"
        else
            print_warning "O3 model not available - will use fallback model"
        fi

        # Check for Whisper availability
        if echo "$OPENAI_RESPONSE" | jq -e '.data[] | select(.id | contains("whisper"))' > /dev/null 2>&1; then
            print_success "Whisper model access confirmed"
        else
            print_warning "Whisper model not found in models list"
        fi
    else
        print_error "OpenAI API access failed - check your API key"
    fi
fi

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

# ==============================================================================
# Verify Optional Services
# ==============================================================================

print_header "Verifying Optional Services"

# Deepgram
check_env_var_optional DEEPGRAM_API_KEY
if [ ! -z "$DEEPGRAM_API_KEY" ]; then
    print_info "Testing Deepgram API access..."
    DEEPGRAM_RESPONSE=$(curl -s -H "Authorization: Token $DEEPGRAM_API_KEY" https://api.deepgram.com/v1/projects)

    if echo "$DEEPGRAM_RESPONSE" | jq -e '.projects' > /dev/null 2>&1; then
        print_success "Deepgram API access verified"
    else
        print_warning "Deepgram API access failed - check your API key"
    fi
fi

# Google Custom Search
check_env_var_optional GOOGLE_API_KEY
check_env_var_optional GOOGLE_SEARCH_ENGINE_ID
if [ ! -z "$GOOGLE_API_KEY" ] && [ ! -z "$GOOGLE_SEARCH_ENGINE_ID" ]; then
    print_info "Testing Google Custom Search API..."
    GOOGLE_RESPONSE=$(curl -s "https://www.googleapis.com/customsearch/v1?key=$GOOGLE_API_KEY&cx=$GOOGLE_SEARCH_ENGINE_ID&q=test")

    if echo "$GOOGLE_RESPONSE" | jq -e '.searchInformation' > /dev/null 2>&1; then
        print_success "Google Custom Search API access verified"
    else
        print_warning "Google Custom Search API access failed"
    fi
fi

# PubMed
check_env_var_optional PUBMED_EMAIL
check_env_var_optional PUBMED_API_KEY

# ==============================================================================
# Check Model Configuration
# ==============================================================================

print_header "Checking AI Model Configuration"

check_env_var_optional AI_MODEL_ESPRESSO
check_env_var_optional AI_MODEL_ESPRESSO_FALLBACK
check_env_var_optional AI_MODEL_SLOW_BREWED
check_env_var_optional AI_MODEL_SLOW_BREWED_FALLBACK

if [ -z "$AI_MODEL_ESPRESSO" ]; then
    print_info "Using default espresso model: gpt-5"
fi

if [ -z "$AI_MODEL_SLOW_BREWED" ]; then
    print_info "Using default slow-brewed model: o3"
fi

# ==============================================================================
# Check Feature Flags
# ==============================================================================

print_header "Checking Feature Flags"

print_info "ENABLE_WEBSOCKET_TRANSCRIPTION: ${ENABLE_WEBSOCKET_TRANSCRIPTION:-true}"
print_info "ENABLE_DEEPGRAM: ${ENABLE_DEEPGRAM:-false}"
print_info "ENABLE_WHISPER: ${ENABLE_WHISPER:-true}"
print_info "ENABLE_PUBMED_SEARCH: ${ENABLE_PUBMED_SEARCH:-true}"
print_info "ENABLE_GOOGLE_SEARCH: ${ENABLE_GOOGLE_SEARCH:-false}"
print_info "ENABLE_RADIOPAEDIA_SEARCH: ${ENABLE_RADIOPAEDIA_SEARCH:-true}"

# ==============================================================================
# Check Project Structure
# ==============================================================================

print_header "Checking Project Structure"

if [ -d "RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main" ]; then
    print_success "Source project directory found"

    if [ -f "RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/index.js" ]; then
        print_success "Source index.js found"
    else
        print_error "Source index.js not found"
    fi

    if [ -f "RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/report_prompt.txt" ]; then
        print_success "Report prompt template found"
    else
        print_error "Report prompt template not found"
    fi

    if [ -f "RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/routes/templates.js" ]; then
        print_success "Template routes found"
    else
        print_error "Template routes not found"
    fi
else
    print_warning "Source project directory not found in current location"
fi

# ==============================================================================
# Summary
# ==============================================================================

print_header "Verification Summary"

echo ""
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ Setup verification complete! All required checks passed.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Some optional services are not configured.${NC}"
        echo -e "${YELLOW}  The app will work but some features may be limited.${NC}"
        echo ""
    fi

    echo "Next steps:"
    echo "1. Review any warnings above"
    echo "2. Set up sample data (see sample-data/README.md)"
    echo "3. Start development: npm run dev"
    echo ""
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ Setup verification failed with $FAILED error(s)${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    echo "Refer to SETUP_CREDENTIALS_GUIDE.md for detailed instructions."
    echo ""
    exit 1
fi
