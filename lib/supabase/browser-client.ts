import { createBrowserClient } from "@supabase/ssr";

// Browser client for Supabase Auth. Distinct from getSupabasePublicClient()
// in lib/supabase/client.ts -- that one is a plain anon client for reading
// published data (missions/evidence/etc.) with no session persistence at
// all. This one is cookie-based (createBrowserClient, not createClient), so
// a session started here (magic link sign-in) is readable by the server
// client (lib/supabase/server-client.ts) on the next request via the same
// cookie -- what makes server components/route handlers see "signed in"
// immediately after the client redirects back from the email link.
export function getSupabaseAuthBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
