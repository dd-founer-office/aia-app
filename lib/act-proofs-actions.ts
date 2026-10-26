"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Saves a manually-entered Proof of Act as a public, unlisted link
 * (/proof/<id>) -- immutable once created (no update/edit path exists; a
 * mistake means creating a corrected one). The operator shares the link
 * themselves (e.g. pasting it into WhatsApp); nothing here sends an
 * email, SMS, push, or in-app notification. Nothing is persisted while
 * the operator is still filling out or previewing the form -- only on
 * explicit confirm.
 */
export async function sendActProofAction(formData: FormData): Promise<{ error?: string; proofId?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const actTitle = (formData.get("act_title") as string | null)?.trim() ?? "";
  const actDate = (formData.get("act_date") as string | null) ?? "";
  const cause = (formData.get("cause") as string | null)?.trim() ?? "";
  const organization = (formData.get("organization") as string | null)?.trim() ?? "";
  const landmark = (formData.get("landmark") as string | null)?.trim() || null;
  const description = (formData.get("description") as string | null)?.trim() ?? "";
  const outcomeSummary = (formData.get("outcome_summary") as string | null)?.trim() || null;
  const heroImageUrlRaw = (formData.get("hero_image_url") as string | null)?.trim() || null;
  const storySituation = (formData.get("story_situation") as string | null)?.trim() || null;
  const storyAction = (formData.get("story_action") as string | null)?.trim() || null;
  const storyOutcome = (formData.get("story_outcome") as string | null)?.trim() || null;
  const testimonialQuote = (formData.get("testimonial_quote") as string | null)?.trim() || null;
  const testimonialAttribution = (formData.get("testimonial_attribution") as string | null)?.trim() || null;
  const testimonialVideoUrlRaw = (formData.get("testimonial_video_url") as string | null)?.trim() || null;
  const reflection = (formData.get("reflection") as string | null)?.trim() || null;
  const contributorId = (formData.get("contributor_id") as string | null)?.trim() || null;
  const recipientNameRaw = (formData.get("recipient_name") as string | null)?.trim() || null;

  // Evidence photos, each already uploaded client-side (see
  // components/ops/ActProofMediaUpload.tsx) -- this field only ever
  // carries the resulting public URLs + captions, never a file.
  const evidenceItemsRaw = (formData.get("evidence_items") as string | null) || "[]";
  let evidenceItems: { photoUrl: string; caption: string | null }[] = [];
  try {
    const parsed = JSON.parse(evidenceItemsRaw);
    if (Array.isArray(parsed)) {
      evidenceItems = parsed
        .filter((item): item is { photoUrl: string; caption: string | null } => typeof item?.photoUrl === "string" && item.photoUrl.trim().length > 0)
        .map((item) => ({ photoUrl: item.photoUrl.trim(), caption: typeof item.caption === "string" ? item.caption.trim() || null : null }));
    }
  } catch {
    return { error: "Evidence photos could not be read. Try removing and re-adding them." };
  }

  if (!actTitle) return { error: "Act title is required." };
  if (!actDate || Number.isNaN(Date.parse(actDate))) return { error: "A valid act date is required." };
  if (!cause) return { error: "Cause is required." };
  if (!organization) return { error: "Organization is required." };
  if (!description) return { error: "Description is required." };
  if (!contributorId && !recipientNameRaw) return { error: "Select a contributor or enter a recipient name." };
  if (heroImageUrlRaw && !isValidHttpUrl(heroImageUrlRaw)) {
    return { error: "Photo URL must be a valid http(s) link, or left blank." };
  }
  if (testimonialVideoUrlRaw && !isValidHttpUrl(testimonialVideoUrlRaw)) {
    return { error: "Video URL must be a valid http(s) link, or left blank." };
  }
  for (const item of evidenceItems) {
    if (!isValidHttpUrl(item.photoUrl)) return { error: "One of the evidence photos has an invalid URL." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  // Real recipient identity, not a trusted client value -- re-resolved
  // here from contributors rather than taking the form's own display
  // name/email along for the ride, so the stored row can't drift from
  // whichever contributor_id actually gets used. A free-text recipient
  // name is only ever used when no real contributor_id was selected.
  let resolvedContributorId: string | null = null;
  if (contributorId) {
    const { data: contributor } = await supabase.from("contributors").select("id").eq("id", contributorId).maybeSingle();
    if (!contributor) return { error: "That contributor could not be found." };
    resolvedContributorId = contributorId;
  }

  const { data: proof, error: proofError } = await supabase
    .from("act_proofs")
    .insert({
      created_by: auth.operator.operatorId,
      contributor_id: resolvedContributorId,
      recipient_name: resolvedContributorId ? null : recipientNameRaw,
      act_title: actTitle,
      act_date: actDate,
      cause,
      organization,
      landmark,
      description,
      outcome_summary: outcomeSummary,
      hero_image_url: heroImageUrlRaw,
      story_situation: storySituation,
      story_action: storyAction,
      story_outcome: storyOutcome,
      testimonial_quote: testimonialQuote,
      testimonial_attribution: testimonialAttribution,
      testimonial_video_url: testimonialVideoUrlRaw,
      reflection,
    })
    .select("id")
    .single();
  if (proofError || !proof) return { error: proofError?.message ?? "Failed to save the Proof of Act." };

  const proofId = proof.id as string;

  if (evidenceItems.length > 0) {
    const { error: evidenceError } = await supabase.from("act_proof_evidence").insert(
      evidenceItems.map((item, index) => ({
        proof_id: proofId,
        photo_url: item.photoUrl,
        caption: item.caption,
        position: index,
      }))
    );
    // The proof itself is already saved at this point -- an evidence
    // insert failure is surfaced rather than silently dropped, since the
    // operator would otherwise believe photos they just uploaded made it
    // into the shared page when they didn't.
    if (evidenceError) return { error: `Proof saved, but evidence photos failed to save: ${evidenceError.message}`, proofId };
  }

  return { proofId };
}
