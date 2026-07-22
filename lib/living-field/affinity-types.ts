/**
 * Living Field — Affinity Types
 * ----------------------------------------------------------------------------
 * Build Sprint 03A (Affinity Engine Specification v1.0).
 *
 * Invisible spatial metadata attached to each glyph after layout generation.
 * Nothing here affects appearance except `breathingOffset`, which the
 * renderer consumes; `neighborhoodId`, `localDensity`, and `affinityStrength`
 * are descriptive only, reserved for future sprints (03B: Natural
 * Distribution).
 */

export interface GlyphAffinity {
  /** Which local neighborhood this glyph primarily belongs to. Deterministic
   *  function of the glyph's position — same layout always produces the
   *  same neighborhood assignments. Not rendered, not exposed in the UI. */
  neighborhoodId: string;

  /** How locally crowded this glyph's position is, normalised.
   *  0.0 = very isolated, 1.0 = locally dense. */
  localDensity: number;

  /** How naturally connected this glyph is to its neighborhood — not
   *  "friendship," a measure of spatial coherence (density + proximity +
   *  how closely it matches its neighborhood's character).
   *  0.0 = weak, 1.0 = strong. */
  affinityStrength: number;

  /** The only affinity property the renderer consumes. A phase offset (in
   *  the same radians used by the existing global breath sine wave) so
   *  glyphs in the same neighborhood breathe in near-unison while different
   *  neighborhoods drift slightly out of phase with each other — never
   *  perceptible as synchronisation, only as a subtle natural rhythm. */
  breathingOffset: number;
}
