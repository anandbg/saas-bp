# AI Diagram & Illustration Generator

> AI-powered diagram generation with natural language, file context, and automated validation

[![Status](https://img.shields.io/badge/status-phase--3--complete-green)]()
[![Stack](https://img.shields.io/badge/stack-Next.js%2014%2B%20|%20OpenAI%20|%20MCP-blue)]()
[![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4%20|%20GPT--4V-green)]()

---

## 📋 Quick Links

### 🚀 Getting Started
- **New Contributors**: Start with [Project Overview](#-project-overview)
- **Developers**: See [Development Guide](#-development-guide)
- **Agents**: See [Agent-Driven Workflow](#-agent-driven-workflow)

### 📚 Documentation
- **Project Requirements**: [`docs/00-PROJECT/REQUIREMENTS.md`](docs/00-PROJECT/REQUIREMENTS.md)
- **Technical Constraints**: [`docs/00-PROJECT/CONSTRAINTS.md`](docs/00-PROJECT/CONSTRAINTS.md)
- **Technical Design**: [`docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md`](docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md)
- **Implementation Status**: [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md)

### 🤖 Agent Configuration
- **Agent Registry**: [`.agents/AGENTS.md`](.agents/AGENTS.md)
- **Project Manager**: [`.agents/project-manager/instructions.md`](.agents/project-manager/instructions.md)
- **Backend Engineer**: [`.agents/backend-engineer/instructions.md`](.agents/backend-engineer/instructions.md)
- **Frontend Engineer**: [`.agents/frontend-engineer/instructions.md`](.agents/frontend-engineer/instructions.md)

---

## 📖 Project Overview

### What is This?

An AI-powered web application that generates high-quality diagrams through conversational interactions:

- 💬 **Conversational Interface**: Describe diagrams in natural language
- 📁 **Multi-Format Input**: Upload PDFs, DOCX, PPTX, XLSX, CSV, images for context
- ✅ **Automated Validation**: MCP Playwright ensures quality before delivery
- 🔄 **Feedback Loop**: Automatic improvement iterations (max 5) until perfect
- 🎨 **Professional Design**: Linear/Stripe/Vercel-inspired aesthetics
- 📤 **Multi-Format Export**: PPTX, PDF, PNG, HTML, clipboard

### Current Status

**Phase**: Phase 3 Complete ✅ → Phase 4 Next 🎯
**Progress**: 40% (3 of 7 phases complete)
**Next Step**: Phase 4 - State Management (custom hooks, sessionStorage, caching)

See [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for detailed progress tracking.

---

## 🏗️ Architecture

### Technology Stack

```
Frontend:  Next.js 14+ (App Router) + React 18+ + TypeScript 5+ + Tailwind CSS
Backend:   Next.js API Routes (Stateless + Serverless)
AI:        OpenAI GPT-4 Turbo + GPT-4V (Vision)
Validation: MCP Playwright (Automated browser testing)
Parsing:   pdf-parse, mammoth, xlsx, pptxgenjs
Export:    pptxgenjs, html2canvas, Playwright PDF
Deploy:    Vercel (Serverless Functions)
```

### Key Design Decisions

- **Stateless Architecture**: No database, no auth, session-only storage
- **MCP Validation**: Automated quality checks before showing diagrams
- **Feature Flags**: Muted Supabase/Auth/Stripe from original boilerplate
- **Prompt Engineering**: 19 mandatory rules for consistent AI output
- **Agent-Driven Development**: Specialized agents with gated handoffs

See [`docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md`](docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md) for detailed design.

---

## 🗂️ Repository Structure

```
saas-bp/ (AI Diagram Generator)
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
- OpenAI API key (required)
- No database or auth required (stateless)

### Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd saas-bp
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Add your OpenAI API key:
   echo "OPENAI_API_KEY=your_key_here" >> .env.local

   # Feature flags (already set correctly):
   # DATABASE=false
   # AUTH=false
   # STRIPE=false
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3001](http://localhost:3001)

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

```

---

## 📊 Project Status

**Current Phase**: Phase 4 - State Management (Next)
**Overall Progress**: 40% (3/7 phases complete)
**Repository Status**: ✅ Phase 3 Frontend Complete

### Implementation Phases

| Phase | Status | Progress | Completion Date |
|-------|--------|----------|-----------------|
| Phase 1: Requirements & Design | ✅ Complete | 100% | January 2025 |
| Phase 2: Foundation & Core | ✅ Complete | 100% | January 2025 |
| Phase 3: Frontend Development | ✅ Complete | 100% | January 2025 |
| Phase 4: State Management | 🎯 Next | 0% | - |
| Phase 5: Export Functionality | ⏸️ Pending | 0% | - |
| Phase 6: Testing | ⏸️ Pending | 0% | - |
| Phase 7: Documentation & Deployment | ⏸️ Pending | 0% | - |

See [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for detailed feature breakdown.

---

## 🎯 Key Features

### Completed ✅

1. **File Parsing** (7 formats)
   - PDF, DOCX, PPTX, XLSX, CSV, Images, Text
   - Automated extraction and context building

2. **AI Generation Pipeline**
   - OpenAI GPT-4 Turbo with prompt engineering
   - 19 mandatory rules for consistent output
   - Model fallback and error handling

3. **MCP Playwright Validation**
   - Automated browser testing
   - Structural, visual, and functional checks
   - Feedback loop (max 5 iterations)

4. **Frontend Components**
   - ChatInterface, FileUpload, DiagramPreview, ExportPanel
   - Responsive design, mobile-friendly

### Next (Phase 4) 🎯

1. **Custom React Hooks**
   - useConversation (message history)
   - useDiagramGeneration (API wrapper)

2. **State Management**
   - sessionStorage for persistence
   - In-memory cache (15-min TTL)

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
- **Critical Paths**: 100% coverage required
  - `lib/parsers/*` (all 7 file formats)
  - `lib/ai/diagram-generator.ts`
  - `lib/validation/mcp-playwright.ts`
  - `lib/export/*` (all 5 formats)

---

## 📚 Documentation Index

### Project Foundation
- [`docs/00-PROJECT/REQUIREMENTS.md`](docs/00-PROJECT/REQUIREMENTS.md) - Product requirements (900+ lines)
- [`docs/00-PROJECT/CONSTRAINTS.md`](docs/00-PROJECT/CONSTRAINTS.md) - Technical/business constraints

### Design
- [`docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md`](docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md) - Technical design (3700+ lines)

### Implementation
- [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) - Current progress tracking
- [`docs/03-IMPLEMENTATION/DIAGRAM-GENERATOR-STATUS.md`](docs/03-IMPLEMENTATION/DIAGRAM-GENERATOR-STATUS.md) - Detailed status

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

## 📞 Support

For questions or issues:
1. Check [`docs/`](docs/) directory first
2. Review [`.agents/AGENTS.md`](.agents/AGENTS.md) for workflow guidance
3. Check [`docs/03-IMPLEMENTATION/STATUS.md`](docs/03-IMPLEMENTATION/STATUS.md) for current progress
4. See live app: [http://localhost:3001](http://localhost:3001) (when running)

---

**Last Updated**: January 2025
**Status**: Phase 3 Complete (40% overall) - Frontend Development ✅
**Next Milestone**: Phase 4 - State Management (Week 2-3)
