# Agent Registry - Radiology Reporting App

## 📋 Overview

This document defines all agents, their roles, responsibilities, and interaction patterns for the Radiology Reporting App development workflow.

**Last Updated**: October 2025
**Workflow Model**: Gated handoffs with artifact validation

---

## 🤖 Agent Roster

### 1. Project Manager (Orchestrator)
**Role**: Coordination and workflow orchestration
**Agent ID**: `project-manager`
**Activation**: `/pm` or at project start
**Authority Level**: High - Can delegate to all agents

**Responsibilities**:
- Break down features into agent-specific tasks
- Coordinate handoffs between specialized agents
- Validate artifacts before approving progression
- Update implementation status
- Resolve blockers and dependencies

**Can Modify**:
- `docs/03-IMPLEMENTATION/AGENT-TASKS.md`
- `docs/03-IMPLEMENTATION/STATUS.md`
- `specs/tasks/*.md` (create new tasks)

**Cannot Modify**:
- Source code (delegates to engineers)
- Design documents (delegates to designer)
- Test files (delegates to tester)

---

### 2. Requirements Analyst
**Role**: Requirements gathering and documentation
**Agent ID**: `requirements-analyst`
**Activation**: `/requirements` or start of new feature
**Authority Level**: Medium - Defines what to build

**Responsibilities**:
- Gather and document product requirements
- Define user stories and acceptance criteria
- Document constraints and assumptions
- Create feature specifications
- Validate business logic preservation needs

**Can Modify**:
- `docs/00-PROJECT/REQUIREMENTS.md`
- `docs/00-PROJECT/CONSTRAINTS.md`
- `specs/features/[feature]/SPEC.md`
- `specs/features/[feature]/ACCEPTANCE.md`

**Cannot Modify**:
- Implementation code
- Design documents (provides input only)
- Test specifications (provides requirements only)

---

### 3. Designer (Technical Architect)
**Role**: Technical design and architecture
**Agent ID**: `designer`
**Activation**: `/design` or after requirements approval
**Authority Level**: Medium - Defines how to build

**Responsibilities**:
- Create technical design from requirements
- Design API endpoints and contracts
- Design database schemas
- Design component hierarchies
- Document architectural patterns
- Ensure design aligns with constraints

**Can Modify**:
- `docs/01-ARCHITECTURE/*`
- `docs/02-DESIGN/*`
- `specs/features/[feature]/DESIGN.md`

**Cannot Modify**:
- Implementation code
- Requirements documents (provides feedback only)
- Test specifications

---

### 4. Frontend Engineer
**Role**: UI component implementation
**Agent ID**: `frontend-engineer`
**Activation**: `/frontend` or after design approval
**Authority Level**: Medium - Implements frontend

**Responsibilities**:
- Implement React components per design specs
- Create Next.js pages and layouts
- Implement client-side logic
- Ensure TypeScript type safety
- Follow design system and patterns
- Implement responsive designs

**Can Modify**:
- `app/**/*.tsx` (pages, layouts)
- `components/**/*.tsx`
- `hooks/**/*.ts`
- `types/**/*.ts` (frontend types)
- Component-level styles

**Cannot Modify**:
- API routes (delegates to backend engineer)
- Business logic in `lib/`
- Test files (provides implementation for testing)
- Design documents

---

### 5. Backend Engineer
**Role**: API and business logic implementation
**Agent ID**: `backend-engineer`
**Activation**: `/backend` or after design approval
**Authority Level**: Medium - Implements backend

**Responsibilities**:
- Implement API routes per design specs
- Migrate business logic from original app
- Create database queries and migrations
- Implement authentication and authorization
- Integrate external services (OpenAI, Stripe, Supabase)
- Ensure data validation and security

**Can Modify**:
- `app/api/**/*.ts` (API routes)
- `lib/**/*.ts` (business logic)
- `types/**/*.ts` (API types)
- Database migrations
- `middleware.ts`

**Cannot Modify**:
- UI components (delegates to frontend engineer)
- Test files (provides implementation for testing)
- Design documents

---

### 6. Tester (QA Engineer)
**Role**: Test creation and validation
**Agent ID**: `tester`
**Activation**: `/test` or after implementation complete
**Authority Level**: Medium - Validates quality

**Responsibilities**:
- Write unit tests for business logic
- Write integration tests for API routes
- Write E2E tests for critical workflows
- Validate test coverage (80%+ target)
- Verify critical business logic preservation
- Report bugs and issues

**Can Modify**:
- `tests/**/*.test.ts`
- `tests/**/*.spec.ts`
- `specs/features/[feature]/TEST.md`
- Test configuration files

**Cannot Modify**:
- Implementation code (reports bugs only)
- Design documents
- Requirements documents

---

## 🔄 Interaction Patterns

### Agent Communication Protocol

```
Project Manager
    ├──> Requirements Analyst
    │       └──> outputs: REQUIREMENTS.md, SPEC.md
    │       └──> handoff: design gate
    │
    ├──> Designer
    │       └──> inputs: REQUIREMENTS.md, SPEC.md
    │       └──> outputs: DESIGN.md, API specs, DB schema
    │       └──> handoff: implementation gate
    │
    ├──> Frontend Engineer (parallel)
    │       └──> inputs: DESIGN.md
    │       └──> outputs: components/, pages/
    │       └──> handoff: testing gate
    │
    ├──> Backend Engineer (parallel)
    │       └──> inputs: DESIGN.md
    │       └──> outputs: api/, lib/
    │       └──> handoff: testing gate
    │
    └──> Tester
            └──> inputs: all implementation
            └──> outputs: test suites
            └──> handoff: deployment gate
```

### Handoff Gates

**Requirements → Design**
- [ ] All user stories defined
- [ ] Acceptance criteria clear
- [ ] Constraints documented
- [ ] User approval obtained

**Design → Implementation**
- [ ] All API endpoints documented
- [ ] Database schema complete
- [ ] Component hierarchy defined
- [ ] Dependencies identified

**Implementation → Testing**
- [ ] All code implemented per spec
- [ ] TypeScript strict mode passes
- [ ] No compilation errors
- [ ] Code review complete

**Testing → Deployment**
- [ ] All tests passing
- [ ] 80%+ coverage achieved
- [ ] Critical paths tested
- [ ] Performance benchmarks met

---

## 📊 Authority Matrix

| Agent | Requirements | Design | Frontend Code | Backend Code | Tests | Status Docs |
|-------|--------------|--------|---------------|--------------|-------|-------------|
| Project Manager | ✅ Review | ✅ Review | ❌ No | ❌ No | ❌ No | ✅ Write |
| Requirements Analyst | ✅ Write | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |
| Designer | 📝 Input | ✅ Write | ❌ No | ❌ No | ❌ No | ❌ No |
| Frontend Engineer | ❌ No | 📝 Input | ✅ Write | ❌ No | ❌ No | ❌ No |
| Backend Engineer | ❌ No | 📝 Input | ❌ No | ✅ Write | ❌ No | ❌ No |
| Tester | ❌ No | ❌ No | 📝 Report | 📝 Report | ✅ Write | ❌ No |

**Legend**:
- ✅ Write: Can create/modify
- 📝 Input: Can provide feedback/suggestions
- ✅ Review: Can approve/reject
- ❌ No: Cannot modify

---

## 🎯 Agent Activation

### Using Slash Commands (when configured)

```bash
/pm              # Activate Project Manager
/requirements    # Activate Requirements Analyst
/design          # Activate Designer
/frontend        # Activate Frontend Engineer
/backend         # Activate Backend Engineer
/test            # Activate Tester
```

### Using Task Tool

```typescript
// Example: Delegate to backend engineer
Task({
  subagent_type: "backend-engineer",
  description: "Implement authentication API",
  prompt: "Implement the /api/auth/login endpoint according to specs/features/01-authentication/SPEC.md"
});
```

---

## 📝 Best Practices

### For All Agents

1. **Read Instructions First**: Always read `.agents/[your-agent]/instructions.md` before starting
2. **Check Dependencies**: Verify all required inputs exist before starting
3. **Follow Specifications**: Implement exactly what's in the spec - no assumptions
4. **Update Status**: Update relevant docs when completing work
5. **Validate Handoffs**: Ensure all handoff criteria met before progression

### For Project Manager

1. **Gate Progression**: Never skip handoff validation gates
2. **Track Dependencies**: Maintain clear dependency graph
3. **Unblock Agents**: Resolve blockers proactively
4. **Document Decisions**: Log all significant decisions

### For Engineers

1. **Type Safety First**: All code must have proper TypeScript types
2. **Test Coverage**: Write tests alongside implementation
3. **Code Quality**: Follow established patterns and conventions
4. **Documentation**: Document complex logic inline

### For Tester

1. **Test Critical Paths**: Prioritize business-critical functionality
2. **Coverage Metrics**: Aim for 80%+ overall, 100% on critical logic
3. **Clear Failures**: Test failures must clearly indicate what broke
4. **Regression Prevention**: Add tests for all reported bugs

---

## 🔧 Configuration Files

Each agent has dedicated configuration:

- **Instructions**: `.agents/[agent]/instructions.md`
- **Templates**: `.agents/[agent]/templates/` (if applicable)
- **Checklists**: `.agents/[agent]/*-checklist.md` (validation checklists)

---

## 📚 Related Documentation

- [Project Manager Instructions](.agents/project-manager/instructions.md)
- [Handoff Checklist](.agents/project-manager/handoff-checklist.md)
- [Feature Development Workflow](../workflows/feature-development.yaml)
- [Agent Task Assignments](../docs/03-IMPLEMENTATION/AGENT-TASKS.md)

---

**Status**: Active
**Version**: 1.0
**Maintainer**: Project Manager Agent
