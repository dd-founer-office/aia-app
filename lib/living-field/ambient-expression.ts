/**
 * Living Kernel — Ambient Expression Bridge
 * ----------------------------------------------------------------------------
 * The ONLY thing the Ambient Language Layer touches inside the Kernel. It
 * sends a semantic request ("please allow the field to gently express this
 * word") in the form of a grapheme list; this module decides HOW -- finding
 * matching cells in the current layout and giving them a temporary, bounded,
 * opacity-only boost. The Ambient Language Layer never sees any of this
 * math, never touches a cell, and never knows this file exists beyond
 * calling `engine.expressWord(graphemes)`.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ISN'T "INSERTED INTO" THE FIVE-STAGE PIPELINE
 * ---------------------------------------------------------------------------
 * Field Engine, Natural Distribution, Civilization Engine, Affinity Engine,
 * and Harmony Engine all run exactly once per layout build -- a pure
 * function of viewport size, with no concept of "now" beyond the render
 * loop's per-frame `t`. Expression is fundamentally different: it's
 * triggered by an external, asynchronous, application-level event (a user
 * opening the Home screen, a mission completing) at an arbitrary moment,
 * and needs to visibly rise and fall over several seconds of REAL time. It
 * cannot be computed once at layout-build time the way the other five
 * stages are. So it's implemented as a small, on-demand bridge that composes
 * with the renderer's existing multiplicative opacity pipeline -- the same
 * pattern already used to layer Affinity's breathing phase, Harmony's
 * amplitude scale, and Optical Calibration's per-script weight on top of
 * each other -- rather than as a sixth sequential stage.
 *
 * ---------------------------------------------------------------------------
 * WHY OPACITY ONLY, NEVER SIZE, COLOUR, OR MOVEMENT
 * ---------------------------------------------------------------------------
 * Sprint 03C's Absolute Rules forbid moving, rotating, or visibly scaling
 * glyphs, and forbid interfering with Optical Calibration's locked size
 * values. This task's own instruction ("Preserve all existing Living Kernel
 * principles") is read here as: those rules aren't scoped only to the
 * Harmony Engine, they describe the Kernel's overall visual language.
 * Expression therefore uses ONLY the one lever every prior sprint has
 * already established as safe: a temporary multiplier on the fully-computed
 * opacity, after wave/breath/intensity/optical-calibration/harmony have all
 * already been applied. No size change, no colour change, no new motion.
 *
 * ---------------------------------------------------------------------------
 * WHY MATCHING IS BEST-EFFORT, NOT GUARANTEED
 * ---------------------------------------------------------------------------
 * The field only ever displays a small random subset of the registered
 * glyph set at any given moment -- not every possible letter is on screen
 * at once. This module does not force target letters to appear (that would
 * require reaching into Civilization Engine's selection, explicitly
 * forbidden). It only lights up whichever matching letters ALREADY happen
 * to be present. A word may show all of its letters, some of them, or none
 * at all, depending on what the field already contains at that moment --
 * this is the intended behaviour ("discovered rather than constructed"),
 * not a limitation to work around.
 */

import type { FieldCell } from "./field-cell";
import type { GlyphExpression } from "./ambient-expression-types";

/** Total envelope timing, milliseconds. Deliberately slow -- matching the
 *  Kernel's established "the user should almost question whether anything
 *  is moving" philosophy for the rise and fall specifically, so there is no
 *  perceptible "start" or "end" moment, only a gradual presence. */
const RISE_MS = 3000;
const HOLD_MS = 4000;
const FALL_MS = 4000;
const TOTAL_MS = RISE_MS + HOLD_MS + FALL_MS;

/** Peak opacity multiplier at the top of the hold phase. Applied on top of
 *  whatever opacity the cell would already have (base stratum opacity,
 *  wave, breath, intensity, optical calibration, harmony -- all untouched,
 *  all still composing exactly as before). Deliberately more present than
 *  Harmony's ~8% ambient variation (this is meant to be discoverable, not
 *  imperceptible), but still nowhere near a spotlight -- same colour, same
 *  size, same everything else about the glyph. */
const PEAK_OPACITY_MULTIPLIER = 1.7;

function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

/** Returns 0..1: how "expressed" a cell should look at elapsed time
 *  `elapsedMs` since its expression began. 0 = no boost (before start or
 *  after the fall completes), 1 = full boost (during hold). Pure function,
 *  independently testable. */
export function expressionEnvelope01(elapsedMs: number): number {
  if (elapsedMs < 0) return 0;
  if (elapsedMs < RISE_MS) return smoothstep(elapsedMs / RISE_MS);
  if (elapsedMs < RISE_MS + HOLD_MS) return 1;
  const fallElapsed = elapsedMs - RISE_MS - HOLD_MS;
  if (fallElapsed < FALL_MS) return 1 - smoothstep(fallElapsed / FALL_MS);
  return 0;
}

/** Whether an expression that began at `startTime` is still doing anything
 *  at time `t` (i.e. hasn't fully faded out yet). Used by the renderer to
 *  skip the (tiny) extra computation for cells with a long-expired
 *  expression, and usable by callers to know when it's safe to garbage
 *  collect / consider a slot free. */
export function isExpressionActive(startTime: number, t: number): boolean {
  const elapsed = t - startTime;
  return elapsed >= 0 && elapsed < TOTAL_MS;
}

/** The opacity multiplier the renderer applies for a cell's current
 *  expression state at time `t`. Returns exactly 1 (no change whatsoever)
 *  when there is no expression or it has fully ended -- bit-identical to
 *  every prior sprint's behaviour in that case. */
export function computeExpressionOpacityMultiplier(
  expression: GlyphExpression | undefined,
  t: number
): number {
  if (!expression) return 1;
  const elapsed = t - expression.startTime;
  const envelope = expressionEnvelope01(elapsed);
  return 1 + envelope * (PEAK_OPACITY_MULTIPLIER - 1);
}

/** Total duration (ms) of one expression cycle, exposed for callers (the
 *  Ambient Language Layer) that need to know when it's safe to consider an
 *  expression finished for their own overlap-prevention bookkeeping. */
export const EXPRESSION_TOTAL_DURATION_MS = TOTAL_MS;

/**
 * Applies a semantic word-expression request to the current layout: for
 * each grapheme in `graphemes`, finds every cell whose glyph is an exact
 * text match, and starts its expression clock at `startTime`. Cells whose
 * glyph doesn't match any target grapheme are left untouched (any PRIOR
 * expression they had simply continues fading on its own existing
 * schedule -- this function doesn't clear anything).
 *
 * Does not touch position, stratum, script, affinity, or harmony metadata.
 * Does not perform any rendering. Returns the number of cells actually
 * matched, so callers can know whether anything will visibly happen.
 */
export function applyAmbientExpression(
  cells: readonly FieldCell[],
  graphemes: readonly string[],
  startTime: number
): number {
  if (graphemes.length === 0) return 0;
  const targets = new Set(graphemes);
  let matched = 0;
  for (const cell of cells) {
    if (cell.glyph.kind === "text" && targets.has(cell.glyph.value)) {
      cell.expression = { startTime };
      matched++;
    }
  }
  return matched;
}
