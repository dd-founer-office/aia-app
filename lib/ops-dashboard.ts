import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import { STAGE_ORDER, type StageName } from "@/types";

export type OpportunityStatus =
  | "submitted"
  | "assuring"
  | "approved"
  | "allocated"
  | "executing"
  | "published"
  | "rejected"
  | "closed";

export interface PriorityItem {
  label: string;
  urgency: "critical" | "high" | "normal" | "info";
}

export interface AttentionCard {
  label: string;
  count: number;
}

export interface ActiveExecutionRow {
  id: string;
  name: string;
  organization: string;
  scheduledDate: string;
  owner: string;
}

export interface OpsDashboardData {
  operatorDisplayName: string;
  todayLabel: string;
  todaysPriorities: PriorityItem[];
  attentionRequired: AttentionCard[];
  pipeline: Record<OpportunityStatus, number>;
  sla: {
    avgVerificationDays: number | null;
    avgAllocationDays: number | null;
    avgPublicationDays: number | null;
  };
  activeExecutions: ActiveExecutionRow[];
  executionCalendar: { today: number; tomorrow: number; thisWeek: number };
  documentation: {
    pendingDocumentation: number;
    pendingReview: number;
    missingEvidence: number;
    approvedDocumentation: number;
  };
  publishing: {
    readyToPublish: number;
    awaitingReview: number;
    publishedThisMonth: number;
    avgPublishDays: number | null;
  };
  contributorSnapshot: {
    totalContributors: number;
    participatedThisMonth: number;
    avgContinuityMonths: number | null;
    newContributorsThisMonth: number;
    atRiskContributors: number;
    stageDistribution: Record<StageName, number>;
  };
  partnerSnapshot: {
    verifiedPartners: number;
    activePartners: number;
    pendingVerification: number;
  };
  systemHealth: {
    sameMonthExecutionRate: number | null;
    documentationCompletionRate: number | null;
    publicationCompletionRate: number | null;
    opportunityVerificationRate: number | null;
  };
}

function daysBetween(fromIso: string, toIso: string): number {
  return (new Date(toIso).getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * OP-001 Operations Dashboard's full data set. Real queries throughout --
 * no fabricated numbers. Where an underlying workflow doesn't exist yet
 * (OP-002/003/004 screens aren't built this round, so `opportunities` is
 * genuinely empty; there's no separate `executions`/`documentation`/
 * `publishing` entity, Milestone 5), this maps onto real data instead:
 * Rows 3-5 (Active Executions/Execution Calendar/Documentation Queue/
 * Publishing Queue) reuse the existing missions/evidence/
 * mission_publications schema, which already functions as a simpler
 * version of that same pipeline (see CA-010/011's lib/published-acts.ts
 * for the contributor-facing side of the same tables). A metric with no
 * real denominator yet (e.g. opportunity verification rate, with zero
 * opportunities submitted so far) returns null and the UI shows "—"
 * rather than a fabricated percentage.
 */
export async function getOpsDashboardData(operatorDisplayName: string): Promise<OpsDashboardData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const now = new Date();
  const todayLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const month = currentMonthKey();

  const [
    { data: opportunities },
    { data: missions },
    { data: evidenceRows },
    { data: publications },
    { data: contributors },
    { data: journeys },
    { data: participations },
    { data: partners },
  ] = await Promise.all([
    supabase.from("opportunities").select("*"),
    supabase.from("missions").select("*"),
    supabase.from("evidence").select("id, mission_id"),
    supabase.from("mission_publications").select("mission_id, published_at"),
    supabase.from("contributors").select("id, created_at"),
    supabase.from("aram_journeys").select("current_stage, continuity_month_count, last_participation_month"),
    supabase.from("participations").select("contributor_id, month, status"),
    supabase.from("partners").select("id, status"),
  ]);

  const opps = opportunities ?? [];
  const allMissions = missions ?? [];
  const evidence = evidenceRows ?? [];
  const pubs = publications ?? [];
  const evidenceCountByMission = new Map<string, number>();
  for (const row of evidence) {
    const key = row.mission_id as string;
    evidenceCountByMission.set(key, (evidenceCountByMission.get(key) ?? 0) + 1);
  }
  const publishedAtByMission = new Map<string, string>();
  for (const row of pubs) {
    publishedAtByMission.set(row.mission_id as string, row.published_at as string);
  }

  const pendingMissions = allMissions.filter((m) => m.status === "pending_review");
  const publishedMissions = allMissions.filter((m) => m.status === "published");
  const pendingWithoutEvidence = pendingMissions.filter(
    (m) => (evidenceCountByMission.get(m.id as string) ?? 0) === 0
  );
  const pendingWithEvidence = pendingMissions.filter(
    (m) => (evidenceCountByMission.get(m.id as string) ?? 0) > 0
  );

  // -- Pipeline (Row 2) --
  const pipeline: Record<OpportunityStatus, number> = {
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
    pipeline[status] = (pipeline[status] ?? 0) + 1;
  }

  // -- SLA indicators --
  const verificationDurations = opps
    .filter((o) => o.verified_at)
    .map((o) => daysBetween(o.submitted_at as string, o.verified_at as string));
  const allocationDurations = opps
    .filter((o) => o.allocated_at && o.approved_at)
    .map((o) => daysBetween(o.approved_at as string, o.allocated_at as string));
  const publicationDurations = allMissions
    .filter((m) => publishedAtByMission.has(m.id as string))
    .map((m) => daysBetween(m.submitted_at as string, publishedAtByMission.get(m.id as string) as string));

  // -- Row 3 / 3.5 -- Active Executions + Execution Calendar --
  const activeExecutions: ActiveExecutionRow[] = pendingMissions
    .slice()
    .sort((a, b) => new Date(a.mission_date as string).getTime() - new Date(b.mission_date as string).getTime())
    .slice(0, 5)
    .map((m) => ({
      id: m.id as string,
      name: m.mission_name as string,
      organization: m.organization as string,
      scheduledDate: m.mission_date as string,
      owner: m.field_executive as string,
    }));

  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const executionCalendar = {
    today: pendingMissions.filter((m) => isSameUtcDay(new Date(m.mission_date as string), today)).length,
    tomorrow: pendingMissions.filter((m) => isSameUtcDay(new Date(m.mission_date as string), tomorrow)).length,
    thisWeek: pendingMissions.filter((m) => {
      const d = new Date(m.mission_date as string);
      return d >= today && d <= weekFromNow;
    }).length,
  };

  // -- Row 4 -- Documentation Queue --
  const documentation = {
    pendingDocumentation: pendingWithoutEvidence.length,
    pendingReview: pendingWithEvidence.length,
    missingEvidence: pendingWithoutEvidence.length,
    approvedDocumentation: publishedMissions.length,
  };

  // -- Row 5 -- Publishing Queue --
  const publishedThisMonthCount = pubs.filter((p) => (p.published_at as string).startsWith(month)).length;
  const publishing = {
    readyToPublish: pendingWithEvidence.length,
    awaitingReview: 0,
    publishedThisMonth: publishedThisMonthCount,
    avgPublishDays: average(publicationDurations),
  };

  // -- Row 0 -- Today's Priorities (auto-generated, max 5, urgency-sorted) --
  const priorities: PriorityItem[] = [];
  const overdueOpportunities = opps.filter(
    (o) =>
      o.target_execution_date &&
      new Date(o.target_execution_date as string) < today &&
      !["published", "rejected", "closed"].includes(o.status as string)
  );
  if (overdueOpportunities.length > 0) {
    priorities.push({
      label: `${overdueOpportunities.length} opportunit${overdueOpportunities.length === 1 ? "y is" : "ies are"} overdue`,
      urgency: "critical",
    });
  }
  if (pendingWithEvidence.length > 0) {
    priorities.push({
      label: `${pendingWithEvidence.length} Act${pendingWithEvidence.length === 1 ? "" : "s"} ready for publishing`,
      urgency: "high",
    });
  }
  if (pendingWithoutEvidence.length > 0) {
    priorities.push({
      label: `Documentation missing for ${pendingWithoutEvidence.length} execution${pendingWithoutEvidence.length === 1 ? "" : "s"}`,
      urgency: "high",
    });
  }
  const needsVerification = opps.filter((o) => o.status === "submitted" || o.status === "assuring");
  if (needsVerification.length > 0) {
    priorities.push({
      label: `${needsVerification.length} opportunit${needsVerification.length === 1 ? "y" : "ies"} awaiting verification`,
      urgency: "normal",
    });
  }
  const readyForAllocation = opps.filter((o) => o.status === "approved");
  if (readyForAllocation.length > 0) {
    priorities.push({
      label: `${readyForAllocation.length} opportunit${readyForAllocation.length === 1 ? "y" : "ies"} ready for allocation`,
      urgency: "info",
    });
  }
  const todaysPriorities = priorities.slice(0, 5);

  // -- Row 1 -- Attention Required (always shown, 6 cards) --
  const attentionRequired: AttentionCard[] = [
    { label: "Pending verification", count: needsVerification.length },
    { label: "Pending allocation", count: readyForAllocation.length },
    {
      label: "Execution delays",
      count: pendingMissions.filter((m) => new Date(m.mission_date as string) < today).length,
    },
    { label: "Documentation pending", count: pendingWithoutEvidence.length },
    { label: "Publishing queue", count: pendingWithEvidence.length },
    { label: "Overdue items", count: overdueOpportunities.length },
  ];

  // -- Row 6 -- Contributor Snapshot --
  const contributorList = contributors ?? [];
  const journeyList = journeys ?? [];
  const participationList = participations ?? [];
  const participatedThisMonth = new Set(
    participationList.filter((p) => p.month === month && p.status === "completed").map((p) => p.contributor_id)
  ).size;
  const newContributorsThisMonth = contributorList.filter((c) =>
    (c.created_at as string).startsWith(month)
  ).length;
  const atRiskContributors = journeyList.filter(
    (j) => j.last_participation_month && j.last_participation_month !== month
  ).length;
  const continuityValues = journeyList.map((j) => j.continuity_month_count as number);
  const stageDistribution = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<StageName, number>;
  for (const j of journeyList) {
    const stage = j.current_stage as StageName;
    stageDistribution[stage] = (stageDistribution[stage] ?? 0) + 1;
  }

  // -- Row 7 -- Partner Snapshot --
  const partnerList = partners ?? [];
  const activePartnerOrganizations = new Set(allMissions.map((m) => m.organization as string));

  // -- Row 8 -- System Health --
  const sameMonthExecutions = publishedMissions.filter((m) => {
    const publishedAt = publishedAtByMission.get(m.id as string);
    if (!publishedAt) return false;
    return (m.mission_date as string).slice(0, 7) === publishedAt.slice(0, 7);
  }).length;

  return {
    operatorDisplayName,
    todayLabel,
    todaysPriorities,
    attentionRequired,
    pipeline,
    sla: {
      avgVerificationDays: average(verificationDurations),
      avgAllocationDays: average(allocationDurations),
      avgPublicationDays: average(publicationDurations),
    },
    activeExecutions,
    executionCalendar,
    documentation,
    publishing,
    contributorSnapshot: {
      totalContributors: contributorList.length,
      participatedThisMonth,
      avgContinuityMonths: average(continuityValues),
      newContributorsThisMonth,
      atRiskContributors,
      stageDistribution,
    },
    partnerSnapshot: {
      verifiedPartners: partnerList.filter((p) => p.status === "verified").length,
      activePartners: activePartnerOrganizations.size,
      pendingVerification: partnerList.filter((p) => p.status === "pending").length,
    },
    systemHealth: {
      sameMonthExecutionRate: publishedMissions.length > 0 ? sameMonthExecutions / publishedMissions.length : null,
      documentationCompletionRate:
        allMissions.length > 0
          ? allMissions.filter((m) => (evidenceCountByMission.get(m.id as string) ?? 0) > 0).length /
            allMissions.length
          : null,
      publicationCompletionRate: allMissions.length > 0 ? publishedMissions.length / allMissions.length : null,
      opportunityVerificationRate:
        opps.length > 0 ? opps.filter((o) => o.status !== "submitted" && o.status !== "assuring").length / opps.length : null,
    },
  };
}
