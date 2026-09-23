import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

// Only reached now when this Supabase project requires email confirmation
// -- the emailRedirectTo passed to signUp() on the sign-in page. Plain
// signInWithPassword()/signUp() (confirm-email off) never hit this route at
// all; they set the session directly client-side. Exchanges the one-time
// code for a real session, setting the auth cookie the rest of the app
// reads -- for a first-time signer-up this IS the moment
// handle_new_auth_user() (the DB trigger) fires, since that's when
// auth.users actually gets the new row.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth_callback_failed`);
}
