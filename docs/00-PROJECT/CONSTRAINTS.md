# AI Diagram Generator - Project Constraints

**Project**: AI-Powered Diagram & Illustration Generator
**Version**: 1.0.0
**Date**: January 2025
**Status**: Active

---

## Table of Contents

1. [Technical Constraints](#technical-constraints)
2. [Architecture Constraints](#architecture-constraints)
3. [Business Constraints](#business-constraints)
4. [Security Constraints](#security-constraints)
5. [Performance Constraints](#performance-constraints)
6. [Quality Constraints](#quality-constraints)
7. [Deployment Constraints](#deployment-constraints)

---

## 1. Technical Constraints

### 1.1 Technology Stack (MANDATORY)

#### Core Technologies
- **Framework**: Next.js 14+ with App Router (mandatory)
- **Language**: TypeScript 5+ with strict mode (mandatory)
- **Styling**: Tailwind CSS 3.4+ (mandatory)
- **Runtime**: Node.js 18+ (mandatory)

#### AI & Machine Learning
- **AI Provider**: OpenAI exclusively (mandatory)
  - GPT-4 Turbo or GPT-4o for diagram generation (mandatory)
  - GPT-4V for image analysis (mandatory)
- **AI SDK**: Vercel AI SDK v3.0+ (mandatory)
- **Validation**: MCP Playwright for automated testing (mandatory)

#### File Parsing Libraries
- **PDF**: `pdf-parse@^1.1.1` (mandatory)
- **DOCX**: `mammoth@^1.7.0` (mandatory)
- **XLSX/CSV**: `xlsx@^0.18.5`, `csv-parse@^5.5.6` (mandatory)
- **PPTX**: `pptxgenjs@^3.12.0` (mandatory)
- **Images**: GPT-4V via OpenAI API (mandatory)

#### Export Libraries
- **PPTX**: `pptxgenjs@^3.12.0` (mandatory)
- **PDF**: `playwright-core@^1.45.0` or `puppeteer-core` (mandatory)
- **PNG**: `html2canvas@^1.4.1` or Playwright screenshots (mandatory)
- **Utilities**: `jszip@^3.10.1`, `react-dropzone@^14.2.3` (mandatory)

#### CDN Dependencies (User-facing)
- Tailwind CSS: `https://cdn.tailwindcss.com` (mandatory in generated HTML)
- Lucide Icons: `https://unpkg.com/lucide@latest` (mandatory in generated HTML)
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js` (required for charts only)

### 1.2 Muted Features (Feature Flags)

**CRITICAL**: The following features from the original boilerplate MUST be disabled but preserved:

- **Database (Supabase)**: `DATABASE=false`
  - All database queries bypassed
  - Mock client provided for compatibility
  - Schema files preserved for future use

- **Authentication (Supabase Auth)**: `AUTH=false`
  - All auth middleware disabled
  - Public routes only
  - Auth UI components hidden

- **Billing (Stripe)**: `STRIPE=false`
  - Stripe webhooks disabled
  - No subscription checks
  - Integration code preserved

**Implementation**:
```typescript
// lib/config/features.ts
export const FEATURES = {
  DATABASE: false,
  AUTH: false,
  STRIPE: false,
  DIAGRAM_GENERATOR: true,
  FILE_PARSING: true,
  MCP_VALIDATION: true,
  AI_GENERATION: true,
} as const;
```

### 1.3 Code Quality Standards (MANDATORY)

**TypeScript**:
- 100% TypeScript coverage (mandatory)
- Strict mode enabled (mandatory)
- No `any` types except where absolutely necessary (mandatory)
- All exported functions must have explicit types (mandatory)

**Linting & Formatting**:
- ESLint strict mode (mandatory)
- Prettier configured (mandatory)
- Zero linting errors in production (mandatory)
- Pre-commit hooks via Husky (recommended)

---

## 2. Architecture Constraints

### 2.1 Stateless Design (MANDATORY)

**NO Persistent Storage**:
- ❌ No database
- ❌ No user accounts
- ❌ No server-side sessions
- ❌ No persistent file storage

**Stateless Requirements**:
- Conversation history stored in browser `sessionStorage`
- Generated diagrams stored in browser (sessionStorage or IndexedDB)
- Each API request is independent and self-contained
- Closing browser = losing all data (acceptable)
- No server-side state dependencies

### 2.2 Data Flow Constraints

**Request/Response Pattern**:
```
User Browser (sessionStorage)
    ↓
Next.js API Routes (stateless)
    ↓
OpenAI API (external)
    ↓
MCP Playwright Validation (headless)
    ↓
Response to Browser
```

**Caching Strategy**:
- In-memory cache only (15-minute TTL)
- No persistent cache
- Cache invalidation on server restart (acceptable)

### 2.3 Deployment Architecture

- **Platform**: Vercel (mandatory)
- **Serverless Functions**: All API routes as serverless functions
- **Edge Functions**: Not required for this project
- **CDN**: Automatic static asset caching via Vercel
- **Regions**: Multi-region for low latency

---

## 3. Business Constraints

### 3.1 Budget Constraints

**Monthly Cost Target**: $20-50/month

**Breakdown**:
- Vercel Hobby Plan: $0/month (sufficient for MVP)
- OpenAI API: $20-50/month (variable based on usage)
- Total: $20-50/month

**Cost Optimization**:
- No database costs (stateless)
- No authentication service costs (no auth)
- No billing service costs (no subscriptions)
- Minimal infrastructure costs

### 3.2 Timeline Constraints

**Total Timeline**: 6 weeks

**Phase Breakdown**:
- Phase 1 (Requirements & Design): Week 1 ✅ Complete
- Phase 2 (Foundation & Core): Week 1 ✅ Complete
- Phase 3 (Frontend Development): Week 2 ✅ Complete
- Phase 4 (State Management): Week 2-3
- Phase 5 (Export Functionality): Week 4
- Phase 6 (Testing): Week 5
- Phase 7 (Documentation & Deployment): Week 6

### 3.3 Scope Constraints

**In Scope**:
- Diagram generation via AI
- File upload and parsing (7 formats)
- MCP Playwright validation
- Export in 5 formats
- Session-based history

**Out of Scope**:
- User authentication
- Data persistence
- Collaboration features
- Payment/billing
- Mobile native apps
- API for external integrations

---

## 4. Security Constraints

### 4.1 Input Validation (MANDATORY)

**File Upload**:
- File type validation (whitelist only)
- File size limits: 20MB per file, 50MB total
- Malware scanning (recommended for production)
- Sanitize file names

**User Input**:
- Zod schemas for all API inputs (mandatory)
- XSS prevention via sanitization (mandatory)
- Maximum request size: 50MB (mandatory)

**Generated HTML**:
- Sandbox iframes for preview (mandatory)
- No `allow-same-origin` in iframe (mandatory)
- Content Security Policy headers (mandatory)

### 4.2 API Security (MANDATORY)

**OpenAI API Key**:
- Stored in environment variables only (mandatory)
- Never exposed to client (mandatory)
- Separate keys for dev/prod (mandatory)
- Regular key rotation (recommended)

**Rate Limiting**:
- 20 requests per minute per IP (mandatory)
- 100 requests per hour per IP (mandatory)
- Exponential backoff for OpenAI retries (mandatory)

**HTTPS**:
- HTTPS only (enforced by Vercel) (mandatory)
- No HTTP fallback (mandatory)

---

## 5. Performance Constraints

### 5.1 Response Time Requirements (MANDATORY)

**API Endpoints**:
- Diagram generation: < 30 seconds (95th percentile)
- File parsing: < 10 seconds for 20MB files (95th percentile)
- Validation: < 20 seconds per iteration (95th percentile)
- Export generation: < 10 seconds (95th percentile)

**Frontend**:
- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- Diagram preview render: < 1 second

### 5.2 Resource Limits

**Memory**:
- Server memory per request: < 512MB
- Browser memory usage: < 500MB
- File processing memory: < 1GB

**Concurrency**:
- Maximum concurrent generations: 10 per instance
- Maximum concurrent validations: 5 per instance
- Maximum file uploads in parallel: 5

**Output Limits**:
- Maximum HTML output: 2MB
- Maximum export file size:
  - PPTX: 25MB
  - PDF: 10MB
  - PNG: 5MB
  - HTML: 2MB

---

## 6. Quality Constraints

### 6.1 Diagram Quality (MANDATORY)

**Prompt Engineering Rules**:
All generated diagrams MUST follow these rules (see REQUIREMENTS.md FR-3.2 for full list):

1. Single HTML code block with inline CSS only
2. Include `<html>`, `<head>`, `<body>` tags
3. Use Lucide icons (stroke-width: 1.5)
4. Tailwind CDN + Lucide CDN required
5. Responsive design (mobile/tablet/desktop)
6. Professional design (Linear/Stripe/Vercel style)
7. No JavaScript animations (Tailwind only)
8. Dark mode for tech, light for business
9. Charts use Chart.js with bug fixes

**Validation Pass Rate**:
- Target: 95%+ first-attempt pass rate
- Maximum iterations: 5
- Stop validation after 5 failed attempts

### 6.2 Test Coverage (MANDATORY)

**Overall Coverage**: 80%+ (mandatory)

**Breakdown**:
- Unit tests: 60% of test suite
- Integration tests: 30% of test suite
- E2E tests: 10% of test suite

**Critical Paths** (100% coverage required):
- File parsing (all 7 formats)
- AI generation pipeline
- MCP validation system
- Export functionality (all 5 formats)

---

## 7. Deployment Constraints

### 7.1 Environment Configuration

**Three Environments**:
1. Development (local): `npm run dev`
2. Preview (Vercel): Automatic per PR
3. Production (Vercel): Automatic on main branch

**Environment Variables**:
```bash
# Required
OPENAI_API_KEY=xxx

# Feature Flags
DATABASE=false
AUTH=false
STRIPE=false

# Optional
MCP_VALIDATION_ENABLED=true
```

### 7.2 CI/CD Requirements (MANDATORY)

**GitHub Actions**:
- Run on all PRs
- Type checking must pass
- Linting must pass
- Tests must pass (when implemented)
- Build must succeed

**Vercel Deployment**:
- Automatic preview per PR
- Automatic production on main merge
- Environment variables configured
- Build cache enabled

### 7.3 Monitoring Requirements

**Production Monitoring** (recommended):
- Error tracking (Sentry or similar)
- Performance monitoring (Vercel Analytics)
- OpenAI API usage tracking
- Cost monitoring

---

## 8. Browser & Platform Constraints

### 8.1 Browser Support (MANDATORY)

**Supported**:
- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 14+, Chrome Android 90+

**Not Supported**:
- Internet Explorer (all versions)
- Browsers older than 2 major versions

### 8.2 Device Support

**Supported**:
- Desktop: 1024px and above
- Tablet: 768px - 1023px
- Mobile: 375px - 767px

**Requirements**:
- Responsive design across all screen sizes
- Touch-friendly UI elements (44px minimum tap target)
- Mobile-optimized file upload

### 8.3 Accessibility (MANDATORY)

**WCAG 2.1 AA Compliance**:
- Keyboard navigation (mandatory)
- Screen reader support (mandatory)
- Color contrast ratios >= 4.5:1 (mandatory)
- Alt text on images (mandatory)
- ARIA labels on interactive elements (mandatory)
- Focus indicators visible (mandatory)

---

## 9. Forbidden Practices

### 9.1 Code

- ❌ NO `any` types (except unavoidable)
- ❌ NO hardcoded credentials or API keys
- ❌ NO `console.log` in production
- ❌ NO client-side storage of API keys
- ❌ NO bypassing input validation
- ❌ NO SQL (we have no database)

### 9.2 Architecture

- ❌ NO database connections (stateless)
- ❌ NO user authentication (disabled)
- ❌ NO server-side sessions
- ❌ NO persistent state
- ❌ NO circumventing feature flags

### 9.3 Security

- ❌ NO iframe without sandbox
- ❌ NO `allow-same-origin` in iframe sandbox
- ❌ NO exposing API keys to client
- ❌ NO executing user-provided JavaScript
- ❌ NO SQL injection risks (we have no SQL anyway)

### 9.4 Process

- ❌ NO skipping validation gates
- ❌ NO merging without passing CI/CD
- ❌ NO deploying without testing
- ❌ NO modifying prompt engineering rules
- ❌ NO reducing validation strictness

---

## 10. Compliance Checklist

Before marking any feature complete:

- [ ] Technology stack requirements met
- [ ] Stateless architecture maintained (no database/sessions)
- [ ] Feature flags properly configured
- [ ] TypeScript strict mode passes with no errors
- [ ] Security requirements met (input validation, API key protection)
- [ ] Performance requirements met (< 30s generation, < 20s validation)
- [ ] Validation pass rate >= 95%
- [ ] All prompt engineering rules enforced
- [ ] Browser support requirements met
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] No forbidden practices used
- [ ] CI/CD passes (type check, lint, build)
- [ ] Documentation updated

---

## 11. References

- **Requirements**: `docs/00-PROJECT/REQUIREMENTS.md`
- **Design**: `docs/02-DESIGN/DIAGRAM-GENERATOR-DESIGN.md`
- **Status**: `docs/03-IMPLEMENTATION/STATUS.md`
- **Git Workflow**: `docs/04-PROCESSES/GIT-WORKFLOW.md`

---

**Last Updated**: January 2025
**Status**: Living Document
**Owner**: Project Manager + Requirements Analyst
