/**
 * Kinetic Typography Engine — Proof of Concept Demo Script
 * ----------------------------------------------------------------------------
 * Content-specific DATA built on top of the reusable engine
 * (lib/kural-publishing/kinetic-engine/) -- this file is deliberately
 * OUTSIDE that folder, proving the engine/authoring boundary the
 * founder asked for: nothing in the engine itself knows these are the
 * words, which one is focal, or what a "composition" means here.
 *
 * Text is the founder's own previously-approved Tamil line (the Fear
 * stage's two lines from the earlier kinetic-reel-poc's canon), split
 * into its natural words and never retyped, rewritten, or reordered --
 * Noto Sans Tamil only, per the standing rule for this system:
 *   Line 1: "நம் மொழியைக் காப்பாற்ற வேண்டும்..."
 *   Line 2: "என்ற நம் பயம்,"
 *
 * Two compositions, one per authored line (hard cut at 5.5s), same
 * "never merge two different given lines into one visual unit"
 * discipline already established in kinetic-reel-poc:
 *  A: "காப்பாற்ற" (the urgent verb, "to protect/save") is focal.
 *  B: "பயம்," (the stage's own word, "fear") is focal.
 * Same focal choice already reasoned through for this exact text in
 * kinetic-reel-poc/composition.ts -- reused here for consistency.
 *
 * Starting scale values and the escalating rotation/position drift
 * follow the same researched intensity as before (confirmed off the
 * reference tutorial's own AE layer panel): supporting words start
 * 6-6.5x oversized and blurred, each composition's own focal word far
 * more extreme (18x / 35x), and every word keeps slowly drifting
 * (rotation + position, linear easing) through its composition's hold,
 * Composition B's drift roughly double Composition A's.
 */

import type { KineticScript } from "../kinetic-engine/types";

const BG = "#F3EEE4";
const CHARCOAL = "#241F1C";
const MUTED = "#6B625A";
const ACCENT_ORANGE = "#C1702E";

export const KINETIC_ENGINE_POC_DURATION_SEC = 11;

export function buildDemoScript(fontFamily: string, width: number, height: number): KineticScript {
  return {
    width,
    height,
    durationSec: KINETIC_ENGINE_POC_DURATION_SEC,
    fontFamily,
    compositions: [
      {
        id: "composition-a",
        startSec: 0,
        endSec: 5.5,
        backgroundColor: BG,
        vignetteColor: CHARCOAL,
        vignetteAlpha: 0.04,
        words: [
          {
            id: "a-kaappaatra",
            // Focal -- the urgent verb. 9 grapheme clusters, so its
            // rest size is smaller than a short focal word (e.g.
            // "பயம்," below) would need to stay inboard of the canvas
            // at this rotation; no auto-fit in the engine, verified via
            // screenshot same as every prior word in this file.
            text: "காப்பாற்ற",
            color: CHARCOAL,
            weight: 700,
            sizePx: 150,
            drawOrder: 4,
            keyframes: [
              { atSec: 0, x: 540, y: -250, rotationRad: -0.3, scaleX: 18, scaleY: 18, opacity: 0, blurPx: 20 },
              { atSec: 1.0, x: 540, y: 950, rotationRad: -0.08, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutBack" },
              { atSec: 5.5, x: 560, y: 920, rotationRad: -0.22, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
          {
            id: "a-nam",
            text: "நம்",
            color: ACCENT_ORANGE,
            weight: 500,
            sizePx: 95,
            drawOrder: 1,
            keyframes: [
              { atSec: 0.3, x: -200, y: 560, rotationRad: 0.5, scaleX: 6, scaleY: 6, opacity: 0, blurPx: 10 },
              { atSec: 1.05, x: 260, y: 560, rotationRad: 0.12, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
              { atSec: 5.5, x: 230, y: 580, rotationRad: 0.28, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
          {
            id: "a-mozhiyaik",
            text: "மொழியைக்",
            color: MUTED,
            weight: 500,
            sizePx: 85,
            drawOrder: 2,
            keyframes: [
              { atSec: 0.5, x: 1280, y: 440, rotationRad: -0.55, scaleX: 6.5, scaleY: 6.5, opacity: 0, blurPx: 10 },
              { atSec: 1.3, x: 760, y: 460, rotationRad: -0.18, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
              { atSec: 5.5, x: 790, y: 440, rotationRad: -0.32, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
          {
            id: "a-vendum",
            text: "வேண்டும்...",
            color: ACCENT_ORANGE,
            weight: 500,
            sizePx: 80,
            drawOrder: 3,
            keyframes: [
              { atSec: 0.75, x: 1280, y: 1340, rotationRad: 0.4, scaleX: 6, scaleY: 6, opacity: 0, blurPx: 10 },
              { atSec: 1.6, x: 720, y: 1300, rotationRad: 0.2, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
              { atSec: 5.5, x: 750, y: 1330, rotationRad: 0.36, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
        ],
      },
      {
        id: "composition-b",
        startSec: 5.5,
        endSec: 11,
        backgroundColor: BG,
        vignetteColor: ACCENT_ORANGE,
        vignetteAlpha: 0.045,
        words: [
          {
            id: "b-bayam",
            // Focal -- the stage's own word, "fear." Short (4 grapheme
            // clusters + comma), so it can take a large rest size
            // safely at this rotation.
            text: "பயம்,",
            color: CHARCOAL,
            weight: 700,
            sizePx: 260,
            drawOrder: 3,
            keyframes: [
              { atSec: 0, x: 1300, y: 2300, rotationRad: 0.4, scaleX: 35, scaleY: 35, opacity: 0, blurPx: 24 },
              { atSec: 1.1, x: 580, y: 1120, rotationRad: 0.22, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutBack" },
              { atSec: 5.5, x: 620, y: 1080, rotationRad: 0.58, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
          {
            id: "b-enra",
            text: "என்ற",
            color: ACCENT_ORANGE,
            weight: 500,
            sizePx: 95,
            drawOrder: 1,
            keyframes: [
              { atSec: 0.3, x: 540, y: -150, rotationRad: -0.5, scaleX: 6, scaleY: 6, opacity: 0, blurPx: 10 },
              { atSec: 1.3, x: 310, y: 400, rotationRad: -0.2, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
              { atSec: 5.5, x: 280, y: 430, rotationRad: -0.52, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
          {
            id: "b-nam",
            text: "நம்",
            color: MUTED,
            weight: 500,
            sizePx: 95,
            drawOrder: 2,
            keyframes: [
              { atSec: 0.55, x: 1300, y: -150, rotationRad: 0.55, scaleX: 6.5, scaleY: 6.5, opacity: 0, blurPx: 10 },
              { atSec: 1.6, x: 770, y: 340, rotationRad: 0.3, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
              { atSec: 5.5, x: 810, y: 300, rotationRad: 0.62, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "linear" },
            ],
          },
        ],
      },
    ],
  };
}
