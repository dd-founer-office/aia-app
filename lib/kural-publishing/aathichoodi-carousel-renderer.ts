/**
 * Daily Aathichoodi Series — Family Carousel Renderer (Visual System v9:
 * LIVE-EDITABLE DESIGN SYSTEM)
 * ----------------------------------------------------------------------------
 * VISUAL-ONLY rewrite, explicit founder direction: the approved 5-slide
 * structure and content-generation logic (lib/kural-publishing/aathichoodi/)
 * are UNCHANGED -- this file only changes how that same content is drawn.
 * Renders one of the five Family Carousel slides (STOP / UNDERSTAND / SEE
 * IT IN FAMILY LIFE / TRY THIS TODAY / CARRY IT FORWARD + AiA) for a
 * ComposedEpisode from aathichoodi/content-engine.ts.
 *
 * Canvas is LOCKED at 1080x1350 (4:5). Every measurement is expressed as a
 * fraction of width/height (or scaled off a 1080px reference via px() for
 * the type sizes) so the same code renders correctly at any selected
 * AssetFormat.
 *
 * v9 turns the whole design system -- colours, every element's type size,
 * layout/spacing knobs, and the generated narrative text itself -- into a
 * live-editable CarouselDesignOverrides object instead of hardcoded module
 * constants, per explicit founder direction ("make the generator's working
 * space editable... all fields, per-slide"). DEFAULT_STYLE below captures
 * exactly the values the founder had approved as of the last locked pass
 * (dark forest-green background, cream text, green accent, the exact px
 * sizes from that round) -- resolveStyle() merges any override on top of
 * those defaults, so an empty/undefined override reproduces today's
 * approved look bit-for-bit. PublishingWorkspace.tsx is where a human
 * actually edits these values live against the preview; this file only
 * needs to accept and apply them.
 *
 * Text overrides (CarouselTextOverrides) work the same way but against the
 * ComposedEpisode's own generated fields (hook, understanding, familyAngle,
 * todayAction, aiaConnection, cta.copy) -- applyTextOverrides produces an
 * "effective episode" fed into the same drawing code, unchanged. The
 * canonical Tamil text, transliteration, and meaning gloss are NOT
 * overridable here -- those come from the verified canon.ts dataset and
 * the standing rule against altering them holds regardless of this UI.
 *
 * Two-pass vertical layout (unchanged from the prior round): each slide's
 * draw function runs once in "measure" mode (draw=false, no fillText/fill/
 * stroke, just font metrics) to get its natural content height, then again
 * to actually draw it at a vertically-balanced startY, per
 * layout.verticalBalanceBias -- how much of the leftover space goes above
 * the content vs below.
 */

import type { ComposedEpisode } from "./aathichoodi/content-engine";

// ---------------------------------------------------------------------------
// Design system -- fully overridable. DEFAULT_STYLE is the founder-approved
// baseline; resolveStyle() merges a partial CarouselStyleOverrides on top of
// it. Nothing below reads the defaults directly -- everything goes through
// the resolved style object passed down from renderAathichoodiCarouselSlide.
// ---------------------------------------------------------------------------

export interface CarouselColors {
  background: string;
  backgroundDeep: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  panelFill: string;
  panelBorder: string;
  badgeRing: string;
}

export interface CarouselLayout {
  /** Fraction of width. */
  marginX: number;
  /** Fraction of height. */
  marginY: number;
  /** How much of a slide's leftover vertical space goes above its content
   *  block vs below (0 = fully top-anchored, 0.5 = dead-centered). */
  verticalBalanceBias: number;
  /** px @ 1080-wide canvas. */
  eyebrowSize: number;
  /** Fraction of the short accent rules' length, relative to width. */
  dividerLength: number;
  bodyLineHeight: number;
}

export interface Slide0Style {
  heroSize: number;
  heroMinSize: number;
  hookSize: number;
}
export interface Slide1Style {
  sectionHeadingText: string;
  sectionHeadingSize: number;
  tamilRefSize: number;
  transliterationSize: number;
  meaningSize: number;
  bodySize: number;
}
export interface Slide2Style {
  sectionHeadingText: string;
  sectionHeadingSize: number;
  bodySize: number;
}
export interface Slide3Style {
  sectionHeadingText: string;
  sectionHeadingSize: number;
  bodySize: number;
  questionSize: number;
  panelPadX: number;
  panelPadY: number;
  panelRadius: number;
  showQuoteMark: boolean;
}
export interface Slide4Style {
  heroSize: number;
  supportSize: number;
  ctaSize: number;
  brandNameSize: number;
  handleSize: number;
  showBranding: boolean;
}

export interface CarouselStyle {
  colors: CarouselColors;
  layout: CarouselLayout;
  slide0: Slide0Style;
  slide1: Slide1Style;
  slide2: Slide2Style;
  slide3: Slide3Style;
  slide4: Slide4Style;
}

export interface CarouselStyleOverrides {
  colors?: Partial<CarouselColors>;
  layout?: Partial<CarouselLayout>;
  slide0?: Partial<Slide0Style>;
  slide1?: Partial<Slide1Style>;
  slide2?: Partial<Slide2Style>;
  slide3?: Partial<Slide3Style>;
  slide4?: Partial<Slide4Style>;
}

/** Generated-text overrides, keyed the same way as the style overrides
 *  above -- applied against the episode's own composed fields, never the
 *  canonical Tamil text/transliteration/meaning gloss. An empty string is
 *  treated as "no override" (falls back to the generated text), so
 *  clearing a field in the editor reverts to the engine's own copy rather
 *  than rendering blank. */
export interface CarouselTextOverrides {
  slide0?: { hook?: string };
  slide1?: { understanding?: string };
  slide2?: { familyAngle?: string };
  slide3?: { todayAction?: string };
  slide4?: { aiaConnection?: string; ctaCopy?: string };
}

export interface CarouselDesignOverrides {
  style?: CarouselStyleOverrides;
  text?: CarouselTextOverrides;
}

/** The founder-approved baseline as of the last locked visual pass -- dark
 *  forest-green background, cream text, green accent, exact px sizes.
 *  resolveStyle(undefined) reproduces this exactly. */
export const DEFAULT_STYLE: CarouselStyle = {
  colors: {
    background: "#15422C",
    backgroundDeep: "#0C2A1B",
    textPrimary: "#F6F1E3",
    textSecondary: "#A9C4B1",
    accent: "#4FAE7C",
    panelFill: "rgba(255, 255, 255, 0.07)",
    panelBorder: "rgba(255, 255, 255, 0.12)",
    badgeRing: "rgba(255, 255, 255, 0.16)",
  },
  layout: {
    marginX: 0.093,
    marginY: 0.075,
    verticalBalanceBias: 0.12,
    eyebrowSize: 22,
    dividerLength: 0.07,
    bodyLineHeight: 1.35,
  },
  slide0: {
    heroSize: 86,
    heroMinSize: 72,
    hookSize: 32,
  },
  slide1: {
    sectionHeadingText: "WHAT DOES THIS MEAN?",
    sectionHeadingSize: 24,
    tamilRefSize: 50,
    transliterationSize: 25,
    meaningSize: 22,
    bodySize: 29,
  },
  slide2: {
    sectionHeadingText: "IT HAPPENS AT HOME",
    sectionHeadingSize: 24,
    bodySize: 32,
  },
  slide3: {
    sectionHeadingText: "TRY THIS TODAY",
    sectionHeadingSize: 24,
    bodySize: 29,
    questionSize: 32,
    panelPadX: 0.075,
    panelPadY: 0.07,
    panelRadius: 0.03,
    showQuoteMark: true,
  },
  slide4: {
    heroSize: 48,
    supportSize: 25,
    ctaSize: 25,
    brandNameSize: 22,
    handleSize: 17,
    showBranding: true,
  },
};

export function resolveStyle(overrides?: CarouselStyleOverrides): CarouselStyle {
  return {
    colors: { ...DEFAULT_STYLE.colors, ...overrides?.colors },
    layout: { ...DEFAULT_STYLE.layout, ...overrides?.layout },
    slide0: { ...DEFAULT_STYLE.slide0, ...overrides?.slide0 },
    slide1: { ...DEFAULT_STYLE.slide1, ...overrides?.slide1 },
    slide2: { ...DEFAULT_STYLE.slide2, ...overrides?.slide2 },
    slide3: { ...DEFAULT_STYLE.slide3, ...overrides?.slide3 },
    slide4: { ...DEFAULT_STYLE.slide4, ...overrides?.slide4 },
  };
}

/** Produces an "effective episode" with any text overrides applied --
 *  everything else (including the canonical Tamil text) passes through
 *  unchanged. Falsy overrides (undefined or empty string) fall back to the
 *  engine's own generated copy. */
function applyTextOverrides(episode: ComposedEpisode, text?: CarouselTextOverrides): ComposedEpisode {
  if (!text) return episode;
  const ctaCopy = text.slide4?.ctaCopy;
  return {
    ...episode,
    hook: text.slide0?.hook || episode.hook,
    understanding: text.slide1?.understanding || episode.understanding,
    familyAngle: text.slide2?.familyAngle || episode.familyAngle,
    todayAction: text.slide3?.todayAction || episode.todayAction,
    aiaConnection: text.slide4?.aiaConnection || episode.aiaConnection,
    cta: ctaCopy ? { ...episode.cta, copy: ctaCopy } : episode.cta,
  };
}

const REFERENCE_WIDTH = 1080;

/** Scales one of the design system's 1080px-reference sizes to the actual
 *  rendered width -- keeps proportions correct at any selected
 *  AssetFormat instead of hardcoding 1080. */
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
  /** Live design/text overrides -- see the module doc comment. Omit for
   *  the founder-approved default look. */
  design?: CarouselDesignOverrides;
}

// ---------------------------------------------------------------------------
// Text measurement / fitting: measure, don't guess. wrapText never shrinks
// anything itself -- it just breaks lines at the current font size. Only
// the Slide 1 Tamil hero uses fitText's shrink behavior (see its own doc
// comment above and drawSlide0Stop below); everywhere else, sizes come
// straight from the resolved style and copy is expected to fit them.
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
 *  for the Slide 1 Tamil hero's narrow shrink allowance. */
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
// Background: a plain dark gradient (colours from the resolved style). No
// watermark letterform, no leaf, no photograph -- per founder direction,
// the field is just colour.
// ---------------------------------------------------------------------------

function drawSurface(ctx: CanvasRenderingContext2D, width: number, height: number, colors: CarouselColors): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.background);
  gradient.addColorStop(1, colors.backgroundDeep);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
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

/** Which section heading (if any) a slide shows, and at what size --
 *  slides 0 and 4 have none. */
function sectionHeadingFor(style: CarouselStyle, slideIndex: number): { text: string; size: number } {
  switch (slideIndex) {
    case 1:
      return { text: style.slide1.sectionHeadingText, size: style.slide1.sectionHeadingSize };
    case 2:
      return { text: style.slide2.sectionHeadingText, size: style.slide2.sectionHeadingSize };
    case 3:
      return { text: style.slide3.sectionHeadingText, size: style.slide3.sectionHeadingSize };
    default:
      return { text: "", size: DEFAULT_STYLE.slide1.sectionHeadingSize };
  }
}

/** Single source of truth for the header's own vertical geometry, used by
 *  both computeFrame (to know exactly where the header ends, so content
 *  never overlaps a slide's section heading) and drawHeader (to actually
 *  draw it) -- computed once, never duplicated/drifted between the two. No
 *  episode number or page indicator -- just the "AATHICHOODI" eyebrow, a
 *  thin accent rule, and the slide's own section heading. */
function headerMetrics(style: CarouselStyle, width: number, height: number, slideIndex: number) {
  const marginX = Math.round(width * style.layout.marginX);
  const marginY = Math.round(height * style.layout.marginY);
  const eyebrow = px(style.layout.eyebrowSize, width);
  const { text: headingText, size: headingSizeBase } = sectionHeadingFor(style, slideIndex);
  const heading = px(headingSizeBase, width);
  const dividerY = marginY + eyebrow * 1.5;
  const hasHeading = Boolean(headingText);
  const headingY = dividerY + heading * 1.7;
  const headerBottom = hasHeading ? headingY + heading * 0.6 : dividerY + heading * 0.6;
  return { marginX, marginY, eyebrow, heading, headingText, dividerY, hasHeading, headingY, headerBottom };
}

function computeFrame(style: CarouselStyle, width: number, height: number, slideIndex: number): Frame {
  const { marginX, marginY, headerBottom } = headerMetrics(style, width, height, slideIndex);
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
  style: CarouselStyle,
  frame: Frame,
  width: number,
  height: number,
  slideIndex: number,
  sansFont: string
): void {
  const { eyebrow, heading, headingText, dividerY } = headerMetrics(style, width, height, slideIndex);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  try {
    ctx.letterSpacing = `${Math.round(px(3.5, width))}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }

  ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `700 ${Math.round(eyebrow)}px ${sansFont}`;
  ctx.fillText("AATHICHOODI", frame.contentX, frame.marginY + eyebrow);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Short green accent rule under the eyebrow.
  ctx.strokeStyle = style.colors.accent;
  ctx.lineWidth = Math.max(1.5, width * 0.003);
  ctx.beginPath();
  ctx.moveTo(frame.contentX, dividerY);
  ctx.lineTo(frame.contentX + width * style.layout.dividerLength, dividerY);
  ctx.stroke();

  if (headingText) {
    ctx.textAlign = "left";
    ctx.fillStyle = style.colors.accent;
    try {
      ctx.letterSpacing = `${Math.round(px(2.5, width))}px`;
    } catch {
      /* no-op */
    }
    ctx.font = `700 ${Math.round(heading)}px ${sansFont}`;
    ctx.fillText(headingText, frame.contentX, dividerY + heading * 1.7);
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
 *  reads as a natural white badge against the dark field. */
function drawCircularBadge(
  ctx: CanvasRenderingContext2D,
  colors: CarouselColors,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.badgeRing;
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
  style: CarouselStyle,
  frame: Frame,
  width: number,
  height: number,
  sansFont: string,
  opts: RenderCarouselSlideOptions
): void {
  if (!opts.brandingWordmark || !style.slide4.showBranding || opts.slideIndex !== 4) return;
  const brandName = px(style.slide4.brandNameSize, width);
  const handle = px(style.slide4.handleSize, width);
  const lineGap = px(6, width);

  // Logo diameter is sized off the actual combined visual height of the
  // wordmark + handle lines beside it, per the founder's rule -- not a
  // fixed constant, so it stays correct if those sizes ever change.
  const textBlockHeight = brandName * 1.3 + lineGap + handle * 1.3;
  const logoRadius = textBlockHeight / 2;
  const rowY = height - frame.marginY - logoRadius;
  const logoX = frame.contentX + logoRadius;

  if (opts.logoImage) {
    drawCircularBadge(ctx, style.colors, opts.logoImage, logoX, rowY, logoRadius);
  }

  const textX = logoX + logoRadius + width * 0.028;
  ctx.textAlign = "left";
  ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `700 ${Math.round(brandName)}px ${sansFont}`;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX, rowY - textBlockHeight / 2 + brandName);
  if (opts.brandingHandle) {
    ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `400 ${Math.round(handle)}px ${sansFont}`;
    ctx.fillText(`@${opts.brandingHandle}`, textX, rowY + textBlockHeight / 2 - handle * 0.25);
  }
}

// ---------------------------------------------------------------------------
// Slide content
// ---------------------------------------------------------------------------

function drawSlide0Stop(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  serifFont: string,
  startY: number,
  draw: boolean
): number {
  let cursorY = startY;

  // The Tamil line is the hero -- dramatically the largest element on the
  // slide, in the dominant cream tone (not green -- green-on-dark-green
  // would fail contrast). May reduce toward heroMinSize (never below) only
  // if a specific episode's line genuinely doesn't fit.
  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  const hero = fitText(
    ctx,
    episode.tamilText,
    (size) => `700 ${size}px ${tamilSerifFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.46,
    Math.round(px(style.slide0.heroSize, width)),
    Math.round(px(style.slide0.heroMinSize, width))
  );
  for (const line of hero.lines) {
    cursorY += hero.lineHeight;
    if (draw) ctx.fillText(line, frame.contentX, cursorY);
  }

  cursorY += hero.lineHeight * 0.6;
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  const hookSize = px(style.slide0.hookSize, width);
  ctx.font = `600 ${Math.round(hookSize)}px ${serifFont}`;
  const hookLines = wrapText(ctx, episode.hook, frame.contentW);
  for (const line of hookLines) {
    cursorY += hookSize * 1.3;
    if (draw) ctx.fillText(line, frame.contentX, cursorY);
  }
  return cursorY;
}

function drawEditorialParagraphs(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  startY: number,
  maxY: number,
  text: string,
  serifFont: string,
  size: number,
  draw: boolean
): number {
  const paragraphs = splitEditorialParagraphs(text);
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `400 ${Math.round(size)}px ${serifFont}`;
  const lineHeight = size * style.layout.bodyLineHeight;
  let cursorY = startY;
  for (const paragraph of paragraphs) {
    const lines = wrapText(ctx, paragraph, frame.contentW);
    for (const line of lines) {
      if (cursorY > maxY) return cursorY;
      cursorY += lineHeight;
      if (draw) ctx.fillText(line, frame.contentX, cursorY);
    }
    // Generous paragraph gap -- distinct visual breaks between grafs
    // rather than a dense block, so the copy occupies its natural share
    // of the frame instead of reading as one cramped paragraph.
    cursorY += lineHeight * 0.85;
  }
  return cursorY;
}

function drawSlide1Understand(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  tamilSerifFont: string,
  serifFont: string,
  startY: number,
  draw: boolean
): number {
  const transliteration = px(style.slide1.transliterationSize, width);
  const meaning = px(style.slide1.meaningSize, width);
  const body = px(style.slide1.bodySize, width);
  const tamilRef = px(style.slide1.tamilRefSize, width);
  let cursorY = startY;

  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `700 ${Math.round(tamilRef)}px ${tamilSerifFont}`;
  cursorY += tamilRef;
  if (draw) ctx.fillText(episode.tamilText, frame.contentX, cursorY);

  cursorY += transliteration * 2.4;
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `700 ${Math.round(transliteration)}px ${serifFont}`;
  if (draw) ctx.fillText(episode.transliteration, frame.contentX, cursorY);

  cursorY += transliteration * 2.0;
  if (draw) ctx.fillStyle = style.colors.textSecondary;
  ctx.font = `italic 400 ${Math.round(meaning)}px ${serifFont}`;
  if (draw) ctx.fillText(episode.simpleMeaning, frame.contentX, cursorY);

  cursorY += meaning * 2.2;
  if (draw) {
    ctx.strokeStyle = style.colors.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(frame.contentX, cursorY);
    ctx.lineTo(frame.contentX + width * style.layout.dividerLength, cursorY);
    ctx.stroke();
  }

  cursorY += meaning * 2.2;
  return drawEditorialParagraphs(
    ctx,
    style,
    frame,
    cursorY,
    frame.contentBottom,
    episode.understanding,
    serifFont,
    body,
    draw
  );
}

function drawSlide2Family(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  startY: number,
  draw: boolean
): number {
  return drawEditorialParagraphs(
    ctx,
    style,
    frame,
    startY,
    frame.contentBottom,
    episode.familyAngle,
    serifFont,
    px(style.slide2.bodySize, width),
    draw
  );
}

function drawSlide3Action(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  startY: number,
  draw: boolean
): number {
  const body = px(style.slide3.bodySize, width);
  const questionSize = px(style.slide3.questionSize, width);
  const { before, quoted, after } = splitQuotedAction(episode.todayAction);
  let cursorY = startY;

  if (before) {
    ctx.textAlign = "left";
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `400 ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    for (const line of lines) {
      cursorY += body * style.layout.bodyLineHeight;
      if (draw) ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += body * 1.2;
  }

  // Translucent glass-effect highlight panel, optionally with a small
  // decorative opening quote mark -- isolates the single actionable
  // question, which carries the strongest hierarchy here.
  const panelPadX = frame.contentW * style.slide3.panelPadX;
  const panelPadY = frame.contentW * style.slide3.panelPadY;
  ctx.font = `600 ${Math.round(questionSize)}px ${serifFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2);
  const quoteLineHeight = questionSize * 1.36;
  const panelH = panelPadY * 2 + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;

  if (draw) {
    ctx.fillStyle = style.colors.panelFill;
    ctx.strokeStyle = style.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(frame.contentX, panelY, frame.contentW, panelH, frame.contentW * style.slide3.panelRadius);
    ctx.fill();
    ctx.stroke();

    if (style.slide3.showQuoteMark) {
      ctx.fillStyle = style.colors.textSecondary;
      ctx.font = `700 ${Math.round(frame.contentW * 0.09)}px Georgia, serif`;
      ctx.fillText("“", frame.contentX + panelPadX * 0.55, panelY + panelPadY + questionSize * 0.75);
    }

    ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `700 ${Math.round(questionSize)}px ${serifFont}`;
    let qy = panelY + panelPadY + questionSize * 0.85;
    for (const line of quoteLines) {
      ctx.fillText(line, frame.contentX + panelPadX, qy);
      qy += quoteLineHeight;
    }
  }

  cursorY = panelY + panelH + body * 1.3;

  if (after) {
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `400 ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, after, frame.contentW);
    for (const line of lines) {
      cursorY += body * style.layout.bodyLineHeight;
      if (draw && cursorY <= frame.contentBottom) ctx.fillText(line, frame.contentX, cursorY);
    }
  }
  return cursorY;
}

function drawSlide4Carry(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  displayFont: string,
  startY: number,
  draw: boolean
): number {
  const supportSize = px(style.slide4.supportSize, width);
  const ctaSize = px(style.slide4.ctaSize, width);
  let cursorY = startY;

  // The main statement gets the premium editorial (display serif)
  // treatment -- the strongest typography on this slide. Split at an em
  // dash when present so the first clause can read heavier than the rest,
  // matching the approved benchmark's shape.
  const heroSize = px(style.slide4.heroSize, width);
  const emDashSplit = episode.aiaConnection.split(" — ");
  const lead = emDashSplit[0];
  const rest = emDashSplit.slice(1).join(" — ");

  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `700 ${Math.round(heroSize)}px ${displayFont}`;
  const leadLines = wrapText(ctx, rest ? `${lead} —` : lead, frame.contentW);
  const leadLineHeight = heroSize * 1.22;
  for (const line of leadLines) {
    cursorY += leadLineHeight;
    if (draw) ctx.fillText(line, frame.contentX, cursorY);
  }

  if (rest) {
    cursorY += leadLineHeight * 0.25;
    if (draw) ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `400 ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += supportSize * style.layout.bodyLineHeight;
      if (draw) ctx.fillText(line, frame.contentX, cursorY);
    }
  }

  cursorY += frame.contentW * 0.11;
  if (draw) {
    ctx.strokeStyle = style.colors.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(frame.contentX, cursorY);
    ctx.lineTo(frame.contentX + width * style.layout.dividerLength, cursorY);
    ctx.stroke();
  }
  cursorY += frame.contentW * 0.09;

  if (episode.distantDevotionConnection) {
    if (draw) ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `400 ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    for (const line of lines) {
      cursorY += supportSize * style.layout.bodyLineHeight;
      if (draw) ctx.fillText(line, frame.contentX, cursorY);
    }
    cursorY += frame.contentW * 0.06;
  }

  // CTA -- no icon, no decorative graphic. Muted, not bright accent green
  // -- the headline already carries the slide's emphasis.
  if (draw) ctx.fillStyle = style.colors.textSecondary;
  ctx.font = `700 ${Math.round(ctaSize)}px ${serifFont}`;
  const ctaLines = wrapText(ctx, episode.cta.copy, frame.contentW);
  let ctaY = cursorY;
  for (const line of ctaLines) {
    ctaY += ctaSize * 1.4;
    if (draw) ctx.fillText(line, frame.contentX, ctaY);
  }
  return ctaY;
}

/** Runs one slide's own layout in either "measure" (draw=false, no fillText/
 *  fill/stroke calls -- just font metrics via wrapText/measureText) or
 *  "draw" mode, starting from startY. Returns the final cursorY either way,
 *  which is what makes the vertical-balancing pass in
 *  renderAathichoodiCarouselSlide below possible: run once to measure the
 *  content's natural height, then again, shifted down, to actually draw
 *  it -- so short copy doesn't just pile up under the header with a dead
 *  zone below it. */
function layoutSlide(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  slideIndex: number,
  tamilSerifFont: string,
  serifFont: string,
  displayFont: string,
  startY: number,
  draw: boolean
): number {
  switch (slideIndex) {
    case 0:
      return drawSlide0Stop(ctx, style, frame, width, episode, tamilSerifFont, serifFont, startY, draw);
    case 1:
      return drawSlide1Understand(ctx, style, frame, width, episode, tamilSerifFont, serifFont, startY, draw);
    case 2:
      return drawSlide2Family(ctx, style, frame, width, episode, serifFont, startY, draw);
    case 3:
      return drawSlide3Action(ctx, style, frame, width, episode, serifFont, startY, draw);
    case 4:
    default:
      return drawSlide4Carry(ctx, style, frame, width, episode, serifFont, displayFont, startY, draw);
  }
}

export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): void {
  const { width, height, slideIndex, tamilSerifFont, serifFont, sansFont, displayFont } = opts;
  const style = resolveStyle(opts.design?.style);
  const episode = applyTextOverrides(opts.episode, opts.design?.text);
  const frame = computeFrame(style, width, height, slideIndex);

  drawSurface(ctx, width, height, style.colors);
  drawHeader(ctx, style, frame, width, height, slideIndex, sansFont);

  ctx.textBaseline = "alphabetic";

  const measuredEndY = layoutSlide(
    ctx,
    style,
    frame,
    width,
    episode,
    slideIndex,
    tamilSerifFont,
    serifFont,
    displayFont,
    frame.contentTop,
    false
  );
  const contentHeight = measuredEndY - frame.contentTop;
  const available = frame.contentBottom - frame.contentTop;
  const slack = Math.max(0, available - contentHeight);
  const balancedStartY = frame.contentTop + slack * style.layout.verticalBalanceBias;

  layoutSlide(
    ctx,
    style,
    frame,
    width,
    episode,
    slideIndex,
    tamilSerifFont,
    serifFont,
    displayFont,
    balancedStartY,
    true
  );

  drawFooterLockup(ctx, style, frame, width, height, sansFont, opts);
}

export async function renderAathichoodiCarouselSlideForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilSerifFont: string; tamilFont: string; serifFont: string; sansFont: string; displayFont: string },
  brandingWordmark?: string,
  brandingHandle?: string,
  design?: CarouselDesignOverrides
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
    design,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
