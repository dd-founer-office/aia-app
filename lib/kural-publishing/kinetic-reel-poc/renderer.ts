/**
 * Kinetic Typography Reel — Phase 2 — Renderer
 * ----------------------------------------------------------------------------
 * Phase 1 gave every word the same treatment (pop-scale in, hold, fade
 * out) and read as generic animated subtitles -- too fast, too flat, no
 * size contrast. Phase 2 replaces that with a genuine hierarchy driven by
 * composition.ts: one oversized "focal" word per line gets the dramatic
 * kinetic typography treatment (rack-focus scale+blur entrance, restrained
 * rotation, foreshortening squash, simulated extrusion, a directional
 * drop shadow), while its supporting words hold still and simply fade in
 * -- "animate the focal word while keeping supporting text stable," per
 * the founder's brief.
 *
 * HONEST LIMITS (Canvas2D, no new dependency): everything here is a 2D
 * affine transform (translate/rotate/scale/shear) plus a CSS-style
 * ctx.filter blur and ctx.shadow* -- there is no z-buffer, no projection
 * matrix, no true vanishing point. "Depth" is staged with three cheap but
 * real tricks instead: (1) rack-focus -- a word starts oversized and
 * blurred and resolves to sharp, reading as "arriving from close up," (2)
 * foreshortening -- a non-uniform scaleY<scaleX squash at entry that
 * converges to 1:1, reading as "lying back, then facing the viewer," (3)
 * depth layering -- once a line has had its moment, it visibly recedes
 * (shrinks, dims, blurs, stays on screen) into a background plane while
 * the next line becomes the sharp foreground subject. None of this is
 * real 3D; it is believable 2D staging of depth, which is what Canvas2D
 * can actually do. See this session's Phase 2 report for the full
 * assessment of what would need WebGL/three.js instead.
 */

import { KINETIC_REEL_DURATION_SEC, KINETIC_REEL_STAGES } from "./script";
import { KINETIC_REEL_COMPOSITION, type KineticReelMood, type LineComposition, type StageComposition } from "./composition";

export const BG_IVORY = "#F6F1E7";
export const HERITAGE_RED = "#7A1B26";
export const RESTRAINED_ORANGE = "#B5672B";
export const CHARCOAL = "#2A2622";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function lerp(a: number, b: number, t: number): number {
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
/** Standard easeOutBack -- 0 at t=0, 1 at t=1, a controlled overshoot
 *  above 1 before settling when `overshoot` > 0. */
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

interface MoodVisual {
  focalColor: string;
  supportColor: string;
  extrudeColor: string;
  vignetteAlpha: number;
  /** Focal word's starting horizontal scale (how "oversized"/close-up it
   *  begins, before racking into its resting size). */
  startScaleX: number;
  /** startScaleY = startScaleX * squashRatio -- the foreshortening squash;
   *  closer to 1 = less dramatic, more upright. */
  squashRatio: number;
  startBlurPx: number;
  rotAmpRad: number;
  extrudeSteps: number;
  extrudeOffsetPx: number;
  easing: (t: number) => number;
}

const MOOD: Record<KineticReelMood, MoodVisual> = {
  // Fear: sharp, fast, a controlled overshoot -- tension, not chaos.
  forceful: {
    focalColor: HERITAGE_RED,
    supportColor: "#8C6A63",
    extrudeColor: "#330A0E",
    vignetteAlpha: 0.075,
    startScaleX: 1.75,
    squashRatio: 0.52,
    startBlurPx: 16,
    rotAmpRad: 0.15,
    extrudeSteps: 10,
    extrudeOffsetPx: 3.2,
    easing: (t) => easeOutBack(t, 0.6),
  },
  // Burden: slower, no bounce -- it settles under its own weight rather
  // than snapping into place. Heaviest extrusion of the four moods.
  weighted: {
    focalColor: "#6B141E",
    supportColor: "#8C6A63",
    extrudeColor: "#2A0A0D",
    vignetteAlpha: 0.08,
    startScaleX: 1.55,
    squashRatio: 0.58,
    startBlurPx: 15,
    rotAmpRad: 0.1,
    extrudeSteps: 11,
    extrudeOffsetPx: 3.6,
    easing: easeOutCubic,
  },
  // Release: the composition visibly relaxes -- smaller overshoot, softer
  // squash, a smooth in-out ease instead of a snap.
  release: {
    focalColor: RESTRAINED_ORANGE,
    supportColor: "#A58A74",
    extrudeColor: "#5C3312",
    vignetteAlpha: 0.05,
    startScaleX: 1.35,
    squashRatio: 0.72,
    startBlurPx: 9,
    rotAmpRad: 0.05,
    extrudeSteps: 6,
    extrudeOffsetPx: 2.4,
    easing: easeInOutCubic,
  },
  // Belonging: barely any zoom, no rotation, no extrusion -- calm,
  // confident, settles rather than performs.
  stillness: {
    focalColor: CHARCOAL,
    supportColor: "#746A5C",
    extrudeColor: "#1A1714",
    vignetteAlpha: 0.03,
    startScaleX: 1.14,
    squashRatio: 0.9,
    startBlurPx: 4,
    rotAmpRad: 0,
    extrudeSteps: 0,
    extrudeOffsetPx: 0,
    easing: easeOutCubic,
  },
};

/** Shrinks a font size until `text` fits `maxWidth` at the given weight/
 *  family -- the mechanism that keeps a long focal word (e.g. Burden's
 *  20-character "பொறுப்பாகிவிடுகிறது.") from ever clipping or forcing a
 *  one-word-per-row ladder, instead of a single fixed size for every word
 *  regardless of length. `minPx` is a STYLISTIC floor only (below this,
 *  a focal word starts reading as "merely large" rather than dramatic):
 *  when a word fits by the time it reaches minPx, this stops there, same
 *  as before. But fit always wins over the floor -- an earlier version of
 *  this clamped to minPx unconditionally and let a long enough word
 *  render wider than maxWidth at that size, clipping off-canvas. This
 *  keeps shrinking past minPx, down to a hard 26px safety floor, until
 *  the word actually fits, or that floor is reached. */
function fitFontSize(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, maxWidth: number, maxPx: number, minPx: number): number {
  const hardFloor = 26;
  let px = maxPx;
  // Prefer the largest size in (minPx, maxPx] that fits -- the normal
  // case for every focal word except the one or two longest.
  while (px > minPx) {
    ctx.font = `${weight} ${Math.round(px)}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return Math.round(px);
    px -= 2;
  }
  // Didn't fit even at the stylistic floor -- keep shrinking toward a
  // hard safety floor. Never clipping matters more than respecting minPx.
  while (px > hardFloor) {
    ctx.font = `${weight} ${Math.round(px)}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return Math.round(px);
    px -= 2;
  }
  ctx.font = `${weight} ${hardFloor}px ${family}`;
  return hardFloor;
}

/** Greedy-wraps words into rows at the given max width -- a word is
 *  always a whole, indivisible unit; Tamil grapheme clusters are only
 *  ever drawn through one complete fillText() call. */
function wrapWords(ctx: CanvasRenderingContext2D, words: readonly string[], maxWidth: number, spaceWidth: number): string[][] {
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

function drawCenteredRow(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number): void {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, cy);
}

interface SupportBlock {
  rows: string[][];
  rowStep: number;
}

function measureSupport(ctx: CanvasRenderingContext2D, words: readonly string[], font: string, maxWidth: number, rowStep: number): SupportBlock {
  if (!words.length) return { rows: [], rowStep };
  ctx.font = font;
  const spaceWidth = ctx.measureText(" ").width || rowStep * 0.22;
  return { rows: wrapWords(ctx, words, maxWidth, spaceWidth), rowStep };
}

/** Draws the one focal ("hero") word of an active line with the full
 *  Phase 2 treatment: rack-focus scale+blur entrance, restrained
 *  rotation, a foreshortening squash, simulated extrusion (stacked offset
 *  copies, the classic 2D "fake 3D thickness" trick), and a directional
 *  drop shadow. Extrusion and shadow only render once the word is mostly
 *  resolved (blur below a threshold) -- both would be wasted, and
 *  expensive, on a heavily blurred frame, and gating them this way reads
 *  as the word visibly GAINING depth and weight as it arrives in focus. */
function drawFocalWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  family: string,
  px: number,
  cx: number,
  cy: number,
  mv: MoodVisual,
  rawT: number,
  k: number,
  maxEntryScale: number
): void {
  const eased = mv.easing(rawT);
  const scaleX = lerp(maxEntryScale, 1, eased);
  const scaleY = lerp(maxEntryScale * mv.squashRatio, 1, eased);
  const blurPx = lerp(mv.startBlurPx, 0, clamp01(rawT * 1.4)) * k;
  const rotSign = word.length % 2 === 0 ? 1 : -1;
  const rotation = lerp(mv.rotAmpRad, 0, eased) * rotSign;
  const alpha = clamp01(rawT / 0.3);

  ctx.font = `700 ${Math.round(px)}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.scale(scaleX, scaleY);
  if (blurPx > 0.5) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;

  if (mv.extrudeSteps > 0 && blurPx < 2) {
    const dirX = Math.cos((Math.PI * 7) / 9) * mv.extrudeOffsetPx * k;
    const dirY = Math.sin((Math.PI * 7) / 9) * mv.extrudeOffsetPx * k;
    ctx.fillStyle = mv.extrudeColor;
    for (let i = mv.extrudeSteps; i >= 1; i--) {
      ctx.fillText(word, dirX * i, dirY * i);
    }
  }

  if (blurPx < 2) {
    ctx.shadowColor = "rgba(20, 12, 10, 0.35)";
    ctx.shadowBlur = 14 * k;
    ctx.shadowOffsetX = 5 * k;
    ctx.shadowOffsetY = 9 * k;
  }
  ctx.fillStyle = mv.focalColor;
  ctx.fillText(word, 0, 0);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.filter = "none";
  ctx.restore();
}

interface ActiveLineSizing {
  supportFontPx: number;
  focalMaxPx: number;
  focalMinPx: number;
  maxWidth: number;
}

/** Lays out and draws one "active" line composition -- an optional small
 *  supporting phrase, the oversized focal word, an optional trailing
 *  supporting phrase -- vertically centered as one measured block, same
 *  "measure everything first, then center the stack" discipline every
 *  other renderer in this app already follows. Supporting rows fade/rise
 *  gently and hold still; only the focal word gets the full kinetic
 *  treatment -- "animate the focal word while keeping supporting text
 *  stable," per the brief. */
function drawActiveLine(
  ctx: CanvasRenderingContext2D,
  line: LineComposition,
  tamilFont: string,
  tamilSerifFont: string,
  mv: MoodVisual,
  tsStage: number,
  k: number,
  sizing: ActiveLineSizing,
  bandTop: number,
  bandBottom: number
): void {
  const localT = tsStage - line.entryStart;
  if (localT < 0) return;
  const rawT = clamp01(localT / line.entryDuration);

  const supportFont = `600 ${Math.round(sizing.supportFontPx)}px ${tamilFont}`;
  const prefixBlock = measureSupport(ctx, line.prefix, supportFont, sizing.maxWidth, sizing.supportFontPx * 1.3);
  const suffixBlock = measureSupport(ctx, line.suffix, supportFont, sizing.maxWidth, sizing.supportFontPx * 1.3);

  const focalPx = fitFontSize(ctx, line.focal, 700, tamilSerifFont, sizing.maxWidth, sizing.focalMaxPx, sizing.focalMinPx);
  // fitFontSize only guarantees the word fits its RESTING (scale=1) size.
  // The entrance briefly scales it up past 1x (the rack-focus "oversized,
  // arriving from close up" move) -- without this cap, a long focal word
  // fitted close to maxWidth would clip off-canvas during that transient.
  // Short words keep the mood's full dramatic startScaleX (they have
  // headroom); only a word that's already near the width limit has its
  // entrance scale automatically reined in, just enough to never clip.
  ctx.font = `700 ${focalPx}px ${tamilSerifFont}`;
  const focalRestWidth = ctx.measureText(line.focal).width;
  const maxEntryScale = Math.max(1, Math.min(mv.startScaleX, (sizing.maxWidth * 0.97) / Math.max(1, focalRestWidth)));
  const focalStep = focalPx * 1.18;
  const gap = focalPx * 0.22;

  const prefixHeight = prefixBlock.rows.length * prefixBlock.rowStep;
  const suffixHeight = suffixBlock.rows.length * suffixBlock.rowStep;
  const totalHeight =
    prefixHeight + (prefixBlock.rows.length ? gap : 0) + focalStep + (suffixBlock.rows.length ? gap : 0) + suffixHeight;

  let y = (bandTop + bandBottom) / 2 - totalHeight / 2;
  const cx = ctx.canvas.width / 2;

  const supportAlpha = clamp01(localT / (line.entryDuration * 0.7));
  const supportRise = lerp(18 * k, 0, easeOutCubic(clamp01(localT / line.entryDuration)));

  ctx.font = supportFont;
  ctx.fillStyle = mv.supportColor;
  for (const row of prefixBlock.rows) {
    y += prefixBlock.rowStep / 2;
    ctx.save();
    ctx.globalAlpha = supportAlpha;
    drawCenteredRow(ctx, row.join(" "), cx, y - supportRise);
    ctx.restore();
    y += prefixBlock.rowStep / 2;
  }

  if (prefixBlock.rows.length) y += gap;
  y += focalStep / 2;
  drawFocalWord(ctx, line.focal, tamilSerifFont, focalPx, cx, y, mv, rawT, k, maxEntryScale);
  y += focalStep / 2;
  if (suffixBlock.rows.length) y += gap;

  ctx.font = supportFont;
  ctx.fillStyle = mv.supportColor;
  for (const row of suffixBlock.rows) {
    y += suffixBlock.rowStep / 2;
    ctx.save();
    ctx.globalAlpha = supportAlpha;
    drawCenteredRow(ctx, row.join(" "), cx, y + supportRise);
    ctx.restore();
    y += suffixBlock.rowStep / 2;
  }
}

/** A line that has already had its moment recedes into a smaller, muted,
 *  softly blurred background plane -- it never disappears, so nothing is
 *  lost before it's been read, and the receded/active contrast is real
 *  compositional depth layering, not a gimmick. */
function drawRecededLine(ctx: CanvasRenderingContext2D, text: string, tamilFont: string, k: number, cy: number, maxWidth: number): void {
  const fontPx = 34 * k;
  const font = `500 ${Math.round(fontPx)}px ${tamilFont}`;
  ctx.font = font;
  const spaceWidth = ctx.measureText(" ").width || fontPx * 0.25;
  const rows = wrapWords(ctx, text.split(/\s+/).filter(Boolean), maxWidth, spaceWidth);
  const rowStep = fontPx * 1.3;
  const totalHeight = rows.length * rowStep;
  let y = cy - totalHeight / 2 + rowStep / 2;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.filter = `blur(${(3 * k).toFixed(1)}px)`;
  ctx.fillStyle = CHARCOAL;
  ctx.font = font;
  for (const row of rows) {
    drawCenteredRow(ctx, row.join(" "), ctx.canvas.width / 2, y);
    y += rowStep;
  }
  ctx.filter = "none";
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, alpha: number): void {
  const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.16, width / 2, height / 2, height * 0.8);
  vignette.addColorStop(0, hexWithAlpha(color, 0));
  vignette.addColorStop(1, hexWithAlpha(color, alpha));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawSequentialStage(
  ctx: CanvasRenderingContext2D,
  comp: StageComposition,
  rawLines: readonly string[],
  tamilFont: string,
  tamilSerifFont: string,
  mv: MoodVisual,
  tsStage: number,
  k: number,
  width: number,
  height: number
): void {
  let activeIndex = 0;
  for (let i = 0; i < comp.lines.length; i++) {
    if (tsStage >= comp.lines[i].entryStart) activeIndex = i;
  }

  const maxWidth = width * 0.86;
  const recededTop = height * 0.18;
  for (let i = 0; i < activeIndex; i++) {
    drawRecededLine(ctx, rawLines[i], tamilFont, k, recededTop + i * height * 0.07, maxWidth);
  }

  const bandTop = activeIndex > 0 ? height * 0.26 : height * 0.12;
  const sizing: ActiveLineSizing = {
    supportFontPx: 46 * k,
    focalMaxPx: 176 * k,
    focalMinPx: 92 * k,
    maxWidth: width * 0.84,
  };
  drawActiveLine(ctx, comp.lines[activeIndex], tamilFont, tamilSerifFont, mv, tsStage, k, sizing, bandTop, height * 0.92);
}

function drawCumulativeStage(
  ctx: CanvasRenderingContext2D,
  comp: StageComposition,
  tamilFont: string,
  tamilSerifFont: string,
  mv: MoodVisual,
  tsStage: number,
  k: number,
  width: number,
  height: number
): void {
  const contentTop = height * 0.16;
  const contentBottom = height * 0.88;
  const bandHeight = (contentBottom - contentTop) / comp.lines.length;
  const sizing: ActiveLineSizing = {
    supportFontPx: 38 * k,
    focalMaxPx: 128 * k,
    focalMinPx: 72 * k,
    maxWidth: width * 0.86,
  };
  comp.lines.forEach((line, i) => {
    const bandTop = contentTop + i * bandHeight;
    drawActiveLine(ctx, line, tamilFont, tamilSerifFont, mv, tsStage, k, sizing, bandTop, bandTop + bandHeight);
  });
}

export interface KineticReelFrameOptions {
  width: number;
  height: number;
  /** Seconds elapsed since the Reel started; clamped to
   *  [0, KINETIC_REEL_DURATION_SEC]. */
  elapsedSec: number;
  tamilFont: string;
  /** The focal word's own display face -- a heavier, loaded weight (Noto
   *  Serif Tamil ships 700; Noto Sans Tamil here only loads 400/500) so
   *  the hero word is a genuine typographic step up from supporting text,
   *  not just a bigger copy of the same face. */
  tamilSerifFont: string;
}

/** Draws one frame of the kinetic typography Reel at `elapsedSec`.
 *  Deterministic and stateless, same contract as Phase 1: calling it
 *  twice with the same options always draws the same frame, so scrubbing/
 *  replay and frame-by-frame video capture share one function. */
export function drawKineticReelFrame(ctx: CanvasRenderingContext2D, opts: KineticReelFrameOptions): void {
  const { width, height, tamilFont, tamilSerifFont } = opts;
  const t = Math.max(0, Math.min(opts.elapsedSec, KINETIC_REEL_DURATION_SEC));
  const rawStage = KINETIC_REEL_STAGES.find((s) => t >= s.startSec && t < s.endSec) ?? KINETIC_REEL_STAGES[KINETIC_REEL_STAGES.length - 1];
  const comp = KINETIC_REEL_COMPOSITION.find((s) => s.id === rawStage.id) ?? KINETIC_REEL_COMPOSITION[KINETIC_REEL_COMPOSITION.length - 1];
  const tsStage = t - rawStage.startSec;
  const mv = MOOD[comp.mood];
  const k = width / 1080;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG_IVORY;
  ctx.fillRect(0, 0, width, height);
  drawVignette(ctx, width, height, mv.focalColor, mv.vignetteAlpha);

  if (comp.cumulative) {
    drawCumulativeStage(ctx, comp, tamilFont, tamilSerifFont, mv, tsStage, k, width, height);
  } else {
    drawSequentialStage(ctx, comp, rawStage.lines, tamilFont, tamilSerifFont, mv, tsStage, k, width, height);
  }
}
