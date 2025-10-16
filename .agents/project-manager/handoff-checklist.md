# Handoff Validation Checklists

## 📋 Overview

This document contains detailed validation checklists for each handoff gate in the development workflow. **All items must be checked** before progressing to the next stage.

---

## Gate 1: Requirements → Design

**Checkpoint**: Before delegating to Designer

### Validation Checklist

- [ ] **SPEC.md Exists**: `specs/features/[feature]/SPEC.md` exists and is complete
- [ ] **Technical Approach Defined**: SPEC.md includes clear technical approach section
- [ ] **User Stories Complete**: All user stories are documented
- [ ] **Acceptance Criteria Clear**: Every user story has measurable acceptance criteria
- [ ] **Constraints Documented**: All relevant constraints from `docs/00-PROJECT/CONSTRAINTS.md` are referenced
- [ ] **Critical Logic Identified**: Any business logic preservation needs are explicitly called out
- [ ] **Dependencies Listed**: All feature dependencies are documented
- [ ] **No Ambiguity**: No "TBD", "TODO", or vague descriptions remain
- [ ] **Stakeholder Approval**: User has approved requirements (if applicable)

### What to Check

```markdown
# Read: specs/features/[feature]/SPEC.md
Look for:
- Clear "Overview" section
- Detailed "Technical Approach" section
- Complete "Acceptance Criteria" with checkboxes
- "Dependencies" section listing blockers
- No placeholder text or unclear requirements
```

### If Validation Fails

**Action**: Delegate back to Requirements Analyst with specific gaps to address

---

## Gate 2: Design → Implementation

**Checkpoint**: Before delegating to Engineers

### Validation Checklist

- [ ] **DESIGN.md Exists**: `specs/features/[feature]/DESIGN.md` exists and is complete
- [ ] **API Endpoints Documented**: All endpoints have method, path, request, response, errors
- [ ] **Database Schema**: Schema changes fully documented (if applicable)
- [ ] **Component Hierarchy**: UI component tree defined (if frontend)
- [ ] **Business Logic Plan**: Migration plan for critical logic documented (if applicable)
- [ ] **Data Flow Documented**: How data flows through the system is clear
- [ ] **Error Handling**: Error scenarios and handling documented
- [ ] **Authentication**: Auth requirements clearly specified
- [ ] **Dependencies Resolved**: All dependencies from requirements are addressed
- [ ] **No Design Ambiguities**: Every implementation decision is documented

### What to Check

```markdown
# Read: specs/features/[feature]/DESIGN.md
Look for:

API Endpoints Section:
- Every endpoint has: POST /api/path
- Request schema with types
- Response schema with types
- Error codes and messages

Database Section:
- Complete CREATE TABLE statements
- All indexes defined
- RLS policies specified

Components Section:
- Component tree diagram
- Props for each component
- State management approach

Business Logic Section:
- Source file references (e.g., index.js:155-184)
- Exact behavior to preserve
- Test cases for verification
```

### If Validation Fails

**Action**: Delegate back to Designer with specific gaps to address

---

## Gate 3: Implementation → Testing

**Checkpoint**: Before delegating to Tester

### Validation Checklist

#### Code Quality

- [ ] **All Code Implemented**: Every item from DESIGN.md is implemented
- [ ] **TypeScript Strict**: `npm run type-check` passes with no errors
- [ ] **No Compilation Errors**: `npm run build` succeeds
- [ ] **Linting Passes**: `npm run lint` has no errors
- [ ] **Code Conventions**: Code follows established patterns in codebase

#### Critical Business Logic

- [ ] **Logic Preserved**: Critical business logic matches original exactly
- [ ] **Manual Verification**: Tested critical functions with sample inputs
- [ ] **Output Matches**: Compared outputs with original implementation
- [ ] **Edge Cases Handled**: All edge cases from original are preserved

#### Frontend Checklist (if applicable)

- [ ] **Components Created**: All components from design exist
- [ ] **Props Match**: Component props match design specifications
- [ ] **Client Components**: Interactive components marked 'use client'
- [ ] **Server Components**: Non-interactive components are server components
- [ ] **Responsive**: Components work on mobile and desktop
- [ ] **Accessibility**: Basic ARIA attributes present

#### Backend Checklist (if applicable)

- [ ] **API Routes Created**: All API routes from design exist
- [ ] **Request Validation**: Input validation using Zod schemas
- [ ] **Error Handling**: try/catch blocks with proper error responses
- [ ] **Authentication**: Protected routes check authentication
- [ ] **Database Queries**: RLS policies enforced on all queries
- [ ] **External Services**: API integrations follow design

#### Dependencies

- [ ] **Dependencies Resolved**: No blockers remain
- [ ] **Integration Points**: Code integrates with existing codebase
- [ ] **Environment Variables**: Any new env vars documented

### What to Check

```typescript
// Check frontend component example
// File: components/reports/ReportForm.tsx
- Does it have 'use client' directive?
- Are all props typed?
- Is state management clear?
- Are errors handled?
- Is loading state shown?

// Check backend API example
// File: app/api/generate/route.ts
- Does it validate input with Zod?
- Does it check authentication?
- Does it handle errors?
- Does it return proper status codes?
- Does it track usage (if applicable)?
```

### If Validation Fails

**Action**: Identify specific issues and delegate back to appropriate engineer

---

## Gate 4: Testing → Completion

**Checkpoint**: Before marking feature complete

### Validation Checklist

#### Test Execution

- [ ] **All Tests Pass**: `npm run test` shows all green
- [ ] **Unit Tests**: Individual functions tested
- [ ] **Integration Tests**: API routes tested end-to-end
- [ ] **E2E Tests**: Critical workflows tested (if applicable)

#### Coverage Metrics

- [ ] **Overall Coverage**: >= 80% overall coverage
- [ ] **Critical Logic Coverage**: 100% on critical business logic
- [ ] **No Untested Code**: No critical paths untested
- [ ] **Coverage Report**: Run `npm run test:coverage` and verify

#### Test Quality

- [ ] **Clear Test Names**: Test descriptions are clear
- [ ] **Assertions**: Tests actually verify behavior
- [ ] **Edge Cases**: Edge cases are tested
- [ ] **Error Cases**: Error scenarios are tested
- [ ] **Mocking**: External services properly mocked

#### Critical Business Logic Verification

- [ ] **Spoken Punctuation**: If applicable, all test cases pass
- [ ] **Contradiction Cleaning**: If applicable, no contradictions in outputs
- [ ] **Model Fallback**: If applicable, fallback works correctly
- [ ] **Template Integration**: If applicable, templates merge correctly

#### Performance

- [ ] **Response Times**: API routes respond within acceptable time
- [ ] **No Performance Regressions**: New code doesn't slow down existing features
- [ ] **Database Queries**: Queries are optimized with indexes

#### Documentation

- [ ] **TEST.md Updated**: `specs/features/[feature]/TEST.md` documents all tests
- [ ] **Coverage Report**: Coverage metrics documented
- [ ] **Known Issues**: Any known issues or limitations documented

### What to Check

```bash
# Run full test suite
npm run test

# Check coverage
npm run test:coverage

# Look for:
- All tests passing (green checkmarks)
- Coverage > 80% overall
- Coverage = 100% on files in lib/ai/, lib/transcription/
- No skipped tests
- No failing tests
```

### If Validation Fails

**Action**:
- If tests fail: Delegate back to appropriate engineer to fix
- If coverage low: Delegate to Tester to add more tests
- If performance issues: Investigate and optimize

---

## Gate 5: Feature → Status Update

**Checkpoint**: Before marking feature complete in STATUS.md

### Validation Checklist

- [ ] **All Gates Passed**: All above validation gates have passed
- [ ] **User Approval**: User has approved feature (if required)
- [ ] **Documentation Updated**: All docs reflect new feature
- [ ] **No Blockers**: No open blockers for this feature
- [ ] **Acceptance Criteria Met**: All criteria from ACCEPTANCE.md are met

### Status Update Steps

1. Update `docs/03-IMPLEMENTATION/STATUS.md`:
   ```markdown
   - **Status**: ✅ Complete
   - **Completed**: YYYY-MM-DD HH:MM
   - **Actual Time**: X hours
   - **Notes**: [Any learnings or deviations]
   ```

2. Update progress percentages

3. Archive task files:
   ```bash
   mv specs/tasks/[FEATURE]-*.md specs/tasks/completed/
   ```

4. Commit changes:
   ```bash
   git add .
   git commit -m "Complete Feature X.Y: [Feature Name]"
   ```

---

## 🚨 When Validation Fails

### General Process

1. **Identify Gap**: Specifically identify what's missing or incorrect
2. **Document Issue**: Create or update blocker in STATUS.md
3. **Delegate**: Assign back to appropriate agent with clear instructions
4. **Track**: Monitor progress on resolving the issue
5. **Re-validate**: Run validation checklist again after fix

### Example Delegation

```markdown
**Issue**: API endpoint /api/generate missing error handling

**Delegate To**: Backend Engineer

**Instruction**:
"Add error handling to /api/generate endpoint according to
specs/features/02-report-generation/DESIGN.md section 3.2.
Specifically:
- Catch OpenAI API errors
- Return 503 with proper error message
- Log errors for monitoring
- Handle rate limiting scenarios"
```

---

## ✅ Checklist Usage

### Before Each Handoff

1. Print or open relevant checklist
2. Go through line by line
3. Check each item physically or mentally
4. If ANY item unchecked → validation fails
5. Only proceed when ALL items checked

### Documentation

Document validation in handoff notes:

```markdown
## Handoff: Requirements → Design
**Date**: 2025-10-16
**Feature**: Authentication
**Validator**: Project Manager
**Result**: ✅ PASSED

All checklist items verified:
- SPEC.md complete
- Acceptance criteria clear
- No ambiguities
- User approved requirements
```

---

**Last Updated**: October 2025
**Version**: 1.0
**Maintainer**: Project Manager Agent
