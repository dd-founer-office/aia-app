/**
 * Purananuru Carousel — Design Overrides (client-side persistence)
 * ----------------------------------------------------------------------------
 * Own, separate localStorage keys from aathichoodi-carousel-design-store.ts
 * — never shares state with the Aathichoodi Series' design controls.
 *
 * Phase 1 scope note: neither PublishingWorkspace's UI nor
 * purananuru-carousel-renderer.ts consumes this yet — the brief's Phase 1
 * is the content engine + generator integration, not an interactive design
 * editor (that's the same later phase as the animated Reel). load/save
 * here are fully functional against real localStorage today; wiring an
 * actual invert-colors toggle into the renderer's palette and into a
 * Design Controls panel (mirroring aathichoodi-carousel-design-store.ts's
 * fuller version) is future work this module is shaped to slot into
 * without another rewrite of its persistence shape.
 */

"use client";

const INVERT_STORAGE_KEY_PREFIX = "aia-purananuru-carousel-invert-v1-";

export function loadInvertColors(poemNumber: number): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${INVERT_STORAGE_KEY_PREFIX}${poemNumber}`) === "1";
  } catch {
    return false;
  }
}

export function saveInvertColors(poemNumber: number, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${INVERT_STORAGE_KEY_PREFIX}${poemNumber}`, value ? "1" : "0");
  } catch {
    /* storage unavailable (private browsing, quota) -- toggle just won't persist */
  }
}
