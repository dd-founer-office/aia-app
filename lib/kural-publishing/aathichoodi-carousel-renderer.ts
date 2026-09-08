/**
 * Daily Aathichoodi Series — Family Carousel Renderer
 * ----------------------------------------------------------------------------
 * Renders one of the five Family Carousel slides (STOP / UNDERSTAND /
 * FAMILY SITUATION / TODAY'S ACTION / AiA-SAVE-SHARE) for a ComposedEpisode
 * from lib/kural-publishing/aathichoodi/content-engine.ts. Sibling to, and
 * visually consistent with, aathichoodi-renderer.ts's single-card Static
 * format (same palette, card frame, and Ambient Language Layer via
 * ambient-language-layer.ts) -- deliberately NOT importing from
 * aathichoodi-renderer.ts itself so that file's tested single-card path
 * stays completely untouched; the small amount of shared drawing setup
 * (background, card frame) is duplicated here rather than risking a
 * refactor of already-working code, while the actual substantial shared
 * logic (the Ambient Language Layer engine) is reused via the same shared
 * module both renderers already depend on.
 *
 * Render order per slide: Base surface -> Ambient Language Layer ->
 * Foreground content -> Brand signature (signature slide only -- see
 * SLIDE_METAS[4]).
 */

import { createSeededRandom } from "./seeded-random";
import {
  drawAmbientLanguageLayer,
  extractTamilGraphemes,
} from "./ambient-language-layer";
import type { ComposedEpisode } from "./aathichoodi/content-engine";

const BG = "#EFF4F2";
const CARD = "#FFFFFF";
const BORDER = "#DCE2DF";
const PRIMARY = "#328D63";
const FOREGROUND = "#1F2A24";
const MUTED = "#6B7A72";

const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export const CAROUSEL_SLIDE_COUNT = 5;

export const SLIDE_LABELS: readonly string[] = [
  "Stop",
  "Understand",
  "Family Situation",
  "Today's Action",
  "AiA · Save · Share",
];

export interface RenderCarouselSlideOptions {
  width: number;
  height: number;
  episode: ComposedEpisode;
  /** 0-indexed: 0=Stop, 1=Understand, 2=Family Situation, 3=Today's Action, 4=AiA/CTA. */
  slideIndex: number;
  tamilSerifFont: string;
  tamilFont: string;
  serifFont: string;
  sansFont: string;
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
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
  if (line) lines.push(line);
  return lines;
}

function drawBaseAndAmbient(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: ComposedEpisode,
  tamilSerifFont: string
): { cardX: number; cardY: number; cardW: number; cardH: number; radius: number } {
  const rand = createSeededRandom(episode.episodeNumber * 1000 + episode.totalEpisodes);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const pad = Math.round(Math.min(width, height) * 0.08);
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = Math.round(Math.min(width, height) * 0.035);

  const glyphPool = extractTamilGraphemes(episode.tamilText);
  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilSerifFont,
    glyphPool: glyphPool.length > 0 ? glyphPool : FALLBACK_GLYPHS,
    color: PRIMARY,
    clearBox: { x: cardX, y: cardY, width: cardW, height: cardH },
  });

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

  return { cardX, cardY, cardW, cardH, radius };
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  sansFont: string
): void {
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = MUTED;
  ctx.font = `600 ${Math.round(size)}px ${sansFont}`;
  ctx.fillText(text.toUpperCase(), x, y);
}

function drawSlidePip(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  innerPad: number,
  slideIndex: number,
  sansFont: string,
  cardH: number
): void {
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = MUTED;
  ctx.font = `500 ${Math.round(cardH * 0.028)}px ${sansFont}`;
  ctx.fillText(`${slideIndex + 1} / ${CAROUSEL_SLIDE_COUNT}`, cardX + cardW - innerPad, cardY + cardH * 0.08);
}

function drawBrandSignature(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  innerPad: number,
  contentX: number,
  sansFont: string,
  opts: RenderCarouselSlideOptions
): void {
  if (!opts.brandingWordmark) return;
  ctx.save();
  const brandY = cardY + cardH - innerPad * 0.55;
  if (opts.logoImage) {
    const logoH = cardH * 0.055;
    const logoW = logoH * (opts.logoImage.width / opts.logoImage.height);
    ctx.drawImage(opts.logoImage, cardX + cardW - innerPad - logoW, brandY - logoH * 0.85, logoW, logoH);
  }
  ctx.textAlign = "left";
  ctx.fillStyle = PRIMARY;
  ctx.font = `600 ${Math.round(cardH * 0.03)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark, contentX, brandY);
  if (opts.brandingHandle) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${Math.round(cardH * 0.025)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, contentX, brandY + cardH * 0.035);
  }
  ctx.restore();
}

export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): void {
  const { width, height, episode, slideIndex, tamilSerifFont, sansFont } = opts;
  const { cardX, cardY, cardW, cardH } = drawBaseAndAmbient(ctx, width, height, episode, tamilSerifFont);
  const innerPad = cardW * 0.1;
  const contentX = cardX + innerPad;
  const contentW = cardW - innerPad * 2;

  drawHeader(ctx, `Aathichoodi · Episode ${episode.episodeNumber}`, contentX, cardY + cardH * 0.08, cardH * 0.026, sansFont);
  drawSlidePip(ctx, cardX, cardY, cardW, innerPad, slideIndex, sansFont, cardH);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let cursorY = cardY + cardH * 0.2;

  switch (slideIndex) {
    case 0: {
      // STOP: the line itself, prominent, then the parent hook.
      ctx.fillStyle = PRIMARY;
      ctx.font = `700 ${Math.round(cardH * 0.11)}px ${tamilSerifFont}`;
      const tamilLines = wrapText(ctx, episode.tamilText, contentW);
      for (const line of tamilLines) {
        cursorY += cardH * 0.11;
        ctx.fillText(line, contentX, cursorY);
      }
      cursorY += cardH * 0.08;
      ctx.fillStyle = FOREGROUND;
      ctx.font = `500 ${Math.round(cardH * 0.05)}px ${sansFont}`;
      const hookLines = wrapText(ctx, episode.hook, contentW);
      for (const line of hookLines) {
        cursorY += cardH * 0.07;
        ctx.fillText(line, contentX, cursorY);
      }
      break;
    }
    case 1: {
      // UNDERSTAND: simple modern-language explanation.
      ctx.fillStyle = MUTED;
      ctx.font = `italic 400 ${Math.round(cardH * 0.035)}px ${sansFont}`;
      ctx.fillText(episode.transliteration, contentX, cursorY);
      cursorY += cardH * 0.09;
      ctx.fillStyle = FOREGROUND;
      ctx.font = `500 ${Math.round(cardH * 0.052)}px ${sansFont}`;
      const lines = wrapText(ctx, episode.understanding, contentW);
      for (const line of lines) {
        cursorY += cardH * 0.075;
        ctx.fillText(line, contentX, cursorY);
      }
      break;
    }
    case 2: {
      // FAMILY SITUATION.
      ctx.fillStyle = FOREGROUND;
      ctx.font = `500 ${Math.round(cardH * 0.05)}px ${sansFont}`;
      const lines = wrapText(ctx, episode.familyAngle, contentW);
      for (const line of lines) {
        cursorY += cardH * 0.075;
        ctx.fillText(line, contentX, cursorY);
      }
      break;
    }
    case 3: {
      // TODAY'S ACTION.
      ctx.fillStyle = PRIMARY;
      ctx.font = `600 ${Math.round(cardH * 0.035)}px ${sansFont}`;
      ctx.fillText("TRY THIS TODAY", contentX, cursorY);
      cursorY += cardH * 0.09;
      ctx.fillStyle = FOREGROUND;
      ctx.font = `500 ${Math.round(cardH * 0.052)}px ${sansFont}`;
      const lines = wrapText(ctx, episode.todayAction, contentW);
      for (const line of lines) {
        cursorY += cardH * 0.075;
        ctx.fillText(line, contentX, cursorY);
      }
      break;
    }
    case 4:
    default: {
      // AiA / SAVE / SHARE.
      ctx.fillStyle = FOREGROUND;
      ctx.font = `500 ${Math.round(cardH * 0.048)}px ${sansFont}`;
      const aiaLines = wrapText(ctx, episode.aiaConnection, contentW);
      for (const line of aiaLines) {
        cursorY += cardH * 0.07;
        ctx.fillText(line, contentX, cursorY);
      }
      if (episode.distantDevotionConnection) {
        cursorY += cardH * 0.04;
        ctx.fillStyle = MUTED;
        ctx.font = `italic 400 ${Math.round(cardH * 0.036)}px ${sansFont}`;
        const ddLines = wrapText(ctx, episode.distantDevotionConnection, contentW);
        for (const line of ddLines) {
          cursorY += cardH * 0.06;
          ctx.fillText(line, contentX, cursorY);
        }
      }
      cursorY += cardH * 0.06;
      ctx.fillStyle = PRIMARY;
      ctx.font = `600 ${Math.round(cardH * 0.04)}px ${sansFont}`;
      const ctaLines = wrapText(ctx, episode.cta.copy, contentW);
      for (const line of ctaLines) {
        cursorY += cardH * 0.06;
        ctx.fillText(line, contentX, cursorY);
      }
      drawBrandSignature(ctx, cardX, cardY, cardW, cardH, innerPad, contentX, sansFont, opts);
      break;
    }
  }
}

export async function renderAathichoodiCarouselSlideForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilSerifFont: string; tamilFont: string; serifFont: string; sansFont: string },
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

  renderAathichoodiCarouselSlide(ctx, {
    width: format.width,
    height: format.height,
    episode,
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
