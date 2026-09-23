"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}

/** Testing-phase signup: creates the auth user directly via the Admin API
 *  (service role, same client Mission Camera's own unauthenticated writes
 *  use), which creates the account already confirmed and never attempts
 *  to send a confirmation email at all. This sidesteps this Supabase
 *  project's email sending entirely -- plain signUp() was failing
 *  outright with "Error sending confirmation email" (no SMTP configured
 *  on this project). Founder-directed simplification for testing the
 *  flow with throwaway accounts; swap back to signUp()-driven email
 *  confirmation once real contributors are onboarding and this project
 *  has real transactional email configured. Only creates the account --
 *  the client still signs in itself afterward via signInWithPassword()
 *  to get a real session cookie, so this never bypasses password auth
 *  itself, only the email round-trip. */
export async function createTestAccountAction(email: string, password: string, name: string): Promise<{ error?: string }> {
  const supabase = getSupabaseServiceClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: name ? { full_name: name } : undefined,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("already") && message.includes("registered")) {
      return { error: "An account with this email already exists. Try signing in instead." };
    }
    return { error: error.message };
  }

  return {};
}
