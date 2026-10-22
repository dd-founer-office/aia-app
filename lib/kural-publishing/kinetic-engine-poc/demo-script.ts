/**
 * Kinetic Typography Engine — Proof of Concept Demo Script
 * ----------------------------------------------------------------------------
 * Content-specific DATA built on top of the reusable engine
 * (lib/kural-publishing/kinetic-engine/) -- this file is deliberately
 * OUTSIDE that folder, proving the engine/authoring boundary the
 * founder asked for: nothing in the engine itself knows these are the
 * words, which one is focal, or what a "composition" means here.
 *
 * Text is the app's own existing placeholder phrase
 * ("அறம் செய விரும்பு" -- content-types.ts's DEFAULT_AATHICHOODI_CONTENT,
 * "Desire to do good deeds"), split into its three natural words and
 * never retyped, rewritten, or reordered. This is a mechanics demo, not
 * new Distant Devotion content.
 *
 * Two intentionally distinct compositions (hard cut at 5.5s):
 *  A: "அறம்" is focal (huge, center-high, entering from above).
 *  B: "விரும்பு" becomes focal instead (entering from below at a
 *     dramatic diagonal, reference-style), while "அறம்"/"செய" become
 *     the small supporting words in a new top cluster -- proving the
 *     engine isn't locked to one word always being the hero, or to one
 *     fixed layout shape.
 *
 * Starting scale values match the reference tutorial's actual intensity,
 * confirmed by reading the After Effects layer panel directly off the
 * source video (not estimated): supporting words there sampled around
 * 641% at their own entrance; focal/climactic words sampled 3120% and
 * 13130% at theirs. Every word here starts at 6-6.5x (600-650%)
 * oversized and blurred, each composition's own focal word starts far
 * more extreme (18x / 35x) -- escalating toward the second, climactic
 * composition, same as the reference's own escalation toward "but."
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
            id: "a-aram",
            text: "அறம்",
            color: CHARCOAL,
            weight: 700,
            sizePx: 300,
            drawOrder: 3,
            keyframes: [
              { atSec: 0, x: 540, y: -250, rotationRad: -0.3, scaleX: 18, scaleY: 18, opacity: 0, blurPx: 20 },
              { atSec: 1.0, x: 540, y: 640, rotationRad: -0.08, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutBack" },
            ],
          },
          {
            id: "a-seya",
            text: "செய",
            color: ACCENT_ORANGE,
            weight: 500,
            sizePx: 95,
            drawOrder: 1,
            keyframes: [
              { atSec: 0.35, x: -200, y: 860, rotationRad: 0.6, scaleX: 6, scaleY: 6, opacity: 0, blurPx: 10 },
              { atSec: 1.2, x: 330, y: 860, rotationRad: 0.18, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
            ],
          },
          {
            id: "a-virumbu",
            text: "விரும்பு",
            color: MUTED,
            weight: 500,
            sizePx: 95,
            drawOrder: 2,
            keyframes: [
              { atSec: 0.6, x: 1280, y: 980, rotationRad: -0.45, scaleX: 6.5, scaleY: 6.5, opacity: 0, blurPx: 10 },
              { atSec: 1.6, x: 760, y: 980, rotationRad: -0.14, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
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
            id: "b-virumbu",
            // 6 grapheme clusters -- the widest of the three words, so
            // its rest size/position is chosen to stay inboard of the
            // canvas edges even at this size and rotation (an earlier
            // pass at 260px/x=620 clipped off the right edge; the
            // engine has no auto-fit -- sizing/positioning a word so it
            // fits is the author's job, same as hand-composing in AE).
            text: "விரும்பு",
            color: CHARCOAL,
            weight: 700,
            sizePx: 200,
            drawOrder: 3,
            keyframes: [
              { atSec: 0, x: 1300, y: 2300, rotationRad: 0.4, scaleX: 35, scaleY: 35, opacity: 0, blurPx: 24 },
              { atSec: 1.1, x: 560, y: 1220, rotationRad: 0.22, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutBack" },
            ],
          },
          {
            id: "b-aram",
            text: "அறம்",
            color: ACCENT_ORANGE,
            weight: 500,
            sizePx: 90,
            drawOrder: 1,
            keyframes: [
              { atSec: 0.3, x: 540, y: -150, rotationRad: -0.5, scaleX: 6, scaleY: 6, opacity: 0, blurPx: 10 },
              { atSec: 1.3, x: 330, y: 380, rotationRad: -0.2, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
            ],
          },
          {
            id: "b-seya",
            text: "செய",
            color: MUTED,
            weight: 500,
            sizePx: 90,
            drawOrder: 2,
            keyframes: [
              { atSec: 0.55, x: 1300, y: -150, rotationRad: 0.55, scaleX: 6.5, scaleY: 6.5, opacity: 0, blurPx: 10 },
              { atSec: 1.6, x: 760, y: 340, rotationRad: 0.3, scaleX: 1, scaleY: 1, opacity: 1, blurPx: 0, easing: "easeOutCubic" },
            ],
          },
        ],
      },
    ],
  };
}
