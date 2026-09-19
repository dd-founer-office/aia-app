/**
 * Distant Devotion — Asset Generator: Purananuru Carousel Renderer
 * ----------------------------------------------------------------------------
 * Purananuru's own template, parallel to aathichoodi-carousel-renderer.ts
 * but deliberately much simpler — a 2-slide static card set, not the
 * 5-slide Family Carousel framework, its drag/edit hotspots, or its design-
 * override system. Phase 1 scope is the content engine + generator
 * integration ONLY: no animated Reel, no MP4, no AI-generated scene
 * artwork. visualStoryDirection is rendered as a plain, visible caption —
 * art direction FOR A HUMAN (or a future image step) to act on, never
 * imagery this function generates itself.
 *
 * Reuses seeded-random.ts and ambient-language-layer.ts — both already
 * generic, content-agnostic modules under lib/kural-publishing/ (not
 * lib/kural-publishing/aathichoodi/) — for the same background field
 * treatment aathichoodi-renderer.ts uses, so the two templates read as one
 * visual family without duplicating that drawing code. Does not import
 * from, and never modifies, aathichoodi-renderer.ts or
 * aathichoodi-carousel-renderer.ts.
 *
 * Visual language mirrors the app's existing Visual Constitution but in a
 * distinct hue (indigo, not the Aathichoodi Series' forest green) so a
 * Purananuru asset is never mistaken for an Aathichoodi one at a glance.
 */

import { createSeededRandom } from "./seeded-random";
import {
  drawAmbientLanguageLayer,
  extractTamilGraphemes,
} from "./ambient-language-layer";
import type { ComposedPoem } from "./purananuru/content-engine";

const BG = "#EEF0F7";
const CARD = "#FFFFFF";
const BORDER = "#DADCE8";
const PRIMARY = "#3B3F8C";
const FOREGROUND = "#221F33";
const MUTED = "#6B6B85";

const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export const PURANANURU_SLIDE_COUNT = 2;
export const PURANANURU_SLIDE_LABELS: readonly string[] = ["Hook", "Poem & Meaning"];

export interface RenderPurananuruCarouselOptions {
  width: number;
  height: number;
  poem: ComposedPoem;
  /** 0 = Hook/cover, 1 = Poem + meaning + attribution. */
  slideIndex: number;
  tamilFont: string;
  sansFont: string;
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

/** Truncates a single line (with an ellipsis) to fit maxWidth under the
 *  context's currently-set font -- for header-style lines that are drawn
 *  as one fillText call and were never designed to wrap, so a long poet
 *  name (e.g. with a parenthetical Tamil spelling) doesn't run off the
 *  card edge the way it did before this fix. */
function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) {
    end--;
  }
  return `${text.slice(0, end).trimEnd()}…`;
}

function drawCardSurface(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const pad = Math.round(Math.min(width, height) * 0.08);
  const radius = Math.round(Math.min(width, height) * 0.035);
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;

  ctx.save();
  ctx.fillStyle = CARD;
  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + radius, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, radius);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, radius);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, radius);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  return { cardX, cardY, cardW, cardH, pad };
}

function drawBrandFooter(
  ctx: CanvasRenderingContext2D,
  contentX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  innerPad: number,
  sansFont: string,
  logoImage: HTMLImageElement | null | undefined,
  wordmark: string | undefined,
  handle: string | undefined
) {
  if (!wordmark) return;
  ctx.save();
  const brandY = cardY + cardH - innerPad * 0.55;
  if (logoImage) {
    const logoH = cardH * 0.05;
    const logoW = logoH * (logoImage.width / logoImage.height);
    ctx.drawImage(logoImage, contentX + cardW - innerPad * 2 - logoW, brandY - logoH * 0.85, logoW, logoH);
  }
  ctx.fillStyle = PRIMARY;
  ctx.font = `600 ${Math.round(cardH * 0.028)}px ${sansFont}`;
  ctx.fillText(wordmark, contentX, brandY);
  if (handle) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${Math.round(cardH * 0.023)}px ${sansFont}`;
    ctx.fillText(`@${handle}`, contentX, brandY + cardH * 0.032);
  }
  ctx.restore();
}

function drawHookSlide(ctx: CanvasRenderingContext2D, opts: RenderPurananuruCarouselOptions) {
  const { width, height, poem, tamilFont, sansFont } = opts;
  const rand = createSeededRandom(poem.poemNumber);
  const { cardX, cardY, cardW, cardH, pad } = drawCardSurface(ctx, width, height);

  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilFont,
    glyphPool: (() => {
      const pool = extractTamilGraphemes(poem.tamilText);
      return pool.length > 0 ? pool : FALLBACK_GLYPHS;
    })(),
    color: PRIMARY,
    clearBox: { x: cardX, y: cardY, width: cardW, height: cardH },
  });

  const innerPad = cardW * 0.1;
  const contentX = cardX + innerPad;
  const contentW = cardW - innerPad * 2;
  let cursorY = cardY + cardH * 0.2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(cardH * 0.028)}px ${sansFont}`;
  ctx.fillText(`PURANANURU · ${poem.themeLabel.toUpperCase()}`, contentX, cursorY);
  cursorY += cardH * 0.09;

  // Phase 2: hooks are written as Tamil editorial questions (per explicit
  // brief direction, e.g. "செல்வம் சேர்ப்பதற்கா? பகிர்வதற்கா?"), not English
  // -- rendered in tamilFont, not sansFont, so the glyphs actually draw
  // instead of falling back to tofu/boxes on a Latin-only font stack.
  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(cardH * 0.062)}px ${tamilFont}`;
  for (const line of wrapText(ctx, poem.hook, contentW)) {
    cursorY += cardH * 0.08;
    ctx.fillText(line, contentX, cursorY);
  }

  cursorY += cardH * 0.08;
  ctx.fillStyle = MUTED;
  ctx.font = `italic 400 ${Math.round(cardH * 0.03)}px ${sansFont}`;
  // Reserve the brand footer's own zone (see drawBrandFooter's brandY) plus
  // a margin, so a long visualStoryDirection can never grow tall enough to
  // collide with the logo/wordmark -- truncate with an ellipsis instead of
  // overlapping it.
  const captionLineStep = cardH * 0.045;
  const captionMaxY = cardY + cardH - innerPad * 0.55 - cardH * 0.09;
  const captionLines = wrapText(ctx, `Art direction: ${poem.visualStoryDirection}`, contentW);
  for (let i = 0; i < captionLines.length; i++) {
    const nextY = cursorY + captionLineStep;
    const isLastAllowed = nextY + captionLineStep > captionMaxY;
    if (nextY > captionMaxY) break;
    cursorY = nextY;
    const truncated = isLastAllowed && i < captionLines.length - 1;
    ctx.fillText(truncated ? `${captionLines[i]}…` : captionLines[i], contentX, cursorY);
    if (truncated) break;
  }

  drawBrandFooter(ctx, contentX, cardY, cardW, cardH, innerPad, sansFont, opts.logoImage, opts.brandingWordmark, opts.brandingHandle);
  void pad;
}

function drawPoemSlide(ctx: CanvasRenderingContext2D, opts: RenderPurananuruCarouselOptions) {
  const { width, height, poem, tamilFont, sansFont } = opts;
  const { cardX, cardY, cardW, cardH } = drawCardSurface(ctx, width, height);

  const innerPad = cardW * 0.1;
  const contentX = cardX + innerPad;
  const contentW = cardW - innerPad * 2;
  let cursorY = cardY + cardH * 0.14;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(cardH * 0.026)}px ${sansFont}`;
  ctx.fillText(
    truncateToWidth(ctx, `PURANANURU ${poem.poemNumber} · ${poem.poet.toUpperCase()}`, contentW),
    contentX,
    cursorY
  );
  cursorY += cardH * 0.07;

  // Reserve the brand footer's own zone (see drawBrandFooter's brandY) plus
  // a margin, same convention as drawHookSlide's captionMaxY -- so a long
  // poem, meaning, or the unverified badge can never grow tall enough to
  // collide with the logo/wordmark. Each block below stops (with an
  // ellipsis on wrapped text) once it would cross this line, rather than
  // overlapping it.
  const maxY = cardY + cardH - innerPad * 0.55 - cardH * 0.09;

  ctx.fillStyle = FOREGROUND;
  ctx.font = `500 ${Math.round(cardH * 0.045)}px ${tamilFont}`;
  const tamilLineStep = cardH * 0.058;
  for (const line of wrapText(ctx, poem.tamilText, contentW)) {
    if (cursorY + tamilLineStep > maxY) break;
    cursorY += tamilLineStep;
    ctx.fillText(line, contentX, cursorY);
  }

  // Optional -- omitted (not blank-rendered) when the canon entry itself
  // has no transliteration, e.g. an unverified/fragmentary tamilText. See
  // canon.ts's own field doc for why this is a mechanical, unsourced
  // best-effort aid rather than a verified romanization.
  if (poem.transliteration) {
    cursorY += cardH * 0.025;
    ctx.fillStyle = MUTED;
    ctx.font = `italic 400 ${Math.round(cardH * 0.026)}px ${sansFont}`;
    const translitLineStep = cardH * 0.036;
    for (const line of wrapText(ctx, poem.transliteration, contentW)) {
      if (cursorY + translitLineStep > maxY) break;
      cursorY += translitLineStep;
      ctx.fillText(line, contentX, cursorY);
    }
  }

  cursorY += cardH * 0.05;
  ctx.fillStyle = FOREGROUND;
  ctx.font = `400 ${Math.round(cardH * 0.032)}px ${sansFont}`;
  const meaningLineStep = cardH * 0.046;
  const meaningLines = wrapText(ctx, poem.simpleMeaning, contentW);
  for (let i = 0; i < meaningLines.length; i++) {
    const nextY = cursorY + meaningLineStep;
    if (nextY > maxY) break;
    cursorY = nextY;
    const isLastAllowed = nextY + meaningLineStep > maxY;
    const truncated = isLastAllowed && i < meaningLines.length - 1;
    ctx.fillText(truncated ? `${meaningLines[i]}…` : meaningLines[i], contentX, cursorY);
    if (truncated) break;
  }

  if (!poem.verified && cursorY + cardH * 0.05 <= maxY) {
    cursorY += cardH * 0.05;
    ctx.fillStyle = "#8A5A00";
    ctx.font = `600 ${Math.round(cardH * 0.024)}px ${sansFont}`;
    ctx.fillText("⚠ UNVERIFIED — confirm against source before publishing", contentX, cursorY);
  }

  drawBrandFooter(ctx, contentX, cardY, cardW, cardH, innerPad, sansFont, opts.logoImage, opts.brandingWordmark, opts.brandingHandle);
}

export function renderPurananuruCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderPurananuruCarouselOptions
): void {
  if (opts.slideIndex === 0) {
    drawHookSlide(ctx, opts);
  } else {
    drawPoemSlide(ctx, opts);
  }
}

/** Fully independent export render, same pattern as
 *  renderAathichoodiCarouselSlideForExport: fresh off-screen canvas at
 *  exact output dimensions, returns a PNG Blob. */
export async function renderPurananuruCarouselSlideForExport(
  poem: ComposedPoem,
  slideIndex: number,
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

  renderPurananuruCarouselSlide(ctx, {
    width: format.width,
    height: format.height,
    poem,
    slideIndex,
    ...fonts,
    logoImage,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
