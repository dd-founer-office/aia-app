/**
 * Living Field — Living Language Story Bridge (v0.3)
 * ----------------------------------------------------------------------------
 * The ONLY thing the outside Living Language Story module touches inside the
 * Kernel's rendering path. It hands the engine a fully-decided StoryState
 * (which performers, which homes, which targets, which phase, when the
 * relevant progress anchors started); this module decides HOW to turn that
 * into per-frame render-time values.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DOES NOT REOPEN SPRINT 03C
 * ---------------------------------------------------------------------------
 * No FieldCell.x, FieldCell.y, or FieldCell.glyph is ever written here.
 * computeStoryCellRenderState() returns an ADDITIVE dx/dy, a scale
 * multiplier, an opacity multiplier, and which glyph TEXT to draw this
 * frame -- the renderer applies these only at the point of drawing a cell
 * whose home coordinates/glyph are read, never mutated. The hero overlay
 * glyph painted by computeStoryOverlay() is not a FieldCell at all.
 *
 * ---------------------------------------------------------------------------
 * ONE SHARED PROGRESS VALUE, MIRRORED FOR FORMING AND RETURNING
 * ---------------------------------------------------------------------------
 * `progressFor()` maps phase + elapsed time to one number, 0..1: 0 means
 * "fully home/ambient, no story visible," 1 means "fully formed hero, mid
 * hold." The forming side (awakening -> approaching -> formingHero) rises
 * 0->1 continuously across all three sub-phases, anchored to
 * `formingStartedAt` (NOT reset at each sub-phase transition) so the curve
 * never jumps. The return side (releasing -> returning) is the mirror,
 * falling 1->0 anchored to `returningStartedAt`. Every other function in
 * this file (position, scale, opacity, glyph identity) is a pure function
 * of that ONE progress value -- which is what guarantees returning is
 * automatically the visual mirror of forming, with no separately-authored
 * "release" animation to keep in sync by hand.
 *
 * Within the forming side, THREE SEPARATE derived envelopes read different
 * slices of the same progress differently:
 *   - presence01(p) / scale01(p): both smoothstep(p) directly, rising across
 *     the ENTIRE awaken+approach+formingHero span. Awakening is simply the
 *     slow, early part of this one curve -- not a separate animation -- so
 *     it naturally stays subtle without needing a hand-tuned ceiling.
 *   - travel01(p): pinned at exactly 0 for the whole awakening sub-phase,
 *     then smoothstep-rises 0->1 across approaching+formingHero only. This
 *     is what implements "position remains very close to HOME" during
 *     awaken and "begins traveling" only once approach starts -- travel is
 *     deliberately NOT the same curve as presence/scale.
 */

import type {
  StoryCellRenderState,
  StoryFragment,
  StoryOverlay,
  StoryState,
} from "./story-bridge-types";
import { CROSSFADE_START, GLYPH_SWAP_PRESENCE_THRESHOLD, MAX_PERFORMER_SCALE } from "./story-bridge-types";

function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

function clamp01(t: number): number {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * 0..1 RAW LINEAR progress (elapsed time / total duration for the relevant
 * phase-family) -- deliberately NOT eased here. Every derived envelope
 * below (presence01, travel01, the crossfade window) applies its OWN
 * easing to this raw value where appropriate; keeping this function itself
 * linear is what lets travel01's awakening-boundary comparison and the
 * crossfade's CROSSFADE_START comparison both work correctly against real
 * elapsed-time fractions, rather than against an already-eased curve
 * (which would silently shift every threshold's effective timing).
 *
 * staticFrame (reduced motion) collapses straight to one of the two
 * endpoints per phase-family -- no partial interpolation, since a static
 * frame can't show motion at all: forming-side phases
 * (awakening/approaching/formingHero) and "holding" all resolve to 1 (show
 * the fully-formed state); return-side phases (releasing/returning)
 * resolve to 0 (show the fully-home state).
 */
function progressFor(state: StoryState, t: number, staticFrame: boolean): number {
  const timing = state.timing;
  if (staticFrame) {
    return state.phase === "releasing" || state.phase === "returning" ? 0 : 1;
  }

  if (state.phase === "holding") return 1;

  if (state.phase === "releasing" || state.phase === "returning") {
    const elapsed = Math.max(0, t - state.returningStartedAt);
    const totalMs = timing.releasingMs + timing.returningMs;
    return 1 - clamp01(elapsed / totalMs);
  }

  // awakening | approaching | formingHero
  const elapsed = Math.max(0, t - state.formingStartedAt);
  const totalMs = timing.awakeningMs + timing.approachingMs + timing.formingHeroMs;
  return clamp01(elapsed / totalMs);
}

/** Presence/scale envelope: smoothstep(p) directly across the WHOLE forming
 *  or returning span -- see this file's header for why awakening doesn't
 *  need its own separate ceiling. */
function presence01(progress: number): number {
  return smoothstep(progress);
}

/** Travel envelope: 0 for the entire awakening fraction of the span, then
 *  smoothstep-rises across the remainder. `awakeningFraction` is
 *  timing.awakeningMs / (awakeningMs + approachingMs + formingHeroMs) on the
 *  forming side (or the equivalent fraction of the return-side total, for
 *  symmetry -- see computeStoryCellRenderState()'s call site). */
function travel01(progress: number, awakeningFraction: number): number {
  if (awakeningFraction >= 1) return 0;
  const remapped = (progress - awakeningFraction) / (1 - awakeningFraction);
  return smoothstep(clamp01(remapped));
}

/** Fragment presence envelope INCLUDING the crossfade-out near the end:
 *  rises with presence01 until CROSSFADE_START, then falls 1->0 over the
 *  remaining sliver as the hero overlay takes over. Symmetric under
 *  progress-reversal (mirrors automatically for the return side).
 *
 * v0.4: `pinnedAtFullPresence` (StoryFragment's own flag, see its doc
 * comment) replaces the RISING base (presence01(progress), i.e. "ramp up
 * from ambient") with a constant 1 -- this fragment is already fully
 * established from a prior episode, so it never re-ramps in. The
 * crossfade-OUT tail near CROSSFADE_START is completely UNCHANGED either
 * way: a pinned fragment still hides itself right as the unified result
 * text takes over (avoiding a double-drawn glyph), and still reappears at
 * that same tail on the way back down -- then, because its base stays 1
 * rather than falling further with presence01, it remains fully visible
 * for the entire rest of its journey (e.g. traveling back to a meeting
 * point) rather than fading toward ambient the way an ordinary returning
 * fragment does. */
function fragmentCrossfadePresence(progress: number, pinnedAtFullPresence: boolean): number {
  const base = pinnedAtFullPresence ? 1 : presence01(progress);
  if (progress <= CROSSFADE_START) return base;
  const fadeT = (progress - CROSSFADE_START) / (1 - CROSSFADE_START);
  return base * (1 - smoothstep(fadeT));
}

/** Hero overlay opacity: zero until CROSSFADE_START, then rises 0->1 over
 *  the remaining sliver -- the mirror of the fragment fade-out in that same
 *  window, so the two always sum to a stable total presence through the
 *  crossfade rather than a visible dip or double-bright flash. */
function heroOpacity01(progress: number): number {
  if (progress <= CROSSFADE_START) return 0;
  const fadeT = (progress - CROSSFADE_START) / (1 - CROSSFADE_START);
  return smoothstep(fadeT);
}

/**
 * Resolves ONE performing cell's current position/scale/opacity/glyph
 * contribution. Returns `null` -- meaning "render exactly as if Story Mode
 * did not exist" -- whenever there is no active story, or this cell is not
 * one of the story's four performers (every cell on every normal page,
 * always).
 */
export function computeStoryCellRenderState(
  state: StoryState | null | undefined,
  cellIndex: number,
  t: number,
  staticFrame: boolean
): StoryCellRenderState | null {
  if (!state) return null;
  const fragment = state.fragmentByCellIndex.get(cellIndex);
  if (!fragment) return null;

  const timing = state.timing;
  const progress = progressFor(state, t, staticFrame);
  const presence = fragmentCrossfadePresence(progress, fragment.pinnedAtFullPresence === true);

  const formingAwakeningFraction =
    timing.awakeningMs / (timing.awakeningMs + timing.approachingMs + timing.formingHeroMs);
  const travel = travel01(progress, formingAwakeningFraction);

  const peakScale = Math.min(
    MAX_PERFORMER_SCALE,
    Math.max(1, computeHeroFontSizeForFragment(state) / fragment.homeStratum.fontSize)
  );
  // Scale uses the same pinned-vs-ramping base as presence, for the same
  // reason: a continuing performer is already at full size, not re-growing
  // from ambient.
  const scaleBase = fragment.pinnedAtFullPresence === true ? 1 : presence01(progress);
  const scale = 1 + scaleBase * (peakScale - 1);

  return {
    dx: (fragment.targetX - fragment.homeX) * travel,
    dy: (fragment.targetY - fragment.homeY) * travel,
    scale,
    opacityMultiplier: 1 + presence * (computeFragmentPeakOpacityMultiplier() - 1),
    glyphOverride: resolveGlyphText(fragment, progress),
  };
}

/** Hero font size is the same for every fragment in a given story (one
 *  hero geometry) -- small helper purely for readability at the call site
 *  above. */
function computeHeroFontSizeForFragment(state: StoryState): number {
  return state.hero.fontSizePx;
}

/** Peak opacity multiplier a performer reaches while gaining presence,
 *  applied on top of whatever opacity it would already have -- same
 *  multiplicative composition point as `expression`/`livingRegion`. Smaller
 *  than the old silhouette-era value: only four letters are gaining
 *  presence now, each already individually legible via scale, not relying
 *  on brightness alone to read as foreground. */
function computeFragmentPeakOpacityMultiplier(): number {
  return 6;
}

/**
 * The single instantaneous glyph-identity swap point, in each direction.
 * Never a crossfade between two glyphs -- exactly one of homeGlyph or
 * grapheme (storyGlyph) is ever returned for a given progress value.
 *
 * Forward (progress rising, i.e. during awakening/approaching/formingHero):
 * swaps to storyGlyph once presence01(progress) crosses
 * GLYPH_SWAP_PRESENCE_THRESHOLD -- deliberately early and low, while the
 * performer is still meaningfully sub-legible.
 *
 * Backward (progress falling, i.e. during releasing/returning): swaps back
 * to homeGlyph once presence01(progress) drops BELOW the same threshold --
 * the mirrored moment, late in the return journey, once the performer has
 * already quieted back down past legibility.
 *
 * Using the SAME threshold value in both directions, against the SAME
 * presence01() function progress is fed into, is what guarantees the swap
 * is symmetric without needing two separately-tuned constants.
 */
function resolveGlyphText(fragment: StoryFragment, progress: number): string {
  const presence = presence01(progress);
  return presence >= GLYPH_SWAP_PRESENCE_THRESHOLD ? fragment.grapheme : fragment.homeGlyph;
}

/**
 * Ambient dimming multiplier for every ORDINARY cell in the field
 * (performers excluded -- their own large opacityMultiplier from
 * computeStoryCellRenderState() dominates regardless). Returns exactly 1
 * (no change) whenever there is no active story. Ramps with the same
 * shared `progress` every other part of the story uses. Deliberately
 * conservative -- see story-bridge-types.ts's DEFAULT_AMBIENT_DIM_FACTOR
 * doc comment for why this is restrained rather than a real darkening.
 */
export function computeAmbientDimMultiplier(
  state: StoryState | null | undefined,
  t: number,
  staticFrame: boolean
): number {
  if (!state) return 1;
  const progress = progressFor(state, t, staticFrame);
  return 1 - progress * (1 - state.ambientDimFactor);
}

/**
 * Resolves the hero overlay glyph for this frame. Returns `{ hero: null }`
 * whenever there is no active story, which every normal page's render call
 * always is. There is no more phantom-fragment array in v0.3 -- every
 * performer is always a real cell, painted entirely by the per-cell loop
 * via computeStoryCellRenderState() above.
 */
export function computeStoryOverlay(
  state: StoryState | null | undefined,
  t: number,
  staticFrame: boolean
): StoryOverlay {
  if (!state) return { hero: null };

  const progress = progressFor(state, t, staticFrame);
  const heroOp = heroOpacity01(progress);
  if (heroOp <= 0) return { hero: null };

  return {
    hero: {
      text: state.hero.text,
      x: state.hero.centerX,
      y: state.hero.centerY,
      fontSizePx: state.hero.fontSizePx,
      fontWeight: state.hero.fontWeight,
      opacity: heroOp,
    },
  };
}
