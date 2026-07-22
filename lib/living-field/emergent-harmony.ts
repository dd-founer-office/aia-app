/**
 * Living Field — Emergent Harmony Engine
 * ----------------------------------------------------------------------------
 * Build Sprint 03C (Emergent Harmony v1.0).
 *
 * Runs once per layout build, AFTER the Affinity Engine (it consumes
 * affinity metadata) and BEFORE the renderer. Never runs per animation
 * frame. Produces exactly one number per cell -- see harmony-types.ts.
 *
 * ---------------------------------------------------------------------------
 * THE CORE DESIGN DECISION
 * ---------------------------------------------------------------------------
 * Every constraint in this sprint's spec rules out a new signal: no
 * movement, no rotation, no visible scaling (Optical Calibration is
 * locked), no colour, no typography, and explicitly no new global phase,
 * wave, or pulse. The only lever left untouched by every prior sprint is
 * the DEPTH of each cell's existing breathing -- not its phase (Affinity's
 * exclusive territory, per "do not modify... Affinity Engine") and not its
 * base opacity (the wave system's). So Harmony's entire job is: scale the
 * existing breath-amplitude term, per cell, by a small, bounded amount.
 *
 * Where does that per-cell number come from, without a new spatial search?
 * The Affinity Engine already computed `localDensity` and
 * `affinityStrength` for every cell -- continuous, smoothly-varying
 * (verified statistically in Sprint 03A: no hard block boundaries),
 * and already informed by real neighbours (affinityStrength itself blends
 * density, nearest-neighbour proximity, and neighborhood coherence). Harmony
 * is a cheap, deterministic REMAP of those two already-computed numbers into
 * one multiplier -- meaning genuine neighbour-influence is inherited for
 * free from Affinity's own math, with zero new neighbour searches, zero new
 * randomness, and O(1) cost per cell.
 *
 * This is also why the result can never read as a "pattern": it has no
 * period, no direction, and no shared reference point across cells --
 * it's a static per-cell scalar derived from continuous underlying fields,
 * not a new oscillator.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS CAN'T BE PERCEIVED AS SYNCHRONIZATION
 * ---------------------------------------------------------------------------
 * The spread is deliberately tiny (±8%, matching the base breathAmplitude's
 * own magnitude -- a "second-order" subtlety: 8% of an already-8%-of-opacity
 * effect). Two neighbouring cells' breathing still happens at the same
 * phase (Affinity's neighborhood-phase system, untouched) and the same
 * period (config.breathPeriodMs, untouched) -- only how DEEP each one dips
 * differs, by an amount too small to consciously register. Nothing here
 * introduces a new rhythm; it only lets an already-invisible rhythm vary in
 * intensity by an amount smaller than the rhythm itself.
 */

import type { FieldCell } from "./field-layout";
import type { GlyphHarmony } from "./harmony-types";

/** Max deviation from 1.0, in either direction. Deliberately small --
 *  "users must never perceive... synchronization." Matches the base
 *  breathAmplitude's own magnitude (0.08) by design, not coincidence: this
 *  keeps Harmony's effect a subtlety-on-a-subtlety, never a first-order
 *  visual signal. Not exposed via config yet -- an internal constant,
 *  same pattern as affinity-engine.ts's and natural-distribution.ts's own
 *  internal tuning constants. */
const AMPLITUDE_SPREAD = 0.08;

/** Relative weight of affinityStrength vs. localDensity in the blend below.
 *  affinityStrength already incorporates density, proximity, and
 *  neighborhood coherence, so it carries most of the weight; localDensity
 *  is folded in lightly for a touch of independent variation rather than
 *  making the two signals redundant with each other. */
const AFFINITY_STRENGTH_WEIGHT = 0.7;
const LOCAL_DENSITY_WEIGHT = 0.3;

/**
 * Computes one cell's amplitude influence from its own (already-computed,
 * already-neighbour-informed) affinity fields. Pure function -- no cell
 * lookups, no iteration, independently testable without a full layout.
 */
export function computeAmplitudeInfluence(localDensity: number, affinityStrength: number): number {
  const centeredStrength = affinityStrength - 0.5; // now in [-0.5, 0.5]
  const centeredDensity = localDensity - 0.5; // now in [-0.5, 0.5]
  const blended = centeredStrength * AFFINITY_STRENGTH_WEIGHT + centeredDensity * LOCAL_DENSITY_WEIGHT;
  // blended is in [-0.5, 0.5] (weights sum to 1); scale into
  // [1 - AMPLITUDE_SPREAD, 1 + AMPLITUDE_SPREAD].
  return 1 + blended * 2 * AMPLITUDE_SPREAD;
}

/**
 * Attaches `harmony` to every cell that has affinity metadata, in place.
 * Cells without affinity (shouldn't happen once engine.ts's pipeline runs
 * in order, but defensive rather than throwing) are simply left without
 * harmony -- the renderer already defaults amplitudeInfluence to 1 (no
 * change) when harmony is absent, exactly mirroring how it defaults
 * breathingOffset to 0 when affinity is absent.
 *
 * O(n): one cheap arithmetic remap per cell, no neighbour lookups, no
 * allocations beyond the one small object per cell. Runs once per layout
 * build, never per animation frame.
 */
export function applyEmergentHarmony(cells: readonly FieldCell[]): void {
  for (const cell of cells) {
    const affinity = cell.affinity;
    if (!affinity) continue;

    const amplitudeInfluence = computeAmplitudeInfluence(
      affinity.localDensity,
      affinity.affinityStrength
    );

    const harmony: GlyphHarmony = { amplitudeInfluence };
    cell.harmony = harmony;
  }
}
