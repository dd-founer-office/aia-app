"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/** CA-013 Profile's "Personal details" row -- previously a dead
 *  placeholder in Account Settings (see app/profile/page.tsx's own
 *  comment). Updates users.full_name and contributors.display_name
 *  together: display_name is what's actually rendered everywhere (Home,
 *  Journey, Profile header), full_name is the locked ERD's separate
 *  mirror column (see users table's own comment) -- both need to agree,
 *  or the two screens would show different names for the same person. */
export async function updatePersonalDetailsAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in." };

  const name = (formData.get("name") as string | null)?.trim();
  const country = (formData.get("country") as string | null)?.trim() || null;
  if (!name) return { error: "Name is required." };

  const { error: usersError } = await supabase.from("users").update({ full_name: name, country }).eq("id", user.id);
  if (usersError) return { error: usersError.message };

  const { error: contributorsError } = await supabase
    .from("contributors")
    .update({ display_name: name })
    .eq("user_id", user.id);
  if (contributorsError) return { error: contributorsError.message };

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/practice");
  return {};
}
