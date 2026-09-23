"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { buildChecklist, canSubmitForReview, type EvidenceCategory } from "@/lib/execution-detail";

function revalidateExecutionDetail(executionId: string) {
  revalidatePath(`/ops/executions/${executionId}`);
  revalidatePath("/ops/executions");
}

const VALID_CATEGORIES: EvidenceCategory[] = ["before_photo", "after_photo", "execution_photo", "video", "supporting_document"];

/** OP-005A header's "Save draft" action -- Section 2 Outcome Recording.
 *  Deliberately permissive: "draft saves supported" is a locked rule, so
 *  this never blocks on incompleteness the way submitForReviewAction does
 *  -- it only type-validates what's actually provided. */
export async function saveOutcomeAction(executionId: string, formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const actualBeneficiariesRaw = formData.get("actual_beneficiaries") as string | null;
  let actualBeneficiaries: number | null = null;
  if (actualBeneficiariesRaw) {
    const parsed = Number(actualBeneficiariesRaw);
    if (!Number.isInteger(parsed) || parsed < 0) {
      return { error: "Actual beneficiaries must be a whole, non-negative number." };
    }
    actualBeneficiaries = parsed;
  }

  const { error } = await supabase
    .from("executions")
    .update({
      actual_beneficiaries: actualBeneficiaries,
      outcome_summary: (formData.get("outcome_summary") as string | null)?.trim() || null,
      completion_notes: (formData.get("completion_notes") as string | null)?.trim() || null,
      unexpected_issues: (formData.get("unexpected_issues") as string | null)?.trim() || null,
      lessons_learned: (formData.get("lessons_learned") as string | null)?.trim() || null,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutionDetail(executionId);
  return {};
}

/**
 * OP-005A Section 3's Upload action -- metadata-only. The client already
 * uploaded the file's bytes directly to the private 'execution-evidence'
 * storage bucket using the operator's own authenticated browser session
 * (same direct-to-storage pattern Mission Camera uses for the
 * 'mission-evidence' bucket -- see components/capture/MissionCamera.tsx),
 * so storage RLS (operator-only) already authorized the write; this just
 * records the row. Stamps evidence_uploaded_at the first time any
 * evidence lands, for the Activity Timeline.
 */
export async function uploadEvidenceAction(
  executionId: string,
  category: string,
  fileName: string,
  fileType: string,
  storagePath: string
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!VALID_CATEGORIES.includes(category as EvidenceCategory)) return { error: "Choose a valid evidence category." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error: insertError } = await supabase.from("execution_evidence").insert({
    execution_id: executionId,
    file_name: fileName,
    file_type: fileType,
    category,
    storage_path: storagePath,
    status: "uploaded",
    uploaded_by: auth.operator.operatorId,
  });
  if (insertError) return { error: insertError.message };

  const { data: current } = await supabase.from("executions").select("evidence_uploaded_at").eq("id", executionId).maybeSingle();
  if (current && !current.evidence_uploaded_at) {
    await supabase.from("executions").update({ evidence_uploaded_at: new Date().toISOString() }).eq("id", executionId);
  }

  revalidateExecutionDetail(executionId);
  return {};
}

/** OP-005A Section 3's Replace action. Never overwrites -- marks the old
 *  file 'replaced' and inserts a new 'uploaded' row, so the evidence
 *  table stays an immutable audit trail (same ethos as OP-004's
 *  allocations log: rows are never mutated to hide what happened). */
export async function replaceEvidenceAction(
  oldEvidenceId: string,
  category: string,
  fileName: string,
  fileType: string,
  storagePath: string
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!VALID_CATEGORIES.includes(category as EvidenceCategory)) return { error: "Choose a valid evidence category." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: oldRow } = await supabase.from("execution_evidence").select("execution_id").eq("id", oldEvidenceId).maybeSingle();
  if (!oldRow) return { error: "Original file not found." };

  const { error: updateError } = await supabase.from("execution_evidence").update({ status: "replaced" }).eq("id", oldEvidenceId);
  if (updateError) return { error: updateError.message };

  const { error: insertError } = await supabase.from("execution_evidence").insert({
    execution_id: oldRow.execution_id,
    file_name: fileName,
    file_type: fileType,
    category,
    storage_path: storagePath,
    status: "uploaded",
    uploaded_by: auth.operator.operatorId,
  });
  if (insertError) return { error: insertError.message };

  revalidateExecutionDetail(oldRow.execution_id as string);
  return {};
}

/** OP-005A Section 3's Delete action. Removes the underlying storage
 *  object (a "Delete" that leaves the file sitting in the bucket would be
 *  misleading) and marks the row 'deleted' rather than removing it, so
 *  the row itself still exists as an audit record of what was deleted. */
export async function deleteEvidenceAction(evidenceId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: row } = await supabase.from("execution_evidence").select("execution_id, storage_path").eq("id", evidenceId).maybeSingle();
  if (!row) return { error: "File not found." };

  await supabase.storage.from("execution-evidence").remove([row.storage_path as string]);

  const { error } = await supabase.from("execution_evidence").update({ status: "deleted" }).eq("id", evidenceId);
  if (error) return { error: error.message };

  revalidateExecutionDetail(row.execution_id as string);
  return {};
}

/** OP-005A Section 6's "Submit for Documentation Review" -- the same
 *  action as the header's "Submit for review". Independently recomputes
 *  the Evidence Quality Checklist from a fresh query rather than trusting
 *  the client's last-rendered checklist state, exactly like OP-003's
 *  approveOpportunityAction re-verifies its own gate. Creates the
 *  immutable timestamp + submitter the locked rule calls for. */
export async function submitForReviewAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase
    .from("executions")
    .select("outcome_summary, actual_beneficiaries, completion_notes, documentation_status")
    .eq("id", executionId)
    .maybeSingle();
  if (!execution) return { error: "Execution not found." };

  const { data: evidenceRows } = await supabase
    .from("execution_evidence")
    .select("category")
    .eq("execution_id", executionId)
    .neq("status", "deleted");

  const checklist = buildChecklist(
    execution.outcome_summary as string | null,
    execution.actual_beneficiaries as number | null,
    execution.completion_notes as string | null,
    (evidenceRows ?? []).map((e) => e.category as EvidenceCategory)
  );

  if (!canSubmitForReview(execution.documentation_status as "draft" | "submitted" | "approved" | "rejected", checklist)) {
    return { error: "The Evidence Quality Checklist must be complete before submitting for review." };
  }

  const { error } = await supabase
    .from("executions")
    .update({
      documentation_status: "submitted",
      submitted_for_review_at: new Date().toISOString(),
      submitted_by: auth.operator.operatorId,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidateExecutionDetail(executionId);
  return {};
}
