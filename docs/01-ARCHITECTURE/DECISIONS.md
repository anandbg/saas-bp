# Architecture Decision Record (ADR)
## Supabase Auth + Stripe Billing vs. Outseta

**Date**: January 2025
**Status**: Approved
**Decision Maker**: Development Team + Stakeholder

---

## Context

The Radiology Reporting App requires modern authentication and subscription billing capabilities. We evaluated two approaches:

1. **Outseta**: All-in-one SaaS platform (Auth + Billing + CRM)
2. **Supabase Auth + Stripe**: Best-of-breed combination

---

## Decision

**We chose Supabase Auth + Stripe** for the following reasons:

### ✅ Advantages

#### Cost Savings
- **Base Cost**: $0/month (vs. $50-150/month for Outseta)
- **Transaction Fees**: Same 2.9% + $0.30 (both use Stripe underneath)
- **Annual Savings**: ~$600-1,800/year at 100-1000 users

#### Technical Benefits
1. **Tighter Integration**
   - Supabase Auth natively integrated with Supabase database
   - Row Level Security (RLS) works out-of-the-box
   - No data synchronization between services

2. **Full Control**
   - Complete ownership of auth flow
   - Customize every aspect of UX
   - Direct access to user data
   - No vendor lock-in

3. **Industry Standards**
   - Stripe is the gold standard for payments
   - Proven scalability (millions of businesses)
   - Extensive documentation and community

4. **Developer Experience**
   - TypeScript support throughout
   - Auto-generated types from database schema
   - Excellent Next.js integration
   - Better debugging capabilities

#### Feature Parity

| Feature | Outseta | Supabase + Stripe | Winner |
|---------|---------|-------------------|--------|
| Email/Password Auth | ✅ | ✅ | Tie |
| OAuth (Google, GitHub) | ✅ | ✅ | Tie |
| Subscription Billing | ✅ | ✅ | Tie |
| Usage Tracking | ✅ | ✅ (custom) | Tie |
| Customer Portal | ✅ | ✅ (Stripe Portal) | Tie |
| Webhook Events | ✅ | ✅ | Tie |
| Invoice Management | ✅ | ✅ | Tie |
| CRM Features | ✅ | ❌ | Outseta |
| Database Integration | ⚠️ (external) | ✅ (native) | Supabase |
| Customization | ❌ (limited) | ✅ (full) | Supabase |
| Cost | ❌ ($50-150/mo) | ✅ ($0 base) | Supabase |

### ❌ Disadvantages

1. **Setup Complexity**
   - Requires 2-3 days additional development
   - More code to maintain
   - Need to implement CRM separately (if needed)

2. **Missing Features**
   - No built-in CRM
   - No built-in customer support portal
   - Manual user management UI

3. **Development Time**
   - +8 hours setup time vs. Outseta
   - Custom billing dashboard required
   - More testing surface area

---

## Implementation Impact

### What Changes

**Authentication Flow**:
```
OLD (Outseta):
User → Outseta Hosted Pages → OAuth → Callback → Sync to Supabase

NEW (Supabase):
User → Custom UI → Supabase Auth API → JWT → Direct Access
```

**Database Schema**:
- Remove `outseta_id` field
- Add `stripe_customer_id` field
- Link `users.id` directly to `auth.users(id)`
- Add `usage_records` table
- Add `subscription_limits` table

**API Routes**:
```
OLD:
/api/auth/outseta/callback
/api/webhooks/outseta

NEW:
/api/auth/callback (Supabase)
/api/billing/checkout
/api/billing/portal
/api/webhooks/stripe
```

### What Stays the Same

- Core report generation logic (preserved exactly)
- Template management
- Audio transcription
- All business logic from original app
- Database structure (mostly)
- Deployment strategy (Vercel)

---

## Cost Analysis

### Monthly Infrastructure Costs

| Service | Outseta Plan | Supabase + Stripe Plan |
|---------|-------------|----------------------|
| Base | $50-150 | $0 |
| Vercel | $20 | $20 |
| Supabase | $25 | $25 |
| OpenAI | $20-50 | $20-50 |
| Transaction Fees | 2.9% + $0.30 | 2.9% + $0.30 |
| **Total Base** | **$115-245/month** | **$65-95/month** |
| **Savings** | — | **$50-150/month** |

### Break-Even Analysis

**At 100 customers ($3,000/mo revenue)**:
- Outseta: $150 base + $111 fees = $261/month
- Supabase + Stripe: $0 base + $111 fees = $111/month
- **Savings**: $150/month = $1,800/year

**At 1,000 customers ($30,000/mo revenue)**:
- Outseta: $150 base + $1,110 fees = $1,260/month
- Supabase + Stripe: $0 base + $1,110 fees = $1,110/month
- **Savings**: $150/month = $1,800/year

**Conclusion**: Savings remain constant regardless of scale since both use Stripe for transactions.

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Auth implementation bugs | Medium | High | Thorough testing, use proven libraries |
| Stripe webhook failures | Low | High | Retry logic, idempotency, monitoring |
| Usage tracking errors | Medium | High | Double-check logic, add alerts |
| RLS policy mistakes | Medium | High | Test with multiple users, code review |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Longer time to market | Medium | Medium | Acceptable trade-off for cost savings |
| Missing CRM features | Low | Low | Build custom admin panel if needed |
| Stripe account issues | Low | Critical | Have backup payment processor ready |
| Increased maintenance | Medium | Low | Well-documented code, tests |

---

## Alternatives Considered

### Option 1: Outseta (Rejected)
**Pros**: Quick setup, all-in-one, CRM included
**Cons**: High cost, limited customization, vendor lock-in
**Verdict**: Cost too high for early stage

### Option 2: Auth0 + Stripe (Rejected)
**Pros**: Enterprise auth, excellent OAuth
**Cons**: Higher cost than Supabase, less integrated
**Verdict**: Supabase provides better value

### Option 3: Custom Auth + Stripe (Rejected)
**Pros**: Full control
**Cons**: Security risks, too much work, not worth it
**Verdict**: Supabase Auth provides security without overhead

### Option 4: Supabase Auth + Stripe (Selected) ✅
**Pros**: Best balance of cost, features, and control
**Cons**: Moderate setup complexity
**Verdict**: Optimal choice for our requirements

---

## Success Criteria

### Must Have (Phase 1-2)
- [ ] User can sign up with email/password
- [ ] User can log in with OAuth (Google, GitHub)
- [ ] User can subscribe to a plan
- [ ] Stripe webhook processes events correctly
- [ ] Usage limits enforced per plan
- [ ] User can upgrade/downgrade plans
- [ ] User can access Stripe Customer Portal

### Nice to Have (Phase 3-4)
- [ ] Magic link authentication
- [ ] Team/organization support
- [ ] Custom admin dashboard
- [ ] Advanced usage analytics
- [ ] Automated dunning emails

---

## Timeline

**Total Additional Time**: +8 hours vs. Outseta

| Task | Time |
|------|------|
| Supabase Auth setup | +2 hours |
| Stripe integration | +4 hours |
| Usage tracking | +2 hours |
| **Total** | **8 hours** |

**ROI**: Break-even at 0.16 months ($150 savings/month ÷ $940 hourly cost) = **5 days**

---

## Rollback Plan

If Supabase + Stripe proves problematic:

1. **Immediate** (< 1 week):
   - Keep using test environment
   - Evaluate Outseta trial

2. **Short-term** (1-2 weeks):
   - Migrate to Outseta if critical issues
   - Export user data from Supabase
   - Configure Outseta products

3. **Long-term** (1+ month):
   - Consider Auth0 if auth is the issue
   - Keep Stripe (proven working)

**Likelihood of rollback**: <5%

---

## Monitoring & Success Metrics

### Key Metrics to Track

1. **Authentication**
   - Sign-up conversion rate
   - Login success rate
   - OAuth vs. email/password ratio
   - Password reset requests

2. **Billing**
   - Subscription creation rate
   - Failed payment rate
   - Churn rate
   - Upgrade/downgrade frequency

3. **Usage**
   - Reports generated per user
   - Users hitting limits
   - Average usage by plan tier
   - Feature adoption rate

4. **Technical**
   - Auth latency
   - Webhook processing time
   - Database query performance
   - API error rates

### Alerts

- Webhook failure rate > 1%
- Auth error rate > 0.1%
- Failed payments > 5%
- Database query time > 500ms

---

## Documentation References

- **BLUEPRINT.md**: Updated with Supabase + Stripe architecture
- **TECHNICAL_DESIGN.md**: Implementation patterns
- **STRIPE_INTEGRATION.md**: Stripe setup guide
- **IMPLEMENTATION_PLAN_REVISED.md**: Phase-by-phase plan
- **IMPLEMENTATION_STATUS.md**: Progress tracking

---

## Decision Log

### January 2025
- **Decision**: Use Supabase Auth + Stripe instead of Outseta
- **Rationale**: Cost savings ($600-1,800/year), better integration, full control
- **Trade-off**: +8 hours development time vs. missing CRM features
- **Impact**: All Phase 1 features, database schema, API routes
- **Approved by**: Development Team + Stakeholder

---

## Conclusion

**Supabase Auth + Stripe** provides the best balance of:
- ✅ Cost-effectiveness ($50-150/month savings)
- ✅ Technical excellence (native integration)
- ✅ Full control (customization)
- ✅ Industry standards (Stripe)
- ⚠️ Acceptable trade-off (+8 hours dev time)

The decision is sound for an early-stage application prioritizing cost efficiency and technical flexibility over speed-to-market and pre-built CRM features.

---

**Status**: ✅ Approved and Ready for Implementation
**Next Step**: Phase 1.1 - Project Initialization
