import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { OpportunityStatus } from "@/lib/ops-dashboard";
import type { OpportunityPriority, ReadinessStatus } from "@/lib/opportunities";
import { computeReadiness, type ImpactAssuranceChecklist, type RiskLevel } from "@/lib/opportunity-detail";
import { CAUSES, type CauseId } from "@/types/participation";

export type ConfidenceLevel = "high" | "medium" | "low";
export type CapacityStatus = "healthy" | "limited" | "at_risk" | "unknown";

// opportunities.cause/partners rows use the display label ("Education"),
// participation_causes joins causes.slug ("education"). Both name the same
// four fixed causes -- this is the one place OP-004 needs to cross them.
const CAUSE_LABEL_BY_SLUG: Record<CauseId, string> = {
  education: "Education",
  medical: "Medical",
  annadhanam: "Annadhanam",
  environment: "Environment",
};

const PRIORITY_ORDER: Record<OpportunityPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export interface ParticipationByCause {
  cause: string;
  total: number;
  allocatedThisMonth: number;
  available: number;
}

export interface AllocationReadyOpportunity {
  id: string;
  title: string;
  cause: string;
  district: string | null;
  partnerId: string | null;
  partnerName: string | null;
  beneficiaryEstimate: number | null;
  priority: OpportunityPriority;
  riskLevel: RiskLevel;
  readiness: ReadinessStatus;
  targetExecutionDate: string | null;
}

export interface AllocationRecommendation {
  opportunityId: string;
  opportunityTitle: string;
  cause: string;
  recommendedAllocation: number | null;
  executionCapacitySignal: CapacityStatus;
  priority: OpportunityPriority;
  confidence: ConfidenceLevel;
}

export interface PartnerCapacityRow {
  partnerId: string;
  partnerName: string;
  partnerStatus: "pending" | "verified" | "rejected" | "suspended";
  capacity: number | null;
  allocatedThisMonth: number;
  remaining: number | null;
  status: CapacityStatus;
}

export interface DistrictCapacityRow {
  district: string;
  opportunityCount: number;
  knownCapacity: number | null;
  partnersWithUnknownCapacity: number;
  allocatedThisMonth: number;
  status: CapacityStatus;
}

export interface AllocationRisk {
  overCapacityPartners: { partnerName: string; overBy: number }[];
  executionBottlenecks: { opportunityId: string; title: string; targetExecutionDate: string }[];
  documentationGaps: number;
  districtSaturation: { district: string; opportunityCount: number }[];
  partnerAvailabilityIssues: { partnerName: string; status: string }[];
  overallRiskLevel: RiskLevel;
}

export interface AllocationTimelineEntry {
  opportunityTitle: string;
  participationsAllocated: number;
  createdAtIso: string;
}

export interface AllocationEngineData {
  currentMonthLabel: string;
  totalParticipationsThisMonth: number;
  approvedOpportunitiesCount: number;
  allocationReadinessSummary: Record<ReadinessStatus, number>;
  monthlyParticipation: { total: number; byCause: ParticipationByCause[] };
  allocationReadyOpportunities: AllocationReadyOpportunity[];
  recommendations: AllocationRecommendation[];
  partnerCapacities: PartnerCapacityRow[];
  districtCapacities: DistrictCapacityRow[];
  monthlyCapacityForecast: {
    knownCapacity: number;
    unknownPartnerCount: number;
    allocatedThisMonth: number;
    remaining: number | null;
  };
  risk: AllocationRisk;
  timeline: AllocationTimelineEntry[];
  compliance: {
    allocatedThisMonth: number;
    executingThisMonth: number;
    completedThisMonth: number;
    pendingThisMonth: number;
    overdue: number;
  };
}

function capacityStatusFor(capacity: number | null, allocated: number): CapacityStatus {
  if (capacity === null || capacity <= 0) return "unknown";
  const remaining = capacity - allocated;
  if (remaining <= 0) return "at_risk";
  if (remaining / capacity < 0.5) return "limited";
  return "healthy";
}

/**
 * Row 3's engine. Pure and exported so lib/allocation-actions.ts's "Run
 * allocation" can recompute the exact same recommendation server-side
 * instead of trusting a number the client saw on an earlier render --
 * same discipline as canApproveOpportunity/computeReadiness in
 * lib/opportunity-detail.ts.
 *
 * Consumes availableByCause as a running pool: opportunities are already
 * sorted by the locked priority order (critical > high > earliest target
 * execution date), so an earlier opportunity's recommendation reduces
 * what's left for a later one in the same cause. Readiness score isn't a
 * real tiebreaker here -- there's no numeric score beyond the Ready/
 * Needs review/Blocked status (see ReadinessStatus), and every
 * opportunity passed in is already Ready, so that tier of the locked
 * priority order is a no-op today.
 */
export function computeRecommendations(
  sortedReadyOpportunities: AllocationReadyOpportunity[],
  availableByCause: Record<string, number>,
  capacityStatusByPartnerId: Map<string, CapacityStatus>
): AllocationRecommendation[] {
  const pool = { ...availableByCause };
  return sortedReadyOpportunities.map((opp) => {
    const available = pool[opp.cause] ?? 0;
    let recommendedAllocation: number | null = null;
    if (opp.beneficiaryEstimate !== null) {
      recommendedAllocation = Math.max(0, Math.min(opp.beneficiaryEstimate, available));
      pool[opp.cause] = available - recommendedAllocation;
    }

    const executionCapacitySignal = opp.partnerId ? (capacityStatusByPartnerId.get(opp.partnerId) ?? "unknown") : "unknown";

    let confidence: ConfidenceLevel;
    if (recommendedAllocation === null) {
      confidence = "low";
    } else if (opp.riskLevel === "high" || executionCapacitySignal === "at_risk") {
      confidence = "low";
    } else if (executionCapacitySignal === "healthy" && recommendedAllocation === opp.beneficiaryEstimate && opp.riskLevel === "low") {
      confidence = "high";
    } else {
      confidence = "medium";
    }

    return {
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      cause: opp.cause,
      recommendedAllocation,
      executionCapacitySignal,
      priority: opp.priority,
      confidence,
    };
  });
}

export function sortByAllocationPriority<T extends { priority: OpportunityPriority; targetExecutionDate: string | null }>(
  rows: T[]
): T[] {
  return rows.slice().sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    if (a.targetExecutionDate && b.targetExecutionDate) {
      return new Date(a.targetExecutionDate).getTime() - new Date(b.targetExecutionDate).getTime();
    }
    if (a.targetExecutionDate) return -1;
    if (b.targetExecutionDate) return 1;
    return 0;
  });
}

/** OP-004 Allocation Engine's full data set. Server-side only, real
 *  queries throughout. Two structural simplifications, both documented at
 *  their computation site below: (1) partners have no district column, so
 *  District Capacity is derived from the districts of the opportunities
 *  each partner is currently linked to -- a partner serving two districts
 *  contributes its full capacity to both; (2) partner monthly_capacity is
 *  a brand-new, currently-unset field (no OP-009 Partner Management yet to
 *  capture it), so most capacity signals read "unknown" honestly rather
 *  than fabricating a number. */
export async function getAllocationEngineData(): Promise<AllocationEngineData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const month = currentMonthKey();
  const monthStart = `${month}-01`;
  const today = new Date();

  const [{ data: opportunities }, { data: partners }, { data: allocations }, { data: participations }] =
    await Promise.all([
      supabase.from("opportunities").select("*"),
      supabase.from("partners").select("id, name, status, monthly_capacity"),
      supabase.from("allocations").select("*").eq("allocation_month", monthStart),
      supabase
        .from("participations")
        .select("id, participation_causes(causes(slug))")
        .eq("month", month)
        .eq("status", "completed"),
    ]);

  const opps = opportunities ?? [];
  const partnerRows = partners ?? [];
  const allocationRows = allocations ?? [];
  const participationRows = (participations ?? []) as {
    id: string;
    participation_causes: { causes: unknown }[] | null;
  }[];

  const partnerById = new Map(partnerRows.map((p) => [p.id as string, p]));
  const opportunityById = new Map(opps.map((o) => [o.id as string, o]));

  // -- Monthly Participation Summary (Header + Row 1) --
  const byCauseTotal = new Map<string, number>();
  const totalParticipations = participationRows.length;
  for (const participation of participationRows) {
    for (const row of participation.participation_causes ?? []) {
      const slug = (row.causes as { slug: CauseId } | null)?.slug;
      if (slug) byCauseTotal.set(CAUSE_LABEL_BY_SLUG[slug], (byCauseTotal.get(CAUSE_LABEL_BY_SLUG[slug]) ?? 0) + 1);
    }
  }
  const allocatedByCause = new Map<string, number>();
  for (const a of allocationRows) {
    const cause = a.cause as string;
    allocatedByCause.set(cause, (allocatedByCause.get(cause) ?? 0) + (a.participations_allocated as number));
  }
  const byCause: ParticipationByCause[] = CAUSES.map((c) => {
    const label = CAUSE_LABEL_BY_SLUG[c.id];
    const total = byCauseTotal.get(label) ?? 0;
    const allocatedThisMonth = allocatedByCause.get(label) ?? 0;
    return { cause: label, total, allocatedThisMonth, available: Math.max(0, total - allocatedThisMonth) };
  });
  const availableByCause = Object.fromEntries(byCause.map((c) => [c.cause, c.available]));

  // -- Allocation-ready pool: approved, not yet allocated (Row 2) --
  const poolOpps = opps.filter((o) => o.status === "approved");
  const poolWithReadiness: AllocationReadyOpportunity[] = poolOpps.map((o) => {
    const checklist: ImpactAssuranceChecklist = {
      opportunityVerified: o.opportunity_verified as boolean,
      partnerVerified: o.partner_verified as boolean,
      documentationComplete: o.documentation_complete as boolean,
      siteValidationComplete: o.site_validation_complete as boolean,
      executionFeasibilityConfirmed: o.execution_feasibility_confirmed as boolean,
      riskAssessmentComplete: o.risk_assessment_complete as boolean,
    };
    const riskLevel = o.risk_level as RiskLevel;
    return {
      id: o.id as string,
      title: o.title as string,
      cause: o.cause as string,
      district: o.district as string | null,
      partnerId: o.partner_id as string | null,
      partnerName: o.partner_id ? (partnerById.get(o.partner_id as string)?.name as string | undefined) ?? null : null,
      beneficiaryEstimate: o.beneficiary_estimate as number | null,
      priority: o.priority as OpportunityPriority,
      riskLevel,
      readiness: computeReadiness(o.status as OpportunityStatus, checklist, riskLevel),
      targetExecutionDate: o.target_execution_date as string | null,
    };
  });
  const allocationReadyOpportunities = sortByAllocationPriority(poolWithReadiness);

  const allocationReadinessSummary: Record<ReadinessStatus, number> = { ready: 0, needs_review: 0, blocked: 0 };
  for (const o of allocationReadyOpportunities) allocationReadinessSummary[o.readiness] += 1;

  // -- Execution Capacity View (Row 5) -- only partners linked to the pool,
  // since capacity only matters for decisions being made right now.
  const poolPartnerIds = Array.from(new Set(poolOpps.map((o) => o.partner_id as string | null).filter((id): id is string => !!id)));
  const opportunityPartnerId = new Map(opps.map((o) => [o.id as string, o.partner_id as string | null]));
  const allocatedByPartnerThisMonth = new Map<string, number>();
  for (const a of allocationRows) {
    const partnerId = opportunityPartnerId.get(a.opportunity_id as string);
    if (!partnerId) continue;
    allocatedByPartnerThisMonth.set(
      partnerId,
      (allocatedByPartnerThisMonth.get(partnerId) ?? 0) + (a.participations_allocated as number)
    );
  }
  const capacityStatusByPartnerId = new Map<string, CapacityStatus>();
  const partnerCapacities: PartnerCapacityRow[] = poolPartnerIds.map((partnerId) => {
    const partner = partnerById.get(partnerId);
    const capacity = (partner?.monthly_capacity as number | null | undefined) ?? null;
    const allocatedThisMonth = allocatedByPartnerThisMonth.get(partnerId) ?? 0;
    const status = capacityStatusFor(capacity, allocatedThisMonth);
    capacityStatusByPartnerId.set(partnerId, status);
    return {
      partnerId,
      partnerName: (partner?.name as string | undefined) ?? "Unknown partner",
      partnerStatus: (partner?.status as PartnerCapacityRow["partnerStatus"] | undefined) ?? "pending",
      capacity,
      allocatedThisMonth,
      remaining: capacity === null ? null : capacity - allocatedThisMonth,
      status,
    };
  });

  // -- District Capacity (Row 5) -- best-effort: partners have no district
  // of their own, so a district's known capacity sums the capacities of
  // partners currently linked to opportunities in that district. A partner
  // serving two districts contributes its full capacity to each.
  const districtsInPool = Array.from(new Set(poolOpps.map((o) => o.district as string | null).filter((d): d is string => !!d)));
  const districtCapacities: DistrictCapacityRow[] = districtsInPool.map((district) => {
    const districtOpps = poolOpps.filter((o) => o.district === district);
    const districtPartnerIds = Array.from(new Set(districtOpps.map((o) => o.partner_id as string | null).filter((id): id is string => !!id)));
    let knownCapacity: number | null = null;
    let partnersWithUnknownCapacity = 0;
    for (const id of districtPartnerIds) {
      const capacity = partnerById.get(id)?.monthly_capacity as number | null | undefined;
      if (capacity === null || capacity === undefined) {
        partnersWithUnknownCapacity += 1;
      } else {
        knownCapacity = (knownCapacity ?? 0) + capacity;
      }
    }
    const districtOppIds = new Set(districtOpps.map((o) => o.id as string));
    const allocatedThisMonth = allocationRows
      .filter((a) => districtOppIds.has(a.opportunity_id as string))
      .reduce((sum, a) => sum + (a.participations_allocated as number), 0);
    return {
      district,
      opportunityCount: districtOpps.length,
      knownCapacity,
      partnersWithUnknownCapacity,
      allocatedThisMonth,
      status: capacityStatusFor(knownCapacity, allocatedThisMonth),
    };
  });

  const knownCapacityPartners = partnerCapacities.filter((p) => p.capacity !== null);
  const monthlyCapacityForecast = {
    knownCapacity: knownCapacityPartners.reduce((sum, p) => sum + (p.capacity ?? 0), 0),
    unknownPartnerCount: partnerCapacities.length - knownCapacityPartners.length,
    allocatedThisMonth: knownCapacityPartners.reduce((sum, p) => sum + p.allocatedThisMonth, 0),
    remaining:
      knownCapacityPartners.length > 0
        ? knownCapacityPartners.reduce((sum, p) => sum + (p.capacity ?? 0) - p.allocatedThisMonth, 0)
        : null,
  };

  // -- Recommendation Engine (Row 3) -- Ready only, per locked rule --
  const readyOnly = allocationReadyOpportunities.filter((o) => o.readiness === "ready");
  const recommendations = computeRecommendations(readyOnly, availableByCause, capacityStatusByPartnerId);

  // -- Allocation Risk Panel (Row 6) --
  const overCapacityPartners = partnerCapacities
    .filter((p) => p.remaining !== null && p.remaining < 0)
    .map((p) => ({ partnerName: p.partnerName, overBy: Math.abs(p.remaining as number) }));
  const sevenDaysOut = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const executionBottlenecks = allocationReadyOpportunities
    .filter((o) => o.targetExecutionDate && new Date(o.targetExecutionDate) <= sevenDaysOut)
    .map((o) => ({ opportunityId: o.id, title: o.title, targetExecutionDate: o.targetExecutionDate as string }));
  const districtSaturation = districtCapacities
    .filter((d) => d.status === "at_risk")
    .map((d) => ({ district: d.district, opportunityCount: d.opportunityCount }));
  const partnerAvailabilityIssues = partnerCapacities
    .filter((p) => p.partnerStatus !== "verified")
    .map((p) => ({ partnerName: p.partnerName, status: p.partnerStatus }));
  // Only approved opportunities enter this pool, and approval already
  // requires a complete checklist (see canApproveOpportunity) -- so a
  // documentation gap inside the allocation pool is structurally always
  // zero today, honestly, rather than a fabricated non-zero count.
  const documentationGaps = poolOpps.filter((o) => !o.documentation_complete).length;

  let overallRiskLevel: RiskLevel = "low";
  if (overCapacityPartners.length > 0 || allocationReadyOpportunities.some((o) => o.riskLevel === "critical")) {
    overallRiskLevel = "critical";
  } else if (executionBottlenecks.length > 0 || districtSaturation.length > 0) {
    overallRiskLevel = "high";
  } else if (partnerAvailabilityIssues.length > 0) {
    overallRiskLevel = "medium";
  }

  // -- Allocation Timeline (Row 7) -- system-generated only; the only real
  // stamp an allocation gets today is its own creation (no separate
  // review/approval/execution-assignment workflow exists yet for the
  // allocation decision itself, as opposed to the opportunity it targets).
  const timeline: AllocationTimelineEntry[] = allocationRows
    .slice()
    .sort((a, b) => new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
    .slice(0, 10)
    .map((a) => ({
      opportunityTitle: (opportunityById.get(a.opportunity_id as string)?.title as string | undefined) ?? "Unknown opportunity",
      participationsAllocated: a.participations_allocated as number,
      createdAtIso: a.created_at as string,
    }));

  // -- Monthly Execution Compliance (Row 8) --
  const allocatedThisMonthOpps = opps.filter((o) => o.allocated_at && (o.allocated_at as string).startsWith(month));
  const compliance = {
    allocatedThisMonth: allocatedThisMonthOpps.length,
    executingThisMonth: allocatedThisMonthOpps.filter((o) => o.status === "executing").length,
    completedThisMonth: allocatedThisMonthOpps.filter((o) => o.status === "published").length,
    pendingThisMonth: allocatedThisMonthOpps.filter((o) => o.status === "allocated").length,
    overdue: allocatedThisMonthOpps.filter(
      (o) =>
        o.target_execution_date &&
        new Date(o.target_execution_date as string) < today &&
        !["executing", "published", "closed"].includes(o.status as string)
    ).length,
  };

  return {
    currentMonthLabel: today.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    totalParticipationsThisMonth: totalParticipations,
    approvedOpportunitiesCount: poolOpps.length,
    allocationReadinessSummary,
    monthlyParticipation: { total: totalParticipations, byCause },
    allocationReadyOpportunities,
    recommendations,
    partnerCapacities,
    districtCapacities,
    monthlyCapacityForecast,
    risk: {
      overCapacityPartners,
      executionBottlenecks,
      documentationGaps,
      districtSaturation,
      partnerAvailabilityIssues,
      overallRiskLevel,
    },
    timeline,
    compliance,
  };
}
