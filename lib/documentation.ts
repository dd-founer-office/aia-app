import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { OpportunityPriority } from "@/lib/opportunities";
import { getEvidenceByExecutionIds, type EvidenceFile } from "@/lib/execution-detail";

export type DocumentationReviewStatus = "submitted" | "under_review" | "approved" | "returned_for_changes" | "rejected";
export type PublicationReadiness = "ready_for_publishing" | "needs_changes" | "rejected" | "pending";

export interface EvidenceReviewChecklist {
  evidenceClear: boolean;
  evidenceRelevant: boolean;
  evidenceComplete: boolean;
  outcomeVerified: boolean;
  beneficiaryCountReasonable: boolean;
}

const REVIEW_STATUS_ORDER: Record<DocumentationReviewStatus, number> = {
  submitted: 0,
  under_review: 1,
  returned_for_changes: 2,
  rejected: 3,
  approved: 4,
};
const PRIORITY_ORDER: Record<OpportunityPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export interface DocumentationTimelineEntry {
  label: string;
  dateIso: string;
}

export interface DocumentationQueueItem {
  executionId: string;
  opportunityId: string;
  opportunityTitle: string;
  cause: string;
  district: string | null;
  priority: OpportunityPriority;
  submittedByName: string | null;
  submittedAtIso: string | null;
  reviewStatus: DocumentationReviewStatus;
  reviewedByName: string | null;
  reviewStartedAtIso: string | null;
  reviewDecisionAtIso: string | null;
  reviewNotes: string | null;
  outcomeSummary: string | null;
  actualBeneficiaries: number | null;
  beneficiaryEstimate: number | null;
  completionNotes: string | null;
  evidence: EvidenceFile[];
  evidenceCount: number;
  supportingDocumentsCount: number;
  checklist: EvidenceReviewChecklist;
  canApprove: boolean;
  readiness: PublicationReadiness;
  timeline: DocumentationTimelineEntry[];
}

export interface DocumentationCenterData {
  pendingReviews: number;
  approvedDocumentation: number;
  rejectedDocumentation: number;
  avgReviewTimeDays: number | null;
  queueCounts: {
    readyForReview: number;
    underReview: number;
    approved: number;
    rejected: number;
    returnedForChanges: number;
  };
  items: DocumentationQueueItem[];
  districts: string[];
  causes: string[];
  reviewers: string[];
  qualityMetrics: {
    approvalRate: number | null;
    returnRate: number | null;
    avgReviewTimeDays: number | null;
    missingEvidenceRate: number | null;
  };
}

export function allEvidenceChecklistComplete(c: EvidenceReviewChecklist): boolean {
  return c.evidenceClear && c.evidenceRelevant && c.evidenceComplete && c.outcomeVerified && c.beneficiaryCountReasonable;
}

/** Shared with lib/documentation-actions.ts's approveDocumentationAction so
 *  the Approve button's disabled state and the action's independent
 *  server-side re-verification can never drift apart. */
export function canApproveDocumentation(status: DocumentationReviewStatus, checklist: EvidenceReviewChecklist): boolean {
  return (status === "submitted" || status === "under_review") && allEvidenceChecklistComplete(checklist);
}

export function computePublicationReadiness(status: DocumentationReviewStatus): PublicationReadiness {
  if (status === "approved") return "ready_for_publishing";
  if (status === "returned_for_changes") return "needs_changes";
  if (status === "rejected") return "rejected";
  return "pending";
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** OP-006 Documentation Center's full data set. Server-side only, real
 *  queries throughout. Scoped to executions that have been submitted at
 *  least once (documentation_status != 'draft') -- drafts still being
 *  worked on in OP-005A don't belong in a review queue. "Documentation
 *  ID" from the locked spec is the execution's own id; there's no
 *  separate documentation entity, matching OP-005A's own choice not to
 *  invent one. Evidence and its signed URLs are fetched for every queue
 *  item up front (one batched query, not one per item) -- reasonable at
 *  this app's current real scale; would need pagination if the queue
 *  ever grows large. */
export async function getDocumentationCenterData(): Promise<DocumentationCenterData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const { data: executions } = await supabase.from("executions").select("*").neq("documentation_status", "draft");
  const execs = executions ?? [];

  const opportunityIds = Array.from(new Set(execs.map((e) => e.opportunity_id as string)));
  const { data: opportunities } =
    opportunityIds.length > 0
      ? await supabase.from("opportunities").select("id, title, cause, district, priority, beneficiary_estimate").in("id", opportunityIds)
      : { data: [] };
  const opportunityById = new Map((opportunities ?? []).map((o) => [o.id as string, o]));

  const operatorIds = Array.from(
    new Set(
      execs
        .flatMap((e) => [e.submitted_by as string | null, e.reviewed_by as string | null])
        .filter((v): v is string => !!v)
    )
  );
  const { data: operators } = operatorIds.length > 0 ? await supabase.from("operators").select("id, display_name").in("id", operatorIds) : { data: [] };
  const operatorNameById = new Map((operators ?? []).map((o) => [o.id as string, o.display_name as string]));

  const evidenceByExecution = await getEvidenceByExecutionIds(
    supabase,
    execs.map((e) => e.id as string)
  );

  const items: DocumentationQueueItem[] = execs.map((e) => {
    const opportunity = opportunityById.get(e.opportunity_id as string);
    const reviewStatus = e.documentation_status as DocumentationReviewStatus;
    const evidence = evidenceByExecution.get(e.id as string) ?? [];
    const checklist: EvidenceReviewChecklist = {
      evidenceClear: e.evidence_clear as boolean,
      evidenceRelevant: e.evidence_relevant as boolean,
      evidenceComplete: e.evidence_complete as boolean,
      outcomeVerified: e.outcome_verified as boolean,
      beneficiaryCountReasonable: e.beneficiary_count_reasonable as boolean,
    };

    const timeline: DocumentationTimelineEntry[] = [];
    if (e.submitted_for_review_at) timeline.push({ label: "Submitted", dateIso: e.submitted_for_review_at as string });
    if (e.review_started_at) timeline.push({ label: "Review started", dateIso: e.review_started_at as string });
    if (e.review_decision_at) {
      const decisionLabel: Record<string, string> = { approved: "Approved", returned_for_changes: "Returned", rejected: "Rejected" };
      timeline.push({ label: decisionLabel[reviewStatus] ?? "Review completed", dateIso: e.review_decision_at as string });
    }

    return {
      executionId: e.id as string,
      opportunityId: e.opportunity_id as string,
      opportunityTitle: (opportunity?.title as string | undefined) ?? "Unknown opportunity",
      cause: (opportunity?.cause as string | undefined) ?? "—",
      district: (opportunity?.district as string | null | undefined) ?? null,
      priority: (opportunity?.priority as OpportunityPriority | undefined) ?? "normal",
      submittedByName: e.submitted_by ? (operatorNameById.get(e.submitted_by as string) ?? null) : null,
      submittedAtIso: e.submitted_for_review_at as string | null,
      reviewStatus,
      reviewedByName: e.reviewed_by ? (operatorNameById.get(e.reviewed_by as string) ?? null) : null,
      reviewStartedAtIso: e.review_started_at as string | null,
      reviewDecisionAtIso: e.review_decision_at as string | null,
      reviewNotes: e.review_notes as string | null,
      outcomeSummary: e.outcome_summary as string | null,
      actualBeneficiaries: e.actual_beneficiaries as number | null,
      beneficiaryEstimate: (opportunity?.beneficiary_estimate as number | null | undefined) ?? null,
      completionNotes: e.completion_notes as string | null,
      evidence,
      evidenceCount: evidence.length,
      supportingDocumentsCount: evidence.filter((f) => f.category === "supporting_document").length,
      checklist,
      canApprove: canApproveDocumentation(reviewStatus, checklist),
      readiness: computePublicationReadiness(reviewStatus),
      timeline,
    };
  });

  items.sort((a, b) => {
    const statusDiff = REVIEW_STATUS_ORDER[a.reviewStatus] - REVIEW_STATUS_ORDER[b.reviewStatus];
    if (statusDiff !== 0) return statusDiff;
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.submittedAtIso && b.submittedAtIso) return new Date(a.submittedAtIso).getTime() - new Date(b.submittedAtIso).getTime();
    return 0;
  });

  const queueCounts = {
    readyForReview: items.filter((i) => i.reviewStatus === "submitted").length,
    underReview: items.filter((i) => i.reviewStatus === "under_review").length,
    approved: items.filter((i) => i.reviewStatus === "approved").length,
    rejected: items.filter((i) => i.reviewStatus === "rejected").length,
    returnedForChanges: items.filter((i) => i.reviewStatus === "returned_for_changes").length,
  };

  const decidedItems = items.filter((i) => i.reviewDecisionAtIso);
  const reviewDurations = decidedItems
    .filter((i) => i.submittedAtIso)
    .map((i) => daysBetween(i.submittedAtIso as string, i.reviewDecisionAtIso as string));
  const avgReviewTimeDays = average(reviewDurations);

  const districts = Array.from(new Set(items.map((i) => i.district).filter((d): d is string => !!d)));
  const causes = Array.from(new Set(items.map((i) => i.cause)));
  const reviewers = Array.from(new Set(items.map((i) => i.reviewedByName).filter((r): r is string => !!r)));

  return {
    pendingReviews: queueCounts.readyForReview + queueCounts.underReview,
    approvedDocumentation: queueCounts.approved,
    rejectedDocumentation: queueCounts.rejected,
    avgReviewTimeDays,
    queueCounts,
    items,
    districts,
    causes,
    reviewers,
    qualityMetrics: {
      approvalRate: decidedItems.length > 0 ? queueCounts.approved / decidedItems.length : null,
      returnRate: decidedItems.length > 0 ? queueCounts.returnedForChanges / decidedItems.length : null,
      avgReviewTimeDays,
      missingEvidenceRate: items.length > 0 ? items.filter((i) => i.evidenceCount === 0).length / items.length : null,
    },
  };
}
