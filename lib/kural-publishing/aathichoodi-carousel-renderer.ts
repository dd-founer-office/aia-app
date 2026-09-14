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
  /** Recurring closing tagline shown under the hook, muted -- fixed
   *  design-system copy (like the section headings), not per-episode
   *  generated content. "\n" forces the two-line break shown in the
   *  reference rather than word-wrapping. */
  tagline: string;
  taglineSize: number;
  showBranding: boolean;
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
  /** One override slot per generated paragraph, by index -- each paragraph
   *  is its own separately draggable/editable text box (see
   *  drawSlide2Family), so overrides are per-paragraph rather than one
   *  whole-block string. */
  slide2?: { paragraphs?: string[] };
  /** todayAction's generated copy splits into a lead-in, the highlighted
   *  question, and a trailing line (see splitQuotedAction) -- each is its
   *  own separately draggable/editable text box (see drawSlide3Action). */
  slide3?: { before?: string; question?: string; after?: string };
  slide4?: { aiaConnection?: string; ctaCopy?: string; distantDevotionConnection?: string };
}

/** A drag nudge applied on top of an element's own computed flow position --
 *  keyed by the same hotspot id used for click-to-edit (see CarouselHotspot
 *  below). Purely a rendering-time offset: it never feeds back into the
 *  vertical-flow layout, so dragging one element never reflows any other --
 *  each element's own natural position is still computed exactly as before,
 *  then nudged by (dx, dy) at the moment it's actually drawn. */
export interface CarouselPositionOverride {
  dx: number;
  dy: number;
}
export type CarouselPositions = Record<string, CarouselPositionOverride>;

/** Bold/italic toggle for one element, keyed by the same hotspot id as
 *  CarouselPositions -- undefined means "use this element's own default
 *  weight/style" (most elements are already deliberately bold or italic by
 *  design; this only overrides that choice when the founder explicitly
 *  sets it). */
export interface CarouselTextEmphasis {
  bold?: boolean;
  italic?: boolean;
}
export type CarouselTextEmphases = Record<string, CarouselTextEmphasis>;

export interface CarouselDesignOverrides {
  style?: CarouselStyleOverrides;
  text?: CarouselTextOverrides;
  positions?: CarouselPositions;
  emphases?: CarouselTextEmphases;
}

/** A clickable region on the rendered canvas, in canvas-pixel space, for
 *  the workspace's click-to-edit overlay. `id` identifies which style/text
 *  field(s) it maps to (see PublishingWorkspace.tsx's hotspot-config
 *  lookup) -- this file only computes WHERE things are, never what UI to
 *  show for them. Collected only during the real ("draw") pass of the
 *  two-pass layout, using the exact same coordinates that got drawn, so
 *  the click target always matches what's actually on screen. */
export interface CarouselHotspot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const ZERO_OFFSET: CarouselPositionOverride = { dx: 0, dy: 0 };
const NO_EMPHASIS: CarouselTextEmphasis = {};

/** Looks up an element's drag nudge by hotspot id -- (0, 0) if it has never
 *  been dragged. */
function posFor(positions: CarouselPositions | undefined, id: string): CarouselPositionOverride {
  return positions?.[id] ?? ZERO_OFFSET;
}

function emphasisFor(emphases: CarouselTextEmphases | undefined, id: string): CarouselTextEmphasis {
  return emphases?.[id] ?? NO_EMPHASIS;
}

/** Resolves a CSS font weight, honoring an explicit bold override when
 *  present (forcing 700/400) and falling back to the element's own default
 *  numeric weight (already deliberately set by design, e.g. 600 for the
 *  Slide 1 hook) otherwise. */
function weightFor(defaultWeight: number, emphasis: CarouselTextEmphasis): number {
  if (emphasis.bold === true) return 700;
  if (emphasis.bold === false) return 400;
  return defaultWeight;
}

/** Resolves the CSS font-style keyword, honoring an explicit italic
 *  override when present and falling back to the element's own default
 *  (e.g. the meaning gloss is italic by design) otherwise. */
function styleFor(defaultItalic: boolean, emphasis: CarouselTextEmphasis): string {
  return (emphasis.italic ?? defaultItalic) ? "italic" : "normal";
}

/** Appends a hotspot spanning from the first to the last drawn line's
 *  baseline (a generous, forgiving click target, not pixel-exact) --
 *  padded above/below using the line's own font size as a proxy for
 *  ascent/descent/leading. No-ops if hotspots collection wasn't
 *  requested, or if no lines were actually drawn (firstBaseline stays 0,
 *  the sentinel for "nothing drawn"). The hotspot's own position already
 *  includes its drag offset (dx, dy passed in as `offset`) so the overlay
 *  button tracks the element wherever it's been dragged to. */
function pushHotspot(
  hotspots: CarouselHotspot[] | undefined,
  id: string,
  x: number,
  width: number,
  firstBaseline: number,
  lastBaseline: number,
  size: number,
  offset: CarouselPositionOverride = ZERO_OFFSET
): void {
  if (!hotspots || firstBaseline === 0) return;
  hotspots.push({
    id,
    x: x + offset.dx,
    y: firstBaseline - size * 0.9 + offset.dy,
    width,
    height: lastBaseline - firstBaseline + size * 1.2,
  });
}

/** Draws one of the thin muted divider rules used between sections
 *  throughout the carousel, and registers it as its own draggable hotspot
 *  (a bare line has ~0 height, so the hotspot gets generous fixed padding
 *  rather than the font-size-based padding pushHotspot uses for text). */
function drawDivider(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  y: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  id: string,
  hotspots?: CarouselHotspot[]
): void {
  const { dx, dy } = posFor(positions, id);
  const lineLength = width * style.layout.dividerLength;
  if (draw) {
    ctx.strokeStyle = style.colors.panelBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(frame.contentX + dx, y + dy);
    ctx.lineTo(frame.contentX + dx + lineLength, y + dy);
    ctx.stroke();
    if (hotspots) {
      const pad = Math.max(14, width * 0.015);
      hotspots.push({ id, x: frame.contentX + dx, y: y + dy - pad, width: Math.max(lineLength, width * 0.12), height: pad * 2 });
    }
  }
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
    tagline: "Small values today.\nA kinder tomorrow.",
    taglineSize: 25,
    showBranding: true,
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
  // familyAngle and todayAction are NOT patched here -- their per-paragraph
  // / per-segment overrides (slide2.paragraphs, slide3.before/question/
  // after) are applied directly in drawSlide2Family/drawSlide3Action
  // instead, since they no longer fit a single whole-string replacement.
  return {
    ...episode,
    hook: text.slide0?.hook || episode.hook,
    understanding: text.slide1?.understanding || episode.understanding,
    aiaConnection: text.slide4?.aiaConnection || episode.aiaConnection,
    distantDevotionConnection: text.slide4?.distantDevotionConnection || episode.distantDevotionConnection,
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

/** Word-wraps one paragraph (no literal newlines) at maxWidth. */
function wrapParagraph(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

/** Word-wraps text at maxWidth, honoring literal "\n" characters as forced
 *  line breaks first -- so a manual Enter typed in the in-canvas text
 *  editor actually produces a second line on the canvas, not just in the
 *  edit box. A run of "\n\n" (an intentionally blank line) is preserved as
 *  an empty line rather than collapsed away. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  if (!text.includes("\n")) return wrapParagraph(ctx, text, maxWidth);
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const paragraphLines = wrapParagraph(ctx, paragraph, maxWidth);
    lines.push(...(paragraphLines.length ? paragraphLines : [""]));
  }
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
export function splitEditorialParagraphs(text: string): string[] {
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
export function splitQuotedAction(text: string): { before: string; quoted: string; after: string } {
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
  sansFont: string,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): void {
  const { eyebrow, heading, headingText, dividerY } = headerMetrics(style, width, height, slideIndex);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  try {
    ctx.letterSpacing = `${Math.round(px(3.5, width))}px`;
  } catch {
    /* Canvas2D letterSpacing unsupported -- default tracking is fine */
  }

  const eyebrowOffset = posFor(positions, "header.eyebrow");
  const eyebrowEmphasis = emphasisFor(emphases, "header.eyebrow");
  ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, eyebrowEmphasis)} ${weightFor(700, eyebrowEmphasis)} ${Math.round(eyebrow)}px ${sansFont}`;
  const eyebrowY = frame.marginY + eyebrow;
  ctx.fillText("AATHICHOODI", frame.contentX + eyebrowOffset.dx, eyebrowY + eyebrowOffset.dy);
  pushHotspot(hotspots, "header.eyebrow", frame.contentX, frame.contentW, eyebrowY, eyebrowY, eyebrow, eyebrowOffset);

  try {
    ctx.letterSpacing = "0px";
  } catch {
    /* no-op */
  }

  // Short green accent rule under the eyebrow -- drawn via drawDivider so
  // it's its own draggable element too, but in the accent color rather
  // than the muted divider color the helper defaults to.
  const dividerOffset = posFor(positions, "header.divider");
  ctx.strokeStyle = style.colors.accent;
  ctx.lineWidth = Math.max(1.5, width * 0.003);
  ctx.beginPath();
  ctx.moveTo(frame.contentX + dividerOffset.dx, dividerY + dividerOffset.dy);
  ctx.lineTo(frame.contentX + dividerOffset.dx + width * style.layout.dividerLength, dividerY + dividerOffset.dy);
  ctx.stroke();
  if (hotspots) {
    const pad = Math.max(14, width * 0.015);
    hotspots.push({
      id: "header.divider",
      x: frame.contentX + dividerOffset.dx,
      y: dividerY + dividerOffset.dy - pad,
      width: Math.max(width * style.layout.dividerLength, width * 0.12),
      height: pad * 2,
    });
  }

  if (headingText) {
    const headingOffset = posFor(positions, `slide${slideIndex}.sectionHeading`);
    const headingEmphasis = emphasisFor(emphases, `slide${slideIndex}.sectionHeading`);
    ctx.textAlign = "left";
    ctx.fillStyle = style.colors.accent;
    try {
      ctx.letterSpacing = `${Math.round(px(2.5, width))}px`;
    } catch {
      /* no-op */
    }
    ctx.font = `${styleFor(false, headingEmphasis)} ${weightFor(700, headingEmphasis)} ${Math.round(heading)}px ${sansFont}`;
    const headingLineY = dividerY + heading * 1.7;
    ctx.fillText(headingText, frame.contentX + headingOffset.dx, headingLineY + headingOffset.dy);
    pushHotspot(
      hotspots,
      `slide${slideIndex}.sectionHeading`,
      frame.contentX,
      frame.contentW,
      headingLineY,
      headingLineY,
      heading,
      headingOffset
    );
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
  opts: RenderCarouselSlideOptions,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): void {
  const isBrandedSlide =
    (opts.slideIndex === 0 && style.slide0.showBranding) || (opts.slideIndex === 4 && style.slide4.showBranding);
  if (!opts.brandingWordmark || !isBrandedSlide) return;
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
    const logoOffset = posFor(positions, "footer.logo");
    drawCircularBadge(ctx, style.colors, opts.logoImage, logoX + logoOffset.dx, rowY + logoOffset.dy, logoRadius);
    if (hotspots) {
      hotspots.push({
        id: "footer.logo",
        x: logoX + logoOffset.dx - logoRadius,
        y: rowY + logoOffset.dy - logoRadius,
        width: logoRadius * 2,
        height: logoRadius * 2,
      });
    }
  }

  const textX = logoX + logoRadius + width * 0.028;
  const textEndX = frame.contentX + frame.contentW;
  const brandNameOffset = posFor(positions, "footer.brandName");
  const brandNameEmphasis = emphasisFor(emphases, "footer.brandName");
  ctx.textAlign = "left";
  ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, brandNameEmphasis)} ${weightFor(700, brandNameEmphasis)} ${Math.round(brandName)}px ${sansFont}`;
  const brandNameY = rowY - textBlockHeight / 2 + brandName;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX + brandNameOffset.dx, brandNameY + brandNameOffset.dy);
  pushHotspot(hotspots, "footer.brandName", textX, textEndX - textX, brandNameY, brandNameY, brandName, brandNameOffset);
  if (opts.brandingHandle) {
    const handleOffset = posFor(positions, "footer.handle");
    const handleEmphasis = emphasisFor(emphases, "footer.handle");
    ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `${styleFor(false, handleEmphasis)} ${weightFor(400, handleEmphasis)} ${Math.round(handle)}px ${sansFont}`;
    const handleY = rowY + textBlockHeight / 2 - handle * 0.25;
    ctx.fillText(`@${opts.brandingHandle}`, textX + handleOffset.dx, handleY + handleOffset.dy);
    pushHotspot(hotspots, "footer.handle", textX, textEndX - textX, handleY, handleY, handle, handleOffset);
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
  tamilFont: string,
  serifFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): number {
  let cursorY = startY;
  const heroEmphasis = emphasisFor(emphases, "slide0.hero");
  const hookEmphasis = emphasisFor(emphases, "slide0.hook");
  const taglineEmphasis = emphasisFor(emphases, "slide0.tagline");

  // The Tamil line is the hero -- dramatically the largest element on the
  // slide, in the dominant cream tone (not green -- green-on-dark-green
  // would fail contrast). May reduce toward heroMinSize (never below) only
  // if a specific episode's line genuinely doesn't fit. Uses the same Noto
  // Sans Tamil family as the Kural Koorum Aram cover (tamilFont), not the
  // serif Tamil face, for typographic consistency across the app.
  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  const hero = fitText(
    ctx,
    episode.tamilText,
    (size) => `${styleFor(false, heroEmphasis)} ${weightFor(700, heroEmphasis)} ${size}px ${tamilFont}`,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.46,
    Math.round(px(style.slide0.heroSize, width)),
    Math.round(px(style.slide0.heroMinSize, width))
  );
  const heroOffset = posFor(positions, "slide0.hero");
  let heroFirst = 0;
  for (const line of hero.lines) {
    cursorY += hero.lineHeight;
    if (heroFirst === 0) heroFirst = cursorY;
    if (draw) ctx.fillText(line, frame.contentX + heroOffset.dx, cursorY + heroOffset.dy);
  }
  pushHotspot(hotspots, "slide0.hero", frame.contentX, frame.contentW, heroFirst, cursorY, hero.size, heroOffset);

  // Thin divider between the Aathichoodi and the hook question, matching
  // the reference -- same muted-line treatment used between sections on
  // Slides 2 and 5.
  cursorY += hero.lineHeight * 0.35;
  drawDivider(ctx, style, frame, width, cursorY, draw, positions, "slide0.divider", hotspots);
  cursorY += hero.lineHeight * 0.35;

  if (draw) ctx.fillStyle = style.colors.textPrimary;
  const hookSize = px(style.slide0.hookSize, width);
  ctx.font = `${styleFor(false, hookEmphasis)} ${weightFor(600, hookEmphasis)} ${Math.round(hookSize)}px ${serifFont}`;
  const hookLines = wrapText(ctx, episode.hook, frame.contentW);
  const hookOffset = posFor(positions, "slide0.hook");
  let hookFirst = 0;
  for (const line of hookLines) {
    cursorY += hookSize * 1.3;
    if (hookFirst === 0) hookFirst = cursorY;
    if (draw) ctx.fillText(line, frame.contentX + hookOffset.dx, cursorY + hookOffset.dy);
  }
  pushHotspot(hotspots, "slide0.hook", frame.contentX, frame.contentW, hookFirst, cursorY, hookSize, hookOffset);

  // Recurring closing tagline -- fixed design-system copy (like the
  // section headings), muted, two explicit lines.
  cursorY += hookSize * 0.9;
  if (draw) ctx.fillStyle = style.colors.textSecondary;
  const taglineSize = px(style.slide0.taglineSize, width);
  ctx.font = `${styleFor(false, taglineEmphasis)} ${weightFor(400, taglineEmphasis)} ${Math.round(taglineSize)}px ${serifFont}`;
  const taglineLines = style.slide0.tagline.split("\n").filter(Boolean);
  const taglineOffset = posFor(positions, "slide0.tagline");
  let taglineFirst = 0;
  for (const line of taglineLines) {
    cursorY += taglineSize * 1.3;
    if (taglineFirst === 0) taglineFirst = cursorY;
    if (draw) ctx.fillText(line, frame.contentX + taglineOffset.dx, cursorY + taglineOffset.dy);
  }
  pushHotspot(hotspots, "slide0.tagline", frame.contentX, frame.contentW, taglineFirst, cursorY, taglineSize, taglineOffset);

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
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[],
  hotspotId?: string
): number {
  const paragraphs = splitEditorialParagraphs(text);
  const emphasis = emphasisFor(emphases, hotspotId ?? "");
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${serifFont}`;
  const lineHeight = size * style.layout.bodyLineHeight;
  const offset = posFor(positions, hotspotId ?? "");
  let cursorY = startY;
  let firstBaseline = 0;
  for (const paragraph of paragraphs) {
    const lines = wrapText(ctx, paragraph, frame.contentW);
    for (const line of lines) {
      if (cursorY > maxY) {
        pushHotspot(hotspots, hotspotId ?? "", frame.contentX, frame.contentW, firstBaseline, cursorY, size, offset);
        return cursorY;
      }
      cursorY += lineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    // Generous paragraph gap -- distinct visual breaks between grafs
    // rather than a dense block, so the copy occupies its natural share
    // of the frame instead of reading as one cramped paragraph.
    cursorY += lineHeight * 0.85;
  }
  pushHotspot(hotspots, hotspotId ?? "", frame.contentX, frame.contentW, firstBaseline, cursorY - lineHeight * 0.85, size, offset);
  return cursorY;
}

function drawSlide1Understand(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  tamilFont: string,
  serifFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const transliteration = px(style.slide1.transliterationSize, width);
  const meaning = px(style.slide1.meaningSize, width);
  const body = px(style.slide1.bodySize, width);
  const tamilRef = px(style.slide1.tamilRefSize, width);
  let cursorY = startY;

  // Same Noto Sans Tamil family as the Kural Koorum Aram cover, not the
  // serif Tamil face -- consistency across the app's Tamil rendering.
  const tamilRefEmphasis = emphasisFor(emphases, "slide1.tamilRef");
  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, tamilRefEmphasis)} ${weightFor(700, tamilRefEmphasis)} ${Math.round(tamilRef)}px ${tamilFont}`;
  cursorY += tamilRef;
  const tamilRefOffset = posFor(positions, "slide1.tamilRef");
  if (draw) ctx.fillText(episode.tamilText, frame.contentX + tamilRefOffset.dx, cursorY + tamilRefOffset.dy);
  pushHotspot(hotspots, "slide1.tamilRef", frame.contentX, frame.contentW, cursorY, cursorY, tamilRef, tamilRefOffset);

  cursorY += transliteration * 2.4;
  const transliterationEmphasis = emphasisFor(emphases, "slide1.transliteration");
  if (draw) ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, transliterationEmphasis)} ${weightFor(700, transliterationEmphasis)} ${Math.round(transliteration)}px ${serifFont}`;
  const transliterationOffset = posFor(positions, "slide1.transliteration");
  if (draw) ctx.fillText(episode.transliteration, frame.contentX + transliterationOffset.dx, cursorY + transliterationOffset.dy);
  pushHotspot(
    hotspots,
    "slide1.transliteration",
    frame.contentX,
    frame.contentW,
    cursorY,
    cursorY,
    transliteration,
    transliterationOffset
  );

  cursorY += transliteration * 2.0;
  const meaningEmphasis = emphasisFor(emphases, "slide1.meaning");
  if (draw) ctx.fillStyle = style.colors.textSecondary;
  ctx.font = `${styleFor(true, meaningEmphasis)} ${weightFor(400, meaningEmphasis)} ${Math.round(meaning)}px ${serifFont}`;
  const meaningOffset = posFor(positions, "slide1.meaning");
  if (draw) ctx.fillText(episode.simpleMeaning, frame.contentX + meaningOffset.dx, cursorY + meaningOffset.dy);
  pushHotspot(hotspots, "slide1.meaning", frame.contentX, frame.contentW, cursorY, cursorY, meaning, meaningOffset);

  cursorY += meaning * 2.2;
  drawDivider(ctx, style, frame, width, cursorY, draw, positions, "slide1.divider", hotspots);

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
    draw,
    positions,
    emphases,
    hotspots,
    "slide1.body"
  );
}

/** "Family Situation" -- each generated paragraph is its own independently
 *  draggable/editable text box (id `slide2.body.N`), not one combined
 *  block, per explicit founder direction. An override at index N replaces
 *  just that paragraph's text (falling back to the generated paragraph
 *  when empty); the paragraph COUNT always follows the generated content --
 *  overrides can only reword an existing paragraph, not add/remove one. */
function drawSlide2Family(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrideParagraphs: string[] | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const generatedParagraphs = splitEditorialParagraphs(episode.familyAngle);
  const size = px(style.slide2.bodySize, width);
  const lineHeight = size * style.layout.bodyLineHeight;
  let cursorY = startY;

  for (let i = 0; i < generatedParagraphs.length; i++) {
    if (cursorY > frame.contentBottom) break;
    const id = `slide2.body.${i}`;
    const text = overrideParagraphs?.[i] || generatedParagraphs[i];
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${serifFont}`;
    const lines = wrapText(ctx, text, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += lineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, frame.contentW, firstBaseline, cursorY, size, offset);
    // Generous paragraph gap -- distinct visual breaks between grafs
    // rather than a dense block, so the copy occupies its natural share
    // of the frame instead of reading as one cramped paragraph.
    cursorY += lineHeight * 0.85;
  }
  return cursorY;
}

/** "Today's Action" -- the lead-in line, the highlighted question, and the
 *  trailing line are three separately draggable/editable components (ids
 *  slide3.before / slide3.question / slide3.after), not one combined
 *  block, per explicit founder direction. Each falls back independently to
 *  its own slice of the generated todayAction text (see splitQuotedAction)
 *  when not overridden. */
function drawSlide3Action(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  serifFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrides: { before?: string; question?: string; after?: string } | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const body = px(style.slide3.bodySize, width);
  const questionSize = px(style.slide3.questionSize, width);
  const generated = splitQuotedAction(episode.todayAction);
  const before = overrides?.before || generated.before;
  const quoted = overrides?.question || generated.quoted;
  const after = overrides?.after || generated.after;
  let cursorY = startY;

  if (before) {
    const id = "slide3.before";
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    ctx.textAlign = "left";
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += body * style.layout.bodyLineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, frame.contentW, firstBaseline, cursorY, body, offset);
    cursorY += body * 1.2;
  }

  // Translucent glass-effect highlight panel, optionally with a small
  // decorative opening quote mark -- isolates the single actionable
  // question, which carries the strongest hierarchy here.
  const questionId = "slide3.question";
  const qOffset = posFor(positions, questionId);
  const qEmphasis = emphasisFor(emphases, questionId);
  const qStyle = styleFor(false, qEmphasis);
  const qWeight = weightFor(700, qEmphasis);
  const panelPadX = frame.contentW * style.slide3.panelPadX;
  const panelPadY = frame.contentW * style.slide3.panelPadY;
  ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${serifFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2);
  const quoteLineHeight = questionSize * 1.36;
  const panelH = panelPadY * 2 + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;
  const qx = frame.contentX + qOffset.dx;

  if (draw) {
    ctx.fillStyle = style.colors.panelFill;
    ctx.strokeStyle = style.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(qx, panelY + qOffset.dy, frame.contentW, panelH, frame.contentW * style.slide3.panelRadius);
    ctx.fill();
    ctx.stroke();

    if (style.slide3.showQuoteMark) {
      ctx.fillStyle = style.colors.textSecondary;
      ctx.font = `700 ${Math.round(frame.contentW * 0.09)}px Georgia, serif`;
      ctx.fillText("“", qx + panelPadX * 0.55, panelY + qOffset.dy + panelPadY + questionSize * 0.75);
    }

    ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${serifFont}`;
    let qy = panelY + qOffset.dy + panelPadY + questionSize * 0.85;
    for (const line of quoteLines) {
      ctx.fillText(line, qx + panelPadX, qy);
      qy += quoteLineHeight;
    }
  }
  if (hotspots) {
    hotspots.push({ id: questionId, x: qx, y: panelY + qOffset.dy, width: frame.contentW, height: panelH });
  }

  cursorY = panelY + panelH + body * 1.3;

  if (after) {
    const id = "slide3.after";
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(body)}px ${serifFont}`;
    const lines = wrapText(ctx, after, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += body * style.layout.bodyLineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw && cursorY <= frame.contentBottom) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, frame.contentW, firstBaseline, cursorY, body, offset);
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
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const supportSize = px(style.slide4.supportSize, width);
  const ctaSize = px(style.slide4.ctaSize, width);
  let cursorY = startY;
  const headlineStartY = cursorY;
  const headlineEmphasis = emphasisFor(emphases, "slide4.headline");

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
  ctx.font = `${styleFor(false, headlineEmphasis)} ${weightFor(700, headlineEmphasis)} ${Math.round(heroSize)}px ${displayFont}`;
  const leadLines = wrapText(ctx, rest ? `${lead} —` : lead, frame.contentW);
  const leadLineHeight = heroSize * 1.22;
  const headlineOffset = posFor(positions, "slide4.headline");
  for (const line of leadLines) {
    cursorY += leadLineHeight;
    if (draw) ctx.fillText(line, frame.contentX + headlineOffset.dx, cursorY + headlineOffset.dy);
  }

  if (rest) {
    cursorY += leadLineHeight * 0.25;
    if (draw) ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `${styleFor(false, headlineEmphasis)} ${weightFor(400, headlineEmphasis)} ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    for (const line of lines) {
      cursorY += supportSize * style.layout.bodyLineHeight;
      if (draw) ctx.fillText(line, frame.contentX + headlineOffset.dx, cursorY + headlineOffset.dy);
    }
  }
  pushHotspot(
    hotspots,
    "slide4.headline",
    frame.contentX,
    frame.contentW,
    headlineStartY + heroSize,
    cursorY,
    heroSize,
    headlineOffset
  );

  cursorY += frame.contentW * 0.11;
  drawDivider(ctx, style, frame, width, cursorY, draw, positions, "slide4.divider", hotspots);
  cursorY += frame.contentW * 0.09;

  if (episode.distantDevotionConnection) {
    const connectionEmphasis = emphasisFor(emphases, "slide4.connection");
    if (draw) ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `${styleFor(false, connectionEmphasis)} ${weightFor(400, connectionEmphasis)} ${Math.round(supportSize)}px ${serifFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    const connectionOffset = posFor(positions, "slide4.connection");
    let connectionFirst = 0;
    for (const line of lines) {
      cursorY += supportSize * style.layout.bodyLineHeight;
      if (connectionFirst === 0) connectionFirst = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + connectionOffset.dx, cursorY + connectionOffset.dy);
    }
    pushHotspot(
      hotspots,
      "slide4.connection",
      frame.contentX,
      frame.contentW,
      connectionFirst,
      cursorY,
      supportSize,
      connectionOffset
    );
    cursorY += frame.contentW * 0.06;
  }

  // CTA -- no icon, no decorative graphic. Muted, not bright accent green
  // -- the headline already carries the slide's emphasis.
  const ctaEmphasis = emphasisFor(emphases, "slide4.cta");
  if (draw) ctx.fillStyle = style.colors.textSecondary;
  ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(700, ctaEmphasis)} ${Math.round(ctaSize)}px ${serifFont}`;
  const ctaLines = wrapText(ctx, episode.cta.copy, frame.contentW);
  const ctaOffset = posFor(positions, "slide4.cta");
  let ctaY = cursorY;
  let ctaFirst = 0;
  for (const line of ctaLines) {
    ctaY += ctaSize * 1.4;
    if (ctaFirst === 0) ctaFirst = ctaY;
    if (draw) ctx.fillText(line, frame.contentX + ctaOffset.dx, ctaY + ctaOffset.dy);
  }
  pushHotspot(hotspots, "slide4.cta", frame.contentX, frame.contentW, ctaFirst, ctaY, ctaSize, ctaOffset);
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
  tamilFont: string,
  serifFont: string,
  displayFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  text: CarouselTextOverrides | undefined,
  hotspots?: CarouselHotspot[]
): number {
  switch (slideIndex) {
    case 0:
      return drawSlide0Stop(ctx, style, frame, width, episode, tamilFont, serifFont, startY, draw, positions, emphases, hotspots);
    case 1:
      return drawSlide1Understand(ctx, style, frame, width, episode, tamilFont, serifFont, startY, draw, positions, emphases, hotspots);
    case 2:
      return drawSlide2Family(
        ctx,
        style,
        frame,
        width,
        episode,
        serifFont,
        startY,
        draw,
        positions,
        emphases,
        text?.slide2?.paragraphs,
        hotspots
      );
    case 3:
      return drawSlide3Action(ctx, style, frame, width, episode, serifFont, startY, draw, positions, emphases, text?.slide3, hotspots);
    case 4:
    default:
      return drawSlide4Carry(ctx, style, frame, width, episode, serifFont, displayFont, startY, draw, positions, emphases, hotspots);
  }
}

/** Renders one carousel slide and returns the clickable hotspot regions
 *  for that slide (canvas-pixel space) -- see CarouselHotspot's doc
 *  comment. Callers that don't need click-to-edit (e.g. PNG export) can
 *  simply ignore the return value. */
export function renderAathichoodiCarouselSlide(
  ctx: CanvasRenderingContext2D,
  opts: RenderCarouselSlideOptions
): CarouselHotspot[] {
  // Tamil glyphs use the same Noto Sans Tamil family as the Kural Koorum
  // Aram cover (opts.tamilFont), not the serif Tamil face (opts.
  // tamilSerifFont, now unused here) -- explicit founder direction for
  // consistency across the app's Tamil rendering, current and future.
  const { width, height, slideIndex, tamilFont, serifFont, sansFont, displayFont } = opts;
  const style = resolveStyle(opts.design?.style);
  const episode = applyTextOverrides(opts.episode, opts.design?.text);
  const frame = computeFrame(style, width, height, slideIndex);
  const positions = opts.design?.positions;
  const emphases = opts.design?.emphases;
  const text = opts.design?.text;
  const hotspots: CarouselHotspot[] = [];

  drawSurface(ctx, width, height, style.colors);
  drawHeader(ctx, style, frame, width, height, slideIndex, sansFont, positions, emphases, hotspots);

  ctx.textBaseline = "alphabetic";

  const measuredEndY = layoutSlide(
    ctx,
    style,
    frame,
    width,
    episode,
    slideIndex,
    tamilFont,
    serifFont,
    displayFont,
    frame.contentTop,
    false,
    positions,
    emphases,
    text
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
    tamilFont,
    serifFont,
    displayFont,
    balancedStartY,
    true,
    positions,
    emphases,
    text,
    hotspots
  );

  drawFooterLockup(ctx, style, frame, width, height, sansFont, opts, positions, emphases, hotspots);

  return hotspots;
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
