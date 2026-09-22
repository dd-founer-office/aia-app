"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getPartnerAuthState } from "@/lib/partner";

export interface PartnerEvidenceItem {
  storagePath: string;
  fileName: string;
  fileType: string;
  mediaKind: "photo" | "video";
}

/**
 * Partner-scoped counterpart to lib/execution-detail-actions.ts's
 * uploadEvidenceAction, writing into the exact same execution_evidence
 * table (locked rule: no second evidence table) -- the only differences
 * are who's allowed to call it and where `uploaded_by` points.
 *
 * Category is never chosen by the partner (locked rule) -- Mission
 * Camera only ever captures a photo or a video, so the mapping is the
 * smallest one the existing vocabulary supports: photo -> execution_photo,
 * video -> video. Both already exist in VALID_CATEGORIES; nothing new.
 *
 * The real authorization boundary is the partners_insert_own_execution_evidence
 * RLS policy (execution_id -> opportunity_id -> partner_id, requiring
 * partners.status = 'verified') -- this action's own getPartnerAuthState()
 * check is the friendly-error layer on top of that, never a substitute
 * for it.
 */
export async function submitPartnerEvidenceAction(
  executionId: string,
  items: PartnerEvidenceItem[]
): Promise<{ error?: string }> {
  const auth = await getPartnerAuthState();
  if (auth.status !== "partner") return { error: "You need to sign in as a partner to submit evidence." };
  if (items.length === 0) return { error: "No evidence captured." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const rows = items.map((item) => ({
    execution_id: executionId,
    file_name: item.fileName,
    file_type: item.fileType,
    category: item.mediaKind === "video" ? "video" : "execution_photo",
    storage_path: item.storagePath,
    status: "uploaded",
    uploaded_by: auth.partner.partnerUserId,
  }));

  const { error } = await supabase.from("execution_evidence").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/partner/activities/${executionId}`);
  revalidatePath("/partner");
  revalidatePath("/partner/activities");
  return {};
}
