import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side, cookie-aware Supabase client for reading the signed-in
// contributor's session in Server Components and Route Handlers. Distinct
// from getSupabaseServiceClient() in lib/supabase/service.ts, which uses the
// service-role key and bypasses RLS entirely for Mission Camera's
// unauthenticated writes -- this one authenticates AS the actual signed-in
// user (anon key + their session cookie), so RLS policies scoped to
// auth.uid() apply exactly as they would for that user's own request.
//
// A Server Component can't set cookies (Next.js throws if you try outside a
// Server Action/Route Handler), so `set`/`remove` are wrapped in try/catch
// here -- harmless when called from a place that can't persist the refreshed
// token; proxy.ts is what actually keeps the session cookie current on
// every request, this is just defensive per Supabase's own documented
// pattern for the App Router.
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component -- session refresh for this
          // request is handled by proxy.ts instead.
        }
      },
    },
  });
}
