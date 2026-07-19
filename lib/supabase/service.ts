import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only client used exclusively by the Mission Camera capture flow.
// Mission Camera is intentionally unauthenticated for this MVP (no
// field-executive login yet), so it can't rely on RLS `authenticated`
// policies. The service role key bypasses RLS entirely -- this file must
// NEVER be imported into a 'use client' component or exposed to the browser.
let cachedClient: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  cachedClient = createClient(url, serviceKey, { auth: { persistSession: false } });
  return cachedClient;
}
