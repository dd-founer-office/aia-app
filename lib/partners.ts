import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import { capacityStatusFor, type CapacityStatus } from "@/lib/allocation";

export type PartnerType =
  | "School"
  | "Hospital"
  | "NGO"
  | "Temple"
  | "Community organization"
  | "Environmental group"
  | "Field volunteer network"
  | "Other";
export type PartnerVerificationStatus = "pending" | "verified" | "rejected" | "suspended";

const STATUS_ORDER: Record<PartnerVerificationStatus, number> = { pending: 0, suspended: 1, verified: 2, rejected: 3 };
export const PARTNER_TYPES: PartnerType[] = [
  "School",
  "Hospital",
  "NGO",
  "Temple",
  "Community organization",
  "Environmental group",
  "Field volunteer network",
  "Other",
];

export interface PartnerRow {
  id: string;
  name: string;
  partnerType: PartnerType | null;
  district: string | null;
  status: PartnerVerificationStatus;
  monthlyCapacity: number | null;
  allocatedCapacity: number;
  remainingCapacity: number | null;
  capacityStatus: CapacityStatus;
  onTimeCompletionRate: number | null;
  documentationQualityRate: number | null;
  executionSuccessRate: number | null;
  reliabilityScore: number | null;
  activeOpportunitiesCount: number;
  pastExecutionsCount: number;
  lastExecutionDateIso: string | null;
  verifiedAtIso: string | null;
  verifiedByName: string | null;
  verificationNotes: string | null;
  informationRequested: string | null;
  rejectionReason: string | null;
}

export interface PartnersData {
  totalPartners: number;
  verifiedPartners: number;
  activePartners: number;
  pendingVerification: number;
  healthOverview: { total: number; verified: number; active: number; pending: number; suspended: number };
  capacityOverview: { availableCapacity: number; allocatedCapacity: number; remainingCapacity: number; utilizationPct: number | null };
  reliabilityOverview: {
    avgOnTimeCompletionRate: number | null;
    avgDocumentationQualityRate: number | null;
    avgExecutionSuccessRate: number | null;
    avgReliabilityScore: number | null;
  };
  partners: PartnerRow[];
  verificationQueue: PartnerRow[];
  districts: string[];
  riskPanel: {
    overCapacityPartners: PartnerRow[];
    limitedCapacityPartners: PartnerRow[];
    inactivePartners: PartnerRow[];
  };
  insights: {
    mostReliablePartnerTypes: { type: PartnerType; avgReliabilityScore: number; partnerCount: number }[];
    districtCoverage: { district: string; verifiedPartnerCount: number }[];
    totalKnownCapacity: number;
    executionsThisMonth: number;
    documentationApprovalRateOverall: number | null;
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** OP-009 Partner Management's full data set. Server-side only, real
 *  queries throughout. Two documented simplifications: (1) "Documents
 *  submitted" from the locked Verification Queue has no backing file
 *  system -- there's no partner-document-upload pipeline anywhere in the
 *  app (building one would mean a third storage bucket + evidence-style
 *  table for what is, for this app's real scale, a handful of manual
 *  verifications) -- `verificationNotes` is a free-text stand-in an
 *  operator fills in describing what was reviewed, same pattern OP-003
 *  already uses for its own documentation_notes; (2) Row 8's "capacity
 *  trends"/"execution trends"/"documentation trends" have no time-series
 *  data to draw from (no historical snapshot table exists) -- these
 *  render as honest current-state numbers, not fabricated trend lines,
 *  and "upcoming capacity risks" (Row 7) is intentionally folded into
 *  limited-capacity rather than invented as a separate forecast. */
export async function getPartnersData(): Promise<PartnersData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const month = currentMonthKey();
  const monthStart = `${month}-01`;

  const [{ data: partners }, { data: opportunities }, { data: executions }, { data: allocations }] = await Promise.all([
    supabase.from("partners").select("*"),
    supabase.from("opportunities").select("id, partner_id, status"),
    supabase.from("executions").select("opportunity_id, status, scheduled_date, completed_at, documentation_status"),
    supabase.from("allocations").select("opportunity_id, participations_allocated").eq("allocation_month", monthStart),
  ]);

  const partnerRows = partners ?? [];
  const opps = opportunities ?? [];
  const execs = executions ?? [];
  const allocs = allocations ?? [];

  const opportunityPartnerId = new Map(opps.map((o) => [o.id as string, o.partner_id as string | null]));
  const verifierIds = Array.from(new Set(partnerRows.map((p) => p.verified_by as string | null).filter((v): v is string => !!v)));
  const { data: operators } = verifierIds.length > 0 ? await supabase.from("operators").select("id, display_name").in("id", verifierIds) : { data: [] };
  const operatorNameById = new Map((operators ?? []).map((o) => [o.id as string, o.display_name as string]));

  const allocatedByPartner = new Map<string, number>();
  for (const a of allocs) {
    const partnerId = opportunityPartnerId.get(a.opportunity_id as string);
    if (!partnerId) continue;
    allocatedByPartner.set(partnerId, (allocatedByPartner.get(partnerId) ?? 0) + (a.participations_allocated as number));
  }

  const execsByPartner = new Map<string, typeof execs>();
  for (const e of execs) {
    const partnerId = opportunityPartnerId.get(e.opportunity_id as string);
    if (!partnerId) continue;
    const list = execsByPartner.get(partnerId);
    if (list) list.push(e);
    else execsByPartner.set(partnerId, [e]);
  }

  const oppsByPartner = new Map<string, typeof opps>();
  for (const o of opps) {
    if (!o.partner_id) continue;
    const list = oppsByPartner.get(o.partner_id as string);
    if (list) list.push(o);
    else oppsByPartner.set(o.partner_id as string, [o]);
  }

  const partnerRowsComputed: PartnerRow[] = partnerRows.map((p) => {
    const partnerExecs = execsByPartner.get(p.id as string) ?? [];
    const partnerOpps = oppsByPartner.get(p.id as string) ?? [];
    const completed = partnerExecs.filter((e) => e.status === "completed");
    const finished = partnerExecs.filter((e) => ["completed", "cancelled", "blocked"].includes(e.status as string));
    const decided = partnerExecs.filter((e) => ["approved", "rejected", "returned_for_changes"].includes(e.documentation_status as string));

    const onTimeCompletionRate =
      completed.length > 0
        ? completed.filter((e) => e.scheduled_date && e.completed_at && (e.completed_at as string).slice(0, 10) <= (e.scheduled_date as string)).length /
          completed.length
        : null;
    const documentationQualityRate = decided.length > 0 ? decided.filter((e) => e.documentation_status === "approved").length / decided.length : null;
    const executionSuccessRate = finished.length > 0 ? completed.length / finished.length : null;
    const rates = [onTimeCompletionRate, documentationQualityRate, executionSuccessRate].filter((r): r is number => r !== null);
    const reliabilityScore = rates.length > 0 ? average(rates) : null;

    const monthlyCapacity = p.monthly_capacity as number | null;
    const allocatedCapacity = allocatedByPartner.get(p.id as string) ?? 0;

    const completedDates = completed.map((e) => e.completed_at as string).filter(Boolean);
    const lastExecutionDateIso = completedDates.length > 0 ? completedDates.sort().reverse()[0] : null;

    return {
      id: p.id as string,
      name: p.name as string,
      partnerType: p.partner_type as PartnerType | null,
      district: p.district as string | null,
      status: p.status as PartnerVerificationStatus,
      monthlyCapacity,
      allocatedCapacity,
      remainingCapacity: monthlyCapacity === null ? null : monthlyCapacity - allocatedCapacity,
      capacityStatus: capacityStatusFor(monthlyCapacity, allocatedCapacity),
      onTimeCompletionRate,
      documentationQualityRate,
      executionSuccessRate,
      reliabilityScore,
      activeOpportunitiesCount: partnerOpps.filter((o) => ["approved", "allocated", "executing"].includes(o.status as string)).length,
      pastExecutionsCount: completed.length,
      lastExecutionDateIso,
      verifiedAtIso: p.verified_at as string | null,
      verifiedByName: p.verified_by ? (operatorNameById.get(p.verified_by as string) ?? null) : null,
      verificationNotes: p.verification_notes as string | null,
      informationRequested: p.information_requested as string | null,
      rejectionReason: p.rejection_reason as string | null,
    };
  });

  partnerRowsComputed.sort((a, b) => {
    const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.reliabilityScore !== null && b.reliabilityScore !== null) return b.reliabilityScore - a.reliabilityScore;
    if (a.reliabilityScore !== null) return -1;
    if (b.reliabilityScore !== null) return 1;
    return 0;
  });

  const healthOverview = {
    total: partnerRowsComputed.length,
    verified: partnerRowsComputed.filter((p) => p.status === "verified").length,
    active: partnerRowsComputed.filter((p) => p.activeOpportunitiesCount > 0).length,
    pending: partnerRowsComputed.filter((p) => p.status === "pending").length,
    suspended: partnerRowsComputed.filter((p) => p.status === "suspended").length,
  };

  const knownCapacityPartners = partnerRowsComputed.filter((p) => p.monthlyCapacity !== null);
  const availableCapacity = knownCapacityPartners.reduce((sum, p) => sum + (p.monthlyCapacity ?? 0), 0);
  const allocatedCapacityTotal = knownCapacityPartners.reduce((sum, p) => sum + p.allocatedCapacity, 0);
  const capacityOverview = {
    availableCapacity,
    allocatedCapacity: allocatedCapacityTotal,
    remainingCapacity: availableCapacity - allocatedCapacityTotal,
    utilizationPct: availableCapacity > 0 ? allocatedCapacityTotal / availableCapacity : null,
  };

  const reliabilityOverview = {
    avgOnTimeCompletionRate: average(partnerRowsComputed.map((p) => p.onTimeCompletionRate).filter((v): v is number => v !== null)),
    avgDocumentationQualityRate: average(partnerRowsComputed.map((p) => p.documentationQualityRate).filter((v): v is number => v !== null)),
    avgExecutionSuccessRate: average(partnerRowsComputed.map((p) => p.executionSuccessRate).filter((v): v is number => v !== null)),
    avgReliabilityScore: average(partnerRowsComputed.map((p) => p.reliabilityScore).filter((v): v is number => v !== null)),
  };

  const districts = Array.from(new Set(partnerRowsComputed.map((p) => p.district).filter((d): d is string => !!d)));

  const riskPanel = {
    overCapacityPartners: partnerRowsComputed.filter((p) => p.capacityStatus === "at_risk"),
    limitedCapacityPartners: partnerRowsComputed.filter((p) => p.capacityStatus === "limited"),
    inactivePartners: partnerRowsComputed.filter((p) => p.status === "verified" && p.activeOpportunitiesCount === 0 && p.pastExecutionsCount === 0),
  };

  const typeGroups = new Map<PartnerType, number[]>();
  for (const p of partnerRowsComputed) {
    if (!p.partnerType || p.reliabilityScore === null) continue;
    const list = typeGroups.get(p.partnerType);
    if (list) list.push(p.reliabilityScore);
    else typeGroups.set(p.partnerType, [p.reliabilityScore]);
  }
  const mostReliablePartnerTypes = Array.from(typeGroups.entries())
    .map(([type, scores]) => ({ type, avgReliabilityScore: average(scores) as number, partnerCount: scores.length }))
    .sort((a, b) => b.avgReliabilityScore - a.avgReliabilityScore);

  const districtCoverage = districts
    .map((district) => ({
      district,
      verifiedPartnerCount: partnerRowsComputed.filter((p) => p.district === district && p.status === "verified").length,
    }))
    .sort((a, b) => b.verifiedPartnerCount - a.verifiedPartnerCount);

  const allDecided = execs.filter((e) => ["approved", "rejected", "returned_for_changes"].includes(e.documentation_status as string));

  return {
    totalPartners: healthOverview.total,
    verifiedPartners: healthOverview.verified,
    activePartners: healthOverview.active,
    pendingVerification: healthOverview.pending,
    healthOverview,
    capacityOverview,
    reliabilityOverview,
    partners: partnerRowsComputed,
    verificationQueue: partnerRowsComputed.filter((p) => p.status === "pending"),
    districts,
    riskPanel,
    insights: {
      mostReliablePartnerTypes,
      districtCoverage,
      totalKnownCapacity: availableCapacity,
      executionsThisMonth: execs.filter((e) => (e.completed_at as string | null)?.startsWith(month)).length,
      documentationApprovalRateOverall: allDecided.length > 0 ? allDecided.filter((e) => e.documentation_status === "approved").length / allDecided.length : null,
    },
  };
}
