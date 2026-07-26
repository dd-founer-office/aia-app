/**
 * Living Field — Living Language Story Bridge Types (v0.2)
 * ----------------------------------------------------------------------------
 * Co-located inside lib/living-field/ for the same reason
 * ambient-expression-types.ts is: the Kernel's renderer needs to know the
 * *shape* of this state to paint it, even though the module that decides
 * WHEN a story plays and WHICH graphemes/cells participate
 * (lib/living-language-story/) lives entirely outside the Kernel.
 *
 * v0.2 CHANGE OF GRAMMAR (superseding v0.1's pixel-mask silhouette):
 * a story is now exactly four grapheme FRAGMENTS (வா / ழ் / த் / து for the
 * current proof) converging toward the geometry of the correctly-shaped
 * final word, crossfading into a single hero typography layer at the end
 * of formation -- not hundreds of ambient cells forming a silhouette.
 * text-mask.ts and glyph-assignment.ts (the v0.1 mechanism) are UNUSED by
 * this state shape and are not imported here.
 *
 * CONSTITUTIONAL GUARANTEE UNCHANGED: nothing in this file, or anything
 * that consumes it, ever writes to FieldCell.x or FieldCell.y. `homeX`/
 * `homeY` below are a read-only COPY captured once at story start, exactly
 * as in v0.1.
 */

/** Which leg of the LIVING FIELD -> WORD -> LIVING FIELD cycle is active. */
export type StoryPhase = "forming" | "holding" | "returning";

/**
 * One grapheme's source. `found: true` means a real, currently on-screen
 * FieldCell was located whose glyph is an exact match for this grapheme
 * (see grapheme-source.ts) -- `cellIndex` is that cell's index into the
 * FieldLayout.cells array this story was built against, a fast lookup key
 * for this layout generation only, never a permanent identity.
 *
 * `found: false` means no matching cell exists anywhere in the current
 * layout. Per explicit direction, this is NEVER papered over with a
 * fabricated ambient source -- the fragment instead fades in directly at
 * its target position (see story-bridge.ts's computeStoryOverlay), and
 * story-controller.ts logs a console dev note when this happens.
 */
export type StoryFragmentSource =
  | { found: true; cellIndex: number; homeX: number; homeY: number }
  | { found: false };

/** One grapheme's full story participation: its text, its source, and
 *  where it's converging to (derived from the shaped final word's own
 *  metrics -- see grapheme-source.ts's measureGraphemeTargets()). */
export interface StoryFragment {
  grapheme: string;
  source: StoryFragmentSource;
  targetX: number;
  targetY: number;
}

/** Geometry/typography of the hero word itself -- the single
 *  browser-shaped fillText call that becomes the unmistakable hero during
 *  hold. Centred at (centerX, centerY) with textAlign "center" /
 *  textBaseline "middle", matching what measureGraphemeTargets() assumed
 *  when it computed each fragment's targetX/targetY. */
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
  /** Engine clock time (same clock as the `t` renderField already
   *  receives) at which the CURRENT phase began. */
  phaseStartedAt: number;
  /** All four fragments, in target left-to-right order, including any
   *  `found: false` ones -- consumed by the overlay draw pass
   *  (story-bridge.ts's computeStoryOverlay) for phantom fade-in-only
   *  fragments and by the renderer's per-cell loop (via
   *  fragmentByCellIndex below) for found ones. */
  fragments: readonly StoryFragment[];
  /** Keyed by StoryFragmentSource.cellIndex, O(1) lookup for the renderer's
   *  per-cell loop, which iterates every on-screen cell every frame. Only
   *  ever contains `found: true` fragments -- a phantom fragment has no
   *  cellIndex and is never in this map. */
  fragmentByCellIndex: ReadonlyMap<number, StoryFragment>;
  hero: StoryHeroGeometry;
  /** Font size (px) a FOUND fragment's home stratum would normally use --
   *  passed through so a PHANTOM (not-found) fragment can be sized to
   *  match real ambient glyphs rather than guessing a fraction of the
   *  hero's own (much larger) size. See story-bridge.ts's
   *  computeStoryOverlay(). */
  fragmentFontSizePx: number;
  /** The layout generation this story's fragments were captured against.
   *  engine.ts's rebuild() is what actually enforces that a rebuild clears
   *  story state; this field lets a caller confirm a StoryState it's
   *  holding onto is still current before doing anything with it. */
  layoutGenerationId: number;
}

/** What the bridge's pure per-cell function resolves to for a FOUND
 *  fragment cell: an ADDITIVE position offset (never a replacement of
 *  cell.x/cell.y) and an opacity multiplier, composed into the renderer's
 *  existing pipeline exactly where `expression`'s and `livingRegion`'s
 *  multipliers already are. */
export interface StoryCellOffset {
  dx: number;
  dy: number;
  opacityMultiplier: number;
}

/** One overlay glyph to paint OUTSIDE the normal per-cell loop: either a
 *  phantom (not-found) fragment fading in/out at its target position, or
 *  the hero word itself. Both use the field's own colour so they read as
 *  part of the same visual world, per explicit direction. */
export interface StoryOverlayGlyph {
  text: string;
  x: number;
  y: number;
  fontSizePx: number;
  fontWeight: number;
  opacity: number;
}

export interface StoryOverlay {
  hero: StoryOverlayGlyph | null;
  phantoms: readonly StoryOverlayGlyph[];
}

/** Phase durations, ms. Within the spec's 2.5-3s form / 2s hold / 2.5-3s
 *  return targets. Exported so the outside story-controller can schedule
 *  its phase-transition timers against the exact same numbers the bridge
 *  uses for interpolation -- one source of truth, not two copies that
 *  could drift apart. */
export const STORY_FORM_MS = 2800;
export const STORY_HOLD_MS = 2200;
export const STORY_RETURN_MS = 2800;

/**
 * Ambient dimming factor applied to the REST of the field (every ordinary
 * cell, participating or not) while a story is at full presence (progress
 * = 1, i.e. throughout HOLD). 1.0 = no dimming at all; lower = more
 * dimming. Deliberately conservative per explicit direction ("subtle...
 * the field must remain visibly present and alive throughout... only a
 * restrained reduction") -- tune this one constant to adjust, nothing else
 * needs to change. Ramped in/out smoothly with the same progress curve
 * every other part of the story uses (see story-bridge.ts), never a hard
 * cut.
 */
export const AMBIENT_DIM_FACTOR = 0.88;
