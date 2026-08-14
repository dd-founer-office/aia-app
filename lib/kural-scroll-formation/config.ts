/**
 * Kural Scroll Formation — Configuration
 * ----------------------------------------------------------------------------
 * Single source of truth for this feature's tunables. Isolated from
 * lib/living-field/config.ts entirely (see segment.ts's header for why) --
 * but several values below are intentionally DUPLICATED SNAPSHOTS of that
 * file's current calibration (colorRGB, fontFamilyFallback, fontWeight,
 * wavePhaseCol/Row, waveSpeed, breathPeriodMs, breathAmplitude, intensity),
 * not live-linked. The founder's brief for this feature is that it must
 * "feel naturally formed from the same ambient Tamil Living Language Field
 * -- not like separate text appearing over the field." Copying today's
 * exact values (rather than importing them) achieves that visual identity
 * while keeping zero code coupling to the locked Kernel, same as
 * reserved-verse-bridge.ts duplicating Intl.Segmenter logic instead of
 * exporting it across the boundary. If lib/living-field/config.ts's
 * calibration ever changes, this file's snapshot will silently drift --
 * that's an accepted tradeoff of isolation, not an oversight.
 *
 * Revision 2 (founder-directed): moved from a viewport-fixed overlay to a
 * normal in-page block sitting right after Shared Acts of Aram, and added
 * a crossfade handoff to real, natively-rendered text once formation
 * completes -- hand-placed animated glyphs can only ever approximate real
 * Tamil text shaping, never match it exactly, so the fully-formed state now
 * IS real text, not more hand-placed spans.
 */

/** The verse this feature currently forms. */
export const KKA_001_RAW = "அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு";

export const KURAL_SCROLL_FORMATION_CONFIG = {
  /** Single fixed font size for every animated glyph, scattered or
   *  converging. Locked visual language: "Tamil glyphs remain fixed in
   *  scale and orientation" -- only opacity and position ever animate,
   *  never size or rotation. The real, native-text final state (below) has
   *  its own, separately-set size, since it's a different rendering
   *  mechanism entirely, not one of these animated glyphs. */
  fontSizePx: 15,

  /** Duplicated snapshot of the real field's typography + color, so these
   *  letters read as the same species of glyph as the background. */
  colorRGB: [50, 141, 99] as const, // --color-primary / #328D63, locked
  fontFamilyFallback:
    "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif",
  fontWeight: 400,

  /** Container the whole feature lives in -- a normal block in the page
   *  flow, directly after Shared Acts of Aram, not a viewport-fixed
   *  overlay. Reserves real vertical space so the page's layout doesn't
   *  jump once JS mounts. */
  container: {
    heightPx: 260,
  },

  /** Approximate target position for each animated glyph as it converges --
   *  intentionally APPROXIMATE, not pixel-identical to how a browser would
   *  natively shape and kern this exact text. That's fine: in the final
   *  ~15% of convergence these animated glyphs crossfade into the real,
   *  natively-rendered text (see realText below), which is what's actually
   *  read -- the animated layer's job is only to sell the "arriving"
   *  motion, not to BE the legible result. Coordinates are relative to the
   *  container's own box, not the viewport. */
  approxFormed: {
    horizontalMarginPx: 20,
    topOffsetPx: 90,
    letterAdvancePx: 13,
    wordGapPx: 11,
    lineGapPx: 24,
  },

  /** The real, natively-rendered verse text -- what the person actually
   *  reads once formation completes. Ordinary text, not animated spans, so
   *  it reads exactly like any other correctly-shaped Tamil text in the
   *  app. Positioned to visually line up with approxFormed above so the
   *  crossfade doesn't jump. */
  realText: {
    topOffsetPx: 90,
    horizontalMarginPx: 20,
    fontSizePx: 19,
    lineHeight: 1.5,
  },

  /** Scatter (ambient) positions: random, regenerated once per mount,
   *  within these container-fraction bounds (relative to the container's
   *  own width/height, not the viewport) -- kept within this section's own
   *  box rather than spanning the whole page. */
  scatter: {
    xMinFrac: 0.04,
    xMaxFrac: 0.94,
    yMinFrac: 0.04,
    yMaxFrac: 0.92,
  },

  /** Ambient shimmer -- duplicated snapshot of the real field's "near"
   *  stratum + wave + breathing formula (config.ts's strata[2], wavePhase*,
   *  waveSpeed, breathPeriodMs, breathAmplitude, intensity), so scattered
   *  letters shimmer identically to the real background field. This
   *  shimmer's influence fades out naturally as convergence proceeds (its
   *  weight in the opacity blend shrinks to zero at full formation) --
   *  letters visibly calm down as they resolve. */
  ambientShimmer: {
    baseOpacity: 0.07,
    waveAmplitude: 0.032,
    wavePhaseCol: 0.14,
    wavePhaseRow: 0.1,
    waveSpeed: 0.00009,
    breathPeriodMs: 45000,
    breathAmplitude: 0.08,
    intensity: 2.5,
    /** Approximate cell size used only to derive a col/row phase per glyph
     *  from its scattered pixel position -- matches the real field's grid
     *  metrics so the diagonal sweep reads at the same visual cadence. */
    cellWidth: 60,
    cellHeight: 40,
  },

  /** Formation lifecycle. Convergence is driven by how far this SECTION
   *  has scrolled into view (its own bounding box vs the viewport), not
   *  the whole page's scroll fraction -- forms as you scroll to it, not
   *  only once you reach the very bottom of the page. After full
   *  convergence the cycle is time-driven (hold, then dissolve),
   *  independent of further scroll position, until the person scrolls
   *  back up far enough to re-arm it. */
  lifecycle: {
    /** Fraction of the viewport's height, measured from the top of the
     *  viewport, that the container's own top edge must cross to define
     *  the start (0) and end (1) of the convergence range. E.g. entryFrac
     *  1.0 = container's top is exactly at the bottom of the screen (just
     *  entering); exitFrac 0.35 = container's top has scrolled up to 35%
     *  down the screen (comfortably in view, "arrived"). */
    entryViewportFrac: 1.0,
    exitViewportFrac: 0.35,
    /** Local progress (0-1, within the entry/exit range above) at which
     *  convergence is considered "complete" and the hold phase begins. */
    formationTriggerThreshold: 0.995,
    /** Local progress below which the cycle re-arms (scrolling the section
     *  back out of its "arrived" position resets things, and also
     *  interrupts an in-progress hold/dissolve). */
    retriggerResetThreshold: 0.85,
    /** How long the fully-formed verse holds before it starts dissolving,
     *  even if the person stays scrolled at this section. */
    holdMs: 3200,
    /** Duration of the dissolve-back-into-the-field animation. */
    dissolveMs: 1600,
    /** Portion of the FINAL approach to formation (displayT range) during
     *  which the animated glyphs crossfade into the real, natively-shaped
     *  text -- e.g. 0.85 means the crossfade runs across displayT
     *  0.85 -> 1.0. */
    crossfadeStartT: 0.85,
    /** Minimum ms between recomputed frames -- matches the real field's own
     *  frameIntervalMs philosophy (motion is slow by design; repainting
     *  faster than this burns battery for imperceptible change). */
    frameIntervalMs: 80,
  },

  /** Eases the scroll-driven approach to formation: fast start, gentle
   *  settle, no overshoot (Visual Constitution: no bounce). */
  easeConverge: (t: number): number => 1 - Math.pow(1 - t, 3),
  /** Eases the time-driven dissolve back to scatter: gentle start,
   *  accelerating release -- mirror curve of easeConverge. */
  easeDissolve: (t: number): number => Math.pow(t, 3),
} as const;
