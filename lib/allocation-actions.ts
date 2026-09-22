"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { currentMonthKey } from "@/lib/contributor";
import { getAllocationEngineData } from "@/lib/allocation";
import { ensureExecutionForOpportunity } from "@/lib/execution";

function revalidateAllocations() {
  revalidatePath("/ops/allocations");
  revalidatePath("/ops/opportunities");
  revalidatePath("/ops/executions");
  revalidatePath("/ops");
}

/**
 * OP-004 header's "Run allocation" action. Recomputes the recommendation
 * engine fresh, server-side, rather than trusting whatever the client last
 * rendered -- same discipline as OP-003's approve/allocate actions.
 * Commits one allocations row per Ready opportunity with a positive
 * recommendation (is_manual_override: false, since these came straight
 * from the engine), then moves each of those opportunities to
 * 'allocated'. Every run's rows are themselves the "immutable log entry"
 * the locked spec calls for -- allocations are never updated after
 * insert, only ever read.
 */
export async function runAllocationAction(): Promise<{ error?: string; allocatedCount?: number }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const data = await getAllocationEngineData();
  const toAllocate = data.recommendations.filter(
    (r): r is typeof r & { recommendedAllocation: number } =>
      r.recommendedAllocation !== null && r.recommendedAllocation > 0
  );
  if (toAllocate.length === 0) {
    return { error: "No Ready opportunities have a positive recommended allocation right now." };
  }

  const allocationMonth = `${currentMonthKey()}-01`;
  const { data: insertedAllocations, error: insertError } = await supabase
    .from("allocations")
    .insert(
      toAllocate.map((r) => ({
        opportunity_id: r.opportunityId,
        cause: r.cause,
        participations_allocated: r.recommendedAllocation,
        recommended_allocation: r.recommendedAllocation,
        confidence: r.confidence,
        is_manual_override: false,
        allocation_month: allocationMonth,
        created_by: auth.operator.operatorId,
      }))
    )
    .select("id, opportunity_id");
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({ status: "allocated", allocated_at: new Date().toISOString() })
    .in(
      "id",
      toAllocate.map((r) => r.opportunityId)
    );
  if (updateError) return { error: updateError.message };

  for (const r of toAllocate) {
    const { error: executionError } = await ensureExecutionForOpportunity(supabase, r.opportunityId);
    if (executionError) return { error: executionError };
  }

  // Real attribution: link the specific (participation, cause) rows this
  // run actually consumed to their new allocation, not just a count. Pools
  // are decremented per cause as opportunities are processed in the same
  // priority order the recommendations themselves were computed in, so two
  // opportunities sharing a cause never claim the same participation twice.
  const allocationIdByOpportunityId = new Map((insertedAllocations ?? []).map((a) => [a.opportunity_id as string, a.id as string]));
  const causePools = new Map(data.monthlyParticipation.byCause.map((c) => [c.cause, c.unallocated.slice()]));
  const linkRows: { participation_id: string; cause_id: string; allocation_id: string }[] = [];
  for (const r of toAllocate) {
    const allocationId = allocationIdByOpportunityId.get(r.opportunityId);
    if (!allocationId) continue;
    const pool = causePools.get(r.cause) ?? [];
    const picked = pool.splice(0, r.recommendedAllocation);
    for (const p of picked) {
      linkRows.push({ participation_id: p.participationId, cause_id: p.causeId, allocation_id: allocationId });
    }
  }
  if (linkRows.length > 0) {
    const { error: linkError } = await supabase.from("participation_allocations").insert(linkRows);
    if (linkError) return { error: linkError.message };
  }

  revalidateAllocations();
  return { allocatedCount: toAllocate.length };
}

/**
 * OP-004 Row 4 Manual Allocation Panel's submit. Any deviation from the
 * engine's own recommendation requires a reason (locked rule) -- including
 * when the engine had no recommendation to deviate from (no beneficiary
 * estimate set). Also independently re-checks the opportunity is actually
 * Ready and that the requested amount doesn't exceed what's genuinely
 * available for that cause -- "no allocation may create future backlog"
 * means an operator can't allocate participation that doesn't exist yet,
 * override or not. "Available" here is this month's own unallocated
 * participation PLUS any backfilled history from past months still
 * waiting to be linked (see lib/allocation.ts's ParticipationByCause).
 */
export async function createManualAllocationAction(
  opportunityId: string,
  participationsAllocated: number,
  reason: string
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  if (!Number.isInteger(participationsAllocated) || participationsAllocated <= 0) {
    return { error: "Allocation must be a whole number greater than zero." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const data = await getAllocationEngineData();
  const opportunity = data.allocationReadyOpportunities.find((o) => o.id === opportunityId);
  if (!opportunity) return { error: "Opportunity isn't in the allocation-ready pool." };
  if (opportunity.readiness !== "ready") {
    return { error: "This opportunity isn't Ready yet -- resolve its checklist or risk level first." };
  }

  const available = data.monthlyParticipation.byCause.find((c) => c.cause === opportunity.cause)?.available ?? 0;
  if (participationsAllocated > available) {
    return { error: `Only ${available} participation(s) are available for ${opportunity.cause} right now (this month plus any backfilled history).` };
  }

  const recommendation = data.recommendations.find((r) => r.opportunityId === opportunityId);
  const recommendedAllocation = recommendation?.recommendedAllocation ?? null;
  const isOverride = recommendedAllocation !== participationsAllocated;
  if (isOverride && !reason.trim()) {
    return { error: "A reason is required when the allocation differs from the recommendation." };
  }

  const allocationMonth = `${currentMonthKey()}-01`;
  const { data: insertedAllocation, error: insertError } = await supabase
    .from("allocations")
    .insert({
      opportunity_id: opportunityId,
      cause: opportunity.cause,
      participations_allocated: participationsAllocated,
      recommended_allocation: recommendedAllocation,
      confidence: recommendation?.confidence ?? null,
      is_manual_override: isOverride,
      override_reason: isOverride ? reason.trim() : null,
      allocation_month: allocationMonth,
      created_by: auth.operator.operatorId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  const { error: updateError } = await supabase
    .from("opportunities")
    .update({ status: "allocated", allocated_at: new Date().toISOString() })
    .eq("id", opportunityId);
  if (updateError) return { error: updateError.message };

  const { error: executionError } = await ensureExecutionForOpportunity(supabase, opportunityId);
  if (executionError) return { error: executionError };

  // Real attribution -- same discipline as runAllocationAction: link the
  // specific (participation, cause) rows this allocation actually consumed.
  const causeData = data.monthlyParticipation.byCause.find((c) => c.cause === opportunity.cause);
  const picked = (causeData?.unallocated ?? []).slice(0, participationsAllocated);
  if (picked.length > 0) {
    const { error: linkError } = await supabase.from("participation_allocations").insert(
      picked.map((p) => ({ participation_id: p.participationId, cause_id: p.causeId, allocation_id: insertedAllocation.id as string }))
    );
    if (linkError) return { error: linkError.message };
  }

  revalidateAllocations();
  return {};
}

/** OP-004 header's "Export" action. No file-storage/export pipeline
 *  exists elsewhere in the app, so this returns a CSV string of the
 *  current allocation-ready pool for the client to save as a file --
 *  real current data, not a stubbed download. */
export async function exportAllocationsAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getAllocationEngineData();
  const header = ["Opportunity", "Cause", "District", "Partner", "Priority", "Readiness", "Recommended allocation", "Confidence"];
  const rows = data.allocationReadyOpportunities.map((o) => {
    const recommendation = data.recommendations.find((r) => r.opportunityId === o.id);
    return [
      o.title,
      o.cause,
      o.district ?? "",
      o.partnerName ?? "",
      o.priority,
      o.readiness,
      recommendation?.recommendedAllocation?.toString() ?? "",
      recommendation?.confidence ?? "",
    ];
  });
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return { csv };
}
