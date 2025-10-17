# Feature 7.0: GPT-5 Reasoning Model Integration - Decisions

**Feature ID**: 7.0
**Feature Name**: GPT-5 Reasoning Model Integration
**Date**: 2025-01-17
**Decision Authority**: User Approval
**Status**: ✅ APPROVED

---

## Decision Log

All 5 configuration decisions have been approved by the user with the recommended options.

**User Approval**: "go ahead, follow process strictly"

---

## Decision 1: Feature Flag Default

**Question**: Should GPT-5 be enabled by default or require explicit opt-in?

**Options Considered**:
- A. `GPT5_ENABLED=false` (Gradual rollout) ✅
- B. `GPT5_ENABLED=true` (Immediate for all users)

**Decision**: **Option A - GPT5_ENABLED=false**

**Rationale**:
- Gradual rollout allows A/B testing and metrics comparison
- Safe validation before full deployment
- Instant rollback capability if issues arise
- No breaking changes for existing users
- Proven pattern from Feature 6.0 (Web Search)

**Implementation**:
```bash
# .env.example and .env.local
GPT5_ENABLED=false  # Default: disabled, requires explicit opt-in
```

**Rollout Plan**:
1. Week 1: Internal testing with GPT5_ENABLED=true
2. Week 2: Enable for 10% of production traffic
3. Week 3: Increase to 50% if metrics positive
4. Week 4: Enable for 100% of traffic
5. Rollback available at any step by setting flag to false

---

## Decision 2: Default Reasoning Effort

**Question**: What default reasoning effort level should we use?

**Options Considered**:
- A. `minimal` (Fastest, cheapest, lowest quality)
- B. `low` (Fast, cheap, good for most)
- C. `medium` (Balanced, OpenAI default) ✅
- D. `high` (Slowest, most expensive, highest quality)

**Decision**: **Option C - medium**

**Rationale**:
- OpenAI's recommended default for balanced quality/speed/cost
- Auto-selects `minimal` for simple diagrams (e.g., "basic org chart")
- Auto-selects `high` for complex diagrams (e.g., "complete system architecture")
- Can be overridden via environment variable if needed
- Provides best average performance across diverse use cases

**Implementation**:
```bash
# .env.example and .env.local
GPT5_REASONING_EFFORT=medium  # Options: minimal, low, medium, high
```

**Auto-Selection Logic**:
- Simple diagrams (< 50 chars, basic keywords) → `minimal`
- Medium diagrams (50-200 chars) → `medium`
- Complex diagrams (> 200 chars, multi-step keywords) → `high`

---

## Decision 3: Fallback Chain

**Question**: Which fallback chain should we implement?

**Options Considered**:
- A. GPT-5 only (No fallback)
- B. GPT-5 → gpt-4o (Simple two-model chain)
- C. GPT-5 → o3-mini → gpt-4o (Three-model chain with reasoning fallback) ✅
- D. GPT-5 → o3 → gpt-4o (Use full o3 instead of o3-mini)

**Decision**: **Option C - GPT-5 → o3-mini → gpt-4o**

**Rationale**:
- **GPT-5 (Primary)**: Best quality, cost-effective, fast
- **o3-mini (Fallback 1)**: Reasoning model for complex tasks if GPT-5 fails ($1 input / $5 output)
- **gpt-4o (Fallback 2)**: Proven reliable, widely available, final safety net
- Cost-effective: o3-mini cheaper than full o3 ($5 vs $20 output)
- High availability: Three-tier ensures uptime > 99.9%
- Graceful degradation: Maintains reasoning capabilities through o3-mini

**Implementation**:
```typescript
// lib/ai/model-config.ts
fallbackChain: ['o3-mini', 'gpt-4o']
```

**Fallback Triggers**:
- Rate limit (429)
- Model unavailable (404, model_not_found)
- Service overload (503)
- Server error (500, 502)
- Timeout (> 30 seconds)

**Non-Retryable Errors** (no fallback):
- Authentication error (401) - fix API key
- Invalid request (400) - fix input
- Content policy violation (400) - adjust prompt

---

## Decision 4: Cost Tracking Visibility

**Question**: How should cost tracking be exposed to users/admins?

**Options Considered**:
- A. Logs Only (Console logs only)
- B. API Response (Include estimatedCost in metadata) ✅
- C. Dashboard (Future: Build cost dashboard)
- D. Alerts (Set up cost alerts)

**Decision**: **Option B - API Response (metadata)**

**Rationale**:
- Users/admins can see cost per diagram immediately in API response
- No additional infrastructure required (stateless architecture maintained)
- Helps with budget planning and cost awareness
- Simple to implement (add `estimatedCost` field to metadata)
- Future-proof: Can add dashboard (Option C) or alerts (Option D) later

**Implementation**:
```typescript
// lib/ai/diagram-generator.ts
metadata: {
  model: 'gpt-5',
  tokensUsed: 3200,
  // ... other fields
  estimatedCost: 0.0132, // NEW: USD cost estimate
}
```

**Cost Calculation**:
```typescript
const estimatedCost = estimateModelCost(
  currentModel,
  response.usage?.prompt_tokens || 1000,
  response.usage?.completion_tokens || 2000
);
```

**Future Enhancement** (Phase 8+):
- Option C: Build admin dashboard to visualize costs over time
- Option D: Email/Slack alerts when daily/monthly budgets exceeded

---

## Decision 5: A/B Testing Approach

**Question**: What A/B testing strategy should we use?

**Options Considered**:
- A. No A/B Testing (Enable for all immediately)
- B. Manual Rollout (Start with 10%, increase gradually) ✅
- C. Automated Canary (Next.js middleware routing)
- D. Feature Flag Service (LaunchDarkly/Optimizely)

**Decision**: **Option B - Manual Rollout**

**Rationale**:
- Simple and controlled for MVP
- No additional infrastructure or services required
- Low-risk: Set `GPT5_ENABLED=true` on subset of instances
- Monitor metrics (cost, speed, quality, errors) at each stage
- Expand gradually: 0% → 10% → 50% → 100%
- Instant rollback by toggling feature flag

**Implementation Plan**:

**Phase 1: Internal Testing (Week 1)**
- Set `GPT5_ENABLED=true` on local/staging environments
- Test all features: simple diagrams, complex diagrams, fallback chain
- Validate metrics: cost savings, speed improvements, quality

**Phase 2: 10% Production Traffic (Week 2)**
- Deploy to 1 of 10 production instances with `GPT5_ENABLED=true`
- Monitor for 1 week:
  - Cost per diagram (target: 35-45% savings)
  - Generation time (target: < 30s)
  - Success rate (target: > 95%)
  - Fallback rate (target: < 5%)
  - User-reported issues (target: 0 critical)

**Phase 3: 50% Production Traffic (Week 3)**
- If metrics positive, enable on 5 of 10 instances
- Continue monitoring
- Compare GPT-5 cohort vs GPT-4o cohort

**Phase 4: 100% Production Traffic (Week 4)**
- If no issues, enable on all instances
- Mark feature complete
- Update documentation

**Rollback Procedure**:
- If issues detected, set `GPT5_ENABLED=false` immediately
- All traffic reverts to GPT-4o
- No code changes needed (feature flag)

**Future Enhancement** (Phase 8+):
- Option C: Implement automated canary with Next.js middleware
- Option D: Use LaunchDarkly for percentage-based rollout

---

## Summary of Approved Decisions

| Decision | Option | Value |
|----------|--------|-------|
| 1. Feature Flag Default | A | `GPT5_ENABLED=false` (gradual rollout) |
| 2. Default Reasoning Effort | C | `medium` (auto-select based on complexity) |
| 3. Fallback Chain | C | GPT-5 → o3-mini → gpt-4o |
| 4. Cost Tracking Visibility | B | API Response (metadata) |
| 5. A/B Testing Approach | B | Manual Rollout (10% → 50% → 100%) |

---

## Implementation Impact

### Environment Variables
```bash
# .env.example and .env.local
GPT5_ENABLED=false              # Decision 1
GPT5_REASONING_EFFORT=medium    # Decision 2
# Fallback chain hardcoded in model-config.ts (Decision 3)
# Cost in API response (Decision 4)
# Manual rollout via deployment (Decision 5)
```

### Code Changes
- `lib/ai/model-config.ts`: Implement fallback chain (Decision 3)
- `lib/ai/diagram-generator.ts`: Add estimatedCost to metadata (Decision 4)
- `.env.example`: Add GPT5_ENABLED and GPT5_REASONING_EFFORT (Decisions 1, 2)

### Rollout Timeline
- Week 1: Internal testing
- Week 2: 10% production (Deci Decision 5)
- Week 3: 50% production
- Week 4: 100% production

---

## Success Criteria Validation

**All decisions support the feature's success criteria:**

1. ✅ **Cost Reduction**: 35-45% savings (Decision 2: medium reasoning)
2. ✅ **High Availability**: > 99.9% uptime (Decision 3: three-tier fallback)
3. ✅ **Gradual Rollout**: Safe validation (Decision 1: disabled by default, Decision 5: manual rollout)
4. ✅ **Cost Visibility**: Users see costs (Decision 4: API response)
5. ✅ **Quality**: Optimal reasoning for each diagram (Decision 2: auto-select)

---

## Next Steps

1. ✅ **Gate 1 Passed**: Requirements approved with decisions documented
2. ⏳ **Design Phase**: Create DESIGN.md with implementation-ready specifications
3. ⏳ **Implementation**: Refactor code according to design
4. ⏳ **Testing**: Validate all acceptance criteria
5. ⏳ **Rollout**: Execute manual rollout plan (Week 1-4)

---

**Approved By**: User
**Approved Date**: 2025-01-17
**Next Phase**: Design (Gate 2)
**Status**: ✅ APPROVED - Ready for Design Phase

---

**END OF DECISIONS DOCUMENT**
