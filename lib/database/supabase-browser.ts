import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

/**
 * Creates a Supabase client for Client Components
 *
 * This client:
 * - Runs in the browser
 * - Uses localStorage for session persistence
 * - Respects RLS policies based on authenticated user
 * - Should be used in Client Components (with 'use client' directive)
 *
 * Implementation Note:
 * - Client is created once and reused (singleton pattern)
 * - Safe to call multiple times - returns the same instance
 *
 * @example
 * ```typescript
 * // In a Client Component
 * 'use client';
 *
 * import { createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
 * import { useEffect, useState } from 'react';
 *
 * export function TemplateList() {
 *   const [templates, setTemplates] = useState([]);
 *   const supabase = createSupabaseBrowserClient();
 *
 *   useEffect(() => {
 *     async function loadTemplates() {
 *       const { data } = await supabase.from('templates').select('*');
 *       setTemplates(data || []);
 *     }
 *     loadTemplates();
 *   }, []);
 *
 *   return <div>{templates.map(t => <div key={t.id}>{t.name}</div>)}</div>;
 * }
 * ```
 *
 * @returns Supabase client for browser environment
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
