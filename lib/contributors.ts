import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { currentMonthKey } from "@/lib/contributor";
import { buildCauseDistribution, type CauseDistributionEntry } from "@/lib/journey";
import { STAGE_ORDER, type StageName } from "@/types";

export type ContributorStatus = "active" | "at_risk" | "inactive";
export type SuggestedAction = "reminder" | "community_outreach" | "no_action";

export interface ContributorRow {
  id: string;
  name: string;
  country: string | null;
  currentStage: StageName;
  currentContinuity: number;
  longestContinuity: number;
  lifetimeParticipations: number;
  lastParticipationDateIso: string | null;
  lastParticipationMonth: string | null;
  status: ContributorStatus;
  suggestedAction: SuggestedAction | null;
  causeDistribution: CauseDistributionEntry[];
  createdAtIso: string;
}

export interface ContributorManagementData {
  healthOverview: { total: number; activeThisMonth: number; newThisMonth: number; atRisk: number; averageContinuity: number | null };
  stageDistribution: { stage: StageName; count: number; pct: number | null }[];
  continuityOverview: {
    currentAverageContinuity: number | null;
    longestCommunityContinuity: number;
    continuityRetentionRate: number | null;
  };
  participationOverview: {
    participatedThisMonth: number;
    participatedLastMonth: number;
    causeDistribution: CauseDistributionEntry[];
  };
  contributors: ContributorRow[];
  atRiskContributors: ContributorRow[];
  countries: string[];
  months: string[];
  insights: {
    fastestGrowingStage: { stage: StageName; countThisMonth: number } | null;
    mostCommonCause: CauseDistributionEntry | null;
  };
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function previousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** OP-008's two locked definitions are literal: "active" is participation
 *  in the current month, "at risk" is having participated before but not
 *  this month. There's no third, spec-defined threshold for when a
 *  long-lapsed at-risk contributor should instead read "inactive" -- so
 *  "inactive" here is reserved for contributors with zero lifetime
 *  participations (never active in the first place), the one case neither
 *  locked definition covers. */
export function statusFor(participatedThisMonth: boolean, lifetimeParticipations: number): ContributorStatus {
  if (participatedThisMonth) return "active";
  if (lifetimeParticipations > 0) return "at_risk";
  return "inactive";
}

/** No locked algorithm exists for Row 6's "Suggested action" -- this is a
 *  documented heuristic, not a spec-given rule, built to honor the locked
 *  "no pressure tactics, supportive outreach only" constraint: a single
 *  one-off contributor who lapses gets no nudge at all (too early to read
 *  anything into it), an established contributor (3+ months continuity at
 *  their peak) gets a real outreach touch, everyone else gets a light
 *  reminder. */
export function suggestedActionFor(status: ContributorStatus, lifetimeParticipations: number, longestContinuity: number): SuggestedAction | null {
  if (status !== "at_risk") return null;
  if (lifetimeParticipations <= 1) return "no_action";
  if (longestContinuity >= 3) return "community_outreach";
  return "reminder";
}

interface ParticipationRow {
  id: string;
  contributor_id: string;
  month: string;
  status: string;
  created_at: string;
  participation_causes: { causes: unknown }[] | null;
}

/** OP-008 Contributor Management's full data set. Server-side only, real
 *  queries throughout, joined in memory the same way lib/partners.ts joins
 *  opportunities/executions -- this app's real scale is small enough that
 *  this stays simple and correct rather than needing DB-side aggregation.
 *  Two documented simplifications, both because no historical snapshot
 *  table exists anywhere in the app (same honest gap OP-009's Row 8 has):
 *  (1) "Monthly continuity/participation trend" render as this-month-vs-
 *  last-month comparisons, not multi-month trend lines; (2) Row 7's
 *  "Recent acts viewed" is omitted entirely -- nothing in the app records
 *  which published Acts a contributor has viewed. */
export async function getContributorManagementData(): Promise<ContributorManagementData> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured on this deployment.");

  const thisMonth = currentMonthKey();
  const lastMonth = previousMonthKey(thisMonth);

  const [{ data: contributors }, { data: users }, { data: journeys }, { data: participations }] = await Promise.all([
    supabase.from("contributors").select("id, user_id, display_name, created_at"),
    supabase.from("users").select("id, country"),
    supabase
      .from("aram_journeys")
      .select("contributor_id, current_stage, continuity_month_count, longest_continuity_month_count, thulir_reached_at, kandru_reached_at, maram_reached_at, vanam_reached_at"),
    supabase.from("participations").select("id, contributor_id, month, status, created_at, participation_causes(causes(slug))"),
  ]);

  const contributorRows = contributors ?? [];
  const countryByUserId = new Map((users ?? []).map((u) => [u.id as string, u.country as string | null]));
  const journeyByContributorId = new Map((journeys ?? []).map((j) => [j.contributor_id as string, j]));
  const allParticipations = (participations ?? []) as ParticipationRow[];

  const participationsByContributor = new Map<string, ParticipationRow[]>();
  for (const p of allParticipations) {
    const list = participationsByContributor.get(p.contributor_id);
    if (list) list.push(p);
    else participationsByContributor.set(p.contributor_id, [p]);
  }

  const thisMonthParticipants = new Set<string>();
  const lastMonthParticipants = new Set<string>();

  const rows: ContributorRow[] = contributorRows.map((c) => {
    const contributorId = c.id as string;
    const journey = journeyByContributorId.get(contributorId);
    const own = participationsByContributor.get(contributorId) ?? [];
    const completed = own.filter((p) => p.status === "completed").sort((a, b) => a.created_at.localeCompare(b.created_at));

    const participatedThisMonth = completed.some((p) => p.month === thisMonth);
    const participatedLastMonth = completed.some((p) => p.month === lastMonth);
    if (participatedThisMonth) thisMonthParticipants.add(contributorId);
    if (participatedLastMonth) lastMonthParticipants.add(contributorId);

    const last = completed[completed.length - 1];
    const currentStage = (journey?.current_stage as StageName | undefined) ?? "vidhai";
    const currentContinuity = (journey?.continuity_month_count as number | undefined) ?? 0;
    const longestContinuity = (journey?.longest_continuity_month_count as number | undefined) ?? 0;
    const lifetimeParticipations = completed.length;
    const status = statusFor(participatedThisMonth, lifetimeParticipations);

    return {
      id: contributorId,
      name: c.display_name as string,
      country: countryByUserId.get(c.user_id as string) ?? null,
      currentStage,
      currentContinuity,
      longestContinuity,
      lifetimeParticipations,
      lastParticipationDateIso: last?.created_at ?? null,
      lastParticipationMonth: last?.month ?? null,
      status,
      suggestedAction: suggestedActionFor(status, lifetimeParticipations, longestContinuity),
      causeDistribution: buildCauseDistribution(completed),
      createdAtIso: c.created_at as string,
    };
  });

  rows.sort((a, b) => {
    const statusOrder: Record<ContributorStatus, number> = { at_risk: 0, active: 1, inactive: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    const aDate = a.lastParticipationDateIso ?? "";
    const bDate = b.lastParticipationDateIso ?? "";
    return aDate.localeCompare(bDate);
  });

  const activeThisMonth = thisMonthParticipants.size;
  const atRiskRows = rows.filter((r) => r.status === "at_risk");
  const newThisMonth = contributorRows.filter((c) => (c.created_at as string).slice(0, 7) === thisMonth).length;
  const averageContinuity = average(rows.map((r) => r.currentContinuity));

  const healthOverview = {
    total: rows.length,
    activeThisMonth,
    newThisMonth,
    atRisk: atRiskRows.length,
    averageContinuity,
  };

  const stageDistribution = STAGE_ORDER.map((stage) => {
    const count = rows.filter((r) => r.currentStage === stage).length;
    return { stage, count, pct: rows.length > 0 ? count / rows.length : null };
  });

  const retentionEligible = lastMonthParticipants.size;
  const retained = Array.from(lastMonthParticipants).filter((id) => thisMonthParticipants.has(id)).length;
  const continuityOverview = {
    currentAverageContinuity: averageContinuity,
    longestCommunityContinuity: rows.length > 0 ? Math.max(...rows.map((r) => r.longestContinuity)) : 0,
    continuityRetentionRate: retentionEligible > 0 ? retained / retentionEligible : null,
  };

  const allCompleted = allParticipations.filter((p) => p.status === "completed");
  const participationOverview = {
    participatedThisMonth: activeThisMonth,
    participatedLastMonth: lastMonthParticipants.size,
    causeDistribution: buildCauseDistribution(allCompleted),
  };

  const countries = Array.from(new Set(rows.map((r) => r.country).filter((c): c is string => !!c))).sort();
  const months = Array.from(new Set(rows.map((r) => r.lastParticipationMonth).filter((m): m is string => !!m))).sort().reverse();

  const stageGrowthThisMonth = (["thulir", "kandru", "maram", "vanam"] as const).map((stage) => {
    const key = `${stage}_reached_at` as const;
    const count = (journeys ?? []).filter((j) => {
      const reachedAt = j[key] as string | null;
      return reachedAt !== null && reachedAt.slice(0, 7) === thisMonth;
    }).length;
    return { stage: stage as StageName, countThisMonth: count };
  });
  const topGrowth = stageGrowthThisMonth.reduce((best, cur) => (cur.countThisMonth > (best?.countThisMonth ?? 0) ? cur : best), null as { stage: StageName; countThisMonth: number } | null);
  const fastestGrowingStage = topGrowth && topGrowth.countThisMonth > 0 ? topGrowth : null;

  const topCause = participationOverview.causeDistribution.find((c) => c.participationCount > 0) ?? null;

  return {
    healthOverview,
    stageDistribution,
    continuityOverview,
    participationOverview,
    contributors: rows,
    atRiskContributors: atRiskRows,
    countries,
    months,
    insights: {
      fastestGrowingStage,
      mostCommonCause: topCause,
    },
  };
}
