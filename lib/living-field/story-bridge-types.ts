/**
 * Living Field — Living Language Story Bridge Types
 * ----------------------------------------------------------------------------
 * Living Language Stories v0.1 (proof of concept).
 *
 * Co-located inside lib/living-field/ for the same reason
 * ambient-expression-types.ts is: the Kernel's renderer/engine need to know
 * the *shape* of this state to paint it, even though the module that decides
 * WHEN a story plays and WHAT text it forms (lib/living-language-story/)
 * lives entirely outside the Kernel. See story-bridge.ts's header for the
 * full responsibility split.
 *
 * IMPORTANT: this is a constitutional EXTENSION, not an amendment. Sprint
 * 03C's absolute rule -- "no later [ambient] engine ever moves a glyph" --
 * remains fully intact for the normal Living Field and the Ambient Language
 * Layer. Nothing here ever writes to FieldCell.x or FieldCell.y (see
 * field-cell.ts, unchanged). A cell's permanent home coordinates are read
 * here, never written. What moves is only ever a temporary, additive,
 * render-time offset that this bridge computes -- and only for cells a
 * caller has explicitly enrolled in an active StoryState, which no normal
 * page ever creates (see lib/living-language-story/story-controller.ts).
 */

/** Which leg of the LIVING FIELD -> WORD -> LIVING FIELD cycle is active. */
export type StoryPhase = "forming" | "holding" | "returning";

/**
 * One participating cell's home and target position, captured at the exact
 * moment a story began. `cellIndex` is the cell's index into the
 * `FieldLayout.cells` array it was captured from -- a fast lookup key for
 * v0.1, NOT a permanent cell identity (see story-controller.ts's use of
 * `layoutGenerationId` for why a stale index can never be misapplied to a
 * different layout).
 *
 * `homeX`/`homeY` are a COPY of the cell's permanent coordinates at capture
 * time, kept here only so the interpolation math below has both endpoints
 * without reaching back into the live layout -- the live FieldCell.x/y this
 * was copied from is never itself modified.
 */
export interface StoryAssignment {
  cellIndex: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
}

/**
 * The complete temporary story state the engine holds while a story is
 * active, and hands to the renderer each frame. `null` (the default, and
 * the only value any normal page's engine ever has) means "no story" --
 * bit-identical rendering to before this feature existed.
 */
export interface StoryState {
  phase: StoryPhase;
  /** Engine clock time (same clock as the `t` renderField already receives)
   *  at which the CURRENT phase began -- not when the whole story began. */
  phaseStartedAt: number;
  /** Keyed by StoryAssignment.cellIndex for O(1) per-cell lookup in the
   *  render loop, which iterates every on-screen cell every frame. */
  assignments: ReadonlyMap<number, StoryAssignment>;
  /** The layout generation this story's assignments were captured against.
   *  Purely descriptive here -- engine.ts is what actually enforces that a
   *  rebuild (resize/DPR/viewport change) clears story state; this field
   *  lets a caller confirm a StoryState it's holding onto is still current
   *  before doing anything with it. */
  layoutGenerationId: number;
}

/** What the bridge's pure per-cell function resolves to: an ADDITIVE
 *  position offset (never a replacement of cell.x/cell.y) and an opacity
 *  multiplier, both composed into the renderer's existing pipeline exactly
 *  where `expression`'s and `livingRegion`'s multipliers already are. */
export interface StoryCellOffset {
  dx: number;
  dy: number;
  opacityMultiplier: number;
}

/** Phase durations, ms. Within the spec's 2.5-3s form / 2s hold / 2.5-3s
 *  return targets. Exported so the outside story-controller can schedule
 *  its phase-transition timers against the exact same numbers the bridge
 *  uses for interpolation -- one source of truth, not two copies that could
 *  drift apart. */
export const STORY_FORM_MS = 2800;
export const STORY_HOLD_MS = 2000;
export const STORY_RETURN_MS = 2800;
