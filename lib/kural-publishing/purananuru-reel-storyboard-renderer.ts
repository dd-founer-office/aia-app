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
  const { width, height, tamilFont, sansFont } = opts;
  const geo = drawFrameChrome(ctx, width, height, opts.frameIndex, sansFont, false);

  // Restrained abstract motif standing in for imagery we don't generate:
  // two simple bars of unequal fill weight, side by side -- "one holds
  // more than the other" -- never a literal scene, per the brief's own
  // "restrained editorial graphics / typography / abstract composition"
  // instruction for this frame.
  const motifY = geo.contentTop;
  const motifH = height * 0.012;
  const barW = geo.contentWidth * 0.42;
  ctx.fillStyle = PRIMARY;
  ctx.fillRect(geo.contentX, motifY, barW, motifH);
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = Math.max(1, motifH * 0.6);
  ctx.strokeRect(geo.contentX + geo.contentWidth - barW, motifY, barW, motifH);

  // Vertically center the text block in the space below the motif, same
  // "measure first, then center" approach as Frame 3 -- so a one-sentence
  // situation line doesn't strand itself under the motif with the rest of
  // a 1920px-tall frame left empty.
  ctx.font = `600 ${Math.round(width * 0.05)}px ${tamilFont}`;
  const lineStep = width * 0.068;
  const lines = wrapText(ctx, storyboard.humanMomentLine, geo.contentWidth);
  const lineBlockHeight = lines.length * lineStep;

  ctx.font = `italic 400 ${Math.round(width * 0.027)}px ${sansFont}`;
  const noteLines = storyboard.humanMomentNote ? wrapText(ctx, storyboard.humanMomentNote, geo.contentWidth) : [];
  const noteStep = width * 0.038;
  const noteGap = noteLines.length ? height * 0.035 : 0;
  const noteBlockHeight = noteLines.length * noteStep;

  const totalBlockHeight = lineBlockHeight + noteGap + noteBlockHeight;
  const blockTop = motifY + height * 0.09;
  const blockBottom = geo.contentBottom;
  const available = Math.max(0, blockBottom - blockTop);
  let cursorY = blockTop + Math.max(0, (available - totalBlockHeight) / 2);

  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(width * 0.05)}px ${tamilFont}`;
  cursorY = drawCappedLines(ctx, lines, geo.contentX, cursorY, lineStep, blockBottom);

  if (noteLines.length) {
    cursorY += noteGap;
    ctx.fillStyle = MUTED;
    ctx.font = `italic 400 ${Math.round(width * 0.027)}px ${sansFont}`;
    drawCappedLines(ctx, noteLines, geo.contentX, cursorY, noteStep, blockBottom);
  }
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
  drawStatementFrame(ctx, opts, "இன்று", "Today", storyboard.todayLine);
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
