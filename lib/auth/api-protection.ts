/**
 * API Route Protection Utilities
 *
 * This module provides utilities for protecting API routes and extracting
 * user context from requests.
 *
 * The middleware adds user context to request headers after validating
 * the session, which these utilities can then extract.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Authenticated user context extracted from request headers
 */
export interface AuthUser {
  id: string;
  email: string;
}

/**
 * Custom error for authentication failures in API routes
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get authenticated user from request headers
 *
 * The middleware adds 'x-user-id' and 'x-user-email' headers to
 * authenticated requests. This function extracts those headers
 * and returns a typed user object.
 *
 * @param request - Next.js request object
 * @returns Authenticated user context
 * @throws {AuthError} If user headers are missing (unauthorized)
 *
 * @example
 * ```typescript
 * // In an API route
 * export async function POST(request: NextRequest) {
 *   try {
 *     const user = getUserFromRequest(request);
 *     // User is guaranteed to be authenticated here
 *     console.log('User ID:', user.id);
 *     console.log('User Email:', user.email);
 *   } catch (error) {
 *     if (error instanceof AuthError) {
 *       return NextResponse.json(
 *         { error: error.message },
 *         { status: error.statusCode }
 *       );
 *     }
 *   }
 * }
 * ```
 */
export function getUserFromRequest(request: NextRequest): AuthUser {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');

  if (!userId || !userEmail) {
    throw new AuthError('Unauthorized - Authentication required', 401, 'unauthorized');
  }

  return {
    id: userId,
    email: userEmail,
  };
}

/**
 * Require authentication for an API route
 *
 * This is a convenience wrapper around getUserFromRequest that
 * automatically handles errors and returns proper JSON responses.
 *
 * @param request - Next.js request object
 * @returns Authenticated user or error response
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const authResult = requireApiAuth(request);
 *   if (authResult instanceof NextResponse) {
 *     return authResult; // Return error response
 *   }
 *
 *   const user = authResult;
 *   // User is authenticated
 * }
 * ```
 */
export function requireApiAuth(request: NextRequest): AuthUser | NextResponse {
  try {
    return getUserFromRequest(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        {
          status: error.statusCode,
          headers: {
            'WWW-Authenticate': 'Bearer realm="api"',
          },
        }
      );
    }

    // Unexpected error
    console.error('Unexpected error in requireApiAuth:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'internal_error',
      },
      { status: 500 }
    );
  }
}

/**
 * Handle API errors with proper formatting
 *
 * This provides consistent error responses across all API routes.
 *
 * @param error - Error object
 * @returns NextResponse with formatted error
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   try {
 *     const user = getUserFromRequest(request);
 *     // ... business logic
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Authentication errors
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      {
        status: error.statusCode,
        headers:
          error.statusCode === 401
            ? {
                'WWW-Authenticate': 'Bearer realm="api"',
              }
            : undefined,
      }
    );
  }

  // Standard errors
  if (error instanceof Error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: 'api_error',
      },
      { status: 500 }
    );
  }

  // Unknown errors
  console.error('Unknown API error:', error);
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
      code: 'unknown_error',
    },
    { status: 500 }
  );
}

/**
 * Validate API request method
 *
 * Helper to ensure the request uses the expected HTTP method.
 *
 * @param request - Next.js request object
 * @param allowedMethod - Allowed HTTP method
 * @returns NextResponse with error if method doesn't match, null otherwise
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const methodError = validateMethod(request, 'GET');
 *   if (methodError) return methodError;
 *   // Method is valid, continue
 * }
 * ```
 */
export function validateMethod(
  request: NextRequest,
  allowedMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
): NextResponse | null {
  if (request.method !== allowedMethod) {
    return NextResponse.json(
      {
        success: false,
        error: `Method ${request.method} not allowed`,
        code: 'method_not_allowed',
      },
      {
        status: 405,
        headers: {
          Allow: allowedMethod,
        },
      }
    );
  }

  return null;
}

/**
 * Create a success response with consistent formatting
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with formatted success response
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // ... business logic
 *   return successResponse({ userId: '123', name: 'John' });
 * }
 * ```
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Create an error response with consistent formatting
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Error code for client-side handling
 * @returns NextResponse with formatted error response
 *
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   if (!isValid) {
 *     return errorResponse('Invalid input', 400, 'invalid_input');
 *   }
 * }
 * ```
 */
export function errorResponse(message: string, status: number = 400, code?: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code,
    },
    { status }
  );
}
