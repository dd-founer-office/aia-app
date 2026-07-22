/**
 * Living Civilization — Optical Weight Calibration v1.0
 * ----------------------------------------------------------------------------
 * A visual calibration pass on top of the existing, unchanged Civilization
 * Engine (Sprint 02) — NOT a new pipeline stage, NOT Sprint 03C. Script
 * SELECTION probabilities, weighting, and everything in field-layout.ts's
 * Civilization Engine logic are untouched by this file. This module only
 * decides how prominently an already-chosen script's glyph should render.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * Opacity and size are currently driven entirely by depth STRATUM, with no
 * awareness of which SCRIPT a glyph belongs to. Vatteluttu and Tamil-Brahmi
 * are hard to discover purely as a side effect of which strata they're
 * statistically more likely to land in (deep/mid), not because of any
 * deliberate visual weighting of the scripts themselves. This module adds
 * that missing per-script weighting, as a multiplier layered on top of the
 * existing stratum-driven opacity/size -- it does not replace or bypass the
 * depth-stratum system, breathing, wave, or affinity math in any way.
 *
 * ---------------------------------------------------------------------------
 * RULE COMPLIANCE (explicit, since several rules are easy to brush against)
 * ---------------------------------------------------------------------------
 * - No colour changes: colour always comes from config.colorRGB, untouched.
 * - No glow, no animation differences, no interaction: not implemented here
 *   or anywhere this module touches.
 * - No outlines: the spec's Design Principles list "stroke-weight
 *   compensation" as an option, but the Rules section separately forbids
 *   "add outlines." Treating Rules as authoritative: Vatteluttu (rendered as
 *   filled vector paths, not text) gets ONLY opacity + size adjustment here,
 *   nothing stroke- or outline-related. Tamil-Brahmi (rendered as real text
 *   glyphs) may get a font-WEIGHT override, which is a heavier variant of
 *   the same glyph shape via the font's own weight axis -- not a decorative
 *   outline -- and degrades harmlessly to the base weight if the fallback
 *   font the glyph renders in doesn't support the requested weight.
 * - Breathing behaviour is untouched: multipliers apply to the FINAL
 *   opacity value after the existing wave/breath computation, never to the
 *   wave or breath math itself. A script's presence differs; its rhythm
 *   does not.
 *
 * ---------------------------------------------------------------------------
 * ON THE TARGET PERCENTAGES (100% / 80-85% / 65-75%)
 * ---------------------------------------------------------------------------
 * These are explicitly "relative design targets, not mathematical rules,"
 * and there's no perceptual-brightness measurement tool in this pipeline to
 * calculate exact multipliers that would hit them precisely. Presets B and C
 * implement the spec's own instruction literally: each is a single, modest
 * "+10-15% over current appearance" step for one script at a time, not a
 * calculated jump straight to the target zone. Getting the FULL field all
 * the way to 80-85% / 65-75% felt presence may take more than one such step
 * -- that's an outcome for founder visual review to judge, not something
 * this module claims to have already solved in one pass.
 */

/** Which registered glyph set (see glyphs.ts) a per-script weight applies
 *  to. Reuses the exact ids already used everywhere else in the Civilization
 *  Engine -- no new taxonomy invented. */
export type ScriptId = "modern-tamil-247" | "tamil-brahmi-24" | "vatteluttu-21";

/** Canonical iteration order, for callers (renderer.ts) that need to loop
 *  over every script deterministically without relying on object-key
 *  ordering. */
export const SCRIPT_IDS: readonly ScriptId[] = [
  "modern-tamil-247",
  "tamil-brahmi-24",
  "vatteluttu-21",
];

export interface ScriptOpticalWeight {
  /** Multiplies the fully-computed (wave+breath+intensity) opacity for
   *  cells of this script. 1.0 = no change from current behaviour. */
  opacityMultiplier: number;
  /** Multiplies the stratum's font size (text) / path scale (Vatteluttu)
   *  for cells of this script. 1.0 = no change from current behaviour. */
  sizeMultiplier: number;
  /** Optional font-weight override for TEXT glyphs of this script only
   *  (modern Tamil, Tamil-Brahmi). Never applied to Vatteluttu, which is
   *  drawn as filled paths, not text -- there is no "weight" to override.
   *  Falls back to config.fontWeight when omitted. */
  fontWeightOverride?: number;
}

export interface OpticalCalibration {
  id: "A" | "B" | "C";
  label: string;
  description: string;
  weights: Record<ScriptId, ScriptOpticalWeight>;
}

const UNCHANGED: ScriptOpticalWeight = { opacityMultiplier: 1, sizeMultiplier: 1 };

/** +12.5% -- the midpoint of the spec's own "+10-15%" instruction for a
 *  single calibration step. */
const STEP_UP: Pick<ScriptOpticalWeight, "opacityMultiplier" | "sizeMultiplier"> = {
  opacityMultiplier: 1.125,
  sizeMultiplier: 1.125,
};

// ---------------------------------------------------------------------------
// Version A -- baseline. Every multiplier is exactly 1.0: mathematically
// identical to current live behaviour. This is the control, not a preset
// that changes anything.
// ---------------------------------------------------------------------------
export const CALIBRATION_A: OpticalCalibration = {
  id: "A",
  label: "Baseline (current implementation)",
  description:
    "No optical weighting applied. Identical to the field as it renders today -- Modern Tamil dominant, Vatteluttu and Tamil-Brahmi difficult to discover.",
  weights: {
    "modern-tamil-247": UNCHANGED,
    "tamil-brahmi-24": UNCHANGED,
    "vatteluttu-21": UNCHANGED,
  },
};

// ---------------------------------------------------------------------------
// Version B -- Vatteluttu +12.5% opacity and size. Modern Tamil and
// Tamil-Brahmi untouched, exactly as the spec specifies for this preset.
// ---------------------------------------------------------------------------
export const CALIBRATION_B: OpticalCalibration = {
  id: "B",
  label: "Vatteluttu +12.5%",
  description:
    "Vatteluttu's opacity and size increased ~12.5% over baseline (spec's +10-15% instruction, midpoint). Modern Tamil and Tamil-Brahmi unchanged from Version A.",
  weights: {
    "modern-tamil-247": UNCHANGED,
    "tamil-brahmi-24": UNCHANGED,
    "vatteluttu-21": { ...STEP_UP },
  },
};

// ---------------------------------------------------------------------------
// Version C -- Tamil-Brahmi +12.5% opacity, size, AND a font-weight bump
// (combining levers, per the spec's own "avoid changing only one property
// if a subtler combination produces a better result"). Vatteluttu retained
// at Version B's level. Modern Tamil unchanged throughout.
// ---------------------------------------------------------------------------
export const CALIBRATION_C: OpticalCalibration = {
  id: "C",
  label: "Vatteluttu +12.5%, Tamil-Brahmi +12.5% + weight",
  description:
    "Builds on Version B: Vatteluttu retained at its Version B level. Tamil-Brahmi's opacity and size increased ~12.5% over baseline AND given a heavier font-weight (500 vs the base 400) as a combined-lever adjustment -- degrades harmlessly to the base weight if the glyph's fallback font doesn't support 500. Modern Tamil unchanged from Version A.",
  weights: {
    "modern-tamil-247": UNCHANGED,
    "tamil-brahmi-24": { ...STEP_UP, fontWeightOverride: 500 },
    "vatteluttu-21": { ...STEP_UP },
  },
};

export const ALL_CALIBRATIONS: readonly OpticalCalibration[] = [
  CALIBRATION_A,
  CALIBRATION_B,
  CALIBRATION_C,
];

/**
 * Which calibration is actually live. Resolved from
 * NEXT_PUBLIC_OPTICAL_CALIBRATION ("A" | "B" | "C") so the three presets can
 * be reviewed on the deployed site by changing one environment variable and
 * redeploying -- no code edits between variants. Defaults to "A" (baseline,
 * safe) if unset or invalid. Mirrors the existing pattern used for
 * NEXT_PUBLIC_LIVING_FIELD_ENABLED in config.ts.
 *
 * Per the spec's explicit instruction, this module does NOT choose a
 * preferred version on its own -- "A" is the safe default until the founder
 * decides, at which point this env var (or this default) is the one place
 * to change to lock in the chosen calibration as v1.1.
 */
function resolveActiveCalibration(): OpticalCalibration {
  const requested = process.env.NEXT_PUBLIC_OPTICAL_CALIBRATION;
  const found = ALL_CALIBRATIONS.find((c) => c.id === requested);
  return found ?? CALIBRATION_A;
}

export const ACTIVE_CALIBRATION: OpticalCalibration = resolveActiveCalibration();

/** Weight lookup with a safe fallback to UNCHANGED for any script id not
 *  present in a given calibration (defensive; every calibration above
 *  covers all three ids, but this keeps callers simple regardless). */
export function getScriptWeight(
  calibration: OpticalCalibration,
  scriptId: ScriptId
): ScriptOpticalWeight {
  return calibration.weights[scriptId] ?? UNCHANGED;
}

/** Applies a script's opacity multiplier to an already-fully-computed
 *  opacity value (post wave/breath/intensity), clamped to a valid alpha
 *  range. Pure function -- independently testable, no canvas needed. */
export function applyOpticalOpacity(baseOpacity: number, weight: ScriptOpticalWeight): number {
  const v = baseOpacity * weight.opacityMultiplier;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Applies a script's size multiplier to a stratum's base font/path size.
 *  Pure function -- independently testable, no canvas needed. */
export function applyOpticalSize(baseSize: number, weight: ScriptOpticalWeight): number {
  return baseSize * weight.sizeMultiplier;
}
