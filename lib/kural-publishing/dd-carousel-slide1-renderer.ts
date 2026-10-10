/**
 * DD- Carousel (Slide 1) — Renderer
 * ----------------------------------------------------------------------------
 * Implements the Figma reference exactly: a thin-orange-bordered,
 * transparent-fill rounded panel centered on a deep heritage-red ground,
 * holding a centered Tamil headline (with one optional inline-emphasized
 * phrase, rendered as white text on a dark highlight box) and a short
 * muted blue-grey English line beneath it.
 *
 * This is its OWN, separate palette -- deep heritage red / bright orange /
 * white -- locked per founder direction from the Figma screenshot, and has
 * nothing to do with the existing Distant Devotion carousel's cream/
 * terracotta look (distant-devotion-renderer.ts), which is untouched by
 * this file. Deliberately has no ambient field, world label, slide
 * counter, or brand signature -- the Figma reference shows none of those.
 *
 * Font size steps down in controlled increments (never below a floor) when
 * content runs long, rather than shrinking all text arbitrarily -- the
 * template must stay legible for different Tamil headlines/English
 * messages, not just the one reference example.
 */

import type { DdCarouselSlide1Content } from "./dd-carousel-slide1-types";

const BG = "#4A0E13";
const PANEL_BORDER = "#F2832E";
const HEADLINE = "#F2832E";
const EMPHASIS_BG = "#2E0A0E";
const EMPHASIS_TEXT = "#FFFFFF";
const SUPPORT = "#9099AC";

export interface RenderDdCarouselSlide1Options {
  width: number;
  height: number;
  content: DdCarouselSlide1Content;
  tamilFont: string;
  sansFont: string;
}

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
      ctx.fillStyle = EMPHASIS_BG;
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
      ctx.fillStyle = EMPHASIS_TEXT;
      ctx.fillText(token.word, cursor + emphasisPadX, baselineY);
    } else {
      ctx.fillStyle = HEADLINE;
      ctx.fillText(token.word, cursor, baselineY);
    }
    cursor += slot + spaceWidth;
  });
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

export function renderDdCarouselSlide1(ctx: CanvasRenderingContext2D, opts: RenderDdCarouselSlide1Options): void {
  const { width, height, content, tamilFont, sansFont } = opts;
  const tamilHeadline = content.tamilHeadline;
  const supportingLine = content.englishSupport;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = BG;
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
  ctx.strokeStyle = PANEL_BORDER;
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
    ctx.fillStyle = SUPPORT;
    ctx.textAlign = "center";
    for (const line of supportLines) {
      ctx.fillText(line, centerX, cursorY);
      cursorY += supportLineHeight;
    }
    ctx.textAlign = "left";
  }
}

export async function renderDdCarouselSlide1ForExport(
  opts: RenderDdCarouselSlide1Options
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = opts.width;
  canvas.height = opts.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  if (typeof document !== "undefined" && "fonts" in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* fallback chain already in place */
    }
  }
  renderDdCarouselSlide1(ctx, opts);
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
