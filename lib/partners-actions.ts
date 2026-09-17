"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";
import { getPartnersData, PARTNER_TYPES, type PartnerType } from "@/lib/partners";

function revalidatePartners() {
  revalidatePath("/ops/partners");
  revalidatePath("/ops/opportunities");
  revalidatePath("/ops/allocations");
  revalidatePath("/ops/executions");
  revalidatePath("/ops");
}

/** OP-009 header's "Add partner" action -- the real UI this gap has been
 *  missing since Sprint 4 (every partner before this shipped via direct
 *  SQL). Starts a partner at 'pending', matching the locked rule that
 *  verification is mandatory before a partner may execute anything. */
export async function createPartnerAction(formData: FormData): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const name = (formData.get("name") as string | null)?.trim();
  const partnerType = formData.get("partner_type") as string | null;
  const district = (formData.get("district") as string | null)?.trim() || null;

  if (!name) return { error: "Partner name is required." };
  if (partnerType && !PARTNER_TYPES.includes(partnerType as PartnerType)) return { error: "Choose a valid partner type." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("partners").insert({
    name,
    partner_type: partnerType || null,
    district,
  });
  if (error) return { error: error.code === "23505" ? "A partner with this name already exists." : error.message };

  revalidatePartners();
  return {};
}

/** OP-009 Row 5's Approve action. Locked rule: only verified partners may
 *  execute opportunities. */
export async function verifyPartnerAction(partnerId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("partners")
    .update({ status: "verified", verified_at: new Date().toISOString(), verified_by: auth.operator.operatorId })
    .eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** OP-009 Row 5's Reject action. Locked rule (mirrored from every other
 *  reject/return action in this app): a reason is required. */
export async function rejectPartnerAction(partnerId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A rejection reason is required." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase
    .from("partners")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejection_reason: reason.trim(),
      verified_by: auth.operator.operatorId,
    })
    .eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** OP-009 Row 5's Request information action -- same pattern as OP-003's
 *  requestInformationAction. No status change, just a visible note. */
export async function requestPartnerInfoAction(partnerId: string, notes: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!notes.trim()) return { error: "Describe what information is needed." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("partners").update({ information_requested: notes.trim() }).eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** Suspends a verified partner -- the locked Verification Status list
 *  includes 'suspended', but nothing in the app could ever set it before
 *  this. Only from 'verified': a pending or rejected partner isn't
 *  active enough to need suspending. */
export async function suspendPartnerAction(partnerId: string, reason: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (!reason.trim()) return { error: "A reason is required to suspend a partner." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: partner } = await supabase.from("partners").select("status").eq("id", partnerId).maybeSingle();
  if (!partner) return { error: "Partner not found." };
  if (partner.status !== "verified") return { error: "Only a verified partner can be suspended." };

  const { error } = await supabase
    .from("partners")
    .update({ status: "suspended", rejection_reason: reason.trim() })
    .eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** Reinstates a suspended partner back to verified. */
export async function reinstatePartnerAction(partnerId: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: partner } = await supabase.from("partners").select("status").eq("id", partnerId).maybeSingle();
  if (!partner) return { error: "Partner not found." };
  if (partner.status !== "suspended") return { error: "Only a suspended partner can be reinstated." };

  const { error } = await supabase.from("partners").update({ status: "verified", rejection_reason: null }).eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** OP-009 Row 2's capacity tracking -- the field OP-004/005 already read
 *  (monthly_capacity) but that nothing in the app could ever set before
 *  this screen. */
export async function updateCapacityAction(partnerId: string, monthlyCapacity: number | null): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };
  if (monthlyCapacity !== null && (!Number.isInteger(monthlyCapacity) || monthlyCapacity < 0)) {
    return { error: "Capacity must be a whole, non-negative number." };
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("partners").update({ monthly_capacity: monthlyCapacity }).eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** OP-009 Row 5's own review notes -- what was actually checked during
 *  verification, since there's no document-upload pipeline (see
 *  lib/partners.ts's header comment). */
export async function updateVerificationNotesAction(partnerId: string, notes: string): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const supabase = await getSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { error } = await supabase.from("partners").update({ verification_notes: notes.trim() || null }).eq("id", partnerId);
  if (error) return { error: error.message };

  revalidatePartners();
  return {};
}

/** OP-009 header's "Export" action, same pattern as every other Ops
 *  screen's CSV export. */
export async function exportPartnersAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getPartnersData();
  const header = ["Partner ID", "Name", "Type", "District", "Status", "Capacity", "Reliability score", "Active opportunities", "Last execution"];
  const rows = data.partners.map((p) => [
    p.id,
    p.name,
    p.partnerType ?? "",
    p.district ?? "",
    p.status,
    p.monthlyCapacity?.toString() ?? "",
    p.reliabilityScore !== null ? Math.round(p.reliabilityScore * 100).toString() : "",
    p.activeOpportunitiesCount.toString(),
    p.lastExecutionDateIso ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

  return { csv };
}
