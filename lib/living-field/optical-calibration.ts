/**
 * Living Civilization — Optical Weight Calibration
 * ----------------------------------------------------------------------------
 * STATUS: LOCKED — Living Civilization v1.1
 *
 * Optical Weight Calibration v1.0 evaluated three visual presets (A: the
 * pre-calibration baseline, B: Vatteluttu boosted, C: Vatteluttu + Tamil-
 * Brahmi boosted) via founder live review on the deployed site. Version C
 * was selected as the permanent calibration. This file now bakes that
 * decision in directly — the evaluation mechanism (environment-variable
 * switching between A/B/C) has been removed; there is exactly one profile,
 * always active, no configuration required.
 *
 * A visual calibration on top of the existing, unchanged Civilization
 * Engine (Sprint 02) — NOT a new pipeline stage. Script SELECTION
 * probabilities, weighting, and everything in field-layout.ts's
 * Civilization Engine logic remain untouched by this file, exactly as
 * before locking. This module only decides how prominently an
 * already-chosen script's glyph renders.
 *
 * ---------------------------------------------------------------------------
 * RULE COMPLIANCE (unchanged since v1.0, restated for the locked version)
 * ---------------------------------------------------------------------------
 * - No colour changes: colour always comes from config.colorRGB, untouched.
 * - No glow, no animation differences, no interaction.
 * - No outlines: Vatteluttu (filled vector paths, not text) gets ONLY
 *   opacity + size adjustment. Tamil-Brahmi (real text glyphs) gets a
 *   font-WEIGHT override — a heavier variant of the same glyph via the
 *   font's own weight axis, not a decorative outline — which degrades
 *   harmlessly to the base weight if the glyph's fallback font doesn't
 *   support the requested weight.
 * - Breathing behaviour is untouched: the multiplier applies to the FINAL
 *   opacity value after the existing wave/breath computation, never to the
 *   wave or breath math itself.
 */

/** Which registered glyph set (see glyphs.ts) a per-script weight applies
 *  to. Reuses the exact ids already used everywhere else in the
 *  Civilization Engine -- no new taxonomy invented. */
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
   *  cells of this script. 1.0 = no adjustment. */
  opacityMultiplier: number;
  /** Multiplies the stratum's font size (text) / path scale (Vatteluttu)
   *  for cells of this script. 1.0 = no adjustment. */
  sizeMultiplier: number;
  /** Optional font-weight override for TEXT glyphs of this script only.
   *  Never applied to Vatteluttu, which is drawn as filled paths, not
   *  text -- there is no "weight" to override. Falls back to
   *  config.fontWeight when omitted. */
  fontWeightOverride?: number;
}

export interface OpticalCalibration {
  id: string;
  label: string;
  description: string;
  weights: Record<ScriptId, ScriptOpticalWeight>;
}

const UNCHANGED: ScriptOpticalWeight = { opacityMultiplier: 1, sizeMultiplier: 1 };

/**
 * LOCKED — Living Civilization v1.1. Selected as "Version C" during
 * founder review of the three evaluated presets. Vatteluttu and
 * Tamil-Brahmi both receive a +12.5% opacity/size increase over the
 * pre-calibration baseline; Tamil-Brahmi additionally renders at font-
 * weight 500 (vs. the base 400). Modern Tamil is unchanged.
 */
export const LIVING_CIVILIZATION_V1_1: OpticalCalibration = {
  id: "v1.1",
  label: "Living Civilization v1.1 (locked, formerly Version C)",
  description:
    "Founder-selected permanent calibration. Vatteluttu and Tamil-Brahmi opacity/size increased ~12.5% over the pre-calibration baseline; Tamil-Brahmi additionally rendered at font-weight 500. Modern Tamil unchanged.",
  weights: {
    "modern-tamil-247": UNCHANGED,
    "tamil-brahmi-24": { opacityMultiplier: 1.125, sizeMultiplier: 1.125, fontWeightOverride: 500 },
    "vatteluttu-21": { opacityMultiplier: 1.125, sizeMultiplier: 1.125 },
  },
};

/**
 * The single active calibration. Always `LIVING_CIVILIZATION_V1_1` — no
 * environment variable, no runtime branching. Kept as a named export
 * (rather than having callers import `LIVING_CIVILIZATION_V1_1` directly)
 * so renderer.ts did not need to change at all when this was locked, and
 * so a future re-calibration only ever requires changing this one line.
 */
export const ACTIVE_CALIBRATION: OpticalCalibration = LIVING_CIVILIZATION_V1_1;

/** Weight lookup with a safe fallback to UNCHANGED for any script id not
 *  present in a given calibration (defensive; the locked calibration
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
