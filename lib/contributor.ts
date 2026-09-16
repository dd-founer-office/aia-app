import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { StageName } from "@/types";

export interface CurrentContributor {
  userId: string;
  email: string;
  displayName: string;
  contributorId: string;
  currentStage: StageName;
  continuityMonthCount: number;
  hasParticipatedThisMonth: boolean;
  /** CA-009 Hero Card's "Lifetime Acts" -- count of completed
   *  participations, same figure as CA-012/CA-013's lifetimeParticipationCount. */
  lifetimeParticipationCount: number;
}

/** "YYYY-MM" -- shared with lib/participation-actions.ts so both the read
 *  side (this file) and the write side (recording a participation) agree on
 *  what "this month" means. */
export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Server-side only (uses the cookie-aware server client). Returns null for a
 * signed-out visitor -- callers render a sign-in prompt in that case rather
 * than treating it as an error. contributors/aram_journeys rows always
 * exist for a signed-in user (handle_new_auth_user() provisions both at
 * signup), so a missing row here is a genuine data-integrity problem, not a
 * normal state to design around.
 */
export async function getCurrentContributor(): Promise<CurrentContributor | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: contributor } = await supabase
    .from("contributors")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contributor) return null;

  const { data: journey } = await supabase
    .from("aram_journeys")
    .select("current_stage, continuity_month_count")
    .eq("contributor_id", contributor.id)
    .maybeSingle();
  if (!journey) return null;

  const { data: participation } = await supabase
    .from("participations")
    .select("status")
    .eq("contributor_id", contributor.id)
    .eq("month", currentMonthKey())
    .maybeSingle();

  const { count: lifetimeParticipationCount } = await supabase
    .from("participations")
    .select("id", { count: "exact", head: true })
    .eq("contributor_id", contributor.id)
    .eq("status", "completed");

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: contributor.display_name,
    contributorId: contributor.id,
    currentStage: journey.current_stage as StageName,
    continuityMonthCount: journey.continuity_month_count as number,
    hasParticipatedThisMonth: participation?.status === "completed",
    lifetimeParticipationCount: lifetimeParticipationCount ?? 0,
  };
}
