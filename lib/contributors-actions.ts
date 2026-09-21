"use server";

import { revalidatePath } from "next/cache";
import { getOperatorAuthState } from "@/lib/operator";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { currentMonthKey } from "@/lib/contributor";
import { getContributorManagementData } from "@/lib/contributors";
import type { CauseId } from "@/types/participation";

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** OP-008 header's "Export" action -- the per-contributor table, same CSV
 *  pattern as every other Ops screen's export. */
export async function exportContributorsAction(): Promise<{ error?: string; csv?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getContributorManagementData();
  const header = [
    "Contributor ID",
    "Name",
    "Country",
    "Current stage",
    "Current continuity",
    "Longest continuity",
    "Lifetime participations",
    "Last participation date",
    "Status",
  ];
  const rows = data.contributors.map((c) => [
    c.id,
    c.name,
    c.country ?? "",
    c.currentStage,
    c.currentContinuity.toString(),
    c.longestContinuity.toString(),
    c.lifetimeParticipations.toString(),
    c.lastParticipationDateIso ?? "",
    c.status,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

  return { csv };
}

/** OP-008 header's "Community report" action -- a plain-text snapshot of
 *  Rows 1/2/3/4/8's community-level aggregates (not the per-contributor
 *  rows the CSV export covers). Deliberately a point-in-time summary, not
 *  a generated document with charts -- there's no reporting/PDF pipeline
 *  anywhere in the app to build this on top of. */
export async function exportCommunityReportAction(): Promise<{ error?: string; report?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  const data = await getContributorManagementData();
  const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);
  const lines = [
    `Aram in Action -- Community Health Report`,
    `Generated ${new Date().toISOString()}`,
    ``,
    `COMMUNITY HEALTH`,
    `Total contributors: ${data.healthOverview.total}`,
    `Active this month: ${data.healthOverview.activeThisMonth}`,
    `New this month: ${data.healthOverview.newThisMonth}`,
    `At-risk contributors: ${data.healthOverview.atRisk}`,
    `Average continuity: ${data.healthOverview.averageContinuity?.toFixed(1) ?? "—"} months`,
    ``,
    `JOURNEY STAGE DISTRIBUTION`,
    ...data.stageDistribution.map((s) => `${s.stage}: ${s.count} (${pct(s.pct)})`),
    ``,
    `CONTINUITY OVERVIEW`,
    `Current average continuity: ${data.continuityOverview.currentAverageContinuity?.toFixed(1) ?? "—"} months`,
    `Longest community continuity: ${data.continuityOverview.longestCommunityContinuity} months`,
    `Continuity retention rate: ${pct(data.continuityOverview.continuityRetentionRate)}`,
    ``,
    `PARTICIPATION OVERVIEW`,
    `Participated this month: ${data.participationOverview.participatedThisMonth}`,
    `Participated last month: ${data.participationOverview.participatedLastMonth}`,
    ...data.participationOverview.causeDistribution.map((c) => `${c.title}: ${c.participationCount}`),
    ``,
    `COMMUNITY INSIGHTS`,
    `Fastest growing stage: ${data.insights.fastestGrowingStage ? `${data.insights.fastestGrowingStage.stage} (+${data.insights.fastestGrowingStage.countThisMonth} this month)` : "No stage advancement recorded this month."}`,
    `Most common cause: ${data.insights.mostCommonCause ? `${data.insights.mostCommonCause.title} (${data.insights.mostCommonCause.participationCount})` : "No participation data yet."}`,
  ];

  return { report: lines.join("\n") };
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Operator-only backfill for a contributor's participation history --
 * founder-directed addition (2026-09-21), not part of OP-008's locked
 * spec. The only other place a participations row gets written
 * (lib/participation-actions.ts's recordParticipationAction) is
 * contributor self-service, hardcoded to the current month, and
 * authorized by RLS as the contributor's own auth.uid() -- none of that
 * fits "an operator enters a real contributor's March participation in
 * September," so this uses the service-role client instead (same
 * pattern as Mission Camera's unauthenticated writes and the
 * notifications cron) after its own explicit operator check.
 *
 * IMPORTANT for the caller: the continuity/stage trigger this feeds
 * (handle_participation_completed -> apply_participation_to_journey)
 * assumes it is always being told about the contributor's NEWEST
 * participation so far -- it compares the incoming month against
 * aram_journeys.last_participation_month to decide whether the streak
 * continues, resets, or holds. Backfilling multiple past months for the
 * same contributor MUST be done oldest-month-first, one at a time, or
 * the computed continuity streak will be wrong.
 */
export async function recordPastParticipationAction(
  contributorId: string,
  month: string,
  causeIds: CauseId[],
  totalAmountRupees: number,
  causeAllocationsRupees: Partial<Record<CauseId, number>>
): Promise<{ error?: string }> {
  const auth = await getOperatorAuthState();
  if (auth.status !== "operator") return { error: "You need to sign in as an operator." };

  if (!MONTH_PATTERN.test(month)) return { error: "Enter a valid month." };
  if (month > currentMonthKey()) return { error: "Can't record participation for a future month." };
  if (causeIds.length === 0) return { error: "Select at least one cause." };
  if (!Number.isInteger(totalAmountRupees) || totalAmountRupees <= 0) {
    return { error: "Enter an amount." };
  }
  const allocations = causeIds.map((id) => causeAllocationsRupees[id] ?? 0);
  if (allocations.some((amount) => !Number.isInteger(amount) || amount < 0)) {
    return { error: "Each cause's amount must be a whole, non-negative number." };
  }
  if (allocations.reduce((sum, amount) => sum + amount, 0) !== totalAmountRupees) {
    return { error: "The split across causes must add up to the total amount." };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) return { error: "Supabase is not configured on this deployment." };

  const { data: participation, error: participationError } = await supabase
    .from("participations")
    .insert({ contributor_id: contributorId, month, status: "completed", amount: totalAmountRupees })
    .select("id")
    .single();

  if (participationError) {
    if (participationError.code === "23505") {
      return { error: "This contributor already has a participation recorded for that month." };
    }
    return { error: participationError.message };
  }

  const { data: causeRows, error: causesError } = await supabase.from("causes").select("id, slug").in("slug", causeIds);
  if (causesError) return { error: causesError.message };

  const participationCauseRows = (causeRows ?? []).map((cause) => ({
    participation_id: participation.id,
    cause_id: cause.id,
    allocation_amount: causeAllocationsRupees[cause.slug as CauseId] ?? 0,
  }));

  if (participationCauseRows.length > 0) {
    const { error: causesInsertError } = await supabase.from("participation_causes").insert(participationCauseRows);
    if (causesInsertError) return { error: causesInsertError.message };
  }

  revalidatePath("/ops/contributors");
  return {};
}
