# Radiology Reporting App

> AI-powered radiology report generation with audio transcription and template integration

[![Status](https://img.shields.io/badge/status-phase--0--pre--development-yellow)]()
[![Stack](https://img.shields.io/badge/stack-Next.js%2014%2B%20|%20Supabase%20|%20Stripe-blue)]()
[![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--5%20|%20Whisper-green)]()

---

## 📋 Quick Links

### 🚀 Getting Started
- **New Contributors**: Start with [Project Overview](#-project-overview)
- **Developers**: See [Development Guide](#-development-guide)
- **Agents**: See [Agent-Driven Workflow](#-agent-driven-workflow)

### 📚 Documentation
- **Project Requirements**: [`docs/00-PROJECT/REQUIREMENTS.md`](docs/00-PROJECT/REQUIREMENTS.md)
- **Technical Constraints**: [`docs/00-PROJECT/CONSTRAINTS.md`](docs/00-PROJECT/CONSTRAINTS.md)
- **Architecture Blueprint**: [`docs/01-ARCHITECTURE/BLUEPRINT.md`](docs/01-ARCHITECTURE/BLUEPRINT.md)
- **Technical Design**: [`docs/02-DESIGN/TECHNICAL.md`](docs/02-DESIGN/TECHNICAL.md)
- **Implementation Status**: [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md)

### 🤖 Agent Configuration
- **Agent Registry**: [`.agents/AGENTS.md`](.agents/AGENTS.md)
- **Project Manager**: [`.agents/project-manager/instructions.md`](.agents/project-manager/instructions.md)
- **Backend Engineer**: [`.agents/backend-engineer/instructions.md`](.agents/backend-engineer/instructions.md)
- **Frontend Engineer**: [`.agents/frontend-engineer/instructions.md`](.agents/frontend-engineer/instructions.md)

---

## 📖 Project Overview

### What is This?

Migration and enhancement of a production radiology reporting application from Node.js/Express to modern Next.js 14+ stack with:

- ✨ **AI-Powered Report Generation**: GPT-5 (fast) and O3 (detailed) modes
- 🎤 **Audio Transcription**: Voice-to-text with spoken punctuation conversion
- 📝 **Smart Templates**: Contradiction-free template integration
- 💳 **Subscription Billing**: Stripe-powered tiered pricing
- 🔐 **Secure Authentication**: Supabase Auth with OAuth support

### Current Status

**Phase**: Pre-Development (Phase 0)
**Progress**: Repository restructured for agent-driven development
**Next Step**: Phase 1 - Foundation & Authentication

See [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for detailed progress tracking.

---

## 🏗️ Architecture

### Technology Stack

```
Frontend:  Next.js 14+ (App Router) + React 18+ + TypeScript 5+ + Tailwind CSS
Backend:   Next.js API Routes + Vercel AI SDK 5
Database:  Supabase (PostgreSQL 15+)
Auth:      Supabase Auth (Email/Password + OAuth)
Billing:   Stripe (Subscriptions + Customer Portal)
AI:        OpenAI (GPT-5, O3, Whisper)
Deploy:    Vercel (Edge Network)
```

### Key Design Decisions

- **Supabase Auth** (not Outseta): Cost savings + full control
- **Stripe Direct** (not third-party): No platform fees
- **Agent-Driven Development**: Specialized agents with gated handoffs
- **Critical Logic Preservation**: Exact migration of business logic

See [`docs/01-ARCHITECTURE/DECISIONS.md`](docs/01-ARCHITECTURE/DECISIONS.md) for detailed ADR.

---

## 🗂️ Repository Structure

```
radiology-ai-app/
├── .agents/                    # Agent configuration & instructions
│   ├── AGENTS.md              # Agent registry and interaction patterns
│   ├── project-manager/       # PM agent instructions
│   ├── requirements-analyst/  # Requirements agent
│   ├── designer/              # Designer agent
│   ├── frontend-engineer/     # Frontend agent
│   ├── backend-engineer/      # Backend agent
│   └── tester/                # Testing agent
│
├── docs/                       # Organized documentation
│   ├── 00-PROJECT/            # Project-level docs
│   │   ├── REQUIREMENTS.md    # Product requirements
│   │   └── CONSTRAINTS.md     # Technical/business constraints
│   ├── 01-ARCHITECTURE/       # Architecture & decisions
│   │   ├── BLUEPRINT.md       # High-level architecture
│   │   ├── DECISIONS.md       # ADR (architectural decisions)
│   │   └── DIAGRAMS.md        # Architecture diagrams
│   ├── 02-DESIGN/             # Technical design
│   │   └── TECHNICAL.md       # Implementation patterns
│   ├── 03-IMPLEMENTATION/     # Implementation tracking
│   │   ├── STATUS.md          # Current progress
│   │   ├── PLAN.md            # Implementation plan
│   │   └── AGENT-TASKS.md     # Agent task assignments (TBD)
│   ├── 04-OPERATIONS/         # Operations & deployment
│   │   └── SETUP.md           # Setup & credentials guide
│   └── 05-INTEGRATIONS/       # External integrations
│       └── STRIPE.md          # Stripe integration guide
│
├── specs/                      # Agent-friendly specifications
│   ├── features/              # Feature specifications
│   │   └── [feature-name]/
│   │       ├── SPEC.md        # Implementation spec
│   │       ├── DESIGN.md      # Technical design
│   │       ├── TEST.md        # Test requirements
│   │       └── ACCEPTANCE.md  # Acceptance criteria
│   └── tasks/                 # Granular task specs
│       └── [TASK-ID].md       # Individual task specification
│
├── workflows/                  # Agent workflow definitions
│   └── feature-development.yaml  # Feature development workflow
│
├── app/                        # Next.js App Router (to be created)
├── components/                 # React components (to be created)
├── lib/                       # Business logic (to be created)
├── types/                     # TypeScript types (to be created)
├── hooks/                     # Custom React hooks (to be created)
├── tests/                     # Test suites (to be created)
│
├── archive/                   # Archived files
├── sample-data/               # Sample test data
└── scripts/                   # Utility scripts
```

---

## 🤖 Agent-Driven Workflow

This project uses an **agent-driven development workflow** with specialized agents and gated handoffs.

### Available Agents

1. **Project Manager**: Orchestrates workflow, validates handoffs
2. **Requirements Analyst**: Gathers and documents requirements
3. **Designer**: Creates technical design and architecture
4. **Frontend Engineer**: Implements UI components
5. **Backend Engineer**: Implements API routes and business logic
6. **Tester**: Creates and executes test suites

### Workflow Stages

```
Requirements → Design → Implementation → Testing → Completion
     ↓            ↓           ↓             ↓           ↓
  [Gate 1]    [Gate 2]    [Gate 3]      [Gate 4]    [Gate 5]
```

Each gate has validation criteria that MUST be met before progression.

### How to Work with Agents

**For Claude Code users**:
```bash
# Activate Project Manager (orchestrator)
/pm

# Or activate specific agents
/requirements   # Requirements Analyst
/design         # Designer
/frontend       # Frontend Engineer
/backend        # Backend Engineer
/test           # Tester
```

**For manual workflow**:
1. Read agent instructions in `.agents/[agent-name]/instructions.md`
2. Follow the workflow defined in `workflows/feature-development.yaml`
3. Validate against handoff checklists before progressing

See [`.agents/AGENTS.md`](.agents/AGENTS.md) for complete agent documentation.

---

## 💻 Development Guide

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Stripe account
- OpenAI API key

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd radiology-ai-app
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp credentials.env.template .env.local
   # Edit .env.local with your credentials
   ```

   See [`docs/04-OPERATIONS/SETUP.md`](docs/04-OPERATIONS/SETUP.md) for detailed setup instructions.

3. **Verify Setup**
   ```bash
   ./scripts/verify-setup.sh
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run type-check       # TypeScript type checking
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues

# Testing
npm run test             # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report

# Database (Supabase)
npx supabase start       # Start local Supabase
npx supabase db reset    # Reset local database
npx supabase db push     # Apply migrations
```

---

## 📊 Project Status

**Current Phase**: Phase 0 - Pre-Development
**Overall Progress**: 0/23 features complete (0%)
**Repository Status**: ✅ Restructured for agent-driven development

### Implementation Phases

| Phase | Status | Features | Est. Time | Progress |
|-------|--------|----------|-----------|----------|
| Phase 1: Foundation | ⏸️ Not Started | 0/7 | 18 hours | ░░░░░░░░░░ 0% |
| Phase 2: Core Features | ⏸️ Not Started | 0/7 | 30 hours | ░░░░░░░░░░ 0% |
| Phase 3: Advanced Features | ⏸️ Not Started | 0/4 | 18 hours | ░░░░░░░░░░ 0% |
| Phase 4: Testing & Launch | ⏸️ Not Started | 0/5 | 22 hours | ░░░░░░░░░░ 0% |
| **TOTAL** | **0%** | **0/23** | **88 hours** | ░░░░░░░░░░ 0% |

See [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for detailed feature breakdown.

---

## 🎯 Critical Requirements

### Must Preserve Exactly

This project requires **exact preservation** of critical business logic from the original application:

1. **Spoken Punctuation Conversion** (`index.js:155-184`)
   - All regex patterns must match exactly
   - "full stop" → ".", "comma" → ",", "new line" → "\n", etc.

2. **Contradiction Cleaning** (`index.js:701-765`)
   - Template integration must not introduce contradictions
   - Organ system keyword mapping must be preserved

3. **Report Generation Prompt** (`report_prompt.txt`)
   - 119 lines must be preserved exactly
   - No modifications to wording or structure

4. **Two-Tier Generation Modes**
   - Espresso: GPT-5, < 10 seconds
   - Slow-Brewed: O3, < 30 seconds, includes literature

See [`docs/00-PROJECT/CONSTRAINTS.md`](docs/00-PROJECT/CONSTRAINTS.md) for complete constraints.

---

## 🧪 Testing Strategy

### Test Pyramid

```
         E2E (10%)           Critical workflows
       /           \
      Integration (30%)      API routes + services
     /               \
    Unit Tests (60%)         Business logic + components
```

### Coverage Requirements

- **Overall**: 80%+ coverage (mandatory)
- **Critical Logic**: 100% coverage (mandatory)
  - `lib/transcription/spoken-punctuation.ts`
  - `lib/ai/contradiction-cleaner.ts`
  - `lib/ai/report-generator.ts`

---

## 📚 Documentation Index

### Project Foundation
- [`docs/00-PROJECT/REQUIREMENTS.md`](docs/00-PROJECT/REQUIREMENTS.md) - Product requirements and user stories
- [`docs/00-PROJECT/CONSTRAINTS.md`](docs/00-PROJECT/CONSTRAINTS.md) - Technical and business constraints

### Architecture & Design
- [`docs/01-ARCHITECTURE/BLUEPRINT.md`](docs/01-ARCHITECTURE/BLUEPRINT.md) - High-level system architecture
- [`docs/01-ARCHITECTURE/DECISIONS.md`](docs/01-ARCHITECTURE/DECISIONS.md) - Architectural Decision Records (ADR)
- [`docs/01-ARCHITECTURE/DIAGRAMS.md`](docs/01-ARCHITECTURE/DIAGRAMS.md) - System and sequence diagrams
- [`docs/02-DESIGN/TECHNICAL.md`](docs/02-DESIGN/TECHNICAL.md) - Implementation patterns and code structure

### Implementation
- [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) - Current progress and feature status
- [`docs/03-IMPLEMENTATION/PLAN.md`](docs/03-IMPLEMENTATION/PLAN.md) - Implementation plan and timeline

### Operations
- [`docs/04-OPERATIONS/SETUP.md`](docs/04-OPERATIONS/SETUP.md) - Setup and credentials guide

### Integrations
- [`docs/05-INTEGRATIONS/STRIPE.md`](docs/05-INTEGRATIONS/STRIPE.md) - Stripe billing integration guide

### Agent Configuration
- [`.agents/AGENTS.md`](.agents/AGENTS.md) - Agent registry and communication patterns
- [`.agents/project-manager/`](.agents/project-manager/) - Project Manager agent configuration
- [`.agents/backend-engineer/`](.agents/backend-engineer/) - Backend Engineer agent configuration
- [`.agents/frontend-engineer/`](.agents/frontend-engineer/) - Frontend Engineer agent configuration

### Workflows
- [`workflows/feature-development.yaml`](workflows/feature-development.yaml) - Feature development workflow definition

---

## 🤝 Contributing

This project follows an **agent-driven development workflow**. To contribute:

1. Read the [Agent Registry](.agents/AGENTS.md) to understand agent roles
2. Follow the [Feature Development Workflow](workflows/feature-development.yaml)
3. Ensure all validation gates pass before progressing
4. Update documentation as you work

### For Claude Code Users

Use slash commands to activate specialized agents:
- `/pm` - Project Manager (start here)
- `/backend` - Backend Engineer
- `/frontend` - Frontend Engineer
- `/test` - Tester

---

## 🔗 Links

- **Original App**: `RADIOLOGY-REPORTING-APP-Dr-Vikash-Rustagi-main/`
- **Sample Data**: `sample-data/`
- **Backup**: `/Users/anand/radiology-ai-app-backup-20251016-124432.tar.gz`

---

## 📞 Support

For questions or issues:
1. Check [`docs/`](docs/) directory first
2. Review [`.agents/AGENTS.md`](.agents/AGENTS.md) for workflow guidance
3. Check [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for current progress
4. Contact project maintainer

---

**Last Updated**: October 2025
**Status**: Pre-Development (Phase 0) - Repository Restructured
**Next Milestone**: Phase 1 - Foundation (18 hours estimated)
