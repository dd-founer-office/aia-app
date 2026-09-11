/**
 * Daily Aathichoodi Series — Family Carousel Renderer (Visual System v4)
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
 * Design philosophy (v4, superseding the invented deep-green v3 palette):
 * per explicit founder direction, the carousel now uses the ACTUAL AiA
 * platform design tokens (app/globals.css), not a bespoke editorial palette
 * -- brand consistency with the rest of the product over a one-off look for
 * this feature. See COLORS below: it mirrors --color-background,
 * --color-card, --color-border, --color-foreground, --color-muted-foreground,
 * --color-primary, --color-primary-dark, and --color-badge-verified-bg
 * verbatim. The "no decoration" hard rule from v3 still holds -- no
 * watermark letter, no botanical accent, no per-CTA icon -- only now
 * expressed in the platform's own light warm-off-white + forest-green
 * system instead of an invented dark-green field.
 *
 * Typography: exactly the platform's three type roles -- Noto Serif Tamil /
 * Noto Sans Tamil for Tamil script, DM Sans for all body/UI text, DM Serif
 * Display reserved for a display/wordmark moment only (Slide 5's single
 * editorial statement, mirroring the app's own splash-screen usage).
 *
 * Brand mark: drawn from the real logo asset (KuralHeroCanvas.tsx's
 * AIA_KOLAM_MARK_PATH), never redrawn/approximated/regenerated, in its own
 * real colors -- the light platform background needs no reversed/monochrome
 * treatment (that was a v3-only necessity for legibility on a dark field).
 * NOTE: this app currently wires in the verified AiA kolam mark as the
 * brand asset (the only real AiA logo file present in the repo); if a
 * different file is supplied as the official source-of-truth logo, swap
 * AIA_KOLAM_MARK_PATH in KuralHeroCanvas.tsx to point at it -- this
 * renderer draws whatever real image it is given unmodified and requires
 * no other change.
 */

import type { ComposedEpisode } from "./aathichoodi/content-engine";

// ---------------------------------------------------------------------------
// Design tokens -- lifted verbatim from app/globals.css, the same palette
// every other screen in the AiA platform uses. Changing the system means
// changing these (or globals.css), never a one-off value inside a slide
// case.
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#EFF4F2",
  backgroundDeep: "#E3ECE7",
  card: "#FFFFFF",
  border: "#DCE2DF",
  foreground: "#2B2A26",
  mutedForeground: "#8A8678",
  primary: "#328D63",
  primaryDark: "#236345",
  primaryForeground: "#FFFFFF",
  badgeVerifiedBg: "#E6F2EC",
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
// Background: the platform's own warm off-white surface with its own
// hairline border. No watermark letter, no botanical accent -- per the
// "no decoration" hard rule, the field is just colour.
// ---------------------------------------------------------------------------

function drawSurface(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.backgroundDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = Math.max(1, Math.round(Math.min(width, height) * 0.0015));
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
  ctx.restore();
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

  ctx.fillStyle = COLORS.foreground;
  ctx.font = `700 ${labelSize}px ${sansFont}`;
  ctx.fillText("AATHICHOODI", frame.contentX, frame.marginY + labelSize);

  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = `500 ${labelSize}px ${sansFont}`;
  ctx.fillText(`EPISODE ${episode.episodeNumber}`, frame.contentX, frame.marginY + labelSize * 2.15);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Page indicator, top-right, refined smaller per the brief.
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = `500 ${Math.round(short * 0.019)}px ${sansFont}`;
  ctx.fillText(`${slideIndex + 1} / ${CAROUSEL_SLIDE_COUNT}`, frame.contentX + frame.contentW, frame.marginY + labelSize);

  // Short divider under the metadata block.
  ctx.strokeStyle = COLORS.primary;
  ctx.lineWidth = Math.max(1.5, short * 0.003);
  ctx.beginPath();
  ctx.moveTo(frame.contentX, dividerY);
  ctx.lineTo(frame.contentX + short * 0.06, dividerY);
  ctx.stroke();

  const microLabel = SLIDE_MICRO_LABELS[slideIndex];
  if (microLabel) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.primary;
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
  const logoBox = short * 0.06;
  const rowY = height - frame.marginY - logoBox / 2;
  let cursorX = frame.contentX;

  if (opts.logoImage) {
    // Real mark, unmodified colors -- the light platform background needs
    // no reversed/monochrome treatment.
    const scale = Math.min(logoBox / opts.logoImage.width, logoBox / opts.logoImage.height);
    const drawW = opts.logoImage.width * scale;
    const drawH = opts.logoImage.height * scale;
    ctx.drawImage(opts.logoImage, cursorX, rowY - drawH / 2, drawW, drawH);
    cursorX += drawW + short * 0.022;
  }

  const dividerX = cursorX;
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(dividerX, rowY - logoBox * 0.4);
  ctx.lineTo(dividerX, rowY + logoBox * 0.4);
  ctx.stroke();

  const textX = dividerX + short * 0.018;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.foreground;
  ctx.font = `700 ${Math.round(short * 0.021)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX, rowY - logoBox * 0.06);
  if (opts.brandingHandle) {
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `400 ${Math.round(short * 0.017)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, textX, rowY + logoBox * 0.46);
  }

  // Series signature, right-aligned -- part of the brand system on every
  // slide, kept small/muted so it never competes with the main message.
  ctx.textAlign = "right";
  ctx.fillStyle = COLORS.primary;
  ctx.font = `500 ${Math.round(short * 0.016)}px ${opts.tamilFont}`;
  ctx.fillText("சொல்லில் தமிழ்", frame.contentX + frame.contentW, rowY - logoBox * 0.06);
  ctx.fillText("செயலில் அறம்!", frame.contentX + frame.contentW, rowY + logoBox * 0.46);
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
  // fill the available width rather than a fixed guess. The platform's own
  // deeper green gives it the strongest pop against the off-white field.
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.primaryDark;
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
  ctx.fillStyle = COLORS.foreground;
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
  ctx.fillStyle = COLORS.foreground;
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
  ctx.fillStyle = COLORS.mutedForeground;
  const refSize = Math.round(frame.contentW * 0.036);
  ctx.font = `500 ${refSize}px ${tamilSerifFont}`;
  cursorY += refSize;
  ctx.fillText(episode.tamilText, frame.contentX, cursorY);

  cursorY += refSize * 1.5;
  ctx.fillStyle = COLORS.primaryDark;
  const transSize = Math.round(frame.contentW * 0.034);
  ctx.font = `700 ${transSize}px ${sansFont}`;
  ctx.fillText(episode.transliteration, frame.contentX, cursorY);

  cursorY += transSize * 1.6;
  ctx.fillStyle = COLORS.mutedForeground;
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
    ctx.fillStyle = COLORS.foreground;
    ctx.font = `500 ${setupSize}px ${sansFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    for (const line of lines) {
      cursorY += setupSize * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += setupSize * 0.6;
  }

  // Light green quote panel (the platform's own --color-badge-verified-bg)
  // -- the system's one functional (non-decorative) structuring device,
  // isolating the single actionable question.
  const panelPadX = frame.contentW * 0.06;
  const panelPadY = frame.contentW * 0.05;
  const quoteSize = Math.round(frame.contentW * 0.05);
  ctx.font = `600 ${quoteSize}px ${sansFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2 - frame.contentW * 0.08);
  const quoteLineHeight = quoteSize * 1.38;
  const panelH = panelPadY * 2 + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;

  ctx.fillStyle = COLORS.badgeVerifiedBg;
  ctx.beginPath();
  ctx.roundRect(frame.contentX, panelY, frame.contentW, panelH, frame.contentW * 0.03);
  ctx.fill();

  ctx.fillStyle = COLORS.primary;
  ctx.font = `700 ${Math.round(frame.contentW * 0.1)}px Georgia, serif`;
  ctx.fillText("“", frame.contentX + panelPadX * 0.5, panelY + panelPadY + quoteSize * 0.8);

  ctx.fillStyle = COLORS.primaryDark;
  ctx.font = `600 ${quoteSize}px ${sansFont}`;
  let qy = panelY + panelPadY + quoteSize * 0.85;
  for (const line of quoteLines) {
    ctx.fillText(line, frame.contentX + frame.contentW * 0.08, qy);
    qy += quoteLineHeight;
  }

  cursorY = panelY + panelH + setupSize * 0.9;

  if (after) {
    ctx.fillStyle = COLORS.foreground;
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
  ctx.fillStyle = COLORS.foreground;
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
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `400 ${Math.round(frame.contentW * 0.042)}px ${sansFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += Math.round(frame.contentW * 0.042) * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
  }

  cursorY += frame.contentW * 0.09;

  if (episode.distantDevotionConnection) {
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `italic 400 ${Math.round(frame.contentW * 0.036)}px ${sansFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    for (const line of lines) {
      cursorY += Math.round(frame.contentW * 0.036) * 1.4;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += frame.contentW * 0.04;
  }

  // CTA line -- no icon (per the "no decoration" rule, Slide 5's per-CTA
  // icon system from v2 is removed); the platform's own primary green
  // alone gives it the pop of an actionable line.
  const ctaSize = Math.round(frame.contentW * 0.044);
  ctx.fillStyle = COLORS.primary;
  ctx.font = `700 ${ctaSize}px ${sansFont}`;
  const ctaLines = wrapText(ctx, episode.cta.copy, frame.contentW);
  let ctaY = cursorY;
  for (const line of ctaLines) {
    ctaY += ctaSize * 1.4;
    ctx.fillText(line, frame.contentX, ctaY);
  }
}

export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): void {
  const { width, height, episode, slideIndex, tamilSerifFont, sansFont, displayFont } = opts;
  const frame = computeFrame(width, height, slideIndex);

  drawSurface(ctx, width, height);
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
