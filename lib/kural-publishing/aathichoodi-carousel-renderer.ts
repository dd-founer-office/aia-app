/**
 * Daily Aathichoodi Series — Family Carousel Renderer (Visual System v7:
 * DARK EDITORIAL, NO LEAF / NO PHOTOGRAPHY)
 * ----------------------------------------------------------------------------
 * VISUAL-ONLY rewrite, explicit founder direction: the approved 5-slide
 * structure and content-generation logic (lib/kural-publishing/aathichoodi/)
 * are UNCHANGED -- this file only changes how that same content is drawn.
 * Renders one of the five Family Carousel slides (STOP / UNDERSTAND / SEE
 * IT IN FAMILY LIFE / TRY THIS TODAY / CARRY IT FORWARD + AiA) for a
 * ComposedEpisode from aathichoodi/content-engine.ts.
 *
 * Canvas is LOCKED at 1080x1350 (4:5). Every measurement here still scales
 * proportionally off the actual rendered width via px() below (so the same
 * code works at any selected AssetFormat), and the numbers themselves stay
 * the founder's exact locked design-system pixel values for a 1080-wide
 * canvas (see SIZE below) -- this version changes COLOUR and TYPE FAMILY
 * choices, not the size scale or the 5-slide content structure.
 *
 * Design direction (v7, replacing v6's plain light system): the founder
 * supplied a reference mockup -- dark forest-green dominant background,
 * cream/off-white text, a serif voice for all narrative copy (not just
 * Slide 5), a single quiet oversized Tamil letterform per slide, and a
 * translucent highlight panel with a small quote glyph on Slide 4 -- and
 * asked for "the same" MINUS two specific elements: the botanical leaf
 * illustration and the real photograph. Both are gone; everything else
 * from the reference is implemented:
 *   - Background: a dark green gradient (COLORS.background ->
 *     backgroundDeep), no image, no leaf.
 *   - Type family split: DM Sans stays reserved for the eyebrow and
 *     section-heading labels only (uppercase, tracked). Every narrative
 *     line -- hero Tamil, transliteration, meaning gloss, Slide 2/3
 *     paragraphs, Slide 4's setup/question/close, Slide 5's supporting
 *     line -- now uses `serifFont` (the app's general English serif),
 *     matching the reference's serif-forward voice. DM Serif Display
 *     stays reserved for Slide 5's headline only.
 *   - Colour: cream/off-white (COLORS.textPrimary) is the dominant text
 *     colour -- including the Tamil hero, which the reference does NOT
 *     render in green (green-on-dark-green would fail contrast anyway).
 *     Green (COLORS.accent) is reserved for the eyebrow's thin rule, the
 *     section-heading labels, and the CTA line -- exactly the "accent,
 *     never a field" role, just against a dark ground instead of a light
 *     one.
 *   - drawTamilWatermark: one quiet, oversized, edge-cropped Tamil
 *     letterform per slide, sourced from the episode's own text (never
 *     invented), echoing the reference's background letterforms -- with
 *     no leaf and no photograph, this is the only background texture, so
 *     it stays at a low-but-visible opacity (legible on close look,
 *     never competing with the type).
 *   - Slide 4's highlight panel is a translucent light-on-dark card
 *     (glass effect) with a small decorative opening quote mark, matching
 *     the reference -- reinstated after v6 removed it under the
 *     plain-background system, since a dark, more editorial system reads
 *     differently.
 * The brand lockup (circular badge, Slide 5 only) and the removed episode
 * numbering / Tamil signature line are unchanged from v6.
 */

import { createSeededRandom } from "./seeded-random";
import { extractTamilGraphemes } from "./ambient-language-layer";
import type { ComposedEpisode } from "./aathichoodi/content-engine";

// ---------------------------------------------------------------------------
// Design tokens -- dark editorial palette per the approved reference. Green
// is still an accent only (labels, thin rules, CTA) -- never the dominant
// field, which is now dark, not light.
// ---------------------------------------------------------------------------

const COLORS = {
  background: "#15422C",
  backgroundDeep: "#0C2A1B",
  textPrimary: "#F6F1E3",
  textSecondary: "#A9C4B1",
  accent: "#4FAE7C",
  panelFill: "rgba(255, 255, 255, 0.07)",
  panelBorder: "rgba(255, 255, 255, 0.12)",
  badgeRing: "rgba(255, 255, 255, 0.16)",
};

/** The founder's locked type scale, in px at a 1080-wide canvas. px() below
 *  scales these proportionally for any other selected AssetFormat. */
const SIZE = {
  eyebrow: 22,
  sectionHeading: 24,
  heroTamil: 86,
  heroTamilMin: 72,
  transliteration: 25,
  meaning: 22,
  body: 29,
  bodyLineHeight: 1.35,
  hook: 32,
  slide5Hero: 48,
  slide5Support: 25,
  cta: 25,
  brandName: 22,
  handle: 17,
};
const REFERENCE_WIDTH = 1080;

/** Scales one of the founder's locked 1080px-reference sizes to the actual
 *  rendered width -- keeps the design system's exact proportions at any
 *  selected AssetFormat instead of hardcoding 1080. */
function px(basePx: number, width: number): number {
  return (basePx / REFERENCE_WIDTH) * width;
}

export const CAROUSEL_SLIDE_COUNT = 5;

export const SLIDE_LABELS: readonly string[] = [
  "Stop",
  "Understand",
  "Family Situation",
  "Today's Action",
  "AiA · Save · Share",
];

/** Slide-specific section headings shown under the header rule. Fixed per
 *  slide position (not per-episode content) -- part of the design system. */
const SLIDE_MICRO_LABELS: readonly string[] = [
  "",
  "WHAT DOES THIS MEAN?",
  "IT HAPPENS AT HOME",
  "TRY THIS TODAY",
  "",
];

/** Branding appears primarily on the final slide, never repeated on every
 *  slide. */
const BRANDED_SLIDES: readonly number[] = [4];

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
// Text measurement / fitting: measure, don't guess. wrapText never shrinks
// anything itself -- it just breaks lines at the current font size. Only
// the Slide 1 Tamil hero uses fitText's shrink behavior (see its own doc
// comment above and drawSlide0Stop below); everywhere else, the locked
// sizes are fixed and copy is expected to fit them.
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
 *  metrics via ctx.measureText, not a character-count estimate. Used only
 *  for the Slide 1 Tamil hero's narrow 86px-to-72px allowance. */
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
 *  can get its own visual highlight treatment. Falls back to treating the
 *  whole string as the highlighted part when no quotes are present, so the
 *  layout adapts to copy rather than assuming a fixed shape. */
function splitQuotedAction(text: string): { before: string; quoted: string; after: string } {
  const match = text.match(/^([\s\S]*?)"([^"]+)"([\s\S]*)$/);
  if (!match) return { before: "", quoted: text, after: "" };
  return { before: match[1].trim(), quoted: match[2].trim(), after: match[3].trim() };
}

// ---------------------------------------------------------------------------
// Background: a dark green gradient (no image) plus ONE quiet, oversized,
// edge-cropped Tamil letterform per slide -- the only texture in this
// system now that the leaf illustration and photograph are gone. Sourced
// from the episode's own Tamil text, never invented.
// ---------------------------------------------------------------------------

function drawSurface(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, COLORS.background);
  gradient.addColorStop(1, COLORS.backgroundDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

const WATERMARK_ANCHORS: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  [
    [1.12, 0.1],
    [-0.14, 0.94],
  ],
  [
    [-0.15, 0.18],
    [1.13, 0.86],
  ],
  [
    [1.14, 0.66],
    [0.1, -0.12],
  ],
  [
    [-0.12, 0.56],
    [0.88, 1.12],
  ],
  [
    [1.13, 0.28],
    [-0.08, 1.0],
  ],
];
const WATERMARK_SCALES: readonly [number, number] = [0.68, 0.32];
const WATERMARK_OPACITIES: readonly [number, number] = [0.07, 0.09];

function drawTamilWatermark(
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
  const anchors = WATERMARK_ANCHORS[slideIndex % WATERMARK_ANCHORS.length];

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.textPrimary;
  anchors.forEach(([ax, ay], i) => {
    const glyph = glyphs[(episode.episodeNumber + slideIndex + i * 3) % glyphs.length];
    const size = short * WATERMARK_SCALES[i % WATERMARK_SCALES.length];
    ctx.globalAlpha = WATERMARK_OPACITIES[i % WATERMARK_OPACITIES.length];
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
}

/** Single source of truth for the header's own vertical geometry, used by
 *  both computeFrame (to know exactly where the header ends, so content
 *  never overlaps a slide's section heading) and drawHeader (to actually
 *  draw it) -- computed once, never duplicated/drifted between the two. No
 *  episode number or page indicator -- just the "AATHICHOODI" eyebrow, a
 *  thin accent rule, and the slide's own section heading. */
function headerMetrics(width: number, height: number, slideIndex: number) {
  const marginX = Math.round(width * 0.093);
  const marginY = Math.round(height * 0.075);
  const eyebrow = px(SIZE.eyebrow, width);
  const heading = px(SIZE.sectionHeading, width);
  const dividerY = marginY + eyebrow * 1.5;
  const hasMicroLabel = Boolean(SLIDE_MICRO_LABELS[slideIndex]);
  const microLabelY = dividerY + heading * 1.7;
  const headerBottom = hasMicroLabel ? microLabelY + heading * 0.6 : dividerY + heading * 0.6;
  return { marginX, marginY, eyebrow, heading, dividerY, hasMicroLabel, microLabelY, headerBottom };
}

function computeFrame(width: number, height: number, slideIndex: number): Frame {
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
  slideIndex: number,
  sansFont: string
): void {
  const { eyebrow, heading, dividerY } = headerMetrics(width, height, slideIndex);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  try {
    ctx.letterSpacing = `${Math.round(px(3.5, width))}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(eyebrow)}px ${sansFont}`;
  ctx.fillText("AATHICHOODI", frame.contentX, frame.marginY + eyebrow);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Short green accent rule under the eyebrow.
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = Math.max(1.5, width * 0.003);
  ctx.beginPath();
  ctx.moveTo(frame.contentX, dividerY);
  ctx.lineTo(frame.contentX + width * 0.06, dividerY);
  ctx.stroke();

  const microLabel = SLIDE_MICRO_LABELS[slideIndex];
  if (microLabel) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.accent;
    try {
      ctx.letterSpacing = `${Math.round(px(2.5, width))}px`;
    } catch {
      /* no-op */
    }
    ctx.font = `700 ${Math.round(heading)}px ${sansFont}`;
    ctx.fillText(microLabel, frame.contentX, dividerY + heading * 1.7);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
}

/** Large circular avatar-style brand badge -- never a small rectangular
 *  mark, never a square container. Clips the real logo image (never
 *  redrawn/approximated) to a circle; the logo's own light background
 *  reads as a natural white badge against the dark field, matching the
 *  reference. */
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
  ctx.strokeStyle = COLORS.badgeRing;
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
  const brandName = px(SIZE.brandName, width);
  const handle = px(SIZE.handle, width);
  const lineGap = px(6, width);

  // Logo diameter is sized off the actual combined visual height of the
  // wordmark + handle lines beside it, per the founder's rule -- not a
  // fixed constant, so it stays correct if those sizes ever change.
  const textBlockHeight = brandName * 1.3 + lineGap + handle * 1.3;
  const logoRadius = textBlockHeight / 2;
  const rowY = height - frame.marginY - logoRadius;
  const logoX = frame.contentX + logoRadius;

  if (opts.logoImage) {
    drawCircularBadge(ctx, opts.logoImage, logoX, rowY, logoRadius);
  }

  const textX = logoX + logoRadius + width * 0.028;
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(brandName)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX, rowY - textBlockHeight / 2 + brandName);
  if (opts.brandingHandle) {
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `400 ${Math.round(handle)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, textX, rowY + textBlockHeight / 2 - handle * 0.25);
  }
}

// ---------------------------------------------------------------------------
// Slide content
// ---------------------------------------------------------------------------

function drawSlide0Stop(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  serifFont: string
): void {
  let cursorY = frame.contentTop + (frame.contentBottom - frame.contentTop) * 0.08;

  // The Tamil line is the hero -- 86px, dramatically the largest element
  // on the slide, in the dominant cream tone (not green -- green-on-dark-
  // green would fail contrast, and the reference itself reserves green
  // for labels only). May reduce toward 72px (never below) only if a
  // specific episode's line genuinely doesn't fit.
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.textPrimary;
  const hero = fitText(
    ctx,
    episode.tamilText,
    (size) => `700 ${size}px ${tamilSerifFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.46,
    Math.round(px(SIZE.heroTamil, width)),
    Math.round(px(SIZE.heroTamilMin, width))
  );
  for (const line of hero.lines) {
    cursorY += hero.lineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  cursorY += hero.lineHeight * 0.6;
  ctx.fillStyle = COLORS.textPrimary;
  const hookSize = px(SIZE.hook, width);
  ctx.font = `600 ${Math.round(hookSize)}px ${serifFont}`;
  const hookLines = wrapText(ctx, episode.hook, frame.contentW);
  for (const line of hookLines) {
    cursorY += hookSize * 1.3;
    ctx.fillText(line, frame.contentX, cursorY);
  }
}

function drawEditorialParagraphs(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  startY: number,
  maxY: number,
  text: string,
  serifFont: string,
  size: number
): number {
  const paragraphs = splitEditorialParagraphs(text);
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `400 ${Math.round(size)}px ${serifFont}`;
  const lineHeight = size * SIZE.bodyLineHeight;
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
  width: number,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  serifFont: string
): void {
  const transliteration = px(SIZE.transliteration, width);
  const meaning = px(SIZE.meaning, width);
  const body = px(SIZE.body, width);
  let cursorY = frame.contentTop;

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(px(SIZE.transliteration * 1.6, width))}px ${tamilSerifFont}`;
  cursorY += px(SIZE.transliteration * 1.6, width);
  ctx.fillText(episode.tamilText, frame.contentX, cursorY);

  cursorY += transliteration * 1.9;
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(transliteration)}px ${serifFont}`;
  ctx.fillText(episode.transliteration, frame.contentX, cursorY);

  cursorY += transliteration * 1.6;
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = `italic 400 ${Math.round(meaning)}px ${serifFont}`;
  ctx.fillText(episode.simpleMeaning, frame.contentX, cursorY);

  cursorY += meaning * 1.6;
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(frame.contentX, cursorY);
  ctx.lineTo(frame.contentX + width * 0.08, cursorY);
  ctx.stroke();

  cursorY += meaning * 1.4;
  drawEditorialParagraphs(ctx, frame, cursorY, frame.contentBottom, episode.understanding, serifFont, body);
}

function drawSlide2Family(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string
): void {
  drawEditorialParagraphs(
    ctx,
    frame,
    frame.contentTop,
    frame.contentBottom,
    episode.familyAngle,
    serifFont,
    px(SIZE.body, width)
  );
}

function drawSlide3Action(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string
): void {
  const body = px(SIZE.body, width);
  const questionSize = px(SIZE.hook, width);
  const { before, quoted, after } = splitQuotedAction(episode.todayAction);
  let cursorY = frame.contentTop;

  if (before) {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = `400 ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    for (const line of lines) {
      cursorY += body * SIZE.bodyLineHeight;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += body * 0.7;
  }

  // Translucent glass-effect highlight panel with a small decorative
  // opening quote mark, matching the reference -- isolates the single
  // actionable question, which carries the strongest hierarchy here.
  const panelPadX = frame.contentW * 0.07;
  const panelPadY = frame.contentW * 0.055;
  ctx.font = `600 ${Math.round(questionSize)}px ${serifFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2);
  const quoteLineHeight = questionSize * 1.36;
  const panelH = panelPadY * 2 + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;

  ctx.fillStyle = COLORS.panelFill;
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(frame.contentX, panelY, frame.contentW, panelH, frame.contentW * 0.03);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = `700 ${Math.round(frame.contentW * 0.09)}px Georgia, serif`;
  ctx.fillText("“", frame.contentX + panelPadX * 0.55, panelY + panelPadY + questionSize * 0.75);

  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(questionSize)}px ${serifFont}`;
  let qy = panelY + panelPadY + questionSize * 0.85;
  for (const line of quoteLines) {
    ctx.fillText(line, frame.contentX + panelPadX, qy);
    qy += quoteLineHeight;
  }

  cursorY = panelY + panelH + body * 0.9;

  if (after) {
    ctx.fillStyle = COLORS.textPrimary;
    ctx.font = `400 ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, after, frame.contentW);
    for (const line of lines) {
      cursorY += body * SIZE.bodyLineHeight;
      if (cursorY <= frame.contentBottom) ctx.fillText(line, frame.contentX, cursorY);
    }
  }
}

function drawSlide4Carry(
  ctx: CanvasRenderingContext2D,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  displayFont: string
): void {
  const heroSize = px(SIZE.slide5Hero, width);
  const supportSize = px(SIZE.slide5Support, width);
  const ctaSize = px(SIZE.cta, width);
  let cursorY = frame.contentTop + frame.contentW * 0.05;

  // The main statement gets the premium editorial (display serif)
  // treatment at 48px -- the strongest typography on this slide. Split at
  // an em dash when present so the first clause can read heavier than the
  // rest, matching the approved benchmark's shape.
  const emDashSplit = episode.aiaConnection.split(" — ");
  const lead = emDashSplit[0];
  const rest = emDashSplit.slice(1).join(" — ");

  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = `700 ${Math.round(heroSize)}px ${displayFont}`;
  const leadLines = wrapText(ctx, rest ? `${lead} —` : lead, frame.contentW);
  const leadLineHeight = heroSize * 1.22;
  for (const line of leadLines) {
    cursorY += leadLineHeight;
    ctx.fillText(line, frame.contentX, cursorY);
  }

  if (rest) {
    cursorY += leadLineHeight * 0.25;
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `400 ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += supportSize * SIZE.bodyLineHeight;
      ctx.fillText(line, frame.contentX, cursorY);
    }
  }

  cursorY += frame.contentW * 0.07;
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(frame.contentX, cursorY);
  ctx.lineTo(frame.contentX + width * 0.08, cursorY);
  ctx.stroke();
  cursorY += frame.contentW * 0.05;

  if (episode.distantDevotionConnection) {
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = `400 ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    for (const line of lines) {
      cursorY += supportSize * SIZE.bodyLineHeight;
      ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += frame.contentW * 0.04;
  }

  // CTA -- no icon, no decorative graphic; the accent green alone gives it
  // the pop of an actionable line.
  ctx.fillStyle = COLORS.accent;
  ctx.font = `700 ${Math.round(ctaSize)}px ${serifFont}`;
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
  const { width, height, episode, slideIndex, tamilSerifFont, tamilFont, serifFont, sansFont, displayFont } = opts;
  const frame = computeFrame(width, height, slideIndex);

  drawSurface(ctx, width, height);
  drawTamilWatermark(ctx, width, height, episode, slideIndex, tamilFont);
  drawHeader(ctx, frame, width, height, slideIndex, sansFont);

  ctx.textBaseline = "alphabetic";
  switch (slideIndex) {
    case 0:
      drawSlide0Stop(ctx, frame, width, episode, tamilSerifFont, serifFont);
      break;
    case 1:
      drawSlide1Understand(ctx, frame, width, episode, tamilSerifFont, serifFont);
      break;
    case 2:
      drawSlide2Family(ctx, frame, width, episode, serifFont);
      break;
    case 3:
      drawSlide3Action(ctx, frame, width, episode, serifFont);
      break;
    case 4:
    default:
      drawSlide4Carry(ctx, frame, width, episode, serifFont, displayFont);
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
