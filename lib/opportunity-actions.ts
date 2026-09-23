"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { canApproveOpportunity, type ImpactAssuranceChecklist, type RiskLevel } from "@/lib/opportunity-detail";
import { currentMonthKey } from "@/lib/contributor";
import { ensureExecutionForOpportunity } from "@/lib/execution";
import { getAllocationEngineData } from "@/lib/allocation";
import type { OpportunityStatus } from "@/lib/ops-dashboard";

const VALID_RISK_LEVELS: RiskLevel[] = ["low", "medium", "high", "critical"];

function revalidateOpportunity(id: string) {
  revalidatePath(`/ops/opportunities/${id}`);
  revalidatePath("/ops/opportunities");
  revalidatePath("/ops");
}

const VALID_CAUSES = ["Education", "Medical", "Annadhanam", "Environment"];
const VALID_PRIORITIES = ["critical", "high", "normal", "low"];
const VALID_SOURCES = [
  "contributor_suggestion",
  "partner_submission",
  "field_verification",
  "community_referral",
  "operator_created",
];

/**
 * OP-002 Header's "New Opportunity" action. Never trusts client-side
 * operator gating alone (the /ops route check is UX, not the real
 * authorization boundary) -- re-verifies operator status here, the same
 * discipline recordParticipationAction already applies to money math on
 * the contributor side.
 */
export async function createOpportunityAction(formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") {
    return { error: "You need to sign in as an operator." };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const cause = formData.get("cause") as string | null;
  const district = (formData.get("district") as string | null)?.trim() || null;
  const needSummary = (formData.get("need_summary") as string | null)?.trim() || null;
  const beneficiaryEstimateRaw = formData.get("beneficiary_estimate") as string | null;
  const partnerId = (formData.get("partner_id") as string | null) || null;
  const priority = (formData.get("priority") as string | null) ?? "normal";
  const source = (formData.get("source") as string | null) ?? "operator_created";
  const targetExecutionDate = (formData.get("target_execution_date") as string | null) || null;

  if (!title) return { error: "Title is required." };
  if (!cause || !VALID_CAUSES.includes(cause)) return { error: "Choose a valid cause." };
  if (!VALID_PRIORITIES.includes(priority)) return { error: "Choose a valid priority." };
  if (!VALID_SOURCES.includes(source)) return { error: "Choose a valid source." };

  let beneficiaryEstimate: number | null = null;
  if (beneficiaryEstimateRaw) {
    const parsed = Number(beneficiaryEstimateRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: "Beneficiary estimate must be a whole, non-negative number." };
    }
    beneficiaryEstimate = parsed;
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("opportunities").insert({
    title,
    cause,
    district,
    need_summary: needSummary,
    beneficiary_estimate: beneficiaryEstimate,
    partner_id: partnerId,
    priority,
    source,
    target_execution_date: targetExecutionDate,
    created_by: auth.operator.operatorId,
  });

  if (error) return { error: error.message };

  revalidatePath("/ops/opportunities");
  revalidatePath("/ops");
  return {};
}

/**
 * OP-003 Section 2/5/6 combined save: Impact Assurance checklist, Risk
 * Assessment, and Execution Readiness's owner field, all in one form so
 * an operator working through the checklist doesn't lose Section 6's
 * risk notes on an unrelated checkbox toggle.
 *
 * Two side effects, both real-data-driven, not manual status edits:
 * - opportunity_verified flipping true for the first time stamps
 *   verified_at (feeds the Activity Timeline's "Verification completed"
 *   entry and OP-001's SLA indicator -- the same column that trigger
 *   already reads).
 * - status auto-advances submitted -> assuring the first time any
 *   checklist item is set, matching OP-002's own "assuring" bucket
 *   definition (opportunities actively being verified).
 */
export async function updateImpactAssuranceAction(
  opportunityId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: current } = await supabase
    .from("opportunities")
    .select("status, verified_at")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!current) return { error: "Opportunity not found." };

  const riskLevel = (formData.get("risk_level") as string | null) ?? "low";
  if (!VALID_RISK_LEVELS.includes(riskLevel as RiskLevel)) {
    return { error: "Choose a valid risk level." };
  }

  const checklist = {
    opportunity_verified: formData.get("opportunity_verified") === "on",
    partner_verified: formData.get("partner_verified") === "on",
    documentation_complete: formData.get("documentation_complete") === "on",
    site_validation_complete: formData.get("site_validation_complete") === "on",
    execution_feasibility_confirmed: formData.get("execution_feasibility_confirmed") === "on",
    risk_assessment_complete: formData.get("risk_assessment_complete") === "on",
  };
  const anyChecklistItem = Object.values(checklist).some(Boolean);

  const update: Record<string, unknown> = {
    ...checklist,
    risk_level: riskLevel,
    risk_notes: (formData.get("risk_notes") as string | null)?.trim() || null,
    mitigation_plan: (formData.get("mitigation_plan") as string | null)?.trim() || null,
    risk_owner: (formData.get("risk_owner") as string | null)?.trim() || null,
    execution_owner: (formData.get("execution_owner") as string | null)?.trim() || null,
    documentation_notes: (formData.get("documentation_notes") as string | null)?.trim() || null,
  };

  if (checklist.opportunity_verified && !current.verified_at) {
    update.verified_at = new Date().toISOString();
  }
  if (current.status === "submitted" && anyChecklistItem) {
    update.status = "assuring";
  }

  const { error } = await supabase.from("opportunities").update(update).eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidateOpportunity(opportunityId);
  return {};
}

/** OP-003 header's Approve action. Re-verifies the same gate
 *  getOpportunityDetail() computed for the button's enabled state --
 *  never trusts that the client actually saw a disabled button. */
export async function approveOpportunityAction(opportunityId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: opp } = await supabase.from("opportunities").select("*").eq("id", opportunityId).maybeSingle();
  if (!opp) return { error: "Opportunity not found." };

  const checklist: ImpactAssuranceChecklist = {
    opportunityVerified: opp.opportunity_verified as boolean,
    partnerVerified: opp.partner_verified as boolean,
    documentationComplete: opp.documentation_complete as boolean,
    siteValidationComplete: opp.site_validation_complete as boolean,
    executionFeasibilityConfirmed: opp.execution_feasibility_confirmed as boolean,
    riskAssessmentComplete: opp.risk_assessment_complete as boolean,
  };
  if (!canApproveOpportunity(opp.status as OpportunityStatus, checklist, opp.risk_level as RiskLevel)) {
    return {
      error:
        "This opportunity isn't ready to approve yet -- complete the Impact Assurance checklist and resolve any critical risk first.",
    };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidateOpportunity(opportunityId);
  return {};
}

/** OP-003 header's Reject action. Requires a reason -- matches the same
 *  "explicit reason" discipline the locked OP-002/OP-004 specs apply to
 *  overdue closures and allocation overrides. */
export async function rejectOpportunityAction(opportunityId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A rejection reason is required." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("opportunities")
    .update({ status: "rejected", rejected_at: new Date().toISOString(), rejection_reason: reason.trim() })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidateOpportunity(opportunityId);
  return {};
}

/** OP-003 header's Request Information action. Saves what's being asked
 *  for; there's no partner/contributor-facing inbox to route it to yet,
 *  so this is an operator-visible note, not a real notification. */
export async function requestInformationAction(opportunityId: string, notes: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!notes.trim()) return { error: "Describe what information is needed." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("opportunities")
    .update({ information_request_notes: notes.trim() })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  revalidateOpportunity(opportunityId);
  return {};
}

/** OP-003 header's Allocate action -- only ever shown for an approved
 *  opportunity (locked rule), re-verified here independently of the UI.
 *  This is the quick single-click path for an operator already on the
 *  Detail page; OP-004's Allocation Engine (lib/allocation-actions.ts) is
 *  the real recommendation-driven path. Both write the same allocations
 *  table so OP-004's monthly compliance/participation-pool math stays
 *  correct regardless of which path was used. This path has no pool or
 *  capacity context to check against, so it records the full beneficiary
 *  estimate as a manual override; when there's no beneficiary estimate to
 *  size it from, the status still moves to allocated but no allocations
 *  row is written (the check constraint requires a positive amount, and
 *  there's nothing real to record).
 *
 *  Bug fix (2026-09-22): this path used to write the allocations row and
 *  stop there, never linking it to any real participation_allocations
 *  rows -- unlike OP-004's own actions. That silently broke contributor
 *  attribution for every opportunity allocated this way: the resulting
 *  Act could never show up in anyone's personal Acts feed, no matter how
 *  real the underlying participation was (caught while trying to publish
 *  a real contributor's Medical Act that had been allocated through this
 *  exact path). Now draws from the same oldest-first unallocated pool
 *  getAllocationEngineData() computes for OP-004, same discipline as
 *  runAllocationAction/createManualAllocationAction. */
export async function allocateOpportunityAction(opportunityId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: opp } = await supabase
    .from("opportunities")
    .select("status, cause, beneficiary_estimate")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!opp) return { error: "Opportunity not found." };
  if (opp.status !== "approved") {
    return { error: "Only approved opportunities can be allocated." };
  }

  const beneficiaryEstimate = opp.beneficiary_estimate as number | null;
  if (beneficiaryEstimate && beneficiaryEstimate > 0) {
    const { data: insertedAllocation, error: allocationError } = await supabase
      .from("allocations")
      .insert({
        opportunity_id: opportunityId,
        cause: opp.cause,
        participations_allocated: beneficiaryEstimate,
        recommended_allocation: null,
        confidence: null,
        is_manual_override: true,
        override_reason: "Allocated directly from Opportunity Detail (OP-003), outside the Allocation Engine.",
        allocation_month: `${currentMonthKey()}-01`,
        created_by: auth.operator.operatorId,
      })
      .select("id")
      .single();
    if (allocationError) return { error: allocationError.message };

    const data = await getAllocationEngineData();
    const causeData = data.monthlyParticipation.byCause.find((c) => c.cause === opp.cause);
    const picked = (causeData?.unallocated ?? []).slice(0, beneficiaryEstimate);
    if (picked.length > 0) {
      const { error: linkError } = await supabase.from("participation_allocations").insert(
        picked.map((p) => ({ participation_id: p.participationId, cause_id: p.causeId, allocation_id: insertedAllocation.id as string }))
      );
      if (linkError) return { error: linkError.message };
    }
  }

  const { error } = await supabase
    .from("opportunities")
    .update({ status: "allocated", allocated_at: new Date().toISOString() })
    .eq("id", opportunityId);
  if (error) return { error: error.message };

  const { error: executionError } = await ensureExecutionForOpportunity(supabase, opportunityId);
  if (executionError) return { error: executionError };

  revalidateOpportunity(opportunityId);
  revalidatePath("/ops/allocations");
  revalidatePath("/ops/executions");
  return {};
}
