/**
 * Optional Supabase Database Client
 *
 * This client is feature-flag controlled. When DATABASE feature is disabled,
 * it returns a mock client that prevents database errors while preserving
 * the code structure for future activation.
 *
 * Usage:
 * ```typescript
 * import { getSupabaseClient } from '@/lib/database/supabase-client';
 *
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('table').select();
 * ```
 */

import { createClient } from '@supabase/supabase-js';
import { FEATURES } from '@/lib/config/features';
import type { Database } from '@/types/database';

/**
 * Mock Supabase client for when database is disabled
 * Returns empty results to prevent errors
 */
const mockSupabaseClient = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: function () {
      return this;
    },
    neq: function () {
      return this;
    },
    gt: function () {
      return this;
    },
    lt: function () {
      return this;
    },
    gte: function () {
      return this;
    },
    lte: function () {
      return this;
    },
    like: function () {
      return this;
    },
    ilike: function () {
      return this;
    },
    in: function () {
      return this;
    },
    is: function () {
      return this;
    },
    order: function () {
      return this;
    },
    limit: function () {
      return this;
    },
    range: function () {
      return this;
    },
    single: () => Promise.resolve({ data: null, error: null }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    signIn: () => Promise.resolve({ data: null, error: null }),
    signUp: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
      list: () => Promise.resolve({ data: [], error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};

/**
 * Get Supabase client (real or mock depending on feature flag)
 * @returns Supabase client instance
 */
export function getSupabaseClient() {
  if (!FEATURES.DATABASE) {
    console.warn(
      '[Database] DATABASE feature is disabled. Using mock client. Enable with NEXT_PUBLIC_ENABLE_DATABASE=true'
    );
    return mockSupabaseClient as any;
  }

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '[Database] Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    return mockSupabaseClient as any;
  }

  // Return real Supabase client
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Get server-side Supabase client with service role key
 * IMPORTANT: Only use on server-side code (API routes, Server Actions)
 * @returns Supabase client with service role privileges
 */
export function getSupabaseAdminClient() {
  if (!FEATURES.DATABASE) {
    console.warn(
      '[Database] DATABASE feature is disabled. Using mock client.'
    );
    return mockSupabaseClient as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error(
      '[Database] Missing Supabase service role credentials. Set SUPABASE_SERVICE_ROLE_KEY'
    );
    return mockSupabaseClient as any;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Check if database is enabled
 * @returns true if database feature is enabled
 */
export function isDatabaseEnabled(): boolean {
  return FEATURES.DATABASE;
}
