/**
 * Daily Aathichoodi Series — Family Carousel Renderer (Visual System v2)
 * ----------------------------------------------------------------------------
 * VISUAL-ONLY rewrite, explicit founder direction: the approved 5-slide
 * structure and content-generation logic (lib/kural-publishing/aathichoodi/)
 * are UNCHANGED -- this file only changes how that same content is drawn.
 * Renders one of the five Family Carousel slides (STOP / UNDERSTAND / SEE
 * IT IN FAMILY LIFE / TRY THIS TODAY / CARRY IT FORWARD + AiA) for a
 * ComposedEpisode from aathichoodi/content-engine.ts.
 *
 * Primary format is 1080x1350 (4:5, Instagram's recommended portrait
 * carousel size -- see KuralHeroCanvas.tsx's ASSET_FORMATS), but every
 * measurement here is expressed as a fraction of width/height so the same
 * code renders correctly at any selected AssetFormat.
 *
 * Design language: "quiet luxury" editorial, not a graphic-heavy social
 * template -- restraint over decoration (no gradients-on-gradients, no
 * icon clutter, no more than the two type families below). The whole
 * canvas IS the card now (no inset white rectangle floating on a duller
 * background, unlike the old v1 treatment) -- a single warm ivory surface
 * with a hairline edge, generous margins, and two very quiet background
 * accents:
 *   1. ONE oversized, partially-cropped, near-invisible Tamil letter
 *      (sourced from the episode's own text, never invented) bleeding off
 *      a corner -- "cultural texture without becoming ornamental," per
 *      the brief. Deliberately NOT the scattered-glyph-field technique in
 *      ambient-language-layer.ts (that's a different visual, tuned for a
 *      small inset card, still used as-is by the Static format and the KKA
 *      template -- untouched here).
 *   2. A restrained procedural botanical accent (simple bezier leaf/sprout
 *      shapes, no image assets) echoing wisdom/growth/roots.
 * No literal family photography/illustration exists in this app (no image
 * assets, no image-generation pipeline) -- Slide 3 leans on typography +
 * the same restrained botanical accent rather than a fabricated photo.
 *
 * Typography: exactly two families, per the brief's "no more than 1 Tamil
 * display + 1 English/UI font" rule -- Noto Serif Tamil (already loaded
 * app-wide) for every Tamil glyph, DM Sans (already loaded, `sansFont`)
 * for all English UI text. DM Serif Display (already loaded, `displayFont`
 * -- see KuralHeroCanvas.tsx) is used ONLY for Slide 5's single editorial
 * statement, matching the brief's explicit "a very restrained serif may be
 * used for a major closing statement only" allowance.
 *
 * Brand lockup (LOCKED structure, unchanged): round AiA mark -> vertical
 * divider -> "Aram in Action" -> handle beneath, bottom-left, on every
 * slide (consistency over novelty). Uses the real aia-kolam-mark.png asset
 * (see KuralHeroCanvas.tsx's AIA_KOLAM_MARK_PATH) inside a neutral tinted
 * circular badge for visual containment -- the mark itself is drawn
 * unmodified (real colors, no recolor/distortion), just clipped to a
 * circle like a standard avatar treatment.
 */

import { createSeededRandom, type SeededRandom } from "./seeded-random";
import { extractTamilGraphemes } from "./ambient-language-layer";
import type { ComposedEpisode } from "./aathichoodi/content-engine";
import type { CtaTypeId } from "./aathichoodi/cta";

// ---------------------------------------------------------------------------
// Design tokens -- the reusable palette/scale every slide and every future
// episode draws from. Changing the system means changing these, never a
// one-off value inside a slide case.
// ---------------------------------------------------------------------------

const COLORS = {
  ivory: "#F7F3EA",
  ivoryDeep: "#F1EBDD",
  hairline: "#E4DCC8",
  forest: "#1F5C40",
  forestDeep: "#153F2C",
  sage: "#7FA588",
  sagePanel: "#E8EFE6",
  charcoal: "#232019",
  muted: "#847F6E",
};

export const CAROUSEL_SLIDE_COUNT = 5;

export const SLIDE_LABELS: readonly string[] = [
  "Stop",
  "Understand",
  "Family Situation",
  "Today's Action",
  "AiA · Save · Share",
];

/** Slide-specific micro-labels shown under the header divider. Fixed
 *  per slide position (not per-episode content) -- part of the design
 *  system, same as the episode/slide indicators. */
const SLIDE_MICRO_LABELS: readonly string[] = [
  "",
  "WHAT DOES THIS MEAN?",
  "IT HAPPENS AT HOME",
  "TRY THIS TODAY",
  "",
];

const CTA_ICON: Record<CtaTypeId, "bookmark" | "share" | "chat" | "check" | "question" | "people" | "heart"> = {
  SAVE: "bookmark",
  SHARE: "share",
  COMMENT: "chat",
  TRY_TODAY: "check",
  PARENT_REFLECTION: "question",
  AIA_PARTICIPATION: "people",
  DISTANT_DEVOTION: "heart",
  STORY_TESTIMONIAL: "chat",
  SOFT_ENQUIRY: "question",
};

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
  /** DM Serif Display -- Slide 5's editorial statement only. */
  displayFont: string;
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
}

// ---------------------------------------------------------------------------
// Text measurement / fitting (brief section 21: measure, don't guess;
// shorten before shrinking; never estimate Tamil width by character count).
// ---------------------------------------------------------------------------

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

/** Reduces font size (in 1px steps) until the wrapped text's actual
 *  measured height fits maxHeight, or minSize is reached -- real glyph
 *  metrics via ctx.measureText, not a character-count estimate. Returns
 *  the chosen size and the wrapped lines at that size. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: (size: number) => string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
  lineHeightRatio = 1.32
): { size: number; lines: string[]; lineHeight: number } {
  for (let size = startSize; size >= minSize; size -= 1) {
    ctx.font = font(size);
    const lines = wrapText(ctx, text, maxWidth);
    const lineHeight = size * lineHeightRatio;
    if (lines.length * lineHeight <= maxHeight || size === minSize) {
      return { size, lines, lineHeight };
    }
  }
  ctx.font = font(minSize);
  return { size: minSize, lines: wrapText(ctx, text, maxWidth), lineHeight: minSize * lineHeightRatio };
}

/** Splits a composed sentence into short editorial paragraphs (a pure
 *  presentational parse of already-generated text -- content-engine.ts's
 *  own strings are untouched). Breaks after a colon or after a sentence-
 *  ending period followed by a capital letter, so e.g. understanding's
 *  "{opener}: {meaning}. {reframing}" reads as 2-3 short grafs instead of
 *  one dense block, matching the approved benchmark's editorial rhythm. */
function splitEditorialParagraphs(text: string): string[] {
  return text
    .split(/(?<=:)\s+|(?<=\.)\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Pulls a double-quoted substring out of today's action (most action
 *  copy is phrased as `...ask: "question"` or similar) so the quoted part
 *  can get its own visual quote-panel treatment. Falls back to treating
 *  the whole string as the quoted part when no quotes are present, so the
 *  layout adapts to copy rather than assuming a fixed shape. */
function splitQuotedAction(text: string): { before: string; quoted: string; after: string } {
  const match = text.match(/^([\s\S]*?)"([^"]+)"([\s\S]*)$/);
  if (!match) return { before: "", quoted: text, after: "" };
  return { before: match[1].trim(), quoted: match[2].trim(), after: match[3].trim() };
}

// ---------------------------------------------------------------------------
// Background: ivory surface + one oversized cropped Tamil letter + one
// restrained botanical accent. No scattered glyph field here (see module
// doc comment) -- this is a different, quieter visual for a full-bleed card.
// ---------------------------------------------------------------------------

function drawSurface(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.ivory);
  gradient.addColorStop(1, COLORS.ivoryDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Hairline edge -- "extremely light border," the whole canvas IS the card.
  ctx.save();
  ctx.strokeStyle = COLORS.hairline;
  ctx.lineWidth = Math.max(1, Math.round(Math.min(width, height) * 0.0015));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.restore();
}

/** ONE oversized, partially-cropped Tamil letter bleeding off a corner --
 *  "almost watermark-like," per the brief -- sourced from this episode's
 *  own Tamil text so it's rooted in real content, never invented. Corner
 *  alternates by episode number so 109 episodes don't all look identical. */
function drawCroppedLetterWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: ComposedEpisode,
  tamilFont: string
): void {
  const glyphs = extractTamilGraphemes(episode.tamilText);
  if (glyphs.length === 0) return;
  const glyph = glyphs[episode.episodeNumber % glyphs.length];
  const corners: Array<[number, number]> = [
    [0, 0],
    [width, 0],
    [width, height],
    [0, height],
  ];
  const [cx, cy] = corners[episode.episodeNumber % corners.length];

  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = COLORS.forest;
  ctx.font = `700 ${Math.round(Math.min(width, height) * 0.62)}px ${tamilFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, cx, cy);
  ctx.restore();
}

/** A restrained procedural botanical accent -- a simple two-leaf sprout
 *  drawn with bezier curves, no image asset. Deterministic per episode
 *  (position jitter only), very low opacity, sage/forest toned. */
function drawSprout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  rand: SeededRandom
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.16 + rand.range(0, 0.04);
  ctx.strokeStyle = COLORS.forest;
  ctx.fillStyle = COLORS.sage;
  ctx.lineWidth = 2.4;
  // Stem.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-2, -40, 0, -78);
  ctx.stroke();
  // Two leaves.
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(dir * 34, -66, dir * 4, -92);
    ctx.quadraticCurveTo(dir * 2, -70, 0, -50);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: ComposedEpisode,
  slideIndex: number,
  tamilFont: string
): void {
  const rand = createSeededRandom(episode.episodeNumber * 1000 + slideIndex);
  drawSurface(ctx, width, height);
  drawCroppedLetterWatermark(ctx, width, height, episode, tamilFont);

  // One botanical accent per slide, corner-anchored so it never sits under
  // text; alternates corner by slide so the five-slide swipe has quiet
  // rhythm without repeating identically.
  const short = Math.min(width, height);
  const anchors: Array<[number, number]> = [
    [width * 0.12, height * 0.94],
    [width * 0.88, height * 0.08],
    [width * 0.9, height * 0.95],
    [width * 0.1, height * 0.09],
    [width * 0.9, height * 0.93],
  ];
  const [ax, ay] = anchors[slideIndex % anchors.length];
  drawSprout(ctx, ax, ay, short / 420, rand);
}

// ---------------------------------------------------------------------------
// Header / footer -- identical structure on every slide (consistency over
// novelty, per the brief). Only the middle content area varies by slide.
// ---------------------------------------------------------------------------

interface Frame {
  marginX: number;
  marginY: number;
  contentX: number;
  contentW: number;
  contentTop: number;
  contentBottom: number;
}

/** Single source of truth for the header's own vertical geometry, used by
 *  both computeFrame (to know exactly where the header ends, so content
 *  never overlaps a slide's micro-label) and drawHeader (to actually draw
 *  it) -- computed once, never duplicated/drifted between the two. */
function headerMetrics(width: number, height: number, slideIndex: number) {
  const short = Math.min(width, height);
  const marginX = Math.round(width * 0.093);
  const marginY = Math.round(height * 0.075);
  const labelSize = Math.round(short * 0.021);
  const dividerY = marginY + labelSize * 2.15 + labelSize * 0.9;
  const microSize = Math.round(short * 0.023);
  const hasMicroLabel = Boolean(SLIDE_MICRO_LABELS[slideIndex]);
  const microLabelY = dividerY + microSize * 1.9;
  const headerBottom = hasMicroLabel ? microLabelY + microSize * 0.5 : dividerY + microSize * 0.6;
  return { short, marginX, marginY, labelSize, dividerY, microSize, hasMicroLabel, microLabelY, headerBottom };
}

function computeFrame(width: number, height: number, slideIndex: number): Frame {
  // ~90-110px safe margin at 1080px width, per the brief -- expressed as a
  // fraction so it scales correctly at any selected AssetFormat.
  const { marginX, marginY, headerBottom } = headerMetrics(width, height, slideIndex);
  return {
    marginX,
    marginY,
    contentX: marginX,
    contentW: width - marginX * 2,
    contentTop: headerBottom + height * 0.02,
    contentBottom: height - marginY - height * 0.1,
  };
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  height: number,
  episode: ComposedEpisode,
  slideIndex: number,
  sansFont: string
): void {
  const { short, labelSize, dividerY, microSize } = headerMetrics(width, height, slideIndex);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  try {
    ctx.letterSpacing = `${Math.round(labelSize * 0.14)}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }

  ctx.fillStyle = COLORS.charcoal;
  ctx.font = `700 ${labelSize}px ${sansFont}`;
  ctx.fillText("AATHICHOODI", frame.contentX, frame.marginY + labelSize);

  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 ${labelSize}px ${sansFont}`;
  ctx.fillText(`EPISODE ${episode.episodeNumber}`, frame.contentX, frame.marginY + labelSize * 2.15);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Page indicator, top-right, refined smaller per the brief.
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.muted;
  ctx.font = `500 ${Math.round(short * 0.019)}px ${sansFont}`;
  ctx.fillText(`${slideIndex + 1} / ${CAROUSEL_SLIDE_COUNT}`, frame.contentX + frame.contentW, frame.marginY + labelSize);

  // Short green divider under the metadata block.
  ctx.strokeStyle = COLORS.forest;
  ctx.lineWidth = Math.max(1.5, short * 0.003);
  ctx.beginPath();
  ctx.moveTo(frame.contentX, dividerY);
  ctx.lineTo(frame.contentX + short * 0.06, dividerY);
  ctx.stroke();

  const microLabel = SLIDE_MICRO_LABELS[slideIndex];
  if (microLabel) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.forest;
    try {
      ctx.letterSpacing = `${Math.round(microSize * 0.12)}px`;
    } catch {
      /* no-op */
    }
    ctx.font = `700 ${microSize}px ${sansFont}`;
    ctx.fillText(microLabel, frame.contentX, dividerY + microSize * 1.9);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
}

function drawCircularLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.sagePanel;
  ctx.fill();
  ctx.strokeStyle = COLORS.hairline;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.clip();
  // Real mark, unmodified colors -- inset slightly so it reads clearly
  // inside the circular badge rather than touching its edge.
  const inset = radius * 0.32;
  const size = (radius - inset) * 2;
  const scale = Math.min(size / img.width, size / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
  ctx.restore();
}

function drawFooterLockup(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  height: number,
  sansFont: string,
  opts: RenderCarouselSlideOptions
): void {
  if (!opts.brandingWordmark) return;
  const short = Math.min(width, height);
  const logoRadius = short * 0.028;
  const rowY = height - frame.marginY - logoRadius;
  const logoX = frame.contentX + logoRadius;

  if (opts.logoImage) {
    drawCircularLogo(ctx, opts.logoImage, logoX, rowY, logoRadius);
  }

  const dividerX = logoX + logoRadius + short * 0.02;
  ctx.strokeStyle = COLORS.hairline;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dividerX, rowY - logoRadius * 0.8);
  ctx.lineTo(dividerX, rowY + logoRadius * 0.8);
  ctx.stroke();

  const textX = dividerX + short * 0.018;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.charcoal;
  ctx.font = `700 ${Math.round(short * 0.021)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX, rowY - logoRadius * 0.08);
  if (opts.brandingHandle) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 ${Math.round(short * 0.017)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, textX, rowY + logoRadius * 0.62);
  }

  // Series signature, right-aligned -- part of the brand system on every
  // slide, kept small/muted so it never competes with the main message.
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.sage;
  ctx.font = `500 ${Math.round(short * 0.016)}px ${opts.tamilFont}`;
  ctx.fillText("சொல்லில் தமிழ்", frame.contentX + frame.contentW, rowY - logoRadius * 0.08);
  ctx.fillText("செயலில் அறம்!", frame.contentX + frame.contentW, rowY + logoRadius * 0.62);
}

// ---------------------------------------------------------------------------
// CTA icons -- simple line-art, drawn with canvas paths (no image assets),
// picked from the episode's own cta.type so Slide 5 never shows a fixed
// multi-icon menu the content model doesn't actually produce.
// ---------------------------------------------------------------------------

function drawCtaIcon(
  ctx: CanvasRenderingContext2D,
  icon: ReturnType<typeof iconFor>,
  x: number,
  y: number,
  size: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = COLORS.forest;
  ctx.fillStyle = COLORS.forest;
  ctx.lineWidth = size * 0.09;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const s = size / 2;
  switch (icon) {
    case "bookmark":
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s);
      ctx.lineTo(s * 0.6, -s);
      ctx.lineTo(s * 0.6, s);
      ctx.lineTo(0, s * 0.4);
      ctx.lineTo(-s * 0.6, s);
      ctx.closePath();
      ctx.stroke();
      break;
    case "share":
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.7);
      ctx.lineTo(s * 0.2, -s * 0.7);
      ctx.lineTo(s, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(s * 0.2, -s * 0.7);
      ctx.lineTo(s * 0.2, s * 0.5);
      ctx.stroke();
      break;
    case "chat":
      ctx.beginPath();
      ctx.roundRect(-s, -s * 0.7, s * 2, s * 1.3, s * 0.4);
      ctx.stroke();
      break;
    case "check":
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.45, 0);
      ctx.lineTo(-s * 0.1, s * 0.4);
      ctx.lineTo(s * 0.5, -s * 0.4);
      ctx.stroke();
      break;
    case "question":
      ctx.font = `700 ${size}px ${ctx.font.split("px ")[1] ?? "sans-serif"}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("?", 0, size * 0.05);
      break;
    case "people":
      ctx.beginPath();
      ctx.arc(-s * 0.35, -s * 0.3, s * 0.35, 0, Math.PI * 2);
      ctx.arc(s * 0.35, -s * 0.3, s * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.35, s * 0.5, s * 0.55, Math.PI, 0);
      ctx.arc(s * 0.35, s * 0.5, s * 0.55, Math.PI, 0);
      ctx.stroke();
      break;
    case "heart":
      ctx.beginPath();
      ctx.moveTo(0, s * 0.7);
      ctx.bezierCurveTo(-s * 1.1, -s * 0.1, -s * 0.4, -s, 0, -s * 0.35);
      ctx.bezierCurveTo(s * 0.4, -s, s * 1.1, -s * 0.1, 0, s * 0.7);
      ctx.fill();
      break;
  }
  ctx.restore();
}

function iconFor(cta: CtaTypeId) {
  return CTA_ICON[cta];
}

// ---------------------------------------------------------------------------
// Slide content
// ---------------------------------------------------------------------------

function drawSlide0Stop(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  sansFont: string
): void {
  let cursorY = frame.contentTop + (frame.contentBottom - frame.contentTop) * 0.08;

  // The Tamil line is the hero -- largest element on the slide, sized to
  // fill the available width rather than a fixed guess.
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.forest;
  const hero = fitText(
    ctx,
    episode.tamilText,
    (size) => `700 ${size}px ${tamilSerifFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.42,
    Math.round(frame.contentW * 0.15),
    Math.round(frame.contentW * 0.07)
  );
  for (const line of hero.lines) {
    cursorY += hero.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  cursorY += hero.lineHeight * 0.55;
  ctx.fillStyle = COLORS.charcoal;
  const hook = fitText(
    ctx,
    episode.hook,
    (size) => `500 ${size}px ${sansFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.22,
    Math.round(frame.contentW * 0.052),
    Math.round(frame.contentW * 0.036)
  );
  for (const line of hook.lines) {
    cursorY += hook.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }
}

function drawEditorialParagraphs(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  startY: number,
  maxY: number,
  text: string,
  sansFont: string,
  size: number
): number {
  const paragraphs = splitEditorialParagraphs(text);
  ctx.fillStyle = COLORS.charcoal;
  ctx.font = `500 ${size}px ${sansFont}`;
  const lineHeight = size * 1.34;
  let cursorY = startY;
  for (const paragraph of paragraphs) {
    const lines = wrapText(ctx, paragraph, frame.contentW);
    for (const line of lines) {
      if (cursorY > maxY) return cursorY;
      cursorY += lineHeight;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += lineHeight * 0.4;
  }
  return cursorY;
}

function drawSlide1Understand(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  sansFont: string
): void {
  let cursorY = frame.contentTop;

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.muted;
  const refSize = Math.round(frame.contentW * 0.036);
  ctx.font = `500 ${refSize}px ${tamilSerifFont}`;
  cursorY += refSize;
  ctx.fillText(episode.tamilText, frame.contentX, cursorY);

  cursorY += refSize * 1.5;
  ctx.fillStyle = COLORS.forest;
  const transSize = Math.round(frame.contentW * 0.034);
  ctx.font = `700 ${transSize}px ${sansFont}`;
  ctx.fillText(episode.transliteration, frame.contentX, cursorY);

  cursorY += transSize * 1.6;
  ctx.fillStyle = COLORS.muted;
  ctx.font = `italic 400 ${Math.round(frame.contentW * 0.03)}px ${sansFont}`;
  ctx.fillText(episode.simpleMeaning, frame.contentX, cursorY);

  cursorY += transSize * 2.1;
  drawEditorialParagraphs(
    ctx,
    frame,
    cursorY,
    frame.contentBottom,
    episode.understanding,
    sansFont,
    Math.round(frame.contentW * 0.043)
  );
}

function drawSlide2Family(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  sansFont: string
): void {
  drawEditorialParagraphs(
    ctx,
    frame,
    frame.contentTop,
    frame.contentBottom,
    episode.familyAngle,
    sansFont,
    Math.round(frame.contentW * 0.048)
  );
}

function drawSlide3Action(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  sansFont: string
): void {
  const { before, quoted, after } = splitQuotedAction(episode.todayAction);
  let cursorY = frame.contentTop;
  const setupSize = Math.round(frame.contentW * 0.043);

  if (before) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.charcoal;
    ctx.font = `500 ${setupSize}px ${sansFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    for (const line of lines) {
      cursorY += setupSize * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += setupSize * 0.6;
  }

  // Sage quote panel -- soft rounded rect containing the actionable
  // question, sized to the actual wrapped/measured text.
  const panelPadX = frame.contentW * 0.06;
  const panelPadY = frame.contentW * 0.05;
  const quoteSize = Math.round(frame.contentW * 0.05);
  ctx.font = `600 ${quoteSize}px ${sansFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2 - frame.contentW * 0.08);
  const quoteLineHeight = quoteSize * 1.38;
  const panelH = panelPadY * 2 + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;

  ctx.fillStyle = COLORS.sagePanel;
  ctx.beginPath();
  ctx.roundRect(frame.contentX, panelY, frame.contentW, panelH, frame.contentW * 0.03);
  ctx.fill();

  ctx.fillStyle = COLORS.forest;
  ctx.font = `700 ${Math.round(frame.contentW * 0.1)}px Georgia, serif`;
  ctx.fillText("“", frame.contentX + panelPadX * 0.5, panelY + panelPadY + quoteSize * 0.8);

  ctx.fillStyle = COLORS.forestDeep;
  ctx.font = `600 ${quoteSize}px ${sansFont}`;
  let qy = panelY + panelPadY + quoteSize * 0.85;
  for (const line of quoteLines) {
    ctx.fillText(line, frame.contentX + frame.contentW * 0.08, qy);
    qy += quoteLineHeight;
  }

  cursorY = panelY + panelH + setupSize * 0.9;

  if (after) {
    ctx.fillStyle = COLORS.charcoal;
    ctx.font = `600 ${setupSize}px ${sansFont}`;
    const lines = wrapText(ctx, after, frame.contentW);
    for (const line of lines) {
      cursorY += setupSize * 1.34;
      if (cursorY <= frame.contentBottom) ctx.fillText(line, frame.contentX, cursorY);
    }
  }
}

function drawSlide4Carry(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  sansFont: string,
  displayFont: string
): void {
  let cursorY = frame.contentTop + (frame.contentW * 0.05);

  // The main statement gets the premium editorial (display serif)
  // treatment -- split at an em dash when present so the first clause can
  // read heavier than the rest, matching the approved benchmark's shape.
  const emDashSplit = episode.aiaConnection.split(" — ");
  const lead = emDashSplit[0];
  const rest = emDashSplit.slice(1).join(" — ");

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.charcoal;
  const leadFit = fitText(
    ctx,
    rest ? `${lead} —` : lead,
    (size) => `700 ${size}px ${displayFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.32,
    Math.round(frame.contentW * 0.078),
    Math.round(frame.contentW * 0.05),
    1.22
  );
  for (const line of leadFit.lines) {
    cursorY += leadFit.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  if (rest) {
    cursorY += leadFit.lineHeight * 0.25;
    ctx.font = `400 ${Math.round(frame.contentW * 0.042)}px ${sansFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += Math.round(frame.contentW * 0.042) * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
  }

  cursorY += frame.contentW * 0.09;

  if (episode.distantDevotionConnection) {
    ctx.fillStyle = COLORS.muted;
    ctx.font = `italic 400 ${Math.round(frame.contentW * 0.036)}px ${sansFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    for (const line of lines) {
      cursorY += Math.round(frame.contentW * 0.036) * 1.4;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += frame.contentW * 0.04;
  }

  // CTA line with its matching icon.
  const ctaSize = Math.round(frame.contentW * 0.04);
  const iconSize = ctaSize * 1.4;
  drawCtaIcon(ctx, iconFor(episode.cta.type), frame.contentX + iconSize * 0.4, cursorY + ctaSize * 0.3, iconSize);
  ctx.fillStyle = COLORS.forest;
  ctx.font = `700 ${ctaSize}px ${sansFont}`;
  const ctaLines = wrapText(ctx, episode.cta.copy, frame.contentW - iconSize * 1.3);
  let ctaY = cursorY;
  for (const line of ctaLines) {
    ctaY += ctaSize * 1.4;
    ctx.fillText(line, frame.contentX + iconSize * 1.3, ctaY);
  }
}

export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): void {
  const { width, height, episode, slideIndex, tamilSerifFont, sansFont, displayFont } = opts;
  const frame = computeFrame(width, height, slideIndex);

  drawBackground(ctx, width, height, episode, slideIndex, tamilSerifFont);
  drawHeader(ctx, frame, width, height, episode, slideIndex, sansFont);

  ctx.textBaseline = "alphabetic";
  switch (slideIndex) {
    case 0:
      drawSlide0Stop(ctx, frame, episode, tamilSerifFont, sansFont);
      break;
    case 1:
      drawSlide1Understand(ctx, frame, episode, tamilSerifFont, sansFont);
      break;
    case 2:
      drawSlide2Family(ctx, frame, episode, sansFont);
      break;
    case 3:
      drawSlide3Action(ctx, frame, episode, sansFont);
      break;
    case 4:
    default:
      drawSlide4Carry(ctx, frame, episode, sansFont, displayFont);
      break;
  }

  drawFooterLockup(ctx, frame, width, height, sansFont, opts);
}

export async function renderAathichoodiCarouselSlideForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilSerifFont: string; tamilFont: string; serifFont: string; sansFont: string; displayFont: string },
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
