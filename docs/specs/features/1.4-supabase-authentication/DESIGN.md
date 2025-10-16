# Feature 1.4: Supabase Authentication - Technical Design

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2025-01-16
**Feature Lead:** Design Architect

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Specifications](#component-specifications)
4. [Implementation Plan](#implementation-plan)
5. [Security Implementation](#security-implementation)
6. [Testing Strategy](#testing-strategy)
7. [Environment Configuration](#environment-configuration)
8. [Migration from Current State](#migration-from-current-state)

---

## Overview

This document provides the complete technical design for implementing Supabase Authentication in the Radiology Reporting App. It covers all aspects from middleware implementation to UI components, providing developers with complete, runnable code and clear implementation sequences.

### Design Goals

1. **Security First**: Implement industry-standard authentication with proper session management
2. **Developer Experience**: Provide clear patterns that are easy to follow and extend
3. **User Experience**: Seamless authentication flows with proper error handling
4. **Performance**: Fast authentication with minimal overhead
5. **Maintainability**: Clean, testable code with proper separation of concerns

### Key Design Decisions

| Decision | Rationale | Alternative Considered |
|----------|-----------|----------------------|
| Use `@supabase/ssr` package | Official Next.js 14+ support with cookie management | `@supabase/auth-helpers` (deprecated) |
| Cookie-based sessions | Secure, works with SSR, no XSS vulnerability | localStorage (vulnerable to XSS) |
| Middleware for route protection | Runs before rendering, better security/performance | Component-level checks (slower, less secure) |
| `getUser()` for validation | Validates token with Supabase server | `getSession()` (client-only, not secure for server) |
| PKCE flow for OAuth | Enhanced security for authorization code flow | Implicit flow (less secure) |

---

## Architecture

### High-Level Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Auth UI Components (Login/Signup/Reset)                  │ │
│  │  ├── LoginForm.tsx                                        │ │
│  │  ├── SignupForm.tsx                                       │ │
│  │  ├── OAuthButtons.tsx                                     │ │
│  │  └── PasswordResetForm.tsx                                │ │
│  └───────────────────────────────────────────────────────────┘ │
│         │                                                        │
│         │ Form Submission                                        │
│         ▼                                                        │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  React Hooks (useAuth, useSession)                        │ │
│  │  └── Supabase Browser Client                              │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS Request
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS MIDDLEWARE                           │
│                    (Edge Runtime)                               │
│                                                                 │
│  1. Create Supabase client with cookie handlers                │
│  2. Call supabase.auth.getUser() to validate token             │
│  3. If expired: Refresh token automatically                    │
│  4. Update request cookies (for Server Components)             │
│  5. Update response cookies (for browser)                      │
│  6. Add user context headers (x-user-id, x-user-email)         │
│  7. Route to destination OR redirect to /login                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┐
         │                                 │
         ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────┐
│  SERVER COMPONENTS   │         │    API ROUTES        │
│                      │         │                      │
│  - Use server client │         │  - Extract user from │
│  - getUser() for     │         │    headers           │
│    user context      │         │  - Validate session  │
│  - Render protected  │         │  - Execute business  │
│    pages             │         │    logic with RLS    │
└──────────────────────┘         └──────────────────────┘
         │                                 │
         └────────────────┬────────────────┘
                          ▼
               ┌────────────────────┐
               │  SUPABASE AUTH     │
               │                    │
               │  - User management │
               │  - JWT generation  │
               │  - OAuth providers │
               │  - Email services  │
               └────────────────────┘
```

### Session Management Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   ┌─────────────┐
   │ User Login  │
   └──────┬──────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Supabase Auth validates         │
   │ credentials and issues tokens:  │
   │ • Access Token (JWT, 1 hour)    │
   │ • Refresh Token (7 days)        │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Tokens stored in HTTP-only      │
   │ cookies with security flags:    │
   │ • httpOnly: true                │
   │ • secure: true (production)     │
   │ • sameSite: 'lax'               │
   │ • maxAge: 604800 (7 days)       │
   └──────┬──────────────────────────┘
          │
          ▼

2. SESSION VALIDATION (Every Request)
   ┌─────────────────────────────────┐
   │ Middleware extracts cookie      │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Check access token expiration   │
   └──────┬──────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌────────────┐
│ Valid  │  │  Expired   │
└───┬────┘  └─────┬──────┘
    │             │
    │             ▼
    │      ┌──────────────────────┐
    │      │ Use refresh token to │
    │      │ get new access token │
    │      └─────┬────────────────┘
    │            │
    │            ▼
    │      ┌──────────────────────┐
    │      │ Update cookies with  │
    │      │ new tokens           │
    │      └─────┬────────────────┘
    │            │
    └────────────┴───────┐
                         │
                         ▼
                  ┌──────────────┐
                  │ Add user     │
                  │ context to   │
                  │ request      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Continue to  │
                  │ destination  │
                  └──────────────┘

3. TOKEN REFRESH FAILURE
   ┌─────────────────────────────────┐
   │ Refresh token expired/invalid   │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Clear all auth cookies          │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Redirect to /login with         │
   │ returnUrl parameter             │
   └─────────────────────────────────┘

4. LOGOUT
   ┌─────────────────────────────────┐
   │ User clicks logout              │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Call supabase.auth.signOut()    │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Supabase revokes refresh token  │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Clear all auth cookies          │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Redirect to /login              │
   └─────────────────────────────────┘
```

### Route Protection Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE CLASSIFICATION                         │
└─────────────────────────────────────────────────────────────────┘

PUBLIC ROUTES (No Auth Required)
├── / (Landing page)
├── /login
├── /signup
├── /reset-password
├── /verify-email
├── /auth/callback (OAuth)
└── /api/auth/* (Auth endpoints)

PROTECTED ROUTES (Auth Required)
├── /dashboard/*
├── /generate
├── /reports/*
├── /templates/*
├── /settings/*
└── /api/[protected endpoints]

AUTHENTICATED USER BEHAVIOR
┌────────────────────────────────────┐
│ Accessing PUBLIC Auth Pages       │
│ (/login, /signup)                  │
└───────────┬────────────────────────┘
            │
            ▼
      ┌──────────────────┐
      │ Redirect to      │
      │ /dashboard       │
      └──────────────────┘

UNAUTHENTICATED USER BEHAVIOR
┌────────────────────────────────────┐
│ Accessing PROTECTED Route          │
│ (e.g., /dashboard/reports)         │
└───────────┬────────────────────────┘
            │
            ▼
      ┌──────────────────────────────┐
      │ Redirect to                  │
      │ /login?returnUrl=/dashboard/ │
      │        reports               │
      └──────────┬───────────────────┘
                 │
                 ▼
      ┌──────────────────────────────┐
      │ After successful login,      │
      │ redirect to returnUrl        │
      └──────────────────────────────┘
```

### OAuth Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  OAUTH AUTHENTICATION FLOW                      │
│                   (Google / GitHub)                             │
└─────────────────────────────────────────────────────────────────┘

1. USER INITIATES OAUTH
   ┌─────────────────────────────────┐
   │ User clicks                     │
   │ "Continue with Google/GitHub"   │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────────┐
   │ Client calls:                                   │
   │ supabase.auth.signInWithOAuth({                 │
   │   provider: 'google' | 'github',                │
   │   options: {                                    │
   │     redirectTo: `${origin}/auth/callback`,      │
   │     queryParams: {                              │
   │       access_type: 'offline',                   │
   │       prompt: 'consent'                         │
   │     }                                           │
   │   }                                             │
   │ })                                              │
   └──────┬──────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Supabase generates:             │
   │ • State parameter (CSRF)        │
   │ • Code verifier (PKCE)          │
   │ • Stores code_challenge         │
   └──────┬──────────────────────────┘
          │
          ▼

2. OAUTH PROVIDER AUTHORIZATION
   ┌─────────────────────────────────┐
   │ User redirected to OAuth        │
   │ provider consent screen         │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ User approves access            │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────────┐
   │ Provider redirects back to:                     │
   │ /auth/callback?code=xxx&state=xxx               │
   └──────┬──────────────────────────────────────────┘
          │
          ▼

3. CALLBACK PROCESSING
   ┌─────────────────────────────────┐
   │ Callback route handler          │
   │ receives authorization code     │
   └──────┬──────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────────────────────┐
   │ Supabase client exchanges code for tokens:      │
   │ • Validates state parameter                     │
   │ • Sends code + code_verifier to Supabase Auth   │
   │ • Supabase Auth validates with OAuth provider   │
   └──────┬──────────────────────────────────────────┘
          │
          ▼
   ┌─────────────────────────────────┐
   │ Supabase Auth returns:          │
   │ • Access token                  │
   │ • Refresh token                 │
   │ • User profile                  │
   └──────┬──────────────────────────┘
          │
          ▼

4. USER PROFILE SYNC
   ┌─────────────────────────────────┐
   │ Check if user exists in         │
   │ public.users table              │
   └──────┬──────────────────────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────────┐
│ Exists │  │  New User    │
└───┬────┘  └─────┬────────┘
    │             │
    │             ▼
    │      ┌──────────────────────────────┐
    │      │ Create user profile:         │
    │      │ • id (from auth.users)       │
    │      │ • email (from OAuth)         │
    │      │ • name (from OAuth)          │
    │      │ • avatar_url (from OAuth)    │
    │      └─────┬────────────────────────┘
    │            │
    └────────────┴───────┐
                         │
                         ▼
                  ┌──────────────┐
                  │ Set session  │
                  │ cookies      │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Redirect to  │
                  │ /dashboard   │
                  └──────────────┘
```

---

## Component Specifications

### 1. Middleware (middleware.ts)

**Purpose:** Validate sessions, refresh tokens, protect routes, and add user context to requests.

**Location:** `/middleware.ts` (project root)

**Complete Implementation:**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Route classification for authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
];

const AUTH_ROUTES = ['/login', '/signup'];
const PROTECTED_ROUTE_PREFIXES = ['/dashboard', '/generate', '/reports', '/templates', '/settings'];

/**
 * Check if a route is public
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/auth/') || pathname.startsWith('/_next') || pathname.startsWith('/api/auth/');
}

/**
 * Check if a route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if route is an auth page (login, signup)
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

/**
 * Middleware function that runs on every request
 *
 * Responsibilities:
 * 1. Create Supabase client with cookie handlers
 * 2. Validate session using getUser() (NOT getSession() - security requirement)
 * 3. Refresh expired tokens automatically
 * 4. Add user context to request headers for Server Components and API routes
 * 5. Protect routes based on authentication status
 * 6. Handle redirects for auth/unauth users
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with cookie handlers
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the request cookies for Server Components
          request.cookies.set({
            name,
            value,
            ...options,
          });

          // Update the response cookies for the browser
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Remove from both request and response
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // CRITICAL: Use getUser() instead of getSession() for security
  // getUser() validates the token with Supabase Auth server
  // getSession() only reads from cookie without validation
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, origin } = request.nextUrl;

  // If user is authenticated, add context to request headers
  if (user) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');

    // Redirect authenticated users away from auth pages
    if (isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', origin));
    }
  }

  // If user is NOT authenticated and trying to access protected route
  if (!user && isProtectedRoute(pathname)) {
    // Preserve the intended destination
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For API routes, return 401 if not authenticated
  if (!user && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Bearer realm="api"',
        },
      }
    );
  }

  return response;
}

/**
 * Configure which routes should trigger middleware
 * Exclude static files, images, and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
```

**Key Design Decisions:**

1. **Security: `getUser()` vs `getSession()`**
   - Always use `getUser()` in server-side code
   - Validates token with Supabase Auth on every request
   - Prevents session hijacking and token tampering

2. **Cookie Management**
   - Cookies updated in both request (for Server Components) and response (for browser)
   - Automatic token refresh handled by Supabase client
   - No manual JWT parsing required

3. **Performance**
   - Edge runtime compatible
   - In-memory JWT verification
   - No database queries in middleware

### 2. Auth API Routes

#### 2.1 Signup Endpoint

**Route:** `app/api/auth/signup/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { z } from 'zod';

/**
 * Signup request validation schema
 */
const SignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
  name: z.string().optional(),
});

/**
 * POST /api/auth/signup
 *
 * Create a new user account with email/password
 *
 * @param request - Contains email, password, and optional name
 * @returns User ID and success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = SignupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
          code: 'validation_error',
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    const supabase = createSupabaseServerClient();

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/auth/callback`,
        data: {
          name: name || null,
        },
      },
    });

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Email already registered',
            code: 'email_exists',
          },
          { status: 409 }
        );
      }

      console.error('Signup error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'signup_failed',
        },
        { status: 400 }
      );
    }

    // User created successfully
    return NextResponse.json(
      {
        success: true,
        message: `Verification email sent to ${email}`,
        userId: data.user?.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}
```

#### 2.2 Login Endpoint

**Route:** `app/api/auth/login/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { z } from 'zod';

/**
 * Login request validation schema
 */
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/login
 *
 * Authenticate user with email/password
 *
 * @param request - Contains email and password
 * @returns User object and session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
          code: 'validation_error',
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const supabase = createSupabaseServerClient();

    // Add delay to prevent timing attacks (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Generic error message to prevent user enumeration
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password',
          code: 'invalid_credentials',
        },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email address',
          code: 'email_not_verified',
        },
        { status: 403 }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, avatar_url')
      .eq('id', data.user.id)
      .single();

    // Return user data
    return NextResponse.json(
      {
        success: true,
        user: profile || {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || null,
          avatar_url: null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}
```

#### 2.3 Logout Endpoint

**Route:** `app/api/auth/logout/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';

/**
 * POST /api/auth/logout
 *
 * Sign out user and clear session
 *
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Sign out from Supabase (revokes refresh token)
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      // Still return success to clear client-side state
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}
```

#### 2.4 OAuth Callback Handler

**Route:** `app/api/auth/callback/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';

/**
 * GET /api/auth/callback
 *
 * Handle OAuth callback from providers (Google, GitHub)
 * Exchange authorization code for session tokens
 *
 * @param request - Contains code and state from OAuth provider
 * @returns Redirect to dashboard or login with error
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Handle OAuth errors (user canceled, etc.)
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', errorDescription || 'Authentication canceled');
    return NextResponse.redirect(loginUrl);
  }

  // Code is required for token exchange
  if (!code) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'Missing authorization code');
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = createSupabaseServerClient();

    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      const loginUrl = new URL('/login', origin);
      loginUrl.searchParams.set('error', 'Authentication failed');
      return NextResponse.redirect(loginUrl);
    }

    // Check if user profile exists in public.users table
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single();

    // Create profile if it doesn't exist (new OAuth user)
    if (!existingProfile) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name || data.user.user_metadata?.full_name || null,
        avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
        preferences: {},
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Continue anyway - profile will be created on next attempt
      }
    }

    // Successful authentication - redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', origin));
  } catch (error) {
    console.error('Callback handler error:', error);
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error', 'Authentication failed');
    return NextResponse.redirect(loginUrl);
  }
}
```

#### 2.5 Session Validation Endpoint

**Route:** `app/api/auth/session/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';

/**
 * GET /api/auth/session
 *
 * Get current session and user information
 *
 * @returns Current user or null
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    // Use getUser() for security
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, avatar_url, preferences')
      .eq('id', user.id)
      .single();

    return NextResponse.json(
      {
        user: profile || {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || null,
          avatar_url: null,
          preferences: {},
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session endpoint error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
```

#### 2.6 Password Reset Request

**Route:** `app/api/auth/reset-password/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { z } from 'zod';

/**
 * Password reset request validation schema
 */
const ResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * POST /api/auth/reset-password
 *
 * Request password reset email
 *
 * @param request - Contains email address
 * @returns Success message (same for existing/non-existing emails)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = ResetRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
          code: 'validation_error',
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    const supabase = createSupabaseServerClient();

    // Request password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.nextUrl.origin}/auth/reset-password/confirm`,
    });

    // Log error but don't expose to user (prevent email enumeration)
    if (error) {
      console.error('Password reset request error:', error);
    }

    // Always return success message
    return NextResponse.json(
      {
        success: true,
        message: 'If that email exists, we sent a password reset link',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}
```

#### 2.7 Password Update

**Route:** `app/api/auth/update-password/route.ts`

**Complete Implementation:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { z } from 'zod';

/**
 * Password update validation schema
 */
const UpdatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character'),
});

/**
 * POST /api/auth/update-password
 *
 * Update user password (after reset or from settings)
 *
 * @param request - Contains new password
 * @returns Success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = UpdatePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.errors[0].message,
          code: 'validation_error',
        },
        { status: 400 }
      );
    }

    const { password } = validationResult.data;

    const supabase = createSupabaseServerClient();

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update password',
          code: 'update_failed',
        },
        { status: 400 }
      );
    }

    // Password updated successfully
    // Note: Supabase automatically invalidates all other sessions
    return NextResponse.json(
      {
        success: true,
        message: 'Password updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update password endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'server_error',
      },
      { status: 500 }
    );
  }
}
```

### 3. Auth Utilities

#### 3.1 API Protection Helper

**File:** `lib/auth/api-protection.ts`

**Complete Implementation:**

```typescript
import { NextRequest } from 'next/server';

/**
 * Authenticated user interface
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Authentication error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Extract authenticated user from request headers
 *
 * Middleware adds user context to headers:
 * - x-user-id: User's UUID
 * - x-user-email: User's email
 *
 * @param request - Next.js request object
 * @returns Authenticated user object
 * @throws AuthError if user not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = getUserFromRequest(request);
 *   // Use user.id for database queries
 * }
 * ```
 */
export function getUserFromRequest(request: NextRequest): AuthUser {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');

  if (!userId || !userEmail) {
    throw new AuthError('Unauthorized', 401);
  }

  return {
    id: userId,
    email: userEmail,
  };
}

/**
 * Require authentication for API route
 * Throws AuthError if not authenticated
 *
 * @param request - Next.js request object
 * @returns Authenticated user object
 * @throws AuthError if user not authenticated
 */
export function requireAuth(request: NextRequest): AuthUser {
  return getUserFromRequest(request);
}

/**
 * Get user from request or return null if not authenticated
 * Non-throwing version of getUserFromRequest
 *
 * @param request - Next.js request object
 * @returns User object or null
 */
export function getOptionalUser(request: NextRequest): AuthUser | null {
  try {
    return getUserFromRequest(request);
  } catch {
    return null;
  }
}
```

#### 3.2 Session Management Utilities

**File:** `lib/auth/session.ts`

**Complete Implementation:**

```typescript
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { User } from '@supabase/supabase-js';

/**
 * Get current session in Server Components
 *
 * @returns User object or null
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const user = await getServerSession();
 *   if (!user) redirect('/login');
 *   return <Dashboard user={user} />;
 * }
 * ```
 */
export async function getServerSession(): Promise<User | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Require authentication in Server Component
 * Throws error if not authenticated
 *
 * @returns User object
 * @throws Error if not authenticated
 */
export async function requireServerAuth(): Promise<User> {
  const user = await getServerSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

/**
 * Get or create user profile
 *
 * @param userId - User's UUID
 * @returns User profile from public.users table
 */
export async function getUserProfile(userId: string) {
  const supabase = createSupabaseServerClient();

  // Try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile) {
    return existingProfile;
  }

  // Profile doesn't exist - get auth user to create it
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Create profile
  const { data: newProfile, error: createError } = await supabase
    .from('users')
    .insert({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || null,
      avatar_url: user.user_metadata?.avatar_url || null,
      preferences: {},
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating user profile:', createError);
    throw new Error('Failed to create user profile');
  }

  return newProfile;
}

/**
 * Sync auth user metadata to public.users table
 * Called after OAuth login to update profile with provider data
 *
 * @param authUser - Supabase auth user
 */
export async function syncAuthUser(authUser: User) {
  const supabase = createSupabaseServerClient();

  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single();

  if (existingProfile) {
    // Update existing profile
    await supabase
      .from('users')
      .update({
        email: authUser.email!,
        name: authUser.user_metadata?.name || authUser.user_metadata?.full_name,
        avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id);
  } else {
    // Create new profile
    await supabase.from('users').insert({
      id: authUser.id,
      email: authUser.email!,
      name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
      avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      preferences: {},
    });
  }
}
```

#### 3.3 Validation Schemas

**File:** `lib/auth/validation.ts`

**Complete Implementation:**

```typescript
import { z } from 'zod';

/**
 * Email validation schema
 */
export const EmailSchema = z.string().email('Please enter a valid email address');

/**
 * Password validation schema with security requirements
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
  .regex(/[a-z]/, 'Password must include at least one lowercase letter')
  .regex(/[0-9]/, 'Password must include at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must include at least one special character');

/**
 * Name validation schema
 */
export const NameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .optional();

/**
 * Signup form validation schema
 */
export const SignupFormSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: NameSchema,
});

/**
 * Login form validation schema
 */
export const LoginFormSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Password reset request schema
 */
export const PasswordResetRequestSchema = z.object({
  email: EmailSchema,
});

/**
 * Password reset confirm schema
 */
export const PasswordResetConfirmSchema = z.object({
  password: PasswordSchema,
});

/**
 * Profile update schema
 */
export const ProfileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
  preferences: z.record(z.any()).optional(),
});

/**
 * Type exports for forms
 */
export type SignupFormData = z.infer<typeof SignupFormSchema>;
export type LoginFormData = z.infer<typeof LoginFormSchema>;
export type PasswordResetRequestData = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirmData = z.infer<typeof PasswordResetConfirmSchema>;
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
```

### 4. React Hooks

#### 4.1 useAuth Hook

**File:** `hooks/useAuth.ts`

**Complete Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { useRouter } from 'next/navigation';
import type { Provider } from '@supabase/supabase-js';

/**
 * Auth hook return type
 */
interface UseAuthReturn {
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication hook for client components
 *
 * Provides methods for:
 * - Email/password signup
 * - Email/password login
 * - OAuth login (Google, GitHub)
 * - Logout
 * - Password reset
 * - Password update
 *
 * @example
 * ```typescript
 * function LoginForm() {
 *   const { signIn, isLoading, error } = useAuth();
 *
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     await signIn(email, password);
 *   };
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            name: name || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Show success message (verification email sent)
      router.push('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Redirect to dashboard or returnUrl
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl') || '/dashboard';
      router.push(returnUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with OAuth provider (Google, GitHub)
   */
  const signInWithOAuth = async (provider: Provider) => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (oauthError) throw oauthError;

      // Redirect happens automatically
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with OAuth');
      setIsLoading(false);
      throw err;
    }
    // Don't set loading to false - page will redirect
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      router.push('/login');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Request password reset email
   */
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      });

      if (resetError) throw resetError;

      // Show success message
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async (newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Password updated successfully
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    isLoading,
    error,
  };
}
```

#### 4.2 useSession Hook

**File:** `hooks/useSession.ts`

**Complete Implementation:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import type { User } from '@supabase/supabase-js';

/**
 * Session hook return type
 */
interface UseSessionReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Session management hook
 *
 * Subscribes to auth state changes and provides current user
 *
 * @example
 * ```typescript
 * function UserProfile() {
 *   const { user, isLoading } = useSession();
 *
 *   if (isLoading) return <Loading />;
 *   if (!user) return <Login />;
 *
 *   return <div>Hello {user.email}</div>;
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        setUser(user);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, error };
}
```

#### 4.3 useUser Hook

**File:** `hooks/useUser.ts`

**Complete Implementation:**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * User hook return type
 */
interface UseUserReturn {
  user: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

/**
 * User profile hook
 *
 * Fetches and manages user profile from public.users table
 *
 * @example
 * ```typescript
 * function ProfileSettings() {
 *   const { user, updateProfile, isLoading } = useUser();
 *
 *   const handleUpdate = async () => {
 *     await updateProfile({ name: 'New Name' });
 *   };
 * }
 * ```
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get auth user first
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Fetch profile
        const { data, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (fetchError) {
          // Profile doesn't exist - create it
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.name || null,
              avatar_url: authUser.user_metadata?.avatar_url || null,
              preferences: {},
            })
            .select()
            .single();

          if (createError) throw createError;
          setUser(newProfile);
        } else {
          setUser(data);
        }
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { data, error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;

      setUser(data);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  return { user, isLoading, error, updateProfile };
}
```

### 5. UI Components

#### 5.1 Auth Provider

**File:** `components/auth/AuthProvider.tsx`

**Complete Implementation:**

```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type UserProfile = Database['public']['Tables']['users']['Row'];

/**
 * Auth context interface
 */
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
});

/**
 * Auth Provider Component
 *
 * Wraps the app and provides auth state to all children
 *
 * @example
 * ```typescript
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    // Get initial session
    const getSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setUser(user);

        if (user) {
          // Fetch profile
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          setProfile(profileData);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
```

#### 5.2 Signup Form

**File:** `components/auth/SignupForm.tsx`

**Complete Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SignupFormSchema, type SignupFormData } from '@/lib/auth/validation';
import Link from 'next/link';

/**
 * Signup Form Component
 *
 * Email/password registration form with validation
 */
export function SignupForm() {
  const { signUp, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    name: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form
    const validation = SignupFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Submit signup
    try {
      await signUp(formData.email, formData.password, formData.name);
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Log in
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name (optional)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <span className="text-sm text-gray-500">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 8 characters with uppercase, lowercase, number, and special
              character
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

#### 5.3 Login Form

**File:** `components/auth/LoginForm.tsx`

**Complete Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LoginFormSchema, type LoginFormData } from '@/lib/auth/validation';
import Link from 'next/link';

/**
 * Login Form Component
 *
 * Email/password authentication form
 */
export function LoginForm() {
  const { signIn, isLoading, error } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form
    const validation = LoginFormSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    // Submit login
    try {
      await signIn(formData.email, formData.password);
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Sign in to your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Or{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            create a new account
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`block w-full rounded-md border ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <span className="text-sm text-gray-500">
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

#### 5.4 OAuth Buttons

**File:** `components/auth/OAuthButtons.tsx`

**Complete Implementation:**

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

/**
 * OAuth Provider Buttons Component
 *
 * Google and GitHub OAuth authentication buttons
 */
export function OAuthButtons() {
  const { signInWithOAuth, isLoading } = useAuth();

  const handleGoogleSignIn = async () => {
    await signInWithOAuth('google');
  };

  const handleGitHubSignIn = async () => {
    await signInWithOAuth('github');
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </button>

        {/* GitHub Button */}
        <button
          type="button"
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          GitHub
        </button>
      </div>
    </div>
  );
}
```

#### 5.5 Password Reset Form

**File:** `components/auth/PasswordResetForm.tsx`

**Complete Implementation:**

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordResetRequestSchema } from '@/lib/auth/validation';
import Link from 'next/link';

/**
 * Password Reset Request Form Component
 */
export function PasswordResetForm() {
  const { resetPassword, isLoading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);

    // Validate email
    const validation = PasswordResetRequestSchema.safeParse({ email });
    if (!validation.success) {
      setValidationError(validation.error.errors[0].message);
      return;
    }

    // Submit reset request
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            If that email exists, we sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Check your inbox and click the link to reset your password. The link will expire
            in 1 hour.
          </p>
        </div>

        <Link
          href="/login"
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we will send you a password reset link.
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setValidationError('');
            }}
            className={`mt-1 block w-full rounded-md border ${
              validationError ? 'border-red-300' : 'border-gray-300'
            } px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
          />
          {validationError && (
            <p className="mt-1 text-sm text-red-600">{validationError}</p>
          )}
        </div>

        <div className="space-y-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send reset link'}
          </button>

          <Link
            href="/login"
            className="block text-center text-sm font-medium text-gray-600 hover:text-gray-500"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
```

---

## Implementation Plan

### Phase 1: Foundation (Day 1-2)

**1. Install Dependencies**
```bash
npm install @supabase/ssr @supabase/supabase-js zod
```

**2. Configure Supabase Auth**
- Enable email/password provider
- Configure email templates
- Set up redirect URLs
- Configure password requirements

**3. Create Base Files**
- Create Supabase clients (already exists from Feature 1.3)
- Create middleware.ts
- Set up environment variables

**Tasks:**
- [ ] Install dependencies
- [ ] Configure Supabase Auth settings
- [ ] Create middleware.ts
- [ ] Test middleware with simple route protection

### Phase 2: API Routes (Day 3-4)

**Implement in this order:**

1. **Session endpoint** (`/api/auth/session`)
   - Simplest endpoint
   - Used for testing other endpoints

2. **Signup endpoint** (`/api/auth/signup`)
   - User creation
   - Profile creation trigger

3. **Login endpoint** (`/api/auth/login`)
   - Authentication
   - Session creation

4. **Logout endpoint** (`/api/auth/logout`)
   - Session termination

5. **OAuth callback** (`/api/auth/callback`)
   - OAuth flow handling
   - Profile sync

6. **Password reset** (`/api/auth/reset-password`)
   - Reset request

7. **Password update** (`/api/auth/update-password`)
   - Password change

**Tasks:**
- [ ] Implement session endpoint and test
- [ ] Implement signup endpoint and test
- [ ] Implement login endpoint and test
- [ ] Implement logout endpoint and test
- [ ] Implement OAuth callback and test
- [ ] Implement password reset endpoints and test
- [ ] Add comprehensive error handling

### Phase 3: Auth Utilities (Day 5)

**Implement in this order:**

1. **Validation schemas** (`lib/auth/validation.ts`)
   - All Zod schemas
   - Type exports

2. **API protection** (`lib/auth/api-protection.ts`)
   - getUserFromRequest helper
   - AuthError class

3. **Session utilities** (`lib/auth/session.ts`)
   - Server-side helpers
   - Profile management

**Tasks:**
- [ ] Create validation schemas
- [ ] Implement API protection helpers
- [ ] Implement session utilities
- [ ] Write unit tests for utilities

### Phase 4: React Hooks (Day 6)

**Implement in this order:**

1. **useAuth hook** (`hooks/useAuth.ts`)
   - All auth methods
   - Error handling

2. **useSession hook** (`hooks/useSession.ts`)
   - Auth state subscription

3. **useUser hook** (`hooks/useUser.ts`)
   - Profile management

**Tasks:**
- [ ] Implement useAuth hook
- [ ] Implement useSession hook
- [ ] Implement useUser hook
- [ ] Test hooks with simple components

### Phase 5: UI Components (Day 7-8)

**Implement in this order:**

1. **AuthProvider** (`components/auth/AuthProvider.tsx`)
   - Context provider
   - Add to layout

2. **LoginForm** (`components/auth/LoginForm.tsx`)
   - Form UI
   - Validation
   - Submit handling

3. **SignupForm** (`components/auth/SignupForm.tsx`)
   - Form UI
   - Validation
   - Submit handling

4. **OAuthButtons** (`components/auth/OAuthButtons.tsx`)
   - Google button
   - GitHub button

5. **PasswordResetForm** (`components/auth/PasswordResetForm.tsx`)
   - Reset request form
   - Success state

**Tasks:**
- [ ] Create AuthProvider and add to layout
- [ ] Create login page with LoginForm
- [ ] Create signup page with SignupForm
- [ ] Add OAuth buttons to login/signup
- [ ] Create password reset page
- [ ] Style all components with Tailwind CSS

### Phase 6: OAuth Configuration (Day 9)

**Google OAuth:**
1. Create OAuth credentials in Google Cloud Console
2. Add redirect URIs
3. Configure in Supabase Auth
4. Test flow

**GitHub OAuth:**
1. Create OAuth app in GitHub
2. Add callback URL
3. Configure in Supabase Auth
4. Test flow

**Tasks:**
- [ ] Set up Google OAuth
- [ ] Set up GitHub OAuth
- [ ] Test complete OAuth flows
- [ ] Handle OAuth errors

### Phase 7: Testing (Day 10-11)

**Unit Tests:**
- [ ] Test validation schemas
- [ ] Test API protection helpers
- [ ] Test session utilities

**Integration Tests:**
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test OAuth flow (mocked)
- [ ] Test password reset flow
- [ ] Test session management
- [ ] Test route protection

**E2E Tests:**
- [ ] Complete signup journey
- [ ] Complete login journey
- [ ] OAuth flow
- [ ] Password reset flow
- [ ] Protected route access

### Phase 8: Security & Polish (Day 12-13)

**Security:**
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Security audit
- [ ] Test edge cases

**Polish:**
- [ ] Error message improvements
- [ ] Loading state refinements
- [ ] Accessibility improvements
- [ ] Mobile responsiveness

**Tasks:**
- [ ] Security review and hardening
- [ ] UX improvements
- [ ] Documentation updates
- [ ] Final testing

### Phase 9: Documentation & Handoff (Day 14)

**Documentation:**
- [ ] Update README with setup instructions
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Document common use cases

**Deployment:**
- [ ] Test in staging environment
- [ ] Verify all environment variables
- [ ] Test OAuth in production domain
- [ ] Smoke tests

---

## Security Implementation

### 1. Password Security

**Hashing:**
- Handled automatically by Supabase Auth
- Uses bcrypt with appropriate rounds
- Never store plain passwords

**Validation:**
```typescript
const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include uppercase letter')
  .regex(/[a-z]/, 'Must include lowercase letter')
  .regex(/[0-9]/, 'Must include number')
  .regex(/[^A-Za-z0-9]/, 'Must include special character');
```

**Best Practices:**
- Enforce complexity requirements
- No password history (handled by Supabase)
- Invalidate all sessions on password change
- Secure password reset flow with time-limited tokens

### 2. Session Security

**Cookie Configuration:**
```typescript
{
  httpOnly: true,           // Prevent JavaScript access
  secure: true,             // HTTPS only (production)
  sameSite: 'lax',          // CSRF protection
  maxAge: 604800,           // 7 days
  path: '/',                // Available to all routes
}
```

**Token Management:**
- Access token: 1 hour expiration
- Refresh token: 7 days expiration
- Automatic refresh handled by Supabase
- Use `getUser()` for validation (not `getSession()`)

**Session Invalidation:**
- On logout: Revoke refresh token
- On password change: Invalidate all sessions
- On suspicious activity: Manual revocation

### 3. Rate Limiting

**Implementation Strategy:**

Use Vercel's edge config or Redis for rate limiting:

```typescript
// lib/auth/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Login rate limit: 5 attempts per 15 minutes
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
});

// Signup rate limit: 3 attempts per hour
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
});

// Password reset: 3 attempts per hour
export const resetRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
});
```

**Usage in API routes:**
```typescript
// In login endpoint
const identifier = request.headers.get('x-forwarded-for') || 'unknown';
const { success } = await loginRateLimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.',
      code: 'rate_limit_exceeded',
    },
    { status: 429 }
  );
}
```

### 4. CSRF Protection

**Built-in Protection:**
- SameSite='lax' cookies prevent most CSRF attacks
- Supabase Auth includes state parameter for OAuth

**Additional Measures:**
- Verify origin header for state-changing requests
- Use POST for all mutations
- Never use GET for state changes

### 5. Input Validation

**Client-Side:**
- Zod schemas for all forms
- Real-time validation feedback
- Clear error messages

**Server-Side:**
- Always validate on server (never trust client)
- Use same Zod schemas
- Sanitize all inputs
- Parameterized queries (handled by Supabase)

### 6. Error Handling

**Security Considerations:**
- Never expose sensitive information in errors
- Use generic messages for auth failures
- Log detailed errors server-side only
- Implement error monitoring (Sentry)

**User-Friendly Errors:**
```typescript
// Bad: "User with email john@example.com does not exist"
// Good: "Invalid email or password"

// Bad: "Database connection failed"
// Good: "Service temporarily unavailable. Please try again."
```

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 80%+

**Test Files:**
```
tests/unit/
├── lib/
│   └── auth/
│       ├── validation.test.ts      // Zod schemas
│       ├── api-protection.test.ts  // Helper functions
│       └── session.test.ts         // Session utilities
└── components/
    └── auth/
        ├── LoginForm.test.tsx      // Component logic
        └── SignupForm.test.tsx     // Component logic
```

**Example Test:**
```typescript
// tests/unit/lib/auth/validation.test.ts
import { describe, it, expect } from 'vitest';
import { PasswordSchema } from '@/lib/auth/validation';

describe('PasswordSchema', () => {
  it('accepts valid password', () => {
    const result = PasswordSchema.safeParse('Password123!');
    expect(result.success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = PasswordSchema.safeParse('password123!');
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('uppercase');
  });

  it('rejects password without number', () => {
    const result = PasswordSchema.safeParse('Password!');
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('number');
  });

  it('rejects short password', () => {
    const result = PasswordSchema.safeParse('Pass1!');
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('8 characters');
  });
});
```

### Integration Tests

**Coverage Target:** Key flows covered

**Test Files:**
```
tests/integration/
└── auth/
    ├── signup.test.ts
    ├── login.test.ts
    ├── logout.test.ts
    ├── password-reset.test.ts
    ├── session-management.test.ts
    └── route-protection.test.ts
```

**Example Test:**
```typescript
// tests/integration/auth/signup.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Signup Flow', () => {
  let supabase: any;

  beforeAll(() => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  });

  afterAll(async () => {
    // Cleanup test users
  });

  it('creates user and profile on signup', async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Call signup endpoint
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.userId).toBeDefined();

    // Verify user in auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(data.userId);
    expect(authUser.user.email).toBe(testEmail);

    // Verify profile in public.users
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.userId)
      .single();

    expect(profile).toBeDefined();
    expect(profile.email).toBe(testEmail);
    expect(profile.name).toBe('Test User');
  });

  it('rejects duplicate email', async () => {
    const testEmail = 'existing@example.com';

    // Attempt signup with existing email
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPassword123!',
      }),
    });

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.code).toBe('email_exists');
  });
});
```

### E2E Tests

**Coverage Target:** Critical user journeys

**Test Files:**
```
tests/e2e/
└── auth/
    ├── complete-signup-flow.spec.ts
    ├── complete-login-flow.spec.ts
    ├── oauth-flow.spec.ts
    ├── password-reset-flow.spec.ts
    └── protected-routes.spec.ts
```

**Example Test:**
```typescript
// tests/e2e/auth/complete-login-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete login flow', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Fill in credentials
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'TestPassword123!');

  // Submit form
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Should display user's name
  await expect(page.locator('text=Test User')).toBeVisible();

  // Should be able to access protected pages
  await page.goto('/reports');
  await expect(page).toHaveURL('/reports');

  // Logout
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Logout');

  // Should redirect to login
  await expect(page).toHaveURL('/login');

  // Should not be able to access protected pages
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/);
});
```

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# OAuth Providers (Optional)
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# GitHub OAuth
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Rate Limiting (Optional)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx
```

### Supabase Auth Configuration

**1. Enable Providers:**
- Navigate to Authentication > Providers in Supabase Dashboard
- Enable Email provider
- Configure email templates
- Enable Google OAuth (optional)
- Enable GitHub OAuth (optional)

**2. Configure URLs:**
```
Site URL: http://localhost:3000 (development)
          https://yourdomain.com (production)

Redirect URLs:
  http://localhost:3000/auth/callback
  https://yourdomain.com/auth/callback
```

**3. Email Templates:**

Update email templates in Supabase Dashboard:

**Confirm Signup:**
```html
<h2>Confirm your signup</h2>
<p>Click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email</a></p>
```

**Reset Password:**
```html
<h2>Reset your password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link will expire in 1 hour.</p>
```

**4. Password Requirements:**
```
Minimum password length: 8
Require special characters: Yes
```

### OAuth Provider Setup

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `https://xxxxx.supabase.co/auth/v1/callback`
7. Copy Client ID and Client Secret
8. Add to Supabase Dashboard and environment variables

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Application name: Radiology Reporting App
4. Homepage URL: `https://yourdomain.com`
5. Authorization callback URL:
   - `https://xxxxx.supabase.co/auth/v1/callback`
6. Copy Client ID and generate Client Secret
7. Add to Supabase Dashboard and environment variables

---

## Migration from Current State

### What Exists (from Feature 1.3)

**Completed:**
- ✅ Supabase clients (server, browser, middleware)
- ✅ Database schema with users table
- ✅ Row Level Security policies
- ✅ TypeScript types for database
- ✅ Basic project structure

**Files:**
- `/lib/database/supabase-server.ts`
- `/lib/database/supabase-browser.ts`
- `/lib/database/supabase-middleware.ts`
- `/types/database.ts`
- Database schema with RLS policies

### What Needs to Be Added

**New Files:**
```
/middleware.ts                                  ← NEW
/app/api/auth/
  ├── signup/route.ts                          ← NEW
  ├── login/route.ts                           ← NEW
  ├── logout/route.ts                          ← NEW
  ├── callback/route.ts                        ← NEW
  ├── session/route.ts                         ← NEW
  ├── reset-password/route.ts                  ← NEW
  └── update-password/route.ts                 ← NEW
/lib/auth/
  ├── api-protection.ts                        ← NEW
  ├── session.ts                               ← NEW
  └── validation.ts                            ← NEW
/hooks/
  ├── useAuth.ts                               ← NEW
  ├── useSession.ts                            ← NEW
  └── useUser.ts                               ← NEW
/components/auth/
  ├── AuthProvider.tsx                         ← NEW
  ├── LoginForm.tsx                            ← NEW
  ├── SignupForm.tsx                           ← NEW
  ├── OAuthButtons.tsx                         ← NEW
  └── PasswordResetForm.tsx                    ← NEW
/app/(auth)/
  ├── login/page.tsx                           ← NEW
  ├── signup/page.tsx                          ← NEW
  ├── reset-password/page.tsx                  ← NEW
  └── verify-email/page.tsx                    ← NEW
```

### Integration Points

**1. Use Existing Supabase Clients:**

The middleware and API routes will use the existing clients:
```typescript
import { createSupabaseServerClient } from '@/lib/database/supabase-server';
import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import { createSupabaseMiddlewareClient } from '@/lib/database/supabase-middleware';
```

**2. Database Integration:**

The auth system will work with the existing `users` table:
```typescript
// User profile already defined in database.ts
type UserProfile = Database['public']['Tables']['users']['Row'];
```

**3. RLS Integration:**

Existing RLS policies will automatically apply:
```sql
-- Already exists
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);
```

**4. Type Safety:**

Use existing database types:
```typescript
import type { Database } from '@/types/database';
```

### Changes to Existing Files

**Minimal Changes Required:**

1. **Update `app/layout.tsx`:**
```typescript
import { AuthProvider } from '@/components/auth/AuthProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

2. **Environment Variables:**
Add OAuth credentials to existing `.env.local`

3. **Supabase Configuration:**
Configure auth settings in Supabase Dashboard

**No Breaking Changes:**
- Existing Supabase clients remain unchanged
- Database schema remains unchanged
- TypeScript types remain unchanged
- All existing Feature 1.3 code continues to work

---

## Summary

This design document provides a complete, implementable specification for Feature 1.4: Supabase Authentication. All code is production-ready and follows Next.js 14+ and Supabase best practices.

**Key Deliverables:**
- ✅ Complete middleware implementation
- ✅ All auth API routes with error handling
- ✅ Auth utilities and helpers
- ✅ React hooks for client-side auth
- ✅ UI components with Tailwind CSS
- ✅ Security best practices
- ✅ Comprehensive testing strategy
- ✅ Clear implementation plan
- ✅ Environment configuration guide
- ✅ Migration path from current state

**Next Steps:**
1. Review and approve this design
2. Begin Phase 1 implementation (foundation)
3. Follow the 14-day implementation plan
4. Conduct testing at each phase
5. Deploy and validate in production

---

**Document Prepared By:** Design Architect
**Date:** 2025-01-16
**Status:** Ready for Review
