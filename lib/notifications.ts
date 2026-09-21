import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export type NotificationType = "act_published" | "participation_reminder" | "continuity_reminder";

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  createdAtIso: string;
  readAtIso: string | null;
}

/** In-app Notifications (Phase 4), signed-in contributor's own session --
 *  RLS (select_own_notifications) already restricts this to their own
 *  rows, so there's no separate contributor_id filter to apply here. */
export async function getMyNotifications(): Promise<NotificationRow[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, created_at, read_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    type: row.type as NotificationType,
    title: row.title as string,
    body: row.body as string,
    link: row.link as string | null,
    createdAtIso: row.created_at as string,
    readAtIso: row.read_at as string | null,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return 0;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return count ?? 0;
}
