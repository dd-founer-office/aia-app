/**
 * Living Kernel — Engine Registry
 * ----------------------------------------------------------------------------
 * A minimal bridge so the Ambient Language Layer (which lives outside the
 * Kernel entirely -- see lib/ambient-language/) can reach whichever
 * LivingFieldEngine instance is currently mounted, without the Kernel
 * needing to know anything about React, event names, or the application at
 * large.
 *
 * This is deliberately NOT the same category of thing the Living Kernel
 * Architecture constitution's Principle 6 warns against ("avoid hidden
 * global state"). That principle is about ENGINE computation state --
 * whether Field/Civilization/Affinity/Harmony secretly share mutable data
 * behind each other's backs. This registry holds no computation state at
 * all; it's ordinary application-wiring (which instance is currently live),
 * the same shape of thing almost any app needs somewhere when a singular
 * resource is created inside one component and needs to be reachable from
 * unrelated call sites elsewhere in the tree. There is exactly one such
 * resource (the mounted engine), exactly one place it's set (LivingField.tsx,
 * on mount/unmount), and exactly one consumer (ambient-language.ts).
 */

import type { LivingFieldEngine } from "./engine";

let activeEngine: LivingFieldEngine | null = null;

/** Called by LivingField.tsx when it creates (or destroys) the engine for
 *  the currently mounted field. Pass `null` on unmount. */
export function setActiveLivingFieldEngine(engine: LivingFieldEngine | null): void {
  activeEngine = engine;
}

/** Called by the Ambient Language Layer. Returns `null` if no field is
 *  currently mounted (e.g. the kill switch is on, or during initial
 *  server-side render) -- callers must handle that gracefully rather than
 *  assume a field always exists. */
export function getActiveLivingFieldEngine(): LivingFieldEngine | null {
  return activeEngine;
}
