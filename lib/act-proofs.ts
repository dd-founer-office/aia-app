import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { getOperatorAuthState } from "@/lib/operator";

/**
 * Proof of Act -- a manually-entered record an operator shares with one
 * contributor, for an act that isn't necessarily a real mission/evidence
 * record in this app (see the act_proofs table's own comment). Kept
 * entirely separate from missions/mission_publications: nothing here
 * implies the Impact Assurance verification a real published Act carries.
 */
export interface ActProofRecord {
  id: string;
  actTitle: string;
  actDateIso: string;
  cause: string;
  organization: string;
  landmark: string | null;
  description: string;
  outcomeSummary: string | null;
  heroImageUrl: string | null;
  contributorId: string;
  contributorName: string;
  createdByName: string;
  createdAtIso: string;
}

/** Operator-side recipient picker option -- real contributor identity
 *  (name + email) so an operator can visually confirm who they're about
 *  to address, never a free-text/typed-in identity. lifetimeParticipations
 *  is shown alongside each option as an extra sanity signal (a contributor
 *  with real participation history vs. a brand-new signup), not a hard
 *  filter -- see lib/act-proofs.ts's own getProofRecipientCandidates()
 *  comment for why this stays a signal rather than a gate. */
export interface ProofRecipientCandidate {
  id: string;
  name: string;
  email: string;
  lifetimeParticipations: number;
}

/**
 * Operator-only. Every real contributor account, each with its own
 * lifetime participation count surfaced right in the picker -- the
 * practical recipient safeguard this flow has, given a manually-entered
 * act has no participation_allocations row to verify a real link against
 * (unlike the real Act Detail page's getMyLinkedPublishedMissionIds()
 * gate). Deliberately NOT a hard filter on "has participated before":
 * that would block the legitimate case of recognizing someone's very
 * first act. Instead this makes the operator's own judgment call
 * informed -- they see exactly who they're sending to (name, email,
 * history) before confirming, same human-in-the-loop safeguard the
 * explicit preview/confirm step already provides.
 */
export async function getProofRecipientCandidates(): Promise<ProofRecipientCandidate[]> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return [];

  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data: contributors } = await supabase
    .from("contributors")
    .select("id, user_id, display_name")
    .order("display_name", { ascending: true });
  if (!contributors || contributors.length === 0) return [];

  const userIds = contributors.map((c) => c.user_id as string);
  const { data: users } = await supabase.from("users").select("id, email").in("id", userIds);
  const emailByUserId = new Map((users ?? []).map((u) => [u.id as string, u.email as string]));

  const contributorIds = contributors.map((c) => c.id as string);
  const { data: participations } = await supabase.from("participations").select("contributor_id").in("contributor_id", contributorIds);
  const participationCountByContributorId = new Map<string, number>();
  for (const row of participations ?? []) {
    const id = row.contributor_id as string;
    participationCountByContributorId.set(id, (participationCountByContributorId.get(id) ?? 0) + 1);
  }

  return contributors.map((c) => ({
    id: c.id as string,
    name: c.display_name as string,
    email: emailByUserId.get(c.user_id as string) ?? "",
    lifetimeParticipations: participationCountByContributorId.get(c.id as string) ?? 0,
  }));
}

/**
 * Fetches one Proof of Act for display -- no explicit access check here,
 * same convention the real Act Detail page's data layer uses: RLS
 * (select_own_act_proof / operators_full_access_act_proofs) already
 * restricts the underlying row to its intended contributor's own session
 * or an operator, so an unauthorized request simply gets no row back
 * rather than needing a second manual check. The caller (the contributor-
 * facing page) treats null as "not found," identically whether that's
 * because the id doesn't exist or because this viewer isn't allowed to
 * see it -- never distinguishing the two, so a wrong id can't be used to
 * probe for real ones.
 */
export async function getActProofForViewer(id: string): Promise<ActProofRecord | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: proof } = await supabase
    .from("act_proofs")
    .select("id, act_title, act_date, cause, organization, landmark, description, outcome_summary, hero_image_url, contributor_id, created_by, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!proof) return null;

  const { data: contributor } = await supabase
    .from("contributors")
    .select("display_name")
    .eq("id", proof.contributor_id as string)
    .maybeSingle();

  const { data: creator } = await supabase
    .from("operators")
    .select("display_name")
    .eq("id", proof.created_by as string)
    .maybeSingle();

  return {
    id: proof.id as string,
    actTitle: proof.act_title as string,
    actDateIso: proof.act_date as string,
    cause: proof.cause as string,
    organization: proof.organization as string,
    landmark: proof.landmark as string | null,
    description: proof.description as string,
    outcomeSummary: proof.outcome_summary as string | null,
    heroImageUrl: proof.hero_image_url as string | null,
    contributorId: proof.contributor_id as string,
    contributorName: (contributor?.display_name as string | undefined) ?? "you",
    createdByName: (creator?.display_name as string | undefined) ?? "AiA Operations",
    createdAtIso: proof.created_at as string,
  };
}
