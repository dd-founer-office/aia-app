import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { PartnerVerificationStatus } from "@/lib/partners";

export interface CurrentPartnerUser {
  partnerUserId: string;
  partnerId: string;
  partnerName: string;
  partnerStatus: PartnerVerificationStatus;
  userId: string;
  email: string;
}

export type PartnerAuthState =
  | { status: "signed-out" }
  | { status: "not-authorized" }
  | { status: "partner"; partner: CurrentPartnerUser };

/**
 * Mirrors lib/operator.ts's getOperatorAuthState() exactly: a person's
 * identity here is its own record (partner_users), never a flag on
 * another table -- a genuine authorization boundary, not just UX. Also
 * folds partners.status !== 'verified' into "not-authorized" so a
 * suspended/pending/rejected partner's own UI never implies they have
 * access -- the real enforcement is the RLS policies' own `status =
 * 'verified'` check (see the partner-scoped migrations), this is the
 * matching client-facing state so the two can never visibly disagree.
 */
export async function getPartnerAuthState(): Promise<PartnerAuthState> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { status: "signed-out" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed-out" };

  const { data: membership } = await supabase
    .from("partner_users")
    .select("id, partner_id, partners(name, status)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) return { status: "not-authorized" };

  const partnerRow = membership.partners as unknown as { name: string; status: PartnerVerificationStatus } | null;
  if (!partnerRow || partnerRow.status !== "verified") return { status: "not-authorized" };

  return {
    status: "partner",
    partner: {
      partnerUserId: membership.id as string,
      partnerId: membership.partner_id as string,
      partnerName: partnerRow.name,
      partnerStatus: partnerRow.status,
      userId: user.id,
      email: user.email ?? "",
    },
  };
}
