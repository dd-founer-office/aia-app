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
 */

/** The verse this feature currently forms. */
export const KKA_001_RAW = "அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு";

export const KURAL_SCROLL_FORMATION_CONFIG = {
  /** Single fixed font size for every glyph, scattered or formed. Locked
   *  visual language: "Tamil glyphs remain fixed in scale and orientation"
   *  -- only opacity and position ever animate, never size or rotation. */
  fontSizePx: 15,

  /** Duplicated snapshot of the real field's typography + color, so these
   *  letters read as the same species of glyph as the background. */
  colorRGB: [50, 141, 99] as const, // --color-primary / #328D63, locked
  fontFamilyFallback:
    "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif",
  fontWeight: 400,

  /** Formed (final) position: a fixed viewport-space rectangle, left-
   *  aligned, anchored near the bottom of the screen, clear of
   *  BottomNavigation. Same left-aligned / 4-word-then-3-word convention as
   *  the locked Kural display rule everywhere else in the app. */
  formed: {
    horizontalMarginPx: 24,
    /** Distance from the viewport's bottom edge to the last line's row,
     *  clearing BottomNavigation (~100px tall on a typical phone width,
     *  plus safe-area inset). */
    bottomOffsetPx: 118,
    /** Horizontal advance between two graphemes of the SAME word, in px --
     *  sized for the fixed 15px font. */
    letterAdvancePx: 16,
    /** Gap between two words on the same line, in px. */
    wordGapPx: 18,
    /** Gap between line 1 and line 2, in px. */
    lineGapPx: 26,
    /** Resting opacity once fully formed -- legible, calm, no shimmer. */
    opacity: 0.92,
  },

  /** Scatter (ambient) positions: random, regenerated once per mount,
   *  within these viewport-fraction bounds. Kept clear of the very top
   *  (hero/header) and the formed rect + nav at the bottom, so scattered
   *  letters don't visually collide with either. */
  scatter: {
    xMinFrac: 0.06,
    xMaxFrac: 0.9,
    yMinFrac: 0.1,
    yMaxFrac: 0.76,
  },

  /** Ambient shimmer -- duplicated snapshot of the real field's "near"
   *  stratum + wave + breathing formula (config.ts's strata[2], wavePhase*,
   *  waveSpeed, breathPeriodMs, breathAmplitude, intensity), so scattered
   *  letters shimmer identically to the real background field. This
   *  shimmer's influence fades out naturally as convergence proceeds (its
   *  weight in the opacity blend shrinks to zero at full formation) --
   *  letters visibly calm down as they resolve into legible text. */
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

  /** Formation lifecycle. Scroll drives convergence up to the trigger
   *  point; after that the cycle is time-driven (hold, then dissolve),
   *  independent of further scroll position, until the person scrolls back
   *  up far enough to re-arm it. */
  lifecycle: {
    /** Scroll fraction (0-1 of the page) at which convergence is
     *  considered "complete" and the hold phase begins. */
    formationTriggerThreshold: 0.995,
    /** Scroll fraction below which the cycle re-arms (scrolling away
     *  resets things, and also interrupts an in-progress hold/dissolve --
     *  scrolling up always hands control back to the person). */
    retriggerResetThreshold: 0.85,
    /** How long the fully-formed verse holds before it starts dissolving,
     *  even if the person stays scrolled at the bottom. */
    holdMs: 3200,
    /** Duration of the dissolve-back-into-the-field animation. */
    dissolveMs: 1600,
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
