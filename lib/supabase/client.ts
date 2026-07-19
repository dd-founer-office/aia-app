import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Public, read-only client for the Contributor App. Uses the anon key --
// RLS policies restrict it to published missions/evidence/publications
// only (see migration aia_public_read_published_missions). Never use the
// service role key here; this file may run in contexts reachable by the
// browser bundle.
let cachedClient: SupabaseClient | null = null;

export function getSupabasePublicClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}
