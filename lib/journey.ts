import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { STAGE_LABELS, STAGE_ORDER, type StageName } from "@/types";
import { CAUSES, type CauseId } from "@/types/participation";

export interface StageRequirement {
  stage: StageName;
  participations: number;
  continuityMonths: number;
}

// CA-012 Locked v1.0's own Stage System section -- kept here (not derived)
// since these are fixed product thresholds, the same ones the DB trigger
// (apply_participation_to_journey) enforces server-side.
const STAGE_REQUIREMENTS: Record<Exclude<StageName, "vidhai">, StageRequirement> = {
  thulir: { stage: "thulir", participations: 3, continuityMonths: 2 },
  kandru: { stage: "kandru", participations: 6, continuityMonths: 6 },
  maram: { stage: "maram", participations: 12, continuityMonths: 12 },
  vanam: { stage: "vanam", participations: 24, continuityMonths: 24 },
};

export interface JourneyMilestone {
  label: string;
  dateIso: string;
}

export interface CauseDistributionEntry {
  causeId: CauseId;
  title: string;
  participationCount: number;
}

/** Shared by CA-012 (this file) and CA-013 (lib/profile.ts): "Expressions
 *  of Aram" is counted by participation, never contribution amount, in
 *  both specs. Takes participations already filtered to status='completed'
 *  with their participation_causes(causes(slug)) embed selected. */
export function buildCauseDistribution(
  completedParticipations: { participation_causes: { causes: unknown }[] | null }[]
): CauseDistributionEntry[] {
  const causeCounts = new Map<CauseId, number>();
  for (const participation of completedParticipations) {
    for (const row of participation.participation_causes ?? []) {
      // Same through-unknown cast as app/participate/recorded/page.tsx --
      // supabase-js can't tell this is a many-to-one embed without
      // generated DB types.
      const slug = (row.causes as { slug: CauseId } | null)?.slug;
      if (slug) causeCounts.set(slug, (causeCounts.get(slug) ?? 0) + 1);
    }
  }
  return CAUSES.map((cause) => ({
    causeId: cause.id,
    title: cause.title,
    participationCount: causeCounts.get(cause.id) ?? 0,
  })).sort((a, b) => b.participationCount - a.participationCount);
}

export interface JourneyDetail {
  displayName: string;
  currentStage: StageName;
  continuityMonthCount: number;
  longestContinuityMonthCount: number;
  lifetimeParticipationCount: number;
  firstParticipationDateIso: string | null;
  hasParticipated: boolean;
  nextStageRequirement: StageRequirement | null;
  causeDistribution: CauseDistributionEntry[];
  /** thulir/kandru/maram/vanam -> ISO reached-at timestamp, for
   *  JourneyTimeline's per-stage date display (Section 2). */
  stageReachedAt: Partial<Record<StageName, string | null>>;
  milestones: JourneyMilestone[];
  reflectionLines: string[];
}

/**
 * CA-012 Aram Journey's full data set for the signed-in contributor.
 * Server-side only (cookie-aware client) -- returns null for a signed-out
 * visitor the same way getCurrentContributor() does.
 */
export async function getJourneyDetail(): Promise<JourneyDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: contributor } = await supabase
    .from("contributors")
    .select("id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!contributor) return null;

  const { data: journey } = await supabase
    .from("aram_journeys")
    .select(
      "current_stage, continuity_month_count, longest_continuity_month_count, longest_continuity_reached_at, thulir_reached_at, kandru_reached_at, maram_reached_at, vanam_reached_at"
    )
    .eq("contributor_id", contributor.id)
    .maybeSingle();
  if (!journey) return null;

  const { data: participations } = await supabase
    .from("participations")
    .select("created_at, participation_causes(causes(slug))")
    .eq("contributor_id", contributor.id)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  const completed = participations ?? [];
  const lifetimeParticipationCount = completed.length;
  const hasParticipated = lifetimeParticipationCount > 0;
  const firstParticipationDateIso = completed[0]?.created_at ?? null;

  const causeDistribution = buildCauseDistribution(completed);

  const currentStage = journey.current_stage as StageName;
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  const nextStageName = STAGE_ORDER[currentIdx + 1] as StageName | undefined;
  const nextStageRequirement = nextStageName
    ? STAGE_REQUIREMENTS[nextStageName as Exclude<StageName, "vidhai">]
    : null;

  const stageReachedAt: Partial<Record<StageName, string | null>> = {
    thulir: journey.thulir_reached_at,
    kandru: journey.kandru_reached_at,
    maram: journey.maram_reached_at,
    vanam: journey.vanam_reached_at,
  };

  const milestones: JourneyMilestone[] = [];
  if (firstParticipationDateIso) {
    milestones.push({ label: "First Act of Aram", dateIso: firstParticipationDateIso });
  }
  for (const stage of ["thulir", "kandru", "maram", "vanam"] as const) {
    const reachedAt = stageReachedAt[stage];
    if (reachedAt) {
      milestones.push({ label: `Reached ${STAGE_LABELS[stage].en}`, dateIso: reachedAt });
    }
  }
  if (journey.longest_continuity_reached_at && journey.longest_continuity_month_count > 0) {
    milestones.push({
      label: `Longest continuity -- ${journey.longest_continuity_month_count} month${
        journey.longest_continuity_month_count === 1 ? "" : "s"
      }`,
      dateIso: journey.longest_continuity_reached_at,
    });
  }
  milestones.sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  const reflectionLines: string[] = [];
  if (hasParticipated) {
    const topCause = causeDistribution[0];
    if (topCause && topCause.participationCount > 0) {
      reflectionLines.push(`${topCause.title} has been your strongest expression of Aram.`);
    }
    const causeCount = causeDistribution.filter((c) => c.participationCount > 0).length;
    if (causeCount > 0) {
      reflectionLines.push(
        `You have practiced Aram across ${causeCount} cause${causeCount === 1 ? "" : "s"}.`
      );
    }
    const { continuity_month_count: current, longest_continuity_month_count: longest } = journey;
    if (current >= 2 && current === longest) {
      reflectionLines.push(`Your continuity has grown steadily to ${current} months.`);
    } else if (current < longest) {
      reflectionLines.push(
        `Your continuity is currently ${current} month${current === 1 ? "" : "s"}, after reaching ${longest} months before.`
      );
    } else {
      reflectionLines.push("You're just beginning to build your continuity.");
    }
  }

  return {
    displayName: contributor.display_name,
    currentStage,
    continuityMonthCount: journey.continuity_month_count,
    longestContinuityMonthCount: journey.longest_continuity_month_count,
    lifetimeParticipationCount,
    firstParticipationDateIso,
    hasParticipated,
    nextStageRequirement,
    causeDistribution,
    stageReachedAt,
    milestones,
    reflectionLines,
  };
}
