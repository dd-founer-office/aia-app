import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { buildCauseDistribution, type CauseDistributionEntry } from "@/lib/journey";
import type { StageName } from "@/types";

export interface ProfileDetail {
  displayName: string;
  /** users.country -- nullable (see users_country_column migration).
   *  Editable via Account Settings' Personal details row
   *  (updatePersonalDetailsAction); Profile renders this line only when set. */
  country: string | null;
  memberSinceIso: string;
  currentStage: StageName;
  continuityMonthCount: number;
  longestContinuityMonthCount: number;
  lifetimeParticipationCount: number;
  firstParticipationDateIso: string | null;
  hasParticipated: boolean;
  causeDistribution: CauseDistributionEntry[];
  /** Account Settings > Communication preferences -- backs
   *  updateNotificationPreferencesAction(). */
  notifyParticipationReminders: boolean;
  notifyActPublished: boolean;
  notifyContinuityReminders: boolean;
}

/**
 * CA-013 Profile's data set for the signed-in contributor. Server-side
 * only (cookie-aware client) -- returns null for a signed-out visitor, same
 * as getCurrentContributor()/getJourneyDetail().
 *
 * Deliberately its own self-contained fetch (like getCurrentContributor()
 * and getJourneyDetail() already are) rather than composing on top of
 * getJourneyDetail() -- that function's milestones/reflection/next-stage
 * computations are Journey-only and Profile doesn't need them; the one
 * piece of real overlap (cause distribution) is shared via
 * buildCauseDistribution() instead of duplicated.
 */
export async function getProfileDetail(): Promise<ProfileDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("country")
    .eq("id", user.id)
    .maybeSingle();

  const { data: contributor } = await supabase
    .from("contributors")
    .select("id, display_name, created_at, notify_participation_reminders, notify_act_published, notify_continuity_reminders")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contributor) return null;

  const { data: journey } = await supabase
    .from("aram_journeys")
    .select("current_stage, continuity_month_count, longest_continuity_month_count")
    .eq("contributor_id", contributor.id)
    .maybeSingle();
  if (!journey) return null;

  const { data: participations } = await supabase
    .from("participations")
    .select("created_at, participation_causes(causes(slug))")
    .eq("contributor_id", contributor.id)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const completed = participations ?? [];
  const lifetimeParticipationCount = completed.length;

  return {
    displayName: contributor.display_name,
    country: userRow?.country ?? null,
    memberSinceIso: contributor.created_at,
    currentStage: journey.current_stage as StageName,
    continuityMonthCount: journey.continuity_month_count,
    longestContinuityMonthCount: journey.longest_continuity_month_count,
    lifetimeParticipationCount,
    firstParticipationDateIso: completed[0]?.created_at ?? null,
    hasParticipated: lifetimeParticipationCount > 0,
    causeDistribution: buildCauseDistribution(completed),
    notifyParticipationReminders: contributor.notify_participation_reminders,
    notifyActPublished: contributor.notify_act_published,
    notifyContinuityReminders: contributor.notify_continuity_reminders,
  };
}
