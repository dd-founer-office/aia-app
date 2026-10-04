/**
 * Distant Devotion — 6-Second Story: Renderer
 * ----------------------------------------------------------------------------
 * A completely independent renderer -- does NOT reuse distant-devotion-
 * renderer.ts's card-chrome/ambient-language-layer look, and does not share
 * layout/colour logic with any other template in this feature.
 *
 * LOCKED grammar: SEE -> WONDER -> UNDERSTAND -> FEEL, over a fixed 6-second
 * cycle with four phases, gated by the `elapsedSeconds` param every caller
 * must supply:
 *   0.0–1.5s  MOMENT     photo only (already visible, no title card)
 *   1.5–3.0s  CURIOSITY  hook word-track appears above the photo card
 *   3.0–4.5s  INSIGHT    hook disappears completely; story line 1 reveals
 *   4.5–6.0s  FEELING    story line 2 reveals and holds through 6.0s
 * This is the one renderer in this feature that actually animates -- see
 * KuralHeroCanvas.tsx's dedicated requestAnimationFrame effect, scoped only
 * to this template; every other template still draws once and stops. PNG
 * export (no video, per product direction) always renders a single fixed
 * frame -- SIX_SECOND_EXPORT_FRAME, the held FEELING state.
 *
 * LOCKED palette -- exactly these four hex values, nothing else, no
 * gradients, no additional shades (an alpha-blended White/Heritage Red is
 * the same locked colour, not a new one):
 *   Bright Orange   #FC4E00  -- active hook-word highlight, restrained accent
 *   Heritage Red    #67080A  -- page background, strong editorial colour
 *   Soft Background #EAF2F2  -- only shown inside the photo card before a
 *                                photo is uploaded (honest empty state)
 *   White           #FFFFFF  -- primary text colour throughout
 *
 * LOCKED layout: HOOK TRACK / PHOTO CARD / STORY TEXT, three non-overlapping
 * zones stacked top to bottom. The hook never sits on top of the photo; the
 * photo is never hidden while the hook is showing (it's a separate, fixed
 * card). Text shadows aren't needed anymore -- every text element sits on
 * the solid Heritage Red background, not on the photo itself, so plain
 * fills already have strong contrast.
 *
 * Deferred per explicit product direction, not deleted: the brand signature
 * ("DISTANT DEVOTION™ / Connecting Hearts & Roots") and the on-canvas photo
 * credit line. Neither appears in the locked 4-phase spec, so neither
 * renders here yet -- KuralHeroCanvas.tsx simply doesn't pass branding
 * options into this template's render calls for now. story.visualCredit
 * stays in the data model/form for whenever credit placement is defined.
 *
 * Cal Sans: no licensed Cal Sans file exists in this repo yet, so
 * --font-cal-sans resolves to Inter (app/globals.css), never to DM Serif
 * Display -- flagged, not a silent substitution. This file just resolves
 * whatever font string it's handed.
 */

const BRIGHT_ORANGE = "#FC4E00";
const HERITAGE_RED = "#67080A";
const SOFT_BACKGROUND = "#EAF2F2";
const WHITE = "#FFFFFF";

import type { SixSecondStory } from "./distant-devotion-6sec-types";

/** Phase boundaries, in seconds, within one 6-second cycle. */
const MOMENT_END = 1.5;
const CURIOSITY_END = 3.0;
const INSIGHT_END = 4.5;
const FEELING_END = 6.0;

export const SIX_SECOND_STORY_DURATION = FEELING_END;

/** Fixed frame used for static PNG export (no video export exists in this
 *  app) -- just inside the FEELING phase so both story lines are held and
 *  the hook has fully disappeared. */
export const SIX_SECOND_EXPORT_FRAME = 5.9;

export interface RenderDistantDevotion6SecOptions {
  width: number;
  height: number;
  story: SixSecondStory;
  /** Resolves to real Cal Sans once a licensed file is added; Inter until
   *  then (see this file's doc comment) -- never DM Serif Display. */
  calSansFont: string;
  interFont: string;
  /** Appended as a font-stack fallback on every text draw so a Tamil word
   *  typed into topic/hookWords/line1/line2 still renders its glyphs
   *  correctly even though those fields aren't language-specific. */
  tamilFont: string;
  visualImage?: HTMLImageElement | null;
  /** Seconds elapsed within the current 6-second cycle. Values outside
   *  [0, 6) are wrapped, so a caller driving a continuous preview loop can
   *  just pass ever-increasing time. */
  elapsedSeconds: number;
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

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** The photo card -- rounded, inset, cover-fit, clipped. Never recoloured,
 *  filtered, or otherwise altered; drawn as-is. Shows the Soft Background
 *  empty state (never a fabricated placeholder image) until a real photo
 *  is uploaded. */
function drawPhotoCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  interFont: string,
  tamilFont: string
): void {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  if (img) {
    const imgRatio = img.width / img.height;
    const boxRatio = w / h;
    let drawW: number;
    let drawH: number;
    if (imgRatio > boxRatio) {
      drawH = h;
      drawW = h * imgRatio;
    } else {
      drawW = w;
      drawH = w / imgRatio;
    }
    const dx = x + (w - drawW) / 2;
    const dy = y + (h - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  } else {
    ctx.fillStyle = SOFT_BACKGROUND;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = HERITAGE_RED;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `600 ${Math.round(w * 0.045)}px ${interFont}, ${tamilFont}`;
    ctx.fillText("Upload a photograph to preview", x + w / 2, y + h / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

/** The hook word-track: a fixed rounded viewport; words slide continuously
 *  right -> left as `progress` (0 to 1 across the whole CURIOSITY phase)
 *  advances, linear motion only (no easing/bounce, per product direction).
 *  The word nearest the viewport centre is "active" -- a Bright Orange pill
 *  behind White text, visually larger; every other word is plain White
 *  text at reduced opacity. The viewport boundary itself is just a faint
 *  White stroke over the page's own Heritage Red -- no new colour. */
function drawHookTrack(
  ctx: CanvasRenderingContext2D,
  opts: {
    x: number;
    y: number;
    w: number;
    h: number;
    words: readonly string[];
    progress: number;
    calSansFont: string;
    tamilFont: string;
  }
): void {
  const { x, y, w, h, words, progress, calSansFont, tamilFont } = opts;
  if (words.length === 0) return;

  ctx.save();
  roundedRectPath(ctx, x, y, w, h, h * 0.22);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = Math.max(1, h * 0.025);
  ctx.stroke();
  ctx.clip();

  const centerX = x + w / 2;
  const centerY = y + h / 2;
  const n = words.length;
  const f = Math.min(Math.max(progress, 0), 1) * n;
  const spacing = w * 0.58;
  const activeIndex = Math.min(Math.round(f), n - 1);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  words.forEach((word, i) => {
    const offset = (i - f) * spacing;
    const drawX = centerX + offset;
    if (drawX < x - spacing * 0.6 || drawX > x + w + spacing * 0.6) return;

    if (i === activeIndex) {
      const size = h * 0.34;
      ctx.font = `700 ${Math.round(size)}px ${calSansFont}, ${tamilFont}`;
      const textW = ctx.measureText(word).width;
      const padX = size * 0.55;
      const pillW = textW + padX * 2;
      const pillH = size * 1.55;
      ctx.fillStyle = BRIGHT_ORANGE;
      roundedRectPath(ctx, drawX - pillW / 2, centerY - pillH / 2, pillW, pillH, pillH * 0.32);
      ctx.fill();
      ctx.fillStyle = WHITE;
      ctx.fillText(word, drawX, centerY + size * 0.03);
    } else {
      const size = h * 0.22;
      ctx.font = `500 ${Math.round(size)}px ${calSansFont}, ${tamilFont}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.fillText(word, drawX, centerY);
    }
  });

  ctx.restore();
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function renderDistantDevotion6Sec(
  ctx: CanvasRenderingContext2D,
  opts: RenderDistantDevotion6SecOptions
): void {
  const { width, height, story, calSansFont, interFont, tamilFont, visualImage } = opts;
  const t = ((opts.elapsedSeconds % SIX_SECOND_STORY_DURATION) + SIX_SECOND_STORY_DURATION) % SIX_SECOND_STORY_DURATION;
  const pad = Math.round(width * 0.07);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = HERITAGE_RED;
  ctx.fillRect(0, 0, width, height);

  // Hook zone geometry -- always reserved (so the photo card/text never
  // shift between phases), only painted during CURIOSITY.
  const hookZoneTop = Math.round(height * 0.07);
  const hookViewportH = Math.round(height * 0.082);
  const hookViewportW = Math.round(width * 0.86);
  const hookViewportX = Math.round((width - hookViewportW) / 2);

  // Photo card -- the centrepiece, below the hook zone, never overlapped.
  const photoTop = hookZoneTop + hookViewportH + Math.round(height * 0.05);
  const photoH = Math.round(height * 0.48);
  const photoX = pad;
  const photoW = width - pad * 2;
  const photoRadius = Math.round(width * 0.045);

  // Photo is visible from t=0 -- MOMENT shows nothing else at all.
  drawPhotoCard(ctx, visualImage ?? null, photoX, photoTop, photoW, photoH, photoRadius, interFont, tamilFont);

  // CURIOSITY: 1.5–3.0s only. Disappears completely outside this window --
  // not drawn at all, not just faded, so it can never show behind the text.
  if (t >= MOMENT_END && t < CURIOSITY_END) {
    const progress = (t - MOMENT_END) / (CURIOSITY_END - MOMENT_END);
    drawHookTrack(ctx, {
      x: hookViewportX,
      y: hookZoneTop,
      w: hookViewportW,
      h: hookViewportH,
      words: story.hookWords,
      progress,
      calSansFont,
      tamilFont,
    });
  }

  // INSIGHT (3.0s): line 1. FEELING (4.5s): line 2, held through 6.0s.
  // Both checked fresh against the current t rather than "was it already
  // shown" -- t >= 4.5 implies t >= 3.0 too, so line 1 always lays out
  // first in the same pass and line 2 continues from its real position.
  const maxTextWidth = width - pad * 2;
  const line1Size = Math.round(width * 0.062);
  const line2Size = Math.round(width * 0.052);
  let cursorY = photoTop + photoH + Math.round(height * 0.055);

  if (t >= CURIOSITY_END && story.line1) {
    ctx.fillStyle = WHITE;
    ctx.font = `700 ${line1Size}px ${calSansFont}, ${tamilFont}`;
    for (const line of wrapText(ctx, story.line1, maxTextWidth)) {
      cursorY += line1Size * 1.22;
      ctx.fillText(line, pad, cursorY);
    }
  }

  if (t >= INSIGHT_END && story.line2) {
    cursorY += Math.round(height * 0.025);
    ctx.fillStyle = WHITE;
    ctx.font = `600 ${line2Size}px ${calSansFont}, ${tamilFont}`;
    for (const line of wrapText(ctx, story.line2, maxTextWidth)) {
      cursorY += line2Size * 1.26;
      ctx.fillText(line, pad, cursorY);
    }
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
