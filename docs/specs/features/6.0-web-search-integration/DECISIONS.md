# Feature 6.0: Web Search Integration - Decisions Log

**Date**: January 2025
**Decision Authority**: User (Anand)
**Status**: Approved for Implementation

---

## User Decisions on Open Questions

### Decision 1: Search Activation Strategy
**Question**: How should web search be triggered?

**Decision**: **C) Hybrid (Auto-trigger + Explicit Prefix)** ✅

**Implementation**:
- Auto-trigger on keywords: "current", "latest", "recent", "today", "2025", "2024", "top 5", "market cap", "statistics", "data on"
- Support explicit prefix: "Search:", "Look up:", "Find:"
- Default: `enableSearch: true` in API endpoint

**Rationale**: Balances convenience with user control. Power users can force searches, casual users get automatic detection.

---

### Decision 2: Default Daily Budget
**Question**: What daily spending limit should be set?

**Decision**: **B) $10/day** ✅

**Implementation**:
- Environment variable: `PERPLEXITY_DAILY_BUDGET_USD=10`
- Hard limit: Stop searches when budget reached
- Sufficient for ~1,666 searches/day
- Supports 100-200 diagram requests with search

**Rationale**: Balanced budget that prevents bill shock while supporting typical usage patterns.

---

### Decision 3: Citation Display in Diagrams
**Question**: How should sources be cited in diagrams?

**Decision**: **C) Both (Inline + Footer)** ✅

**Implementation**:
- Inline citations: [1], [2], [3] within diagram content
- Footer section: List all sources with URLs
- Format: `[1] Source Title - https://source.url`
- GPT-4o instructed to include both

**Rationale**: Follows academic standards, allows source verification, most transparent approach.

---

### Decision 4: Error Messaging to Users
**Question**: How should search failures be communicated?

**Decision**: **B) Warning Badge** ✅

**Implementation**:
- Small warning icon (⚠️) in diagram header when search fails
- Hover tooltip: "Web search unavailable: [reason]"
- Metadata includes: `searchError: "description"`
- Non-intrusive, doesn't block user workflow

**Rationale**: Informs users without being disruptive, maintains clean UI, details available on hover.

---

### Decision 5: Model Selection
**Question**: How should Perplexity models be selected?

**Decision**: **C) Intelligent Selection** ✅

**Implementation**:
```typescript
function selectModel(query: string): 'sonar' | 'sonar-pro' {
  const complexTriggers = ['analyze', 'compare', 'explain why', 'evaluate'];
  const isComplex = complexTriggers.some(t => query.toLowerCase().includes(t));
  const isLong = query.length > 300;

  return (isComplex || isLong) ? 'sonar-pro' : 'sonar';
}
```

**Cost Impact**:
- Default (sonar): $0.0056 per search
- Complex (sonar-pro): $0.015 per search
- 90% sonar, 10% sonar-pro → Average: $0.0065 per search

**Rationale**: Optimizes cost/quality tradeoff automatically. Simple data queries use cheap model, complex analysis gets better model.

---

## Configuration Summary

### Environment Variables
```bash
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PERPLEXITY_MAX_REQUESTS_PER_MINUTE=60
PERPLEXITY_DAILY_BUDGET_USD=10
```

### Feature Flags
```typescript
FEATURES.WEB_SEARCH = true (if PERPLEXITY_API_KEY present)
```

### Default Behavior
- Search: Auto-trigger on keywords + explicit prefix support
- Budget: $10/day hard limit
- Citations: Both inline [1] and footer list
- Errors: Warning badge with hover tooltip
- Model: Intelligent selection (sonar → sonar-pro)

---

## Risk Acceptance

**Accepted Risks**:
1. ✅ In-memory usage tracking resets on server restart (acceptable for stateless app)
2. ✅ Rate limiting may be imperfect in multi-instance serverless (start conservative, monitor)
3. ✅ Cost estimation may vary ±20% from projections (budget limits protect)
4. ✅ Citation formatting depends on GPT-4o compliance (acceptable, can post-process later)

**Mitigations Approved**:
- Start with conservative limits (30/min for MVP)
- Monitor usage closely first week
- Adjust limits based on actual data
- Consider Redis/database for persistent tracking if needed in future

---

## Next Steps (Approved)

1. ✅ **Design Phase**: Create DESIGN.md with implementation details
2. ✅ **Implementation**: Backend engineer develops modules
3. ✅ **Testing**: Unit + integration + manual tests
4. ✅ **Documentation**: Update STATUS.md, API docs
5. ✅ **Deployment**: Configure environment, deploy

**Timeline**: 13-17 hours from approval to completion

---

**Approved By**: User (Anand)
**Date**: January 2025
**Status**: Proceeding to Design Phase
