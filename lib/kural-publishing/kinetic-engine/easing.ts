/**
 * Kinetic Typography Engine — Easing
 * ----------------------------------------------------------------------------
 * The small, named set of curves every keyframe segment can choose from.
 * Content-agnostic, reused unchanged from the shape validated in the
 * Phase 1/2 kinetic-reel-poc renderer.
 */

import type { EasingId } from "./types";

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** A controlled overshoot past 1 before settling -- used sparingly
 *  (fixed overshoot strength, no per-call tuning) to keep the engine's
 *  easing set small and predictable. */
function easeOutBack(t: number): number {
  const x = clamp01(t);
  const c1 = 0.6;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function applyEasing(id: EasingId | undefined, t: number): number {
  switch (id) {
    case "linear":
      return clamp01(t);
    case "easeInOutCubic":
      return easeInOutCubic(t);
    case "easeOutBack":
      return easeOutBack(t);
    case "easeOutCubic":
    default:
      return easeOutCubic(t);
  }
}
