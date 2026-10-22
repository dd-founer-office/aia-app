/**
 * Kinetic Typography Reel — Phase 1 Proof of Concept — Renderer
 * ----------------------------------------------------------------------------
 * Pure Canvas2D drawing, same convention as every renderer already in
 * lib/kural-publishing/: a function that paints one frame into a given
 * ctx for a given moment in time, with no DOM/React dependency of its own.
 * The only thing new relative to the existing five templates is that this
 * one takes a *time* input and is meant to be called every animation
 * frame, not once per content change -- see this folder's own header
 * note: that is deliberately isolated here, not added to the shared
 * KuralHeroCanvas.tsx dispatch.
 *
 * Text-only, word/line granularity. Never slices a word mid-glyph: a word
 * is either fully hidden, animating in, fully visible, or fading out as
 * one unit, so Tamil grapheme clusters are always drawn through a single,
 * complete ctx.fillText(word, ...) call -- the same thing that already
 * keeps Tamil shaping correct in every static renderer in this app.
 *
 * Motion is 2D-only (translate/scale/shear via ctx.transform), per the
 * read-only feasibility assessment: Canvas2D has no z-axis, so "perspective"
 * here is a restrained shear + scale-settle, not true 3D.
 */

import { KINETIC_REEL_DURATION_SEC, KINETIC_REEL_STAGES, type KineticReelMood } from "./script";

export const BG_IVORY = "#F6F1E7";
export const HERITAGE_RED = "#7A1B26";
export const RESTRAINED_ORANGE = "#B5672B";
export const CHARCOAL = "#2A2622";

interface MotionParams {
  color: string;
  /** easeOutBack overshoot strength -- 0 is a plain, monotonic ease (no
   *  bounce past rest size); higher values pop past 1x scale before
   *  settling, reading as tension. */
  overshoot: number;
  /** Vertical settle distance in px at a 1080-wide canvas (scaled by
   *  actual width) -- how far below rest position a word starts. */
  punchY: number;
  /** Shear amount a word starts at and settles out of -- the
   *  restrained, 2D "perspective-like" tilt. */
  skew: number;
  wordDuration: number;
  wordStagger: number;
  lineStagger: number;
  /** 0 disables the exit fade entirely (used by the final stage, which
   *  must hold at full visibility through the Reel's last frame). */
  exitDuration: number;
}

const MOTION: Record<KineticReelMood, MotionParams> = {
  // Fear / Burden: fast, overshooting pops with a visible downward settle
  // and a slight backward tilt righting itself -- reads as tense.
  forceful: { color: HERITAGE_RED, overshoot: 1.7, punchY: 46, skew: 0.055, wordDuration: 0.32, wordStagger: 0.09, lineStagger: 0.48, exitDuration: 0.4 },
  // Release: the overshoot and punch both soften markedly -- the same
  // vocabulary as "forceful" but visibly letting go of tension.
  release: { color: RESTRAINED_ORANGE, overshoot: 0.5, punchY: 18, skew: 0.02, wordDuration: 0.5, wordStagger: 0.17, lineStagger: 0.7, exitDuration: 0.5 },
  // Belonging: no overshoot, minimal settle, long unhurried stagger, and
  // no exit -- this is the Reel's final hold, held to the last frame.
  stillness: { color: CHARCOAL, overshoot: 0, punchY: 6, skew: 0, wordDuration: 0.8, wordStagger: 0.28, lineStagger: 0.85, exitDuration: 0 },
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Standard easeOutBack: 0 at t=0, 1 at t=1, overshooting above 1 before
 *  settling when `overshoot` > 0; a plain smooth ease when it's 0. */
function easeOutBack(t: number, overshoot: number): number {
  const x = clamp01(t);
  const c1 = overshoot;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function hexWithAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Greedy wraps one semantic line's words into one or more visual rows at
 *  the given max width -- a word is always a whole, indivisible unit here,
 *  same discipline as wrapText() in every other renderer in this app. */
function wrapLineWords(ctx: CanvasRenderingContext2D, words: readonly string[], maxWidth: number, spaceWidth: number): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let currentWidth = 0;
  for (const word of words) {
    const wordWidth = ctx.measureText(word).width;
    const extra = current.length ? spaceWidth + wordWidth : wordWidth;
    if (current.length && currentWidth + extra > maxWidth) {
      rows.push(current);
      current = [word];
      currentWidth = wordWidth;
    } else {
      current.push(word);
      currentWidth += extra;
    }
  }
  if (current.length) rows.push(current);
  return rows;
}

interface LaidOutWord {
  word: string;
  /** Offset from the row's own horizontal center. */
  centerX: number;
  /** Index of this word within its ORIGINAL semantic line -- drives
   *  stagger timing, independent of which visual row wrapping put it in,
   *  so a wrapped line still reveals left-to-right, top-to-bottom in one
   *  continuous rhythm. */
  wordIndexInLine: number;
}

interface LaidOutRow {
  lineIndex: number;
  words: LaidOutWord[];
}

function layoutRow(ctx: CanvasRenderingContext2D, words: readonly string[], startIndexInLine: number, spaceWidth: number): LaidOutWord[] {
  const widths = words.map((w) => ctx.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + spaceWidth * Math.max(0, words.length - 1);
  let cursor = -total / 2;
  const laid: LaidOutWord[] = [];
  for (let i = 0; i < words.length; i++) {
    const w = widths[i];
    laid.push({ word: words[i], centerX: cursor + w / 2, wordIndexInLine: startIndexInLine + i });
    cursor += w + spaceWidth;
  }
  return laid;
}

export interface KineticReelFrameOptions {
  width: number;
  height: number;
  /** Seconds elapsed since the Reel started; clamped to
   *  [0, KINETIC_REEL_DURATION_SEC]. */
  elapsedSec: number;
  tamilFont: string;
}

/** Draws one frame of the kinetic typography Reel at `elapsedSec`.
 *  Deterministic and stateless: calling it twice with the same options
 *  always draws the same frame, which is what makes both scrubbing/replay
 *  and frame-by-frame video capture work from the same function. */
export function drawKineticReelFrame(ctx: CanvasRenderingContext2D, opts: KineticReelFrameOptions): void {
  const { width, height, tamilFont } = opts;
  const t = Math.max(0, Math.min(opts.elapsedSec, KINETIC_REEL_DURATION_SEC));
  const stage = KINETIC_REEL_STAGES.find((s) => t >= s.startSec && t < s.endSec) ?? KINETIC_REEL_STAGES[KINETIC_REEL_STAGES.length - 1];
  const tsStage = t - stage.startSec;
  const stageDuration = stage.endSec - stage.startSec;
  const motion = MOTION[stage.mood];

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG_IVORY;
  ctx.fillRect(0, 0, width, height);

  // Restrained vignette tinted by the current stage's own color -- the
  // only background motion in the whole piece, deliberately subtle.
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.18, width / 2, height / 2, height * 0.78);
  vignette.addColorStop(0, hexWithAlpha(motion.color, 0));
  vignette.addColorStop(1, hexWithAlpha(motion.color, 0.055));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const baseFontSize = Math.round(width * 0.06);
  const font = `700 ${baseFontSize}px ${tamilFont}`;
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const spaceWidth = ctx.measureText("அ அ").width - ctx.measureText("அஅ").width || baseFontSize * 0.28;
  const maxRowWidth = width * 0.84;

  // Wrap every semantic line into visual rows first (never splitting a
  // word), then stack ALL of this stage's rows as one vertically centered
  // block -- so a long line that wraps into two rows still reads as part
  // of the same stage, not a separate one.
  const rows: LaidOutRow[] = [];
  stage.lines.forEach((line, lineIndex) => {
    const words = line.split(/\s+/).filter(Boolean);
    const wrapped = wrapLineWords(ctx, words, maxRowWidth, spaceWidth);
    let wordCursor = 0;
    for (const rowWords of wrapped) {
      rows.push({ lineIndex, words: layoutRow(ctx, rowWords, wordCursor, spaceWidth) });
      wordCursor += rowWords.length;
    }
  });

  const lineStep = baseFontSize * 1.48;
  const totalBlockHeight = rows.length * lineStep;
  const blockTop = height / 2 - totalBlockHeight / 2;

  rows.forEach((row, rowIndex) => {
    const rowCenterY = blockTop + lineStep * (rowIndex + 0.5);

    for (const laidWord of row.words) {
      const entranceStart = row.lineIndex * motion.lineStagger + laidWord.wordIndexInLine * motion.wordStagger;
      const entranceT = clamp01((tsStage - entranceStart) / motion.wordDuration);
      if (entranceT <= 0) continue;

      const rawScale = easeOutBack(entranceT, motion.overshoot);
      const settle = clamp01(entranceT);
      let alpha = clamp01(entranceT / 0.5);
      let scaleMul = 1;

      if (motion.exitDuration > 0) {
        const exitStart = stageDuration - motion.exitDuration;
        const exitT = clamp01((tsStage - exitStart) / motion.exitDuration);
        alpha *= 1 - exitT;
        scaleMul = lerp(1, 0.94, exitT);
      }

      if (alpha <= 0.002) continue;

      const translateY = (1 - settle) * motion.punchY * (width / 1080);
      const skew = (1 - settle) * motion.skew;
      const scale = Math.max(0.001, rawScale) * scaleMul;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = motion.color;
      ctx.translate(width / 2 + laidWord.centerX, rowCenterY + translateY);
      ctx.transform(1, 0, skew, 1, 0, 0);
      ctx.scale(scale, scale);
      ctx.fillText(laidWord.word, 0, 0);
      ctx.restore();
    }
  });
}
