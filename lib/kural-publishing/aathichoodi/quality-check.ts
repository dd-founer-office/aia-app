/**
 * Daily Aathichoodi Series — Automated Quality Checks
 * ----------------------------------------------------------------------------
 * Runs the brief's pre-return checklist before a composed episode is shown
 * to the user. Since this engine is deterministic/rule-based (no LLM to
 * exercise semantic judgment -- see content-engine.ts's own doc comment on
 * why), checks that require real understanding ("does the family situation
 * actually demonstrate the value?", "does this feel like AiA rather than a
 * Tamil class?") are approximated with honest structural/heuristic proxies
 * rather than claimed as true semantic verification -- each warning below
 * says exactly what it checked. Non-blocking: findings are surfaced to the
 * user as warnings, per "if any check fails, revise before output" being a
 * human-in-the-loop step in this UI, not a silent auto-reject.
 */

import { getCanonEntry } from "./canon";
import type { ComposedEpisode } from "./content-engine";
import type { SeriesHistory } from "./history-store";

export interface QualityCheckResult {
  passed: boolean;
  warnings: string[];
}

const PARENT_MARKERS = ["you", "your child", "your family", "parent"];
const CLASSROOM_MARKERS = ["lesson number", "grammar", "syllabus", "homework assignment", "exam"];

export function runQualityChecks(
  episode: ComposedEpisode,
  historyBeforeThisEpisode: SeriesHistory
): QualityCheckResult {
  const warnings: string[] = [];

  // Canonical text integrity.
  const canonEntry = getCanonEntry(episode.episodeNumber);
  if (!canonEntry) {
    warnings.push(`Episode ${episode.episodeNumber} is not a valid episode number (1-${episode.totalEpisodes}).`);
  } else if (canonEntry.tamilText !== episode.tamilText) {
    warnings.push("Tamil text does not match the canonical dataset — this should never happen; do not publish.");
  } else if (!canonEntry.verified) {
    warnings.push("This line is flagged unverified in the canonical dataset — confirm against a primary source before publishing.");
  }

  if (!episode.simpleMeaning.trim()) {
    warnings.push("Simple meaning is empty.");
  }
  if (!episode.familyAngle.trim()) {
    warnings.push("Family situation is empty.");
  }
  if (!episode.todayAction.trim()) {
    warnings.push("Today's action is empty.");
  } else if (episode.todayAction.split(/\s+/).length > 40) {
    warnings.push("Today's action reads long for a social slide — consider shortening.");
  }

  // Parent-focused hook (heuristic: the audience markers this brief expects).
  const hookLower = episode.hook.toLowerCase();
  if (!PARENT_MARKERS.some((marker) => hookLower.includes(marker))) {
    warnings.push("Hook may not be clearly parent-focused — review it reads to a parent, not a general audience.");
  }

  // Social-media length discipline.
  if (episode.hook.split(/\s+/).length > 18) {
    warnings.push("Hook is long for Slide 1 — consider a shorter parent hook.");
  }
  if (episode.familyAngle.split(/\s+/).length > 60) {
    warnings.push("Family situation reads long for one carousel slide — consider trimming.");
  }

  // Distant Devotion / CTA appropriateness.
  if (episode.cta.type === "DISTANT_DEVOTION" && !episode.distantDevotionConnection) {
    warnings.push("CTA is Distant Devotion but no Distant Devotion connection text is set — this should never happen; do not publish.");
  }
  if (episode.distantDevotionConnection && episode.cta.type !== "DISTANT_DEVOTION") {
    warnings.push("A Distant Devotion connection is present but the CTA isn't Distant Devotion — double check this is intentional.");
  }

  // Repetition against recent history (heuristic proxy for "does this feel
  // fresh" -- exact rotation is handled by content-engine.ts already, this
  // just surfaces the case where the pool ran out of fresh options).
  if (historyBeforeThisEpisode.recentCtaTypes.filter((t) => t === episode.cta.type).length >= 3) {
    warnings.push("This CTA type has been used often in recent episodes — consider variety.");
  }

  // Soft "feels like AiA, not a Tamil class" proxy.
  const combinedLower = `${episode.hook} ${episode.understanding} ${episode.familyAngle} ${episode.todayAction}`.toLowerCase();
  if (CLASSROOM_MARKERS.some((marker) => combinedLower.includes(marker))) {
    warnings.push("Copy reads like a classroom/Tamil-lesson framing — review tone against the AiA lifestyle-series voice.");
  }

  return { passed: warnings.length === 0, warnings };
}
