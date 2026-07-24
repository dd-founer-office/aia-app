/**
 * Living Region State — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/.
 *
 * Run with `npx tsx lib/living-field/living-region-state.selfcheck.ts`.
 *
 * Everything here is a pure function of plain data, so unlike engine.ts's
 * own integration test, this needs no mocked browser globals at all.
 */

import {
  createLivingRegionState,
  dispatchLivingRegionEvent,
  advanceLivingRegionState,
  computeLivingRegionProgress,
  computeRevealPeakMultiplier,
  computeLivingRegionOpacityMultiplier,
} from "./living-region-state";
import { LIVING_REGION_CONFIG } from "./living-region";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

const { timings, opacity } = LIVING_REGION_CONFIG;
const near = LIVING_FIELD_CONFIG.strata.find((s) => s.id === "near")!;

function run(): void {
  // --- 1. Idle: zero progress, multiplier 1, no effect on non-reserved cells. ---
  {
    const t0 = 1000;
    const state = createLivingRegionState(t0);
    assert(state.phase === "idle", "starts idle");
    assert(
      computeLivingRegionProgress(state, t0, timings, opacity, false) === 0,
      "idle progress is exactly 0"
    );
    assert(
      computeLivingRegionOpacityMultiplier(true, state, t0, timings, opacity, 5, false) === 1,
      "idle multiplier is exactly 1 even for a reserved cell"
    );
    assert(
      computeLivingRegionOpacityMultiplier(false, state, t0, timings, opacity, 5, false) === 1,
      "multiplier is 1 for a non-reserved cell regardless of phase"
    );
    assert(
      computeLivingRegionOpacityMultiplier(true, null, t0, timings, opacity, 5, false) === 1,
      "multiplier is 1 when no state is supplied at all (every call site before a later commit)"
    );
  }

  // --- 2. Full happy path: press, hold past threshold, reveal, explicit dismiss. ---
  {
    let t = 2000;
    let state = createLivingRegionState(t);

    state = dispatchLivingRegionEvent(state, "pointerDown", t, timings, opacity, false);
    assert(state.phase === "anticipating", "pointerDown from idle -> anticipating");

    // Partway through anticipation: progress should be partial, strictly
    // between 0 and the ceiling.
    t += timings.holdThresholdMs / 2;
    const midProgress = computeLivingRegionProgress(state, t, timings, opacity, false);
    assert(
      midProgress > 0 && midProgress < opacity.anticipationCeilingFraction,
      `mid-anticipation progress (${midProgress.toFixed(3)}) is between 0 and the ceiling (${opacity.anticipationCeilingFraction})`
    );

    // Cross the hold threshold while still "pressed" -- advance, not an event.
    t = state.phaseStartedAt + timings.holdThresholdMs + 1;
    state = advanceLivingRegionState(state, t, timings, opacity, false);
    assert(state.phase === "revealed", "advancing past the hold threshold -> revealed");

    // Releasing the press while revealed must be a no-op (reveal persists).
    const beforeRelease = state;
    state = dispatchLivingRegionEvent(state, "pointerUp", t, timings, opacity, false);
    assert(state === beforeRelease, "pointerUp while revealed is a no-op (release doesn't dismiss)");

    // Partway into reveal, progress should be climbing toward 1.
    t += timings.revealDurationMs / 2;
    const revealMidProgress = computeLivingRegionProgress(state, t, timings, opacity, false);
    assert(
      revealMidProgress > opacity.anticipationCeilingFraction && revealMidProgress < 1,
      `mid-reveal progress (${revealMidProgress.toFixed(3)}) is climbing toward 1`
    );

    // Fully revealed.
    t = state.phaseStartedAt + timings.revealDurationMs + 1;
    assert(
      computeLivingRegionProgress(state, t, timings, opacity, false) === 1,
      "progress reaches exactly 1 once the reveal duration elapses"
    );

    // Explicit dismiss (tap-outside / scroll-away / idle-timeout, all reported generically).
    state = dispatchLivingRegionEvent(state, "dismiss", t, timings, opacity, false);
    assert(state.phase === "dismissing", "dismiss while revealed -> dismissing");
    assert(state.progressAtPhaseStart === 1, "dismissing carries over the full progress it started from");

    // Partway through the fade, then complete.
    t = state.phaseStartedAt + timings.dismissDurationMs / 2;
    const dismissMidProgress = computeLivingRegionProgress(state, t, timings, opacity, false);
    assert(
      dismissMidProgress > 0 && dismissMidProgress < 1,
      `mid-dismiss progress (${dismissMidProgress.toFixed(3)}) is fading between 0 and 1`
    );

    t = state.phaseStartedAt + timings.dismissDurationMs + 1;
    state = advanceLivingRegionState(state, t, timings, opacity, false);
    assert(state.phase === "idle", "dismissal completes -> back to idle, closing the loop");
    assert(
      computeLivingRegionProgress(state, t, timings, opacity, false) === 0,
      "progress is back to 0 once idle again"
    );
  }

  // --- 3. Early release during anticipation: dismissing starts from the
  //        SMALL carried-over progress, not from the ceiling. ---
  {
    let t = 5000;
    let state = createLivingRegionState(t);
    state = dispatchLivingRegionEvent(state, "pointerDown", t, timings, opacity, false);
    t += 100; // released well before the 700ms threshold
    const progressAtRelease = computeLivingRegionProgress(state, t, timings, opacity, false);
    state = dispatchLivingRegionEvent(state, "pointerUp", t, timings, opacity, false);
    assert(state.phase === "dismissing", "early pointerUp during anticipation -> dismissing");
    assert(
      Math.abs(state.progressAtPhaseStart - progressAtRelease) < 1e-9,
      `dismissing starts from the actual progress at release (${progressAtRelease.toFixed(4)}), not the ceiling`
    );
    assert(
      state.progressAtPhaseStart < opacity.anticipationCeilingFraction,
      "carried-over progress from an early release is below the full anticipation ceiling"
    );
  }

  // --- 4. "cancel" behaves like pointerUp. ---
  {
    let t = 6000;
    let state = createLivingRegionState(t);
    state = dispatchLivingRegionEvent(state, "pointerDown", t, timings, opacity, false);
    state = dispatchLivingRegionEvent(state, "cancel", t + 50, timings, opacity, false);
    assert(state.phase === "dismissing", "cancel during anticipation -> dismissing, same as pointerUp");
  }

  // --- 5. pointerDown is a no-op unless idle. ---
  {
    let t = 7000;
    let state = createLivingRegionState(t);
    state = dispatchLivingRegionEvent(state, "pointerDown", t, timings, opacity, false);
    const anticipatingState = state;
    state = dispatchLivingRegionEvent(state, "pointerDown", t + 10, timings, opacity, false);
    assert(state === anticipatingState, "a second pointerDown while already anticipating is a no-op");
  }

  // --- 6. Reduced motion: instant terminal values, no interpolation, but
  //        thresholds still genuinely elapse. ---
  {
    let t = 8000;
    let state = createLivingRegionState(t);
    state = dispatchLivingRegionEvent(state, "pointerDown", t, timings, opacity, true);
    assert(
      computeLivingRegionProgress(state, t, timings, opacity, true) === opacity.anticipationCeilingFraction,
      "reduced motion: anticipation is instantly at the ceiling, no ramp"
    );
    // Advancing before the threshold must NOT reveal early.
    const tooSoon = advanceLivingRegionState(state, t + 1, timings, opacity, true);
    assert(tooSoon.phase === "anticipating", "reduced motion still respects the real hold threshold (doesn't reveal early)");

    t = state.phaseStartedAt + timings.holdThresholdMs + 1;
    state = advanceLivingRegionState(state, t, timings, opacity, true);
    assert(state.phase === "revealed", "reduced motion: still transitions to revealed once the threshold genuinely elapses");
    assert(
      computeLivingRegionProgress(state, t, timings, opacity, true) === 1,
      "reduced motion: revealed is instantly at full progress"
    );

    state = dispatchLivingRegionEvent(state, "dismiss", t, timings, opacity, true);
    assert(
      computeLivingRegionProgress(state, t, timings, opacity, true) === 0,
      "reduced motion: dismissing is instantly at 0 (no fade)"
    );
    state = advanceLivingRegionState(state, t + 1, timings, opacity, true);
    assert(state.phase === "idle", "reduced motion: dismissal completes on the very next advance (no duration to wait out)");
  }

  // --- 7. Peak multiplier: a sane, real-numbers-based magnitude. ---
  {
    const peak = computeRevealPeakMultiplier(near, LIVING_FIELD_CONFIG.intensity, opacity);
    assert(peak > 1, `peak multiplier is greater than 1 (got ${peak.toFixed(2)}) -- reveal is actually brighter than ambient`);
    const typicalOpacity = (near.baseOpacity + near.waveAmplitude * 0.5) * LIVING_FIELD_CONFIG.intensity;
    const resultingOpacity = typicalOpacity * peak;
    assert(
      Math.abs(resultingOpacity - opacity.revealOpacityTarget) < 0.01,
      `a typical cell at full reveal lands close to revealOpacityTarget (got ${resultingOpacity.toFixed(3)}, target ${opacity.revealOpacityTarget})`
    );
  }

  if (failures === 0) {
    console.log(`\nPASS: all Living Region state checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
