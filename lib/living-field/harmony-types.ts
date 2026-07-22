/**
 * Living Field — Emergent Harmony Types
 * ----------------------------------------------------------------------------
 * Build Sprint 03C (Emergent Harmony v1.0).
 *
 * Minimal behavioural metadata the renderer consumes. Per the spec's own
 * instruction ("produce only the minimum behavioural metadata required by
 * the renderer"), this is a single number.
 */

export interface GlyphHarmony {
  /** Multiplies the EXISTING breath amplitude term (config.breathAmplitude)
   *  for this cell -- it does not introduce a new signal, phase, or period.
   *  ~1.0 = no change from Sprint 03A behaviour. A small, bounded spread
   *  around 1.0 (see emergent-harmony.ts) lets glyphs that Affinity already
   *  found to be well-integrated into their neighborhood breathe an
   *  imperceptible touch deeper, and more isolated glyphs an imperceptible
   *  touch shallower -- "nearby things share tiny invisible rhythms"
   *  without any new synchronization, movement, or pattern. */
  amplitudeInfluence: number;
}
