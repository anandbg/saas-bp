import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Server Components and API Routes
 *
 * This client:
 * - Uses cookies for session management
 * - Respects RLS policies based on authenticated user
 * - Should be used in Server Components and API Routes
 *
 * @example
 * ```typescript
 * // In a Server Component
 * import { createSupabaseServerClient } from '@/lib/database/supabase-server';
 *
 * export default async function Page() {
 *   const supabase = createSupabaseServerClient();
 *   const { data: templates } = await supabase.from('templates').select('*');
 *   return <TemplateList templates={templates} />;
 * }
 * ```
 *
 * @returns Supabase client with user context from cookies
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase admin client with service role privileges
 *
 * This client:
 * - Bypasses Row Level Security (RLS)
 * - Should ONLY be used for admin operations
 * - Must never be exposed to the client
 * - Should be used sparingly and with caution
 *
 * @example
 * ```typescript
 * // In an API route for admin operations
 * import { createSupabaseAdminClient } from '@/lib/database/supabase-server';
 *
 * export async function POST(request: Request) {
 *   // Verify user is admin first!
 *   const adminSupabase = createSupabaseAdminClient();
 *
 *   // Can access all data (bypasses RLS)
 *   const { data: allUsers } = await adminSupabase
 *     .from('users')
 *     .select('*');
 *
 *   return Response.json(allUsers);
 * }
 * ```
 *
 * @returns Supabase client with service role privileges
 */
export function createSupabaseAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not defined. ' + 'This client requires service role access.'
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get() {
          return undefined;
        },
        set() {},
        remove() {},
      },
    }
  );
}
