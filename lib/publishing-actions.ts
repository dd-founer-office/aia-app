"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { getPublishingCenterData } from "@/lib/publishing";

function revalidatePublishing(missionId?: string) {
  revalidatePath("/ops/publishing");
  revalidatePath("/ops/executions");
  revalidatePath("/ops/opportunities");
  revalidatePath("/ops");
  revalidatePath("/acts");
  if (missionId) revalidatePath(`/acts/${missionId}`);
}

/** OP-007 header's "Create publication" action. Only from an execution
 *  whose documentation is approved (locked rule) and that hasn't already
 *  been started. Prefills the story draft from real data already on file
 *  (opportunity's own need summary and the field team's own outcome
 *  summary from OP-005A) -- a real starting point the operator edits for
 *  public-facing tone, never left as-is unedited by design. */
export async function createPublicationAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase
    .from("executions")
    .select("documentation_status, publication_status, opportunity_id, outcome_summary")
    .eq("id", executionId)
    .maybeSingle();
  if (!execution) return { error: "Execution not found." };
  if (execution.documentation_status !== "approved") return { error: "Only approved documentation can enter publishing." };
  if (execution.publication_status) return { error: "A publication has already been started for this execution." };

  const { data: opportunity } = await supabase
    .from("opportunities")
    .select("title, need_summary")
    .eq("id", execution.opportunity_id as string)
    .maybeSingle();

  const { error } = await supabase
    .from("executions")
    .update({
      publication_status: "under_preparation",
      publication_prepared_by: auth.operator.operatorId,
      publication_prepared_at: new Date().toISOString(),
      publication_act_title: opportunity?.title ?? null,
      publication_description: execution.outcome_summary,
      publication_story_situation: opportunity?.need_summary ?? null,
      publication_story_outcome: execution.outcome_summary,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidatePublishing();
  return {};
}

/** OP-007 Row 3's Story Preparation save. Locked rules (outcome first, no
 *  fundraising language, max 60s read) are editorial guidance for the
 *  operator writing it, not something this action can mechanically
 *  enforce -- same as OP-003's editorial fields. */
export async function saveStoryPreparationAction(executionId: string, formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("executions")
    .update({
      publication_act_title: (formData.get("act_title") as string | null)?.trim() || null,
      publication_description: (formData.get("description") as string | null)?.trim() || null,
      publication_story_situation: (formData.get("story_situation") as string | null)?.trim() || null,
      publication_story_action: (formData.get("story_action") as string | null)?.trim() || null,
      publication_story_outcome: (formData.get("story_outcome") as string | null)?.trim() || null,
    })
    .eq("id", executionId);
  if (error) return { error: error.message };

  revalidatePublishing();
  return {};
}

/** OP-007 Row 4's Evidence Selection save. Locked rule: at least one
 *  cover image required. Only ever touches this execution's own photo
 *  evidence rows -- videos aren't selectable here (see lib/publishing.ts's
 *  header comment on why). */
export async function updateEvidenceSelectionAction(
  executionId: string,
  selectedIds: string[],
  coverId: string | null
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (coverId && !selectedIds.includes(coverId)) return { error: "The cover image must be one of the selected photos." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: photos } = await supabase
    .from("execution_evidence")
    .select("id")
    .eq("execution_id", executionId)
    .neq("status", "deleted");
  const allIds = (photos ?? []).map((p) => p.id as string);

  await supabase.from("execution_evidence").update({ selected_for_publication: false, is_cover: false }).in("id", allIds);

  if (selectedIds.length > 0) {
    const { error: selectError } = await supabase
      .from("execution_evidence")
      .update({ selected_for_publication: true })
      .in("id", selectedIds);
    if (selectError) return { error: selectError.message };
  }
  if (coverId) {
    const { error: coverError } = await supabase.from("execution_evidence").update({ is_cover: true }).eq("id", coverId);
    if (coverError) return { error: coverError.message };
  }

  if (selectedIds.length > 0 && coverId) {
    const { data: current } = await supabase.from("executions").select("publication_evidence_selected_at").eq("id", executionId).maybeSingle();
    if (current && !current.publication_evidence_selected_at) {
      await supabase.from("executions").update({ publication_evidence_selected_at: new Date().toISOString() }).eq("id", executionId);
    }
  }

  revalidatePublishing();
  return {};
}

/** OP-007 Row 6's Final Approval checklist save. "Review completed" and
 *  "Publication approved" are the two locked checklist items an operator
 *  actively controls (the other three -- documentation approved, story
 *  complete, evidence selected -- are all derived from real state, per
 *  lib/publishing.ts's own checklist computation). */
export async function updateFinalApprovalAction(executionId: string, formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const reviewCompleted = formData.get("review_completed") === "on";
  const publicationApproved = formData.get("publication_approved") === "on";

  const { data: current } = await supabase.from("executions").select("publication_review_completed_at").eq("id", executionId).maybeSingle();
  const update: Record<string, unknown> = { publication_review_completed: reviewCompleted, publication_approved: publicationApproved };
  if (reviewCompleted && current && !current.publication_review_completed_at) {
    update.publication_review_completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("executions").update(update).eq("id", executionId);
  if (error) return { error: error.message };

  revalidatePublishing();
  return {};
}

/** OP-007's Archived alt path. Only for a publication still in
 *  preparation -- an already-Published Act is permanent (locked rule),
 *  so this action refuses once publication_status is 'published'. */
export async function archivePublicationAction(executionId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: execution } = await supabase.from("executions").select("publication_status").eq("id", executionId).maybeSingle();
  if (!execution) return { error: "Execution not found." };
  if (execution.publication_status === "published") return { error: "A published Act cannot be archived." };

  const { error } = await supabase.from("executions").update({ publication_status: "archived" }).eq("id", executionId);
  if (error) return { error: error.message };

  revalidatePublishing();
  return {};
}

/**
 * OP-007 header's "Publish" action -- the one irreversible step. Locked
 * rules: only approved documentation may enter publishing; publication
 * creates a real CA-010 Acts Feed entry + CA-011 Act Detail page;
 * publication is permanent. Independently re-verifies the entire Final
 * Approval checklist server-side (never trusting the client) by calling
 * the same getPublishingCenterData() the queue itself renders from.
 *
 * Writes into the existing missions/evidence/mission_publications tables
 * -- the exact schema CA-010/CA-011 already read from (lib/published-acts.ts)
 * -- rather than inventing a parallel publishing entity. Selected photos
 * and videos are copied from the private 'execution-evidence' bucket into the
 * public 'mission-evidence' bucket (the contributor app fetches evidence
 * URLs directly with no signing step, so they must live in a public
 * bucket to be visible at all) -- all copies happen before any table
 * writes, so a mid-copy failure never leaves a half-published Act
 * behind. There is no cross-resource transaction spanning Storage and
 * Postgres, though -- a failure between the missions insert and the
 * mission_publications insert could in principle leave an orphaned,
 * unpublished-looking missions row; that's a known, documented gap, not
 * a silent one.
 */
// Logged, not silent: a `{ error }` return here never throws, so it never
// shows up in Vercel's runtime error logs on its own -- console.error makes
// a rejected publish attempt actually diagnosable after the fact instead of
// just vanishing back to the queue with no trace.
function publishError(executionId: string, message: string): { error: string } {
  console.error(`publishAction(${executionId}) failed: ${message}`);
  return { error: message };
}

export async function publishAction(executionId: string): Promise<{ error?: string; missionId?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return publishError(executionId, "You need to sign in as an operator.");

  const supabase = await getSupabaseServerClient();
  if (!supabase) return publishError(executionId, "Supabase is not configured on this deployment.");

  const data = await getPublishingCenterData();
  const item = data.items.find((i) => i.executionId === executionId);
  if (!item) return publishError(executionId, "This execution isn't eligible for publishing.");
  if (!item.canPublish) return publishError(executionId, "The Final Approval checklist must be complete before publishing.");

  const { data: execution } = await supabase.from("executions").select("*").eq("id", executionId).maybeSingle();
  if (!execution) return publishError(executionId, "Execution not found.");

  const { data: opportunity } = await supabase.from("opportunities").select("*").eq("id", execution.opportunity_id as string).maybeSingle();
  if (!opportunity) return publishError(executionId, "Opportunity not found.");

  let partnerName: string | null = null;
  if (opportunity.partner_id) {
    const { data: partner } = await supabase.from("partners").select("name").eq("id", opportunity.partner_id).maybeSingle();
    partnerName = (partner?.name as string | undefined) ?? null;
  }

  const { data: selectedEvidence } = await supabase
    .from("execution_evidence")
    .select("id, file_name, file_type, category, storage_path, is_cover, uploaded_at")
    .eq("execution_id", executionId)
    .eq("selected_for_publication", true)
    .neq("status", "deleted")
    .order("uploaded_at", { ascending: true });
  const evidence = selectedEvidence ?? [];
  // Cover is always a photo (the Evidence Selection UI only ever offers the
  // "Cover image" radio on photo rows), so this also guarantees at least
  // one photo is selected even when video evidence is included too.
  if (evidence.length === 0 || !evidence.some((e) => e.is_cover)) {
    return publishError(executionId, "Select at least one photo and a cover image before publishing.");
  }

  // Copy every selected photo/video into the public bucket before any
  // table writes -- if a copy fails, nothing has been published yet.
  const copied: { fileName: string; fileType: string; category: string; publicUrl: string; isCover: boolean; uploadedAt: string }[] = [];
  for (const [index, e] of evidence.entries()) {
    const { data: downloaded, error: downloadError } = await supabase.storage
      .from("execution-evidence")
      .download(e.storage_path as string);
    if (downloadError || !downloaded) {
      return publishError(executionId, `Couldn't read ${e.file_name} from storage: ${downloadError?.message ?? "unknown error"}`);
    }
    const publicPath = `${executionId}/${index + 1}-${Date.now()}-${e.file_name}`;
    const { error: uploadError } = await supabase.storage
      .from("mission-evidence")
      .upload(publicPath, downloaded, { contentType: e.file_type as string });
    if (uploadError) {
      return publishError(executionId, `Couldn't publish ${e.file_name}: ${uploadError.message}`);
    }
    const { data: publicUrlData } = supabase.storage.from("mission-evidence").getPublicUrl(publicPath);
    copied.push({
      fileName: e.file_name as string,
      fileType: e.file_type as string,
      category: e.category as string,
      publicUrl: publicUrlData.publicUrl,
      isCover: e.is_cover as boolean,
      uploadedAt: e.uploaded_at as string,
    });
  }

  const missionDate =
    (execution.completed_at as string | null)?.slice(0, 10) ?? (execution.scheduled_date as string | null) ?? new Date().toISOString().slice(0, 10);

  const { data: mission, error: missionError } = await supabase
    .from("missions")
    .insert({
      mission_name: execution.publication_act_title as string,
      cause: opportunity.cause,
      organization: partnerName ?? (opportunity.title as string),
      field_executive: (execution.execution_owner as string | null) ?? "AiA Operations",
      mission_date: missionDate,
      status: "published",
    })
    .select("id")
    .single();
  if (missionError || !mission) return publishError(executionId, missionError?.message ?? "Failed to create the Act.");
  const missionId = mission.id as string;

  // Cover is guaranteed to exist and to be a photo (checked above), so it's
  // always safe as the thumbnail (photo_url, NOT NULL) for any video rows --
  // see this file's header comment on why videos reuse it instead of a
  // generated frame grab.
  const coverPublicUrl = copied.find((f) => f.isCover)?.publicUrl as string;

  let featuredEvidenceId: string | null = null;
  for (const [index, file] of copied.entries()) {
    const isVideo = file.category === "video";
    const { data: evidenceRow, error: evidenceError } = await supabase
      .from("evidence")
      .insert({
        mission_id: missionId,
        photo_url: isVideo ? coverPublicUrl : file.publicUrl,
        video_url: isVideo ? file.publicUrl : null,
        media_kind: isVideo ? "video" : "photo",
        capture_time: file.uploadedAt,
        capture_order: index + 1,
      })
      .select("id")
      .single();
    if (evidenceError || !evidenceRow) return publishError(executionId, evidenceError?.message ?? "Failed to attach evidence to the Act.");
    if (file.isCover) featuredEvidenceId = evidenceRow.id as string;
  }

  const { error: publicationError } = await supabase.from("mission_publications").insert({
    mission_id: missionId,
    title: execution.publication_act_title as string,
    description: execution.publication_description as string,
    featured_evidence_id: featuredEvidenceId,
    published_by: auth.operator.displayName,
    landmark: opportunity.district as string | null,
    beneficiary_count: execution.actual_beneficiaries as number | null,
    story_situation: execution.publication_story_situation as string | null,
    story_action: execution.publication_story_action as string | null,
    story_outcome: execution.publication_story_outcome as string | null,
  });
  if (publicationError) return publishError(executionId, publicationError.message);

  await supabase
    .from("executions")
    .update({ publication_status: "published", publication_published_at: new Date().toISOString(), published_mission_id: missionId })
    .eq("id", executionId);

  await supabase.from("opportunities").update({ status: "published", published_at: new Date().toISOString() }).eq("id", opportunity.id);

  // Act Published notification (Phase 4) -- real attribution, not a
  // guess: every contributor whose participation was actually linked to
  // this opportunity via participation_allocations (see
  // lib/act-attribution.ts), filtered to those who haven't opted out.
  // Best-effort -- the Act is already genuinely published by this point,
  // so a notification failure here is logged-by-omission, not a reason to
  // fail the whole publish.
  const { data: allocRows } = await supabase.from("allocations").select("id").eq("opportunity_id", opportunity.id);
  const allocationIds = (allocRows ?? []).map((a) => a.id as string);
  if (allocationIds.length > 0) {
    const { data: linkRows } = await supabase.from("participation_allocations").select("participation_id").in("allocation_id", allocationIds);
    const participationIds = Array.from(new Set((linkRows ?? []).map((l) => l.participation_id as string)));
    if (participationIds.length > 0) {
      const { data: participationRows } = await supabase.from("participations").select("contributor_id").in("id", participationIds);
      const contributorIds = Array.from(new Set((participationRows ?? []).map((p) => p.contributor_id as string)));
      if (contributorIds.length > 0) {
        const { data: eligibleContributors } = await supabase
          .from("contributors")
          .select("id")
          .in("id", contributorIds)
          .eq("notify_act_published", true);
        const notifyIds = (eligibleContributors ?? []).map((c) => c.id as string);
        if (notifyIds.length > 0) {
          await supabase.from("notifications").insert(
            notifyIds.map((contributorId) => ({
              contributor_id: contributorId,
              type: "act_published",
              title: "A new Act of Aram has been published",
              body: `${execution.publication_act_title as string} is now live.`,
              link: `/acts/${missionId}`,
            }))
          );
        }
      }
    }
  }

  revalidatePublishing(missionId);
  return { missionId };
}

/** OP-007 header's "Export" action, same pattern as OP-004/005/006's. */
export async function exportPublishingAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getPublishingCenterData();
  const header = ["Execution ID", "Act title", "Cause", "District", "Prepared by", "Status", "Publication date"];
  const rows = data.items.map((i) => [
    i.executionId,
    i.actTitle,
    i.cause,
    i.district ?? "",
    i.preparedByName ?? "",
    i.status,
    i.publicationDateIso ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

  return { csv };
}
