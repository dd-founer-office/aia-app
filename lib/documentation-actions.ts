"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { canApproveDocumentation, getDocumentationCenterData, type EvidenceReviewChecklist } from "@/lib/documentation";

function revalidateDocumentation(executionId?: string) {
  revalidatePath("/ops/documentation");
  if (executionId) revalidatePath(`/ops/executions/${executionId}`);
  revalidatePath("/ops/executions");
}

/** OP-006 Row 3's implicit "pick this one up" step -- submitted ->
 *  under_review, so other reviewers can see someone's already on it
 *  (locked flow: Ready for review -> Under review -> Approved). */
export async function startReviewAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("documentation_status").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };
  if (execution.documentation_status !== "submitted") {
    return { error: "This documentation isn't waiting to be picked up." };
  }

  const { error } = await supabase
    .from("executions")
    .update({ documentation_status: "under_review", review_started_at: new Date().toISOString(), reviewed_by: auth.operator.operatorId })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateDocumentation(executionId);
  return {};
}

/** OP-006 Row 4's Evidence Review Checklist + Row 5's Review Notes,
 *  combined into one save (same reasoning as every other combined
 *  checklist save in this app: an operator working through 5 checkboxes
 *  shouldn't lose a note to an unrelated update). Auto-picks up the
 *  review (submitted -> under_review) the first time a reviewer touches
 *  the checklist, in case they skipped the explicit "start review" step. */
export async function updateEvidenceChecklistAction(executionId: string, formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: current } = await supabase
    .from("executions")
    .select("documentation_status, review_started_at")
    .eq("id", executionId)
    .maybeSingle();
  if (!current) return { error: "Execution not found." };

  const update: Record<string, unknown> = {
    evidence_clear: formData.get("evidence_clear") === "on",
    evidence_relevant: formData.get("evidence_relevant") === "on",
    evidence_complete: formData.get("evidence_complete") === "on",
    outcome_verified: formData.get("outcome_verified") === "on",
    beneficiary_count_reasonable: formData.get("beneficiary_count_reasonable") === "on",
    review_notes: (formData.get("review_notes") as string | null)?.trim() || null,
  };
  if (current.documentation_status === "submitted") {
    update.documentation_status = "under_review";
    update.reviewed_by = auth.operator.operatorId;
    if (!current.review_started_at) update.review_started_at = new Date().toISOString();
  }

  const { error } = await supabase.from("executions").update(update).eq("id", executionId);
  if (error) return { error: error.message };

  revalidateDocumentation(executionId);
  return {};
}

/** OP-006 Row 3's Approve action. Re-fetches and independently
 *  recomputes the Evidence Review Checklist server-side rather than
 *  trusting the client's last-rendered state -- same discipline as
 *  every other approval gate in this app. */
export async function approveDocumentationAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("*").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };

  const checklist: EvidenceReviewChecklist = {
    evidenceClear: execution.evidence_clear as boolean,
    evidenceRelevant: execution.evidence_relevant as boolean,
    evidenceComplete: execution.evidence_complete as boolean,
    outcomeVerified: execution.outcome_verified as boolean,
    beneficiaryCountReasonable: execution.beneficiary_count_reasonable as boolean,
  };
  if (!canApproveDocumentation(execution.documentation_status as "submitted" | "under_review", checklist)) {
    return { error: "The Evidence Review Checklist must be complete before approving." };
  }

  const { error } = await supabase
    .from("executions")
    .update({
      documentation_status: "approved",
      review_decision_at: new Date().toISOString(),
      reviewed_by: execution.reviewed_by ?? auth.operator.operatorId,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateDocumentation(executionId);
  return {};
}

/** OP-006 Row 3's Return for changes action. Locked rule: notes required.
 *  Unlike Reject, this is explicitly a "fix and resubmit" outcome --
 *  lib/execution-detail.ts's canSubmitForReview already allows
 *  resubmission from this exact status. */
export async function returnForChangesAction(executionId: string, notes: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!notes.trim()) return { error: "Notes are required when returning documentation for changes." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("reviewed_by").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };

  const { error } = await supabase
    .from("executions")
    .update({
      documentation_status: "returned_for_changes",
      review_notes: notes.trim(),
      review_decision_at: new Date().toISOString(),
      reviewed_by: execution.reviewed_by ?? auth.operator.operatorId,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateDocumentation(executionId);
  return {};
}

/** OP-006 Row 3's Reject action. Locked rule: notes required. Terminal --
 *  unlike Return for changes, canSubmitForReview does not allow
 *  resubmission from 'rejected'. */
export async function rejectDocumentationAction(executionId: string, notes: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!notes.trim()) return { error: "Notes are required when rejecting documentation." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("reviewed_by").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };

  const { error } = await supabase
    .from("executions")
    .update({
      documentation_status: "rejected",
      review_notes: notes.trim(),
      review_decision_at: new Date().toISOString(),
      reviewed_by: execution.reviewed_by ?? auth.operator.operatorId,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateDocumentation(executionId);
  return {};
}

/** OP-006 header's "Bulk review" action. Only ever approves -- there's no
 *  sound way to bulk-reject/return without a human reading each item's
 *  own evidence, which is exactly what the per-item checklist already
 *  requires before approval. Re-verifies every item's own checklist
 *  independently server-side (same as the single-item path), so this can
 *  never approve something that hasn't actually passed review. */
export async function bulkApproveDocumentationAction(
  executionIds: string[]
): Promise<{ error?: string; approvedCount?: number; skipped?: { executionId: string; reason: string }[] }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (executionIds.length === 0) return { error: "Select at least one item to approve." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const skipped: { executionId: string; reason: string }[] = [];
  const toApprove: string[] = [];

  const { data: executions } = await supabase.from("executions").select("*").in("id", executionIds);
  for (const execution of executions ?? []) {
    const checklist: EvidenceReviewChecklist = {
      evidenceClear: execution.evidence_clear as boolean,
      evidenceRelevant: execution.evidence_relevant as boolean,
      evidenceComplete: execution.evidence_complete as boolean,
      outcomeVerified: execution.outcome_verified as boolean,
      beneficiaryCountReasonable: execution.beneficiary_count_reasonable as boolean,
    };
    if (canApproveDocumentation(execution.documentation_status as "submitted" | "under_review", checklist)) {
      toApprove.push(execution.id as string);
    } else {
      skipped.push({ executionId: execution.id as string, reason: "Evidence Review Checklist isn't complete yet." });
    }
  }

  if (toApprove.length > 0) {
    const { error } = await supabase
      .from("executions")
      .update({ documentation_status: "approved", review_decision_at: new Date().toISOString() })
      .in("id", toApprove);
    if (error) return { error: error.message };
  }

  revalidateDocumentation();
  return { approvedCount: toApprove.length, skipped };
}

/** OP-006 header's "Export" action, same pattern as OP-004/005's. */
export async function exportDocumentationAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getDocumentationCenterData();
  const header = ["Execution ID", "Opportunity", "Cause", "District", "Submitted by", "Submission date", "Review status", "Priority"];
  const rows = data.items.map((i) => [
    i.executionId,
    i.opportunityTitle,
    i.cause,
    i.district ?? "",
    i.submittedByName ?? "",
    i.submittedAtIso ?? "",
    i.reviewStatus,
    i.priority,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

  return { csv };
}
