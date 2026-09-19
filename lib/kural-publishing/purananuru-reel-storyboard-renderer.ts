/**
 * Distant Devotion — Asset Generator: Purananuru Reel Storyboard Renderer
 * ----------------------------------------------------------------------------
 * A SECOND, independent Purananuru template alongside (never replacing)
 * purananuru-carousel-renderer.ts's 2-slide card. This one draws the 7-frame
 * "Reel grammar" (Hook / Human Moment / Purananuru / Meaning / Today /
 * Reflection / Signature) as static, full-bleed 1080x1920 (9:16) PNGs --
 * still no animation, video, or image generation, exactly like the
 * Carousel. Both templates are consumed the same way: they take the SAME
 * ComposedPoem produced by content-engine.ts's loadPoem/generateNextPoem
 * (untouched by this file) and derive their own per-frame view from it --
 * this one via buildComposedReelStoryboard (purananuru/
 * reel-storyboard-content.ts), which never duplicates canon.ts's literary
 * text, only slices it by line range.
 *
 * Deliberately NOT a stretched copy of the Carousel's card-on-background
 * look: the Carousel insets a white card inside a tinted frame; this
 * template is full-bleed (background IS the frame, safe margins only) with
 * its own chrome -- a small "PURANANURU" kicker + a page indicator
 * ("03 / 07 · PURANANURU") repeated, in the same position, on every frame,
 * which is what actually reads as "one designed system" across seven
 * images rather than "one card resized seven times." Frame 6 (Reflection)
 * inverts to a full indigo panel to give the sequence a visual pause before
 * the calm Frame 7 signature -- the one deliberate visual-rhythm break in
 * an otherwise restrained, editorial system.
 *
 * Same indigo brand hue as purananuru-carousel-renderer.ts (so the two
 * templates read as one Purananuru identity), reusing the same generic,
 * content-agnostic seeded-random.ts / ambient-language-layer.ts helpers for
 * its background texture -- never aathichoodi-renderer.ts or
 * aathichoodi-carousel-renderer.ts, which this file does not import from or
 * modify.
 */

import { createSeededRandom } from "./seeded-random";
import {
  drawAmbientLanguageLayer,
  extractTamilGraphemes,
} from "./ambient-language-layer";
import type { ComposedPoem } from "./purananuru/content-engine";
import {
  buildComposedReelStoryboard,
  type ComposedReelStoryboard,
  type ReelVisualScene,
} from "./purananuru/reel-storyboard-content";

const BG = "#F4F3F8";
const FOREGROUND = "#1E1B2E";
const MUTED = "#6B6B85";
const PRIMARY = "#3B3F8C";
const BORDER = "#DADCE8";
const ON_PRIMARY = "#FFFFFF";
const ON_PRIMARY_MUTED = "#C7C9EE";
const WARNING = "#8A5A00";

const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export const PURANANURU_REEL_FRAME_COUNT = 7;
export const PURANANURU_REEL_FRAME_LABELS: readonly string[] = [
  "Hook",
  "Human Moment",
  "Purananuru",
  "Meaning",
  "Today",
  "Reflection",
  "Signature",
];
/** Filename slugs, index-aligned with PURANANURU_REEL_FRAME_LABELS --
 *  exported so PublishingWorkspace's filename builder never hand-types
 *  these separately from the labels shown in the UI. */
export const PURANANURU_REEL_FRAME_SLUGS: readonly string[] = [
  "hook",
  "human-moment",
  "purananuru",
  "meaning",
  "today",
  "reflection",
  "signature",
];

export interface RenderPurananuruReelOptions {
  width: number;
  height: number;
  /** The same ComposedPoem the 2-slide Carousel renders -- this template
   *  derives its own content from it via buildComposedReelStoryboard,
   *  rather than PublishingWorkspace passing a second, differently-shaped
   *  content object. */
  poem: ComposedPoem;
  /** 0-6, indexing PURANANURU_REEL_FRAME_LABELS. */
  frameIndex: number;
  tamilFont: string;
  sansFont: string;
  /** Frame 7 (Signature) only -- the one frame with any brand mark at all
   *  (see this file's own header: "keep branding subtle" is honored by
   *  omitting it from every other frame, not by shrinking it everywhere). */
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) {
    end--;
  }
  return `${text.slice(0, end).trimEnd()}…`;
}

/** Draws already-wrapped lines starting at startY, stepping by lineStep,
 *  and stops (truncating the last drawn line with an ellipsis) before
 *  crossing maxY -- the same overflow-safety convention
 *  purananuru-carousel-renderer.ts uses, reapplied here so long poem
 *  content can never clip against this template's own footer/margin.
 *  Returns the Y position after the last line actually drawn. */
function drawCappedLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x: number,
  startY: number,
  lineStep: number,
  maxY: number
): number {
  let y = startY;
  for (let i = 0; i < lines.length; i++) {
    const nextY = y + lineStep;
    if (nextY > maxY) break;
    y = nextY;
    const isLastAllowed = nextY + lineStep > maxY;
    const truncated = isLastAllowed && i < lines.length - 1;
    ctx.fillText(truncated ? `${lines[i]}…` : lines[i], x, y);
    if (truncated) break;
  }
  return y;
}

interface FrameGeometry {
  marginX: number;
  contentX: number;
  contentWidth: number;
  contentTop: number;
  contentBottom: number;
}

/** Traces a rounded-rectangle path via arcTo, matching the corner-rounding
 *  convention already used elsewhere in this codebase's Canvas renderers
 *  (e.g. drawCardSurface in purananuru-carousel-renderer.ts) rather than
 *  ctx.roundRect. Caller fills/strokes after calling this. */
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** One abstract human silhouette -- a circle head plus a rounded-body
 *  block, drawn either FILLED (present, included, "has") or OUTLINED ONLY
 *  (dimmed, separated, "does not have / not yet part of the group"). This
 *  filled/outlined distinction is the entire visual vocabulary the six
 *  scenes below use to show possession, need, isolation, and belonging --
 *  never a face, a costume, or any culturally-specific detail. `topY` is
 *  the y-coordinate of the top of the head; `scale` sets the figure's
 *  overall size. */
function drawFigure(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  topY: number,
  scale: number,
  color: string,
  filled: boolean
) {
  const headR = scale * 0.34;
  const bodyW = scale * 0.9;
  const bodyH = scale * 1.05;
  const headCenterY = topY + headR;
  const bodyTop = headCenterY + headR * 0.75;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, scale * 0.055);

  ctx.beginPath();
  ctx.arc(centerX, headCenterY, headR, 0, Math.PI * 2);
  if (filled) ctx.fill();
  else ctx.stroke();

  roundedRectPath(ctx, centerX - bodyW / 2, bodyTop, bodyW, bodyH, bodyW * 0.32);
  if (filled) ctx.fill();
  else ctx.stroke();
}

/** A small filled dot with a faint halo ring -- the one recurring "object
 *  of value" accent used by the rare-gift/choice/sharing scenes. Never a
 *  literal icon (no gift box, no ticket, no coin) -- just weight and
 *  glow standing in for "something notable". */
function drawObjectAccent(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save();
  ctx.globalAlpha = 0.28;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, r * 0.4);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

/** A quiet curved connector between two points -- the visual language for
 *  "something is moving from here to there" (the choice, the sharing).
 *  Dashed and low-weight so it reads as a path, not a hard line/border. */
function drawConnectorArc(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, Math.abs(x2 - x1) * 0.008);
  ctx.setLineDash([Math.abs(x2 - x1) * 0.02, Math.abs(x2 - x1) * 0.025]);
  const midX = (x1 + x2) / 2;
  const midY = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.16;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(midX, midY, x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** A column of stacked, evenly-gapped rounded units resting on a shared
 *  baseline -- the abundance/sharing scenes' entire vocabulary for
 *  "quantity". Deliberately identical unit shape/color across both
 *  columns in every scene: it is a QUANTITY contrast (count only), never
 *  a quality, class, or wealth-style contrast. Returns the drawn stack's
 *  total height. */
function drawColumn(
  ctx: CanvasRenderingContext2D,
  x: number,
  width: number,
  baselineY: number,
  unitHeight: number,
  unitGap: number,
  unitCount: number,
  color: string
): number {
  ctx.fillStyle = color;
  for (let i = 0; i < unitCount; i++) {
    const y = baselineY - (i + 1) * (unitHeight + unitGap) + unitGap;
    roundedRectPath(ctx, x, y, width, unitHeight, unitHeight * 0.32);
    ctx.fill();
  }
  return unitCount * (unitHeight + unitGap);
}

interface SceneStage {
  x0: number;
  x1: number;
  top: number;
  bottom: number;
}

/** Dispatches one of the six abstract, editorial visual-scene compositions
 *  (Frame 2 / Frame 5) by sceneType. Every scene is built ONLY from the
 *  shapes above -- silhouettes, one accent dot, connector arcs, unit
 *  columns -- using the existing indigo/border/foreground palette already
 *  defined at the top of this file. No new colors, no photographic
 *  imagery, no clip-art, no culturally-specific detail: this is the
 *  "abstract/editorial geometric composition" the brief asks for, and the
 *  ONLY thing that changes between poems is which of these six cases
 *  runs and with what proportions -- never a reused generic placeholder. */
function drawVisualScene(ctx: CanvasRenderingContext2D, stage: SceneStage, scene: ReelVisualScene) {
  const { x0, x1, top, bottom } = stage;
  const stageW = x1 - x0;
  const stageH = Math.max(0, bottom - top);
  const baselineY = top + stageH * 0.86;
  const figureScale = Math.min(stageW * 0.22, stageH * 0.5);

  switch (scene.sceneType) {
    case "rare-gift": {
      const ax = x0 + stageW * 0.28;
      const bx = x0 + stageW * 0.72;
      const figTop = baselineY - figureScale * 2.1;
      drawFigure(ctx, ax, figTop, figureScale, PRIMARY, true);
      drawFigure(ctx, bx, figTop, figureScale, BORDER, false);
      drawObjectAccent(ctx, ax + figureScale * 0.05, figTop - figureScale * 0.28, figureScale * 0.16, PRIMARY);
      break;
    }
    case "choice": {
      const ax = x0 + stageW * 0.28;
      const bx = x0 + stageW * 0.72;
      const figTop = baselineY - figureScale * 2.1;
      const objY = figTop - figureScale * 0.28;
      const objX = x0 + stageW * 0.58;
      drawFigure(ctx, ax, figTop, figureScale, BORDER, false);
      drawFigure(ctx, bx, figTop, figureScale, PRIMARY, true);
      drawConnectorArc(ctx, ax + figureScale * 0.3, objY, bx - figureScale * 0.3, objY, BORDER);
      drawObjectAccent(ctx, objX, objY - stageH * 0.04, figureScale * 0.16, PRIMARY);
      break;
    }
    case "abundance": {
      const colW = stageW * 0.15;
      const unitH = stageH * 0.075;
      const gap = unitH * 0.4;
      drawColumn(ctx, x0 + stageW * 0.28 - colW / 2, colW, baselineY, unitH, gap, 6, PRIMARY);
      drawColumn(ctx, x0 + stageW * 0.72 - colW / 2, colW, baselineY, unitH, gap, 2, BORDER);
      break;
    }
    case "sharing": {
      const colW = stageW * 0.15;
      const unitH = stageH * 0.075;
      const gap = unitH * 0.4;
      const leftX = x0 + stageW * 0.28 - colW / 2;
      const rightX = x0 + stageW * 0.72 - colW / 2;
      const leftH = drawColumn(ctx, leftX, colW, baselineY, unitH, gap, 4, PRIMARY);
      drawColumn(ctx, rightX, colW, baselineY, unitH, gap, 4, PRIMARY);
      const arcY = baselineY - leftH - stageH * 0.06;
      drawConnectorArc(ctx, leftX + colW, arcY, rightX, arcY, BORDER);
      drawObjectAccent(ctx, (leftX + colW + rightX) / 2, arcY - stageH * 0.05, unitH * 0.45, PRIMARY);
      break;
    }
    case "stranger": {
      const figTop = baselineY - figureScale * 2.0;
      drawFigure(ctx, x0 + stageW * 0.18, figTop, figureScale * 0.95, BORDER, false);
      for (const f of [0.58, 0.72, 0.86]) {
        drawFigure(ctx, x0 + stageW * f, figTop + figureScale * 0.1, figureScale * 0.85, PRIMARY, true);
      }
      break;
    }
    case "belonging": {
      const figTop = baselineY - figureScale * 2.0;
      for (const f of [0.42, 0.58, 0.72, 0.86]) {
        drawFigure(ctx, x0 + stageW * f, figTop + figureScale * 0.1, figureScale * 0.85, PRIMARY, true);
      }
      break;
    }
  }
}

/** Shared Frame 2 / Frame 5 layout: the abstract visual-scene composition
 *  above, one short Tamil caption below -- the caption is measured FIRST
 *  so the composition's stage area fills exactly the remaining space
 *  (same "measure, then lay out" discipline as every other frame in this
 *  file), and it is the only text drawn: the scene's title/description
 *  stay internal editorial data, never rendered onto the exported PNG. */
function drawSceneFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, geo: FrameGeometry, scene: ReelVisualScene) {
  const { width, height, tamilFont } = opts;

  ctx.font = `600 ${Math.round(width * 0.042)}px ${tamilFont}`;
  const captionStep = width * 0.058;
  const captionLines = wrapText(ctx, scene.captionLine, geo.contentWidth);
  const captionHeight = captionLines.length * captionStep;
  const captionGap = height * 0.035;

  // The composition gets a fixed, generous height (rather than stretching
  // across the entire remaining frame) so drawVisualScene's own internal
  // proportions stay predictable -- then the WHOLE composition+caption
  // block is measured and vertically centered in the available content
  // area, the same "measure first, then center" discipline every other
  // frame in this file already uses. Without this, a composition sized to
  // a fraction of an oversized stage ends up stranded near the bottom of
  // the frame with a large dead zone above it.
  const compositionHeight = height * 0.4;
  const totalBlockHeight = compositionHeight + captionGap + captionHeight;
  const available = Math.max(0, geo.contentBottom - geo.contentTop);
  const blockTop = geo.contentTop + Math.max(0, (available - totalBlockHeight) / 2);
  const stageBottom = blockTop + compositionHeight;

  drawVisualScene(ctx, { x0: geo.contentX, x1: geo.contentX + geo.contentWidth, top: blockTop, bottom: stageBottom }, scene);

  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(width * 0.042)}px ${tamilFont}`;
  drawCappedLines(ctx, captionLines, geo.contentX, stageBottom + captionGap, captionStep, geo.contentBottom);
}

/** Shared chrome every frame draws first: full-bleed background, a small
 *  "PURANANURU" kicker top-left, and a page indicator ("03 / 07 · MEANING")
 *  top-right -- the one repeated element that makes seven separate PNGs
 *  read as a single designed sequence rather than seven unrelated cards.
 *  `invert` flips both the background and the chrome text color for Frame
 *  6's full-indigo panel. */
function drawFrameChrome(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frameIndex: number,
  sansFont: string,
  invert: boolean
): FrameGeometry {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = invert ? PRIMARY : BG;
  ctx.fillRect(0, 0, width, height);

  const marginX = width * 0.09;
  const marginTop = height * 0.045;
  const marginBottom = height * 0.055;

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = invert ? ON_PRIMARY_MUTED : MUTED;
  ctx.font = `600 ${Math.round(width * 0.026)}px ${sansFont}`;
  ctx.textAlign = "left";
  ctx.fillText("PURANANURU", marginX, marginTop + width * 0.026);

  const pageLabel = `${String(frameIndex + 1).padStart(2, "0")} / ${String(PURANANURU_REEL_FRAME_COUNT).padStart(2, "0")} · ${PURANANURU_REEL_FRAME_LABELS[frameIndex].toUpperCase()}`;
  ctx.textAlign = "right";
  ctx.fillText(truncateToWidth(ctx, pageLabel, width * 0.55), width - marginX, marginTop + width * 0.026);
  ctx.textAlign = "left";

  return {
    marginX,
    contentX: marginX,
    contentWidth: width - marginX * 2,
    contentTop: marginTop + height * 0.05,
    contentBottom: height - marginBottom,
  };
}

function drawHookFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  const isQuiet = storyboard.hookTreatment === "quiet";
  ctx.fillStyle = FOREGROUND;
  ctx.font = `${isQuiet ? "500" : "700"} ${Math.round(width * (isQuiet ? 0.052 : 0.072))}px ${tamilFont}`;
  const lineStep = width * (isQuiet ? 0.072 : 0.095);
  const allLines = storyboard.hookLines.flatMap((line) => wrapText(ctx, line, geo.contentWidth));
  const blockHeight = allLines.length * lineStep;
  // Bold treatment centers vertically for maximum scroll-stopping impact;
  // quiet treatment sits lower, with more open space above it, per the
  // brief's own "quiet visual/editorial treatment rather than forcing a
  // large slogan" direction for poem 192.
  const startY = isQuiet
    ? geo.contentBottom - blockHeight - height * 0.14
    : geo.contentTop + (geo.contentBottom - geo.contentTop) / 2 - blockHeight / 2;
  drawCappedLines(ctx, allLines, geo.contentX, startY, lineStep, geo.contentBottom);
}

function drawHumanMomentFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);
  drawSceneFrame(ctx, opts, geo, storyboard.frame2Scene);
}

function drawPurananuruFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(width * 0.028)}px ${sansFont}`;
  ctx.fillText(
    truncateToWidth(ctx, `புறநானூறு ${storyboard.poemNumber} · ${storyboard.poet.toUpperCase()}`, geo.contentWidth),
    geo.contentX,
    geo.contentTop
  );

  const lineStep = width * 0.075;
  const emphasizedStep = width * 0.09;
  const translitStep = width * 0.036;
  const normalFont = `500 ${Math.round(width * 0.05)}px ${tamilFont}`;
  const emphasizedFont = `700 ${Math.round(width * 0.058)}px ${tamilFont}`;

  // Two-pass layout -- measure every wrapped row first (so a 1-line excerpt
  // like poem 192's and an emphasized 5-line excerpt like poem 189's both
  // get their whole block vertically centered in the available space,
  // rather than always starting flush under the kicker and leaving a short
  // excerpt stranded in the top quarter of a 1920px-tall frame).
  const rows: { text: string; font: string; color: string; step: number }[] = [];
  for (let i = 0; i < storyboard.excerptTamilLines.length; i++) {
    const emphasized = i === storyboard.emphasizeExcerptIndex;
    ctx.font = emphasized ? emphasizedFont : normalFont;
    const step = emphasized ? emphasizedStep : lineStep;
    for (const wline of wrapText(ctx, storyboard.excerptTamilLines[i], geo.contentWidth)) {
      rows.push({ text: wline, font: emphasized ? emphasizedFont : normalFont, color: emphasized ? PRIMARY : FOREGROUND, step });
    }
  }
  const translitLines = storyboard.excerptTransliterationLines ?? [];
  const translitGap = translitLines.length ? height * 0.025 : 0;

  const tamilBlockHeight = rows.reduce((sum, r) => sum + r.step, 0);
  const translitBlockHeight = translitLines.length * translitStep;
  const totalBlockHeight = tamilBlockHeight + translitGap + translitBlockHeight;

  const badgeReserve = storyboard.verified ? 0 : height * 0.05;
  const blockTop = geo.contentTop + height * 0.06;
  const blockBottom = geo.contentBottom - badgeReserve;
  const available = Math.max(0, blockBottom - blockTop);
  let cursorY = blockTop + Math.max(0, (available - totalBlockHeight) / 2);

  for (const row of rows) {
    const nextY = cursorY + row.step;
    if (nextY > blockBottom) break;
    cursorY = nextY;
    ctx.fillStyle = row.color;
    ctx.font = row.font;
    ctx.fillText(row.text, geo.contentX, cursorY);
  }

  if (translitLines.length) {
    cursorY += translitGap;
    ctx.fillStyle = MUTED;
    ctx.font = `italic 400 ${Math.round(width * 0.026)}px ${sansFont}`;
    cursorY = drawCappedLines(ctx, translitLines, geo.contentX, cursorY, translitStep, blockBottom);
  }

  if (!storyboard.verified) {
    ctx.fillStyle = WARNING;
    ctx.font = `600 ${Math.round(width * 0.023)}px ${sansFont}`;
    ctx.fillText("⚠ UNVERIFIED — confirm against source before publishing", geo.contentX, geo.contentBottom);
  }
}

function drawStatementFrame(
  ctx: CanvasRenderingContext2D,
  opts: RenderPurananuruReelOptions,
  kickerTamil: string,
  kickerEnglish: string,
  bodyLine: string
) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  ctx.fillStyle = PRIMARY;
  ctx.font = `600 ${Math.round(width * 0.03)}px ${sansFont}`;
  ctx.fillText(`${kickerTamil} · ${kickerEnglish.toUpperCase()}`, geo.contentX, geo.contentTop);

  ctx.fillStyle = FOREGROUND;
  ctx.font = `500 ${Math.round(width * 0.052)}px ${tamilFont}`;
  const lineStep = width * 0.072;
  const lines = wrapText(ctx, bodyLine, geo.contentWidth);
  const blockHeight = lines.length * lineStep;
  const startY = geo.contentTop + (geo.contentBottom - geo.contentTop) / 2 - blockHeight / 2 + width * 0.04;
  drawCappedLines(ctx, lines, geo.contentX, startY, lineStep, geo.contentBottom);
}

function drawMeaningFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  drawStatementFrame(ctx, opts, "பொருள்", "Meaning", storyboard.meaningLine);
}

function drawTodayFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);
  drawSceneFrame(ctx, opts, geo, storyboard.frame5Scene);
}

function drawReflectionFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  // The one deliberate visual-rhythm break in the sequence: a full-indigo
  // panel, inverted chrome, so the reflection question gets a visibly
  // different moment than the six calm, off-white frames around it.
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, true);

  ctx.fillStyle = ON_PRIMARY;
  ctx.font = `600 ${Math.round(width * 0.062)}px ${tamilFont}`;
  const lineStep = width * 0.085;
  const lines = storyboard.reflectionLines.flatMap((line) => wrapText(ctx, line, geo.contentWidth));
  const blockHeight = lines.length * lineStep;
  const startY = geo.contentTop + (geo.contentBottom - geo.contentTop) / 2 - blockHeight / 2 + width * 0.05;
  drawCappedLines(ctx, lines, geo.contentX, startY, lineStep, geo.contentBottom);
}

function drawSignatureFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions, storyboard: ComposedReelStoryboard) {
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  const rand = createSeededRandom(storyboard.poemNumber);
  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilFont,
    glyphPool: (() => {
      const pool = extractTamilGraphemes(storyboard.excerptTamilLines.join(" "));
      return pool.length > 0 ? pool : FALLBACK_GLYPHS;
    })(),
    color: PRIMARY,
    clearBox: { x: 0, y: 0, width, height },
  });

  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(width * 0.058)}px ${tamilFont}`;
  const lineStep = width * 0.08;
  const lines = ["தமிழ் சொன்னது.", "நாம் வாழ்வோமா?"];
  const blockHeight = lines.length * lineStep;
  const startY = geo.contentTop + (geo.contentBottom - geo.contentTop) / 2 - blockHeight / 2;
  drawCappedLines(ctx, lines, geo.contentX, startY, lineStep, geo.contentBottom);

  // The ONLY frame in the sequence carrying any brand mark -- see this
  // file's own header on "keep branding subtle" being honored by leaving
  // it off every other frame rather than shrinking it on all seven.
  if (opts.brandingWordmark) {
    const brandY = geo.contentBottom;
    if (opts.logoImage) {
      const logoH = height * 0.024;
      const logoW = logoH * (opts.logoImage.width / opts.logoImage.height);
      ctx.drawImage(opts.logoImage, geo.contentX, brandY - logoH * 0.85, logoW, logoH);
      ctx.fillStyle = MUTED;
      ctx.font = `500 ${Math.round(width * 0.024)}px ${sansFont}`;
      ctx.fillText(opts.brandingWordmark, geo.contentX + logoW + width * 0.02, brandY);
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = `500 ${Math.round(width * 0.024)}px ${sansFont}`;
      ctx.fillText(opts.brandingWordmark, geo.contentX, brandY);
    }
  }
}

function drawUnavailableFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions) {
  const { width, height, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);
  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(width * 0.032)}px ${sansFont}`;
  drawCappedLines(
    ctx,
    wrapText(ctx, `No Reel Storyboard content has been authored yet for poem ${opts.poem.poemNumber}.`, geo.contentWidth),
    geo.contentX,
    geo.contentTop + height * 0.1,
    width * 0.045,
    geo.contentBottom
  );
}

export function renderPurananuruReelFrame(ctx: CanvasRenderingContext2D, opts: RenderPurananuruReelOptions): void {
  const storyboard = buildComposedReelStoryboard(opts.poem);
  if (!storyboard) {
    drawUnavailableFrame(ctx, opts);
    return;
  }
  switch (opts.frameIndex) {
    case 0:
      drawHookFrame(ctx, opts, storyboard);
      break;
    case 1:
      drawHumanMomentFrame(ctx, opts, storyboard);
      break;
    case 2:
      drawPurananuruFrame(ctx, opts, storyboard);
      break;
    case 3:
      drawMeaningFrame(ctx, opts, storyboard);
      break;
    case 4:
      drawTodayFrame(ctx, opts, storyboard);
      break;
    case 5:
      drawReflectionFrame(ctx, opts, storyboard);
      break;
    default:
      drawSignatureFrame(ctx, opts, storyboard);
  }
}

/** Fully independent export render, same pattern as
 *  renderPurananuruCarouselSlideForExport: fresh off-screen canvas at exact
 *  output dimensions, returns a PNG Blob. */
export async function renderPurananuruReelFrameForExport(
  poem: ComposedPoem,
  frameIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilFont: string; sansFont: string },
  brandingWordmark?: string,
  brandingHandle?: string
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fallback chain already in place */
    }
  }

  renderPurananuruReelFrame(ctx, {
    width: format.width,
    height: format.height,
    poem,
    frameIndex,
    ...fonts,
    logoImage,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
