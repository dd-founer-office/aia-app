/**
 * Distant Devotion — Asset Generator: Aathichoodi / Generic Template Renderer
 * ----------------------------------------------------------------------------
 * New, deliberately simple canvas renderer for the Aathichoodi content type
 * (and, generically, Tamil Learning / Announcement / Custom until each gets
 * its own template). Does NOT import from or modify publishing-renderer.ts —
 * that file, and the Kural Koorum Aram / Thirukkural template it draws,
 * stays exactly as it was. This renderer mirrors its render-options shape
 * (resolved font strings, optional logo, optional social branding) so
 * KuralHeroCanvas can dispatch between the two templates with one
 * consistent calling convention.
 *
 * Render order is Base surface -> Ambient Language Layer -> Foreground
 * content -> Brand signature. The Ambient Language Layer call is the shared
 * implementation in ambient-language-layer.ts -- the same noise/clustering
 * primitives publishing-renderer.ts's own KKA-template field now imports
 * from too, so there is exactly one ambient-field implementation in this
 * feature, not two per the standing rule. It is drawn straight into this
 * canvas (so it is part of every exported PNG, at every asset format), never
 * a page-level background.
 *
 * Visual language follows the Visual Constitution: warm off-white
 * background, one primary forest green, white card, warm gray border, calm
 * / premium / editorial. No gradients, no gamification, no clutter.
 */

import { createSeededRandom } from "./seeded-random";
import {
  drawAmbientLanguageLayer,
  extractTamilGraphemes,
} from "./ambient-language-layer";
import type { AathichoodiContent } from "./content-types";

const BG = "#EFF4F2";
const CARD = "#FFFFFF";
const BORDER = "#DCE2DF";
const PRIMARY = "#328D63";
const FOREGROUND = "#1F2A24";
const MUTED = "#6B7A72";

/** Ultimate fallback for the Ambient Language Layer's glyph pool -- the
 *  standalone உயிர் vowels -- used only if a content type's own Tamil
 *  fields (letter + tamilLine) are ever completely empty (e.g. Custom
 *  before anything has been typed), so the layer never renders blank. */
const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export interface RenderAathichoodiOptions {
  width: number;
  height: number;
  content: AathichoodiContent;
  tamilSerifFont: string;
  tamilFont: string;
  serifFont: string;
  sansFont: string;
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

function deriveSeed(content: AathichoodiContent): number {
  const code = content.letter.codePointAt(0) ?? 0;
  return code > 0 ? code : 2734; // codepoint of 'அ', used as a stable fallback
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
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

export function renderAathichoodi(
  ctx: CanvasRenderingContext2D,
  opts: RenderAathichoodiOptions
): void {
  const { width, height, content, tamilSerifFont, sansFont } = opts;
  const rand = createSeededRandom(deriveSeed(content));

  // 1. Base surface.
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const pad = Math.round(Math.min(width, height) * 0.08);
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = Math.round(Math.min(width, height) * 0.035);

  // 2. Ambient Language Layer -- the shared field system (see
  // ambient-language-layer.ts), sourced from this content's own Tamil text
  // so the field is real, never invented. Drawn behind the card, softly
  // thinning toward it rather than a hard clip, so it stays a background
  // presence rather than a decoration.
  const glyphPool = extractTamilGraphemes(
    `${content.letter} ${content.tamilLine}`
  );
  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilSerifFont,
    glyphPool: glyphPool.length > 0 ? glyphPool : FALLBACK_GLYPHS,
    color: PRIMARY,
    clearBox: { x: cardX, y: cardY, width: cardW, height: cardH },
  });

  // 3. Foreground content.
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

  const innerPad = cardW * 0.1;
  const contentX = cardX + innerPad;
  const contentW = cardW - innerPad * 2;
  let cursorY = cardY + cardH * 0.14;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (content.series) {
    ctx.fillStyle = MUTED;
    ctx.font = `500 ${Math.round(cardH * 0.028)}px ${sansFont}`;
    ctx.fillText(content.series.toUpperCase(), contentX, cursorY);
    cursorY += cardH * 0.06;
  }

  if (content.letter) {
    ctx.fillStyle = PRIMARY;
    ctx.font = `600 ${Math.round(cardH * 0.09)}px ${tamilSerifFont}`;
    cursorY += cardH * 0.06;
    ctx.fillText(content.letter, contentX, cursorY);
    cursorY += cardH * 0.05;
  }

  if (content.tamilLine) {
    ctx.fillStyle = FOREGROUND;
    ctx.font = `500 ${Math.round(cardH * 0.072)}px ${tamilSerifFont}`;
    const tamilLines = wrapText(ctx, content.tamilLine, contentW);
    for (const line of tamilLines) {
      cursorY += cardH * 0.09;
      ctx.fillText(line, contentX, cursorY);
    }
    cursorY += cardH * 0.03;
  }

  if (content.easyReading) {
    ctx.fillStyle = MUTED;
    ctx.font = `italic 400 ${Math.round(cardH * 0.035)}px ${sansFont}`;
    cursorY += cardH * 0.05;
    ctx.fillText(content.easyReading, contentX, cursorY);
  }

  if (content.meaning) {
    ctx.fillStyle = FOREGROUND;
    ctx.font = `400 ${Math.round(cardH * 0.04)}px ${sansFont}`;
    const meaningLines = wrapText(ctx, content.meaning, contentW);
    for (const line of meaningLines) {
      cursorY += cardH * 0.06;
      ctx.fillText(line, contentX, cursorY);
    }
  }

  if (content.english) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${Math.round(cardH * 0.032)}px ${sansFont}`;
    const englishLines = wrapText(ctx, content.english, contentW);
    for (const line of englishLines) {
      cursorY += cardH * 0.05;
      ctx.fillText(line, contentX, cursorY);
    }
  }

  // 4. Brand signature. Same slot/rule as the KKA template — only formats
  // that opt in (brandingWordmark set) get the wordmark + handle + logo.
  if (opts.brandingWordmark) {
    ctx.save();
    const brandY = cardY + cardH - innerPad * 0.55;
    if (opts.logoImage) {
      const logoH = cardH * 0.055;
      const logoW = logoH * (opts.logoImage.width / opts.logoImage.height);
      ctx.drawImage(
        opts.logoImage,
        cardX + cardW - innerPad - logoW,
        brandY - logoH * 0.85,
        logoW,
        logoH
      );
    }
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
}

/** Fully independent export render, same pattern as
 *  renderKuralPublishingForExport in KuralHeroCanvas.tsx: builds a fresh
 *  off-screen canvas at exact output dimensions and returns a PNG Blob. */
export async function renderAathichoodiForExport(
  content: AathichoodiContent,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: {
    tamilSerifFont: string;
    tamilFont: string;
    serifFont: string;
    sansFont: string;
  },
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

  renderAathichoodi(ctx, {
    width: format.width,
    height: format.height,
    content,
    logoImage,
    ...fonts,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
