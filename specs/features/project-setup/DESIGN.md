# Feature 1.1: Project Setup - Technical Design Document

**Feature ID**: 1.1
**Phase**: Phase 1 - Foundation
**Status**: Design Complete
**Created**: January 2025
**Designer**: Claude Code Agent

---

## 📋 Overview

This document provides implementation-ready technical specifications for initializing the Radiology Reporting App with Next.js 14+, TypeScript strict mode, automated code quality tooling, and Git workflow automation. Every configuration file, script, and command is provided in complete, production-ready form.

### Purpose

Establish the foundational infrastructure that all subsequent features depend on:
- Working Next.js 14+ development environment with App Router
- Strict TypeScript configuration (100% type coverage)
- Automated code quality enforcement (ESLint + Prettier)
- Git hooks for quality gates and credential protection
- Organized folder structure following project architecture

### Success Criteria

- `npm run dev` starts successfully in < 10 seconds
- `npm run build` completes successfully in < 2 minutes
- `npm run type-check` passes with 0 errors
- `npm run lint` passes with 0 errors
- All Git hooks functional and tested
- 100% TypeScript strict mode compliance

---

## 🗂️ Complete Configuration Files

### 1. tsconfig.json

**Purpose**: Configure TypeScript with strict mode and Next.js optimizations

**Location**: `/tsconfig.json`

```json
{
  "compilerOptions": {
    // Strict Type Checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    // Module Resolution
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,

    // Next.js Specific
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],

    // Path Mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },

    // Additional Checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,

    // Output
    "allowJs": false,
    "skipLibCheck": true
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "out",
    "dist"
  ]
}
```

**Validation**:
```bash
npx tsc --noEmit
# Expected output: "✓ Compiled successfully" with no errors
```

---

### 2. .eslintrc.json

**Purpose**: Configure ESLint with Next.js, TypeScript, and Prettier rules

**Location**: `/.eslintrc.json`

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    // TypeScript Specific
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",

    // General Rules
    "no-console": [
      "warn",
      {
        "allow": ["warn", "error"]
      }
    ],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  },
  "ignorePatterns": [
    "node_modules/",
    ".next/",
    "out/",
    "dist/",
    "build/"
  ]
}
```

**Validation**:
```bash
npm run lint
# Expected output: "✓ No ESLint warnings or errors"
```

---

### 3. .prettierrc

**Purpose**: Configure Prettier for consistent code formatting

**Location**: `/.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "proseWrap": "preserve"
}
```

**Companion File**: `.prettierignore`

**Location**: `/.prettierignore`

```
# Dependencies
node_modules/

# Build outputs
.next/
out/
dist/
build/

# Lock files
package-lock.json
pnpm-lock.yaml
yarn.lock

# Environment files
.env*

# Logs
*.log
```

**Validation**:
```bash
npm run format:check
# Expected output: "All matched files use Prettier code style!"
```

---

### 4. next.config.js

**Purpose**: Configure Next.js with security headers and optimizations

**Location**: `/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for development
  reactStrictMode: true,

  // Experimental features
  experimental: {
    serverActions: true,
    typedRoutes: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Output
  output: 'standalone',
};

module.exports = nextConfig;
```

**Validation**:
```bash
npm run build
# Should complete without warnings about configuration
```

---

### 5. tailwind.config.js

**Purpose**: Configure Tailwind CSS with custom theme

**Location**: `/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

**Companion File**: `postcss.config.js`

**Location**: `/postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

### 6. package.json

**Purpose**: Define project dependencies and scripts

**Location**: `/package.json`

```json
{
  "name": "radiology-reporting-app",
  "version": "0.1.0",
  "private": true,
  "description": "AI-powered radiology reporting application with Next.js 14+",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,css}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "prepare": "husky install",
    "clean": "rm -rf .next out dist node_modules/.cache"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.3.3"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.7",
    "@tailwindcss/typography": "^0.5.10",
    "@types/node": "^20.11.5",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@typescript-eslint/eslint-plugin": "^6.19.1",
    "@typescript-eslint/parser": "^6.19.1",
    "@commitlint/cli": "^18.6.0",
    "@commitlint/config-conventional": "^18.6.0",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.1.0",
    "eslint-config-prettier": "^9.1.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "postcss": "^8.4.33",
    "prettier": "^3.2.4",
    "tailwindcss": "^3.4.1",
    "vitest": "^1.2.1"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

**Installation Commands**:
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

---

### 7. .env.example

**Purpose**: Template for environment variables (no actual values)

**Location**: `/.env.example`

```bash
# =============================================================================
# ENVIRONMENT VARIABLES TEMPLATE
# =============================================================================
# Copy this file to .env.local and fill in actual values
# NEVER commit .env.local or any file containing real credentials
# =============================================================================

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# -----------------------------------------------------------------------------
# Supabase Configuration (Feature 1.3)
# -----------------------------------------------------------------------------
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# -----------------------------------------------------------------------------
# OpenAI Configuration (Feature 2.2)
# -----------------------------------------------------------------------------
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=

# -----------------------------------------------------------------------------
# Stripe Configuration (Feature 1.5)
# -----------------------------------------------------------------------------
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# -----------------------------------------------------------------------------
# Optional Services
# -----------------------------------------------------------------------------
# Deepgram API (optional transcription alternative)
DEEPGRAM_API_KEY=

# Google Custom Search (optional)
GOOGLE_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=

# Sentry (optional error tracking)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# -----------------------------------------------------------------------------
# Development Only
# -----------------------------------------------------------------------------
# Set to 'true' to enable debug logging
DEBUG=false
```

**Companion File**: `.gitignore`

**Location**: `/.gitignore`

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
dist/
build/

# Production
*.tsbuildinfo

# Environment Variables (NEVER COMMIT)
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
credentials.env
secrets.env
*.env.backup

# Vercel
.vercel

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local dev
.DS_Store
*.pem
*.key
*.p12
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Temporary
tmp/
temp/
*.tmp
```

---

## 🪝 Git Hooks Implementation

### Husky Installation & Configuration

**Step 1**: Install Husky

```bash
npm install --save-dev husky
npx husky install
```

**Step 2**: Create `.husky/` directory structure

```bash
mkdir -p .husky
```

**Step 3**: Configure `package.json` prepare script

Already included in package.json above:
```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

---

### Git Hook 1: Pre-commit Hook

**Purpose**: Prevent committing credentials, run linting on staged files

**Location**: `.husky/pre-commit`

```bash
#!/usr/bin/env bash
# Pre-commit hook for Radiology Reporting App
# Prevents committing sensitive files and ensures code quality

# Exit on error
set -e

# ANSI color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Running pre-commit checks...${NC}"

# =============================================================================
# CHECK 1: Prevent committing forbidden files
# =============================================================================
echo -e "${YELLOW}[1/3] Checking for forbidden files...${NC}"

FORBIDDEN_FILES=(
  "credentials.env"
  "secrets.env"
  ".env"
  ".env.local"
  ".env.development.local"
  ".env.test.local"
  ".env.production.local"
  "*.pem"
  "*.key"
  "*.p12"
)

for pattern in "${FORBIDDEN_FILES[@]}"; do
  if git diff --cached --name-only | grep -qE "$pattern"; then
    echo -e "${RED}ERROR: Attempting to commit forbidden file matching pattern: $pattern${NC}"
    echo -e "${RED}These files must NEVER be committed to version control.${NC}"
    echo ""
    echo "To fix this:"
    echo "  1. Remove the file from staging: git reset HEAD <file>"
    echo "  2. Add it to .gitignore if not already present"
    echo "  3. Store credentials in .env.local or environment variables"
    exit 1
  fi
done

echo -e "${GREEN}✓ No forbidden files detected${NC}"

# =============================================================================
# CHECK 2: Scan for hardcoded credentials in staged files
# =============================================================================
echo -e "${YELLOW}[2/3] Scanning for hardcoded credentials...${NC}"

CREDENTIAL_PATTERNS=(
  "api_key\s*=\s*['\"][^'\"]+['\"]"
  "apikey\s*=\s*['\"][^'\"]+['\"]"
  "API_KEY\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "SECRET\s*=\s*['\"][^'\"]+['\"]"
  "password\s*=\s*['\"][^'\"]+['\"]"
  "PASSWORD\s*=\s*['\"][^'\"]+['\"]"
  "token\s*=\s*['\"][^'\"]+['\"]"
  "TOKEN\s*=\s*['\"][^'\"]+['\"]"
  "sk_live_"
  "sk_test_"
  "pk_live_"
  "pk_test_"
  "AIzaSy"
  "-----BEGIN.*PRIVATE KEY-----"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|json)$' || true)

if [ -n "$STAGED_FILES" ]; then
  for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    # Skip checking .env.example files
    MATCHES=$(echo "$STAGED_FILES" | grep -v ".env.example" | xargs grep -nE "$pattern" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
      echo -e "${RED}ERROR: Potential hardcoded credential detected!${NC}"
      echo "$MATCHES"
      echo ""
      echo -e "${RED}Never commit API keys, secrets, tokens, or passwords.${NC}"
      echo "Store them in .env.local or environment variables instead."
      exit 1
    fi
  done
fi

echo -e "${GREEN}✓ No hardcoded credentials detected${NC}"

# =============================================================================
# CHECK 3: Run lint-staged
# =============================================================================
echo -e "${YELLOW}[3/3] Running linters on staged files...${NC}"

npx lint-staged

echo -e "${GREEN}✓ All pre-commit checks passed!${NC}"
exit 0
```

**Make executable**:
```bash
chmod +x .husky/pre-commit
```

**Test the hook**:
```bash
# Test 1: Try to commit a forbidden file
echo "test" > credentials.env
git add credentials.env
git commit -m "test: Should be blocked"
# Expected: Hook blocks commit with error message

# Test 2: Try to commit hardcoded API key
echo 'const key = "sk_live_12345";' > test.ts
git add test.ts
git commit -m "test: Should be blocked"
# Expected: Hook blocks commit with credential warning

# Cleanup
rm -f credentials.env test.ts
git reset HEAD
```

---

### Git Hook 2: Commit Message Hook

**Purpose**: Enforce conventional commit format

**Location**: `.husky/commit-msg`

```bash
#!/usr/bin/env bash
# Commit-msg hook for Radiology Reporting App
# Validates commit messages follow conventional commits format

# Exit on error
set -e

# ANSI color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

echo -e "${YELLOW}Validating commit message format...${NC}"

# Allow merge and revert commits
if echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert)"; then
  echo -e "${GREEN}✓ Merge/Revert commit - validation skipped${NC}"
  exit 0
fi

# Conventional commit pattern:
# type(scope): subject
#
# type: feat, fix, docs, style, refactor, test, chore, perf, ci, build
# scope: optional, any word
# subject: at least 10 characters
PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .{10,}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo -e "${RED}ERROR: Invalid commit message format${NC}"
  echo ""
  echo "Commit message must follow conventional commits format:"
  echo ""
  echo "  <type>(<scope>): <subject>"
  echo ""
  echo "Types:"
  echo "  feat     - New feature"
  echo "  fix      - Bug fix"
  echo "  docs     - Documentation changes"
  echo "  style    - Code formatting (no logic changes)"
  echo "  refactor - Code refactoring"
  echo "  test     - Adding or updating tests"
  echo "  chore    - Maintenance tasks"
  echo "  perf     - Performance improvements"
  echo "  ci       - CI/CD changes"
  echo "  build    - Build system changes"
  echo ""
  echo "Scope (optional but recommended):"
  echo "  auth, database, api, ui, transcription, reports, templates, billing, etc."
  echo ""
  echo "Subject:"
  echo "  - Must be at least 10 characters"
  echo "  - Use imperative mood (\"Add feature\" not \"Added feature\")"
  echo "  - No period at the end"
  echo ""
  echo "Examples:"
  echo "  feat(auth): Implement Supabase authentication flow"
  echo "  fix(api): Handle OpenAI rate limiting errors"
  echo "  docs: Update Git workflow documentation"
  echo "  test(reports): Add unit tests for report generator"
  echo ""
  echo "Your commit message:"
  echo "  $COMMIT_MSG"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓ Commit message format is valid${NC}"
exit 0
```

**Make executable**:
```bash
chmod +x .husky/commit-msg
```

**Test the hook**:
```bash
# Test 1: Invalid format (too short)
git commit --allow-empty -m "fix bug"
# Expected: Hook blocks with error message

# Test 2: Invalid format (wrong type)
git commit --allow-empty -m "fixed: something"
# Expected: Hook blocks with error message

# Test 3: Valid format
git commit --allow-empty -m "feat(setup): Initialize Next.js project with TypeScript"
# Expected: Commit succeeds

# Cleanup
git reset HEAD~1
```

---

### Commitlint Configuration

**Purpose**: Additional commit message validation

**Location**: `.commitlintrc.js`

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'ci',
        'build',
      ],
    ],
    'subject-min-length': [2, 'always', 10],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
```

---

## 📁 Folder Structure

### Complete Directory Tree

```
radiology-reporting-app/
├── .github/                          # GitHub configuration
│   └── workflows/                    # CI/CD workflows (future)
│       └── .gitkeep
│
├── .husky/                           # Git hooks
│   ├── pre-commit                    # Pre-commit validation
│   └── commit-msg                    # Commit message validation
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (created by Next.js)
│   ├── page.tsx                      # Home page (created by Next.js)
│   ├── globals.css                   # Global styles (created by Next.js)
│   ├── (auth)/                       # Public auth routes (future)
│   │   └── .gitkeep
│   ├── (dashboard)/                  # Protected dashboard routes (future)
│   │   └── .gitkeep
│   └── api/                          # API routes (future)
│       └── .gitkeep
│
├── components/                       # React components
│   ├── ui/                          # Base UI components (future)
│   │   └── .gitkeep
│   ├── audio/                       # Audio components (future)
│   │   └── .gitkeep
│   ├── templates/                   # Template components (future)
│   │   └── .gitkeep
│   ├── reports/                     # Report components (future)
│   │   └── .gitkeep
│   └── chatkit/                     # ChatKit components (future)
│       └── .gitkeep
│
├── lib/                              # Core business logic
│   ├── auth/                        # Authentication (future)
│   │   └── .gitkeep
│   ├── ai/                          # AI services (future)
│   │   └── .gitkeep
│   ├── transcription/               # Transcription services (future)
│   │   └── .gitkeep
│   ├── templates/                   # Template services (future)
│   │   └── .gitkeep
│   ├── reports/                     # Report services (future)
│   │   └── .gitkeep
│   ├── billing/                     # Stripe integration (future)
│   │   └── .gitkeep
│   ├── database/                    # Supabase client (future)
│   │   └── .gitkeep
│   └── utils/                       # Utilities (future)
│       └── .gitkeep
│
├── types/                            # TypeScript type definitions
│   └── .gitkeep
│
├── hooks/                            # Custom React hooks
│   └── .gitkeep
│
├── tests/                            # Test suites
│   ├── unit/                        # Unit tests (future)
│   │   └── .gitkeep
│   ├── integration/                 # Integration tests (future)
│   │   └── .gitkeep
│   └── e2e/                         # End-to-end tests (future)
│       └── .gitkeep
│
├── public/                           # Static assets
│   ├── favicon.ico
│   └── images/
│       └── .gitkeep
│
├── docs/                             # Documentation (existing)
│   ├── 00-PROJECT/
│   ├── 01-ARCHITECTURE/
│   ├── 02-DESIGN/
│   ├── 03-IMPLEMENTATION/
│   └── 04-PROCESSES/
│
├── specs/                            # Feature specifications (existing)
│   └── features/
│       └── project-setup/
│           ├── SPEC.md
│           ├── ACCEPTANCE.md
│           └── DESIGN.md            # This file
│
├── .next/                            # Next.js build output (gitignored)
├── node_modules/                     # Dependencies (gitignored)
├── .env.local                        # Local environment (gitignored)
│
├── .commitlintrc.js                  # Commitlint configuration
├── .eslintrc.json                    # ESLint configuration
├── .gitignore                        # Git ignore rules
├── .prettierrc                       # Prettier configuration
├── .prettierignore                   # Prettier ignore rules
├── next.config.js                    # Next.js configuration
├── package.json                      # Dependencies and scripts
├── postcss.config.js                 # PostCSS configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── .env.example                      # Environment template
├── README.md                         # Project README
└── vitest.config.ts                  # Vitest configuration (future)
```

---

## 🚀 Implementation Procedure

### Prerequisites

- macOS, Linux, or Windows with WSL2
- Node.js 18+ installed
- npm 9+ installed
- Git installed and configured
- Terminal/command line access

**Verify prerequisites**:
```bash
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 9.0.0
git --version     # Should be >= 2.0.0
```

---

### Step-by-Step Implementation

#### Phase 1: Initialize Next.js Project

**Step 1.1**: Create Next.js application

```bash
# Navigate to project directory parent
cd /Users/anand

# Initialize Next.js project
npx create-next-app@latest radiology-reporting-app \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-git

# Move into project directory
cd radiology-reporting-app
```

**Expected Output**:
```
✔ Creating a new Next.js app in /Users/anand/radiology-reporting-app
✔ Installing dependencies...
✔ Initialized a git repository.

Success! Created radiology-reporting-app at /Users/anand/radiology-reporting-app
```

**Verification**:
```bash
# Check directory structure
ls -la

# Should see:
# - app/
# - public/
# - package.json
# - tsconfig.json
# - next.config.js
# - tailwind.config.js
```

---

#### Phase 2: Configure TypeScript Strict Mode

**Step 2.1**: Replace tsconfig.json

```bash
# Backup original
mv tsconfig.json tsconfig.json.backup

# Create new tsconfig.json with strict configuration
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": false,
    "skipLibCheck": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out", "dist"]
}
EOF
```

**Step 2.2**: Verify TypeScript configuration

```bash
# Run type checking
npx tsc --noEmit
```

**Expected Output**:
```
✓ Compiled successfully
```

**If errors occur**: Fix any type errors in generated files before proceeding.

---

#### Phase 3: Configure ESLint and Prettier

**Step 3.1**: Install additional ESLint and Prettier packages

```bash
npm install --save-dev \
  @typescript-eslint/eslint-plugin@latest \
  @typescript-eslint/parser@latest \
  prettier@latest \
  eslint-config-prettier@latest
```

**Step 3.2**: Create ESLint configuration

```bash
# Backup original
mv .eslintrc.json .eslintrc.json.backup

# Create new .eslintrc.json
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-floating-promises": "error",
    "@typescript-eslint/await-thenable": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "prefer-const": "error",
    "no-var": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"]
  },
  "ignorePatterns": ["node_modules/", ".next/", "out/", "dist/", "build/"]
}
EOF
```

**Step 3.3**: Create Prettier configuration

```bash
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "proseWrap": "preserve"
}
EOF

cat > .prettierignore << 'EOF'
node_modules/
.next/
out/
dist/
build/
package-lock.json
pnpm-lock.yaml
yarn.lock
.env*
*.log
EOF
```

**Step 3.4**: Update package.json scripts

```bash
# Add scripts to package.json
npm pkg set scripts.lint:fix="next lint --fix"
npm pkg set scripts.type-check="tsc --noEmit"
npm pkg set scripts.format="prettier --write \"**/*.{ts,tsx,js,jsx,json,md,css}\""
npm pkg set scripts.format:check="prettier --check \"**/*.{ts,tsx,js,jsx,json,md,css}\""
npm pkg set scripts.clean="rm -rf .next out dist node_modules/.cache"
```

**Step 3.5**: Verify linting and formatting

```bash
# Run linting
npm run lint

# Run formatting check
npm run format:check

# Fix any issues
npm run lint:fix
npm run format
```

**Expected Output**:
```
✓ No ESLint warnings or errors
All matched files use Prettier code style!
```

---

#### Phase 4: Install and Configure Git Hooks

**Step 4.1**: Install Husky and related packages

```bash
npm install --save-dev \
  husky@latest \
  lint-staged@latest \
  @commitlint/cli@latest \
  @commitlint/config-conventional@latest
```

**Step 4.2**: Initialize Husky

```bash
# Initialize Husky
npx husky install

# Add prepare script to package.json
npm pkg set scripts.prepare="husky install"
```

**Step 4.3**: Create pre-commit hook

```bash
# Create hook file
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env bash
# Pre-commit hook for Radiology Reporting App

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Running pre-commit checks...${NC}"

echo -e "${YELLOW}[1/3] Checking for forbidden files...${NC}"

FORBIDDEN_FILES=(
  "credentials.env"
  "secrets.env"
  ".env"
  ".env.local"
  ".env.development.local"
  ".env.test.local"
  ".env.production.local"
  "*.pem"
  "*.key"
  "*.p12"
)

for pattern in "${FORBIDDEN_FILES[@]}"; do
  if git diff --cached --name-only | grep -qE "$pattern"; then
    echo -e "${RED}ERROR: Attempting to commit forbidden file: $pattern${NC}"
    exit 1
  fi
done

echo -e "${GREEN}✓ No forbidden files detected${NC}"

echo -e "${YELLOW}[2/3] Scanning for hardcoded credentials...${NC}"

CREDENTIAL_PATTERNS=(
  "api_key\s*=\s*['\"][^'\"]+['\"]"
  "API_KEY\s*=\s*['\"][^'\"]+['\"]"
  "secret\s*=\s*['\"][^'\"]+['\"]"
  "SECRET\s*=\s*['\"][^'\"]+['\"]"
  "sk_live_"
  "sk_test_"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' || true)

if [ -n "$STAGED_FILES" ]; then
  for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    MATCHES=$(echo "$STAGED_FILES" | grep -v ".env.example" | xargs grep -nE "$pattern" 2>/dev/null || true)
    if [ -n "$MATCHES" ]; then
      echo -e "${RED}ERROR: Potential hardcoded credential detected!${NC}"
      echo "$MATCHES"
      exit 1
    fi
  done
fi

echo -e "${GREEN}✓ No hardcoded credentials detected${NC}"

echo -e "${YELLOW}[3/3] Running linters on staged files...${NC}"

npx lint-staged

echo -e "${GREEN}✓ All pre-commit checks passed!${NC}"
exit 0
EOF

# Make executable
chmod +x .husky/pre-commit
```

**Step 4.4**: Create commit-msg hook

```bash
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env bash
# Commit-msg hook for Radiology Reporting App

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

if echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert)"; then
  exit 0
fi

PATTERN="^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(\(.+\))?: .{10,}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo -e "${RED}ERROR: Invalid commit message format${NC}"
  echo ""
  echo "Format: <type>(<scope>): <subject>"
  echo "Example: feat(auth): Implement Supabase authentication flow"
  exit 1
fi

exit 0
EOF

# Make executable
chmod +x .husky/commit-msg
```

**Step 4.5**: Configure lint-staged

```bash
# Add lint-staged configuration to package.json
npm pkg set lint-staged='{"*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"], "*.{json,md,css}": ["prettier --write"]}'
```

**Step 4.6**: Create commitlint configuration

```bash
cat > .commitlintrc.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf', 'ci', 'build'],
    ],
    'subject-min-length': [2, 'always', 10],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
};
EOF
```

---

#### Phase 5: Create Folder Structure

**Step 5.1**: Create placeholder directories with .gitkeep files

```bash
# Create directory structure
mkdir -p app/\(auth\)
mkdir -p app/\(dashboard\)
mkdir -p app/api
mkdir -p components/{ui,audio,templates,reports,chatkit}
mkdir -p lib/{auth,ai,transcription,templates,reports,billing,database,utils}
mkdir -p types
mkdir -p hooks
mkdir -p tests/{unit,integration,e2e}
mkdir -p public/images
mkdir -p .github/workflows

# Create .gitkeep files
find app/\(auth\) app/\(dashboard\) app/api components lib types hooks tests public/images .github/workflows -type d -empty -exec touch {}/.gitkeep \;
```

**Step 5.2**: Verify folder structure

```bash
# Check directories created
tree -L 3 -a
# Or if tree not installed:
find . -type d -maxdepth 3 | sort
```

---

#### Phase 6: Create Environment Configuration

**Step 6.1**: Create .env.example

```bash
cat > .env.example << 'EOF'
# =============================================================================
# ENVIRONMENT VARIABLES TEMPLATE
# =============================================================================

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Supabase (Feature 1.3)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (Feature 2.2)
OPENAI_API_KEY=

# Stripe (Feature 1.5)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Optional Services
DEEPGRAM_API_KEY=
GOOGLE_API_KEY=
GOOGLE_SEARCH_ENGINE_ID=
NEXT_PUBLIC_SENTRY_DSN=

# Development
DEBUG=false
EOF
```

**Step 6.2**: Create .env.local for local development

```bash
cat > .env.local << 'EOF'
# Local development environment variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF

# Verify .env.local is gitignored
git check-ignore .env.local
# Should output: .env.local
```

---

#### Phase 7: Update Configuration Files

**Step 7.1**: Update next.config.js

```bash
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
};

module.exports = nextConfig;
EOF
```

**Step 7.2**: Update tailwind.config.js

```bash
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [],
};
EOF
```

**Step 7.3**: Install Tailwind plugins

```bash
npm install --save-dev @tailwindcss/forms@latest @tailwindcss/typography@latest
```

**Step 7.4**: Update tailwind.config.js with plugins

```bash
# Add plugins to tailwind config
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
EOF
```

---

#### Phase 8: Install Vitest for Testing

**Step 8.1**: Install Vitest

```bash
npm install --save-dev vitest@latest @vitest/ui@latest
```

**Step 8.2**: Update test script in package.json

```bash
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.test:coverage="vitest run --coverage"
```

---

#### Phase 9: Verification and Testing

**Step 9.1**: Clean and reinstall dependencies

```bash
# Clean build artifacts
npm run clean

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Step 9.2**: Run all verification checks

```bash
echo "=== Type Checking ==="
npm run type-check

echo ""
echo "=== Linting ==="
npm run lint

echo ""
echo "=== Formatting Check ==="
npm run format:check

echo ""
echo "=== Development Server Test ==="
timeout 30s npm run dev || true

echo ""
echo "=== Production Build Test ==="
npm run build
```

**Step 9.3**: Test Git hooks

```bash
# Test pre-commit hook
echo "test" > credentials.env
git add credentials.env
git commit -m "test: Should be blocked" || echo "✓ Pre-commit hook working"
rm credentials.env
git reset HEAD

# Test commit-msg hook
git commit --allow-empty -m "bad message" || echo "✓ Commit-msg hook working"
git commit --allow-empty -m "feat(setup): Test valid commit message"
git reset HEAD~1
```

---

#### Phase 10: Initial Git Commit

**Step 10.1**: Initialize Git repository (if not already)

```bash
# Check if .git exists
if [ ! -d .git ]; then
  git init
  git branch -M master
fi
```

**Step 10.2**: Stage all files

```bash
# Check what will be committed
git status

# Stage all files
git add .
```

**Step 10.3**: Create initial commit

```bash
git commit -m "chore: Initialize Next.js 14 project with TypeScript strict mode

- Next.js 14.1.0 with App Router
- TypeScript 5.3+ with strict mode enabled
- ESLint + Prettier configured
- Git hooks (pre-commit + commit-msg) with Husky
- Folder structure following architecture
- Environment variable template
- Tailwind CSS with plugins
- All quality gates configured"
```

**Step 10.4**: Create feature branch (if not already on one)

```bash
# Create and checkout feature branch
git checkout -b feature/1.1-project-setup
```

---

## ✅ Validation Steps

### Validation 1: Development Server

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
# Expected: Next.js welcome page displays
# Expected: No console errors
# Expected: Server started in < 10 seconds

# Stop server: Ctrl+C
```

**Success Criteria**:
- Server starts without errors
- Page loads in browser
- HMR (Hot Module Replacement) works when editing files

---

### Validation 2: TypeScript Strict Mode

```bash
# Run type checking
npm run type-check

# Expected output: "✓ Compiled successfully"
```

**Success Criteria**:
- No type errors
- All strict mode flags enforced
- Path aliases work (@/* imports)

---

### Validation 3: ESLint and Prettier

```bash
# Run linting
npm run lint

# Expected output: "✓ No ESLint warnings or errors"

# Run formatting check
npm run format:check

# Expected output: "All matched files use Prettier code style!"
```

**Success Criteria**:
- No linting errors
- No formatting violations
- Custom rules enforced

---

### Validation 4: Git Hooks

**Test 4.1**: Pre-commit hook blocks credentials

```bash
# Create forbidden file
echo "TEST=secret" > credentials.env
git add credentials.env
git commit -m "test: Attempt forbidden file"

# Expected: Commit blocked with error message
# Cleanup
rm credentials.env
git reset HEAD
```

**Test 4.2**: Pre-commit hook detects hardcoded secrets

```bash
# Create file with API key
echo 'const key = "sk_live_12345";' > test.ts
git add test.ts
git commit -m "test: Attempt hardcoded secret"

# Expected: Commit blocked with credential warning
# Cleanup
rm test.ts
git reset HEAD
```

**Test 4.3**: Commit-msg hook validates format

```bash
# Invalid message (too short)
git commit --allow-empty -m "fix bug"
# Expected: Blocked

# Invalid message (wrong type)
git commit --allow-empty -m "fixed: something"
# Expected: Blocked

# Valid message
git commit --allow-empty -m "feat(setup): Test commit message validation"
# Expected: Success

# Cleanup
git reset HEAD~1
```

**Success Criteria**:
- Pre-commit blocks forbidden files
- Pre-commit detects hardcoded credentials
- Commit-msg validates conventional format
- Valid commits succeed

---

### Validation 5: Folder Structure

```bash
# Check folder structure
ls -la app/ components/ lib/ types/ hooks/ tests/

# Check .gitkeep files
find . -name ".gitkeep" -type f

# Expected: All required folders exist with .gitkeep
```

**Success Criteria**:
- All folders from architecture present
- Empty folders tracked via .gitkeep
- .gitignore properly excludes build artifacts

---

### Validation 6: Production Build

```bash
# Run production build
npm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Build completed in < 2 minutes
# ✓ .next directory created

# Check build artifacts
ls -la .next/
```

**Success Criteria**:
- Build completes successfully
- No build errors or warnings
- .next directory contains build artifacts
- Build time < 2 minutes

---

### Validation 7: Dependencies

```bash
# List installed dependencies
npm list --depth=0

# Verify critical packages
npm list next react typescript tailwindcss eslint prettier husky

# Expected: All packages installed with correct versions
```

**Success Criteria**:
- All required dependencies installed
- Versions meet minimum requirements
- No missing peer dependencies

---

## 🔧 Error Handling

### Common Issues and Solutions

#### Issue 1: TypeScript Errors After Strict Mode

**Symptom**: `npm run type-check` fails with type errors

**Solution**:
```bash
# Identify errors
npm run type-check

# Common fixes:
# 1. Add type annotations to function parameters
# 2. Handle null/undefined cases explicitly
# 3. Use type assertions sparingly (as Type)
# 4. Add proper return types

# If errors are in generated Next.js files:
rm -rf .next
npm run dev
# Wait for Next.js to regenerate types
npm run type-check
```

---

#### Issue 2: ESLint Configuration Errors

**Symptom**: `npm run lint` fails to start or shows config errors

**Solution**:
```bash
# Clear ESLint cache
rm -rf .next .eslintcache

# Reinstall ESLint dependencies
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Verify configuration
npx eslint --print-config .eslintrc.json

# Run lint again
npm run lint
```

---

#### Issue 3: Git Hooks Not Executing

**Symptom**: Commits succeed even with invalid messages or forbidden files

**Solution**:
```bash
# Check hook files exist
ls -la .husky/

# Verify hooks are executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg

# Reinstall Husky
rm -rf .husky
npx husky install
# Recreate hooks (see Phase 4)

# Test hooks manually
.husky/pre-commit
# Should execute without errors
```

---

#### Issue 4: Module Not Found Errors

**Symptom**: Import errors with @/* paths

**Solution**:
```bash
# Verify tsconfig.json paths configuration
cat tsconfig.json | grep -A 5 "paths"

# Should show:
# "paths": {
#   "@/*": ["./*"]
# }

# If missing, add to tsconfig.json
# Restart TypeScript server in editor
# Restart development server
npm run dev
```

---

#### Issue 5: Next.js Build Failures

**Symptom**: `npm run build` fails

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint

# Rebuild
npm run build

# If still failing, check Node.js version
node --version
# Should be >= 18.0.0

# Update dependencies
npm update
npm run build
```

---

#### Issue 6: Husky Not Initializing

**Symptom**: `.husky/` directory not created

**Solution**:
```bash
# Ensure Git repository initialized
git status

# If not initialized:
git init

# Install Husky
npm install --save-dev husky
npx husky install

# Add prepare script
npm pkg set scripts.prepare="husky install"

# Run prepare
npm run prepare

# Verify .husky/ created
ls -la .husky/
```

---

#### Issue 7: Prettier Conflicts with ESLint

**Symptom**: Files formatted by Prettier cause ESLint errors

**Solution**:
```bash
# Verify eslint-config-prettier installed
npm list eslint-config-prettier

# If not installed:
npm install --save-dev eslint-config-prettier

# Ensure "prettier" is LAST in extends array in .eslintrc.json
# "extends": [..., "prettier"]

# Format all files
npm run format

# Run lint
npm run lint
```

---

## 📊 Performance Benchmarks

### Expected Performance

| Metric | Target | Measurement Command |
|--------|--------|---------------------|
| Dev server startup | < 10s | `time npm run dev` |
| Type checking | < 30s | `time npm run type-check` |
| Linting | < 15s | `time npm run lint` |
| Formatting check | < 10s | `time npm run format:check` |
| Production build | < 2min | `time npm run build` |
| Git pre-commit hook | < 10s | Time during commit |

### Measuring Performance

```bash
# Measure dev server startup
time npm run dev &
DEV_PID=$!
sleep 10
kill $DEV_PID

# Measure type checking
time npm run type-check

# Measure linting
time npm run lint

# Measure production build
time npm run build
```

---

## 🎯 Completion Checklist

Before marking Feature 1.1 complete, verify:

### Configuration Files
- [ ] `tsconfig.json` - Strict mode enabled, no errors
- [ ] `.eslintrc.json` - Configured, lint passes
- [ ] `.prettierrc` - Configured, format passes
- [ ] `next.config.js` - Security headers configured
- [ ] `tailwind.config.js` - Plugins installed
- [ ] `package.json` - All scripts working
- [ ] `.env.example` - Template complete

### Git Hooks
- [ ] `.husky/pre-commit` - Blocks credentials, runs linters
- [ ] `.husky/commit-msg` - Validates conventional commits
- [ ] `.commitlintrc.js` - Configuration complete
- [ ] Hooks tested with both valid and invalid inputs

### Folder Structure
- [ ] All required folders created
- [ ] `.gitkeep` files in empty directories
- [ ] `.gitignore` properly excludes artifacts
- [ ] Folder structure matches architecture

### Validation
- [ ] `npm run dev` starts successfully (< 10s)
- [ ] `npm run build` completes successfully (< 2min)
- [ ] `npm run type-check` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run format:check` passes
- [ ] Git hooks functional and tested

### Documentation
- [ ] README.md updated with setup instructions
- [ ] DESIGN.md complete (this file)
- [ ] SPEC.md exists
- [ ] ACCEPTANCE.md exists

### Git Workflow
- [ ] Feature branch created (`feature/1.1-project-setup`)
- [ ] Initial commit made with conventional format
- [ ] Branch pushed to remote
- [ ] No uncommitted changes

---

## 🚀 Next Steps

After completing Feature 1.1:

1. **Mark feature complete**:
   ```bash
   git add .
   git commit -m "feat(setup): Complete Feature 1.1 - Project Setup

   All validation gates passed:
   - Next.js 14.1.0 initialized with App Router
   - TypeScript strict mode configured and passing
   - ESLint + Prettier configured and passing
   - Git hooks (pre-commit + commit-msg) functional
   - Folder structure complete
   - All verification checks passing"

   git push origin feature/1.1-project-setup
   ```

2. **Update documentation**:
   - Mark Feature 1.1 complete in `docs/03-IMPLEMENTATION/STATUS.md`
   - Update project README with setup instructions

3. **Create Pull Request**:
   ```bash
   gh pr create \
     --title "Feature 1.1: Project Setup" \
     --body "Complete Next.js 14 project initialization with TypeScript strict mode, automated quality tooling, and Git workflow automation."
   ```

4. **Proceed to Feature 1.2**: Environment Configuration

---

## 📚 References

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)

### Project Documents
- `specs/features/project-setup/SPEC.md` - Requirements
- `specs/features/project-setup/ACCEPTANCE.md` - Test scenarios
- `docs/00-PROJECT/CONSTRAINTS.md` - Technical constraints
- `docs/01-ARCHITECTURE/BLUEPRINT.md` - Architecture overview
- `docs/04-PROCESSES/GIT-WORKFLOW.md` - Git workflow guide

---

**Document Status**: ✅ Complete and Ready for Implementation
**Created**: January 2025
**Last Updated**: January 2025
**Version**: 1.0
**Reviewed By**: Awaiting User Review
