/**
 * Next.js Middleware for Route Protection and Session Management
 *
 * This middleware runs on every request and:
 * 1. Validates user sessions using Supabase Auth
 * 2. Refreshes expired tokens automatically
 * 3. Protects routes that require authentication
 * 4. Adds user context to request headers for Server Components and API routes
 * 5. Handles redirects for authenticated/unauthenticated users
 *
 * SECURITY NOTE: Uses getUser() instead of getSession() for server-side
 * validation. getUser() validates the JWT with Supabase server, while
 * getSession() only reads the JWT without validation.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/reset-password',
  '/verify-email',
];

/**
 * Auth pages that authenticated users shouldn't access
 */
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * Route prefixes that require authentication
 */
const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/generate',
  '/reports',
  '/templates',
  '/settings',
];

/**
 * API routes that don't require authentication
 */
const PUBLIC_API_ROUTES = [
  '/api/auth/signup',
  '/api/auth/login',
  '/api/auth/callback',
  '/api/auth/reset-password',
  '/api/health',
];

/**
 * Check if a route is public (no auth required)
 */
function isPublicRoute(pathname: string): boolean {
  // Exact match for public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  // Auth callback route
  if (pathname.startsWith('/auth/callback')) {
    return true;
  }

  // Next.js internal routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/_next')) {
    return true;
  }

  // Public API routes
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return true;
  }

  // Webhook routes (should have their own signature verification)
  if (pathname.startsWith('/api/webhooks/')) {
    return true;
  }

  return false;
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
 * Check if route is a protected API route
 */
function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/') && !PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route)) && !pathname.startsWith('/api/webhooks/');
}

/**
 * Middleware function that runs on every request
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (isPublicRoute(pathname) && !isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  // Create response object
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
          // Update request cookies for Server Components
          request.cookies.set({
            name,
            value,
            ...options,
          });

          // Update response cookies for browser
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
          // Remove from request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          });

          // Remove from response cookies
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

  // Validate session using getUser() (more secure than getSession())
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's an error or no user, treat as unauthenticated
  const isAuthenticated = !error && user !== null;

  // Add user context to headers for authenticated requests
  if (isAuthenticated && user) {
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-email', user.email || '');
  }

  // Handle protected routes
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow access
    return response;
  }

  // Handle protected API routes
  if (isProtectedApiRoute(pathname)) {
    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Authentication required',
          code: 'unauthorized',
        },
        {
          status: 401,
          headers: {
            'WWW-Authenticate': 'Bearer realm="api"',
          },
        }
      );
    }

    // User is authenticated, allow access
    return response;
  }

  // Handle auth routes (login, signup) - redirect if already authenticated
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      // Check if there's a return URL
      const returnUrl = request.nextUrl.searchParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        return NextResponse.redirect(new URL(returnUrl, request.url));
      }

      // Default redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // User is not authenticated, allow access to auth pages
    return response;
  }

  // For all other routes, just continue
  return response;
}

/**
 * Middleware configuration
 *
 * This matcher ensures middleware runs on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico (favicon)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
