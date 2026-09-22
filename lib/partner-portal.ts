import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PartnerActivityBucket = "today" | "upcoming" | "completed";
export type PartnerActivityBadge = "today" | "assigned" | "submitted" | "completed";

export interface PartnerActivityCard {
  executionId: string;
  title: string;
  cause: string;
  district: string | null;
  scheduledDateIso: string | null;
  bucket: PartnerActivityBucket;
  badge: PartnerActivityBadge;
}

export interface PartnerActivityDetail extends PartnerActivityCard {
  needSummary: string | null;
  beneficiaryEstimate: number | null;
}

export interface PartnerHomeData {
  partnerName: string;
  today: PartnerActivityCard | null;
  upcoming: PartnerActivityCard[];
  completed: PartnerActivityCard[];
}

export interface PartnerProfileData {
  partnerName: string;
  partnerStatus: string;
  district: string | null;
  partnerType: string | null;
  contactEmail: string;
}

interface RawExecutionRow {
  id: string;
  status: string;
  scheduled_date: string | null;
  need_summary?: never;
  opportunity_id: string;
  opportunities: {
    title: string;
    cause: string;
    district: string | null;
    need_summary: string | null;
    beneficiary_estimate: number | null;
  } | null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** No new status architecture (locked rule) -- derived entirely from the
 *  executions row this app already maintains. "Today" is a scheduling
 *  fact (scheduled_date), "Completed" is the same executions.status the
 *  Ops Execution Management screen already uses; everything else is
 *  "upcoming." */
function bucketFor(status: string, scheduledDateIso: string | null): PartnerActivityBucket {
  if (status === "completed") return "completed";
  if (scheduledDateIso && scheduledDateIso === todayIso()) return "today";
  return "upcoming";
}

/** "Submitted" vs "Assigned" is real too -- whether any non-deleted
 *  execution_evidence row exists for this execution, the same signal
 *  Documentation Center's own queue is built from. */
function badgeFor(bucket: PartnerActivityBucket, hasEvidence: boolean): PartnerActivityBadge {
  if (bucket === "completed") return "completed";
  if (bucket === "today") return "today";
  return hasEvidence ? "submitted" : "assigned";
}

async function getEvidenceExecutionIds(supabase: SupabaseClient, executionIds: string[]): Promise<Set<string>> {
  if (executionIds.length === 0) return new Set();
  const { data } = await supabase
    .from("execution_evidence")
    .select("execution_id")
    .in("execution_id", executionIds)
    .neq("status", "deleted");
  return new Set((data ?? []).map((r) => r.execution_id as string));
}

/** The partner-scoped RLS policies (partners_read_own_executions /
 *  partners_read_own_opportunities) already restrict this to the
 *  signed-in partner's own rows -- same discipline as every operator
 *  query in this app never re-filtering by operator_id in application
 *  code. This is the single source both getPartnerHomeData() and
 *  getPartnerActivities() bucket from, so the two screens can never
 *  silently disagree about what's assigned. */
async function getPartnerActivityCards(): Promise<PartnerActivityCard[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("executions")
    .select("id, status, scheduled_date, opportunity_id, opportunities(title, cause, district, need_summary, beneficiary_estimate)")
    .order("scheduled_date", { ascending: true, nullsFirst: false });

  const rows = (data ?? []) as unknown as RawExecutionRow[];
  const withOpportunity = rows.filter((r) => r.opportunities);

  const evidenceIds = await getEvidenceExecutionIds(
    supabase,
    withOpportunity.map((r) => r.id)
  );

  return withOpportunity.map((r) => {
    const bucket = bucketFor(r.status, r.scheduled_date);
    return {
      executionId: r.id,
      title: r.opportunities!.title,
      cause: r.opportunities!.cause,
      district: r.opportunities!.district,
      scheduledDateIso: r.scheduled_date,
      bucket,
      badge: badgeFor(bucket, evidenceIds.has(r.id)),
    };
  });
}

export async function getPartnerHomeData(partnerName: string): Promise<PartnerHomeData> {
  const cards = await getPartnerActivityCards();
  return {
    partnerName,
    today: cards.find((c) => c.bucket === "today") ?? null,
    upcoming: cards.filter((c) => c.bucket === "upcoming"),
    completed: cards.filter((c) => c.bucket === "completed"),
  };
}

export async function getPartnerActivities(): Promise<PartnerActivityCard[]> {
  return getPartnerActivityCards();
}

export async function getPartnerActivityDetail(executionId: string): Promise<PartnerActivityDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("executions")
    .select("id, status, scheduled_date, opportunity_id, opportunities(title, cause, district, need_summary, beneficiary_estimate)")
    .eq("id", executionId)
    .maybeSingle();
  if (!data) return null;

  const row = data as unknown as RawExecutionRow;
  if (!row.opportunities) return null;

  const evidenceIds = await getEvidenceExecutionIds(supabase, [row.id]);
  const bucket = bucketFor(row.status, row.scheduled_date);

  return {
    executionId: row.id,
    title: row.opportunities.title,
    cause: row.opportunities.cause,
    district: row.opportunities.district,
    scheduledDateIso: row.scheduled_date,
    needSummary: row.opportunities.need_summary,
    beneficiaryEstimate: row.opportunities.beneficiary_estimate,
    bucket,
    badge: badgeFor(bucket, evidenceIds.has(row.id)),
  };
}

export async function getPartnerProfile(): Promise<PartnerProfileData | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("partner_users")
    .select("partners(name, status, district, partner_type)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) return null;

  const partner = data.partners as unknown as { name: string; status: string; district: string | null; partner_type: string | null } | null;
  if (!partner) return null;

  return {
    partnerName: partner.name,
    partnerStatus: partner.status,
    district: partner.district,
    partnerType: partner.partner_type,
    contactEmail: user.email ?? "",
  };
}
