/**
 * Living Field — Configuration
 * ----------------------------------------------------------------------------
 * Single source of truth for every tunable value in the Ambient Letter Field.
 * Build Sprint 01 (Living Language System, Phase 01).
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
 */

/** A depth stratum of the field. All strata use the same glyph set in this
 *  sprint (modern Tamil). Different size + opacity creates the sense that the
 *  field extends beyond the visible interface. */
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

  intensity: 1.0,

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

  strata: [
    // Deepest — small, faint: the field continuing beyond focus.
    { id: "deep", fontSize: 11, baseOpacity: 0.035, waveAmplitude: 0.018, weight: 0.35 },
    // Middle — the v0.6 14px identity size carries the field.
    { id: "mid", fontSize: 14, baseOpacity: 0.05, waveAmplitude: 0.025, weight: 0.45 },
    // Nearest — slightly larger, still restrained.
    { id: "near", fontSize: 16, baseOpacity: 0.07, waveAmplitude: 0.032, weight: 0.2 },
  ],

  frameIntervalMs: 80,

  maxDPR: 2,

  resizeDebounceMs: 200,
};
