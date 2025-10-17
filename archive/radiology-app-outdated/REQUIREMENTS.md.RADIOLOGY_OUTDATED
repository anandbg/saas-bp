# Radiology Reporting App - Requirements

## 📋 Overview

**Project**: Migration and enhancement of radiology reporting application
**Timeline**: 4-6 weeks
**Current Phase**: Phase 0 - Pre-Development

---

## 🎯 Product Goals

### Primary Objective
Modernize the existing Node.js/Express radiology reporting application to Next.js 14+ while preserving all critical business logic and adding modern features.

### Success Criteria
1. All existing features work in new stack
2. Report generation quality matches or exceeds current version
3. Response times ≤ current implementation
4. Zero data loss during migration
5. 100% TypeScript type coverage
6. 80%+ test coverage
7. Successful production deployment

---

## 👥 User Stories

### Radiologist Users

**US-001: Authentication**
- As a radiologist, I want to sign up and log in securely so that I can access my reports

**US-002: Audio Transcription**
- As a radiologist, I want to dictate findings using my microphone so that I can quickly input radiology findings without typing

**US-003: Template Management**
- As a radiologist, I want to create and manage radiology report templates so that I can standardize my reporting across similar scan types

**US-004: Report Generation - Espresso Mode**
- As a radiologist, I want to quickly generate a structured radiology report (< 10 seconds) from my findings so that I can complete reports efficiently

**US-005: Report Generation - Slow-Brewed Mode**
- As a radiologist, I want to generate a comprehensive report with literature references (< 30 seconds) for complex cases so that I have thorough documentation

**US-006: Report Management**
- As a radiologist, I want to view, edit, and manage my historical reports so that I can track my work and make revisions

**US-007: Report Export**
- As a radiologist, I want to export reports to PDF and DOCX formats so that I can share them with referring physicians

**US-008: Subscription Management**
- As a radiologist, I want to manage my subscription and billing so that I can upgrade/downgrade plans based on my usage

### Administrator Users (Future)

**US-009: Usage Analytics**
- As an administrator, I want to view usage analytics across my organization so that I can optimize our subscription plan

---

## ✅ Acceptance Criteria

### Phase 1: Foundation

#### Feature 1.1: Project Setup
```gherkin
Given the development environment is configured
When I run `npm run dev`
Then the Next.js development server starts successfully
And I can access the app at http://localhost:3000
```

#### Feature 1.4: Supabase Authentication
```gherkin
Scenario: User Sign Up
Given I am on the signup page
When I enter valid email and password
And I submit the form
Then my account is created in Supabase
And I receive a confirmation email
And I am redirected to the dashboard

Scenario: User Login
Given I have a registered account
When I enter my email and password
And I submit the login form
Then I receive a JWT token
And I am redirected to the dashboard
And I can access protected routes

Scenario: Protected Route Access
Given I am not authenticated
When I try to access /dashboard
Then I am redirected to /login
```

#### Feature 1.5: Stripe Integration Setup
```gherkin
Scenario: Subscription Creation
Given I am an authenticated user
When I select the Professional plan
And I complete Stripe checkout
Then a subscription is created in Stripe
And a webhook fires to my application
And my subscription is saved in Supabase
And I can access Professional plan features
```

### Phase 2: Core Features

#### Feature 2.2: Audio Transcription
```gherkin
Scenario: Audio Recording and Transcription
Given I am on the report generation page
When I click the microphone button
And I speak "No fracture full stop Multiple nodules comma bilateral"
And I stop recording
Then the audio is sent to Whisper API
And I receive the transcription
And spoken punctuation is converted ("full stop" → ".", "comma" → ",")
And the findings field is populated with: "No fracture. Multiple nodules, bilateral"
```

#### Feature 2.3: Report Generation - Espresso Mode
```gherkin
Scenario: Generate Report with Template
Given I have selected "CT Chest" scan type
And I have entered findings: "Spiculated nodule in right upper lobe measuring 2.1cm"
And I have selected my standard CT Chest template
And I have selected "Espresso" mode
When I click "Generate Report"
Then the system applies spoken punctuation
And integrates findings with template
And removes contradictions (e.g., removes "lungs are clear" if nodule present)
And sends prompt to OpenAI GPT-5
And returns structured report in < 10 seconds
And report contains: Technique, Findings, Impression sections
And no contradictions exist in final report
```

#### Feature 2.5: Template Integration Logic
```gherkin
Scenario: Template Integration Without Contradictions
Given I have a template saying "The lungs are clear. No pleural effusion. The heart is normal size."
And my findings are "Nodule in right upper lobe"
When the system integrates findings with template
Then the system removes "The lungs are clear" (contradicts nodule)
And preserves "No pleural effusion" (no contradiction)
And preserves "The heart is normal size" (no contradiction)
And adapts removed normals with "at other levels" or "otherwise"
And the final report is coherent without contradictions
```

---

## 🚫 Out of Scope

### Phase 1
- PACS integration
- DICOM image viewing
- Multi-language support
- Mobile native apps
- HIPAA compliance certification (future)
- Multi-user organization accounts (future)
- Advanced analytics dashboard (future)

---

## 🔒 Constraints

See [CONSTRAINTS.md](./CONSTRAINTS.md) for detailed technical and business constraints.

### Key Constraints

**Technical**:
- Must use Next.js 14+ App Router
- Must use Supabase for database and auth
- Must use Stripe for billing
- Must preserve exact business logic from original app

**Business**:
- Budget: $70-125/month infrastructure
- Timeline: 4-6 weeks total
- No breaking changes to core report quality

**Critical Business Logic to Preserve**:
1. Spoken punctuation conversion (exact regex patterns)
2. Contradiction cleaning algorithm
3. Template integration rules
4. Two-tier generation modes (espresso/slow-brewed)
5. Model fallback patterns

---

## 📊 User Flows

### Primary Flow: Generate Report

```
1. User logs in (Supabase Auth)
   ↓
2. User navigates to /generate
   ↓
3. User selects scan type (e.g., "CT Chest")
   ↓
4. User enters clinical history (optional)
   ↓
5. User records or types findings
   ↓
6. System transcribes audio (if recorded)
   ↓
7. System applies spoken punctuation
   ↓
8. User selects template (optional)
   ↓
9. User selects generation mode (espresso/slow-brewed)
   ↓
10. User clicks "Generate Report"
    ↓
11. System checks usage limits (Stripe)
    ↓
12. System generates report (OpenAI)
    ↓
13. System displays structured report
    ↓
14. User reviews and edits if needed
    ↓
15. User saves report to database
    ↓
16. User can export to PDF/DOCX
```

---

## 📈 Non-Functional Requirements

### Performance
- Page load time: < 3 seconds
- API response time: < 2 seconds (95th percentile)
- Report generation (espresso): < 10 seconds
- Report generation (slow-brewed): < 30 seconds

### Reliability
- 99.9% uptime target
- Automatic failover for critical services
- Database backups daily

### Security
- HTTPS only
- JWT authentication
- Row Level Security (RLS) on all tables
- Input validation on all endpoints
- Secrets stored in environment variables

### Scalability
- Support 100 users initially
- Architecture can scale to 10,000 users
- Horizontal scaling via Vercel

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios

### Usability
- Mobile responsive design
- Clear error messages
- Loading states on all async operations
- Confirmation dialogs for destructive actions

---

## 🔄 Feature Prioritization

### Must Have (Phase 1-2)
- Authentication (Supabase)
- Audio transcription (Whisper)
- Report generation (both modes)
- Template management
- Billing (Stripe)

### Should Have (Phase 3)
- Real-time transcription (WebSocket)
- Report export (PDF/DOCX)
- Literature search integration

### Nice to Have (Future)
- ChatKit AI assistant widget
- Advanced analytics
- Team collaboration features
- PACS integration

---

## 📝 Assumptions

1. Users have modern web browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
2. Users have microphone access for audio recording
3. Users have stable internet connection for AI API calls
4. All content is in English (no internationalization in Phase 1)
5. Users understand basic radiology terminology

---

## 🎯 Definition of Done

A feature is considered complete when:

- [ ] All acceptance criteria met
- [ ] Code implemented per specification
- [ ] TypeScript strict mode passes
- [ ] Linting passes with no errors
- [ ] Unit tests written and passing (60% of tests)
- [ ] Integration tests written and passing (30% of tests)
- [ ] E2E tests written for critical paths (10% of tests)
- [ ] 80%+ overall test coverage achieved
- [ ] Code reviewed (self-review against specs)
- [ ] Documentation updated
- [ ] User approval obtained (if required)
- [ ] STATUS.md updated with completion

---

**Last Updated**: October 2025
**Status**: Living Document
**Owner**: Requirements Analyst Agent
