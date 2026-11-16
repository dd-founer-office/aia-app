import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Standard Supabase SSR middleware pattern (file/export renamed from
// `middleware` to `proxy` per Next.js 16's own convention -- this project's
// installed Next version already deprecated the old name, confirmed at dev
// server startup): refreshes the auth session cookie on every request so a
// token expiring mid-visit doesn't silently log the contributor out. Reads
// the anon key only (never the service role) -- this runs on every request
// including anonymous ones, so it must never be able to bypass RLS.
// Heritage Gifting is its own Distant Devotion identity with its own URL
// space. On heritage.distantdevotion.com the public paths are the short ones
// (/vaazhga-vaazhthudan/<name>-<id>); internally they live under
// /heritage-gifting so none of it can collide with Aram in Action routes.
// The same internal path also works on any deployment URL, which is how
// previews are viewed before the domain points at the app.
const HERITAGE_HOST = /^heritage\./i;
const HERITAGE_ROOT = "/heritage-gifting";

export async function proxy(request: NextRequest) {
  if (HERITAGE_HOST.test(request.headers.get("host") ?? "")) {
    const { pathname } = request.nextUrl;
    const internal =
      pathname === HERITAGE_ROOT ||
      pathname.startsWith(`${HERITAGE_ROOT}/`) ||
      pathname.startsWith("/api/") ||
      pathname.startsWith("/_next/");
    if (!internal) {
      const url = request.nextUrl.clone();
      url.pathname = `${HERITAGE_ROOT}${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

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
