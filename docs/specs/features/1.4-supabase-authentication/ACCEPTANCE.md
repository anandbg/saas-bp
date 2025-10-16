# Acceptance Criteria - Feature 1.4: Supabase Authentication

## Overview

This document defines the acceptance criteria, test scenarios, edge cases, and success metrics for Feature 1.4: Supabase Authentication. All criteria must be met before the feature is considered complete.

---

## Functional Acceptance Criteria

### AC-1: Email/Password Signup

**Scenario 1.1: Successful Signup**
- GIVEN: A new user with valid email and password
- WHEN: User submits signup form
- THEN:
  - Account is created in Supabase Auth
  - Verification email is sent
  - User sees "Check your email" message
  - User profile is created in users table with matching UUID

**Scenario 1.2: Email Already Exists**
- GIVEN: An email that is already registered
- WHEN: User attempts to sign up with that email
- THEN:
  - System displays "Email already registered"
  - No new account is created
  - User can click "Log in instead"

**Scenario 1.3: Weak Password**
- GIVEN: A password that doesn't meet requirements
- WHEN: User submits signup form
- THEN:
  - System displays specific validation errors:
    - "Password must be at least 8 characters"
    - "Password must include uppercase letter"
    - "Password must include number"
    - "Password must include special character"
  - Form is not submitted

**Scenario 1.4: Invalid Email**
- GIVEN: An invalid email format
- WHEN: User submits signup form
- THEN:
  - System displays "Please enter a valid email address"
  - Form is not submitted

**Scenario 1.5: Email Verification**
- GIVEN: A user who just signed up
- WHEN: User clicks the verification link in email
- THEN:
  - Email is marked as verified in Supabase
  - User is redirected to dashboard
  - Session is created automatically
  - Welcome message is displayed

### AC-2: Email/Password Login

**Scenario 2.1: Successful Login**
- GIVEN: A registered user with correct credentials
- WHEN: User submits login form
- THEN:
  - User is authenticated
  - Session cookie is set with proper security attributes
  - User is redirected to dashboard (or returnUrl if present)
  - User profile is loaded

**Scenario 2.2: Invalid Credentials**
- GIVEN: Incorrect email or password
- WHEN: User submits login form
- THEN:
  - System waits 500ms (prevent timing attacks)
  - System displays "Invalid email or password"
  - Login form remains visible
  - No information about which field is wrong

**Scenario 2.3: Unverified Email**
- GIVEN: A user who hasn't verified their email
- WHEN: User attempts to log in
- THEN:
  - System displays "Please verify your email address"
  - System offers "Resend verification email" button
  - User cannot access dashboard

**Scenario 2.4: Rate Limiting**
- GIVEN: 5 failed login attempts from same IP
- WHEN: User attempts 6th login
- THEN:
  - System displays "Too many login attempts. Please try again in 15 minutes."
  - Login form is disabled temporarily
  - Countdown timer is shown

**Scenario 2.5: Return URL Preservation**
- GIVEN: User tried to access `/reports/123` without authentication
- WHEN: User successfully logs in
- THEN:
  - User is redirected to `/reports/123`
  - Not to generic dashboard

### AC-3: OAuth Authentication

**Scenario 3.1: Google OAuth Signup (New User)**
- GIVEN: A new user without an account
- WHEN: User clicks "Continue with Google"
- THEN:
  - User is redirected to Google consent screen
  - After approval, user returns to callback URL
  - New account is created with Google profile data
  - Email is automatically verified
  - Session is created
  - User is redirected to dashboard

**Scenario 3.2: Google OAuth Login (Existing User)**
- GIVEN: A user who previously signed up with Google
- WHEN: User clicks "Continue with Google"
- THEN:
  - User is redirected to Google (may skip consent if already granted)
  - User is authenticated
  - Session is created
  - User is redirected to dashboard

**Scenario 3.3: GitHub OAuth Signup**
- GIVEN: A new user clicking "Continue with GitHub"
- WHEN: OAuth flow completes
- THEN:
  - Account is created using GitHub email
  - Name and avatar are imported from GitHub profile
  - Email is marked as verified
  - Session is created
  - User sees dashboard

**Scenario 3.4: OAuth Error Handling**
- GIVEN: User cancels OAuth consent
- WHEN: User is redirected back to app
- THEN:
  - User sees error message "Authentication canceled"
  - User remains on login page
  - Can try again

**Scenario 3.5: OAuth Email Conflict**
- GIVEN: Email from OAuth already exists (signed up with password)
- WHEN: User tries OAuth with that email
- THEN:
  - Accounts are linked automatically
  - User is logged in
  - User can use either method in future

### AC-4: Password Reset

**Scenario 4.1: Request Password Reset**
- GIVEN: A registered email address
- WHEN: User requests password reset
- THEN:
  - Reset email is sent
  - System displays "If that email exists, we sent a reset link"
  - Email contains time-limited reset link (1 hour)

**Scenario 4.2: Reset Password Success**
- GIVEN: A valid reset token
- WHEN: User submits new password
- THEN:
  - Password is updated
  - All existing sessions are invalidated
  - Confirmation email is sent
  - User is redirected to login
  - Success message is shown

**Scenario 4.3: Expired Reset Token**
- GIVEN: A reset token older than 1 hour
- WHEN: User tries to reset password
- THEN:
  - System displays "Reset link expired"
  - System offers "Request new link" button
  - Old token is invalidated

**Scenario 4.4: Invalid Reset Token**
- GIVEN: A tampered or invalid token
- WHEN: User accesses reset page
- THEN:
  - System displays "Invalid reset link"
  - User is redirected to password reset request page

**Scenario 4.5: Rate Limiting Reset Requests**
- GIVEN: 3 reset requests for same email in 1 hour
- WHEN: 4th request is made
- THEN:
  - System displays "Too many reset requests. Please try again later."
  - No email is sent
  - User must wait 1 hour

### AC-5: Session Management

**Scenario 5.1: Session Creation**
- GIVEN: Successful authentication
- WHEN: User logs in
- THEN:
  - Access token is generated (expires in 1 hour)
  - Refresh token is generated (expires in 7 days)
  - Tokens are stored in HTTP-only cookies
  - Cookies have secure attributes:
    - httpOnly: true
    - secure: true (production only)
    - sameSite: 'lax'
    - maxAge: 604800 (7 days)

**Scenario 5.2: Automatic Token Refresh**
- GIVEN: An expired access token but valid refresh token
- WHEN: User accesses any protected route
- THEN:
  - Middleware detects expiration
  - Refresh token is used to get new access token
  - Cookies are updated with new tokens
  - Request proceeds without interruption
  - User doesn't notice refresh

**Scenario 5.3: Session Validation**
- GIVEN: A request to a protected route
- WHEN: Middleware runs
- THEN:
  - Session token is extracted from cookie
  - JWT signature is verified
  - Token expiration is checked
  - If valid, user context is added to request
  - If invalid, user is redirected to login

**Scenario 5.4: Logout**
- GIVEN: An authenticated user
- WHEN: User clicks logout
- THEN:
  - `signOut()` is called in Supabase
  - All auth cookies are cleared
  - User is redirected to login page
  - Previous session cannot be reused

**Scenario 5.5: Concurrent Sessions**
- GIVEN: User logged in on multiple devices
- WHEN: User logs out on one device
- THEN:
  - Only that device's session is terminated
  - Other devices remain logged in
  - Each session is independent

### AC-6: Route Protection

**Scenario 6.1: Access Protected Route (Authenticated)**
- GIVEN: An authenticated user
- WHEN: User navigates to `/dashboard`
- THEN:
  - Middleware validates session
  - User context is added to request headers
  - Page loads successfully
  - User sees dashboard content

**Scenario 6.2: Access Protected Route (Unauthenticated)**
- GIVEN: An unauthenticated user
- WHEN: User navigates to `/dashboard`
- THEN:
  - Middleware detects missing session
  - User is redirected to `/login?returnUrl=/dashboard`
  - Dashboard does not load

**Scenario 6.3: Access Public Route (Authenticated)**
- GIVEN: An authenticated user
- WHEN: User navigates to `/login`
- THEN:
  - Middleware detects existing session
  - User is redirected to `/dashboard`
  - Login page does not load

**Scenario 6.4: Protected API Route (Valid Session)**
- GIVEN: Authenticated request to `/api/reports`
- WHEN: API route handler runs
- THEN:
  - Middleware has added `x-user-id` header
  - Handler extracts user ID from header
  - Database query uses user ID for RLS
  - Response includes only user's data

**Scenario 6.5: Protected API Route (No Session)**
- GIVEN: Unauthenticated request to `/api/reports`
- WHEN: API route handler runs
- THEN:
  - Middleware has not added user headers
  - Handler throws AuthError
  - Response is 401 Unauthorized
  - Response includes `WWW-Authenticate` header

### AC-7: User Profile Management

**Scenario 7.1: Profile Creation (Email/Password)**
- GIVEN: New signup via email/password
- WHEN: Account is created
- THEN:
  - User profile is created in users table
  - Profile ID matches auth.users.id
  - Email field is populated
  - Name is null (to be filled later)
  - Avatar URL is null
  - Preferences is empty object {}
  - Timestamps are set

**Scenario 7.2: Profile Creation (OAuth)**
- GIVEN: New signup via Google OAuth
- WHEN: Account is created
- THEN:
  - User profile is created in users table
  - Email from Google is used
  - Name from Google profile is used
  - Avatar URL from Google is used
  - Preferences is empty object
  - Profile is synced from OAuth data

**Scenario 7.3: Profile Update**
- GIVEN: An authenticated user
- WHEN: User updates their name
- THEN:
  - Database is updated with new name
  - updated_at timestamp is refreshed
  - Change is reflected immediately in UI
  - Session context is updated

**Scenario 7.4: Email Update**
- GIVEN: User wants to change email
- WHEN: User submits new email
- THEN:
  - Verification email sent to new address
  - Old email remains active until verification
  - After verification, new email becomes primary
  - Old email is no longer valid

---

## Non-Functional Acceptance Criteria

### AC-8: Performance

**Scenario 8.1: Login Response Time**
- GIVEN: Standard login request
- WHEN: User submits credentials
- THEN:
  - Response received within 1 second (p95)
  - Database queries optimized with indexes
  - No unnecessary round trips

**Scenario 8.2: Session Validation Time**
- GIVEN: Request to protected route
- WHEN: Middleware validates session
- THEN:
  - Validation completes in <100ms (p95)
  - JWT verification is in-memory (no DB query)
  - No blocking operations

**Scenario 8.3: Token Refresh Time**
- GIVEN: Expired access token
- WHEN: Middleware refreshes token
- THEN:
  - Refresh completes in <200ms (p95)
  - User doesn't notice delay
  - Request proceeds smoothly

**Scenario 8.4: OAuth Callback Time**
- GIVEN: OAuth redirect from provider
- WHEN: Callback processes authorization code
- THEN:
  - Complete flow in <2 seconds (p95)
  - User sees dashboard quickly
  - No perceivable delay

### AC-9: Security

**Scenario 9.1: Password Hashing**
- GIVEN: User password
- WHEN: Account is created
- THEN:
  - Password is hashed by Supabase (bcrypt)
  - Plain password is never stored
  - Hash cannot be reversed
  - Hash is not exposed in any response

**Scenario 9.2: Session Cookie Security**
- GIVEN: Session cookie
- WHEN: Cookie is set
- THEN:
  - httpOnly flag prevents JavaScript access
  - secure flag ensures HTTPS only (production)
  - sameSite='lax' prevents CSRF
  - Cookie is not accessible to client-side code

**Scenario 9.3: Rate Limiting**
- GIVEN: Multiple failed login attempts
- WHEN: 5 attempts from same IP in 15 minutes
- THEN:
  - 6th attempt is blocked
  - Error message is shown
  - Account is not locked (just rate limited)
  - Limit resets after 15 minutes

**Scenario 9.4: Token Rotation**
- GIVEN: User changes password
- WHEN: Password update succeeds
- THEN:
  - All existing sessions are invalidated
  - Refresh tokens are revoked
  - User must log in again on all devices
  - Old tokens cannot be used

**Scenario 9.5: SQL Injection Prevention**
- GIVEN: Malicious input in email field
- WHEN: Login attempt is made
- THEN:
  - Input is sanitized by Supabase client
  - Parameterized queries are used
  - No SQL injection occurs
  - Error is handled gracefully

### AC-10: Error Handling

**Scenario 10.1: Supabase Service Down**
- GIVEN: Supabase is unavailable
- WHEN: User tries to log in
- THEN:
  - System displays "Service temporarily unavailable"
  - Error is logged for monitoring
  - Retry mechanism is triggered (max 3 attempts)
  - User is informed to try again later

**Scenario 10.2: Network Timeout**
- GIVEN: Slow network connection
- WHEN: Authentication request times out
- THEN:
  - System displays "Request timed out. Please try again."
  - Request is not retried automatically
  - Form remains filled for user convenience

**Scenario 10.3: Invalid Session Token**
- GIVEN: Corrupted or tampered session token
- WHEN: Middleware validates token
- THEN:
  - Token is rejected
  - User is redirected to login
  - Error is logged
  - Message: "Your session is invalid. Please log in again."

**Scenario 10.4: Expired Refresh Token**
- GIVEN: Both access and refresh tokens expired
- WHEN: User tries to access protected route
- THEN:
  - Refresh attempt fails
  - User is redirected to login
  - Message: "Your session has expired. Please log in again."
  - returnUrl is preserved

### AC-11: User Experience

**Scenario 11.1: Loading States**
- GIVEN: Authentication in progress
- WHEN: User submits form
- THEN:
  - Submit button shows spinner
  - Submit button is disabled
  - Form inputs are disabled
  - Loading text appears ("Signing in...")

**Scenario 11.2: Error Messages**
- GIVEN: Authentication error occurs
- WHEN: Error is displayed
- THEN:
  - Message is clear and actionable
  - Message doesn't expose security details
  - Suggestion for recovery is provided
  - Error styling is consistent

**Scenario 11.3: Success Feedback**
- GIVEN: Successful authentication
- WHEN: User is redirected
- THEN:
  - Brief success message/toast is shown
  - Smooth transition to dashboard
  - Welcome message displays user's name
  - No jarring redirects

**Scenario 11.4: Form Validation**
- GIVEN: User filling out forms
- WHEN: User enters invalid data
- THEN:
  - Inline validation shows immediately
  - Error appears below field
  - Field is highlighted in red
  - User can correct without submitting

**Scenario 11.5: Accessibility**
- GIVEN: User using screen reader
- WHEN: Navigating authentication pages
- THEN:
  - All inputs have proper labels
  - Error messages are announced
  - Focus management is correct
  - Keyboard navigation works

---

## Edge Cases

### Edge Case 1: Session Refresh During API Call
**Scenario:** Access token expires while API request is in flight
- **Expected:** Request completes with current token (not interrupted)
- **Then:** Next request uses refreshed token

### Edge Case 2: Simultaneous Login on Multiple Devices
**Scenario:** User logs in on phone while already logged in on laptop
- **Expected:** Both sessions are valid and independent
- **Behavior:** Logout on one device doesn't affect the other

### Edge Case 3: Browser Refresh During OAuth Flow
**Scenario:** User refreshes browser during OAuth redirect
- **Expected:** Error message displayed
- **Recovery:** User can click "Continue with Google" again

### Edge Case 4: Deleted User Trying to Log In
**Scenario:** User account deleted but user tries to log in
- **Expected:** "Invalid email or password" (don't reveal deletion)
- **Security:** No information leakage

### Edge Case 5: Email Verification Link Clicked Multiple Times
**Scenario:** User clicks verification link twice
- **Expected:** First click verifies, second click shows "Already verified"
- **Then:** Both times redirect to dashboard

### Edge Case 6: Password Reset During Active Session
**Scenario:** User requests password reset while logged in
- **Expected:** Reset email is sent
- **Then:** Current session remains valid until password is changed
- **Then:** After password change, all sessions are invalidated

### Edge Case 7: Middleware Fails to Add User Headers
**Scenario:** Middleware encounters error and doesn't set headers
- **Expected:** API route throws 401 Unauthorized
- **Logged:** Error is logged for debugging
- **User:** Redirected to login

### Edge Case 8: OAuth Email Mismatch
**Scenario:** OAuth email doesn't match email used to sign up
- **Expected:** Two separate accounts are maintained
- **Alternative:** Admin can manually merge accounts

### Edge Case 9: Very Long Session (30 Days)
**Scenario:** User enables "Remember me" for 30-day session
- **Expected:** Access token still refreshes hourly
- **Then:** Refresh token remains valid for 30 days
- **Security:** Can be revoked if compromised

### Edge Case 10: Rate Limit Right Before Success
**Scenario:** 5th failed attempt, then correct password on 6th
- **Expected:** 6th attempt is blocked (rate limit)
- **User:** Must wait 15 minutes even with correct password
- **Rationale:** Prevents brute force timing attacks

---

## Test Scenarios

### Automated Test Suite

#### Unit Tests (lib/auth/*)
1. **helpers.test.ts**
   - ✓ `signUp()` creates account with valid data
   - ✓ `signIn()` returns session with correct credentials
   - ✓ `signOut()` clears session
   - ✓ `resetPassword()` sends email
   - ✓ Password validation rejects weak passwords
   - ✓ Email validation rejects invalid formats

2. **api-protection.test.ts**
   - ✓ `getUserFromRequest()` extracts user from headers
   - ✓ Throws AuthError when headers missing
   - ✓ Returns correct user object structure

3. **session.test.ts**
   - ✓ `getServerSession()` returns session in Server Components
   - ✓ `requireAuth()` throws when not authenticated
   - ✓ Session refresh works correctly

#### Integration Tests (tests/integration/auth/*)
1. **signup.test.ts**
   - ✓ Email/password signup creates user and profile
   - ✓ Duplicate email returns error
   - ✓ Weak password is rejected
   - ✓ Verification email is sent

2. **login.test.ts**
   - ✓ Correct credentials return session
   - ✓ Incorrect credentials return error
   - ✓ Unverified email is blocked
   - ✓ Rate limiting after 5 attempts

3. **oauth.test.ts**
   - ✓ Google OAuth creates new user (mocked)
   - ✓ GitHub OAuth links existing user (mocked)
   - ✓ OAuth error is handled gracefully

4. **password-reset.test.ts**
   - ✓ Reset request sends email
   - ✓ Valid token allows password change
   - ✓ Expired token is rejected
   - ✓ Invalid token is rejected

5. **session-management.test.ts**
   - ✓ Session is created on login
   - ✓ Token refresh works automatically
   - ✓ Expired token triggers refresh
   - ✓ Invalid token redirects to login

6. **route-protection.test.ts**
   - ✓ Protected routes redirect unauthenticated users
   - ✓ Authenticated users can access protected routes
   - ✓ returnUrl is preserved
   - ✓ API routes return 401 without session

#### E2E Tests (tests/e2e/auth/*)
1. **complete-signup-flow.spec.ts**
   - ✓ User can sign up
   - ✓ User receives verification email
   - ✓ User clicks link and is verified
   - ✓ User is logged in automatically
   - ✓ User profile is created

2. **complete-login-flow.spec.ts**
   - ✓ User can log in with email/password
   - ✓ Session is created
   - ✓ User is redirected to dashboard
   - ✓ User can access protected pages
   - ✓ User can log out

3. **oauth-flow.spec.ts**
   - ✓ User can initiate Google OAuth
   - ✓ User is redirected to Google
   - ✓ After auth, user returns to app
   - ✓ User account is created/logged in
   - ✓ User is redirected to dashboard

4. **password-reset-flow.spec.ts**
   - ✓ User requests password reset
   - ✓ User receives reset email
   - ✓ User clicks link and sees reset form
   - ✓ User submits new password
   - ✓ User can log in with new password
   - ✓ Old password doesn't work

5. **protected-routes.spec.ts**
   - ✓ Unauthenticated user is redirected from /dashboard
   - ✓ After login, user is redirected back to /dashboard
   - ✓ User can navigate between protected pages
   - ✓ User can access all protected features

---

## Success Metrics

### Quantitative Metrics

1. **Authentication Success Rate:** ≥ 99.5%
   - Measurement: (Successful auths / Total auth attempts) × 100
   - Excludes user errors (wrong password)

2. **Login Response Time:** < 1s (p95)
   - Measurement: Time from form submit to redirect
   - Target: 95% of requests complete in <1s

3. **Session Validation Time:** < 100ms (p95)
   - Measurement: Middleware execution time
   - Target: 95% of validations in <100ms

4. **Token Refresh Time:** < 200ms (p95)
   - Measurement: Time to refresh expired token
   - Target: 95% of refreshes in <200ms

5. **OAuth Completion Rate:** ≥ 95%
   - Measurement: (Completed OAuth flows / Initiated flows) × 100
   - Excludes user cancellations

6. **Password Reset Success Rate:** ≥ 90%
   - Measurement: (Successful resets / Reset requests) × 100
   - Tracks full flow completion

7. **Failed Login Attempts:** < 2%
   - Measurement: (Failed logins / Total logins) × 100
   - Excludes intentional wrong passwords

8. **Rate Limit Triggers:** < 0.5%
   - Measurement: (Rate limited requests / Total requests) × 100
   - Monitor for abuse patterns

### Qualitative Metrics

1. **Security Incidents:** 0
   - No session hijacking
   - No token exposure
   - No SQL injection
   - No CSRF attacks

2. **User Experience Satisfaction:** ≥ 4.5/5
   - Login process is smooth
   - Error messages are helpful
   - Loading states are clear
   - No confusing redirects

3. **Code Quality:**
   - 100% TypeScript type coverage
   - ≥ 80% test coverage
   - 0 critical security vulnerabilities
   - All tests passing

---

## Definition of Done

Feature 1.4 is considered complete when:

- [ ] All functional acceptance criteria are met
- [ ] All non-functional acceptance criteria are met
- [ ] All edge cases are handled correctly
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests pass 100%
- [ ] E2E tests pass 100%
- [ ] Manual testing completed and documented
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Documentation is complete
- [ ] Code review approved
- [ ] No critical or high-severity bugs
- [ ] Feature branch merged to main
- [ ] Deployed to staging environment
- [ ] Smoke tests pass in staging

---

## Manual Testing Checklist

### Pre-Release Testing

**Authentication Flows:**
- [ ] Sign up with email/password
- [ ] Verify email address
- [ ] Log in with email/password
- [ ] Log in with Google OAuth
- [ ] Log in with GitHub OAuth
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Reset password with expired token
- [ ] Log out

**Session Management:**
- [ ] Session persists after browser refresh
- [ ] Session expires after 7 days (manual wait or clock manipulation)
- [ ] Token refreshes automatically when expired
- [ ] Multiple devices can be logged in simultaneously
- [ ] Logout on one device doesn't affect others

**Route Protection:**
- [ ] Unauthenticated access to /dashboard redirects to login
- [ ] returnUrl is preserved through login
- [ ] Authenticated access to /login redirects to dashboard
- [ ] API routes return 401 without authentication
- [ ] API routes work with valid session

**Error Handling:**
- [ ] Invalid credentials show appropriate error
- [ ] Weak password shows validation errors
- [ ] Unverified email blocks login with helpful message
- [ ] Rate limiting triggers after 5 failed attempts
- [ ] Network errors are handled gracefully

**User Experience:**
- [ ] Forms show loading states
- [ ] Error messages are clear and actionable
- [ ] Success messages are displayed
- [ ] Keyboard navigation works
- [ ] Screen reader announces errors
- [ ] Mobile responsive

**Security:**
- [ ] Passwords are not visible in network tab
- [ ] Session tokens are HTTP-only
- [ ] CSRF protection is active
- [ ] SQL injection attempts fail safely
- [ ] XSS attempts are blocked

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Status:** Ready for Implementation
