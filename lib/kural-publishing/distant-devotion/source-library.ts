/**
 * Distant Devotion — Source Library
 * ----------------------------------------------------------------------------
 * Every source a Distant Devotion brief can point at, classified per the
 * locked Cultural-Practice Status Rule. Nothing here is invented for this
 * pass -- the Practices pool (7 units, Class A/B) and its "culturally
 * common, not source-verified" caveat were established across this
 * program's earlier validation rounds (Cross-Source Pilot onward) and are
 * transcribed here for the first time as real, typed data, not extended or
 * guessed at. VALUES sources reuse the Aathichoodi canon and the existing
 * Kural 200 entry already in this codebase -- no new "verified" Tamil text
 * is added anywhere in this file.
 */

import { AATHICHOODI_CANON } from "../aathichoodi/canon";
import { DEFAULT_KURAL_200_CONTENT } from "../kural200-state";
import type { WorldId } from "./types";

/** Class A: lower sensitivity -- validated across multiple holdouts to
 *  self-correct safely under pressure without the Safety Override needing
 *  to fire (filter coffee, feeding guests: v1.1, v1.2.1, v1.3 all landed
 *  READY_TO_EDIT). Class B: higher sensitivity -- kolam and choru have both
 *  required the Safety Override to fire for real; Diwali order has
 *  required at least one catch-and-correct. "lamp" and "Pongal" remain
 *  untested by name in any holdout (named explicitly, not silently assumed
 *  safe) -- see v1.3 Section J/K. */
export type PracticeRiskClass = "A" | "B";

export interface PracticeSourceUnit {
  id: string;
  label: string;
  riskClass: PracticeRiskClass;
  /** Always true for this pool -- stated on every entry, not just in a doc
   *  comment, so a UI or a validation check can rely on the field directly
   *  rather than on a human remembering the file's header comment. */
  culturallyCommonNotSourceVerified: true;
  /** Known-safe baseline fact this unit's own validated holdout runs
   *  established, if any -- used by the prompt compiler to give the model a
   *  real anchor instead of nothing, without asserting anything unverified
   *  beyond it. Absent for "lamp"/"Pongal" (untested) and for "choru"
   *  (tested, but found to have no safe baseline beyond its bare name). */
  validatedSafeBaseline?: string;
  /** Whether this exact unit has been stress-tested toward a risky receiver
   *  action in a real holdout, and what happened. Purely informational --
   *  never changes what the deterministic validator enforces (see
   *  validation.ts), which re-derives safety from riskClass alone. */
  validationNote: string;
}

export const PRACTICE_SOURCE_LIBRARY: readonly PracticeSourceUnit[] = [
  {
    id: "lamp",
    label: "The lamp (daily lighting)",
    riskClass: "A",
    culturallyCommonNotSourceVerified: true,
    validationNote:
      "Untested by name in any formal holdout to date. Class A per the program's original 7-unit classification; treat with the same caution as an untested Class A unit, not as pre-validated.",
  },
  {
    id: "pongal",
    label: "Pongal (the boiling-over moment)",
    riskClass: "A",
    culturallyCommonNotSourceVerified: true,
    validationNote: "Untested by name in any formal holdout to date.",
  },
  {
    id: "filter-coffee",
    label: "Filter coffee (serving order)",
    riskClass: "A",
    culturallyCommonNotSourceVerified: true,
    validatedSafeBaseline:
      "A household serving-order norm exists; no claim about *why* elders are served first beyond the household's own established norm.",
    validationNote:
      "Stress-tested toward ADAPTS in v1.3: an invented matrilineal-order claim was rejected; a safe alternative (an observed deviation with no traditional justification claimed) passed. READY_TO_EDIT in every holdout so far.",
  },
  {
    id: "feeding-guests",
    label: "Feeding guests first",
    riskClass: "A",
    culturallyCommonNotSourceVerified: true,
    validatedSafeBaseline:
      "An extra place is customarily kept ready; no claim about a specific doctrinal reason.",
    validationNote:
      "Stress-tested toward TEACHES_FORWARD/QUESTIONS in v1.3: an imported, uncited doctrine (\"atithi devo bhava\") was rejected; a safe alternative (repeating a parent's plain-language reason, no doctrine asserted) passed. READY_TO_EDIT in every holdout so far.",
  },
  {
    id: "kolam",
    label: "Morning kolam",
    riskClass: "B",
    culturallyCommonNotSourceVerified: true,
    validatedSafeBaseline: "A kolam is drawn every morning; no claim about pattern meaning, name, or timing rules.",
    validationNote:
      "Safety Override fired for real in v1.2.1: an invented \"nine-dot pattern\" plus a claimed seasonal restriction were rejected, no safe elaboration above OBSERVED existed, resulting in NEEDS_REVIEW_FOR_SPECIFICITY.",
  },
  {
    id: "diwali-order",
    label: "Diwali lamp order",
    riskClass: "B",
    culturallyCommonNotSourceVerified: true,
    validatedSafeBaseline: "The small lamp is lit in a fixed position in the sequence; no claim about why.",
    validationNote:
      "Caught-and-corrected in both v1.1 and v1.2.1: a drafted \"reason\" was rejected each time; the safe version leaves the question honestly unanswered rather than inventing one. Standing NEEDS_REVIEW for source verification independent of the safety check.",
  },
  {
    id: "choru",
    label: "Choru (first-rice moment)",
    riskClass: "B",
    culturallyCommonNotSourceVerified: true,
    validationNote:
      "First formal test in v1.3: no safe baseline beyond the bare name exists in this program at all, so any receiver action requires inventing who's involved or when it happens. Safety Override fired correctly on first exposure -- NEEDS_REVIEW_FOR_SPECIFICITY, capped at OBSERVED, no CTA.",
  },
];

export function getPracticeSourceUnit(id: string): PracticeSourceUnit | undefined {
  return PRACTICE_SOURCE_LIBRARY.find((u) => u.id === id);
}

/** VALUES-world verified sources -- reuses the existing Aathichoodi canon
 *  (already-verified entries only) plus the existing Kural 200 entry.
 *  Nothing new is asserted as "verified" here; this is a read-only view
 *  over data that already exists elsewhere in this codebase. */
export interface VerifiedValuesSource {
  id: string;
  label: string;
  tamilText: string;
  simpleMeaning: string;
}

export function listVerifiedValuesSources(): readonly VerifiedValuesSource[] {
  const aathichoodiSources: VerifiedValuesSource[] = AATHICHOODI_CANON.filter(
    (e) => e.verified
  ).map((e) => ({
    id: `aathichoodi-${e.episodeNumber}`,
    label: `Aathichoodi ${e.episodeNumber}: ${e.tamilText}`,
    tamilText: e.tamilText,
    simpleMeaning: e.simpleMeaning,
  }));
  const kural200: VerifiedValuesSource = {
    id: "kural-200",
    label: `Thirukkural 200: ${DEFAULT_KURAL_200_CONTENT.tamilLine1}`,
    tamilText: `${DEFAULT_KURAL_200_CONTENT.tamilLine1} ${DEFAULT_KURAL_200_CONTENT.tamilLine2}`,
    simpleMeaning: `${DEFAULT_KURAL_200_CONTENT.englishLine1} ${DEFAULT_KURAL_200_CONTENT.englishLine2}`,
  };
  return [kural200, ...aathichoodiSources];
}

export function getVerifiedValuesSource(id: string): VerifiedValuesSource | undefined {
  return listVerifiedValuesSources().find((s) => s.id === id);
}

/** LANGUAGE and MEMORY briefs typically assert no specific cultural-practice
 *  claim (UNIVERSAL_HUMAN_SCENARIO) and don't require a structured source
 *  pick -- a free-text brief description is the "source" in that case. This
 *  is a deliberate, brief-honored simplification, not an oversight: forcing
 *  a citation pick onto a world that doesn't need one would misrepresent
 *  what those worlds' validated content actually looked like. */
export function worldRequiresStructuredSource(world: WorldId): boolean {
  return world === "VALUES" || world === "PRACTICES";
}
