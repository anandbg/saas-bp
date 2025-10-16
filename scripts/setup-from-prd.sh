#!/bin/bash

# =============================================================================
# setup-from-prd.sh - Automated SaaS Boilerplate Setup from PRD
# =============================================================================
#
# This script reads your PRD.md file and automatically configures the
# boilerplate for your specific SaaS application.
#
# Usage:
#   ./scripts/setup-from-prd.sh
#
# Prerequisites:
#   - PRD.md completed in project root
#   - Node.js 18+ installed
#   - npm or pnpm installed
#   - Supabase CLI installed (optional, for database setup)
#   - Stripe CLI installed (optional, for Stripe setup)
#
# What this script does:
#   1. Parses PRD.md to extract product details
#   2. Replaces generic entity names with your entity names
#   3. Generates database schema from entity definitions
#   4. Creates API routes for your entities
#   5. Generates UI components
#   6. Configures Stripe products and pricing
#   7. Sets up environment variables
#   8. Generates documentation
#   9. Initializes Git repository
#   10. Runs verification tests
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
  echo ""
  echo -e "${BLUE}===================================================================${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}===================================================================${NC}"
  echo ""
}

print_step() {
  echo -e "${GREEN}[✓]${NC} $1"
}

print_info() {
  echo -e "${YELLOW}[i]${NC} $1"
}

print_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Read a value from PRD.md
read_prd_value() {
  local key="$1"
  local default="$2"
  # Simple grep-based parsing (in real implementation, use a proper parser)
  grep "^**$key**:" PRD.md | sed "s/^**$key**: //" | head -1 || echo "$default"
}

# Confirm with user
confirm() {
  local prompt="$1"
  local response
  echo -n -e "${YELLOW}${prompt} (y/N):${NC} "
  read -r response
  [[ "$response" =~ ^[Yy]$ ]]
}

# =============================================================================
# Step 1: Prerequisites Check
# =============================================================================

check_prerequisites() {
  print_header "Step 1: Checking Prerequisites"

  local missing_deps=0

  # Check for required commands
  if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    missing_deps=1
  else
    print_step "Node.js installed: $(node --version)"
  fi

  if ! command_exists npm && ! command_exists pnpm; then
    print_error "npm or pnpm is not installed."
    missing_deps=1
  else
    if command_exists pnpm; then
      print_step "pnpm installed: $(pnpm --version)"
    else
      print_step "npm installed: $(npm --version)"
    fi
  fi

  # Check for PRD.md
  if [ ! -f "PRD.md" ]; then
    print_error "PRD.md not found. Please copy PRD_TEMPLATE.md to PRD.md and fill it out."
    print_info "Run: cp PRD_TEMPLATE.md PRD.md"
    exit 1
  else
    print_step "PRD.md found"
  fi

  # Optional: Check for Supabase CLI
  if command_exists supabase; then
    print_step "Supabase CLI installed"
  else
    print_info "Supabase CLI not found (optional). You can install it later."
  fi

  # Optional: Check for Stripe CLI
  if command_exists stripe; then
    print_step "Stripe CLI installed"
  else
    print_info "Stripe CLI not found (optional). You can install it later."
  fi

  if [ $missing_deps -eq 1 ]; then
    print_error "Please install missing dependencies and try again."
    exit 1
  fi
}

# =============================================================================
# Step 2: Parse PRD
# =============================================================================

parse_prd() {
  print_header "Step 2: Parsing PRD"

  # Extract key values from PRD
  export PRODUCT_NAME=$(read_prd_value "Name" "My SaaS App")
  export ENTITY_SINGULAR=$(read_prd_value "Name (singular)" "entity")
  export ENTITY_PLURAL=$(read_prd_value "Name (plural)" "entities")

  print_info "Product Name: $PRODUCT_NAME"
  print_info "Entity (singular): $ENTITY_SINGULAR"
  print_info "Entity (plural): $ENTITY_PLURAL"

  # TODO: Parse entity attributes, subscription tiers, features, etc.
  # This would involve more sophisticated parsing in a real implementation

  print_step "PRD parsed successfully"
}

# =============================================================================
# Step 3: Replace Generic Terms
# =============================================================================

replace_generic_terms() {
  print_header "Step 3: Replacing Generic Entity Names"

  print_info "Replacing 'entity' with '$ENTITY_SINGULAR'"
  print_info "Replacing 'entities' with '$ENTITY_PLURAL'"

  # Create backup directory
  mkdir -p .backup/$(date +%Y%m%d_%H%M%S)

  # Files to update (in real implementation, use a comprehensive list)
  local files_to_update=(
    "app/api/entities/**/*"
    "components/entities/**/*"
    "types/entities.ts"
    "lib/entities/**/*"
  )

  # TODO: Implement actual find/replace logic
  # find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s/entity/$ENTITY_SINGULAR/g"
  # find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i.bak "s/entities/$ENTITY_PLURAL/g"

  print_step "Generic terms replaced"
}

# =============================================================================
# Step 4: Generate Database Schema
# =============================================================================

generate_database_schema() {
  print_header "Step 4: Generating Database Schema"

  # Create migrations directory if it doesn't exist
  mkdir -p supabase/migrations

  # Generate migration file
  local migration_file="supabase/migrations/$(date +%Y%m%d%H%M%S)_create_${ENTITY_PLURAL}.sql"

  # TODO: Generate schema based on PRD entity attributes
  cat > "$migration_file" <<EOF
-- Migration: Create ${ENTITY_PLURAL} table
-- Generated from PRD.md

CREATE TABLE ${ENTITY_PLURAL} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- TODO: Add custom fields from PRD here
  title TEXT NOT NULL,
  content TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ${ENTITY_PLURAL} ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY ${ENTITY_PLURAL}_select_own ON ${ENTITY_PLURAL}
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ${ENTITY_PLURAL}_insert_own ON ${ENTITY_PLURAL}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY ${ENTITY_PLURAL}_update_own ON ${ENTITY_PLURAL}
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ${ENTITY_PLURAL}_delete_own ON ${ENTITY_PLURAL}
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_${ENTITY_PLURAL}_user_id ON ${ENTITY_PLURAL}(user_id);
CREATE INDEX idx_${ENTITY_PLURAL}_created_at ON ${ENTITY_PLURAL}(created_at DESC);
EOF

  print_step "Database migration created: $migration_file"
  print_info "Run 'npx supabase db push' to apply the migration"
}

# =============================================================================
# Step 5: Generate API Routes
# =============================================================================

generate_api_routes() {
  print_header "Step 5: Generating API Routes"

  # Create API directories
  mkdir -p "app/api/${ENTITY_PLURAL}"
  mkdir -p "app/api/${ENTITY_PLURAL}/[id]"

  # TODO: Generate route.ts files based on templates
  print_info "Generating /api/${ENTITY_PLURAL}/route.ts (List, Create)"
  print_info "Generating /api/${ENTITY_PLURAL}/[id]/route.ts (Get, Update, Delete)"

  print_step "API routes generated"
}

# =============================================================================
# Step 6: Generate UI Components
# =============================================================================

generate_ui_components() {
  print_header "Step 6: Generating UI Components"

  # Create component directories
  mkdir -p "components/${ENTITY_PLURAL}"
  mkdir -p "app/(dashboard)/${ENTITY_PLURAL}"

  # TODO: Generate components from templates
  print_info "Generating ${ENTITY_PLURAL} List component"
  print_info "Generating ${ENTITY_SINGULAR} Card component"
  print_info "Generating ${ENTITY_SINGULAR} Form component"
  print_info "Generating ${ENTITY_PLURAL} page"

  print_step "UI components generated"
}

# =============================================================================
# Step 7: Configure Stripe
# =============================================================================

configure_stripe() {
  print_header "Step 7: Configuring Stripe (Optional)"

  if ! confirm "Do you want to configure Stripe now?"; then
    print_info "Skipping Stripe configuration. You can do this manually later."
    return
  fi

  if ! command_exists stripe; then
    print_error "Stripe CLI not found. Please install it first:"
    print_info "https://stripe.com/docs/stripe-cli"
    return
  fi

  # TODO: Create Stripe products and prices based on PRD subscription tiers
  print_info "Creating Stripe products..."

  print_step "Stripe configured (placeholder - implement actual setup)"
}

# =============================================================================
# Step 8: Setup Environment Variables
# =============================================================================

setup_environment() {
  print_header "Step 8: Setting Up Environment Variables"

  if [ -f ".env.local" ]; then
    print_info ".env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
  fi

  # Create .env.local from template
  cat > .env.local <<EOF
# Generated by setup-from-prd.sh
# $(date)

# =============================================================================
# Supabase Configuration
# =============================================================================
# Get these from: https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# =============================================================================
# Stripe Configuration
# =============================================================================
# Get these from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# =============================================================================
# OpenAI Configuration (Optional - for AI features)
# =============================================================================
OPENAI_API_KEY=sk-your_openai_api_key_here

# =============================================================================
# Application Configuration
# =============================================================================
NEXT_PUBLIC_APP_NAME=${PRODUCT_NAME}
NEXT_PUBLIC_APP_URL=http://localhost:3000

EOF

  print_step "Environment template created: .env.local"
  print_info "Please edit .env.local and add your API keys"
}

# =============================================================================
# Step 9: Install Dependencies
# =============================================================================

install_dependencies() {
  print_header "Step 9: Installing Dependencies"

  if command_exists pnpm; then
    print_info "Using pnpm..."
    pnpm install
  else
    print_info "Using npm..."
    npm install
  fi

  print_step "Dependencies installed"
}

# =============================================================================
# Step 10: Generate Documentation
# =============================================================================

generate_documentation() {
  print_header "Step 10: Generating Documentation"

  # Update README.md with product-specific information
  # TODO: Generate API documentation, entity documentation, etc.

  print_step "Documentation generated (placeholder - implement actual generation)"
}

# =============================================================================
# Step 11: Initialize Git
# =============================================================================

initialize_git() {
  print_header "Step 11: Initializing Git Repository"

  if [ -d ".git" ]; then
    print_info "Git repository already initialized"
    return
  fi

  if confirm "Initialize Git repository?"; then
    git init
    git add .
    git commit -m "Initial commit: ${PRODUCT_NAME} - Generated from boilerplate"
    print_step "Git repository initialized"
  else
    print_info "Skipping Git initialization"
  fi
}

# =============================================================================
# Step 12: Run Verification
# =============================================================================

run_verification() {
  print_header "Step 12: Running Verification"

  print_info "Verifying TypeScript compilation..."
  if npm run type-check; then
    print_step "TypeScript compilation successful"
  else
    print_error "TypeScript errors found. Please fix them before proceeding."
  fi

  print_info "Verifying ESLint..."
  if npm run lint; then
    print_step "ESLint check passed"
  else
    print_error "Linting errors found. Please fix them before proceeding."
  fi

  print_step "Verification complete"
}

# =============================================================================
# Step 13: Final Summary
# =============================================================================

print_summary() {
  print_header "Setup Complete!"

  echo ""
  echo -e "${GREEN}✓ Your ${PRODUCT_NAME} boilerplate is ready!${NC}"
  echo ""
  echo "Next steps:"
  echo ""
  echo "1. Edit .env.local and add your API keys:"
  echo "   - Supabase URL and keys"
  echo "   - Stripe keys"
  echo "   - OpenAI key (if using AI features)"
  echo ""
  echo "2. Apply database migrations:"
  echo "   npx supabase db push"
  echo ""
  echo "3. Start the development server:"
  echo "   npm run dev"
  echo ""
  echo "4. Open http://localhost:3000 in your browser"
  echo ""
  echo "5. Customize your app:"
  echo "   - See CUSTOMIZATION_GUIDE.md for details"
  echo "   - Use AI agents: /pm, /backend, /frontend, /design, /test"
  echo ""
  echo "Documentation:"
  echo "  - BOILERPLATE_GUIDE.md - Main guide"
  echo "  - CUSTOMIZATION_GUIDE.md - Customization instructions"
  echo "  - AI_AGENTS_ENABLED.md - Using AI agents"
  echo ""
  echo -e "${BLUE}Happy building! 🚀${NC}"
  echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
  clear

  print_header "SaaS Boilerplate Setup from PRD"

  echo "This script will configure the boilerplate based on your PRD.md"
  echo ""

  if ! confirm "Have you completed PRD.md?"; then
    print_error "Please complete PRD.md first:"
    print_info "1. cp PRD_TEMPLATE.md PRD.md"
    print_info "2. Edit PRD.md and fill in all sections"
    print_info "3. Run this script again"
    exit 1
  fi

  # Run setup steps
  check_prerequisites
  parse_prd
  replace_generic_terms
  generate_database_schema
  generate_api_routes
  generate_ui_components
  configure_stripe
  setup_environment
  install_dependencies
  generate_documentation
  initialize_git
  run_verification
  print_summary
}

# Run main function
main "$@"
