/**
 * Kural Publishing — Kural 200 Living State (MVP)
 * ----------------------------------------------------------------------------
 * Hardcoded for Issue #25 / Kural 200 only, per today's one-day MVP scope.
 * Not a general semantic engine -- a future Kural gets its own state, not a
 * parameterisation of this one. See LivingKernelArchitecture.md's own
 * precedent for why "hardcode today, generalise later, deliberately" is an
 * acceptable engineering choice here, not a shortcut to apologise for.
 *
 * LINGUISTIC TRUTH: every formation below is a real Tamil relationship
 * (ச் + ஒ -> சொ is a standard consonant+vowel-sign formation; சொ -> சொல் is
 * that same syllable extending into the actual word that opens the Kural).
 * Nothing here is invented for visual effect. Where a further decomposition
 * (e.g. how பயன் itself forms) was not confidently known, it was left as a
 * single discoverable word rather than guessed -- per the brief's own rule.
 */

export interface KuralPublishingContent {
  /** Free-text as shown in the control panel, e.g. "25/90". Kept as one
   *  field (not split into issue/total) because that is exactly how the
   *  brief specifies the control panel input. */
  issue: string;
  series: string;
  kuralNumber: string;
  tamilLine1: string;
  tamilLine2: string;
  englishLine1: string;
  englishLine2: string;
}

export const DEFAULT_KURAL_200_CONTENT: KuralPublishingContent = {
  issue: "25/90",
  series: "Thozhil Aram",
  kuralNumber: "200",
  tamilLine1: "சொல்லுக சொல்லிற் பயனுடைய சொல்லற்க",
  tamilLine2: "சொல்லிற் பயனிலாச் சொல்.",
  englishLine1: "SAY WHAT MOVES THINGS FORWARD.",
  englishLine2: "NOT EVERYTHING NEEDS TO BE SAID.",
};

/** A node in the Formation Path graph -- a glyph, a fixed spatial position
 *  (fraction of canvas width/height, so it holds at any output size), and
 *  how visually present it should be. Never rendered with a plus sign, an
 *  arrow, or a label -- position and convergence alone carry the meaning. */
export interface FormationNode {
  id: string;
  glyph: string;
  x: number;
  y: number;
  emphasis: "component" | "formed" | "discoverable";
}

export interface FormationPath {
  fromId: string;
  toId: string;
}

export const FORMATION_NODES: readonly FormationNode[] = [
  { id: "c-ch", glyph: "ச்", x: 0.335, y: 0.36, emphasis: "component" },
  { id: "c-o", glyph: "ஒ", x: 0.335, y: 0.6, emphasis: "component" },
  { id: "f-cho", glyph: "சொ", x: 0.465, y: 0.48, emphasis: "formed" },
  { id: "f-chol", glyph: "சொல்", x: 0.585, y: 0.44, emphasis: "discoverable" },
  { id: "f-payan", glyph: "பயன்", x: 0.565, y: 0.665, emphasis: "discoverable" },
];

export const FORMATION_PATHS: readonly FormationPath[] = [
  { fromId: "c-ch", toId: "f-cho" },
  { fromId: "c-o", toId: "f-cho" },
  { fromId: "f-cho", toId: "f-chol" },
];

/** Spatial regions as fractions of canvas width. Left of `denseEnd` is the
 *  dense ambient field; between `denseEnd` and `transitionEnd` density
 *  tapers to zero and the Formation Paths live; at and beyond `quietStart`
 *  no ambient glyph is ever drawn -- the silence is structural, not a
 *  low-opacity approximation of silence. */
export const REGIONS = {
  denseEnd: 0.42,
  transitionEnd: 0.62,
  quietStart: 0.62,
} as const;

/** Derives the deterministic layout seed from the Kural number, per the
 *  brief: "For today's MVP derive the seed from: 200." Falls back to 200
 *  if the field is ever emptied or non-numeric in the control panel. */
export function deriveSeed(kuralNumber: string): number {
  const n = parseInt(kuralNumber, 10);
  return Number.isFinite(n) && n > 0 ? n : 200;
}

/** Pulls the leading number out of a free-text issue field like "25/90" for
 *  use in the export filename. Falls back to "0" rather than throwing if
 *  the field has been edited into something unparseable. */
export function deriveIssueNumber(issue: string): string {
  const match = issue.match(/\d+/);
  return match ? match[0] : "0";
}
