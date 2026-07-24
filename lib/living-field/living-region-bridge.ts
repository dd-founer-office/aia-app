/**
 * Living Field — Living Region Bridge
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 3B.1.
 *
 * A thin page-facing surface over whichever LivingFieldEngine instance is
 * currently mounted (engine-registry.ts) -- the "page -> engine bridge"
 * this commit calls for, distinct from the engine's own API
 * (LivingFieldEngine.reportLivingRegionEvent / setReservedVerse, engine.ts).
 *
 * ---------------------------------------------------------------------------
 * WHY THIS LIVES INSIDE lib/living-field/, UNLIKE ambient-language.ts
 * ---------------------------------------------------------------------------
 * lib/ambient-language/ is a genuine PEER of the Kernel -- it calls INTO
 * the engine through one method, from outside, per AmbientLanguageLayer.md.
 * The Living Region is documented (living-region.ts's header) as a property
 * of the Kernel itself, not a peer. This bridge is correspondingly thin
 * enough to be almost invisible: it does exactly two things (forward an
 * event, forward a reservation) and owns no logic, no vocabulary, no
 * gating -- everything that ambient-language.ts's notifyEvent() has to
 * decide for itself (reduced motion, cooldowns, which word) has no
 * equivalent here, because the Reflection Engine (living-region-state.ts)
 * already owns all of that decision-making. This file is pure plumbing.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE DOES NOT DO
 * ---------------------------------------------------------------------------
 * No DOM access, no pointer coordinates, no knowledge of any specific page.
 * If no engine is currently mounted (kill switch on, SSR, or called before
 * LivingField.tsx mounts), both functions are silent no-ops -- exactly the
 * same "must handle gracefully" contract engine-registry.ts already
 * documents for getActiveLivingFieldEngine()'s callers.
 */

import { getActiveLivingFieldEngine } from "./engine-registry";
import type { LivingRegionEvent } from "./living-region-state";
import type { ReservedVerseInput } from "./living-region";

/**
 * Forwards one of the four Living Region events -- "pointerDown" |
 * "pointerUp" | "cancel" | "dismiss" -- to the currently-mounted engine, if
 * any. A no-op when no engine is mounted; the caller (a later commit's Home
 * page) never needs to check first.
 */
export function reportLivingRegionEvent(event: LivingRegionEvent): void {
  getActiveLivingFieldEngine()?.reportLivingRegionEvent(event);
}

/**
 * Forwards a Reserved Semantic Cells reservation (or `null` to clear one) to
 * the currently-mounted engine, if any. A thin, symmetrical counterpart to
 * reportLivingRegionEvent() above -- a later commit's Home page calls this
 * once, with the real KKA-001 verse (via reserved-verse-bridge.ts), rather
 * than reaching into engine-registry.ts directly.
 */
export function setLivingRegionVerse(input: ReservedVerseInput | null): void {
  getActiveLivingFieldEngine()?.setReservedVerse(input);
}
