/**
 * Living Field — Configuration
 * ----------------------------------------------------------------------------
 * Single source of truth for every tunable value in the Ambient Letter Field.
 * Build Sprint 01 (Living Language System, Phase 01) established the base
 * rendering system; Build Sprint 02 (Living Civilization Layer v1.0) extends
 * it with multi-script depth. All Sprint 01 values below are unchanged.
 *
 * Design lineage: Ambient Letter Field Concept v0.6 (locked visual foundation).
 * Preserved identity: single primary green, uniform small letters, diagonal
 * brightness wave, clustered organic scatter, mint background showing through.
 *
 * Intentional recalibration vs the v0.6 prototype:
 * v0.6 rendered at 0.55 ± 0.35 opacity because it lived on an empty page.
 * Inside the application the field is atmosphere, not subject — opacities are
 * therefore an order of magnitude lower (Interaction Grammar Rule 3: ambient
 * letters live in the low single-digit opacity band). `intensity` below is the
 * one master knob for tuning this in review.
 *
 * Sprint 02 — civilization depth:
 * Modern Tamil, Tamil-Brahmi, and Vatteluttu are not three separate features;
 * they are three moments of one continuous civilization. Depth encodes time,
 * not importance. `civilizationAge` (below) names the overall tuning point;
 * each stratum's `scriptWeights` is the concrete table currently calibrated
 * against it. All scripts render through the identical code path in
 * renderer.ts — same color, same opacity, same size-per-stratum. Only the
 * letterforms differ.
 */

import { ACTIVE_INTENSITY } from "./intensity-calibration";

/** Relative weight of one registered glyph set (see glyphs.ts) within a
 *  stratum's script mix. Weights are normalised at pick-time, so they don't
 *  need to sum to 1 — e.g. {35, 65} and {0.35, 0.65} behave identically. */
export interface ScriptWeight {
  /** GlyphSet id, as registered in glyphs.ts (e.g. "modern-tamil-247"). */
  setId: string;
  weight: number;
}

/** A depth stratum of the field. Different size + opacity creates the sense
 *  that the field extends beyond the visible interface; different
 *  `scriptWeights` per stratum is what makes older writing feel like it
 *  naturally lives deeper, rather than being scattered at random. */
export interface FieldStratum {
  /** Identifier for debugging / future inspector overlay. */
  id: string;
  /** Font size in CSS px. Keep ≤ 16 so the widest uyirmei compounds
   *  (e.g. ணௌ, ~50px @ 14px) stay inside the 60px cell. */
  fontSize: number;
  /** Resting opacity before wave + breath modulation. */
  baseOpacity: number;
  /** Diagonal-wave amplitude added on top of baseOpacity. */
  waveAmplitude: number;
  /** Probability weight when assigning cells to strata. */
  weight: number;
  /** Script mix for this stratum. Omit for 100% modern Tamil (Sprint 01
   *  behaviour, still the default so existing strata configs remain valid
   *  without modification). */
  scriptWeights?: readonly ScriptWeight[];
}

export interface LivingFieldConfig {
  /** Kill switch. The application must be fully constitutional without the
   *  field. Controlled via NEXT_PUBLIC_LIVING_FIELD_ENABLED ("false" disables);
   *  defaults to enabled. */
  enabled: boolean;

  /** Master opacity multiplier applied after all modulation. The single knob
   *  for "more present" / "more recessive" during review. 1.0 = shipped
   *  calibration. */
  intensity: number;

  /** Letter colour — primary green, locked Visual Constitution. Never varies. */
  colorRGB: readonly [number, number, number];

  /** Font stack for canvas rendering. Resolved at runtime from the app's
   *  --font-tamil-sans variable when available (see LivingField component);
   *  this is the fallback chain. No new fonts are introduced in this sprint. */
  fontFamilyFallback: string;
  fontWeight: number;

  /** Grid metrics (from v0.6): cell sized to clear the widest real compound
   *  at the largest stratum size — measured, not estimated. */
  cellWidth: number;
  cellHeight: number;

  /** Cluster scatter (from v0.6): runs of letters separated by irregular
   *  gaps, so the field respects whitespace instead of filling a grid. */
  clusterGapMin: number; // inclusive
  clusterGapMax: number; // exclusive
  clusterLenMin: number; // inclusive
  clusterLenMax: number; // exclusive

  /** Diagonal brightness wave (formula unchanged from v0.6). */
  wavePhaseCol: number;
  wavePhaseRow: number;
  waveSpeed: number;

  /** Global breathing: an extremely slow, low-amplitude opacity swell across
   *  the whole field. Field time, not interface time (Two Clocks). The user
   *  should almost question whether anything is moving. */
  breathPeriodMs: number;
  breathAmplitude: number; // fraction of current opacity, e.g. 0.08 = ±8%

  /** Depth strata, deepest first. */
  strata: readonly FieldStratum[];

  /** Named tuning point for how much of the field's script mix leans
   *  ancient vs. modern, overall. 0.0 = pure modern Tamil everywhere;
   *  1.0 = maximally ancient. This is NOT a visual animation and does not
   *  change at runtime — it's documentation of what the `scriptWeights`
   *  tables below are currently calibrated against, and the single value a
   *  future sprint would reference if those tables become a derived
   *  function instead of hand-set constants. Sprint 02 ships at 0.45. */
  civilizationAge: number;

  /** Minimum ms between canvas repaints. Motion is slow by design; repainting
   *  faster than this burns battery for imperceptible change. RAF-driven, so
   *  frames never jank or tear. */
  frameIntervalMs: number;

  /** Device pixel ratio cap (from v0.6). */
  maxDPR: number;

  /** Debounce for rebuild-on-resize. */
  resizeDebounceMs: number;
}

export const LIVING_FIELD_CONFIG: LivingFieldConfig = {
  enabled: process.env.NEXT_PUBLIC_LIVING_FIELD_ENABLED !== "false",

  // TEMPORARY for review — was 1.0. At 1.0 the field was confirmed rendering
  // correctly (canvas paints real pixels at the right color) but at alpha
  // values too low to survive a phone screenshot's compression. Bumped to
  // 3.5 so it's clearly visible for review; dial back down once confirmed.
  // TEMPORARY -- Living Field Foundation Completion v1.0, Part 2. Was a
  // hardcoded 3.5 (Sprint 01's "make sure you can see it" review value).
  // Now resolved from intensity-calibration.ts's three founder-review
  // candidates (A=2.8, B=2.5, C=2.2) via NEXT_PUBLIC_INTENSITY_CANDIDATE.
  // Once a candidate is selected, replace this with that single number as
  // a plain literal and delete intensity-calibration.ts -- same pattern as
  // optical-calibration.ts's evaluation-to-locked transition.
  intensity: ACTIVE_INTENSITY,

  colorRGB: [50, 141, 99], // #328D63

  fontFamilyFallback:
    "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif",
  fontWeight: 400,

  cellWidth: 60,
  cellHeight: 40,

  clusterGapMin: 2,
  clusterGapMax: 8,
  clusterLenMin: 1,
  clusterLenMax: 5,

  wavePhaseCol: 0.14,
  wavePhaseRow: 0.1,
  waveSpeed: 0.00009,

  breathPeriodMs: 45000,
  breathAmplitude: 0.08,

  civilizationAge: 0.45,

  strata: [
    // Deep — ancient memory. 70% Vatteluttu / 30% Tamil-Brahmi. No modern
    // Tamil at this depth: this is where the oldest layer lives.
    {
      id: "deep",
      fontSize: 11,
      baseOpacity: 0.035,
      waveAmplitude: 0.018,
      weight: 0.35,
      scriptWeights: [
        { setId: "vatteluttu-21", weight: 0.7 },
        { setId: "tamil-brahmi-24", weight: 0.3 },
      ],
    },
    // Middle — history begins appearing naturally. 65% modern / 35% Brahmi.
    {
      id: "mid",
      fontSize: 14,
      baseOpacity: 0.05,
      waveAmplitude: 0.025,
      weight: 0.45,
      scriptWeights: [
        { setId: "modern-tamil-247", weight: 0.65 },
        { setId: "tamil-brahmi-24", weight: 0.35 },
      ],
    },
    // Near — today's living language. 100% modern Tamil.
    {
      id: "near",
      fontSize: 16,
      baseOpacity: 0.07,
      waveAmplitude: 0.032,
      weight: 0.2,
      scriptWeights: [{ setId: "modern-tamil-247", weight: 1.0 }],
    },
  ],

  frameIntervalMs: 80,

  maxDPR: 2,

  resizeDebounceMs: 200,
};
