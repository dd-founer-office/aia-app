import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { OpportunityStatus } from "@/lib/ops-dashboard";

export type OpportunityPriority = "critical" | "high" | "normal" | "low";
export type OpportunitySource =
  | "contributor_suggestion"
  | "partner_submission"
  | "field_verification"
  | "community_referral"
  | "operator_created";
export type ReadinessStatus = "ready" | "needs_review" | "blocked";

const PRIORITY_ORDER: Record<OpportunityPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export interface OpportunityRow {
  id: string;
  title: string;
  cause: string;
  district: string | null;
  needSummary: string | null;
  beneficiaryEstimate: number | null;
  partnerId: string | null;
  partnerName: string | null;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  source: OpportunitySource;
  createdAtIso: string;
  targetExecutionDate: string | null;
  // OP-002's Allocation Readiness Panel wants a readiness score derived
  // from OP-003's full Impact Assurance checklist (verified/documented/
  // partner-validated/etc.), which doesn't exist yet -- this is the
  // honest simplification available from what's actually tracked today:
  // approved opportunities are Ready, submitted/assuring ones Need
  // Review, rejected/closed ones are Blocked. Replace once OP-003 ships
  // the real checklist.
  readiness: ReadinessStatus;
}

export interface OpportunitiesOverview {
  healthSummary: Record<OpportunityStatus, number>;
  actionRequired: {
    needsVerification: number;
    awaitingDocuments: number;
    readyForApproval: number;
    readyForAllocation: number;
    overdue: number;
  };
  monthlyCompliance: {
    currentMonthOpportunities: number;
    executedThisMonth: number;
    pendingThisMonth: number;
    overdue: number;
  };
  opportunities: OpportunityRow[];
  partners: { id: string; name: string }[];
  districts: string[];
}

function readinessFor(status: OpportunityStatus): ReadinessStatus {
  if (status === "approved" || status === "allocated" || status === "executing" || status === "published") {
    return "ready";
  }
  if (status === "rejected" || status === "closed") return "blocked";
  return "needs_review";
}

/** OP-002 Opportunity Management's full data set. Server-side only, and
 *  every count is a real query -- see OpportunityRow.readiness's own
 *  comment for the one deliberate simplification (no OP-003 checklist
 *  exists yet to compute a real readiness score from). */
export async function getOpportunitiesOverview(): Promise<OpportunitiesOverview> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const [{ data: opportunities }, { data: partners }] = await Promise.all([
    supabase.from("opportunities").select("*"),
    supabase.from("partners").select("id, name").order("name"),
  ]);

  const opps = opportunities ?? [];
  const partnerById = new Map((partners ?? []).map((p) => [p.id as string, p.name as string]));
  const month = currentMonthKey();
  const today = new Date();

  const healthSummary: Record<OpportunityStatus, number> = {
    submitted: 0,
    assuring: 0,
    approved: 0,
    allocated: 0,
    executing: 0,
    published: 0,
    rejected: 0,
    closed: 0,
  };
  for (const opp of opps) {
    const status = opp.status as OpportunityStatus;
    healthSummary[status] = (healthSummary[status] ?? 0) + 1;
  }

  const isOverdue = (opp: (typeof opps)[number]) =>
    Boolean(opp.target_execution_date) &&
    new Date(opp.target_execution_date as string) < today &&
    !["published", "rejected", "closed"].includes(opp.status as string);

  const actionRequired = {
    needsVerification: opps.filter((o) => o.status === "submitted" || o.status === "assuring").length,
    // No per-opportunity document tracking exists yet (OP-003's own
    // Documentation section, not built this round) -- honestly 0 rather
    // than a fabricated count.
    awaitingDocuments: 0,
    readyForApproval: opps.filter((o) => o.status === "assuring").length,
    readyForAllocation: opps.filter((o) => o.status === "approved").length,
    overdue: opps.filter(isOverdue).length,
  };

  const monthlyCompliance = {
    currentMonthOpportunities: opps.filter((o) => (o.created_at as string).startsWith(month)).length,
    executedThisMonth: opps.filter(
      (o) => (o.status === "executing" || o.status === "published") && (o.created_at as string).startsWith(month)
    ).length,
    pendingThisMonth: opps.filter(
      (o) =>
        (o.created_at as string).startsWith(month) &&
        !["executing", "published", "rejected", "closed"].includes(o.status as string)
    ).length,
    overdue: opps.filter(isOverdue).length,
  };

  const opportunityRows: OpportunityRow[] = opps
    .map((o) => ({
      id: o.id as string,
      title: o.title as string,
      cause: o.cause as string,
      district: o.district as string | null,
      needSummary: o.need_summary as string | null,
      beneficiaryEstimate: o.beneficiary_estimate as number | null,
      partnerId: o.partner_id as string | null,
      partnerName: o.partner_id ? (partnerById.get(o.partner_id as string) ?? null) : null,
      status: o.status as OpportunityStatus,
      priority: o.priority as OpportunityPriority,
      source: o.source as OpportunitySource,
      createdAtIso: o.created_at as string,
      targetExecutionDate: o.target_execution_date as string | null,
      readiness: readinessFor(o.status as OpportunityStatus),
    }))
    .sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime();
    });

  const districts = Array.from(new Set(opportunityRows.map((o) => o.district).filter((d): d is string => !!d)));

  return {
    healthSummary,
    actionRequired,
    monthlyCompliance,
    opportunities: opportunityRows,
    partners: (partners ?? []).map((p) => ({ id: p.id as string, name: p.name as string })),
    districts,
  };
}
