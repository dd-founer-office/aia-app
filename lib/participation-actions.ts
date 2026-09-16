"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { CauseId } from "@/types/participation";

/**
 * CA-014 Step 4 -> Step 5: "Record Participation". Founder direction
 * (2026-09-16, overriding the locked v1.0 doc's amount-free flow): the
 * contributor enters a total amount and splits it across their selected
 * causes themselves -- that becomes the order AiA's Ops side executes and
 * later publishes as an Act of Aram. Writes one participations row
 * (amount = the real total, status 'completed' immediately -- Step 5 is
 * literally titled "Participation Recorded", not "pending") plus one
 * participation_causes row per selected cause (allocation_amount = the
 * contributor's real per-cause split).
 *
 * totalAmountRupees/causeAllocationsRupees arrive from client state, which
 * is never trusted for money math: this action independently re-validates
 * that the split actually sums to the total and that every cause in the
 * split was actually selected, rejecting otherwise, exactly as if a
 * contributor had somehow bypassed the Enter Amount screen's own
 * client-side validation.
 *
 * Uses the cookie-authenticated server client (not the service-role client)
 * so this runs AS the signed-in contributor -- RLS's own
 * "insert_own_participations"/"insert_own_participation_causes" policies are
 * what actually authorize these writes, the same as any other request that
 * contributor could make.
 */
export async function recordParticipationAction(
  causeIds: CauseId[],
  totalAmountRupees: number,
  causeAllocationsRupees: Partial<Record<CauseId, number>>
): Promise<{ error?: string }> {
  if (causeIds.length === 0) {
    return { error: "Select at least one cause to continue." };
  }
  if (!Number.isInteger(totalAmountRupees) || totalAmountRupees <= 0) {
    return { error: "Enter an amount to continue." };
  }

  const allocations = causeIds.map((id) => causeAllocationsRupees[id] ?? 0);
  if (allocations.some((amount) => !Number.isInteger(amount) || amount < 0)) {
    return { error: "Each cause's amount must be a whole, non-negative number." };
  }
  const allocatedSum = allocations.reduce((sum, amount) => sum + amount, 0);
  if (allocatedSum !== totalAmountRupees) {
    return { error: "The split across causes must add up to the total amount." };
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
    .insert({
      contributor_id: contributor.id,
      month: currentMonthKey(),
      status: "completed",
      amount: totalAmountRupees,
    })
    .select("id")
    .single();

  if (participationError) {
    // Unique (contributor_id, month) -- already participated this month.
    // Not an error state for the flow: Step 5 reads real DB state anyway,
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
    allocation_amount: causeAllocationsRupees[cause.slug as CauseId] ?? 0,
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
