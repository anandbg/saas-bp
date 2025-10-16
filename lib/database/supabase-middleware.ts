import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Middleware
 *
 * This client:
 * - Runs in Edge Runtime
 * - Manages session refresh
 * - Updates cookies in the response
 * - Should be used in middleware.ts only
 *
 * Implementation Note:
 * - Returns both the client AND modified response
 * - MUST use the returned response object (contains updated cookies)
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * import { createSupabaseMiddlewareClient } from '@/lib/database/supabase-middleware';
 *
 * export async function middleware(request: NextRequest) {
 *   const { supabase, response } = createSupabaseMiddlewareClient(request);
 *
 *   // Check auth session
 *   const { data: { session } } = await supabase.auth.getSession();
 *
 *   if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *
 *   // IMPORTANT: Return the response object (has updated cookies)
 *   return response;
 * }
 * ```
 *
 * @param request - The Next.js request object
 * @returns Object containing supabase client and response object
 */
export function createSupabaseMiddlewareClient(request: NextRequest) {
  // Create a response object to modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update both request and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          });
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
          // Remove from both request and response cookies
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

  return { supabase, response };
}
