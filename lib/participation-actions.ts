"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { CauseId } from "@/types/participation";

/**
 * CA-014 Step 3 -> Step 4: "Record Participation". Per the locked spec's own
 * Core Product Rule ("Participation comes before allocation" -- contributors
 * never pick amounts, beneficiaries, or opportunities, only causes), this
 * writes exactly two things: a participations row (status 'completed'
 * immediately -- Step 4 is literally titled "Participation Recorded", not
 * "pending") and one participation_causes row per selected cause. amount and
 * allocation_amount stay 0: the locked schema has those columns, but no
 * locked screen ever collects a value for them -- that's Ops-side work
 * (OP-004 Allocation Engine), out of this flow entirely.
 *
 * Uses the cookie-authenticated server client (not the service-role client)
 * so this runs AS the signed-in contributor -- RLS's own
 * "insert_own_participations"/"insert_own_participation_causes" policies are
 * what actually authorize these writes, the same as any other request that
 * contributor could make.
 */
export async function recordParticipationAction(
  causeIds: CauseId[]
): Promise<{ error?: string }> {
  if (causeIds.length === 0) {
    return { error: "Select at least one cause to continue." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { error: "Supabase is not configured on this deployment." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You need to sign in again." };
  }

  const { data: contributor } = await supabase
    .from("contributors")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contributor) {
    return { error: "Couldn't find your contributor record." };
  }

  const { data: participation, error: participationError } = await supabase
    .from("participations")
    .insert({ contributor_id: contributor.id, month: currentMonthKey(), status: "completed", amount: 0 })
    .select("id")
    .single();

  if (participationError) {
    // Unique (contributor_id, month) -- already participated this month.
    // Not an error state for the flow: Step 4 reads real DB state anyway,
    // so it renders correctly regardless of how the contributor got there.
    if (participationError.code === "23505") return {};
    return { error: participationError.message };
  }

  const { data: causeRows, error: causesError } = await supabase
    .from("causes")
    .select("id, slug")
    .in("slug", causeIds);
  if (causesError) {
    return { error: causesError.message };
  }

  const participationCauseRows = (causeRows ?? []).map((cause) => ({
    participation_id: participation.id,
    cause_id: cause.id,
    allocation_amount: 0,
  }));

  if (participationCauseRows.length > 0) {
    const { error: participationCausesError } = await supabase
      .from("participation_causes")
      .insert(participationCauseRows);
    if (participationCausesError) {
      return { error: participationCausesError.message };
    }
  }

  return {};
}
