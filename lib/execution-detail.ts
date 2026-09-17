import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ExecutionStatus } from "@/lib/execution";
import type { OpportunityPriority } from "@/lib/opportunities";

export type DocumentationStoredStatus = "draft" | "submitted" | "under_review" | "approved" | "returned_for_changes" | "rejected";
export type DocumentationReadiness =
  | "draft"
  | "incomplete"
  | "ready_for_review"
  | "submitted"
  | "under_review"
  | "approved"
  | "returned_for_changes"
  | "rejected";
export type EvidenceCategory = "before_photo" | "after_photo" | "execution_photo" | "video" | "supporting_document";
export type EvidenceFileStatus = "uploaded" | "replaced" | "deleted";

export interface EvidenceQualityChecklist {
  photosUploaded: boolean;
  outcomeRecorded: boolean;
  beneficiaryCountRecorded: boolean;
  completionNotesAdded: boolean;
  requiredDocumentsAttached: boolean;
}

export interface EvidenceFile {
  id: string;
  fileName: string;
  fileType: string;
  category: EvidenceCategory;
  status: EvidenceFileStatus;
  uploadedAtIso: string;
  uploadedByName: string | null;
  url: string | null;
}

export interface ExecutionTimelineEntry {
  label: string;
  dateIso: string;
}

export interface ExecutionDetail {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  cause: string;
  district: string | null;
  partnerName: string | null;
  executionOwner: string | null;
  priority: OpportunityPriority;
  scheduledDate: string | null;
  completedAtIso: string | null;
  status: ExecutionStatus;
  beneficiaryEstimate: number | null;
  actualBeneficiaries: number | null;
  outcomeSummary: string | null;
  completionNotes: string | null;
  unexpectedIssues: string | null;
  lessonsLearned: string | null;
  evidence: EvidenceFile[];
  checklist: EvidenceQualityChecklist;
  missingItems: string[];
  completionPercentage: number;
  documentationStoredStatus: DocumentationStoredStatus;
  documentationReadiness: DocumentationReadiness;
  canSubmitForReview: boolean;
  submittedForReviewAtIso: string | null;
  reviewNotes: string | null;
  timeline: ExecutionTimelineEntry[];
}

const CHECKLIST_LABELS: Record<keyof EvidenceQualityChecklist, string> = {
  photosUploaded: "Photos uploaded (at least one After photo)",
  outcomeRecorded: "Outcome recorded",
  beneficiaryCountRecorded: "Beneficiary count recorded",
  completionNotesAdded: "Completion notes added",
  requiredDocumentsAttached: "Required documents attached",
};

/** Shared between getExecutionDetail() below and
 *  lib/execution-detail-actions.ts's submitForReviewAction, so the
 *  action can independently recompute the checklist from a cheap query
 *  instead of trusting the client's last-rendered checklist state. */
export function buildChecklist(
  outcomeSummary: string | null,
  actualBeneficiaries: number | null,
  completionNotes: string | null,
  activeCategories: EvidenceCategory[]
): EvidenceQualityChecklist {
  return {
    photosUploaded: activeCategories.includes("after_photo"),
    outcomeRecorded: !!outcomeSummary,
    beneficiaryCountRecorded: actualBeneficiaries !== null && actualBeneficiaries !== undefined,
    completionNotesAdded: !!completionNotes,
    requiredDocumentsAttached: activeCategories.includes("supporting_document"),
  };
}

/** Shared with lib/execution-detail-actions.ts's submitForReviewAction so
 *  the button's disabled state and the action's independent server-side
 *  re-verification can never drift apart -- same discipline as
 *  canApproveOpportunity in lib/opportunity-detail.ts. */
export function allChecklistComplete(c: EvidenceQualityChecklist): boolean {
  return c.photosUploaded && c.outcomeRecorded && c.beneficiaryCountRecorded && c.completionNotesAdded && c.requiredDocumentsAttached;
}

export function computeDocumentationReadiness(
  storedStatus: DocumentationStoredStatus,
  checklist: EvidenceQualityChecklist
): DocumentationReadiness {
  if (storedStatus !== "draft") return storedStatus;
  if (allChecklistComplete(checklist)) return "ready_for_review";
  const anyProgress = Object.values(checklist).some(Boolean);
  return anyProgress ? "incomplete" : "draft";
}

/** Draft and returned-for-changes are both resubmittable -- OP-006's
 *  "Returned for changes" is explicitly a "fix and resubmit" outcome, not
 *  a dead end like Rejected. */
export function canSubmitForReview(storedStatus: DocumentationStoredStatus, checklist: EvidenceQualityChecklist): boolean {
  return (storedStatus === "draft" || storedStatus === "returned_for_changes") && allChecklistComplete(checklist);
}

/** Shared by getExecutionDetail() below and lib/documentation.ts's
 *  documentation queue (OP-006), which needs the same evidence + signed
 *  URLs for many executions at once rather than one -- a single batched
 *  query plus one signed-URL call per file, instead of re-running this
 *  per-execution query N times. */
export async function getEvidenceByExecutionIds(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  executionIds: string[]
): Promise<Map<string, EvidenceFile[]>> {
  const result = new Map<string, EvidenceFile[]>();
  if (executionIds.length === 0) return result;

  const { data: evidenceRows } = await supabase
    .from("execution_evidence")
    .select("id, execution_id, file_name, file_type, category, storage_path, status, uploaded_at, uploaded_by")
    .in("execution_id", executionIds)
    .neq("status", "deleted")
    .order("uploaded_at", { ascending: true });

  const activeRows = evidenceRows ?? [];
  const uploaderIds = Array.from(new Set(activeRows.map((e) => e.uploaded_by as string | null).filter((v): v is string => !!v)));
  const uploaderNameById = new Map<string, string>();
  if (uploaderIds.length > 0) {
    const { data: uploaders } = await supabase.from("operators").select("id, display_name").in("id", uploaderIds);
    for (const u of uploaders ?? []) uploaderNameById.set(u.id as string, u.display_name as string);
  }

  await Promise.all(
    activeRows.map(async (e) => {
      const { data: signed } = await supabase.storage.from("execution-evidence").createSignedUrl(e.storage_path as string, 3600);
      const file: EvidenceFile = {
        id: e.id as string,
        fileName: e.file_name as string,
        fileType: e.file_type as string,
        category: e.category as EvidenceCategory,
        status: e.status as EvidenceFileStatus,
        uploadedAtIso: e.uploaded_at as string,
        uploadedByName: e.uploaded_by ? (uploaderNameById.get(e.uploaded_by as string) ?? null) : null,
        url: signed?.signedUrl ?? null,
      };
      const executionId = e.execution_id as string;
      const existing = result.get(executionId);
      if (existing) existing.push(file);
      else result.set(executionId, [file]);
    })
  );

  // Promise.all resolves in whatever order each signed-URL call finishes,
  // not upload order -- resort each group so display order stays stable.
  for (const files of result.values()) {
    files.sort((a, b) => new Date(a.uploadedAtIso).getTime() - new Date(b.uploadedAtIso).getTime());
  }

  return result;
}

/** OP-005A Execution Detail & Evidence Upload's full data set for one
 *  execution. Server-side only. Two documented simplifications: (1) the
 *  locked "Evidence Categories" (Before/After/Execution photo, Video,
 *  Supporting document) are the only stored taxonomy -- the separate
 *  "Upload Types" list (Photos/Videos/Documents/Completion certificates/
 *  Partner confirmations) has no dedicated storage slots of its own, so
 *  certificates and partner confirmations are filed as Supporting
 *  documents; (2) "Required documents attached" has no per-opportunity
 *  required-document list anywhere in the schema, so it's satisfied by
 *  the presence of any non-deleted Supporting document rather than a
 *  fabricated checklist against specific document names. Evidence file
 *  URLs are short-lived signed URLs (the storage bucket is private, not
 *  public like Mission Camera's) -- refresh the page if one expires. */
export async function getExecutionDetail(id: string): Promise<ExecutionDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: execution } = await supabase.from("executions").select("*").eq("id", id).maybeSingle();
  if (!execution) return null;

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("id, title, cause, district, partner_id, priority, beneficiary_estimate")
    .eq("id", execution.opportunity_id as string)
    .maybeSingle();

  let partnerName: string | null = null;
  if (opportunity?.partner_id) {
    const { data: partner } = await supabase.from("partners").select("name").eq("id", opportunity.partner_id).maybeSingle();
    partnerName = (partner?.name as string | undefined) ?? null;
  }

  const evidenceByExecution = await getEvidenceByExecutionIds(supabase, [id]);
  const evidence = evidenceByExecution.get(id) ?? [];

  const checklist = buildChecklist(
    execution.outcome_summary as string | null,
    execution.actual_beneficiaries as number | null,
    execution.completion_notes as string | null,
    evidence.map((e) => e.category)
  );
  const missingItems = (Object.keys(checklist) as (keyof EvidenceQualityChecklist)[])
    .filter((key) => !checklist[key])
    .map((key) => CHECKLIST_LABELS[key]);
  const completionPercentage = Math.round(
    (Object.values(checklist).filter(Boolean).length / Object.values(checklist).length) * 100
  );

  const documentationStoredStatus = execution.documentation_status as DocumentationStoredStatus;

  const timeline: ExecutionTimelineEntry[] = [{ label: "Allocated", dateIso: execution.created_at as string }];
  if (execution.assigned_at) timeline.push({ label: "Assigned", dateIso: execution.assigned_at as string });
  if (execution.scheduled_at) timeline.push({ label: "Scheduled", dateIso: execution.scheduled_at as string });
  if (execution.started_at) timeline.push({ label: "Started", dateIso: execution.started_at as string });
  if (execution.completed_at) timeline.push({ label: "Completed", dateIso: execution.completed_at as string });
  if (execution.evidence_uploaded_at) timeline.push({ label: "Evidence uploaded", dateIso: execution.evidence_uploaded_at as string });
  if (execution.submitted_for_review_at) timeline.push({ label: "Submitted for review", dateIso: execution.submitted_for_review_at as string });
  if (execution.review_started_at) timeline.push({ label: "Review started", dateIso: execution.review_started_at as string });
  if (execution.review_decision_at) {
    const decisionLabel: Record<string, string> = {
      approved: "Approved",
      returned_for_changes: "Returned for changes",
      rejected: "Rejected",
    };
    timeline.push({
      label: decisionLabel[execution.documentation_status as string] ?? "Review decided",
      dateIso: execution.review_decision_at as string,
    });
  }
  timeline.sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime());

  return {
    id: execution.id as string,
    opportunityId: execution.opportunity_id as string,
    opportunityTitle: (opportunity?.title as string | undefined) ?? "Unknown opportunity",
    cause: (opportunity?.cause as string | undefined) ?? "—",
    district: (opportunity?.district as string | null | undefined) ?? null,
    partnerName,
    executionOwner: execution.execution_owner as string | null,
    priority: (opportunity?.priority as OpportunityPriority | undefined) ?? "normal",
    scheduledDate: execution.scheduled_date as string | null,
    completedAtIso: execution.completed_at as string | null,
    status: execution.status as ExecutionStatus,
    beneficiaryEstimate: (opportunity?.beneficiary_estimate as number | null | undefined) ?? null,
    actualBeneficiaries: execution.actual_beneficiaries as number | null,
    outcomeSummary: execution.outcome_summary as string | null,
    completionNotes: execution.completion_notes as string | null,
    unexpectedIssues: execution.unexpected_issues as string | null,
    lessonsLearned: execution.lessons_learned as string | null,
    evidence,
    checklist,
    missingItems,
    completionPercentage,
    documentationStoredStatus,
    documentationReadiness: computeDocumentationReadiness(documentationStoredStatus, checklist),
    canSubmitForReview: canSubmitForReview(documentationStoredStatus, checklist),
    submittedForReviewAtIso: execution.submitted_for_review_at as string | null,
    reviewNotes: execution.review_notes as string | null,
    timeline,
  };
}
