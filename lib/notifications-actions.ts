"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

/** Opening a notification marks it read -- RLS (update_own_notifications)
 *  already restricts this to the signed-in contributor's own row, so a
 *  stray id for someone else's notification just updates zero rows rather
 *  than erroring. */
export async function markNotificationReadAction(id: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/notifications");
  revalidatePath("/");
  return {};
}

export async function markAllNotificationsReadAction(): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in." };

  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  if (error) return { error: error.message };

  revalidatePath("/notifications");
  revalidatePath("/");
  return {};
}

/** Profile Account Settings > Communication preferences. Updates
 *  contributors' three notification-preference booleans, reusing that
 *  table's existing update_own_contributor RLS policy (same one
 *  updatePersonalDetailsAction already relies on). */
export async function updateNotificationPreferencesAction(formData: FormData): Promise<{ error?: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to sign in." };

  const { error } = await supabase
    .from("contributors")
    .update({
      notify_participation_reminders: formData.get("notify_participation_reminders") === "on",
      notify_act_published: formData.get("notify_act_published") === "on",
      notify_continuity_reminders: formData.get("notify_continuity_reminders") === "on",
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/profile");
  return {};
}
