import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Standard Supabase SSR middleware pattern (file/export renamed from
// `middleware` to `proxy` per Next.js 16's own convention -- this project's
// installed Next version already deprecated the old name, confirmed at dev
// server startup): refreshes the auth session cookie on every request so a
// token expiring mid-visit doesn't silently log the contributor out. Reads
// the anon key only (never the service role) -- this runs on every request
// including anonymous ones, so it must never be able to bypass RLS.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Reading the user (not just the session) is what actually triggers a
  // token refresh against Supabase Auth when needed -- required, not just a
  // convenience read, per Supabase's own SSR guidance.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets, so the refresh runs on
     * every real page/route-handler request without wasting a round trip
     * on images/fonts/etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
