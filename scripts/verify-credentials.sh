#!/bin/bash

# Credential Verification Script
# Tests connectivity to all required services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f credentials.env ]; then
    set -a
    source credentials.env
    set +a
    echo -e "${GREEN}✓${NC} Loaded credentials.env"
else
    echo -e "${RED}✗${NC} credentials.env not found"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Credential Verification Report${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# GitHub
echo -e "${BLUE}[1/6] GitHub API${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$GITHUB_TOKEN" ] || [[ "$GITHUB_TOKEN" == "ghp_"* && ${#GITHUB_TOKEN} -lt 20 ]]; then
    echo -e "${YELLOW}⊘${NC} GitHub: Skipped (token not configured)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
else
    GITHUB_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)
    HTTP_CODE=$(echo "$GITHUB_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        USERNAME=$(echo "$GITHUB_RESPONSE" | head -n-1 | jq -r '.login')
        echo -e "${GREEN}✓${NC} GitHub: Connected as $USERNAME"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} GitHub: Authentication failed (HTTP $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Vercel
echo -e "${BLUE}[2/6] Vercel API${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$VERCEL_TOKEN" ] || [ ${#VERCEL_TOKEN} -lt 20 ]; then
    echo -e "${YELLOW}⊘${NC} Vercel: Skipped (token not configured)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
else
    VERCEL_RESPONSE=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v2/user")
    HTTP_CODE=$(echo "$VERCEL_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        USERNAME=$(echo "$VERCEL_RESPONSE" | head -n-1 | jq -r '.user.username // .user.email')
        echo -e "${GREEN}✓${NC} Vercel: Connected as $USERNAME"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Vercel: Authentication failed (HTTP $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Supabase
echo -e "${BLUE}[3/6] Supabase API${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⊘${NC} Supabase: Skipped (credentials not configured)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
else
    SUPABASE_RESPONSE=$(curl -s -w "\n%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY")
    HTTP_CODE=$(echo "$SUPABASE_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓${NC} Supabase: Connected to $NEXT_PUBLIC_SUPABASE_URL"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Supabase: Connection failed (HTTP $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# OpenAI
echo -e "${BLUE}[4/6] OpenAI API${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$OPENAI_API_KEY" ] || [[ "$OPENAI_API_KEY" == "sk-"* && ${#OPENAI_API_KEY} -lt 20 ]]; then
    echo -e "${YELLOW}⊘${NC} OpenAI: Skipped (API key not configured)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
else
    OPENAI_RESPONSE=$(curl -s -w "\n%{http_code}" https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY")
    HTTP_CODE=$(echo "$OPENAI_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        MODEL_COUNT=$(echo "$OPENAI_RESPONSE" | head -n-1 | jq -r '.data | length')
        echo -e "${GREEN}✓${NC} OpenAI: Connected ($MODEL_COUNT models available)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        ERROR_MSG=$(echo "$OPENAI_RESPONSE" | head -n-1 | jq -r '.error.message // "Unknown error"')
        echo -e "${RED}✗${NC} OpenAI: Authentication failed - $ERROR_MSG"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Stripe
echo -e "${BLUE}[5/6] Stripe API${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$STRIPE_SECRET_KEY" ] || [[ "$STRIPE_SECRET_KEY" == *"xxxx"* ]]; then
    echo -e "${YELLOW}⊘${NC} Stripe: Skipped (API key not configured - placeholder value)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
elif [[ ! "$STRIPE_SECRET_KEY" =~ ^sk_(test|live)_ ]]; then
    echo -e "${RED}✗${NC} Stripe: Invalid key format (must start with sk_test_ or sk_live_)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
else
    STRIPE_RESPONSE=$(curl -s -w "\n%{http_code}" https://api.stripe.com/v1/customers -u "$STRIPE_SECRET_KEY:")
    HTTP_CODE=$(echo "$STRIPE_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        MODE=$(echo "$STRIPE_SECRET_KEY" | grep -o 'test\|live')
        echo -e "${GREEN}✓${NC} Stripe: Connected ($MODE mode)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        ERROR_MSG=$(echo "$STRIPE_RESPONSE" | head -n-1 | jq -r '.error.message // "Unknown error"')
        echo -e "${RED}✗${NC} Stripe: Authentication failed - $ERROR_MSG"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Database connectivity (PostgreSQL via Supabase)
echo -e "${BLUE}[6/6] Database Connection${NC}"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⊘${NC} Database: Skipped (service role key not configured)"
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
else
    DB_RESPONSE=$(curl -s -w "\n%{http_code}" "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
    HTTP_CODE=$(echo "$DB_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓${NC} Database: Connected with service role"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} Database: Connection failed (HTTP $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Tests:   $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC}        $PASSED_TESTS"
echo -e "${RED}Failed:${NC}        $FAILED_TESTS"
echo -e "${YELLOW}Skipped:${NC}       $SKIPPED_TESTS"
echo ""

# Overall status
if [ $FAILED_TESTS -eq 0 ] && [ $PASSED_TESTS -gt 0 ]; then
    echo -e "${GREEN}✓ All configured services are accessible${NC}"
    if [ $SKIPPED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Some services are not configured yet (see skipped tests above)${NC}"
    fi
    exit 0
elif [ $PASSED_TESTS -eq 0 ]; then
    echo -e "${RED}✗ No services are configured or accessible${NC}"
    echo -e "${YELLOW}⚠ Please configure credentials in credentials.env${NC}"
    exit 1
else
    echo -e "${YELLOW}⚠ Some tests failed - review errors above${NC}"
    if [ $SKIPPED_TESTS -gt 0 ]; then
        echo -e "${YELLOW}⚠ Some services are not configured yet${NC}"
    fi
    exit 1
fi
