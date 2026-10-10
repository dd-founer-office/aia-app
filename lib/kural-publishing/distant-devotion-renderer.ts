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
 *
 * Carousel Slide 1 has a SECOND, deliberately separate palette (the DD1_*
 * constants below): deep heritage red / bright orange / white, locked per
 * founder direction from a Figma reference, for assets whose content
 * includes a genuine Tamil headline (content.tamilHeadline). It activates
 * only for that case -- see drawDdSlide1TamilPanel and its call site in
 * renderDistantDevotionCarouselSlide -- so every asset without a Tamil
 * headline (including every asset generated before this template existed)
 * keeps rendering Slide 1 from `hook` on the cream/terracotta chrome above,
 * completely unaffected.
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

// ---------------------------------------------------------------------------
// Slide 1 -- Tamil headline panel template (deep heritage red / bright orange)
// ---------------------------------------------------------------------------
// A second, deliberately separate palette for Carousel Slide 1 only, per
// founder direction: lock the Figma reference's red/orange/white as this
// template's own brand tokens, while BG/CARD/PRIMARY above stay exactly as
// they are for Slides 2-3 and single-image mode. This is additive: it only
// activates when asset.content.tamilHeadline is present (see
// renderDistantDevotionCarouselSlide below), so every asset without that
// field -- including every asset generated before this template existed --
// renders Slide 1 exactly as it always has, from `hook`.
const DD1_BG = "#4A0E13";
const DD1_PANEL_BORDER = "#F2832E";
const DD1_HEADLINE = "#F2832E";
const DD1_EMPHASIS_BG = "#2E0A0E";
const DD1_EMPHASIS_TEXT = "#FFFFFF";
const DD1_SUPPORT = "#9099AC";

interface EmphasisToken {
  word: string;
  emphasized: boolean;
}

/** Splits "plain **emphasized phrase** plain" into word tokens tagged with
 *  whether they fall inside a **...** run, so wrapping/centering can treat
 *  emphasis as a per-word flag rather than a separate text pass. */
function tokenizeEmphasis(text: string): EmphasisToken[] {
  const tokens: EmphasisToken[] = [];
  const re = /\*\*(.+?)\*\*|\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[1] !== undefined) {
      for (const w of m[1].split(/\s+/).filter(Boolean)) tokens.push({ word: w, emphasized: true });
    } else {
      tokens.push({ word: m[0], emphasized: false });
    }
  }
  return tokens;
}

/** Word-wraps emphasis tokens to maxWidth. An emphasized word's wrap slot
 *  includes its highlight-box padding on both sides so wrapped lines never
 *  let a highlight box crowd or overlap its neighbor. */
function wrapEmphasisTokens(
  ctx: CanvasRenderingContext2D,
  tokens: EmphasisToken[],
  maxWidth: number,
  spaceWidth: number,
  emphasisPadX: number
): EmphasisToken[][] {
  const lines: EmphasisToken[][] = [];
  let line: EmphasisToken[] = [];
  let lineWidth = 0;
  for (const token of tokens) {
    const raw = ctx.measureText(token.word).width;
    const slot = token.emphasized ? raw + emphasisPadX * 2 : raw;
    const addWidth = line.length ? spaceWidth + slot : slot;
    if (line.length && lineWidth + addWidth > maxWidth) {
      lines.push(line);
      line = [token];
      lineWidth = slot;
    } else {
      line.push(token);
      lineWidth += addWidth;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

/** Draws one centered line of emphasis tokens, filling a rounded highlight
 *  box behind each emphasized word before its (white) text, and the
 *  template's orange headline color for plain words. Assumes ctx.font is
 *  already set to the headline font/size and ctx.textAlign === "left". */
function drawEmphasisLine(
  ctx: CanvasRenderingContext2D,
  line: EmphasisToken[],
  centerX: number,
  baselineY: number,
  spaceWidth: number,
  emphasisPadX: number,
  fontSize: number
): void {
  const slots = line.map((t) => {
    const raw = ctx.measureText(t.word).width;
    return t.emphasized ? raw + emphasisPadX * 2 : raw;
  });
  const totalWidth = slots.reduce((a, b) => a + b, 0) + spaceWidth * (line.length - 1);
  let cursor = centerX - totalWidth / 2;
  const boxTop = baselineY - fontSize * 0.8;
  const boxHeight = fontSize * 1.08;
  const boxRadius = fontSize * 0.14;

  line.forEach((token, i) => {
    const slot = slots[i];
    if (token.emphasized) {
      ctx.save();
      ctx.fillStyle = DD1_EMPHASIS_BG;
      const bx = cursor;
      const bw = slot;
      ctx.beginPath();
      ctx.moveTo(bx + boxRadius, boxTop);
      ctx.arcTo(bx + bw, boxTop, bx + bw, boxTop + boxHeight, boxRadius);
      ctx.arcTo(bx + bw, boxTop + boxHeight, bx, boxTop + boxHeight, boxRadius);
      ctx.arcTo(bx, boxTop + boxHeight, bx, boxTop, boxRadius);
      ctx.arcTo(bx, boxTop, bx + bw, boxTop, boxRadius);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = DD1_EMPHASIS_TEXT;
      ctx.fillText(token.word, cursor + emphasisPadX, baselineY);
    } else {
      ctx.fillStyle = DD1_HEADLINE;
      ctx.fillText(token.word, cursor, baselineY);
    }
    cursor += slot + spaceWidth;
  });
}

/** Carousel Slide 1's Tamil-headline panel: a thin-orange-bordered,
 *  transparent-fill rounded panel centered on a deep heritage-red ground,
 *  holding the asset's Tamil headline (with optional inline emphasis) and a
 *  short English supporting line beneath it. Intentionally has no ambient
 *  field, world label, slide counter, or brand signature -- the Figma
 *  reference shows none of those, and the brief asks not to add visual
 *  elements it doesn't contain. Font size steps down in controlled
 *  increments (never shrinking past a floor) when content runs long,
 *  rather than arbitrarily shrinking everything to force a fit. */
function drawDdSlide1TamilPanel(
  ctx: CanvasRenderingContext2D,
  opts: { width: number; height: number; tamilHeadline: string; supportingLine?: string; tamilFont: string; sansFont: string }
): void {
  const { width, height, tamilHeadline, supportingLine, tamilFont, sansFont } = opts;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = DD1_BG;
  ctx.fillRect(0, 0, width, height);

  const panelW = width * 0.82;
  const panelX = (width - panelW) / 2;
  const panelPadX = panelW * 0.11;
  const maxTextWidth = panelW - panelPadX * 2;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const minFontSize = Math.round(height * 0.032);
  const heightBudget = height * 0.46;

  let fontSize = Math.round(height * 0.052);
  let lineHeight = 0;
  let tamilLines: EmphasisToken[][] = [];
  let supportLines: string[] = [];
  let supportFontSize = 0;
  let supportLineHeight = 0;

  for (; fontSize >= minFontSize; fontSize -= 2) {
    ctx.font = `600 ${fontSize}px ${tamilFont}`;
    const tokens = tokenizeEmphasis(tamilHeadline);
    const spaceWidth = ctx.measureText(" ").width;
    const emphasisPadX = fontSize * 0.14;
    tamilLines = wrapEmphasisTokens(ctx, tokens, maxTextWidth, spaceWidth, emphasisPadX);
    lineHeight = fontSize * 1.32;

    supportFontSize = Math.round(fontSize * 0.46);
    supportLineHeight = supportFontSize * 1.45;
    ctx.font = `500 ${supportFontSize}px ${sansFont}`;
    supportLines = supportingLine ? wrapText(ctx, supportingLine, maxTextWidth) : [];

    // Last Tamil line only needs its own cap+descent (~fontSize*1.08), not a
    // full extra lineHeight, once a support block follows it -- otherwise
    // the panel grows a full blank line taller than the text actually needs.
    const supportBlockHeight = supportLines.length > 0 ? fontSize * 0.3 + supportLines.length * supportLineHeight : 0;
    const tamilBlockHeight =
      supportLines.length > 0 ? (tamilLines.length - 1) * lineHeight + fontSize * 1.08 : tamilLines.length * lineHeight;
    const totalHeight = tamilBlockHeight + supportBlockHeight;
    if (totalHeight <= heightBudget || fontSize <= minFontSize) break;
  }

  const supportBlockHeight = supportLines.length > 0 ? fontSize * 0.3 + supportLines.length * supportLineHeight : 0;
  const tamilBlockHeight =
    supportLines.length > 0 ? (tamilLines.length - 1) * lineHeight + fontSize * 1.08 : tamilLines.length * lineHeight;
  const totalContentHeight = tamilBlockHeight + supportBlockHeight;
  const panelPadTop = fontSize * 0.95;
  const panelPadBottom = fontSize * 0.8;
  const panelH = totalContentHeight + panelPadTop + panelPadBottom;
  const panelY = (height - panelH) / 2;
  const radius = Math.round(Math.min(width, height) * 0.025);

  ctx.save();
  ctx.strokeStyle = DD1_PANEL_BORDER;
  ctx.lineWidth = Math.max(1.5, height * 0.0018);
  ctx.beginPath();
  ctx.moveTo(panelX + radius, panelY);
  ctx.arcTo(panelX + panelW, panelY, panelX + panelW, panelY + panelH, radius);
  ctx.arcTo(panelX + panelW, panelY + panelH, panelX, panelY + panelH, radius);
  ctx.arcTo(panelX, panelY + panelH, panelX, panelY, radius);
  ctx.arcTo(panelX, panelY, panelX + panelW, panelY, radius);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  const centerX = width / 2;
  let cursorY = panelY + panelPadTop;
  ctx.font = `600 ${fontSize}px ${tamilFont}`;
  const spaceWidth = ctx.measureText(" ").width;
  const emphasisPadX = fontSize * 0.14;
  for (const line of tamilLines) {
    drawEmphasisLine(ctx, line, centerX, cursorY, spaceWidth, emphasisPadX, fontSize);
    cursorY += lineHeight;
  }

  if (supportLines.length > 0) {
    cursorY += fontSize * 0.3 - lineHeight + supportLineHeight;
    ctx.font = `500 ${supportFontSize}px ${sansFont}`;
    ctx.fillStyle = DD1_SUPPORT;
    ctx.textAlign = "center";
    for (const line of supportLines) {
      ctx.fillText(line, centerX, cursorY);
      cursorY += supportLineHeight;
    }
    ctx.textAlign = "left";
  }
}

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

  if (slideIndex === 0 && asset.content.tamilHeadline) {
    drawDdSlide1TamilPanel(ctx, {
      width,
      height,
      tamilHeadline: asset.content.tamilHeadline,
      supportingLine: asset.content.supportingLine,
      tamilFont,
      sansFont,
    });
    return;
  }

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
