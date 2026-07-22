/**
 * Living Kernel — Ambient Expression Types
 * ----------------------------------------------------------------------------
 * Kernel-side bridge for the Ambient Language Layer's semantic requests.
 * This is NOT a seventh pipeline stage in the sense of Field/NaturalDist/
 * Civilization/Affinity/Harmony -- those five run once per layout build,
 * purely as a function of viewport size. Expression is event-driven and
 * time-bounded (triggered by an external semantic request, rises/holds/
 * falls over several seconds), so it sits alongside the five-stage
 * pipeline rather than being spliced into its sequence. See
 * ambient-expression.ts and AmbientLanguageLayer.md for the full reasoning.
 */

export interface GlyphExpression {
  /** When this cell's expression began, in the SAME clock as the
   *  renderer's `t` (both are DOMHighResTimeStamp / performance.now()-based),
   *  so `t - startTime` gives elapsed time directly. Duration, rise/hold/
   *  fall timing, and peak magnitude are Kernel-side constants
   *  (ambient-expression.ts), not per-instance metadata -- keeping this
   *  "minimum metadata" per the Kernel's own established pattern. */
  startTime: number;
}
