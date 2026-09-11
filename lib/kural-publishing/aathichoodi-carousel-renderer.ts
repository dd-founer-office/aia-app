/**
 * Daily Aathichoodi Series — Family Carousel Renderer (Visual System v5)
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
 * Design philosophy (v5, correcting v4's misreading of "use the platform
 * palette" as "add a dark green field"): background stays the platform's
 * light warm off-white (COLORS.background/backgroundDeep) -- green is an
 * ACCENT only, reserved for important Tamil typography, section labels,
 * highlights (the quote panel) and select brand elements, never the
 * dominant field colour.
 *
 * The "no decoration" rule from earlier versions still holds, refined: an
 * empty flat field read as dead, so the background now carries a "Tamil
 * Living Field" -- see drawTamilLivingField below -- 1-2 oversized,
 * partially-cropped Tamil letterforms per slide, sourced from the episode's
 * own Tamil text, at extremely low opacity and varying scale/position per
 * slide so it never reads as a repeated pattern or wallpaper. This is
 * content, not ornament: the idea is "Tamil quietly lives in this
 * environment," not "Tamil letters pasted on for texture."
 *
 * Typography hierarchy is built on a golden-ratio (phi ~= 1.618) type scale
 * (see typeScale()) so the eye has one unambiguous read order on every
 * slide: hero Tamil >> emphasized line (hook / actionable question /
 * closing statement) > body/explanatory copy > metadata/labels. Two type
 * families: Noto Serif Tamil for Tamil script, DM Sans for all body/UI
 * text, DM Serif Display reserved for Slide 5's single editorial statement.
 *
 * Slide numbering (EPISODE N, N / 5) is removed entirely -- per founder
 * direction this is a progressive teaching series, not a numbered content
 * drop, and Instagram's own carousel UI already communicates position.
 *
 * Brand mark: the real official AiA logo (KuralHeroCanvas.tsx's
 * AIA_KOLAM_MARK_PATH), never redrawn/approximated/regenerated, shown in a
 * large circular avatar-style badge (never a small rectangular mark) with
 * the same visual presence as the wordmark/handle beside it. Branding
 * appears only on Slide 1 (establishes the series) and Slide 5 (the
 * save/share moment) -- deliberate bookends, not a repeated stamp on every
 * slide. The old fixed Tamil signature line ("சொல்லில் தமிழ் •
 * செயலில் அறம்!") is removed -- it was competing with, not supporting,
 * the actual content.
 */

import { createSeededRandom } from "./seeded-random";
import { extractTamilGraphemes } from "./ambient-language-layer";
import type { ComposedEpisode } from "./aathichoodi/content-engine";

// ---------------------------------------------------------------------------
// Design tokens -- lifted verbatim from app/globals.css, the same palette
// every other screen in the AiA platform uses. Changing the system means
// changing these (or globals.css), never a one-off value inside a slide
// case. Green (primary/primaryDark) is used only as an accent -- important
// Tamil typography, section labels, highlights, brand elements -- never as
// a background fill.
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

/** Golden-ratio type scale, derived from a single base ("meta") size. Every
 *  slide picks its sizes from this scale rather than inventing one-off
 *  fractions, so the hierarchy is consistent and dramatic: hero is ~4.3x
 *  meta, not a marginal step up. */
const PHI = 1.618;
function typeScale(short: number) {
  const meta = short * 0.019;
  const body = meta * PHI;
  const heading = body * PHI;
  const display = heading * PHI;
  const hero = display * PHI;
  return { meta, body, heading, display, hero };
}

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
 *  system. */
const SLIDE_MICRO_LABELS: readonly string[] = [
  "",
  "WHAT DOES THIS MEAN?",
  "IT HAPPENS AT HOME",
  "TRY THIS TODAY",
  "",
];

/** Which slides carry the brand lockup -- bookends only (opens and closes
 *  the series moment), never every slide. */
const BRANDED_SLIDES: readonly number[] = [0, 4];

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
// Background: the platform's own warm off-white surface, plus the Tamil
// Living Field -- 1-2 oversized, partially-cropped Tamil letterforms drawn
// from this episode's own text, at extremely low opacity. Never a dense
// field or a repeated pattern (that would read as wallpaper): just enough
// presence that the language feels alive in the environment rather than
// pasted on. Anchors sit at/beyond the canvas edge so Canvas2D's own
// clipping crops them naturally -- "entering from an edge," not stamped.
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

const LIVING_FIELD_ANCHORS: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  [
    [1.14, 0.12],
    [-0.16, 0.92],
  ],
  [
    [-0.17, 0.2],
    [1.15, 0.84],
  ],
  [
    [1.16, 0.68],
    [0.12, -0.14],
  ],
  [
    [-0.13, 0.58],
    [0.86, 1.15],
  ],
  [
    [1.15, 0.3],
    [-0.1, 1.02],
  ],
];
const LIVING_FIELD_SCALES: readonly [number, number] = [0.72, 0.34];
const LIVING_FIELD_OPACITIES: readonly [number, number] = [0.018, 0.026];

function drawTamilLivingField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  episode: ComposedEpisode,
  slideIndex: number,
  tamilFont: string
): void {
  const glyphs = extractTamilGraphemes(episode.tamilText);
  if (glyphs.length === 0) return;
  const rand = createSeededRandom(episode.episodeNumber * 733 + slideIndex * 31 + 17);
  const short = Math.min(width, height);
  const anchors = LIVING_FIELD_ANCHORS[slideIndex % LIVING_FIELD_ANCHORS.length];

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.foreground;
  anchors.forEach(([ax, ay], i) => {
    const glyph = glyphs[(episode.episodeNumber + slideIndex + i * 3) % glyphs.length];
    const size = short * LIVING_FIELD_SCALES[i % LIVING_FIELD_SCALES.length];
    ctx.globalAlpha = LIVING_FIELD_OPACITIES[i % LIVING_FIELD_OPACITIES.length];
    ctx.font = `700 ${Math.round(size)}px ${tamilFont}`;
    const jitterX = rand.range(-short * 0.02, short * 0.02);
    const jitterY = rand.range(-short * 0.02, short * 0.02);
    ctx.fillText(glyph, width * ax + jitterX, height * ay + jitterY);
  });
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Header / footer -- identical structure on every slide (consistency over
// novelty). Only the middle content area varies by slide.
// ---------------------------------------------------------------------------

interface Frame {
  marginX: number;
  marginY: number;
  contentX: number;
  contentW: number;
  contentTop: number;
  contentBottom: number;
  type: ReturnType<typeof typeScale>;
}

/** Single source of truth for the header's own vertical geometry, used by
 *  both computeFrame (to know exactly where the header ends, so content
 *  never overlaps a slide's micro-label) and drawHeader (to actually draw
 *  it) -- computed once, never duplicated/drifted between the two. No
 *  episode number or page indicator anymore -- just the "AATHICHOODI"
 *  eyebrow, a thin accent rule, and the slide's own micro-label. */
function headerMetrics(width: number, height: number, slideIndex: number) {
  const short = Math.min(width, height);
  const marginX = Math.round(width * 0.093);
  const marginY = Math.round(height * 0.075);
  const type = typeScale(short);
  const dividerY = marginY + type.meta * 1.55;
  const hasMicroLabel = Boolean(SLIDE_MICRO_LABELS[slideIndex]);
  const microLabelY = dividerY + type.meta * 2.0;
  const headerBottom = hasMicroLabel ? microLabelY + type.meta * 0.6 : dividerY + type.meta * 0.7;
  return { short, marginX, marginY, type, dividerY, hasMicroLabel, microLabelY, headerBottom };
}

function computeFrame(width: number, height: number, slideIndex: number): Frame {
  // ~90-110px safe margin at 1080px width -- expressed as a fraction so it
  // scales correctly at any selected AssetFormat.
  const { marginX, marginY, headerBottom, type } = headerMetrics(width, height, slideIndex);
  return {
    marginX,
    marginY,
    contentX: marginX,
    contentW: width - marginX * 2,
    contentTop: headerBottom + height * 0.02,
    contentBottom: height - marginY - height * 0.1,
    type,
  };
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  height: number,
  slideIndex: number,
  sansFont: string
): void {
  const { short, type, dividerY } = headerMetrics(width, height, slideIndex);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  try {
    ctx.letterSpacing = `${Math.round(type.meta * 0.14)}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }

  ctx.fillStyle = COLORS.foreground;
  ctx.font = `700 ${Math.round(type.meta)}px ${sansFont}`;
  ctx.fillText("AATHICHOODI", frame.contentX, frame.marginY + type.meta);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Short green accent rule under the eyebrow.
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
      ctx.letterSpacing = `${Math.round(type.meta * 0.12)}px`;
    } catch {
      /* no-op */
    }
    ctx.font = `700 ${Math.round(type.meta)}px ${sansFont}`;
    ctx.fillText(microLabel, frame.contentX, dividerY + type.meta * 2.0);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
}

/** Large circular avatar-style brand badge -- never a small rectangular
 *  mark, never a square container. Clips the real logo image (never
 *  redrawn/approximated) to a circle sized to match the visual presence of
 *  the wordmark/handle beside it. */
function drawCircularBadge(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = Math.max(1, radius * 0.02);
  ctx.stroke();
  ctx.clip();
  const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
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
  if (!opts.brandingWordmark || !BRANDED_SLIDES.includes(opts.slideIndex)) return;
  const short = Math.min(width, height);
  const logoRadius = short * 0.052;
  const rowY = height - frame.marginY - logoRadius;
  const logoX = frame.contentX + logoRadius;

  if (opts.logoImage) {
    drawCircularBadge(ctx, opts.logoImage, logoX, rowY, logoRadius);
  }

  const textX = logoX + logoRadius + short * 0.028;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.foreground;
  ctx.font = `700 ${Math.round(frame.type.body)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX, rowY - frame.type.meta * 0.3);
  if (opts.brandingHandle) {
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `400 ${Math.round(frame.type.meta)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, textX, rowY + frame.type.meta * 1.5);
  }
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
  const { type } = frame;
  let cursorY = frame.contentTop + (frame.contentBottom - frame.contentTop) * 0.08;

  // The Tamil line is the hero -- dramatically the largest element on the
  // slide (golden-ratio scale, ~4x the body tier), sized to fill the
  // available width rather than a fixed guess.
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.primaryDark;
  const hero = fitText(
    ctx,
    episode.tamilText,
    (size) => `700 ${size}px ${tamilSerifFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.46,
    Math.round(type.hero),
    Math.round(type.display)
  );
  for (const line of hero.lines) {
    cursorY += hero.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  cursorY += hero.lineHeight * 0.6;
  ctx.fillStyle = COLORS.foreground;
  const hook = fitText(
    ctx,
    episode.hook,
    (size) => `500 ${size}px ${sansFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.22,
    Math.round(type.heading),
    Math.round(type.body)
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
  ctx.font = `500 ${Math.round(size)}px ${sansFont}`;
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
  const { type } = frame;
  let cursorY = frame.contentTop;

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = `500 ${Math.round(type.body)}px ${tamilSerifFont}`;
  cursorY += type.body;
  ctx.fillText(episode.tamilText, frame.contentX, cursorY);

  cursorY += type.body * 1.5;
  ctx.fillStyle = COLORS.primaryDark;
  ctx.font = `700 ${Math.round(type.body)}px ${sansFont}`;
  ctx.fillText(episode.transliteration, frame.contentX, cursorY);

  cursorY += type.body * 1.6;
  ctx.fillStyle = COLORS.mutedForeground;
  ctx.font = `italic 400 ${Math.round(type.meta * 1.2)}px ${sansFont}`;
  ctx.fillText(episode.simpleMeaning, frame.contentX, cursorY);

  cursorY += type.body * 1.9;
  drawEditorialParagraphs(ctx, frame, cursorY, frame.contentBottom, episode.understanding, sansFont, type.body);
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
    frame.type.body * 1.1
  );
}

function drawSlide3Action(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  episode: ComposedEpisode,
  sansFont: string
): void {
  const { type } = frame;
  const { before, quoted, after } = splitQuotedAction(episode.todayAction);
  let cursorY = frame.contentTop;
  const setupSize = type.body;

  if (before) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.foreground;
    ctx.font = `500 ${Math.round(setupSize)}px ${sansFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    for (const line of lines) {
      cursorY += setupSize * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += setupSize * 0.6;
  }

  // Light green quote panel (the platform's own --color-badge-verified-bg)
  // -- a highlight, per the "green as accent" rule, isolating the single
  // actionable question, which carries the strongest hierarchy on this
  // slide.
  const panelPadX = frame.contentW * 0.06;
  const panelPadY = frame.contentW * 0.05;
  const quoteSize = type.heading;
  ctx.font = `600 ${Math.round(quoteSize)}px ${sansFont}`;
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
  ctx.font = `600 ${Math.round(quoteSize)}px ${sansFont}`;
  let qy = panelY + panelPadY + quoteSize * 0.85;
  for (const line of quoteLines) {
    ctx.fillText(line, frame.contentX + frame.contentW * 0.08, qy);
    qy += quoteLineHeight;
  }

  cursorY = panelY + panelH + setupSize * 0.9;

  if (after) {
    ctx.fillStyle = COLORS.foreground;
    ctx.font = `600 ${Math.round(setupSize)}px ${sansFont}`;
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
  const { type } = frame;
  let cursorY = frame.contentTop + frame.contentW * 0.05;

  // The main statement gets the premium editorial (display serif)
  // treatment and the strongest typography on this slide -- split at an
  // em dash when present so the first clause can read heavier than the
  // rest, matching the approved benchmark's shape.
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
    (frame.contentBottom - frame.contentTop) * 0.34,
    Math.round(type.display),
    Math.round(type.heading),
    1.22
  );
  for (const line of leadFit.lines) {
    cursorY += leadFit.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  if (rest) {
    cursorY += leadFit.lineHeight * 0.25;
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `400 ${Math.round(type.body)}px ${sansFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += type.body * 1.34;
      ctx.fillText(line, frame.contentX, cursorY);
    }
  }

  cursorY += frame.contentW * 0.09;

  if (episode.distantDevotionConnection) {
    ctx.fillStyle = COLORS.mutedForeground;
    ctx.font = `italic 400 ${Math.round(type.meta * 1.3)}px ${sansFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    for (const line of lines) {
      cursorY += type.meta * 1.3 * 1.4;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += frame.contentW * 0.04;
  }

  // CTA line -- no icon; the platform's own primary green alone gives it
  // the pop of an actionable line, per "green as accent/highlight."
  ctx.fillStyle = COLORS.primary;
  ctx.font = `700 ${Math.round(type.body)}px ${sansFont}`;
  const ctaLines = wrapText(ctx, episode.cta.copy, frame.contentW);
  let ctaY = cursorY;
  for (const line of ctaLines) {
    ctaY += type.body * 1.4;
    ctx.fillText(line, frame.contentX, ctaY);
  }
}

export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): void {
  const { width, height, episode, slideIndex, tamilSerifFont, tamilFont, sansFont, displayFont } = opts;
  const frame = computeFrame(width, height, slideIndex);

  drawSurface(ctx, width, height);
  drawTamilLivingField(ctx, width, height, episode, slideIndex, tamilFont);
  drawHeader(ctx, frame, width, height, slideIndex, sansFont);

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
