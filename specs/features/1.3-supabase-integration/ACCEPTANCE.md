# Feature 1.3 - Supabase Integration: Acceptance Criteria

**Feature ID**: 1.3
**Feature Name**: Supabase Integration
**Status**: Not Started
**Test Date**: TBD

---

## 📋 Overview

This document provides detailed, measurable acceptance criteria for Feature 1.3 - Supabase Integration. All criteria must pass before marking this feature as complete.

---

## ✅ Acceptance Criteria

### 1. Database Schema Creation

#### AC-1.1: All Tables Created

**Given** the migration script is executed
**When** I query the database schema
**Then** all 8 tables must exist:

- [x] `users`
- [x] `templates`
- [x] `reports`
- [x] `audio_files`
- [x] `transcriptions`
- [x] `subscriptions`
- [x] `usage_records`
- [x] `subscription_limits`

**Verification**:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected**: 8 tables listed

---

#### AC-1.2: Primary Keys Defined

**Given** all tables are created
**When** I check table constraints
**Then** each table must have a PRIMARY KEY constraint on `id` column

**Verification**:

```sql
SELECT table_name, constraint_type
FROM information_schema.table_constraints
WHERE constraint_type = 'PRIMARY KEY'
  AND table_schema = 'public'
ORDER BY table_name;
```

**Expected**: 8 PRIMARY KEY constraints

---

#### AC-1.3: Foreign Keys Defined

**Given** all tables are created
**When** I check foreign key relationships
**Then** the following foreign keys must exist:

| Child Table    | Column          | Parent Table  | Parent Column |
| -------------- | --------------- | ------------- | ------------- |
| users          | id              | auth.users    | id            |
| templates      | user_id         | users         | id            |
| reports        | user_id         | users         | id            |
| reports        | template_id     | templates     | id            |
| audio_files    | user_id         | users         | id            |
| transcriptions | user_id         | users         | id            |
| transcriptions | audio_file_id   | audio_files   | id            |
| subscriptions  | user_id         | users         | id            |
| usage_records  | user_id         | users         | id            |
| usage_records  | subscription_id | subscriptions | id            |
| usage_records  | report_id       | reports       | id            |

**Verification**:

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

**Expected**: 11 foreign key relationships

---

#### AC-1.4: Indexes Created

**Given** all tables are created
**When** I check database indexes
**Then** all indexes specified in the schema must exist

**Verification**:

```sql
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**Expected Indexes** (minimum):

- `idx_users_email`
- `idx_users_stripe_customer_id`
- `idx_templates_user_id`
- `idx_templates_modality`
- `idx_templates_body_part`
- `idx_templates_tags`
- `idx_reports_user_id`
- `idx_reports_template_id`
- `idx_reports_scan_type`
- `idx_reports_status`
- `idx_reports_created_at`
- `idx_audio_files_user_id`
- `idx_audio_files_created_at`
- `idx_transcriptions_user_id`
- `idx_transcriptions_audio_file_id`
- `idx_subscriptions_user_id`
- `idx_subscriptions_stripe_subscription_id`
- `idx_subscriptions_status`
- `idx_usage_records_user_id`
- `idx_usage_records_billing_period`
- `idx_usage_records_usage_type`

**Expected**: At least 20 indexes

---

#### AC-1.5: Triggers Created

**Given** all tables with `updated_at` column are created
**When** I check database triggers
**Then** triggers must exist for:

- [x] `users.updated_at`
- [x] `templates.updated_at`
- [x] `reports.updated_at`
- [x] `subscriptions.updated_at`

**Verification**:

```sql
SELECT
  event_object_table,
  trigger_name
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table;
```

**Expected**: 4 `set_updated_at` triggers

---

#### AC-1.6: CHECK Constraints Enforced

**Given** all tables are created
**When** I attempt to insert invalid data
**Then** CHECK constraints must prevent:

- Invalid `mode` values in `reports` (only 'espresso' or 'slow_brewed')
- Invalid `status` values in `reports` (only 'draft', 'final', 'archived')
- Invalid `plan_name` values in `subscriptions` (only 'free', 'professional', 'practice', 'enterprise')
- Invalid `status` values in `subscriptions` (only 'active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid')
- Invalid `interval` values in `subscriptions` (only 'month', 'year')
- Invalid `usage_type` values in `usage_records` (only 'report_generated', 'transcription', 'export', 'api_call')

**Verification Test**:

```sql
-- Should fail
INSERT INTO reports (user_id, scan_type, findings, mode)
VALUES ('00000000-0000-0000-0000-000000000000', 'CT Chest', 'Test', 'invalid_mode');
```

**Expected**: Error with constraint violation

---

#### AC-1.7: Subscription Limits Seeded

**Given** the migration is complete
**When** I query the `subscription_limits` table
**Then** it must contain 4 plans with correct limits:

| plan_name    | reports_per_month | templates_limit | storage_gb | slow_brewed_mode |
| ------------ | ----------------- | --------------- | ---------- | ---------------- |
| free         | 5                 | 3               | 1          | FALSE            |
| professional | 100               | 50              | 10         | TRUE             |
| practice     | 500               | 200             | 50         | TRUE             |
| enterprise   | 999999            | 999999          | 500        | TRUE             |

**Verification**:

```sql
SELECT plan_name, reports_per_month, templates_limit, storage_gb, slow_brewed_mode
FROM subscription_limits
ORDER BY reports_per_month;
```

**Expected**: 4 rows with exact values above

---

### 2. Row Level Security (RLS)

#### AC-2.1: RLS Enabled on All Tables

**Given** all tables are created
**When** I check RLS status
**Then** RLS must be enabled on all 8 tables

**Verification**:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected**: `rowsecurity = true` for all 8 tables

---

#### AC-2.2: Users Can Only Access Own Data

**Given** two test users exist (User A and User B)
**When** User A queries their templates
**Then** only User A's templates are returned
**And** User B's templates are not visible

**Test Script**:

```javascript
// As User A
const { data: userATemplates } = await supabase.from('templates').select('*');

// Verify all templates belong to User A
assert(userATemplates.every((t) => t.user_id === userA.id));
```

**Expected**: Pass for all user-facing tables (templates, reports, audio_files, transcriptions, subscriptions, usage_records)

---

#### AC-2.3: Users Cannot Access Other Users' Data

**Given** User A is authenticated
**When** User A attempts to query User B's data directly
**Then** the query returns empty result or error

**Test Script**:

```javascript
// As User A, try to get User B's templates
const { data, error } = await supabase.from('templates').select('*').eq('user_id', userB.id);

// Should return empty array (RLS blocks)
assert(data.length === 0);
```

**Expected**: Empty result, no error

---

#### AC-2.4: Service Role Bypasses RLS

**Given** admin client using service role key
**When** admin queries any table
**Then** all data is visible regardless of RLS policies

**Test Script**:

```javascript
// Using service role key
const adminSupabase = createSupabaseAdminClient();

const { data: allTemplates } = await adminSupabase.from('templates').select('*');

// Should return all templates from all users
assert(allTemplates.length > 0);
```

**Expected**: All data visible

---

#### AC-2.5: Subscription Limits Readable by All

**Given** any authenticated user
**When** user queries `subscription_limits` table
**Then** all plan limits are visible

**Test Script**:

```javascript
const { data: limits } = await supabase.from('subscription_limits').select('*');

assert(limits.length === 4);
```

**Expected**: 4 plans returned

---

### 3. Supabase Client Configuration

#### AC-3.1: Server Client Created

**Given** the server client file exists
**When** I import and call `createSupabaseServerClient()`
**Then** a valid Supabase client instance is returned
**And** the client uses cookies for session management

**Verification**:

```typescript
import { createSupabaseServerClient } from '@/lib/database/supabase-server';

const supabase = createSupabaseServerClient();
assert(supabase !== null);
assert(typeof supabase.auth.getSession === 'function');
```

**Expected**: Client instance created successfully

---

#### AC-3.2: Browser Client Created

**Given** the browser client file exists
**When** I import and call `createSupabaseBrowserClient()`
**Then** a valid Supabase client instance is returned

**Verification**:

```typescript
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';

const supabase = createSupabaseBrowserClient();
assert(supabase !== null);
```

**Expected**: Client instance created successfully

---

#### AC-3.3: Middleware Client Created

**Given** the middleware client file exists
**When** I import and call `createSupabaseMiddlewareClient(request)`
**Then** a valid Supabase client and response object are returned

**Verification**:

```typescript
import { createSupabaseMiddlewareClient } from '@/lib/database/supabase-middleware';

const { supabase, response } = createSupabaseMiddlewareClient(request);
assert(supabase !== null);
assert(response !== null);
```

**Expected**: Client and response created successfully

---

#### AC-3.4: Admin Client Created

**Given** the server client file exists
**When** I call `createSupabaseAdminClient()`
**Then** a valid Supabase client with service role privileges is returned

**Verification**:

```typescript
import { createSupabaseAdminClient } from '@/lib/database/supabase-server';

const adminSupabase = createSupabaseAdminClient();
assert(adminSupabase !== null);

// Should bypass RLS
const { data } = await adminSupabase.from('users').select('*');
assert(data !== null);
```

**Expected**: Admin client bypasses RLS

---

### 4. Database Utilities

#### AC-4.1: getUserProfile() Works

**Given** a valid user exists
**When** I call `getUserProfile(supabase, userId)`
**Then** the user's profile data is returned

**Test**:

```typescript
const profile = await getUserProfile(supabase, testUserId);
assert(profile.id === testUserId);
assert(profile.email !== null);
```

**Expected**: User profile returned

---

#### AC-4.2: getActiveSubscription() Works

**Given** a user with an active subscription
**When** I call `getActiveSubscription(supabase, userId)`
**Then** the subscription data is returned

**Test**:

```typescript
const subscription = await getActiveSubscription(supabase, testUserId);
assert(subscription.status === 'active');
```

**Expected**: Active subscription returned

---

#### AC-4.3: getActiveSubscription() Returns Null When No Subscription

**Given** a user without an active subscription
**When** I call `getActiveSubscription(supabase, userId)`
**Then** `null` is returned (not an error)

**Test**:

```typescript
const subscription = await getActiveSubscription(supabase, newUserId);
assert(subscription === null);
```

**Expected**: `null` returned

---

#### AC-4.4: getSubscriptionLimits() Works

**Given** a valid plan name
**When** I call `getSubscriptionLimits(supabase, 'professional')`
**Then** the plan limits are returned

**Test**:

```typescript
const limits = await getSubscriptionLimits(supabase, 'professional');
assert(limits.reports_per_month === 100);
assert(limits.templates_limit === 50);
```

**Expected**: Plan limits returned

---

#### AC-4.5: getCurrentUsage() Works

**Given** usage records exist for a user
**When** I call `getCurrentUsage(supabase, userId, 'report_generated', startDate, endDate)`
**Then** the correct count of usage records is returned

**Test**:

```typescript
// Create 3 test usage records
await createTestUsageRecords(3);

const count = await getCurrentUsage(
  supabase,
  testUserId,
  'report_generated',
  billingStart,
  billingEnd
);

assert(count === 3);
```

**Expected**: Accurate usage count

---

### 5. Connection & Integration Tests

#### AC-5.1: Server Component Can Query Database

**Given** a Next.js server component
**When** the component fetches data using server client
**Then** data is successfully retrieved

**Test**: Create test server component that queries database

**Expected**: No errors, data retrieved

---

#### AC-5.2: Client Component Can Query Database

**Given** a Next.js client component
**When** the component fetches data using browser client
**Then** data is successfully retrieved

**Test**: Create test client component that queries database

**Expected**: No errors, data retrieved

---

#### AC-5.3: API Route Can Query Database

**Given** a Next.js API route
**When** the route fetches data using server client
**Then** data is successfully retrieved

**Test**: Create test API route that queries database

**Expected**: No errors, data retrieved

---

#### AC-5.4: Database Connection Latency < 100ms

**Given** a database query is executed
**When** I measure the query execution time
**Then** the latency must be less than 100ms

**Test**:

```typescript
const start = Date.now();
await supabase.from('users').select('*').limit(1);
const latency = Date.now() - start;

assert(latency < 100);
```

**Expected**: Latency < 100ms

---

### 6. Error Handling

#### AC-6.1: Invalid User ID Returns Error

**Given** an invalid user ID
**When** I query user profile
**Then** an appropriate error is thrown

**Test**:

```typescript
try {
  await getUserProfile(supabase, 'invalid-uuid');
  assert.fail('Should have thrown error');
} catch (error) {
  assert(error !== null);
}
```

**Expected**: Error thrown

---

#### AC-6.2: Missing Environment Variables Detected

**Given** Supabase URL or key is missing
**When** I create a client
**Then** an error is thrown

**Test**: Remove env vars and attempt client creation

**Expected**: Error thrown with clear message

---

### 7. TypeScript Compliance

#### AC-7.1: No TypeScript Errors

**Given** all client files are created
**When** I run `npm run type-check`
**Then** no TypeScript errors exist

**Verification**:

```bash
npm run type-check
```

**Expected**: Exit code 0, no errors

---

#### AC-7.2: Proper Types Exported

**Given** database helper functions exist
**When** I use them in TypeScript code
**Then** all parameters and return values are properly typed

**Expected**: IDE autocomplete works, no type errors

---

### 8. Documentation

#### AC-8.1: Migration File Has Comments

**Given** the migration SQL file exists
**When** I open the file
**Then** each table and major section has explanatory comments

**Expected**: Clear comments throughout

---

#### AC-8.2: Client Usage Examples Documented

**Given** client files exist
**When** I read the SPEC.md
**Then** code examples show how to use each client

**Expected**: Examples present for server, browser, middleware, admin clients

---

#### AC-8.3: RLS Policies Documented

**Given** RLS policies are created
**When** I read the SPEC.md
**Then** each policy is explained with its purpose

**Expected**: All policies documented

---

## 📊 Test Summary

| Category                 | Total Criteria | Status          |
| ------------------------ | -------------- | --------------- |
| Database Schema          | 7              | ⏳ Pending      |
| Row Level Security       | 5              | ⏳ Pending      |
| Client Configuration     | 4              | ⏳ Pending      |
| Database Utilities       | 5              | ⏳ Pending      |
| Connection & Integration | 4              | ⏳ Pending      |
| Error Handling           | 2              | ⏳ Pending      |
| TypeScript Compliance    | 2              | ⏳ Pending      |
| Documentation            | 3              | ⏳ Pending      |
| **TOTAL**                | **32**         | **0% Complete** |

---

## 🎯 Definition of Done

Feature 1.3 is considered **COMPLETE** when:

- [ ] All 32 acceptance criteria pass
- [ ] All tables created with correct schema
- [ ] RLS enabled and tested on all tables
- [ ] All 4 client types functional
- [ ] All 5 database utilities working
- [ ] No TypeScript errors
- [ ] Migration file committed to repository
- [ ] Documentation complete
- [ ] Code reviewed against specification
- [ ] Feature marked complete in STATUS.md

---

## 🧪 Test Execution Log

| AC ID  | Status | Tested By | Date | Notes |
| ------ | ------ | --------- | ---- | ----- |
| AC-1.1 | ⏳     | -         | -    | -     |
| AC-1.2 | ⏳     | -         | -    | -     |
| ...    | ⏳     | -         | -    | -     |

---

**Acceptance Criteria Version**: 1.0
**Last Updated**: 2025-01-16
**Prepared By**: Requirements Analyst Agent
