/**
 * Living Field — Living Language Story Bridge Types (v0.3)
 * ----------------------------------------------------------------------------
 * v0.3 CHANGE OF GRAMMAR (superseding v0.2's grapheme-matching approach,
 * grapheme-source.ts): a story no longer searches the field for cells whose
 * EXISTING glyph happens to match a target grapheme. On a real mobile
 * layout, empirically, all four target graphemes being simultaneously
 * present was close to a 0% occurrence across independent trials -- so
 * "found: false" phantom fragments (fading in with no journey at all) were
 * the COMMON case, not the rare fallback, which is the real root cause of
 * "only one performer had a convincing journey."
 *
 * v0.3 instead treats ANY ordinary field cell as eligible to become ANY
 * performer: Story Mode selects four cells purely on visual choreography
 * (lib/living-language-story/performer-selection.ts) and gives each a
 * TEMPORARY semantic identity for the duration of the story. This means
 * every StoryFragment is now always a real, on-screen cell -- there is no
 * more "found: false" case, and consequently no more phantom overlay
 * fragments at all. The only overlay glyph remaining is the hero word
 * itself, during the brief crossfade window.
 *
 * CONSTITUTIONAL GUARANTEE UNCHANGED: nothing in this file, or anything
 * that consumes it, ever writes to FieldCell.x, FieldCell.y, or
 * FieldCell.glyph. `homeX`/`homeY`/`homeGlyph` are read-only COPIES
 * captured once at story start; the renderer resolves a temporary override
 * only at the point of drawing a specific frame, never touching the
 * underlying cell.
 *
 * ---------------------------------------------------------------------------
 * SIX-STAGE GRAMMAR
 * ---------------------------------------------------------------------------
 * FIELD -> AWAKENING -> APPROACHING -> FORMING_HERO -> HOLDING -> RELEASING
 * -> RETURNING -> FIELD
 *
 * The "FIELD" bookends are simply the absence of a StoryState (`null`) --
 * not phases this file names. The six real phases are StoryPhase below.
 * AWAKENING + APPROACHING + FORMING_HERO together form one continuous,
 * monotonically rising "forming" progress (0..1); RELEASING + RETURNING
 * together form the mirrored, monotonically falling "returning" progress
 * (1..0) -- see story-bridge.ts's progressFor() for exactly how elapsed
 * real time within each phase maps to that shared progress value.
 */

import type { FieldStratum } from "./config";

export type StoryPhase =
  | "awakening"
  | "approaching"
  | "formingHero"
  | "holding"
  | "releasing"
  | "returning";

/**
 * One performer's complete story participation. Always a real, currently
 * on-screen cell -- there is no "not found" case in v0.3 (see this file's
 * header). `homeGlyph` is a read-only snapshot of what that cell was
 * ambiently showing at the moment it was chosen as a performer; `grapheme`
 * (the storyGlyph) is what it temporarily displays instead while
 * sufficiently present to be legible -- see story-bridge.ts's glyph-swap
 * threshold for exactly when that substitution (and its reversal) occurs.
 */
export interface StoryFragment {
  cellIndex: number;
  homeX: number;
  homeY: number;
  homeGlyph: string;
  /** The stratum this cell belonged to at selection time -- captured so
   *  the renderer can compute a per-performer peak scale (targeting the
   *  hero's own font size from THIS specific starting size, not a fixed
   *  global multiplier) without needing to re-look-up the cell's stratum
   *  every frame. */
  homeStratum: FieldStratum;
  grapheme: string;
  targetX: number;
  targetY: number;
}

/** Geometry/typography of the hero word itself -- the single
 *  browser-shaped fillText call that becomes the unmistakable hero during
 *  hold. Centred at (centerX, centerY) with textAlign "center" /
 *  textBaseline "middle", matching what measureGraphemeTargets() assumed
 *  when it computed each fragment's targetX/targetY. Font weight is
 *  intentionally NOT interpolated anywhere in this v0.1 proof -- performers
 *  render at their home stratum's normal weight throughout; only position,
 *  scale, opacity, and draw-order hierarchy carry the depth journey, per
 *  explicit direction to prove those fundamentals before introducing
 *  another optical variable. */
export interface StoryHeroGeometry {
  text: string;
  centerX: number;
  centerY: number;
  fontSizePx: number;
  fontWeight: number;
}

/** The complete temporary story state the engine holds while a story is
 *  active, and hands to the renderer each frame. `null` (the default, and
 *  the only value any normal page's engine ever has) means "no story" --
 *  bit-identical rendering to before this feature existed. */
export interface StoryState {
  phase: StoryPhase;
  /** Engine clock time (same clock renderField already receives) at which
   *  the CURRENT phase began. Used only to detect phase-transition timing
   *  edge cases; the actual progress calculation uses the two anchors
   *  below, not this field, since progress must stay continuous ACROSS
   *  the awakening/approaching/formingHero sub-phases (and, mirrored,
   *  across releasing/returning) rather than resetting at each one. */
  phaseStartedAt: number;
  /** Engine clock time at which "awakening" began -- the anchor the rising
   *  (forming-side) progress is computed against, unchanged across
   *  awakening -> approaching -> formingHero. */
  formingStartedAt: number;
  /** Engine clock time at which "releasing" began -- the anchor the
   *  falling (return-side) progress is computed against, unchanged across
   *  releasing -> returning. Irrelevant (any value) while phase is one of
   *  the forming-side three; only read once phase is releasing/returning. */
  returningStartedAt: number;
  /** All four performers, in final left-to-right target order (i.e.
   *  fragments[0] is the leftmost target, matching the hero word's own
   *  reading order) -- see performer-selection.ts's
   *  assignPerformersToTargets(). */
  fragments: readonly StoryFragment[];
  /** Keyed by StoryFragment.cellIndex, O(1) lookup for the renderer's
   *  per-cell loop, which iterates every on-screen cell every frame. */
  fragmentByCellIndex: ReadonlyMap<number, StoryFragment>;
  hero: StoryHeroGeometry;
  /** This story's actual timing configuration -- captured once at story
   *  start (reflecting whatever the dev-only sliders were set to when Play
   *  was pressed), not re-read from a live/mutable source. Every progress
   *  calculation in story-bridge.ts reads this rather than a module-level
   *  constant, so two different Play presses with different slider
   *  settings never interfere with each other mid-story. */
  timing: StoryTimingConfig;
  /** This story's actual ambient-dim factor, captured the same way. */
  ambientDimFactor: number;
  /** The layout generation this story's fragments were captured against --
   *  see engine.ts's rebuild()/getLayoutGenerationId() for how a stale
   *  story is defensively cleared on any resize/DPR change. */
  layoutGenerationId: number;
}

/** What the bridge's pure per-cell function resolves to for a performing
 *  cell: an ADDITIVE position offset (never a replacement of cell.x/
 *  cell.y), a scale multiplier (1.0 = home/ambient size), an opacity
 *  multiplier, and the glyph text to actually draw this frame (which may
 *  differ from the cell's own ambient glyph -- see `glyphOverride`).
 *  Composed into the renderer's existing pipeline exactly where
 *  `expression`'s and `livingRegion`'s multipliers already are. */
export interface StoryCellRenderState {
  dx: number;
  dy: number;
  scale: number;
  opacityMultiplier: number;
  /** The glyph text to draw for this cell THIS frame -- either the cell's
   *  own homeGlyph (before the awaken-time swap, or after the return-time
   *  swap-back) or the storyGlyph (grapheme), during the window in between.
   *  Never both -- see story-bridge.ts's resolveGlyphText() for the single
   *  instantaneous swap point in each direction. */
  glyphOverride: string;
}

/** One overlay glyph painted OUTSIDE the normal per-cell loop: the hero
 *  word itself, during the brief crossfade window. Uses the field's own
 *  colour so it reads as part of the same visual world, per explicit
 *  direction. There are no more "phantom" overlay fragments in v0.3 --
 *  every performer is always a real cell, painted by the per-cell loop. */
export interface StoryOverlay {
  hero: {
    text: string;
    x: number;
    y: number;
    fontSizePx: number;
    fontWeight: number;
    opacity: number;
  } | null;
}

/**
 * Phase durations, ms -- all tunable via the story-test page's dev-only
 * sliders (see app/living-language/story-test/page.tsx); these are the
 * defaults, chosen to land near the approved ~14s total proof timeline.
 * Exported so the outside story-controller can schedule its
 * phase-transition timers against the exact same numbers the bridge uses
 * for interpolation -- one source of truth, not two copies that could
 * drift apart.
 */
export const DEFAULT_AWAKENING_MS = 1500;
export const DEFAULT_APPROACHING_MS = 3000;
export const DEFAULT_FORMING_HERO_MS = 1000;
export const DEFAULT_HOLDING_MS = 2500;
export const DEFAULT_RELEASING_MS = 1000;
export const DEFAULT_RETURNING_MS = 3000;

export interface StoryTimingConfig {
  awakeningMs: number;
  approachingMs: number;
  formingHeroMs: number;
  holdingMs: number;
  releasingMs: number;
  returningMs: number;
}

export const DEFAULT_STORY_TIMING: StoryTimingConfig = {
  awakeningMs: DEFAULT_AWAKENING_MS,
  approachingMs: DEFAULT_APPROACHING_MS,
  formingHeroMs: DEFAULT_FORMING_HERO_MS,
  holdingMs: DEFAULT_HOLDING_MS,
  releasingMs: DEFAULT_RELEASING_MS,
  returningMs: DEFAULT_RETURNING_MS,
};

/**
 * Reveal progress crossing this threshold (0..1, on the shared forming/
 * returning progress scale -- see story-bridge.ts's progressFor()) is when
 * the glyph identity swap happens: homeGlyph -> storyGlyph on the way up
 * (during awakening, while progress is still well below this value's
 * corresponding presence), storyGlyph -> homeGlyph on the way down (late in
 * returning, mirrored). Deliberately low -- the swap must happen while the
 * performer is still meaningfully sub-legible, per explicit direction
 * ("never render both identities... the swap itself must be
 * imperceptible").
 */
export const GLYPH_SWAP_PRESENCE_THRESHOLD = 0.12;

/** Where, on the shared forming-side progress (0..1 across awakening +
 *  approaching + formingHero combined), the crossfade into the literal
 *  hero fillText begins. Deliberately close to 1 -- performers arrive
 *  already close to the hero's own scale (see story-bridge.ts's
 *  per-performer peak-scale calculation), so only a minimal crossfade
 *  window is needed for correct Tamil shaping, not the wide window v0.2
 *  used before that scale-matching existed. */
export const CROSSFADE_START = 0.92;

/** Peak performer scale is computed per-performer at story start (hero
 *  fontSizePx / that performer's own home stratum fontSizePx) -- see
 *  story-controller.ts. This constant is a SAFETY CEILING only, guarding
 *  against a degenerate case (an extremely small home stratum font paired
 *  with an extremely large hero font) producing an implausibly large scale
 *  multiplier; it is not the normal operating value. */
export const MAX_PERFORMER_SCALE = 8;

/**
 * Ambient dimming multiplier applied to every ORDINARY (non-performer) cell
 * while a story is at full presence (progress = 1, throughout HOLDING).
 * 1.0 = no dimming at all; lower = more dimming. Deliberately conservative
 * per explicit direction ("the field remains visible behind it... only
 * slightly quieter... do not darken the environment -- hierarchy should
 * come from depth and presence, not from suppressing the background").
 * Tunable via the story-test page's dev slider. Ramped in/out with the same
 * shared progress every other part of the story uses, so it never cuts
 * abruptly.
 */
export const DEFAULT_AMBIENT_DIM_FACTOR = 0.92;
