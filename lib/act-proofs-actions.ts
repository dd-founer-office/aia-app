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
 * Sends a manually-entered Proof of Act to one contributor. Two inserts,
 * sequential -- same style lib/publishing-actions.ts's own publishAction
 * already uses for its multi-step writes, no transaction wrapper:
 *   1. act_proofs -- the proof itself, immutable once created (no update/
 *      edit path exists; a mistake means creating a corrected one).
 *   2. notifications (type: proof_of_act) -- the one real delivery
 *      mechanism this app has (in-app only, see that table's own
 *      comment). No email/SMS/push is sent or implied here or anywhere
 *      else in this codebase.
 * Both only ever happen together, on explicit confirm -- nothing is
 * persisted while the operator is still filling out or previewing the
 * form.
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
  const contributorId = (formData.get("contributor_id") as string | null) ?? "";

  if (!actTitle) return { error: "Act title is required." };
  if (!actDate || Number.isNaN(Date.parse(actDate))) return { error: "A valid act date is required." };
  if (!cause) return { error: "Cause is required." };
  if (!organization) return { error: "Organization is required." };
  if (!description) return { error: "Description is required." };
  if (!contributorId) return { error: "Select a recipient." };
  if (heroImageUrlRaw && !isValidHttpUrl(heroImageUrlRaw)) {
    return { error: "Photo URL must be a valid http(s) link, or left blank." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  // Real recipient identity, not a trusted client value -- re-resolved
  // here from contributors rather than taking the form's own display
  // name/email along for the ride, so the stored row can't drift from
  // whichever contributor_id actually gets used.
  const { data: contributor } = await supabase.from("contributors").select("id").eq("id", contributorId).maybeSingle();
  if (!contributor) return { error: "That contributor could not be found." };

  const { data: proof, error: proofError } = await supabase
    .from("act_proofs")
    .insert({
      created_by: auth.operator.operatorId,
      contributor_id: contributorId,
      act_title: actTitle,
      act_date: actDate,
      cause,
      organization,
      landmark,
      description,
      outcome_summary: outcomeSummary,
      hero_image_url: heroImageUrlRaw,
    })
    .select("id")
    .single();
  if (proofError || !proof) return { error: proofError?.message ?? "Failed to save the Proof of Act." };

  const proofId = proof.id as string;

  const { error: notificationError } = await supabase.from("notifications").insert({
    contributor_id: contributorId,
    type: "proof_of_act",
    title: "A Proof of Act has been shared with you",
    body: actTitle,
    link: `/proof/${proofId}`,
  });
  // The proof itself is already saved and real at this point -- a
  // notification failure is surfaced, not silently swallowed, since
  // without it the contributor has no way to discover the proof exists
  // (same "best-effort, but this one matters" judgment call
  // publishAction's own act_published fan-out makes, just the other way:
  // that one has many recipients and partial delivery is still useful,
  // this one has exactly one recipient and partial delivery is not).
  if (notificationError) return { error: `Proof saved, but the notification failed to send: ${notificationError.message}` };

  return { proofId };
}
