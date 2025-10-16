# Feature 1.4: Supabase Authentication

## Overview

This feature implements complete authentication and authorization using Supabase Auth, including email/password authentication, OAuth providers (Google, GitHub), session management, and route protection. The implementation leverages Supabase's built-in authentication system with cookie-based sessions and Next.js 14+ middleware for route protection.

## Objectives

1. Enable secure user authentication using Supabase Auth
2. Support multiple authentication methods (email/password, OAuth)
3. Implement robust session management with automatic token refresh
4. Protect application routes and API endpoints
5. Provide seamless user experience with proper error handling
6. Ensure security best practices (CSRF protection, secure cookies, rate limiting)

---

## Functional Requirements

### FR-1: Email/Password Authentication

#### FR-1.1: User Signup

**User Story:** As a new user, I want to create an account using my email and password, so that I can access the radiology reporting platform.

**Acceptance Criteria:**
1. WHEN a user provides valid email and password THEN the system SHALL create a new account in Supabase Auth
2. WHEN signup is successful THEN the system SHALL send a verification email to the provided address
3. WHEN the user clicks the verification link THEN the system SHALL activate the account and redirect to the dashboard
4. IF the email already exists THEN the system SHALL display an error message "Email already registered"
5. IF the password doesn't meet requirements THEN the system SHALL display specific validation errors
6. WHEN account is created THEN the system SHALL create a corresponding user profile in the users table

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### FR-1.2: User Login

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my reports and templates.

**Acceptance Criteria:**
1. WHEN a user provides correct email and password THEN the system SHALL authenticate the user
2. WHEN authentication is successful THEN the system SHALL create a session and redirect to the dashboard
3. WHEN authentication is successful THEN the system SHALL set a secure HTTP-only cookie containing the session token
4. IF credentials are incorrect THEN the system SHALL display "Invalid email or password" after 500ms delay
5. IF the account is not verified THEN the system SHALL display "Please verify your email address" with option to resend verification
6. IF too many failed attempts (5+) THEN the system SHALL temporarily lock the account for 15 minutes

#### FR-1.3: Password Reset

**User Story:** As a user who forgot my password, I want to reset it securely, so that I can regain access to my account.

**Acceptance Criteria:**
1. WHEN a user requests password reset THEN the system SHALL send a reset link to the registered email
2. WHEN the user clicks the reset link THEN the system SHALL display a password reset form
3. WHEN the user submits a new password THEN the system SHALL validate it against password requirements
4. WHEN the password is valid THEN the system SHALL update the password and invalidate all existing sessions
5. WHEN password is reset THEN the system SHALL send a confirmation email
6. IF the reset token is expired (>1 hour) THEN the system SHALL display "Reset link expired" and offer to send a new one

#### FR-1.4: Logout

**User Story:** As a logged-in user, I want to log out securely, so that my session is terminated on shared devices.

**Acceptance Criteria:**
1. WHEN a user clicks logout THEN the system SHALL call Supabase signOut method
2. WHEN logout is successful THEN the system SHALL clear the session cookie
3. WHEN logout is successful THEN the system SHALL redirect to the login page
4. WHEN logout completes THEN the system SHALL invalidate the current session token

### FR-2: OAuth Authentication

#### FR-2.1: Google OAuth

**User Story:** As a user, I want to sign in with my Google account, so that I don't need to create a separate password.

**Acceptance Criteria:**
1. WHEN a user clicks "Continue with Google" THEN the system SHALL redirect to Google OAuth consent screen
2. WHEN the user approves access THEN Google SHALL redirect back to the callback URL with authorization code
3. WHEN the callback receives the code THEN the system SHALL exchange it for user information
4. IF the user doesn't exist THEN the system SHALL create a new account with Google profile data
5. IF the user exists THEN the system SHALL log them in
6. WHEN OAuth is complete THEN the system SHALL create a session and redirect to the dashboard

#### FR-2.2: GitHub OAuth

**User Story:** As a developer user, I want to sign in with my GitHub account, so that I can use my existing developer credentials.

**Acceptance Criteria:**
1. WHEN a user clicks "Continue with GitHub" THEN the system SHALL redirect to GitHub OAuth authorization page
2. WHEN the user authorizes access THEN GitHub SHALL redirect back with authorization code
3. WHEN the callback processes the code THEN the system SHALL retrieve user profile from GitHub
4. IF the user is new THEN the system SHALL create an account using GitHub email and profile data
5. IF the user exists THEN the system SHALL authenticate them
6. WHEN OAuth completes THEN the system SHALL establish a session and redirect to the dashboard

### FR-3: Session Management

#### FR-3.1: Session Creation

**Acceptance Criteria:**
1. WHEN authentication succeeds THEN the system SHALL create a Supabase session with JWT tokens
2. WHEN session is created THEN the system SHALL store access token and refresh token in secure HTTP-only cookies
3. WHEN cookies are set THEN they SHALL use the following security attributes:
   - httpOnly: true
   - secure: true (in production)
   - sameSite: 'lax'
   - maxAge: 604800 (7 days)
4. WHEN session is created THEN the system SHALL associate it with the user's UUID from auth.users

#### FR-3.2: Session Validation

**Acceptance Criteria:**
1. WHEN a protected route is accessed THEN the middleware SHALL validate the session token
2. WHEN validating THEN the system SHALL verify the JWT signature using Supabase
3. IF the token is valid THEN the system SHALL allow the request to proceed
4. IF the token is invalid THEN the system SHALL redirect to login page
5. IF the token is expired but refresh token is valid THEN the system SHALL automatically refresh the session

#### FR-3.3: Token Refresh

**Acceptance Criteria:**
1. WHEN the access token expires (after 1 hour) THEN the system SHALL automatically use the refresh token to get a new access token
2. WHEN refresh succeeds THEN the system SHALL update the cookie with the new access token
3. WHEN refresh succeeds THEN the request SHALL proceed without interruption
4. IF refresh fails THEN the system SHALL clear the session and redirect to login
5. WHEN refreshing THEN the system SHALL maintain the same session (not create a new one)

#### FR-3.4: Session Termination

**Acceptance Criteria:**
1. WHEN logout occurs THEN the system SHALL call Supabase auth.signOut()
2. WHEN signOut is called THEN Supabase SHALL revoke the refresh token
3. WHEN session terminates THEN the system SHALL delete all auth cookies
4. WHEN session terminates THEN any in-progress API requests SHALL complete with their current token
5. IF session termination fails THEN the system SHALL still clear local cookies

### FR-4: Route Protection

#### FR-4.1: Protected Pages

**Protected Routes:**
- `/dashboard/*` - All dashboard pages
- `/generate` - Report generation page
- `/reports/*` - All report pages
- `/templates/*` - All template pages
- `/settings/*` - All settings pages

**Acceptance Criteria:**
1. WHEN an unauthenticated user accesses a protected route THEN the system SHALL redirect to `/login` with returnUrl parameter
2. WHEN redirecting to login THEN the system SHALL preserve the original URL as `/login?returnUrl=/path`
3. WHEN user authenticates THEN the system SHALL redirect to the returnUrl if present
4. WHEN an authenticated user accesses a protected route THEN the system SHALL allow access
5. WHEN middleware runs THEN it SHALL add user context (user ID, email) to request headers for API routes

#### FR-4.2: Public Pages

**Public Routes:**
- `/` - Landing page
- `/login` - Login page
- `/signup` - Signup page
- `/reset-password` - Password reset page
- `/verify-email` - Email verification page
- `/auth/callback` - OAuth callback handler

**Acceptance Criteria:**
1. WHEN an unauthenticated user accesses a public route THEN the system SHALL allow access
2. WHEN an authenticated user accesses `/login` or `/signup` THEN the system SHALL redirect to `/dashboard`
3. WHEN accessing public pages THEN the system SHALL not require authentication
4. WHEN accessing public pages THEN the system SHALL not create unnecessary database queries

#### FR-4.3: API Route Protection

**Protected API Routes:**
- `/api/generate` - Report generation
- `/api/transcribe` - Audio transcription
- `/api/templates/*` - Template operations
- `/api/reports/*` - Report operations
- `/api/user/*` - User operations

**Public API Routes:**
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check
- `/api/webhooks/*` - Webhook handlers (verified by signature)

**Acceptance Criteria:**
1. WHEN a protected API route is called without authentication THEN the system SHALL return 401 Unauthorized
2. WHEN a protected API route is called with valid session THEN the middleware SHALL add `x-user-id` header
3. WHEN an API route accesses user context THEN it SHALL use the `x-user-id` header from middleware
4. WHEN API authentication fails THEN the response SHALL include `WWW-Authenticate: Bearer realm="api"`
5. WHEN accessing public API routes THEN authentication SHALL not be required

### FR-5: User Profile Management

#### FR-5.1: Profile Creation

**Acceptance Criteria:**
1. WHEN a new user signs up THEN the system SHALL automatically create a profile in the users table
2. WHEN profile is created THEN the system SHALL set id to match auth.users.id (UUID)
3. WHEN profile is created via email/password THEN the system SHALL populate:
   - email (from auth)
   - name (empty, to be filled later)
   - avatar_url (null)
   - preferences (empty JSONB object)
4. WHEN profile is created via OAuth THEN the system SHALL populate:
   - email (from OAuth provider)
   - name (from OAuth provider profile)
   - avatar_url (from OAuth provider if available)
   - preferences (empty JSONB object)

#### FR-5.2: Profile Retrieval

**Acceptance Criteria:**
1. WHEN a user logs in THEN the system SHALL fetch their profile from the users table
2. WHEN fetching profile THEN the query SHALL use auth.uid() to ensure RLS enforcement
3. WHEN profile doesn't exist THEN the system SHALL create one automatically
4. WHEN profile is retrieved THEN the system SHALL cache it in the session context

#### FR-5.3: Profile Updates

**Acceptance Criteria:**
1. WHEN a user updates their profile THEN the system SHALL validate all inputs
2. WHEN updating email THEN the system SHALL send verification to the new email
3. WHEN updating email THEN the old email SHALL remain active until verification
4. WHEN updating profile THEN the updated_at timestamp SHALL be automatically updated
5. WHEN profile update succeeds THEN the system SHALL return the updated profile

---

## Non-Functional Requirements

### NFR-1: Security

1. **Password Security**
   - SHALL use bcrypt with minimum 10 rounds for password hashing
   - SHALL enforce password complexity requirements
   - SHALL implement password reset token expiration (1 hour)
   - SHALL invalidate all sessions on password change

2. **Session Security**
   - SHALL use HTTP-only cookies for token storage
   - SHALL enable secure flag in production
   - SHALL implement CSRF protection for state-changing operations
   - SHALL rotate session tokens on privilege escalation

3. **Rate Limiting**
   - SHALL limit login attempts to 5 per IP per 15 minutes
   - SHALL limit signup attempts to 3 per IP per hour
   - SHALL limit password reset requests to 3 per email per hour
   - SHALL implement progressive delays on failed authentication

4. **Data Protection**
   - SHALL never expose passwords in logs or responses
   - SHALL never expose session tokens in URLs
   - SHALL implement Row Level Security (RLS) on all user data
   - SHALL use parameterized queries to prevent SQL injection

### NFR-2: Performance

1. **Response Times**
   - Login/signup SHALL complete within 1 second (p95)
   - Session validation SHALL complete within 100ms (p95)
   - Token refresh SHALL complete within 200ms (p95)
   - OAuth callback SHALL complete within 2 seconds (p95)

2. **Database Performance**
   - User lookups SHALL use indexed email column
   - Session validation SHALL not require database queries (JWT verification only)
   - Profile queries SHALL use the primary key (UUID)

3. **Caching**
   - User profiles SHALL be cached in session context
   - Session validation SHALL use in-memory JWT verification
   - Public pages SHALL be statically generated where possible

### NFR-3: User Experience

1. **Error Messages**
   - SHALL provide clear, actionable error messages
   - SHALL not expose security-sensitive information
   - SHALL suggest recovery actions (e.g., "Forgot password?")
   - SHALL display loading states during authentication

2. **Loading States**
   - SHALL show loading spinner during authentication
   - SHALL disable submit buttons while processing
   - SHALL prevent duplicate submissions
   - SHALL provide progress feedback for multi-step flows

3. **Redirect Behavior**
   - SHALL preserve intended destination URL through authentication flow
   - SHALL redirect to dashboard after successful authentication
   - SHALL redirect to login when accessing protected routes
   - SHALL handle browser back button gracefully

### NFR-4: Reliability

1. **Error Handling**
   - SHALL gracefully handle Supabase service outages
   - SHALL provide fallback error messages when services are unavailable
   - SHALL log authentication failures for security monitoring
   - SHALL retry failed token refresh attempts (max 3)

2. **Session Recovery**
   - SHALL automatically refresh expired tokens
   - SHALL restore session after browser restart
   - SHALL handle concurrent session management
   - SHALL support "Remember me" functionality (30-day sessions)

---

## Technical Requirements

### TR-1: Supabase Configuration

**Acceptance Criteria:**
1. WHEN setting up Supabase THEN authentication SHALL be configured with:
   - Email/password provider enabled
   - Google OAuth provider enabled with client ID and secret
   - GitHub OAuth provider enabled with client ID and secret
   - Email confirmation required for email/password signups
   - Minimum password length: 8 characters

2. WHEN configuring URLs THEN Supabase SHALL use:
   - Site URL: `https://yourdomain.com` (production)
   - Redirect URLs: `https://yourdomain.com/auth/callback`
   - Email templates: Custom branded templates

### TR-2: Next.js Middleware

**File:** `middleware.ts`

**Acceptance Criteria:**
1. WHEN middleware executes THEN it SHALL:
   - Create a Supabase client using cookies from the request
   - Validate the session by calling `supabase.auth.getSession()`
   - Refresh the session if needed
   - Set response cookies with updated tokens
   - Add user context headers for protected routes

2. WHEN middleware runs THEN it SHALL match these paths:
   ```typescript
   matcher: [
     '/((?!_next/static|_next/image|favicon.ico|public/).*)',
   ]
   ```

3. WHEN a route is protected and session is invalid THEN middleware SHALL redirect to login
4. WHEN a route is public THEN middleware SHALL skip authentication checks

**Implementation Pattern:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Add user context for protected routes
  if (session) {
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-email', session.user.email!)
  }

  return response
}
```

### TR-3: Authentication API Routes

#### TR-3.1: Signup Endpoint

**Route:** `POST /api/auth/signup`

**Request Body:**
```typescript
{
  email: string;      // Valid email format
  password: string;   // Meets password requirements
  name?: string;      // Optional display name
}
```

**Response (Success):**
```typescript
{
  success: true;
  message: "Verification email sent to [email]";
  userId: string;     // UUID
}
```

**Response (Error):**
```typescript
{
  success: false;
  error: string;      // Error message
  code: string;       // Error code (e.g., "email_exists", "weak_password")
}
```

#### TR-3.2: Login Endpoint

**Route:** `POST /api/auth/login`

**Request Body:**
```typescript
{
  email: string;
  password: string;
}
```

**Response (Success):**
```typescript
{
  success: true;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
  };
}
```

**Response (Error):**
```typescript
{
  success: false;
  error: string;
  code: string;       // e.g., "invalid_credentials", "email_not_verified"
}
```

#### TR-3.3: Logout Endpoint

**Route:** `POST /api/auth/logout`

**Request:** No body required

**Response:**
```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

#### TR-3.4: Password Reset Request

**Route:** `POST /api/auth/reset-password`

**Request Body:**
```typescript
{
  email: string;
}
```

**Response:**
```typescript
{
  success: true;
  message: "If that email exists, we sent a password reset link";
}
```

#### TR-3.5: Password Reset Confirm

**Route:** `POST /api/auth/reset-password/confirm`

**Request Body:**
```typescript
{
  token: string;       // From email link
  password: string;    // New password
}
```

**Response:**
```typescript
{
  success: true;
  message: "Password reset successfully";
}
```

#### TR-3.6: OAuth Callback

**Route:** `GET /api/auth/callback`

**Query Parameters:**
- `code`: Authorization code from OAuth provider
- `error`: Error from OAuth provider (if any)
- `error_description`: Error description

**Response:** HTTP redirect to dashboard or login with error

### TR-4: Client-Side Utilities

#### TR-4.1: Supabase Client for Client Components

**File:** `lib/auth/supabase-client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### TR-4.2: Auth Helpers

**File:** `lib/auth/helpers.ts`

**Functions:**
- `getCurrentUser()` - Get current user from session
- `getSession()` - Get current session
- `signUp(email, password)` - Sign up new user
- `signIn(email, password)` - Sign in user
- `signOut()` - Sign out user
- `resetPassword(email)` - Request password reset
- `updatePassword(newPassword)` - Update user password
- `signInWithOAuth(provider)` - Sign in with OAuth provider

### TR-5: Server-Side Utilities

#### TR-5.1: API Route Protection

**File:** `lib/auth/api-protection.ts`

```typescript
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string;
  email: string;
}

export function getUserFromRequest(request: NextRequest): AuthUser {
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')

  if (!userId || !userEmail) {
    throw new AuthError('Unauthorized', 401)
  }

  return { id: userId, email: userEmail }
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message)
    this.name = 'AuthError'
  }
}
```

#### TR-5.2: Session Utilities

**File:** `lib/auth/session.ts`

**Functions:**
- `getServerSession()` - Get session in Server Components
- `requireAuth()` - Throw if not authenticated
- `getUserProfile(userId)` - Get or create user profile
- `syncAuthUser(authUser)` - Sync auth user to users table

---

## API Contracts

### Session Object

```typescript
interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: 'bearer';
  user: {
    id: string;
    email: string;
    email_confirmed_at: string | null;
    phone: string | null;
    created_at: string;
    updated_at: string;
    app_metadata: {
      provider: 'email' | 'google' | 'github';
      providers: string[];
    };
    user_metadata: {
      name?: string;
      avatar_url?: string;
      [key: string]: any;
    };
  };
}
```

### User Profile Object

```typescript
interface UserProfile {
  id: string;           // UUID matching auth.users.id
  email: string;
  name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  preferences: {
    theme?: 'light' | 'dark';
    notifications?: boolean;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}
```

---

## User Flows

### Flow 1: Email/Password Signup

1. User visits `/signup`
2. User enters email, password, and optional name
3. System validates inputs client-side
4. User clicks "Sign Up"
5. System sends POST to `/api/auth/signup`
6. API validates inputs server-side
7. API calls `supabase.auth.signUp()`
8. Supabase creates user and sends verification email
9. API returns success with message
10. System displays "Check your email" message
11. User clicks link in email
12. System verifies email and redirects to dashboard
13. System creates session and profile

### Flow 2: Email/Password Login

1. User visits `/login`
2. User enters email and password
3. User clicks "Log In"
4. System sends POST to `/api/auth/login`
5. API calls `supabase.auth.signInWithPassword()`
6. IF credentials are valid:
   - Supabase returns session
   - API sets session cookies
   - System redirects to dashboard
7. IF credentials are invalid:
   - System displays error message
   - System keeps user on login page

### Flow 3: OAuth Login (Google/GitHub)

1. User visits `/login`
2. User clicks "Continue with Google" or "Continue with GitHub"
3. System calls `supabase.auth.signInWithOAuth({ provider })`
4. Supabase redirects to OAuth provider
5. User authenticates with provider
6. Provider redirects to `/api/auth/callback?code=...`
7. Callback handler exchanges code for tokens
8. Supabase creates/updates user
9. System syncs user to users table
10. System sets session cookies
11. System redirects to dashboard

### Flow 4: Password Reset

1. User visits `/login`
2. User clicks "Forgot password?"
3. System displays password reset form
4. User enters email
5. User clicks "Send reset link"
6. System sends POST to `/api/auth/reset-password`
7. API calls `supabase.auth.resetPasswordForEmail()`
8. Supabase sends reset email
9. System displays "Check your email" message
10. User clicks link in email
11. System displays password reset form at `/reset-password?token=...`
12. User enters new password
13. System sends POST to `/api/auth/reset-password/confirm`
14. API calls `supabase.auth.updateUser({ password })`
15. System displays success message
16. System redirects to login

### Flow 5: Accessing Protected Route

1. User navigates to `/dashboard` (protected)
2. Middleware intercepts request
3. Middleware calls `supabase.auth.getSession()`
4. IF session is valid:
   - Middleware adds user headers
   - Request proceeds to page
5. IF session is expired but refresh token is valid:
   - Middleware refreshes session
   - Middleware updates cookies
   - Request proceeds to page
6. IF no valid session:
   - Middleware redirects to `/login?returnUrl=/dashboard`
7. After login, system redirects to `/dashboard`

### Flow 6: API Route Call

1. Client calls protected API route (e.g., `/api/reports`)
2. Middleware intercepts request
3. Middleware validates session
4. IF valid, middleware adds `x-user-id` header
5. API route handler calls `getUserFromRequest(request)`
6. Helper extracts user ID from header
7. API performs database operation with user context
8. API returns response

---

## Security Considerations

### Authentication Security

1. **Brute Force Protection**
   - Implement rate limiting on login attempts
   - Use exponential backoff after failed attempts
   - Lock account temporarily after 5 failed attempts
   - Log suspicious authentication patterns

2. **Session Management**
   - Use secure, HTTP-only cookies
   - Implement CSRF protection with SameSite cookies
   - Rotate tokens on privilege changes
   - Invalidate sessions on password change

3. **Password Security**
   - Enforce strong password requirements
   - Never log or expose passwords
   - Use Supabase's built-in bcrypt hashing
   - Implement password history (prevent reuse)

4. **OAuth Security**
   - Validate OAuth state parameter
   - Verify OAuth tokens with provider
   - Use PKCE for authorization code flow
   - Whitelist redirect URLs

### Authorization Security

1. **Row Level Security (RLS)**
   - Enable RLS on all user-facing tables
   - Use `auth.uid()` in policies
   - Test policies with different user contexts
   - Never bypass RLS in application code

2. **API Authorization**
   - Always validate user session in API routes
   - Use middleware for authentication
   - Implement resource-level authorization
   - Log authorization failures

### Data Protection

1. **Sensitive Data**
   - Never expose JWT tokens in URLs
   - Never log session tokens
   - Mask sensitive data in error messages
   - Implement proper error handling

2. **CSRF Protection**
   - Use SameSite='lax' cookies
   - Validate origin header for state-changing requests
   - Implement double-submit cookie pattern
   - Use Supabase's built-in CSRF protection

---

## Dependencies

### External Dependencies

1. **Supabase Auth** (via `@supabase/ssr`)
   - Version: ^0.0.10 or later
   - Purpose: Authentication provider
   - Configuration: Email/password + OAuth providers

2. **@supabase/supabase-js**
   - Version: ^2.38.0 or later
   - Purpose: Supabase client library

3. **@supabase/ssr**
   - Version: ^0.0.10 or later
   - Purpose: Server-side rendering support for Supabase

### Internal Dependencies

1. **Feature 1.3: Supabase Integration** (COMPLETED)
   - `lib/database/supabase-server.ts` - Server client
   - `types/database.types.ts` - Database types
   - Users table with RLS policies

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing Requirements

### Unit Tests

1. `lib/auth/helpers.test.ts` - Auth helper functions
2. `lib/auth/api-protection.test.ts` - API protection utilities
3. `lib/auth/session.test.ts` - Session management

### Integration Tests

1. Authentication flow tests
   - Email/password signup
   - Email/password login
   - OAuth login (mocked)
   - Password reset flow
   - Logout flow

2. Session management tests
   - Session creation
   - Session validation
   - Token refresh
   - Session expiration

3. Authorization tests
   - Protected route access
   - API route protection
   - RLS policy enforcement

### E2E Tests

1. Complete user journey
   - Signup → Email verification → Login → Access dashboard
   - Login → Access reports → Logout
   - Forgot password → Reset → Login
   - OAuth login → Access dashboard

---

## Success Metrics

1. **Authentication Success Rate:** >99.5%
2. **Login Response Time:** <1s (p95)
3. **Session Validation Time:** <100ms (p95)
4. **Failed Login Attempts:** <2% of total attempts
5. **OAuth Completion Rate:** >95%
6. **Password Reset Success Rate:** >90%
7. **Security Incidents:** 0 (session hijacking, token exposure)

---

## Migration Path

### From Original App (Outseta)

This feature replaces Outseta authentication with Supabase Auth:

1. **No data migration needed** (fresh implementation)
2. **Session cookies change** (new format)
3. **OAuth providers remain the same** (Google, GitHub)
4. **User profiles stored in Supabase** (not Outseta)

### Breaking Changes

- Session cookie names will change
- Authentication endpoints change from Outseta to Supabase
- User IDs are UUIDs (not Outseta IDs)

---

## Related Documents

- `docs/01-ARCHITECTURE/BLUEPRINT.md` - System architecture
- `docs/02-DESIGN/TECHNICAL.md` - Technical design patterns
- `docs/specs/features/1.3-supabase-integration/SPEC.md` - Database setup
- Supabase Auth documentation: https://supabase.com/docs/guides/auth
