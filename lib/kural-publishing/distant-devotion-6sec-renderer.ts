/**
 * Distant Devotion — 6-Second Story: Renderer
 * ----------------------------------------------------------------------------
 * A completely independent renderer -- does NOT reuse distant-devotion-
 * renderer.ts's card-chrome/ambient-language-layer look (that system's warm
 * terracotta palette and bordered card are explicitly a different content
 * system's visual identity). This format is photo-first, full-bleed, 9:16:
 * one real photograph as the hero, two short text beats, minimal brand
 * signature. No animation, no video -- draws once per (content, generation,
 * format) change, same as every other renderer in this feature.
 *
 * LOCKED palette -- exactly these four hex values, nothing else, no
 * gradients, no additional shades:
 *   Bright Orange   #FC4E00  -- restrained accent only (pillar kicker)
 *   Heritage Red    #67080A  -- strong editorial/brand elements
 *   Soft Background #EAF2F2  -- only shown where no photo exists yet
 *   White           #FFFFFF  -- default text colour over the photograph
 *
 * No large coloured rectangle is placed behind the headline (explicit
 * product direction -- the brief calls this out by name as what NOT to do,
 * since it reads as a "quote card," which this format must not look like).
 * Legibility over an arbitrary uploaded photo instead comes from a soft
 * drop-shadow on the text itself (a typographic technique, not a palette
 * colour/fill) plus bottom-anchored placement with generous whitespace
 * above it, matching the brief's "quiet, restrained, image remains hero"
 * direction.
 *
 * Cal Sans: see the headline font-loading note below (resolveAllFonts in
 * KuralHeroCanvas.tsx) -- no licensed Cal Sans file exists in this repo yet,
 * so --font-cal-sans is currently aliased to Inter (app/globals.css), never
 * to DM Serif Display. This file itself just resolves whatever font string
 * it's handed; the moment a real Cal Sans file is wired up, this renderer
 * needs no changes.
 */

const BRIGHT_ORANGE = "#FC4E00";
const HERITAGE_RED = "#67080A";
const SOFT_BACKGROUND = "#EAF2F2";
const WHITE = "#FFFFFF";

import type { SixSecondStory } from "./distant-devotion-6sec-types";

export interface RenderDistantDevotion6SecOptions {
  width: number;
  height: number;
  story: SixSecondStory;
  /** Resolves to real Cal Sans once a licensed file is added; Inter until
   *  then (see this file's doc comment) -- never DM Serif Display. */
  calSansFont: string;
  interFont: string;
  /** Appended as a font-stack fallback on every text draw so a Tamil word
   *  typed into topic/line1/line2/credit still renders its glyphs correctly
   *  even though those fields aren't language-specific. */
  tamilFont: string;
  visualImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingTagline?: string;
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

/** Cover-fit (CSS `object-fit: cover` equivalent): scales the photo to fill
 *  the full 9:16 frame with no letterboxing, cropping whichever dimension
 *  overflows, centred. The photograph is never recoloured, filtered, or
 *  otherwise altered -- drawn as-is. */
function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number
): void {
  const imgRatio = img.width / img.height;
  const frameRatio = width / height;
  let drawW: number;
  let drawH: number;
  if (imgRatio > frameRatio) {
    drawH = height;
    drawW = height * imgRatio;
  } else {
    drawW = width;
    drawH = width / imgRatio;
  }
  const dx = (width - drawW) / 2;
  const dy = (height - drawH) / 2;
  ctx.drawImage(img, dx, dy, drawW, drawH);
}

/** Soft, restrained drop-shadow for text legibility over an arbitrary
 *  photograph -- a typographic technique, not a palette fill, so it stays
 *  within the "no large coloured rectangle" / "no additional shades" rule.
 *  Callers must reset ctx.shadowColor to "transparent" when done (canvas
 *  shadow state persists across draws otherwise). */
function withTextShadow(ctx: CanvasRenderingContext2D, blur: number): void {
  ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = blur * 0.18;
}

function clearTextShadow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function renderDistantDevotion6Sec(
  ctx: CanvasRenderingContext2D,
  opts: RenderDistantDevotion6SecOptions
): void {
  const { width, height, story, calSansFont, interFont, tamilFont, visualImage } = opts;
  const pad = Math.round(width * 0.08);

  ctx.clearRect(0, 0, width, height);

  // Base: soft background shows only where no photo has been uploaded yet
  // -- an honest empty state, never a fabricated placeholder image.
  ctx.fillStyle = SOFT_BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  if (visualImage) {
    drawCoverImage(ctx, visualImage, width, height);
  } else {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = HERITAGE_RED;
    ctx.font = `600 ${Math.round(width * 0.032)}px ${interFont}, ${tamilFont}`;
    ctx.fillText("Upload a photograph to preview", width / 2, height / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // Pillar kicker -- small, uppercase, Bright Orange, restrained accent.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const kickerSize = Math.round(width * 0.028);
  withTextShadow(ctx, kickerSize * 0.5);
  ctx.fillStyle = BRIGHT_ORANGE;
  ctx.font = `700 ${kickerSize}px ${interFont}, ${tamilFont}`;
  try {
    ctx.letterSpacing = `${Math.round(width * 0.0035)}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }
  ctx.fillText(story.pillar, pad, pad + kickerSize);
  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }
  clearTextShadow(ctx);

  // Two story beats -- bottom-anchored, generous whitespace above, Cal
  // Sans (aliased to Inter until a licensed file exists -- see doc
  // comment), White, large enough to read on a phone screen.
  const maxTextWidth = width - pad * 2;
  const line1Size = Math.round(width * 0.062);
  const line2Size = Math.round(width * 0.05);
  const lineGap = Math.round(width * 0.03);

  ctx.font = `700 ${line1Size}px ${calSansFont}, ${tamilFont}`;
  const line1Lines = story.line1 ? wrapText(ctx, story.line1, maxTextWidth) : [];
  ctx.font = `600 ${line2Size}px ${calSansFont}, ${tamilFont}`;
  const line2Lines = story.line2 ? wrapText(ctx, story.line2, maxTextWidth) : [];

  const line1BlockH = line1Lines.length * line1Size * 1.22;
  const line2BlockH = line2Lines.length * line2Size * 1.26;
  const creditH = story.visualCredit ? width * 0.05 : 0;
  const brandH = opts.brandingWordmark ? width * 0.09 : 0;

  const textBlockBottom = height - pad - brandH - creditH;
  let cursorY = textBlockBottom - line2BlockH - (line1Lines.length > 0 && line2Lines.length > 0 ? lineGap : 0) - line1BlockH;

  withTextShadow(ctx, line1Size * 0.22);
  ctx.fillStyle = WHITE;
  ctx.font = `700 ${line1Size}px ${calSansFont}, ${tamilFont}`;
  for (const line of line1Lines) {
    cursorY += line1Size * 1.22;
    ctx.fillText(line, pad, cursorY);
  }

  if (line1Lines.length > 0 && line2Lines.length > 0) cursorY += lineGap;

  ctx.font = `600 ${line2Size}px ${calSansFont}, ${tamilFont}`;
  for (const line of line2Lines) {
    cursorY += line2Size * 1.26;
    ctx.fillText(line, pad, cursorY);
  }
  clearTextShadow(ctx);

  // Photo credit -- only if genuinely supplied, never fabricated. White at
  // reduced opacity (same locked White, not a new shade) for a subtle feel.
  if (story.visualCredit) {
    const creditSize = Math.round(width * 0.022);
    withTextShadow(ctx, creditSize * 0.5);
    ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
    ctx.font = `400 ${creditSize}px ${interFont}, ${tamilFont}`;
    ctx.fillText(`Photo: ${story.visualCredit}`, pad, height - pad - brandH);
    clearTextShadow(ctx);
  }

  // Brand signature -- small, restrained, Inter, never competing with the
  // story. A thin Bright Orange accent mark separates wordmark/tagline.
  if (opts.brandingWordmark) {
    const wordmarkSize = Math.round(width * 0.03);
    const taglineSize = Math.round(width * 0.02);
    withTextShadow(ctx, wordmarkSize * 0.4);
    ctx.fillStyle = WHITE;
    ctx.font = `700 ${wordmarkSize}px ${interFont}, ${tamilFont}`;
    const brandY = height - pad;
    ctx.fillText(opts.brandingWordmark, pad, brandY);
    if (opts.brandingTagline) {
      ctx.fillStyle = BRIGHT_ORANGE;
      ctx.fillRect(pad, brandY + taglineSize * 0.5, width * 0.012, width * 0.012);
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = `400 ${taglineSize}px ${interFont}, ${tamilFont}`;
      ctx.fillText(opts.brandingTagline, pad + width * 0.03, brandY + taglineSize * 0.95);
    }
    clearTextShadow(ctx);
  }
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

export async function renderDistantDevotion6SecForExport(
  opts: RenderDistantDevotion6SecOptions
): Promise<Blob | null> {
  return renderToBlob((ctx) => renderDistantDevotion6Sec(ctx, opts), opts.width, opts.height);
}
