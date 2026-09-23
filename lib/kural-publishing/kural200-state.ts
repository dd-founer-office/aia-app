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
 *  arrow, or a label -- position and convergence alone carry the meaning.
 *
 *  Visual Pass 02 emphasis tiers (renderer.ts owns the actual styling):
 *   - component: ச், ஒ, ல் -- sit at ordinary ambient-field weight,
 *     findable only because they're consistently there, not because
 *     they're shouted.
 *   - formed: சொ -- the first resolved shape, modestly more present.
 *   - emerging: சொல் -- clearer still, but stays part of the Living Layer,
 *     never rendered as a heading.
 *   - selected: பயன் -- not built from visible components at all (no
 *     decomposition was confidently known, so none was invented); rendered
 *     softly, as something that survived rather than something constructed.
 *
 *  Formation Pass 06: ல் added as its own component node -- சொ + ல் -> சொல்
 *  is the second real formation the renderer grows an organic root family
 *  toward (see publishing-renderer.ts). பயன் remains deliberately
 *  disconnected from any Formation Path -- it is a semantic survivor, not
 *  something சொல் linguistically forms. Rendering only ever links சொல் and
 *  பயன் via a diffuse Semantic Trace, never a Formation Path -- see the
 *  renderer's own distinction between the two. */
export interface FormationNode {
  id: string;
  glyph: string;
  x: number;
  y: number;
  emphasis: "component" | "formed" | "emerging" | "selected";
}

export interface FormationPath {
  fromId: string;
  toId: string;
}

/** GOLD MASTER, explicit founder-authorized architectural change: the six
 *  Formation Nodes (ச்/ஒ/ல்/சொ/சொல்/பயன் and their positions) used to be
 *  hardcoded here, specifically for Kural 200. That meant switching to any
 *  other Kural still rendered Kural-200-specific glyphs (சொல், பயன்) that
 *  had nothing to do with the loaded content -- confirmed directly against
 *  a Kural 517 render, which showed exactly this. FORMATION_NODES and
 *  FORMATION_PATHS are no longer exported from this file. They are now
 *  derived per-render from whatever content is actually loaded -- see
 *  deriveFormationNodes / deriveFormationPaths in publishing-renderer.ts,
 *  which builds an analogous two-component-merge-then-extend story (the
 *  same shape ச்+ஒ->சொ->சொல் always had) from the real first word of
 *  whichever Kural is current, using the same grapheme/atomic-decomposition
 *  machinery already used elsewhere in that file. The FormationNode /
 *  FormationPath types above are unchanged and still the shared contract
 *  between the two files. */

/** Spatial regions as fractions of canvas width.
 *   0 -> denseEnd:            sustained abundance -- density stays high,
 *                              only gently easing (the "linguistic world").
 *   denseEnd -> transitionEnd: connection -> formation -> selection --
 *                              density genuinely falls, Formation Paths and
 *                              the root-filament texture live here.
 *   transitionEnd (= quietStart) -> edge: near-silence, not silence.
 *
 *  GOLD MASTER SPRINT 02: there is no longer a "field zone" separate from
 *  a "text zone." The field IS the canvas -- language dissolving across
 *  the ENTIRE width, continuing (very faintly, never at exactly zero)
 *  even behind and past the Kural itself. quietStart no longer means
 *  "structural silence, zero glyphs ever" -- baseFalloff() in the
 *  renderer is a pure continuous decay with no hard floor built in
 *  anywhere in this file anymore. These three numbers now only govern
 *  the SHAPE of the resolution curve (macro cluster reach, how quickly
 *  large/prominent forms suppress, how quickly Kural-material bias ramps
 *  in) -- not a boundary anything gets clipped at. */
export const REGIONS = {
  denseEnd: 0.28,
  transitionEnd: 0.97,
  quietStart: 0.97,
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
