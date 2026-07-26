/**
 * Living Field — Living Language Story Bridge
 * ----------------------------------------------------------------------------
 * The ONLY thing the outside Living Language Story module touches inside the
 * Kernel's rendering path. It hands the engine a fully-decided StoryState
 * (which cells, which targets, which phase, when the phase started); this
 * module decides HOW to turn that into a per-frame render-time offset. The
 * story module never sees this math and never touches a canvas.
 *
 * ---------------------------------------------------------------------------
 * RESPONSIBILITY SPLIT (mirrors AmbientLanguageLayer.md's own table exactly)
 * ---------------------------------------------------------------------------
 * | Layer                          | Decides                          | Never touches            |
 * |---------------------------------|-----------------------------------|---------------------------|
 * | Living Language Story (outside) | WHEN to play/reset, WHAT text,    | Canvas, cell.x/cell.y,   |
 * |  (lib/living-language-story/)   | text-mask sampling, WHICH home    | rendering of any kind    |
 * |                                  | cells are assigned to WHICH point |                           |
 * | This bridge (Kernel)            | The exact interpolation curve     | Which text, vocabulary,  |
 * |  (story-bridge.ts)               | (progress 0..1) and how progress  | timing/phase-scheduling  |
 * |                                  | becomes a render-time dx/dy/      | decisions, mask sampling |
 * |                                  | opacity multiplier                |                           |
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DOES NOT REOPEN SPRINT 03C
 * ---------------------------------------------------------------------------
 * Sprint 03C's absolute rule ("no later [ambient] engine ever moves a
 * glyph") governs the AMBIENT system -- the always-on, never-opted-into
 * background field and its one existing semantic bridge
 * (ambient-expression.ts), which remains untouched by this file and stays
 * opacity-only exactly as before. This bridge is not another ambient
 * engine: it produces zero effect for every cell, on every page, unless a
 * caller has explicitly constructed and installed a StoryState via
 * LivingFieldEngine.setStoryState() -- which only
 * lib/living-language-story/story-controller.ts ever calls, and only from
 * the dedicated, explicitly opt-in /living-language/story-test route (see
 * that module's own header). No FieldCell.x or FieldCell.y is ever written
 * here or anywhere in this pass -- only read, via the `homeX`/`homeY` copy
 * captured once at story start (story-bridge-types.ts).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS A PURE FUNCTION OF (state, cellIndex, t), NOT A CLASS
 * ---------------------------------------------------------------------------
 * Same reasoning as living-region-state.ts and ambient-expression.ts: no
 * wall-clock scheduling happens here (no setTimeout anywhere in this file).
 * Phase transitions are decided and scheduled entirely by the outside
 * story-controller, which calls setStoryState() at each transition; this
 * module only ever answers "given the state you already decided on, and
 * what time it is right now, where should this one cell render?"
 */

import type { StoryCellOffset, StoryState } from "./story-bridge-types";
import { STORY_FORM_MS, STORY_RETURN_MS } from "./story-bridge-types";

/** Duplicated 2-line smoothstep primitive rather than importing
 *  ambient-expression.ts's private one -- the same intentional-duplication
 *  exception LivingKernelArchitecture.md already documents for
 *  natural-distribution.ts / affinity-engine.ts's hash utilities: this
 *  keeps that file's explicit "remains intact, untouched" guarantee literal
 *  (zero new imports into or out of it), for a two-line generic math
 *  primitive that carries no shared domain meaning. */
function smoothstep(t: number): number {
  const c = t < 0 ? 0 : t > 1 ? 1 : t;
  return c * c * (3 - 2 * c);
}

/** Opacity multiplier at full formation (progress = 1), applied on top of
 *  whatever opacity the cell would already have -- same multiplicative
 *  composition point as `expression` and `livingRegion`. Deliberately much
 *  larger than Ambient Expression's 1.7x peak: this mode's whole purpose is
 *  a clearly LEGIBLE word, not a barely-discoverable ambient pulse, and the
 *  field's base opacities are low single digits before this multiplier.
 *  Final composed opacity is still clamped to 1 by the renderer, exactly as
 *  every other multiplicative term already is. */
const TARGET_OPACITY_MULTIPLIER = 8;

/**
 * Resolves one cell's current position/opacity contribution from Story
 * Mode. Returns `null` -- meaning "render exactly as if Story Mode did not
 * exist" -- whenever there is no active story, or this specific cell was
 * never one of the story's participants. Every caller must treat `null` as
 * "add 0, multiply by 1."
 *
 * `staticFrame` mirrors renderer.ts's existing `options.static` (prefers-
 * reduced-motion): rather than interpolate continuously, it resolves
 * directly to one of exactly two visual states -- fully formed (forming /
 * holding) or fully home (returning) -- since a static frame cannot show
 * motion at all. This is the "restrained transition" the spec calls for
 * under reduced motion, produced by this same pure function rather than a
 * second code path.
 */
export function computeStoryOffset(
  state: StoryState | null | undefined,
  cellIndex: number,
  t: number,
  staticFrame: boolean
): StoryCellOffset | null {
  if (!state) return null;
  const assignment = state.assignments.get(cellIndex);
  if (!assignment) return null;

  let progress: number; // 0 = at home, 1 = fully at target
  if (staticFrame) {
    progress = state.phase === "returning" ? 0 : 1;
  } else {
    const elapsed = Math.max(0, t - state.phaseStartedAt);
    if (state.phase === "forming") {
      progress = smoothstep(Math.min(1, elapsed / STORY_FORM_MS));
    } else if (state.phase === "holding") {
      progress = 1;
    } else {
      // "returning"
      progress = 1 - smoothstep(Math.min(1, elapsed / STORY_RETURN_MS));
    }
  }

  return {
    dx: (assignment.targetX - assignment.homeX) * progress,
    dy: (assignment.targetY - assignment.homeY) * progress,
    opacityMultiplier: 1 + progress * (TARGET_OPACITY_MULTIPLIER - 1),
  };
}
