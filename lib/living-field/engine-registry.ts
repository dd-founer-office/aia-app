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
 *
 * `onLivingFieldEngineReady` exists so a call site (e.g. the Home page)
 * never has to guess whether the engine has registered yet by the time its
 * own effect runs -- a real, order-dependent race if it relied on
 * `getActiveLivingFieldEngine()` returning non-null on the first check.
 * This is a plain callback/observer pattern, not a timer or a poll: it
 * calls back the instant an engine becomes available, whether that's
 * synchronously (already available) or later (once one registers) --
 * correct regardless of which component's effect happens to run first.
 */

import type { LivingFieldEngine } from "./engine";

let activeEngine: LivingFieldEngine | null = null;
let pendingReadyCallbacks: Array<(engine: LivingFieldEngine) => void> = [];

/** Called by LivingField.tsx when it creates (or destroys) the engine for
 *  the currently mounted field. Pass `null` on unmount. Firing pending
 *  "ready" callbacks here (rather than requiring callers to poll) is what
 *  makes `onLivingFieldEngineReady` order-independent. */
export function setActiveLivingFieldEngine(engine: LivingFieldEngine | null): void {
  activeEngine = engine;
  if (engine && pendingReadyCallbacks.length > 0) {
    const callbacks = pendingReadyCallbacks;
    pendingReadyCallbacks = [];
    for (const callback of callbacks) callback(engine);
  }
}

/** Called by the Ambient Language Layer. Returns `null` if no field is
 *  currently mounted (e.g. the kill switch is on, or during initial
 *  server-side render) -- callers must handle that gracefully rather than
 *  assume a field always exists. */
export function getActiveLivingFieldEngine(): LivingFieldEngine | null {
  return activeEngine;
}

/**
 * Calls `callback` with the active engine -- immediately if one is already
 * registered, or as soon as one registers, whichever comes first. Correct
 * regardless of whether this is called before or after
 * `setActiveLivingFieldEngine`, so a caller never needs to guess about
 * mount ordering between sibling components.
 *
 * Returns an unsubscribe function. Callers that might unmount before the
 * engine ever becomes ready (e.g. a page navigated away from quickly)
 * should call it in their effect cleanup, the same as they would for any
 * other subscription -- otherwise a callback registered by a since-
 * unmounted component would still fire later when an engine does appear.
 */
export function onLivingFieldEngineReady(callback: (engine: LivingFieldEngine) => void): () => void {
  if (activeEngine) {
    callback(activeEngine);
    return () => {};
  }
  pendingReadyCallbacks.push(callback);
  return () => {
    pendingReadyCallbacks = pendingReadyCallbacks.filter((cb) => cb !== callback);
  };
}
