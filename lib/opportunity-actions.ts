"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";

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
