import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { OpportunityPriority } from "@/lib/opportunities";
import type { EvidenceCategory } from "@/lib/execution-detail";

export type PublicationWorkflowStatus = "ready_for_publishing" | "under_preparation" | "awaiting_approval" | "published" | "archived";
type PublicationStoredStatus = "under_preparation" | "published" | "archived" | null;

const PHOTO_CATEGORIES: EvidenceCategory[] = ["before_photo", "after_photo", "execution_photo"];
const STATUS_ORDER: Record<PublicationWorkflowStatus, number> = {
  ready_for_publishing: 0,
  under_preparation: 1,
  awaiting_approval: 2,
  published: 3,
  archived: 4,
};
export interface FinalApprovalChecklist {
  documentationApproved: boolean;
  storyComplete: boolean;
  evidenceSelected: boolean;
  reviewCompleted: boolean;
  publicationApproved: boolean;
}

export interface SelectablePhoto {
  id: string;
  fileName: string;
  category: EvidenceCategory;
  url: string | null;
  selected: boolean;
  isCover: boolean;
}

export interface PublicationTimelineEntry {
  label: string;
  dateIso: string;
}

export interface PublicationQueueItem {
  executionId: string;
  opportunityId: string;
  actTitle: string;
  cause: string;
  district: string | null;
  partnerName: string | null;
  preparedByName: string | null;
  status: PublicationWorkflowStatus;
  priority: OpportunityPriority;
  publicationDateIso: string | null;
  description: string | null;
  storySituation: string | null;
  storyAction: string | null;
  storyOutcome: string | null;
  beneficiaryCount: number | null;
  executionOwner: string | null;
  scheduledDateIso: string | null;
  availablePhotos: SelectablePhoto[];
  checklist: FinalApprovalChecklist;
  canPublish: boolean;
  publishedMissionId: string | null;
  timeline: PublicationTimelineEntry[];
}

export interface PublishingCenterData {
  readyForPublishing: number;
  publishedThisMonth: number;
  avgPublishTimeDays: number | null;
  pendingFinalReview: number;
  queueCounts: {
    readyForPublishing: number;
    underPreparation: number;
    awaitingApproval: number;
    published: number;
    archived: number;
  };
  items: PublicationQueueItem[];
  causes: string[];
  districts: string[];
  preparers: string[];
  metrics: {
    publishedThisMonth: number;
    avgPublishTimeDays: number | null;
    accuracyRate: null;
    correctionsRequired: null;
  };
}

export function allFinalApprovalComplete(c: FinalApprovalChecklist): boolean {
  return c.documentationApproved && c.storyComplete && c.evidenceSelected && c.reviewCompleted && c.publicationApproved;
}

/** Shared with lib/publishing-actions.ts's publishAction so the Publish
 *  button's disabled state and the action's independent server-side
 *  re-verification can never drift apart. */
export function canPublish(status: PublicationWorkflowStatus, checklist: FinalApprovalChecklist): boolean {
  return (status === "under_preparation" || status === "awaiting_approval") && allFinalApprovalComplete(checklist);
}

/** "Awaiting approval" is never stored -- it's "under_preparation" plus a
 *  fully-complete checklist, same pattern as OP-005A/OP-006's own
 *  computed-not-stored readiness states. */
export function computeWorkflowStatus(stored: PublicationStoredStatus, checklist: FinalApprovalChecklist): PublicationWorkflowStatus {
  if (stored === "published") return "published";
  if (stored === "archived") return "archived";
  if (stored === "under_preparation") return allFinalApprovalComplete(checklist) ? "awaiting_approval" : "under_preparation";
  return "ready_for_publishing";
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** OP-007 Publishing Center's full data set. Server-side only. Scoped to
 *  executions with documentation_status = 'approved' (locked rule: "only
 *  approved documentation may enter publishing"). No OP-006A-style
 *  companion screen exists here either -- the locked Desktop Layout puts
 *  the queue table and every per-item row (Story Preparation through
 *  Publication Timeline) on one page, same architecture as OP-006.
 *
 *  Two documented gaps: (1) video evidence isn't selectable for
 *  publication -- the existing `evidence` table's photo_url is NOT NULL,
 *  and Mission Camera fills it by generating a poster frame client-side
 *  at capture time; this server-side pipeline has no video-processing
 *  capability to generate one, so only photo evidence (before/after/
 *  execution categories) can become a published Act's images this round.
 *  (2) "Publication accuracy rate" / "corrections required" (Row 7) have
 *  no real data source -- no post-publication correction/versioning
 *  system exists (the locked rule calling for one is a future gap, not
 *  built here) -- both stay null/honestly absent rather than fabricated. */
export async function getPublishingCenterData(): Promise<PublishingCenterData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const month = currentMonthKey();

  const { data: executions } = await supabase.from("executions").select("*").eq("documentation_status", "approved");
  const execs = executions ?? [];

  const opportunityIds = Array.from(new Set(execs.map((e) => e.opportunity_id as string)));
  const { data: opportunities } =
    opportunityIds.length > 0
      ? await supabase.from("opportunities").select("id, title, cause, district, partner_id, priority").in("id", opportunityIds)
      : { data: [] };
  const opportunityById = new Map((opportunities ?? []).map((o) => [o.id as string, o]));

  const partnerIds = Array.from(new Set((opportunities ?? []).map((o) => o.partner_id as string | null).filter((v): v is string => !!v)));
  const { data: partners } = partnerIds.length > 0 ? await supabase.from("partners").select("id, name").in("id", partnerIds) : { data: [] };
  const partnerById = new Map((partners ?? []).map((p) => [p.id as string, p.name as string]));

  const operatorIds = Array.from(new Set(execs.map((e) => e.publication_prepared_by as string | null).filter((v): v is string => !!v)));
  const { data: operators } = operatorIds.length > 0 ? await supabase.from("operators").select("id, display_name").in("id", operatorIds) : { data: [] };
  const operatorNameById = new Map((operators ?? []).map((o) => [o.id as string, o.display_name as string]));

  interface EvidenceRow {
    id: string;
    execution_id: string;
    file_name: string;
    category: string;
    storage_path: string;
    status: string;
    selected_for_publication: boolean;
    is_cover: boolean;
  }
  const executionIds = execs.map((e) => e.id as string);
  const { data: evidenceRowsRaw } =
    executionIds.length > 0
      ? await supabase
          .from("execution_evidence")
          .select("id, execution_id, file_name, category, storage_path, status, selected_for_publication, is_cover")
          .in("execution_id", executionIds)
          .in("category", PHOTO_CATEGORIES)
          .neq("status", "deleted")
      : { data: [] as EvidenceRow[] };
  const evidenceRows = (evidenceRowsRaw ?? []) as EvidenceRow[];
  const photosByExecution = new Map<string, EvidenceRow[]>();
  for (const row of evidenceRows) {
    const key = row.execution_id;
    const list = photosByExecution.get(key);
    if (list) list.push(row);
    else photosByExecution.set(key, [row]);
  }
  const signedUrlByPath = new Map<string, string | null>();
  await Promise.all(
    evidenceRows.map(async (row) => {
      const { data: signed } = await supabase.storage.from("execution-evidence").createSignedUrl(row.storage_path as string, 3600);
      signedUrlByPath.set(row.storage_path as string, signed?.signedUrl ?? null);
    })
  );

  const items: PublicationQueueItem[] = execs.map((e) => {
    const opportunity = opportunityById.get(e.opportunity_id as string);
    const partnerName = opportunity?.partner_id ? (partnerById.get(opportunity.partner_id as string) ?? null) : null;
    const photos: SelectablePhoto[] = (photosByExecution.get(e.id as string) ?? []).map((row) => ({
      id: row.id as string,
      fileName: row.file_name as string,
      category: row.category as EvidenceCategory,
      url: signedUrlByPath.get(row.storage_path as string) ?? null,
      selected: row.selected_for_publication as boolean,
      isCover: row.is_cover as boolean,
    }));

    const checklist: FinalApprovalChecklist = {
      documentationApproved: true,
      storyComplete: !!(e.publication_act_title && e.publication_description && e.publication_story_situation && e.publication_story_outcome),
      evidenceSelected: photos.some((p) => p.selected) && photos.some((p) => p.isCover),
      reviewCompleted: e.publication_review_completed as boolean,
      publicationApproved: e.publication_approved as boolean,
    };
    const status = computeWorkflowStatus(e.publication_status as PublicationStoredStatus, checklist);

    const timeline: PublicationTimelineEntry[] = [];
    if (e.review_decision_at) timeline.push({ label: "Documentation approved", dateIso: e.review_decision_at as string });
    if (e.publication_prepared_at) timeline.push({ label: "Story prepared", dateIso: e.publication_prepared_at as string });
    if (e.publication_evidence_selected_at) timeline.push({ label: "Evidence selected", dateIso: e.publication_evidence_selected_at as string });
    if (e.publication_review_completed_at) timeline.push({ label: "Review completed", dateIso: e.publication_review_completed_at as string });
    if (e.publication_published_at) timeline.push({ label: "Published", dateIso: e.publication_published_at as string });

    return {
      executionId: e.id as string,
      opportunityId: e.opportunity_id as string,
      actTitle: (e.publication_act_title as string | null) ?? (opportunity?.title as string | undefined) ?? "Untitled Act",
      cause: (opportunity?.cause as string | undefined) ?? "—",
      district: (opportunity?.district as string | null | undefined) ?? null,
      partnerName,
      preparedByName: e.publication_prepared_by ? (operatorNameById.get(e.publication_prepared_by as string) ?? null) : null,
      status,
      priority: (opportunity?.priority as OpportunityPriority | undefined) ?? "normal",
      publicationDateIso: e.publication_published_at as string | null,
      description: e.publication_description as string | null,
      storySituation: e.publication_story_situation as string | null,
      storyAction: e.publication_story_action as string | null,
      storyOutcome: e.publication_story_outcome as string | null,
      beneficiaryCount: e.actual_beneficiaries as number | null,
      executionOwner: e.execution_owner as string | null,
      scheduledDateIso: e.scheduled_date as string | null,
      availablePhotos: photos,
      checklist,
      canPublish: canPublish(status, checklist),
      publishedMissionId: e.published_mission_id as string | null,
      timeline,
    };
  });

  items.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.publicationDateIso && b.publicationDateIso) return new Date(b.publicationDateIso).getTime() - new Date(a.publicationDateIso).getTime();
    return 0;
  });

  const queueCounts = {
    readyForPublishing: items.filter((i) => i.status === "ready_for_publishing").length,
    underPreparation: items.filter((i) => i.status === "under_preparation").length,
    awaitingApproval: items.filter((i) => i.status === "awaiting_approval").length,
    published: items.filter((i) => i.status === "published").length,
    archived: items.filter((i) => i.status === "archived").length,
  };

  const publishedThisMonthItems = items.filter((i) => i.publicationDateIso && (i.publicationDateIso as string).startsWith(month));
  const publishDurations = items
    .filter((i) => i.publicationDateIso && i.timeline.some((t) => t.label === "Documentation approved"))
    .map((i) => {
      const approvedAt = i.timeline.find((t) => t.label === "Documentation approved")?.dateIso;
      return approvedAt ? daysBetween(approvedAt, i.publicationDateIso as string) : null;
    })
    .filter((v): v is number => v !== null);
  const avgPublishTimeDays = average(publishDurations);

  const causes = Array.from(new Set(items.map((i) => i.cause)));
  const districts = Array.from(new Set(items.map((i) => i.district).filter((d): d is string => !!d)));
  const preparers = Array.from(new Set(items.map((i) => i.preparedByName).filter((p): p is string => !!p)));

  return {
    readyForPublishing: queueCounts.readyForPublishing,
    publishedThisMonth: publishedThisMonthItems.length,
    avgPublishTimeDays,
    pendingFinalReview: queueCounts.underPreparation + queueCounts.awaitingApproval,
    queueCounts,
    items,
    causes,
    districts,
    preparers,
    metrics: {
      publishedThisMonth: publishedThisMonthItems.length,
      avgPublishTimeDays,
      accuracyRate: null,
      correctionsRequired: null,
    },
  };
}
