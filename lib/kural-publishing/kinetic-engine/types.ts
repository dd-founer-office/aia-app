/**
 * Kinetic Typography Engine — Data Model
 * ----------------------------------------------------------------------------
 * This is the REUSABLE engine, not a Reel. Nothing in this folder knows
 * about "Fear," "Burden," any other mood/stage name, or any specific
 * Tamil word -- a KineticScript is pure data the caller supplies. A
 * future Reel (its words, timing, focal choices, palette) is authored
 * data built on top of this, never a branch inside it.
 *
 * Every word carries its OWN keyframe track (position, rotation, scale,
 * opacity, blur) -- there is no single "focal word" concept baked into
 * the engine; a word reads as a hero simply because its data gives it a
 * bigger size, a longer hold, a higher drawOrder, etc. "Dramatic size
 * contrast," "independent rotation," "words moving toward/away from the
 * viewer" are all just values in this data, not special-cased code.
 */

export type EasingId = "linear" | "easeOutCubic" | "easeInOutCubic" | "easeOutBack";

export interface Keyframe {
  /** Seconds from the start of the COMPOSITION this word belongs to
   *  (never from the start of the whole script) -- so a composition's
   *  words can be reordered/retimed without touching any other
   *  composition. */
  atSec: number;
  /** Canvas-pixel anchor the word is centered on. */
  x: number;
  y: number;
  rotationRad: number;
  scaleX: number;
  scaleY: number;
  /** 0..1 */
  opacity: number;
  /** Gaussian blur radius in canvas px (ctx.filter) -- the engine's
   *  "moving through depth" cue: large+blurred reads as close-up/out of
   *  focus, 0 reads as arrived and resolved. */
  blurPx: number;
  /** Eases the segment ENDING at this keyframe (i.e. the transition
   *  from the previous keyframe to this one). Ignored on a word's first
   *  keyframe. Defaults to "easeOutCubic". */
  easing?: EasingId;
}

export interface WordSpec {
  id: string;
  /** The word/phrase to draw, exactly as authored -- the engine never
   *  splits, retypes, or reorders this text. */
  text: string;
  color: string;
  /** Noto Sans Tamil only, per the standing rule for this system --
   *  the engine takes whatever font family string the caller resolves
   *  and never substitutes a different typeface itself. 700 requires
   *  app/layout.tsx's Noto Sans Tamil weight list to include "700". */
  weight: 400 | 500 | 700;
  /** Base font size in px; keyframe scaleX/scaleY multiply this, they
   *  don't replace it -- so "oversized entrance, resting at 1x" reads
   *  against a word's own true size, not a shared constant. */
  sizePx: number;
  /** Paint order -- higher paints on top. This is what makes an
   *  "overlapping composition" read as layered depth rather than a
   *  messy z-fight: it's an explicit authoring choice per word, not
   *  derived from anything else. */
  drawOrder: number;
  /** At least one keyframe. Before the first keyframe's atSec, the word
   *  isn't drawn at all (hasn't entered yet). After the last keyframe,
   *  the word HOLDS at that keyframe's values -- this is what makes a
   *  "readable hold" the default behavior, not something each
   *  composition has to remember to implement. */
  keyframes: Keyframe[];
}

export interface CompositionSpec {
  id: string;
  /** Seconds, absolute, within the whole script's timeline. */
  startSec: number;
  endSec: number;
  backgroundColor: string;
  /** Optional radial vignette tint -- purely a background mood cue,
   *  independent of any word. */
  vignetteColor?: string;
  vignetteAlpha?: number;
  words: WordSpec[];
}

export interface KineticScript {
  width: number;
  height: number;
  durationSec: number;
  /** A single resolved font-family string (e.g. from
   *  KuralHeroCanvas.tsx's resolveAllFonts().tamilFont) -- Noto Sans
   *  Tamil only. The engine draws every word in this one family; weight
   *  (400/500/700) is the only typographic register it varies. */
  fontFamily: string;
  /** Sequential, non-overlapping compositions -- "distinct typographic
   *  compositions" are just separate entries here; a hard cut between
   *  them (no cross-fade) is the engine's default, matching how the
   *  reference video itself moves between its own layouts. */
  compositions: CompositionSpec[];
}
