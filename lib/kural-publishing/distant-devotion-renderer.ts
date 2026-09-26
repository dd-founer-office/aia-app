/**
 * Distant Devotion — Content System Renderer
 * ----------------------------------------------------------------------------
 * DD's own visual identity, deliberately distinct from AiA's forest-green
 * Aathichoodi look and KKA's bronze/Formation-Path system (per explicit
 * product direction: do not accidentally inherit AiA's visual language).
 * Reuses this feature's two genuinely shared primitives -- the Ambient
 * Language Layer (ambient-language-layer.ts) and the seeded RNG
 * (seeded-random.ts) -- exactly as aathichoodi-renderer.ts does, so there is
 * still exactly one ambient-field implementation and one RNG in this
 * feature, not a third copy.
 *
 * Two render modes, mirroring the existing aathichoodi/aathichoodi-carousel
 * split: renderDistantDevotion (one dense single-image card: hook + body +
 * cta) and renderDistantDevotionCarouselSlide (3 slides: 0 Hook, 1 Body,
 * 2 Call-to-Action + hashtags). A SAFETY_CAPPED asset never renders a CTA
 * slide element, matching its metadata (no "cta" field reaches this
 * renderer at all -- see distant-devotion/validation.ts).
 *
 * Palette: warm terracotta/heritage tones -- warm cream ground, terracotta
 * accent, deep warm-brown foreground -- chosen specifically to read as
 * distinct from AiA's forest green and KKA's own palette, per that product
 * direction. brandingWordmark/Handle text below is a reasonable placeholder
 * pending real founder-supplied brand copy (same "fails silently, never
 * fabricates a logo image" rule as the other two templates -- see
 * DISTANT_DEVOTION_LOGO_PATH in KuralHeroCanvas.tsx).
 */

import { createSeededRandom } from "./seeded-random";
import { drawAmbientLanguageLayer, extractTamilGraphemes } from "./ambient-language-layer";
import type { DdComposedAsset } from "./distant-devotion/types";

const BG = "#FBF3EC";
const CARD = "#FFFFFF";
const BORDER = "#E8DCC8";
const PRIMARY = "#8B4A3C";
const FOREGROUND = "#2E2420";
const MUTED = "#8A7A6C";
const REVIEW_BADGE_BG = "#F6E7DC";
const REVIEW_BADGE_FG = "#8B4A3C";

const FALLBACK_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

export interface RenderDistantDevotionOptions {
  width: number;
  height: number;
  asset: DdComposedAsset;
  tamilFont: string;
  sansFont: string;
  serifFont: string;
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

function deriveSeed(asset: DdComposedAsset): number {
  const text = asset.content.hook || asset.metadata.world;
  let acc = 0;
  for (let i = 0; i < text.length; i++) acc = (acc * 31 + text.codePointAt(i)!) >>> 0;
  return acc > 0 ? acc : 4021;
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

/** Base surface + ambient field + rounded card chrome, identical across
 *  every DD slide/single-card layout -- factored out once rather than
 *  duplicated per mode. Returns the card's inner content box. */
function paintCardChrome(
  ctx: CanvasRenderingContext2D,
  opts: { width: number; height: number; asset: DdComposedAsset; tamilFont: string }
): { contentX: number; contentY: number; contentW: number; contentH: number; cardH: number } {
  const { width, height, asset, tamilFont } = opts;
  const rand = createSeededRandom(deriveSeed(asset));

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);

  const pad = Math.round(Math.min(width, height) * 0.07);
  const cardX = pad;
  const cardY = pad;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  const radius = Math.round(Math.min(width, height) * 0.03);

  const glyphPool = extractTamilGraphemes(`${asset.content.hook} ${asset.content.body}`);
  drawAmbientLanguageLayer(ctx, {
    width,
    height,
    rand,
    font: tamilFont,
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

  const innerPad = cardW * 0.1;
  return {
    contentX: cardX + innerPad,
    contentY: cardY,
    contentW: cardW - innerPad * 2,
    contentH: cardH,
    cardH,
  };
}

function drawWorldLabel(
  ctx: CanvasRenderingContext2D,
  asset: DdComposedAsset,
  x: number,
  y: number,
  sansFont: string,
  cardH: number
): void {
  ctx.fillStyle = MUTED;
  ctx.font = `600 ${Math.round(cardH * 0.026)}px ${sansFont}`;
  ctx.fillText(asset.metadata.world, x, y);
  if (asset.metadata.status === "NEEDS_REVIEW") {
    const label = "NEEDS REVIEW";
    ctx.font = `600 ${Math.round(cardH * 0.022)}px ${sansFont}`;
    const w = ctx.measureText(label).width;
    const badgeH = cardH * 0.036;
    const badgeX = x;
    const badgeY = y + cardH * 0.02;
    ctx.fillStyle = REVIEW_BADGE_BG;
    ctx.fillRect(badgeX, badgeY, w + cardH * 0.03, badgeH);
    ctx.fillStyle = REVIEW_BADGE_FG;
    ctx.fillText(label, badgeX + cardH * 0.015, badgeY + badgeH * 0.72);
  }
}

function drawBrandSignature(
  ctx: CanvasRenderingContext2D,
  opts: {
    cardX: number;
    cardY: number;
    cardW: number;
    cardH: number;
    innerPad: number;
    sansFont: string;
    logoImage?: HTMLImageElement | null;
    brandingWordmark?: string;
    brandingHandle?: string;
  }
): void {
  if (!opts.brandingWordmark) return;
  ctx.save();
  const brandY = opts.cardY + opts.cardH - opts.innerPad * 0.55;
  if (opts.logoImage) {
    const logoH = opts.cardH * 0.05;
    const logoW = logoH * (opts.logoImage.width / opts.logoImage.height);
    ctx.drawImage(opts.logoImage, opts.cardX + opts.cardW - opts.innerPad - logoW, brandY - logoH * 0.85, logoW, logoH);
  }
  ctx.fillStyle = PRIMARY;
  ctx.font = `600 ${Math.round(opts.cardH * 0.028)}px ${opts.sansFont}`;
  ctx.fillText(opts.brandingWordmark, opts.cardX + opts.innerPad, brandY);
  if (opts.brandingHandle) {
    ctx.fillStyle = MUTED;
    ctx.font = `400 ${Math.round(opts.cardH * 0.023)}px ${opts.sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, opts.cardX + opts.innerPad, brandY + opts.cardH * 0.032);
  }
  ctx.restore();
}

/** Single-image mode: hook + body + cta (if any) all on one dense card. */
export function renderDistantDevotion(ctx: CanvasRenderingContext2D, opts: RenderDistantDevotionOptions): void {
  const { width, height, asset, sansFont, tamilFont } = opts;
  const { contentX, contentW, cardH } = paintCardChrome(ctx, { width, height, asset, tamilFont });
  const cardY = Math.round(Math.min(width, height) * 0.07);
  const cardX = contentX - width * 0.03;
  const cardW = contentW + width * 0.06;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let cursorY = cardY + cardH * 0.13;

  drawWorldLabel(ctx, asset, contentX, cursorY, sansFont, cardH);
  cursorY += cardH * 0.08;

  ctx.fillStyle = FOREGROUND;
  ctx.font = `600 ${Math.round(cardH * 0.055)}px ${sansFont}`;
  for (const line of wrapText(ctx, asset.content.hook, contentW)) {
    cursorY += cardH * 0.075;
    ctx.fillText(line, contentX, cursorY);
  }

  cursorY += cardH * 0.04;
  ctx.fillStyle = FOREGROUND;
  ctx.font = `400 ${Math.round(cardH * 0.036)}px ${sansFont}`;
  for (const line of wrapText(ctx, asset.content.body, contentW)) {
    cursorY += cardH * 0.05;
    ctx.fillText(line, contentX, cursorY);
  }

  if (asset.content.cta) {
    cursorY += cardH * 0.05;
    ctx.fillStyle = PRIMARY;
    ctx.font = `600 italic ${Math.round(cardH * 0.032)}px ${sansFont}`;
    for (const line of wrapText(ctx, asset.content.cta, contentW)) {
      cursorY += cardH * 0.045;
      ctx.fillText(line, contentX, cursorY);
    }
  }

  drawBrandSignature(ctx, {
    cardX,
    cardY,
    cardW,
    cardH,
    innerPad: cardW * 0.1,
    sansFont,
    logoImage: opts.logoImage,
    brandingWordmark: opts.brandingWordmark,
    brandingHandle: opts.brandingHandle,
  });
}

export const DD_CAROUSEL_SLIDE_COUNT = 3;
export const DD_SLIDE_LABELS = ["Hook", "Story", "Reflect / Act"] as const;

export interface RenderDistantDevotionCarouselOptions extends RenderDistantDevotionOptions {
  slideIndex: number;
}

/** 3-slide carousel: 0 Hook, 1 Story/Body, 2 Reflect/Act (cta + hashtags,
 *  or -- for a SAFETY_CAPPED asset -- a plain, honest closing line instead
 *  of a manufactured CTA, since content.cta is never populated for those. */
export function renderDistantDevotionCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderDistantDevotionCarouselOptions
): void {
  const { width, height, asset, sansFont, tamilFont, slideIndex } = opts;
  const { contentX, contentW, cardH } = paintCardChrome(ctx, { width, height, asset, tamilFont });
  const cardY = Math.round(Math.min(width, height) * 0.07);
  const cardX = contentX - width * 0.03;
  const cardW = contentW + width * 0.06;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let cursorY = cardY + cardH * 0.15;

  drawWorldLabel(ctx, asset, contentX, cursorY, sansFont, cardH);
  cursorY += cardH * 0.1;

  ctx.fillStyle = MUTED;
  ctx.font = `600 ${Math.round(cardH * 0.024)}px ${sansFont}`;
  ctx.fillText(`${slideIndex + 1} / ${DD_CAROUSEL_SLIDE_COUNT} · ${DD_SLIDE_LABELS[slideIndex]}`, contentX, cursorY);
  cursorY += cardH * 0.09;

  if (slideIndex === 0) {
    ctx.fillStyle = FOREGROUND;
    ctx.font = `600 ${Math.round(cardH * 0.07)}px ${sansFont}`;
    for (const line of wrapText(ctx, asset.content.hook, contentW)) {
      cursorY += cardH * 0.095;
      ctx.fillText(line, contentX, cursorY);
    }
  } else if (slideIndex === 1) {
    ctx.fillStyle = FOREGROUND;
    ctx.font = `400 ${Math.round(cardH * 0.045)}px ${sansFont}`;
    for (const line of wrapText(ctx, asset.content.body, contentW)) {
      cursorY += cardH * 0.062;
      ctx.fillText(line, contentX, cursorY);
    }
  } else {
    if (asset.content.cta) {
      ctx.fillStyle = PRIMARY;
      ctx.font = `600 ${Math.round(cardH * 0.05)}px ${sansFont}`;
      for (const line of wrapText(ctx, asset.content.cta, contentW)) {
        cursorY += cardH * 0.068;
        ctx.fillText(line, contentX, cursorY);
      }
    } else {
      ctx.fillStyle = MUTED;
      ctx.font = `italic 400 ${Math.round(cardH * 0.04)}px ${sansFont}`;
      for (const line of wrapText(ctx, "This one's still being reviewed — check back soon.", contentW)) {
        cursorY += cardH * 0.055;
        ctx.fillText(line, contentX, cursorY);
      }
    }
    if (asset.content.hashtags && asset.content.hashtags.length > 0) {
      cursorY += cardH * 0.08;
      ctx.fillStyle = MUTED;
      ctx.font = `400 ${Math.round(cardH * 0.028)}px ${sansFont}`;
      ctx.fillText(asset.content.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join("  "), contentX, cursorY);
    }
  }

  drawBrandSignature(ctx, {
    cardX,
    cardY,
    cardW,
    cardH,
    innerPad: cardW * 0.1,
    sansFont,
    logoImage: opts.logoImage,
    brandingWordmark: opts.brandingWordmark,
    brandingHandle: opts.brandingHandle,
  });
}

async function renderToBlob(
  paint: (ctx: CanvasRenderingContext2D) => void,
  width: number,
  height: number
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fallback chain already in place */
    }
  }
  paint(ctx);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}

export async function renderDistantDevotionForExport(
  opts: RenderDistantDevotionOptions
): Promise<Blob | null> {
  return renderToBlob((ctx) => renderDistantDevotion(ctx, opts), opts.width, opts.height);
}

export async function renderDistantDevotionCarouselSlideForExport(
  opts: RenderDistantDevotionCarouselOptions
): Promise<Blob | null> {
  return renderToBlob((ctx) => renderDistantDevotionCarouselSlide(ctx, opts), opts.width, opts.height);
}
