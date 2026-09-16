"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/** Same underlying Supabase Auth session as lib/auth-actions.ts's
 *  signOutAction -- one credential pool for both apps -- but redirects
 *  back to the Operations Portal's own sign-in page, not the Contributor
 *  App's. */
export async function opsSignOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/ops/sign-in");
}
