import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import type { OpportunityPriority } from "@/lib/opportunities";
import { capacityStatusFor, type CapacityStatus } from "@/lib/allocation";
import type { RiskLevel } from "@/lib/opportunity-detail";

export type ExecutionStatus = "allocated" | "scheduled" | "in_progress" | "completed" | "blocked" | "cancelled" | "delayed";

const STATUS_SORT_ORDER: Record<ExecutionStatus, number> = {
  allocated: 0,
  delayed: 1,
  blocked: 2,
  scheduled: 3,
  in_progress: 4,
  completed: 5,
  cancelled: 6,
};

export interface ExecutionRow {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  cause: string;
  district: string | null;
  partnerId: string | null;
  partnerName: string | null;
  executionOwner: string | null;
  scheduledDate: string | null;
  status: ExecutionStatus;
  priority: OpportunityPriority;
  delayReason: string | null;
  blockReason: string | null;
  cancellationReason: string | null;
}

export interface AttentionItem {
  label: string;
  count: number;
}

export interface OwnerRow {
  owner: string;
  assignedExecutions: number;
  completedThisMonth: number;
  delayedExecutions: number;
}

export interface PartnerCoordinationRow {
  partnerId: string;
  partnerName: string;
  assignedExecutions: number;
  currentCapacity: number | null;
  availability: CapacityStatus;
  issues: string[];
}

export interface ExecutionTimelineEntry {
  label: string;
  opportunityTitle: string;
  dateIso: string;
}

export interface ExecutionManagementData {
  currentMonthLabel: string;
  activeExecutions: number;
  completedExecutionsThisMonth: number;
  complianceRate: number | null;
  healthSummary: {
    scheduled: number;
    in_progress: number;
    completed: number;
    delayed: number;
    blocked: number;
    cancelled: number;
  };
  attentionRequired: AttentionItem[];
  executions: ExecutionRow[];
  opportunitiesMissingExecution: { id: string; title: string }[];
  districts: string[];
  causes: string[];
  partners: { id: string; name: string }[];
  owners: string[];
  scheduling: { today: number; tomorrow: number; thisWeek: number; upcoming: number };
  ownership: OwnerRow[];
  partnerCoordination: PartnerCoordinationRow[];
  completion: {
    completedThisMonth: number;
    awaitingDocumentation: number;
    documentationSubmitted: number;
    readyForReview: number;
  };
  risk: {
    partnerDelays: number;
    documentationRisks: number;
    schedulingRisks: number;
    capacityRisks: number;
    weatherEventRisks: number;
    overallRiskLevel: RiskLevel;
  };
  timeline: ExecutionTimelineEntry[];
  compliance: {
    allocatedThisMonth: number;
    completedThisMonth: number;
    delayed: number;
    cancelled: number;
    complianceRate: number | null;
  };
}

function isSameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * Creates the executions row a newly-allocated opportunity is required to
 * have (locked OP-005 rule: "no execution may remain unassigned" -- that
 * only holds if an execution record exists the moment allocation happens,
 * even incomplete). Called from every allocation path (OP-003's quick
 * Allocate button, OP-004's Run/Manual allocation) so none of them can
 * allocate an opportunity without an execution appearing here needing an
 * owner and a schedule. Idempotent: opportunity_id is unique, so a second
 * call for the same opportunity is a silent no-op rather than an error.
 */
export async function ensureExecutionForOpportunity(
  supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>,
  opportunityId: string
): Promise<{ error?: string }> {
  const { error } = await supabase.from("executions").insert({ opportunity_id: opportunityId, status: "allocated" });
  if (error && error.code !== "23505") return { error: error.message };
  return {};
}

/** OP-005 Execution Management's full data set. Server-side only, real
 *  queries throughout. Three structural simplifications, documented at
 *  their computation site below: (1) "documentation plan" reuses
 *  opportunities.documentation_notes (the same free-text stand-in OP-003
 *  already uses -- there's no real document-list entity); (2) Completion
 *  Tracking's "documentation submitted"/"ready for review" states are
 *  proxied from that same field, since OP-005A Evidence Upload and OP-006
 *  Documentation Center -- the screens that would set them for real --
 *  don't exist yet; (3) "weather/event risks" has no real data source
 *  anywhere in the app, so it's honestly 0 rather than fabricated. */
export async function getExecutionManagementData(): Promise<ExecutionManagementData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const month = currentMonthKey();
  const today = new Date();

  const [{ data: executionRows }, { data: opportunities }, { data: partners }] = await Promise.all([
    supabase.from("executions").select("*"),
    supabase.from("opportunities").select("id, title, cause, district, partner_id, priority, status, documentation_notes"),
    supabase.from("partners").select("id, name, status, monthly_capacity"),
  ]);

  const execs = executionRows ?? [];
  const opps = opportunities ?? [];
  const partnerRows = partners ?? [];
  const opportunityById = new Map(opps.map((o) => [o.id as string, o]));
  const partnerById = new Map(partnerRows.map((p) => [p.id as string, p]));

  const executions: ExecutionRow[] = execs
    .map((e) => {
      const opp = opportunityById.get(e.opportunity_id as string);
      const partnerId = (opp?.partner_id as string | null | undefined) ?? null;
      const partner = partnerId ? partnerById.get(partnerId) : undefined;
      return {
        id: e.id as string,
        opportunityId: e.opportunity_id as string,
        opportunityTitle: (opp?.title as string | undefined) ?? "Unknown opportunity",
        cause: (opp?.cause as string | undefined) ?? "—",
        district: (opp?.district as string | null | undefined) ?? null,
        partnerId,
        partnerName: (partner?.name as string | undefined) ?? null,
        executionOwner: e.execution_owner as string | null,
        scheduledDate: e.scheduled_date as string | null,
        status: e.status as ExecutionStatus,
        priority: (opp?.priority as OpportunityPriority | undefined) ?? "normal",
        delayReason: e.delay_reason as string | null,
        blockReason: e.block_reason as string | null,
        cancellationReason: e.cancellation_reason as string | null,
      };
    })
    .sort((a, b) => {
      const statusDiff = STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status];
      if (statusDiff !== 0) return statusDiff;
      if (a.scheduledDate && b.scheduledDate) return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      if (a.scheduledDate) return -1;
      if (b.scheduledDate) return 1;
      return 0;
    });

  // -- Header + Row 1 -- Execution Health Summary --
  const healthSummary = {
    scheduled: executions.filter((e) => e.status === "scheduled").length,
    in_progress: executions.filter((e) => e.status === "in_progress").length,
    completed: executions.filter((e) => e.status === "completed").length,
    delayed: executions.filter((e) => e.status === "delayed").length,
    blocked: executions.filter((e) => e.status === "blocked").length,
    cancelled: executions.filter((e) => e.status === "cancelled").length,
  };
  const activeExecutions = healthSummary.scheduled + healthSummary.in_progress;

  const execById = new Map(execs.map((e) => [e.id as string, e]));
  const completedThisMonthExecs = execs.filter(
    (e) => e.status === "completed" && e.completed_at && (e.completed_at as string).startsWith(month)
  );
  const allocatedThisMonthExecs = execs.filter((e) => (e.created_at as string).startsWith(month));
  const complianceRate = allocatedThisMonthExecs.length > 0 ? completedThisMonthExecs.length / allocatedThisMonthExecs.length : null;

  // -- Row 2 -- Executions Requiring Attention --
  const activeOnly = executions.filter((e) => !["completed", "cancelled"].includes(e.status));
  const unassigned = activeOnly.filter((e) => !e.executionOwner || !e.scheduledDate);
  const overdue = activeOnly.filter((e) => e.scheduledDate && new Date(e.scheduledDate) < today);
  const missingDocumentationPlans = activeOnly.filter((e) => {
    const opp = opportunityById.get(e.opportunityId);
    return !opp?.documentation_notes;
  });
  const partnerIssueExecutions = activeOnly.filter((e) => {
    const partner = e.partnerId ? partnerById.get(e.partnerId) : undefined;
    return partner && partner.status !== "verified";
  });
  const scheduleKey = (e: ExecutionRow) => `${e.executionOwner}|${e.scheduledDate}`;
  const scheduleCounts = new Map<string, number>();
  for (const e of activeOnly) {
    if (!e.executionOwner || !e.scheduledDate) continue;
    const key = scheduleKey(e);
    scheduleCounts.set(key, (scheduleCounts.get(key) ?? 0) + 1);
  }
  const schedulingConflicts = activeOnly.filter((e) => e.executionOwner && e.scheduledDate && (scheduleCounts.get(scheduleKey(e)) ?? 0) > 1);

  const attentionRequired: AttentionItem[] = [
    { label: "Unassigned executions", count: unassigned.length },
    { label: "Overdue executions", count: overdue.length },
    { label: "Missing documentation plans", count: missingDocumentationPlans.length },
    { label: "Partner issues", count: partnerIssueExecutions.length },
    { label: "Scheduling conflicts", count: schedulingConflicts.length },
  ];

  const executionOpportunityIds = new Set(execs.map((e) => e.opportunity_id as string));
  const opportunitiesMissingExecution = opps
    .filter((o) => ["allocated", "executing"].includes(o.status as string) && !executionOpportunityIds.has(o.id as string))
    .map((o) => ({ id: o.id as string, title: o.title as string }));

  const districts = Array.from(new Set(executions.map((e) => e.district).filter((d): d is string => !!d)));
  const causes = Array.from(new Set(executions.map((e) => e.cause)));
  const owners = Array.from(new Set(executions.map((e) => e.executionOwner).filter((o): o is string => !!o)));

  // -- Row 4 -- Execution Scheduling Panel --
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const scheduling = {
    today: executions.filter((e) => e.scheduledDate && isSameUtcDay(new Date(e.scheduledDate), today)).length,
    tomorrow: executions.filter((e) => e.scheduledDate && isSameUtcDay(new Date(e.scheduledDate), tomorrow)).length,
    thisWeek: executions.filter((e) => e.scheduledDate && new Date(e.scheduledDate) >= today && new Date(e.scheduledDate) <= weekFromNow).length,
    upcoming: executions.filter((e) => e.scheduledDate && new Date(e.scheduledDate) > weekFromNow).length,
  };

  // -- Row 5 -- Ownership Panel -- capacity remaining isn't tracked for
  // execution owners anywhere (they're free-text names, not a table with
  // a capacity field) -- omitted rather than fabricated.
  const ownership: OwnerRow[] = owners.map((owner) => {
    const ownerExecs = executions.filter((e) => e.executionOwner === owner);
    return {
      owner,
      assignedExecutions: ownerExecs.filter((e) => !["completed", "cancelled"].includes(e.status)).length,
      completedThisMonth: ownerExecs.filter((e) => {
        const raw = execById.get(e.id);
        return e.status === "completed" && raw?.completed_at && (raw.completed_at as string).startsWith(month);
      }).length,
      delayedExecutions: ownerExecs.filter((e) => e.status === "delayed").length,
    };
  });

  // -- Row 6 -- Partner Coordination -- reuses OP-004's capacity-status
  // mapping (lib/allocation.ts) so "Available/Limited/Unavailable" here
  // and "Healthy/Limited/At risk" there stay derived from one formula.
  const partnerIdsInPlay = Array.from(new Set(executions.map((e) => e.partnerId).filter((id): id is string => !!id)));
  const partnerCoordination: PartnerCoordinationRow[] = partnerIdsInPlay.map((partnerId) => {
    const partner = partnerById.get(partnerId);
    const partnerExecs = executions.filter((e) => e.partnerId === partnerId);
    const assignedExecutions = partnerExecs.filter((e) => !["completed", "cancelled"].includes(e.status)).length;
    const capacity = (partner?.monthly_capacity as number | null | undefined) ?? null;
    const availability = capacityStatusFor(capacity, assignedExecutions);
    const issues: string[] = [];
    if (partner && partner.status !== "verified") issues.push(`Partner is ${partner.status}, not verified`);
    if (partnerExecs.some((e) => e.status === "delayed")) issues.push("Has delayed executions");
    return {
      partnerId,
      partnerName: (partner?.name as string | undefined) ?? "Unknown partner",
      assignedExecutions,
      currentCapacity: capacity,
      availability,
      issues,
    };
  });

  // -- Row 7 -- Completion Tracking -- "documentation submitted"/"ready
  // for review" are proxied from documentation_notes (see header comment)
  // since OP-005A/OP-006 don't exist yet to set a real submission state.
  const completedExecs = executions.filter((e) => e.status === "completed");
  const completion = {
    completedThisMonth: completedThisMonthExecs.length,
    awaitingDocumentation: completedExecs.filter((e) => !opportunityById.get(e.opportunityId)?.documentation_notes).length,
    documentationSubmitted: completedExecs.filter((e) => !!opportunityById.get(e.opportunityId)?.documentation_notes).length,
    readyForReview: 0,
  };

  // -- Row 8 -- Execution Risks --
  const partnerDelayPartners = partnerCoordination.filter((p) => p.issues.includes("Has delayed executions"));
  const capacityRiskPartners = partnerCoordination.filter((p) => p.availability === "at_risk");
  let overallRiskLevel: RiskLevel = "low";
  if (capacityRiskPartners.length > 0 || overdue.length > 0) {
    overallRiskLevel = "critical";
  } else if (partnerDelayPartners.length > 0 || schedulingConflicts.length > 0) {
    overallRiskLevel = "high";
  } else if (missingDocumentationPlans.length > 0) {
    overallRiskLevel = "medium";
  }
  const risk = {
    partnerDelays: partnerDelayPartners.length,
    documentationRisks: missingDocumentationPlans.length,
    schedulingRisks: overdue.length + schedulingConflicts.length,
    capacityRisks: capacityRiskPartners.length,
    weatherEventRisks: 0,
    overallRiskLevel,
  };

  // -- Row 9 -- Execution Timeline -- system-generated only, most recent
  // real events across all executions (this screen has no per-execution
  // detail page yet -- that's OP-005A, not built this round).
  const timelineEvents: ExecutionTimelineEntry[] = [];
  for (const e of execs) {
    const opp = opportunityById.get(e.opportunity_id as string);
    const title = (opp?.title as string | undefined) ?? "Unknown opportunity";
    if (e.created_at) timelineEvents.push({ label: "Allocated", opportunityTitle: title, dateIso: e.created_at as string });
    if (e.assigned_at) timelineEvents.push({ label: "Assigned", opportunityTitle: title, dateIso: e.assigned_at as string });
    if (e.scheduled_at) timelineEvents.push({ label: "Scheduled", opportunityTitle: title, dateIso: e.scheduled_at as string });
    if (e.started_at) timelineEvents.push({ label: "Started", opportunityTitle: title, dateIso: e.started_at as string });
    if (e.completed_at) timelineEvents.push({ label: "Completed", opportunityTitle: title, dateIso: e.completed_at as string });
  }
  timelineEvents.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
  const timeline = timelineEvents.slice(0, 15);

  // -- Monthly Execution Compliance --
  const compliance = {
    allocatedThisMonth: allocatedThisMonthExecs.length,
    completedThisMonth: completedThisMonthExecs.length,
    delayed: execs.filter((e) => e.status === "delayed" && (e.created_at as string).startsWith(month)).length,
    cancelled: execs.filter((e) => e.status === "cancelled" && (e.created_at as string).startsWith(month)).length,
    complianceRate,
  };

  return {
    currentMonthLabel: today.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    activeExecutions,
    completedExecutionsThisMonth: completedThisMonthExecs.length,
    complianceRate,
    healthSummary,
    attentionRequired,
    executions,
    opportunitiesMissingExecution,
    districts,
    causes,
    partners: partnerRows.map((p) => ({ id: p.id as string, name: p.name as string })),
    owners,
    scheduling,
    ownership,
    partnerCoordination,
    completion,
    risk,
    timeline,
    compliance,
  };
}
