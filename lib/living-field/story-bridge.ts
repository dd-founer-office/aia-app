/**
 * Living Field — Living Language Story Bridge (v0.2)
 * ----------------------------------------------------------------------------
 * The ONLY thing the outside Living Language Story module touches inside the
 * Kernel's rendering path. It hands the engine a fully-decided StoryState
 * (which graphemes, which sources, which targets, which phase, when the
 * phase started); this module decides HOW to turn that into per-frame
 * render-time values -- fragment position/opacity for real cells, and a
 * separate hero/phantom overlay for everything that isn't a real cell.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DOES NOT REOPEN SPRINT 03C
 * ---------------------------------------------------------------------------
 * Same guarantee as v0.1: no FieldCell.x or FieldCell.y is ever written
 * here. computeStoryOffset() returns an ADDITIVE dx/dy the renderer applies
 * only at the point of drawing a cell whose home coordinates are read, not
 * mutated. The hero and phantom overlay glyphs painted by
 * computeStoryOverlay() are not FieldCells at all -- they are a separate,
 * explicitly opt-in draw pass that only exists while a caller has installed
 * a StoryState, which no normal page ever does.
 *
 * ---------------------------------------------------------------------------
 * SINGLE PROGRESS FUNCTION, MIRRORED FOR FORMING AND RETURNING
 * ---------------------------------------------------------------------------
 * `progressFor()` maps phase+elapsed time to one number, 0..1: 0 means
 * "fully home/ambient, no story visible," 1 means "fully formed hero, mid
 * hold." Forming rises 0->1 over STORY_FORM_MS; holding is pinned at 1;
 * returning FALLS 1->0 over STORY_RETURN_MS. Every other function in this
 * file (fragment position, fragment opacity, hero opacity, ambient dim) is
 * a pure function of that ONE progress value -- which means returning is
 * automatically the exact visual mirror of forming, just fed a decreasing
 * progress instead of an increasing one, with no separately-authored
 * "release" animation to keep in sync by hand. This is what guarantees "no
 * obvious visual cut between story-ended and ambient field": everything is
 * continuous in progress, including the crossfade window itself.
 */

import type {
  StoryCellOffset,
  StoryOverlay,
  StoryOverlayGlyph,
  StoryState,
} from "./story-bridge-types";
import { AMBIENT_DIM_FACTOR, STORY_FORM_MS, STORY_RETURN_MS } from "./story-bridge-types";

function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

/** 0..1, 0 = fully home/ambient, 1 = fully formed hero. staticFrame
 *  (reduced motion) collapses straight to one of the two endpoints per
 *  phase -- no partial interpolation, since a static frame can't show
 *  motion at all. */
function progressFor(state: StoryState, t: number, staticFrame: boolean): number {
  if (staticFrame) {
    return state.phase === "returning" ? 0 : 1;
  }
  const elapsed = Math.max(0, t - state.phaseStartedAt);
  if (state.phase === "forming") {
    return smoothstep(Math.min(1, elapsed / STORY_FORM_MS));
  }
  if (state.phase === "holding") {
    return 1;
  }
  // "returning"
  return 1 - smoothstep(Math.min(1, elapsed / STORY_RETURN_MS));
}

/** Peak opacity multiplier a FOUND fragment cell reaches while gaining
 *  presence, applied on top of whatever opacity it would already have --
 *  same multiplicative composition point as `expression`/`livingRegion`.
 *  Smaller than v0.1's silhouette multiplier (8x): now only four letters
 *  are gaining presence, not carrying the whole word's legibility alone. */
const FRAGMENT_PEAK_OPACITY_MULTIPLIER = 6;

/** Fraction of progress spent purely converging/gaining presence before
 *  the crossfade into hero typography begins. The remaining (1 -
 *  this fraction) of progress is the crossfade window itself. */
const CROSSFADE_START = 0.75;

/** 0..1 envelope for a fragment's presence: rises 0->1 over
 *  [0, CROSSFADE_START] (gaining presence while converging), then falls
 *  1->0 over [CROSSFADE_START, 1] (crossfading into the hero). Symmetric
 *  under progress-reversal, which is exactly what makes returning mirror
 *  forming automatically. */
function fragmentPresence01(progress: number): number {
  if (progress <= CROSSFADE_START) {
    return smoothstep(progress / CROSSFADE_START);
  }
  const fadeT = (progress - CROSSFADE_START) / (1 - CROSSFADE_START);
  return 1 - smoothstep(fadeT);
}

/** 0..1 envelope for the hero word's own opacity: zero until
 *  CROSSFADE_START, then rises 0->1 over the crossfade window -- the
 *  mirror image of fragmentPresence01 during that same window, so the two
 *  always sum to a stable, non-flickering total presence through the
 *  crossfade rather than both being dim or both being bright at once. */
function heroOpacity01(progress: number): number {
  if (progress <= CROSSFADE_START) return 0;
  const fadeT = (progress - CROSSFADE_START) / (1 - CROSSFADE_START);
  return smoothstep(fadeT);
}

/**
 * Resolves ONE found-fragment cell's current position/opacity
 * contribution. Returns `null` -- meaning "render exactly as if Story Mode
 * did not exist" -- whenever there is no active story, or this cell was
 * never one of the story's found fragments (every cell on every normal
 * page, always).
 */
export function computeStoryOffset(
  state: StoryState | null | undefined,
  cellIndex: number,
  t: number,
  staticFrame: boolean
): StoryCellOffset | null {
  if (!state) return null;
  const fragment = state.fragmentByCellIndex.get(cellIndex);
  if (!fragment || fragment.source.found !== true) return null;

  const progress = progressFor(state, t, staticFrame);
  const presence = fragmentPresence01(progress);
  // Continues converging through the full progress range (arrives right
  // around the crossfade point) -- smoothstep(progress) directly, not the
  // hump envelope, so motion and presence are independent: a fragment
  // keeps travelling smoothly even as it starts to fade into the hero.
  const travel = smoothstep(progress);

  return {
    dx: (fragment.targetX - fragment.source.homeX) * travel,
    dy: (fragment.targetY - fragment.source.homeY) * travel,
    opacityMultiplier: 1 + presence * (FRAGMENT_PEAK_OPACITY_MULTIPLIER - 1),
  };
}

/**
 * Ambient dimming multiplier for every ORDINARY cell in the field (found
 * fragments included -- their own large opacityMultiplier from
 * computeStoryOffset() dominates regardless, so no special-casing is
 * needed to keep them visible through this). Returns exactly 1 (no
 * change) whenever there is no active story. Ramps with the same
 * `progress` every other part of the story uses, so it never cuts
 * abruptly and always fully relaxes back to 1 by the time Story Mode
 * clears.
 */
export function computeAmbientDimMultiplier(
  state: StoryState | null | undefined,
  t: number,
  staticFrame: boolean
): number {
  if (!state) return 1;
  const progress = progressFor(state, t, staticFrame);
  return 1 - progress * (1 - AMBIENT_DIM_FACTOR);
}

/**
 * Resolves the hero word and any phantom (not-found) fragments for this
 * frame -- the overlay draw pass, painted by the renderer AFTER its normal
 * per-cell loop. Returns `{ hero: null, phantoms: [] }` whenever there is
 * no active story, which every normal page's render call always is.
 */
export function computeStoryOverlay(
  state: StoryState | null | undefined,
  t: number,
  staticFrame: boolean
): StoryOverlay {
  if (!state) return { hero: null, phantoms: [] };

  const progress = progressFor(state, t, staticFrame);
  const presence = fragmentPresence01(progress);
  const heroOp = heroOpacity01(progress);

  const phantoms: StoryOverlayGlyph[] = [];
  for (const fragment of state.fragments) {
    if (fragment.source.found) continue; // found fragments are real cells, painted by the per-cell loop
    if (presence <= 0) continue;
    phantoms.push({
      text: fragment.grapheme,
      x: fragment.targetX,
      y: fragment.targetY,
      fontSizePx: state.fragmentFontSizePx,
      fontWeight: state.hero.fontWeight,
      opacity: presence,
    });
  }

  const hero: StoryOverlayGlyph | null =
    heroOp > 0
      ? {
          text: state.hero.text,
          x: state.hero.centerX,
          y: state.hero.centerY,
          fontSizePx: state.hero.fontSizePx,
          fontWeight: state.hero.fontWeight,
          opacity: heroOp,
        }
      : null;

  return { hero, phantoms };
}
