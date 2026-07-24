/**
 * Living Field — Living Region State
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 3A: Reflection Engine.
 *
 * "This is not another Ambient Expression." Ambient Expression
 * (ambient-expression.ts) is the field whispering: a one-shot, fire-and-
 * forget rise/hold/fall pulse, triggered by an application event, that
 * always runs the same envelope to completion regardless of anything the
 * user does. The Living Region is the field remembering: a SUSTAINED,
 * gesture-driven state that a person actively holds open, that can be
 * interrupted, resumed as a partial fade, or held indefinitely until
 * explicitly dismissed. These are different enough in kind that they get a
 * separate system, not a reuse of ambient-expression.ts's envelope.
 *
 * ---------------------------------------------------------------------------
 * WHAT OWNS WHAT (explicit, per direction)
 * ---------------------------------------------------------------------------
 * This module owns: phase, timers (i.e. the logic for WHEN a time-based
 * transition should happen), transitions, and opacity PROGRESS (0..1, "how
 * revealed," independent of any stratum's actual opacity numbers).
 *
 * This module does NOT own: actual wall-clock scheduling (no setTimeout
 * anywhere here -- see below), which cells are reserved (living-region.ts /
 * field-cell.ts), or how progress becomes an actual rendered opacity
 * multiplier for a specific stratum (renderer.ts, using
 * computeRevealPeakMultiplier below).
 *
 * A page component (a later commit's Home wiring) reports ONLY four things
 * that happened -- pointerDown, pointerUp, cancel, dismiss -- via
 * dispatchLivingRegionEvent(). It never touches phase, timers, or opacity
 * directly. This is what keeps the engine reusable: a future Aathichoodi
 * line, proverb, or Acts-of-Aram reflection would drive the exact same
 * state machine with the exact same four events.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERYTHING HERE IS A PURE FUNCTION, NOT A CLASS
 * ---------------------------------------------------------------------------
 * Every other pure-computation module in this Kernel (field-layout.ts,
 * natural-distribution.ts, affinity-engine.ts, emergent-harmony.ts,
 * ambient-expression.ts) is functions operating on plain data, not a
 * stateful class -- the only class in the Kernel, LivingFieldEngine
 * (engine.ts), exists because it genuinely owns a canvas and a RAF loop.
 * This module has neither. A LivingRegionState is a plain, immutable-in-
 * spirit value (every function here returns a NEW state rather than
 * mutating one), and a later commit's engine.ts will own exactly one
 * instance of it the same way it already owns `this.layout`.
 *
 * ---------------------------------------------------------------------------
 * "TIMERS" WITHOUT setTimeout
 * ---------------------------------------------------------------------------
 * advanceLivingRegionState() is how time-based transitions (anticipating ->
 * revealed at the hold threshold; revealed -> dismissing after the idle
 * timeout; dismissing -> idle once the fade completes) actually happen --
 * but it's a pure function of (state, now), not a scheduled callback. Under
 * normal motion, a later commit calls this once per animation frame from
 * the engine's existing RAF loop (engine.ts already runs one; no second
 * loop is introduced). Under reduced motion, where no RAF loop runs at all,
 * that later commit uses real setTimeout calls to invoke this function at
 * the specific moments transitions are expected -- but the TRANSITION LOGIC
 * itself, tested here, is identical either way. This module never reaches
 * for wall-clock scheduling itself.
 *
 * ---------------------------------------------------------------------------
 * REDUCED MOTION
 * ---------------------------------------------------------------------------
 * Per explicit direction: "anticipation should still exist, but without
 * animated interpolation... the interaction remains intact, only motion is
 * reduced." Concretely, every function here takes a `reducedMotion` flag;
 * when true, computeLivingRegionProgress() returns each phase's TERMINAL
 * progress value immediately (0 / anticipationCeilingFraction / 1 / 0)
 * rather than interpolating from elapsed time -- the 700ms hold threshold
 * and 15s idle timeout still genuinely elapse (advanceLivingRegionState()
 * still waits for them), only the VISUAL ramp in between is skipped.
 */

import type { FieldStratum } from "./config";
import type { LivingRegionOpacityConfig, LivingRegionTimingConfig } from "./living-region";

export type LivingRegionPhase = "idle" | "anticipating" | "revealed" | "dismissing";

export interface LivingRegionState {
  phase: LivingRegionPhase;
  /** Timestamp (performance.now()-based, matching the Kernel's own clock --
   *  the same convention ambient-expression.ts already uses) the CURRENT
   *  phase began. */
  phaseStartedAt: number;
  /** Reveal progress (0..1) carried over from whatever the PREVIOUS phase's
   *  progress actually was at the moment of this transition -- e.g. if
   *  dismissal begins during anticipation at 40% of the way to the
   *  anticipation ceiling, dismissing starts its fade from that same 40%,
   *  not from a fixed assumption. Deliberately NOT an opacity value -- this
   *  module has no concept of stratum, intensity, or any rendered number;
   *  translating progress into an actual opacity multiplier is the
   *  renderer's job (see computeRevealPeakMultiplier / the composed
   *  computeLivingRegionOpacityMultiplier below). */
  progressAtPhaseStart: number;
}

/** The four things a page (or any other caller) may report. Nothing else --
 *  no phase, no timers, no opacity. See this file's header for why. */
export type LivingRegionEvent = "pointerDown" | "pointerUp" | "cancel" | "dismiss";

export function createLivingRegionState(now: number): LivingRegionState {
  return { phase: "idle", phaseStartedAt: now, progressAtPhaseStart: 0 };
}

function enterPhase(
  prevState: LivingRegionState,
  nextPhase: LivingRegionPhase,
  now: number,
  timing: LivingRegionTimingConfig,
  opacity: LivingRegionOpacityConfig,
  reducedMotion: boolean
): LivingRegionState {
  const carriedProgress = computeLivingRegionProgress(prevState, now, timing, opacity, reducedMotion);
  return { phase: nextPhase, phaseStartedAt: now, progressAtPhaseStart: carriedProgress };
}

/**
 * Applies an immediate, event-driven transition. Any event that doesn't
 * apply to the current phase is a deliberate no-op, returning the EXACT
 * SAME state reference (not a new object) -- a caller can cheaply check
 * `next === prev` to know whether anything actually changed.
 *
 * Deliberate transition choices, stated explicitly rather than left
 * implicit:
 *  - pointerDown only does anything from "idle". A press while already
 *    anticipating/revealed/dismissing is a no-op -- there's no second
 *    concurrent interaction to start.
 *  - pointerUp/cancel only end anything from "anticipating" (-> dismissing,
 *    "return smoothly to ambient, reveal nothing" -- the early-release
 *    path). Releasing the press while "revealed" is a deliberate no-op: per
 *    the three named dismissal paths (tap outside, scroll away, ~15s idle),
 *    lifting the finger is NOT one of them -- the reveal is meant to
 *    persist for reading, not require a continuous hold.
 *  - "dismiss" (the page's generic signal for tap-outside/scroll-away/idle-
 *    timeout) ends either "revealed" or "anticipating" (in case a caller
 *    fires it defensively mid-anticipation, e.g. the user scrolled away
 *    while still pressing) -> dismissing.
 */
export function dispatchLivingRegionEvent(
  state: LivingRegionState,
  event: LivingRegionEvent,
  now: number,
  timing: LivingRegionTimingConfig,
  opacity: LivingRegionOpacityConfig,
  reducedMotion: boolean
): LivingRegionState {
  switch (event) {
    case "pointerDown":
      if (state.phase === "idle") {
        return enterPhase(state, "anticipating", now, timing, opacity, reducedMotion);
      }
      return state;
    case "pointerUp":
    case "cancel":
      if (state.phase === "anticipating") {
        return enterPhase(state, "dismissing", now, timing, opacity, reducedMotion);
      }
      return state;
    case "dismiss":
      if (state.phase === "revealed" || state.phase === "anticipating") {
        return enterPhase(state, "dismissing", now, timing, opacity, reducedMotion);
      }
      return state;
    default:
      return state;
  }
}

/**
 * Applies time-based transitions: anticipating -> revealed once the hold
 * threshold elapses (while still pressed -- no event required, this is the
 * "the field notices you've stayed" moment), revealed -> dismissing after
 * the idle timeout, dismissing -> idle once the fade completes. A no-op
 * (returns the same reference) if no threshold has been crossed.
 *
 * Reduced motion still respects every threshold -- only
 * computeLivingRegionProgress()'s VISUAL interpolation changes, not these
 * timings. The 700ms press-to-reveal and ~15s idle-to-dismiss durations are
 * part of the interaction's meaning ("paused long enough"), not merely
 * animation -- direction is explicit that "the interaction remains intact,
 * only motion is reduced."
 */
export function advanceLivingRegionState(
  state: LivingRegionState,
  now: number,
  timing: LivingRegionTimingConfig,
  opacity: LivingRegionOpacityConfig,
  reducedMotion: boolean
): LivingRegionState {
  const elapsed = now - state.phaseStartedAt;

  if (state.phase === "anticipating" && elapsed >= timing.holdThresholdMs) {
    return enterPhase(state, "revealed", now, timing, opacity, reducedMotion);
  }
  if (state.phase === "revealed" && elapsed >= timing.idleDismissMs) {
    return enterPhase(state, "dismissing", now, timing, opacity, reducedMotion);
  }
  if (state.phase === "dismissing") {
    const dismissComplete = reducedMotion || elapsed >= timing.dismissDurationMs;
    if (dismissComplete) {
      return enterPhase(state, "idle", now, timing, opacity, reducedMotion);
    }
  }
  return state;
}

/**
 * Reveal progress (0..1) right now -- 0 fully ambient/idle, 1 fully
 * revealed. Purely a function of phase + elapsed time (or, under reduced
 * motion, phase alone). Has no concept of any stratum's actual opacity
 * numbers -- see computeRevealPeakMultiplier for where progress finally
 * becomes a rendered value.
 */
export function computeLivingRegionProgress(
  state: LivingRegionState,
  now: number,
  timing: LivingRegionTimingConfig,
  opacity: LivingRegionOpacityConfig,
  reducedMotion: boolean
): number {
  const ceiling = opacity.anticipationCeilingFraction;

  switch (state.phase) {
    case "idle":
      return 0;
    case "anticipating": {
      if (reducedMotion) return ceiling;
      const elapsed = Math.max(0, now - state.phaseStartedAt);
      const t = Math.min(1, elapsed / timing.holdThresholdMs);
      return state.progressAtPhaseStart + t * (ceiling - state.progressAtPhaseStart);
    }
    case "revealed": {
      if (reducedMotion) return 1;
      const elapsed = Math.max(0, now - state.phaseStartedAt);
      const t = Math.min(1, elapsed / timing.revealDurationMs);
      return state.progressAtPhaseStart + t * (1 - state.progressAtPhaseStart);
    }
    case "dismissing": {
      if (reducedMotion) return 0;
      const elapsed = Math.max(0, now - state.phaseStartedAt);
      const t = Math.min(1, elapsed / timing.dismissDurationMs);
      return state.progressAtPhaseStart * (1 - t);
    }
    default:
      return 0;
  }
}

/**
 * Estimates the "typical" (pre-Living-Region) opacity of the verse's own
 * stratum -- baseOpacity plus half its wave amplitude (matching
 * renderer.ts's cellOpacityStatic()'s own "wave held at midpoint"
 * convention), times the field's global intensity multiplier. Used only to
 * derive how large the Living Region's OWN multiplicative term needs to be
 * so a typical reserved cell reaches roughly opacity.revealOpacityTarget
 * when fully revealed.
 *
 * This is deliberately an approximation, not an exact per-cell solve:
 * individual cells will land slightly above or below the target depending
 * on their own wave/breath phase at the moment of reveal (the renderer's
 * existing `Math.min(1, ...)` clamp catches anything that overshoots). This
 * is intentional, not a shortcoming -- even fully revealed, the verse stays
 * governed by the SAME breathing field every other cell is, rather than
 * becoming a flattened, static overlay. Computed once per stratum
 * (renderer.ts calls this once per frame, not once per cell).
 */
export function computeRevealPeakMultiplier(
  stratum: FieldStratum,
  intensity: number,
  opacity: LivingRegionOpacityConfig
): number {
  const typicalOpacity = (stratum.baseOpacity + stratum.waveAmplitude * 0.5) * intensity;
  if (typicalOpacity <= 0) return 1;
  return Math.max(1, opacity.revealOpacityTarget / typicalOpacity);
}

/**
 * The renderer's single entry point into this module. Composes progress +
 * peak multiplier into the actual multiplicative term renderer.ts applies,
 * per the locked pipeline order: Base x Depth x Wave x Breath x Ambient
 * Expression x Living Region -> Final. Returns exactly 1 (no effect) for
 * any cell that isn't part of a reserved verse, or when no Living Region
 * state is active at all (e.g. every render call before a later commit
 * ever supplies one) -- bit-identical to omitting this term entirely.
 */
export function computeLivingRegionOpacityMultiplier(
  hasReservedVerse: boolean,
  state: LivingRegionState | null | undefined,
  now: number,
  timing: LivingRegionTimingConfig,
  opacity: LivingRegionOpacityConfig,
  peakMultiplier: number,
  reducedMotion: boolean
): number {
  if (!hasReservedVerse || !state) return 1;
  const progress = computeLivingRegionProgress(state, now, timing, opacity, reducedMotion);
  if (progress <= 0) return 1;
  return 1 + progress * (peakMultiplier - 1);
}
