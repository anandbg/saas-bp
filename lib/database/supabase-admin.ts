/**
 * Supabase Admin Client (Service Role)
 *
 * This module provides an admin client with service role key for server-side operations.
 * Currently muted as database features are disabled.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { FEATURES } from '@/lib/config/features';

// Mock admin client when database is disabled
const mockAdminClient = {
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
  }),
  auth: {
    admin: {
      listUsers: () => Promise.resolve({ data: { users: [] }, error: null }),
      createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      deleteUser: () => Promise.resolve({ data: null, error: null }),
      updateUserById: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  },
  rpc: () => Promise.resolve({ data: null, error: null }),
};

export function getSupabaseAdmin() {
  if (!FEATURES.DATABASE) {
    console.warn('[Database] DATABASE feature is disabled. Using mock admin client.');
    return mockAdminClient as any;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Database] Missing Supabase credentials');
    return mockAdminClient as any;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Export a singleton instance
export const supabaseAdmin = getSupabaseAdmin();

// Alias for compatibility with existing code
export const createSupabaseAdminClient = getSupabaseAdmin;
