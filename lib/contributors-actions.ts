"use server";

import { getOperatorAuthState } from "@/lib/operator";
import { getContributorManagementData } from "@/lib/contributors";

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
