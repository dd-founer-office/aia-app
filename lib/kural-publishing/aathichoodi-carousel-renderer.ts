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
  badgeRing: string;
  /** The footer logo badge's own fill/text -- independent of
   *  background/textPrimary above, per explicit founder direction (the
   *  badge is a deliberately higher-contrast accent, not just "whatever
   *  the slide's field colour is"). */
  logoBadgeBackground: string;
  logoBadgeText: string;
  /** The header eyebrow's own fill/text -- same "deliberate badge accent"
   *  idea as the logo badge above, independent of background/textPrimary. */
  eyebrowBadgeBackground: string;
  eyebrowBadgeText: string;
  /** Slide 1's big Tamil heading -- every word except its own last word
   *  (see slide0HeroHighlightText below), which gets its own "selection"
   *  highlight treatment instead. Mint in both modes, per explicit
   *  founder direction -- previously white, when the whole line shared
   *  one colour. */
  slide0HeroText: string;
  /** The dark card sitting behind the header and hero (Tamil) line in
   *  light mode only -- full-bleed, square top corners, rounded bottom
   *  corners, per explicit founder direction. In dark mode this is never
   *  drawn (the whole slide is already this colour), so its value there
   *  is unused but kept at the same dark teal for type-safety. */
  slide0HeroPanelBackground: string;
  /** The hero's own last word specifically -- drawn on top of
   *  drawHeroWordHighlight's mint-tinted marquee box, not the mint the
   *  rest of the hero uses. White in both modes, per the attached
   *  reference image (a "Generate [mint] creative [white, boxed]"
   *  pattern this mirrors). */
  slide0HeroHighlightText: string;
  /** Slide 1's closing tagline specifically -- one locked colour in BOTH
   *  dark and light mode per explicit founder correction (distinct from
   *  textSecondary, which other slides' muted text keeps and which still
   *  differs by mode). */
  slide0TaglineText: string;
  /** Plain (non-badge, non-section-heading) Cal Sans text -- Slide 1's
   *  hook/question and Slide 5's lead statement. Pure white in dark mode
   *  per explicit founder correction; reverse mode keeps the same colour
   *  as textPrimary there, unchanged. Deliberately does NOT cover the
   *  eyebrow pill, the logo badge, or the section headings (WHAT DOES
   *  THIS MEAN? / etc.) -- those stay their own locked colours (mint
   *  accent / badge text) per explicit founder direction. */
  calSansText: string;
  /** Slide 1's hook specifically -- mint in dark mode per explicit founder
   *  correction (distinct from calSansText's white, which the hook used
   *  before); reverse mode keeps the same colour as calSansText there,
   *  unchanged. */
  slide0HookText: string;
  /** Slide 1's own "AATHICHOODI" eyebrow text specifically -- white in
   *  both modes, per explicit founder direction (overrides
   *  eyebrowBadgeText, which every other slide's eyebrow still uses).
   *  Slide 1 has no eyebrow pill background any more (see drawHeader),
   *  so this is read directly against the dark panel/canvas behind it. */
  slide0EyebrowText: string;
  /** Slide 4's action-icon card (a hand-drawn lightbulb, replacing the
   *  earlier quote mark) -- a small solid rounded-square badge above the
   *  question text. White in light mode / dark teal in dark mode, i.e.
   *  roughly the inverse of the icon colour below it, per explicit
   *  founder direction. */
  slide3IconCardBackground: string;
  /** The bulb icon drawn inside slide3IconCardBackground above -- dark
   *  teal in light mode, mint in dark mode. */
  slide3IconColor: string;
  /** Slide 2's full-bleed page background (replacing the usual dark
   *  gradient/white field there) -- plain white, per explicit founder
   *  direction and the attached reference image (a nested-card UI
   *  screenshot). Currently the same in both modes (the founder's own
   *  plan is to design a separate "reversed colour" version of this
   *  slide later, not yet specified -- this field is a placeholder for
   *  that pass, not a locked decision that both modes look identical
   *  forever); the same caveat applies to every other slide1* colour
   *  below. */
  slide1PageBackground: string;
  /** The outermost of Slide 2's three nested cards -- a pale mint panel
   *  spanning the full canvas, inset by a flat 10px (see
   *  drawSlide1Understand), that slide1GreenCardBackground sits on. */
  slide1OuterCardBackground: string;
  /** The middle of Slide 2's three nested cards -- the "half page" dark
   *  teal panel inset 10px within slide1OuterCardBackground, that
   *  slide1CardBackground sits on. Same dark teal as the app's main
   *  background colour (background/backgroundDeep) -- not a new colour,
   *  just a new named field for this specific element. */
  slide1GreenCardBackground: string;
  /** The innermost of Slide 2's three nested cards -- a black panel
   *  inset 30px within slide1GreenCardBackground, holding all of Slide
   *  2's actual text content. */
  slide1CardBackground: string;
  /** Slide 2's Tamil reference line, its English transliteration, and the
   *  "direct meaning" editorial paragraph (Cal Sans 600, the middle of
   *  the three paragraphs drawEditorialParagraphs renders for this
   *  slide) -- all plain white against slide1CardBackground. Distinct
   *  from slide0HeroHighlightText/slide0EyebrowText (also white) only in
   *  that this is Slide 2's, not Slide 1's -- kept as its own field per
   *  this file's one-field-per-element convention. */
  slide1CardText: string;
  /** The "WHAT DOES THIS MEAN?" heading's own pill background inside the
   *  card -- Slide 2 draws this itself now (see drawSlide1Understand),
   *  not the shared drawHeader path every other slide's section heading
   *  still uses, so it needed its own background field (its text reuses
   *  the existing mint accent colour, already identical in both modes). */
  slide1EyebrowBackground: string;
  /** The small rounded-square badge sitting above slide1GreenCardBackground,
   *  left-aligned to its edge -- holds the pronunciation icon (moved out
   *  of the black card into this corner badge, per explicit founder
   *  direction and the reference image's own icon treatment). White
   *  background, dark teal icon (slide1IconBadgeIconColor) -- the
   *  inverse of how that icon used to read (white-on-black). */
  slide1IconBadgeBackground: string;
  /** The pronunciation icon's own colour inside slide1IconBadgeBackground
   *  above -- dark teal, for contrast against the white badge. */
  slide1IconBadgeIconColor: string;
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
  bodyLineHeight: number;
}

export interface Slide0Style {
  heroSize: number;
  heroMinSize: number;
  hookSize: number;
  /** Only the SIZE lives here -- the tagline's own text is per-episode
   *  generated content now (ComposedEpisode.tagline, see content-engine.ts/
   *  taglines.ts), not fixed design-system copy, so it's read from the
   *  episode (via CarouselTextOverrides.slide0.tagline for the founder's
   *  own edit), same pattern as the hook. */
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
  /** Insets (reference px, same scale as every other size field here) for
   *  the three nested cards drawSlide1Understand/renderAathichoodiCarouselSlide
   *  draw -- see the "Outer card bounds"/"Gap between..." comments at each
   *  card's draw site for what each one measures. Click-and-drag resize
   *  (PublishingWorkspace.tsx's slide1.outerCard/greenCard/blackCard
   *  hotspots) shrinks a margin as its card is dragged bigger, so these
   *  are the one case where a hotspot's sizeField is declared `invert`. */
  outerCardMarginX: number;
  outerCardMarginTop: number;
  outerCardMarginBottom: number;
  greenCardMarginX: number;
  greenCardMarginTop: number;
  greenCardMarginBottom: number;
  blackCardMarginX: number;
  blackCardMarginTop: number;
  blackCardMarginBottom: number;
}
export interface Slide2Style {
  sectionHeadingText: string;
  sectionHeadingSize: number;
  bodySize: number;
  /** When RenderCarouselSlideOptions.familyImage is set, the photo covers
   *  the FULL canvas (edge to edge, full height) as a background layer,
   *  with a horizontal scrim fading from the opaque field color on the
   *  left to fully transparent -- so the photo bleeds into the design
   *  instead of sitting in a separate boxed panel. imageFadeStart/imageFadeEnd
   *  are fractions of the canvas width marking where that fade begins and
   *  ends (0 = fully opaque field color, 1 = fully transparent/photo).
   *  textColumnRatio is the fraction of frame.contentW the text is
   *  allowed to wrap into, kept comfortably inside the opaque zone so it
   *  never fights the photo for contrast. Ignored when no photo is set
   *  (text uses the full content width, as before). */
  imageFadeStart: number;
  imageFadeEnd: number;
  textColumnRatio: number;
  /** Opacity (0-1) of the field-color tint at imageFadeStart. Less than 1
   *  on purpose: a FULLY opaque tint hides whatever of the photo falls
   *  under it completely, not just dims it -- for a photo with a subject
   *  on that side (not just background/negative space), that subject
   *  disappears entirely rather than reading as "in shadow". A strong but
   *  translucent tint keeps the whole photo visible while still giving
   *  the text a legible field to sit on. */
  imageOpaqueTint: number;
}
export interface Slide3Style {
  sectionHeadingText: string;
  sectionHeadingSize: number;
  bodySize: number;
  questionSize: number;
  panelPadX: number;
  panelPadY: number;
  panelRadius: number;
  /** Shows the small action-icon card above the question text -- a
   *  hand-drawn lightbulb, not the quote mark this used to be. */
  showActionIcon: boolean;
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
  // No colors field, deliberately -- per explicit founder direction, the
  // palette (DEFAULT_STYLE.colors / INVERTED_COLORS) is locked and no
  // longer independently overridable. resolveStyle below always uses the
  // base palette for the selected mode; a stale colour override a browser
  // saved before this change is silently ignored, not merged in.
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
  slide0?: { hook?: string; tagline?: string };
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
  /** aiaConnection's generated copy splits at an em dash into a heavier
   *  lead clause and a lighter trailing clause (see drawSlide4Carry) --
   *  each is its own separately draggable/editable text box, same pattern
   *  as Slide 4's before/question/after. */
  slide4?: { headline?: string; support?: string; ctaCopy?: string; distantDevotionConnection?: string };
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

/** Per-element style toggle, keyed by the same hotspot id as
 *  CarouselPositions -- undefined fields mean "use this element's own
 *  default" (most elements are already deliberately bold/regular or
 *  upright/italic by design; bold/italic only override that choice when
 *  the founder explicitly sets it). `size` matters specifically for
 *  elements that share ONE style field across several hotspots -- e.g.
 *  each "Family Situation" paragraph (slide2.body.N) or Slide 4's
 *  before/after lines all read their base size from one Slide*Style field,
 *  so without a per-id override, resizing one would resize all of them.
 *  An element with its own dedicated style field (most of them) never
 *  needs this -- its one hotspot already maps 1:1 to that field. */
export interface CarouselTextEmphasis {
  bold?: boolean;
  italic?: boolean;
  size?: number;
}
export type CarouselTextEmphases = Record<string, CarouselTextEmphasis>;

export interface CarouselDesignOverrides {
  style?: CarouselStyleOverrides;
  text?: CarouselTextOverrides;
  positions?: CarouselPositions;
  emphases?: CarouselTextEmphases;
  /** Manual per-episode toggle -- swaps the base palette to INVERTED_COLORS
   *  (see its own doc comment) so alternating episodes can checkerboard
   *  light/dark on an Instagram grid. Founder-controlled per episode, not
   *  automatic -- see PublishingWorkspace.tsx's "Invert colors" toggle. */
  invertColors?: boolean;
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

/** The founder-approved baseline as of the last locked visual pass -- flat
 *  dark teal background (#0A363A, top and bottom both, per the latest
 *  colour correction), cream text, green accent, exact px sizes.
 *  resolveStyle(undefined) reproduces this exactly. */
export const DEFAULT_STYLE: CarouselStyle = {
  colors: {
    background: "#0A363A",
    backgroundDeep: "#0A363A",
    textPrimary: "#FFFFFF",
    textSecondary: "#A9C4B1",
    // Section headings' colour -- the locked mint in this (dark/green)
    // mode specifically; reverse mode keeps its own darker green instead
    // (see INVERTED_COLORS). This field is the section headings' only
    // remaining consumer.
    accent: "#68FFAD",
    panelFill: "#1D5D51",
    badgeRing: "rgba(255, 255, 255, 0.16)",
    logoBadgeBackground: "#68FFAD",
    logoBadgeText: "#0A363A",
    eyebrowBadgeBackground: "#1D5D51",
    eyebrowBadgeText: "#68FFAD",
    slide0HeroText: "#68FFAD",
    slide0HeroPanelBackground: "#0A363A",
    slide0HeroHighlightText: "#FFFFFF",
    slide0TaglineText: "#788485",
    calSansText: "#FFFFFF",
    slide0HookText: "#68FFAD",
    slide0EyebrowText: "#FFFFFF",
    slide1PageBackground: "#FFFFFF",
    slide1OuterCardBackground: "#EAF2F2",
    slide1GreenCardBackground: "#0A363A",
    slide1CardBackground: "#000000",
    slide1CardText: "#FFFFFF",
    slide1EyebrowBackground: "#1D5D51",
    slide1IconBadgeBackground: "#FFFFFF",
    slide1IconBadgeIconColor: "#0A363A",
    slide3IconCardBackground: "#0A363A",
    slide3IconColor: "#68FFAD",
  },
  layout: {
    marginX: 0.093,
    marginY: 0.075,
    verticalBalanceBias: 0.12,
    eyebrowSize: 22,
    bodyLineHeight: 1.5,
  },
  slide0: {
    heroSize: 86,
    heroMinSize: 72,
    hookSize: 32,
    taglineSize: 25,
    showBranding: true,
  },
  slide1: {
    sectionHeadingText: "WHAT DOES THIS MEAN?",
    sectionHeadingSize: 24,
    tamilRefSize: 50,
    transliterationSize: 25,
    // Matches slide2.bodySize (Family Situation's content) -- locked
    // design correction, now that this line is set in Cal Sans.
    meaningSize: 32,
    bodySize: 29,
    outerCardMarginX: 17,
    outerCardMarginTop: 60,
    outerCardMarginBottom: 60,
    greenCardMarginX: 30,
    greenCardMarginTop: 80,
    greenCardMarginBottom: 30,
    blackCardMarginX: 80,
    blackCardMarginTop: 80,
    blackCardMarginBottom: 80,
  },
  slide2: {
    sectionHeadingText: "IT HAPPENS AT HOME",
    sectionHeadingSize: 24,
    bodySize: 32,
    imageFadeStart: 0.52,
    imageFadeEnd: 0.74,
    textColumnRatio: 0.5,
    imageOpaqueTint: 0.82,
  },
  slide3: {
    sectionHeadingText: "TRY THIS TODAY",
    sectionHeadingSize: 24,
    bodySize: 29,
    questionSize: 32,
    panelPadX: 0.075,
    panelPadY: 0.07,
    panelRadius: 0.03,
    showActionIcon: true,
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

/** A hand-tuned reverse of DEFAULT_STYLE.colors -- background and text
 *  swap roles (white becomes the field, the dark teal becomes the ink)
 *  rather than an automated colour-math invert, so it reads as a
 *  deliberate second look, not an accessibility mistake. Selected per
 *  episode via the founder's manual toggle (RenderCarouselSlideOptions'
 *  design.invertColors), so alternating episodes can checkerboard
 *  light/dark on an Instagram grid. accent (section headings) is TEMPORARILY
 *  set to the same mint as DEFAULT_STYLE, per explicit founder direction --
 *  a prior round had moved it to a darker green for contrast reasons, but
 *  that's being revisited; this is a placeholder pending a final call, not
 *  a locked decision. badgeRing is the dark teal ink at low opacity, same
 *  derivation as before, just re-based on the new ink colour. */
export const INVERTED_COLORS: CarouselColors = {
  background: "#FFFFFF",
  backgroundDeep: "#FFFFFF",
  textPrimary: "#0A363A",
  textSecondary: "rgba(10, 54, 58, 0.65)",
  accent: "#68FFAD",
  panelFill: "#F6F1E3",
  badgeRing: "rgba(10, 54, 58, 0.18)",
  logoBadgeBackground: "#0A363A",
  logoBadgeText: "#68FFAD",
  eyebrowBadgeBackground: "#0A363A",
  eyebrowBadgeText: "#68FFAD",
  // Mint, not white -- same reasoning as dark mode: every word but the
  // hero's own last word, which gets the white highlight treatment below.
  slide0HeroText: "#68FFAD",
  slide0HeroPanelBackground: "#0A363A",
  slide0HeroHighlightText: "#FFFFFF",
  slide0TaglineText: "#788485",
  calSansText: "#0A363A",
  // Black, centred (drawSlide0Stop handles the alignment), per explicit
  // founder direction -- distinct from dark mode's mint/left-aligned
  // treatment, which is unchanged.
  slide0HookText: "#000000",
  slide0EyebrowText: "#FFFFFF",
  // Not yet split by mode -- see CarouselColors.slide1PageBackground's
  // doc comment. Same values as DEFAULT_STYLE for now.
  slide1PageBackground: "#FFFFFF",
  slide1OuterCardBackground: "#EAF2F2",
  slide1GreenCardBackground: "#0A363A",
  slide1CardBackground: "#000000",
  slide1CardText: "#FFFFFF",
  slide1EyebrowBackground: "#1D5D51",
  slide1IconBadgeBackground: "#FFFFFF",
  slide1IconBadgeIconColor: "#0A363A",
  slide3IconCardBackground: "#FFFFFF",
  slide3IconColor: "#0A363A",
};

export function resolveStyle(overrides?: CarouselStyleOverrides, invertColors?: boolean): CarouselStyle {
  const baseColors = invertColors ? INVERTED_COLORS : DEFAULT_STYLE.colors;
  return {
    // Always the locked base palette -- colors are no longer overridable,
    // see CarouselStyleOverrides' own doc comment.
    colors: baseColors,
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
  // familyAngle, todayAction, and aiaConnection are NOT patched here --
  // their per-paragraph / per-segment overrides (slide2.paragraphs,
  // slide3.before/question/after, slide4.headline/support) are applied
  // directly in drawSlide2Family/drawSlide3Action/drawSlide4Carry instead,
  // since they no longer fit a single whole-string replacement.
  return {
    ...episode,
    hook: text.slide0?.hook || episode.hook,
    tagline: text.slide0?.tagline || episode.tagline,
    understanding: text.slide1?.understanding || episode.understanding,
    distantDevotionConnection: text.slide4?.distantDevotionConnection || episode.distantDevotionConnection,
    cta: ctaCopy ? { ...episode.cta, copy: ctaCopy } : episode.cta,
  };
}

const REFERENCE_WIDTH = 1080;

/** Slide 1's light-mode hero panel's fixed height, as a fraction of the
 *  canvas height -- shared between drawSlide0HeroPanel (which draws it)
 *  and drawSlide0Stop (which clamps the tagline below it) so the two
 *  can't drift apart. */
const SLIDE0_HERO_PANEL_HEIGHT_FRACTION = 0.4;

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
  /** Body/supporting text across every slide. */
  interFont: string;
  /** Section headings, the Slide 1 hook, Slide 5's closing statement, and
   *  the footer logo badge's "AiA" mark. */
  calSansFont: string;
  logoImage?: HTMLImageElement | null;
  brandingWordmark?: string;
  brandingHandle?: string;
  /** Optional per-episode photo for Slide 3 (Family Situation) only --
   *  ignored on every other slide. When present, it's drawn full-bleed
   *  across the ENTIRE canvas as a background layer (see
   *  drawSlide2BackgroundPhoto), with a horizontal scrim fading from the
   *  opaque field color on the left (where the text sits) to fully
   *  transparent toward the photo on the right -- see Slide2Style's
   *  imageFadeStart/imageFadeEnd/textColumnRatio. Founder-supplied
   *  (generated externally, uploaded via the workspace sidebar), never
   *  fetched or generated by this app. */
  familyImage?: HTMLImageElement | null;
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
 *  slides 0 and 4 have none. Slide 1 (UI "Understand") doesn't either any
 *  more, per explicit founder direction: its "WHAT DOES THIS MEAN?"
 *  heading moved into its own black card as a pill (see
 *  drawSlide1Understand), not the shared top-of-canvas treatment every
 *  other slide's heading still uses. style.slide1.sectionHeadingText is
 *  still the text's source of truth -- drawSlide1Understand reads it
 *  directly -- so the existing text-override UI for it keeps working. */
function sectionHeadingFor(style: CarouselStyle, slideIndex: number): { text: string; size: number } {
  switch (slideIndex) {
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
 *  episode number or page indicator -- just the "AATHICHOODI" eyebrow
 *  (a tight pill/button, not plain text -- see drawHeader) and the slide's
 *  own section heading. No divider line any more, per the locked design
 *  correction. */
function headerMetrics(style: CarouselStyle, width: number, height: number, slideIndex: number) {
  const marginX = Math.round(width * style.layout.marginX);
  const marginY = Math.round(height * style.layout.marginY);
  const eyebrow = px(style.layout.eyebrowSize, width);
  const { text: headingText, size: headingSizeBase } = sectionHeadingFor(style, slideIndex);
  const heading = px(headingSizeBase, width);
  // The eyebrow badge's own vertical footprint -- tight padding, per the
  // locked correction ("reduce the space around the text keep it tight").
  // Shared with drawHeader so the badge's actual drawn height and the
  // space reserved for it can never drift apart.
  const eyebrowPadY = eyebrow * 0.42;
  const badgeH = eyebrow + eyebrowPadY * 2;
  const badgeBottom = marginY + badgeH;
  const hasHeading = Boolean(headingText);
  const headingY = badgeBottom + heading * 1.3;
  // A manual "\n" in the heading (typed via the in-canvas editor) forces a
  // second line -- headerBottom (and therefore where the slide's own
  // content starts) grows to match, so a two-line heading never overlaps
  // the body copy below it. A single-line heading (headingLines.length===1)
  // reproduces the original headerBottom formula exactly.
  const headingLines = headingText ? headingText.split("\n") : [];
  const headingLineHeight = heading * 1.3;
  const headingBlockExtra = headingLines.length > 1 ? (headingLines.length - 1) * headingLineHeight : 0;
  const headerBottom = hasHeading ? headingY + headingBlockExtra + heading * 0.6 : badgeBottom + heading * 0.6;
  return {
    marginX,
    marginY,
    eyebrow,
    eyebrowPadY,
    badgeH,
    badgeBottom,
    heading,
    headingText,
    headingLines,
    headingLineHeight,
    hasHeading,
    headingY,
    headerBottom,
  };
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
  calSansFont: string,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): void {
  const { eyebrow, badgeH, heading, headingText, headingLines, headingLineHeight, headingY } = headerMetrics(
    style,
    width,
    height,
    slideIndex
  );
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // Eyebrow is a tight button/pill, not plain text -- per the locked design
  // correction. No divider line beneath it any more. Slide 1 drops the
  // pill background per explicit founder direction (the "AATHICHOODI"
  // text itself stays, same position as every other slide) and its text
  // is white there (slide0EyebrowText), not the mint every other slide's
  // eyebrow badge text uses -- a further explicit founder correction.
  {
    try {
      ctx.letterSpacing = `${Math.round(px(2, width))}px`;
    } catch {
      /* Canvas2D letterSpacing unsupported -- default tracking is fine */
    }

    const eyebrowOffset = posFor(positions, "header.eyebrow");
    const eyebrowEmphasis = emphasisFor(emphases, "header.eyebrow");
    const eyebrowText = "AATHICHOODI";
    ctx.font = `${styleFor(false, eyebrowEmphasis)} ${weightFor(600, eyebrowEmphasis)} ${Math.round(eyebrow)}px ${calSansFont}`;
    const eyebrowPadX = eyebrow * 0.65;
    const eyebrowTextWidth = ctx.measureText(eyebrowText).width;
    const badgeW = eyebrowTextWidth + eyebrowPadX * 2;
    const badgeX = frame.contentX + eyebrowOffset.dx;
    const badgeY = frame.marginY + eyebrowOffset.dy;
    const badgeRadius = px(6, width);

    if (slideIndex !== 0) {
      ctx.fillStyle = style.colors.eyebrowBadgeBackground;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeRadius);
      ctx.fill();
    }

    ctx.fillStyle = slideIndex === 0 ? style.colors.slide0EyebrowText : style.colors.eyebrowBadgeText;
    ctx.textBaseline = "middle";
    ctx.fillText(eyebrowText, badgeX + eyebrowPadX, badgeY + badgeH / 2 + eyebrow * 0.03);
    ctx.textBaseline = "alphabetic";

    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }

    if (hotspots) {
      hotspots.push({ id: "header.eyebrow", x: badgeX, y: badgeY, width: badgeW, height: badgeH });
    }
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
    ctx.font = `${styleFor(false, headingEmphasis)} ${weightFor(600, headingEmphasis)} ${Math.round(heading)}px ${calSansFont}`;
    let headingCursorY = headingY;
    let headingFirst = 0;
    for (const line of headingLines) {
      if (headingFirst === 0) headingFirst = headingCursorY;
      ctx.fillText(line, frame.contentX + headingOffset.dx, headingCursorY + headingOffset.dy);
      headingCursorY += headingLineHeight;
    }
    pushHotspot(
      hotspots,
      `slide${slideIndex}.sectionHeading`,
      frame.contentX,
      frame.contentW,
      headingFirst,
      headingCursorY - headingLineHeight,
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

/** Large avatar-sized brand badge -- a rounded square (squircle-ish, per
 *  explicit founder direction matching the attached reference icon), not
 *  the circle this used to be. Same live-drawn "AiA" wordmark (Cal Sans,
 *  logoBadgeText colour) on a filled logoBadgeBackground shape -- not the
 *  AiA.png asset, which this function doesn't read. `radius` is kept as
 *  the parameter name (unchanged call site/footprint: the shape still
 *  occupies the exact square bounding box a circle of this radius would)
 *  even though it now sizes a rounded square, not a circle's radius. */
function drawLogoBadge(
  ctx: CanvasRenderingContext2D,
  colors: CarouselColors,
  calSansFont: string,
  cx: number,
  cy: number,
  radius: number
): void {
  const size = radius * 2;
  const cornerRadius = size * 0.26;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cx - radius, cy - radius, size, size, cornerRadius);
  ctx.fillStyle = colors.logoBadgeBackground;
  ctx.fill();
  ctx.strokeStyle = colors.badgeRing;
  ctx.lineWidth = Math.max(1, radius * 0.02);
  ctx.stroke();
  ctx.clip();

  ctx.fillStyle = colors.logoBadgeText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(radius * 0.95)}px ${calSansFont}`;
  ctx.fillText("AiA", cx, cy + radius * 0.04);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

/** "#RRGGBB" -> "rgba(r, g, b, alpha)" -- used for the Slide 3 photo scrim's
 *  transparent gradient stop, since a plain hex string can't express one. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawFooterLockup(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  height: number,
  calSansFont: string,
  interFont: string,
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

  // The badge is now live-drawn text (see drawLogoBadge), not an
  // uploaded image -- it no longer waits on opts.logoImage to have loaded.
  const logoOffset = posFor(positions, "footer.logo");
  drawLogoBadge(ctx, style.colors, calSansFont, logoX + logoOffset.dx, rowY + logoOffset.dy, logoRadius);
  if (hotspots) {
    hotspots.push({
      id: "footer.logo",
      x: logoX + logoOffset.dx - logoRadius,
      y: rowY + logoOffset.dy - logoRadius,
      width: logoRadius * 2,
      height: logoRadius * 2,
    });
  }

  const textX = logoX + logoRadius + width * 0.028;
  const textEndX = frame.contentX + frame.contentW;
  const brandNameOffset = posFor(positions, "footer.brandName");
  const brandNameEmphasis = emphasisFor(emphases, "footer.brandName");
  ctx.textAlign = "left";
  ctx.fillStyle = style.colors.textPrimary;
  ctx.font = `${styleFor(false, brandNameEmphasis)} ${weightFor(700, brandNameEmphasis)} ${Math.round(brandName)}px ${interFont}`;
  const brandNameY = rowY - textBlockHeight / 2 + brandName;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX + brandNameOffset.dx, brandNameY + brandNameOffset.dy);
  pushHotspot(hotspots, "footer.brandName", textX, textEndX - textX, brandNameY, brandNameY, brandName, brandNameOffset);
  if (opts.brandingHandle) {
    const handleOffset = posFor(positions, "footer.handle");
    const handleEmphasis = emphasisFor(emphases, "footer.handle");
    ctx.fillStyle = style.colors.textSecondary;
    ctx.font = `${styleFor(false, handleEmphasis)} ${weightFor(400, handleEmphasis)} ${Math.round(handle)}px ${interFont}`;
    const handleY = rowY + textBlockHeight / 2 - handle * 0.25;
    ctx.fillText(`@${opts.brandingHandle}`, textX + handleOffset.dx, handleY + handleOffset.dy);
    pushHotspot(hotspots, "footer.handle", textX, textEndX - textX, handleY, handleY, handle, handleOffset);
  }
}

// ---------------------------------------------------------------------------
// Slide content
// ---------------------------------------------------------------------------

/** Slide 1's light-mode-only hero panel -- a full-bleed dark card sitting
 *  behind the header and the Tamil hero line, square top corners flush
 *  with the canvas edge, rounded bottom corners, per explicit founder
 *  direction. Never drawn in dark mode: the whole slide is already this
 *  colour there, so a second copy of it would be redundant. Fixed extent
 *  (40% of the canvas height) and fixed corner radius (24px at the 1080px
 *  reference width -- measured directly off the founder's reference
 *  image, which fit a ~2.3%-of-width corner radius) -- both locked
 *  numbers per explicit founder direction, not sized to the hero text's
 *  own rendered bounds. */
function drawSlide0HeroPanel(ctx: CanvasRenderingContext2D, style: CarouselStyle, width: number, height: number): void {
  const bottom = height * SLIDE0_HERO_PANEL_HEIGHT_FRACTION;
  const radius = px(24, width);

  ctx.fillStyle = style.colors.slide0HeroPanelBackground;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, bottom, [0, 0, radius, radius]);
  ctx.fill();
}

/** Marquee-style "selection" highlight for the hero's last word (see
 *  drawSlide0Stop below) -- a faint mint-tinted rectangle with four small
 *  solid mint squares straddling its corners, per the attached reference
 *  image. No connecting border lines, no rounded corners. `baseline` is
 *  the word's own text baseline; `left` is its left edge. Must be called
 *  before the word itself is drawn, so the box sits behind the glyphs.
 *
 *  The top padding is taller than the reference image's Latin-text
 *  original called for, per explicit founder correction -- Tamil vowel
 *  signs (e.g. the ெ mark in செய்) sit above the consonant's own
 *  cap-height and were getting clipped by the box's top edge at the
 *  reference's proportions. Side padding and corner-square size were
 *  both reduced the same way (founder correction over the first pass),
 *  so none of these four numbers are the reference's original measured
 *  values any more. */
function drawHeroWordHighlight(ctx: CanvasRenderingContext2D, accent: string, left: number, baseline: number, wordWidth: number, fontSize: number): void {
  const padX = fontSize * 0.12;
  const top = baseline - fontSize * 1.35;
  const bottom = baseline + fontSize * 0.32;
  const boxX = left - padX;
  const boxW = wordWidth + padX * 2;
  const boxH = bottom - top;

  ctx.fillStyle = hexToRgba(accent, 0.1);
  ctx.fillRect(boxX, top, boxW, boxH);

  const markSize = fontSize * 0.14;
  ctx.fillStyle = accent;
  for (const [cx, cy] of [
    [boxX, top],
    [boxX + boxW, top],
    [boxX, top + boxH],
    [boxX + boxW, top + boxH],
  ]) {
    ctx.fillRect(cx - markSize / 2, cy - markSize / 2, markSize, markSize);
  }
}

function drawSlide0Stop(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  canvasHeight: number,
  episode: ComposedEpisode,
  tamilFont: string,
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[],
  invertColors?: boolean
): number {
  let cursorY = startY;
  const heroEmphasis = emphasisFor(emphases, "slide0.hero");
  const hookEmphasis = emphasisFor(emphases, "slide0.hook");
  const taglineEmphasis = emphasisFor(emphases, "slide0.tagline");

  // The Tamil line is the hero -- dramatically the largest element on the
  // slide. May reduce toward heroMinSize (never below) only if a specific
  // episode's line genuinely doesn't fit. Uses the same Noto Sans Tamil
  // family as the Kural Koorum Aram cover (tamilFont), not the serif
  // Tamil face, for typographic consistency across the app.
  ctx.textAlign = "left";
  const heroFont = (size: number) => `${styleFor(false, heroEmphasis)} ${weightFor(700, heroEmphasis)} ${size}px ${tamilFont}`;
  const hero = fitText(ctx, episode.tamilText, heroFont, frame.contentW, (frame.contentBottom - frame.contentTop) * 0.46, Math.round(px(style.slide0.heroSize, width)), Math.round(px(style.slide0.heroMinSize, width)));
  ctx.font = heroFont(hero.size);

  // The hero's own last word gets a "selection" highlight (white on a
  // mint-tinted marquee box, see drawHeroWordHighlight) instead of the
  // mint every other word uses -- per the attached reference image and
  // explicit founder direction. It's always the last word of the last
  // wrapped line, since that's the end of the text regardless of how
  // fitText happened to wrap it.
  const heroOffset = posFor(positions, "slide0.hero");
  const heroLastLineIndex = hero.lines.length - 1;
  let heroFirst = 0;
  for (let lineIndex = 0; lineIndex < hero.lines.length; lineIndex++) {
    cursorY += hero.lineHeight;
    if (heroFirst === 0) heroFirst = cursorY;
    if (!draw) continue;
    const line = hero.lines[lineIndex];
    const lineX = frame.contentX + heroOffset.dx;
    const lineY = cursorY + heroOffset.dy;
    if (lineIndex !== heroLastLineIndex) {
      ctx.fillStyle = style.colors.slide0HeroText;
      ctx.fillText(line, lineX, lineY);
      continue;
    }
    const lastSpace = line.lastIndexOf(" ");
    const before = lastSpace >= 0 ? line.slice(0, lastSpace + 1) : "";
    const lastWord = lastSpace >= 0 ? line.slice(lastSpace + 1) : line;
    ctx.fillStyle = style.colors.slide0HeroText;
    if (before) ctx.fillText(before, lineX, lineY);
    const beforeWidth = before ? ctx.measureText(before).width : 0;
    const wordWidth = ctx.measureText(lastWord).width;
    drawHeroWordHighlight(ctx, style.colors.accent, lineX + beforeWidth, lineY, wordWidth, hero.size);
    ctx.fillStyle = style.colors.slide0HeroHighlightText;
    ctx.fillText(lastWord, lineX + beforeWidth, lineY);
  }
  pushHotspot(hotspots, "slide0.hero", frame.contentX, frame.contentW, heroFirst, cursorY, hero.size, heroOffset);

  // Gap between the Aathichoodi and the hook question -- no divider line
  // any more, per the locked design correction; the whitespace itself
  // carries the separation.
  cursorY += hero.lineHeight * 0.7;

  // Black and centred in light mode only, per explicit founder direction
  // (it still sits on the dark panel there, just a different colour/
  // alignment than dark mode's mint/left-aligned treatment, which is
  // unchanged). Weight 500, not 600 -- reduced by 100 per explicit
  // founder direction (this "supporting line" under the hero headline
  // reads as too heavy at 600).
  if (draw) ctx.fillStyle = style.colors.slide0HookText;
  ctx.textAlign = invertColors ? "center" : "left";
  const hookX = invertColors ? frame.contentX + frame.contentW / 2 : frame.contentX;
  const hookSize = px(style.slide0.hookSize, width);
  ctx.font = `${styleFor(false, hookEmphasis)} ${weightFor(500, hookEmphasis)} ${Math.round(hookSize)}px ${calSansFont}`;
  const hookLines = wrapText(ctx, episode.hook, frame.contentW);
  const hookOffset = posFor(positions, "slide0.hook");
  let hookFirst = 0;
  for (const line of hookLines) {
    cursorY += hookSize * 1.3;
    if (hookFirst === 0) hookFirst = cursorY;
    if (draw) ctx.fillText(line, hookX + hookOffset.dx, cursorY + hookOffset.dy);
  }
  ctx.textAlign = "left";
  pushHotspot(hotspots, "slide0.hook", frame.contentX, frame.contentW, hookFirst, cursorY, hookSize, hookOffset);

  // Closing tagline -- per-episode generated content now (episode.tagline,
  // see taglines.ts), two explicit lines ("\n" forces the break rather
  // than word-wrapping). In dark mode, its own locked muted colour
  // (slide0TaglineText), left-aligned, unchanged. In light mode, per
  // explicit founder direction, it instead takes the hero panel's own
  // background colour (slide0HeroPanelBackground) -- dark teal text, not
  // muted grey -- and is centred, Inter 400 (the weight it already was).
  // Since that colour matches the panel itself, the tagline also gets
  // nudged below the panel's fixed bottom edge when it would otherwise
  // straddle it (the panel's fixed height doesn't track the balanced
  // layout's actual content flow) -- otherwise the part of the text still
  // over the panel would render invisible, dark-on-dark.
  const taglineSize = px(style.slide0.taglineSize, width);
  cursorY += hookSize * 0.9;
  if (invertColors) {
    const panelBottom = canvasHeight * SLIDE0_HERO_PANEL_HEIGHT_FRACTION;
    // The target is the first line's *glyph top* clearing the panel, not
    // its baseline -- Inter's ascent is roughly 0.75x the font size, so
    // the baseline itself needs to land a full taglineSize below the
    // panel edge for the glyphs above it to actually clear it.
    const minCursorBeforeFirstLine = panelBottom - taglineSize * 0.3;
    cursorY = Math.max(cursorY, minCursorBeforeFirstLine);
  }
  if (draw) ctx.fillStyle = invertColors ? style.colors.slide0HeroPanelBackground : style.colors.slide0TaglineText;
  ctx.textAlign = invertColors ? "center" : "left";
  const taglineX = invertColors ? frame.contentX + frame.contentW / 2 : frame.contentX;
  ctx.font = `${styleFor(false, taglineEmphasis)} ${weightFor(400, taglineEmphasis)} ${Math.round(taglineSize)}px ${interFont}`;
  const taglineLines = episode.tagline.split("\n").filter(Boolean);
  const taglineOffset = posFor(positions, "slide0.tagline");
  let taglineFirst = 0;
  for (const line of taglineLines) {
    cursorY += taglineSize * 1.3;
    if (taglineFirst === 0) taglineFirst = cursorY;
    if (draw) ctx.fillText(line, taglineX + taglineOffset.dx, cursorY + taglineOffset.dy);
  }
  ctx.textAlign = "left";
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
  interFont: string,
  size: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[],
  hotspotId?: string,
  firstParagraphColor?: string,
  calSansFont?: string,
  lastParagraphColor?: string,
  middleColor?: string
): number {
  const paragraphs = splitEditorialParagraphs(text);
  const emphasis = emphasisFor(emphases, hotspotId ?? "");
  const lineHeight = size * style.layout.bodyLineHeight;
  const offset = posFor(positions, hotspotId ?? "");
  let cursorY = startY;
  let firstBaseline = 0;
  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
    // Locked components, per the latest design correction: paragraph 0
    // (the opener, e.g. "Avvaiyar begins with a powerful idea:" -- always
    // first, since splitEditorialParagraphs breaks after a colon and
    // every opener ends with one) is Inter 700 at its own locked colour
    // (firstParagraphColor, the mint accent). The LAST paragraph (the
    // explanation) is also Inter 700, at lastParagraphColor (the grey the
    // rest of the app already uses) -- both weight bumps and the
    // explanation's colour change are explicit founder corrections.
    // Paragraph 1 specifically (the direct meaning sentence) stays Cal
    // Sans 600, middleColor. Any further paragraph before the last one
    // (some episodes generate more than 3) falls back to plain Inter 400,
    // middleColor -- it was never meant to pick up paragraph 1's Cal Sans
    // treatment just for sitting somewhere in the middle.
    const isFirst = paragraphIndex === 0;
    const isLast = !isFirst && paragraphIndex === paragraphs.length - 1;
    const isDirectMeaning = !isFirst && !isLast && paragraphIndex === 1;
    if (draw) {
      ctx.fillStyle = isFirst
        ? (firstParagraphColor ?? style.colors.textPrimary)
        : isLast
          ? (lastParagraphColor ?? style.colors.textPrimary)
          : (middleColor ?? style.colors.textPrimary);
    }
    if (isFirst || isLast) {
      ctx.font = `${styleFor(false, emphasis)} ${weightFor(700, emphasis)} ${Math.round(size)}px ${interFont}`;
    } else if (isDirectMeaning && calSansFont) {
      ctx.font = `${styleFor(false, emphasis)} 600 ${Math.round(size)}px ${calSansFont}`;
    } else {
      ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${interFont}`;
    }
    const lines = wrapText(ctx, paragraphs[paragraphIndex], frame.contentW);
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

/** A circular "pronunciation" mark -- outline circle, a simple right-
 *  facing profile silhouette, radiating sound-wave arcs off the mouth,
 *  and small "A" / "#" glyphs -- per the attached reference icon.
 *  Hand-drawn with plain Canvas2D primitives, same convention as every
 *  other icon in this file (the circular "AiA" wordmark, the lightbulb).
 *  `size` is the icon's overall diameter; (cx, cy) is its centre. */
function drawPronunciationIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  const r = size / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.5, size * 0.045);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.92, 0, Math.PI * 2);
  ctx.stroke();

  // Profile: forehead -> nose bridge -> nose tip -> lips -> chin -> neck,
  // one continuous open path, sitting right-of-centre and facing right.
  const fx = cx + r * 0.05;
  ctx.beginPath();
  ctx.moveTo(fx - r * 0.12, cy - r * 0.72);
  ctx.quadraticCurveTo(fx + r * 0.3, cy - r * 0.5, fx + r * 0.08, cy - r * 0.08);
  ctx.quadraticCurveTo(fx + r * 0.38, cy, fx + r * 0.16, cy + r * 0.14);
  ctx.quadraticCurveTo(fx + r * 0.32, cy + r * 0.24, fx + r * 0.06, cy + r * 0.32);
  ctx.quadraticCurveTo(fx + r * 0.2, cy + r * 0.44, fx - r * 0.08, cy + r * 0.58);
  ctx.lineTo(fx - r * 0.08, cy + r * 0.8);
  ctx.stroke();

  // Sound-wave arcs, radiating right from the mouth.
  const waveCx = fx + r * 0.22;
  const waveCy = cy + r * 0.14;
  for (let i = 0; i < 3; i++) {
    const waveR = r * (0.22 + i * 0.17);
    ctx.beginPath();
    ctx.arc(waveCx, waveCy, waveR, -Math.PI * 0.22, Math.PI * 0.22);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.round(r * 0.34)}px sans-serif`;
  ctx.fillText("A", cx - r * 0.34, cy - r * 0.4);
  ctx.font = `700 ${Math.round(r * 0.28)}px sans-serif`;
  ctx.fillText("#", cx - r * 0.56, cy - r * 0.04);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.restore();
}

/** "Understand" -- redesigned per explicit founder direction and two
 *  attached reference images into three nested cards sitting on a
 *  full-bleed white page (the outermost, pale-mint card is drawn in
 *  renderAathichoodiCarouselSlide -- see slide1OuterCardBackground):
 *
 *  1. The pale outer card (drawn by the caller).
 *  2. A "half page" dark teal card inset 10px within it
 *     (slide1GreenCardBackground).
 *  3. A black card inset 30px within that (slide1CardBackground),
 *     holding the slide's actual text: the Tamil line, its English
 *     transliteration (both white), the "WHAT DOES THIS MEAN?" heading
 *     as its own pill (not the shared top-of-canvas treatment -- see
 *     sectionHeadingFor), then the editorial paragraphs.
 *
 *  The pronunciation icon sits in its own small white rounded-square
 *  badge above the green card, left-aligned to its edge -- per the
 *  reference image's own icon treatment -- not inside the black card any
 *  more. All three cards are fixed-size (not sized to their own
 *  content) -- `startY` (the balanced-layout position) is deliberately
 *  unused here, since there's no slack to balance inside a fixed card. */
function drawSlide1Understand(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  canvasHeight: number,
  episode: ComposedEpisode,
  tamilFont: string,
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  hotspots?: CarouselHotspot[]
): number {
  void startY;
  const transliteration = px(style.slide1.transliterationSize, width);
  const body = px(style.slide1.bodySize, width);
  const tamilRef = px(style.slide1.tamilRefSize, width);

  // Outer card bounds mirror exactly what renderAathichoodiCarouselSlide
  // drew behind this (same margins, same frame.contentBottom clamp) --
  // recomputed here rather than threaded through, since it's cheap and
  // keeps this function self-contained.
  const outerMarginX = px(style.slide1.outerCardMarginX, width);
  const outerMarginTop = px(style.slide1.outerCardMarginTop, width);
  const outerMarginBottom = px(style.slide1.outerCardMarginBottom, width);
  const outerBottom = Math.min(canvasHeight - outerMarginBottom, frame.contentBottom);

  // Gap between the pale outer card and the dark teal "green" card --
  // asymmetric per explicit founder direction (more room on top, for the
  // icon badge, than the sides/bottom). greenMarginTop (80px) is a
  // *minimum*, not fixed: the AATHICHOODI eyebrow pill above it
  // (headerMetrics.badgeBottom) already sits lower than
  // outerMarginTop + greenMarginTop on most formats, which would
  // otherwise leave no room at all for the icon badge between them, so
  // the green card's actual top -- and so its height -- expands past
  // that minimum whenever the pill + badge need more space than it
  // provides.
  const greenMarginX = px(style.slide1.greenCardMarginX, width);
  const greenMarginTop = px(style.slide1.greenCardMarginTop, width);
  const greenMarginBottom = px(style.slide1.greenCardMarginBottom, width);
  const greenX = outerMarginX + greenMarginX;
  const greenW = width - outerMarginX * 2 - greenMarginX * 2;
  const greenBottom = outerBottom - greenMarginBottom;

  const badgeSize = px(64, width);
  const badgeRadius = badgeSize * 0.2;
  const badgePad = px(12, width);
  const badgeOffset = posFor(positions, "slide1.icon");
  const badgeX = greenX + badgeOffset.dx;
  const eyebrowBadgeBottom = headerMetrics(style, width, canvasHeight, 1).badgeBottom;
  const badgeY = eyebrowBadgeBottom + badgePad + badgeOffset.dy;

  const greenTop = Math.max(outerMarginTop + greenMarginTop, badgeY + badgeSize + badgePad);
  const greenH = greenBottom - greenTop;
  const greenRadius = px(24, width);
  // Like every other draggable element, the card's own drag offset only
  // nudges where ITS rectangle is drawn/hit-tested -- it never feeds back
  // into the layout math above, so the badge/black-card/text positions
  // computed from greenX/greenTop stay put even if the green card's own
  // background is dragged away from them.
  const greenCardOffset = posFor(positions, "slide1.greenCard");
  if (draw) {
    ctx.fillStyle = style.colors.slide1GreenCardBackground;
    ctx.beginPath();
    ctx.roundRect(greenX + greenCardOffset.dx, greenTop + greenCardOffset.dy, greenW, greenH, greenRadius);
    ctx.fill();
    ctx.fillStyle = style.colors.slide1IconBadgeBackground;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius);
    ctx.fill();
    drawPronunciationIcon(ctx, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize * 0.68, style.colors.slide1IconBadgeIconColor);
  }
  // Pushed before the icon/text hotspots below (not after) so they render
  // later in the overlay's DOM order and so stay on top for clicking --
  // this card's hotspot is a big background rect that would otherwise
  // swallow clicks meant for the smaller elements sitting on top of it.
  if (hotspots) {
    hotspots.push({
      id: "slide1.greenCard",
      x: greenX + greenCardOffset.dx,
      y: greenTop + greenCardOffset.dy,
      width: greenW,
      height: greenH,
    });
  }
  pushHotspot(hotspots, "slide1.icon", badgeX, badgeSize, badgeY, badgeY + badgeSize, badgeSize, ZERO_OFFSET);

  // Gap between the green card and the innermost black card -- 80px on
  // all four sides by default, per explicit founder direction (up from
  // the previous round's 30px) -- independently adjustable per side, same
  // as the outer/green cards above.
  const blackMarginX = px(style.slide1.blackCardMarginX, width);
  const blackMarginTop = px(style.slide1.blackCardMarginTop, width);
  const blackMarginBottom = px(style.slide1.blackCardMarginBottom, width);
  const blackX = greenX + blackMarginX;
  const blackW = greenW - blackMarginX * 2;
  const blackTop = greenTop + blackMarginTop;
  const blackBottom = greenBottom - blackMarginBottom;
  const blackRadius = px(16, width);
  // Same visual-only-nudge convention as the green card above -- the
  // text drawn inside still anchors to the unoffset blackX/blackTop.
  const blackCardOffset = posFor(positions, "slide1.blackCard");
  if (draw) {
    ctx.fillStyle = style.colors.slide1CardBackground;
    ctx.beginPath();
    ctx.roundRect(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy, blackW, blackBottom - blackTop, blackRadius);
    ctx.fill();
  }
  if (hotspots) {
    hotspots.push({
      id: "slide1.blackCard",
      x: blackX + blackCardOffset.dx,
      y: blackTop + blackCardOffset.dy,
      width: blackW,
      height: blackBottom - blackTop,
    });
  }

  const padX = blackW * 0.08;
  const innerLeft = blackX + padX;
  const innerFrame: Frame = { ...frame, contentX: innerLeft, contentW: blackW - padX * 2 };
  let cursorY = blackTop + padX;

  // Tamil line and its English transliteration -- both white
  // (slide1CardText), same Noto Sans Tamil family as the Kural Koorum
  // Aram cover for the Tamil, not the serif face.
  const tamilRefEmphasis = emphasisFor(emphases, "slide1.tamilRef");
  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.slide1CardText;
  ctx.font = `${styleFor(false, tamilRefEmphasis)} ${weightFor(700, tamilRefEmphasis)} ${Math.round(tamilRef)}px ${tamilFont}`;
  cursorY += tamilRef;
  const tamilRefOffset = posFor(positions, "slide1.tamilRef");
  if (draw) ctx.fillText(episode.tamilText, innerLeft + tamilRefOffset.dx, cursorY + tamilRefOffset.dy);
  pushHotspot(hotspots, "slide1.tamilRef", innerLeft, innerFrame.contentW, cursorY, cursorY, tamilRef, tamilRefOffset);

  cursorY += transliteration * 2.1;
  const transliterationEmphasis = emphasisFor(emphases, "slide1.transliteration");
  if (draw) ctx.fillStyle = style.colors.slide1CardText;
  ctx.font = `${styleFor(false, transliterationEmphasis)} ${weightFor(700, transliterationEmphasis)} ${Math.round(transliteration)}px ${interFont}`;
  const transliterationOffset = posFor(positions, "slide1.transliteration");
  if (draw) ctx.fillText(episode.transliteration, innerLeft + transliterationOffset.dx, cursorY + transliterationOffset.dy);
  pushHotspot(
    hotspots,
    "slide1.transliteration",
    innerLeft,
    innerFrame.contentW,
    cursorY,
    cursorY,
    transliteration,
    transliterationOffset
  );

  // "WHAT DOES THIS MEAN?" -- its own pill now (green fill, mint text,
  // same colours the AATHICHOODI eyebrow pill uses), not the shared
  // top-of-canvas section heading every other slide still draws (see
  // sectionHeadingFor). style.slide1.sectionHeadingText stays the text's
  // source of truth, so the existing override UI still edits it.
  cursorY += transliteration * 1.7;
  const headingText = style.slide1.sectionHeadingText;
  if (headingText) {
    const headingSize = px(style.slide1.sectionHeadingSize, width);
    const headingEmphasis = emphasisFor(emphases, "slide1.sectionHeading");
    const headingOffset = posFor(positions, "slide1.sectionHeading");
    ctx.font = `${styleFor(false, headingEmphasis)} ${weightFor(600, headingEmphasis)} ${Math.round(headingSize)}px ${calSansFont}`;
    const padPillX = headingSize * 0.75;
    const padPillY = headingSize * 0.5;
    const pillTextWidth = ctx.measureText(headingText).width;
    const pillW = pillTextWidth + padPillX * 2;
    const pillH = headingSize + padPillY * 2;
    const pillX = innerLeft + headingOffset.dx;
    const pillY = cursorY + headingOffset.dy;
    if (draw) {
      ctx.fillStyle = style.colors.slide1EyebrowBackground;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = style.colors.accent;
      ctx.textBaseline = "middle";
      ctx.fillText(headingText, pillX + padPillX, pillY + pillH / 2 + headingSize * 0.03);
      ctx.textBaseline = "alphabetic";
    }
    pushHotspot(hotspots, "slide1.sectionHeading", pillX, pillW, pillY, pillY + pillH, headingSize, ZERO_OFFSET);
    cursorY += pillH;
  }

  cursorY += transliteration * 1.1;
  return drawEditorialParagraphs(
    ctx,
    style,
    innerFrame,
    cursorY,
    blackBottom - padX,
    episode.understanding,
    interFont,
    body,
    draw,
    positions,
    emphases,
    hotspots,
    "slide1.body",
    style.colors.accent,
    calSansFont,
    style.colors.slide0TaglineText,
    style.colors.slide1CardText
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
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrideParagraphs: string[] | undefined,
  hotspots?: CarouselHotspot[],
  hasImage?: boolean
): number {
  const generatedParagraphs = splitEditorialParagraphs(episode.familyAngle);
  let cursorY = startY;

  // With a photo, the photo itself is a full-canvas background layer
  // (drawn separately, before the header -- see drawSlide2BackgroundPhoto)
  // with a scrim fading from opaque on the left to transparent toward the
  // photo. Text just needs to stay comfortably inside that opaque zone,
  // hence the narrower wrap width -- it has nothing to do with the
  // photo's own position/size anymore. Without a photo, text keeps the
  // full width, exactly as before.
  const textW = hasImage ? frame.contentW * style.slide2.textColumnRatio : frame.contentW;

  for (let i = 0; i < generatedParagraphs.length; i++) {
    if (cursorY > frame.contentBottom) break;
    const id = `slide2.body.${i}`;
    const text = overrideParagraphs?.[i] || generatedParagraphs[i];
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    // Own size per paragraph (emphasis.size), not the shared
    // style.slide2.bodySize -- otherwise resizing one paragraph would
    // resize every paragraph, since they'd all be reading the same field.
    const size = px(emphasis.size ?? style.slide2.bodySize, width);
    const lineHeight = size * style.layout.bodyLineHeight;
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    // Paragraph 0 (some episodes only have two) is Cal Sans 600, per the
    // latest design correction -- every other paragraph stays Inter 400.
    if (i === 0) {
      ctx.font = `${styleFor(false, emphasis)} 600 ${Math.round(size)}px ${calSansFont}`;
    } else {
      ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${interFont}`;
    }
    const lines = wrapText(ctx, text, textW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += lineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, textW, firstBaseline, cursorY, size, offset);
    // Generous paragraph gap -- distinct visual breaks between grafs
    // rather than a dense block, so the copy occupies its natural share
    // of the frame instead of reading as one cramped paragraph.
    cursorY += lineHeight * 0.85;
  }

  return cursorY;
}

/** Full-bleed hero background for Slide 3's optional founder-supplied
 *  photo: covers the ENTIRE canvas (edge to edge, full height), cropped
 *  to fill without distortion, no rounded corners drawn here -- the
 *  canvas element's own CSS border-radius (KuralHeroCanvas.tsx) rounds
 *  the whole rendered card, photo included. Drawn BEFORE the header/text
 *  (see renderAathichoodiCarouselSlide) so everything else layers on top
 *  of it. A horizontal scrim fades from the opaque field color on the
 *  left (where the text sits) to fully transparent toward the photo, so
 *  it blends into the design rather than sitting behind a hard seam --
 *  outside the two gradient stops, canvas extends each stop's color
 *  flat, so the zone left of imageFadeStart is fully opaque and the zone
 *  right of imageFadeEnd is the photo with no tint at all. */
function drawSlide2BackgroundPhoto(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  width: number,
  height: number,
  img: HTMLImageElement
): void {
  const scale = Math.max(width / img.width, height / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  ctx.drawImage(img, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);

  const fadeStart = width * style.slide2.imageFadeStart;
  const fadeEnd = width * style.slide2.imageFadeEnd;
  const gradient = ctx.createLinearGradient(fadeStart, 0, fadeEnd, 0);
  gradient.addColorStop(0, hexToRgba(style.colors.background, style.slide2.imageOpaqueTint));
  gradient.addColorStop(1, hexToRgba(style.colors.background, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

/** A small hand-drawn lightbulb -- dome + base + a knocked-out filament
 *  squiggle and screw-thread lines in the card's own background colour --
 *  replacing Slide 4's old decorative quote mark, per explicit founder
 *  direction ("try this today" reads as an idea/insight prompt, not a
 *  quotation). Drawn with plain Canvas2D primitives, same as every other
 *  icon in this file (the circular "AiA" badge, the eyebrow pill) --
 *  no icon font or external asset. `size` is the icon's overall height;
 *  (cx, cy) is its centre. */
function drawLightbulbIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  glyphColor: string,
  cardColor: string
): void {
  const r = size * 0.32;
  const headCy = cy - size * 0.09;

  ctx.fillStyle = glyphColor;
  ctx.beginPath();
  ctx.arc(cx, headCy, r, 0, Math.PI * 2);
  ctx.fill();

  const baseW = r * 1.15;
  const baseH = size * 0.24;
  const baseX = cx - baseW / 2;
  const baseY = headCy + r * 0.6;
  ctx.beginPath();
  ctx.roundRect(baseX, baseY, baseW, baseH, baseW * 0.18);
  ctx.fill();

  // Filament squiggle and screw-thread lines, knocked out of the shapes
  // above using the card's own background colour -- the detail that
  // actually reads as "bulb" rather than "circle on a box".
  ctx.strokeStyle = cardColor;
  ctx.lineCap = "round";

  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.32, headCy - r * 0.18);
  ctx.lineTo(cx + r * 0.12, headCy + r * 0.22);
  ctx.lineTo(cx - r * 0.08, headCy - r * 0.02);
  ctx.lineTo(cx + r * 0.32, headCy + r * 0.3);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, size * 0.035);
  ctx.beginPath();
  ctx.moveTo(baseX + baseW * 0.14, baseY + baseH * 0.35);
  ctx.lineTo(baseX + baseW * 0.86, baseY + baseH * 0.35);
  ctx.moveTo(baseX + baseW * 0.14, baseY + baseH * 0.65);
  ctx.lineTo(baseX + baseW * 0.86, baseY + baseH * 0.65);
  ctx.stroke();
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
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrides: { before?: string; question?: string; after?: string } | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const generated = splitQuotedAction(episode.todayAction);
  const before = overrides?.before || generated.before;
  const quoted = overrides?.question || generated.quoted;
  const after = overrides?.after || generated.after;
  let cursorY = startY;

  if (before) {
    const id = "slide3.before";
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    // Own size (emphasis.size), not the shared style.slide3.bodySize --
    // otherwise resizing this line would also resize the trailing line,
    // since both would be reading the same field.
    const beforeSize = px(emphasis.size ?? style.slide3.bodySize, width);
    ctx.textAlign = "left";
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(beforeSize)}px ${interFont}`;
    const lines = wrapText(ctx, before, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += beforeSize * style.layout.bodyLineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, frame.contentW, firstBaseline, cursorY, beforeSize, offset);
    cursorY += beforeSize * 1.2;
  }

  // Translucent glass-effect highlight panel, optionally with a small
  // decorative opening quote mark -- isolates the single actionable
  // question, which carries the strongest hierarchy here.
  const questionId = "slide3.question";
  const qOffset = posFor(positions, questionId);
  const qEmphasis = emphasisFor(emphases, questionId);
  const qStyle = styleFor(false, qEmphasis);
  const qWeight = weightFor(600, qEmphasis);
  const questionSize = px(qEmphasis.size ?? style.slide3.questionSize, width);
  const panelPadX = frame.contentW * style.slide3.panelPadX;
  const panelPadY = frame.contentW * style.slide3.panelPadY;
  ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${calSansFont}`;
  const quoteLines = wrapText(ctx, quoted, frame.contentW - panelPadX * 2);
  const quoteLineHeight = questionSize * 1.36;

  // Action-icon card (lightbulb) -- a small solid rounded-square badge
  // sitting above the question text, per the locked design correction
  // (replaces the earlier quote-mark glyph).
  const hasIcon = style.slide3.showActionIcon;
  const iconCardSize = frame.contentW * 0.1;
  const iconCardRadius = iconCardSize * 0.28;
  const iconCardGap = iconCardSize * 0.35;
  const iconCardBlock = hasIcon ? iconCardSize + iconCardGap : 0;
  const panelH = panelPadY * 2 + iconCardBlock + quoteLines.length * quoteLineHeight;
  const panelY = cursorY;
  const qx = frame.contentX + qOffset.dx;

  if (draw) {
    // No border stroke any more, per the locked design correction -- the
    // panel is now a solid fill only.
    ctx.fillStyle = style.colors.panelFill;
    ctx.beginPath();
    ctx.roundRect(qx, panelY + qOffset.dy, frame.contentW, panelH, frame.contentW * style.slide3.panelRadius);
    ctx.fill();

    if (hasIcon) {
      const cardX = qx + panelPadX;
      const cardY = panelY + qOffset.dy + panelPadY;
      ctx.fillStyle = style.colors.slide3IconCardBackground;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, iconCardSize, iconCardSize, iconCardRadius);
      ctx.fill();

      drawLightbulbIcon(
        ctx,
        cardX + iconCardSize / 2,
        cardY + iconCardSize / 2,
        iconCardSize * 0.62,
        style.colors.slide3IconColor,
        style.colors.slide3IconCardBackground
      );
    }

    ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${calSansFont}`;
    let qy = panelY + qOffset.dy + panelPadY + iconCardBlock + questionSize * 0.85;
    for (const line of quoteLines) {
      ctx.fillText(line, qx + panelPadX, qy);
      qy += quoteLineHeight;
    }
  }
  if (hotspots) {
    hotspots.push({ id: questionId, x: qx, y: panelY + qOffset.dy, width: frame.contentW, height: panelH });
  }

  // Generic spacing gap below the panel -- not tied to any one element's
  // own (possibly overridden) size, so it stays based on the shared style
  // field rather than "before" or "after"'s individual size.
  cursorY = panelY + panelH + px(style.slide3.bodySize, width) * 1.3;

  if (after) {
    const id = "slide3.after";
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    const afterSize = px(emphasis.size ?? style.slide3.bodySize, width);
    if (draw) ctx.fillStyle = style.colors.textPrimary;
    ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(afterSize)}px ${interFont}`;
    const lines = wrapText(ctx, after, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += afterSize * style.layout.bodyLineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw && cursorY <= frame.contentBottom) ctx.fillText(line, frame.contentX + offset.dx, cursorY + offset.dy);
    }
    pushHotspot(hotspots, id, frame.contentX, frame.contentW, firstBaseline, cursorY, afterSize, offset);
  }
  return cursorY;
}

/** "AiA · Save · Share" -- the headline's lead clause and trailing clause
 *  (split at an em dash) are two separately draggable/editable/sizable
 *  components (slide4.headline / slide4.support), alongside the already-
 *  separate connection line and CTA, per explicit founder direction that
 *  every field on this slide be independently editable. */
function drawSlide4Carry(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  episode: ComposedEpisode,
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrides: { headline?: string; support?: string } | undefined,
  hotspots?: CarouselHotspot[]
): number {
  const ctaEmphasisForSize = emphasisFor(emphases, "slide4.cta");
  const ctaSize = px(ctaEmphasisForSize.size ?? style.slide4.ctaSize, width);
  let cursorY = startY;
  const headlineStartY = cursorY;

  // The main statement gets the premium editorial (Cal Sans heading)
  // treatment -- the strongest typography on this slide. Split at an em
  // dash when present so the first clause can read heavier than the rest,
  // matching the approved benchmark's shape. The trailing "—" is baked
  // into generatedLead itself (not appended separately at render time),
  // so it's a real, editable/removable character in the in-canvas
  // textbox -- not a render-only artifact the user could see but never
  // actually edit out.
  const generatedSplit = episode.aiaConnection.split(" — ");
  const generatedLeadClause = generatedSplit[0];
  const generatedRest = generatedSplit.slice(1).join(" — ");
  const generatedLead = generatedRest ? `${generatedLeadClause} —` : generatedLeadClause;
  const lead = overrides?.headline || generatedLead;
  const rest = overrides?.support || generatedRest;

  const leadId = "slide4.headline";
  const leadOffset = posFor(positions, leadId);
  const leadEmphasis = emphasisFor(emphases, leadId);
  const heroSize = px(leadEmphasis.size ?? style.slide4.heroSize, width);

  ctx.textAlign = "left";
  if (draw) ctx.fillStyle = style.colors.calSansText;
  ctx.font = `${styleFor(false, leadEmphasis)} ${weightFor(600, leadEmphasis)} ${Math.round(heroSize)}px ${calSansFont}`;
  const leadLines = wrapText(ctx, lead, frame.contentW);
  const leadLineHeight = heroSize * 1.22;
  for (const line of leadLines) {
    cursorY += leadLineHeight;
    if (draw) ctx.fillText(line, frame.contentX + leadOffset.dx, cursorY + leadOffset.dy);
  }
  pushHotspot(hotspots, leadId, frame.contentX, frame.contentW, headlineStartY + heroSize, cursorY, heroSize, leadOffset);

  if (rest) {
    const supportId = "slide4.support";
    const supportOffset = posFor(positions, supportId);
    const supportEmphasis = emphasisFor(emphases, supportId);
    const supportSize = px(supportEmphasis.size ?? style.slide4.supportSize, width);
    cursorY += leadLineHeight * 0.25;
    // Same colour as the headline (calSansText) now, not textSecondary --
    // per the locked design correction.
    if (draw) ctx.fillStyle = style.colors.calSansText;
    ctx.font = `${styleFor(false, supportEmphasis)} ${weightFor(400, supportEmphasis)} ${Math.round(supportSize)}px ${interFont}`;
    const lines = wrapText(ctx, rest, frame.contentW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += supportSize * style.layout.bodyLineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + supportOffset.dx, cursorY + supportOffset.dy);
    }
    pushHotspot(hotspots, supportId, frame.contentX, frame.contentW, firstBaseline, cursorY, supportSize, supportOffset);
  }

  // No divider line any more, per the locked design correction -- the gap
  // itself carries the separation before the CTA below.
  cursorY += frame.contentW * 0.2;

  if (episode.distantDevotionConnection) {
    const connectionId = "slide4.connection";
    const connectionEmphasis = emphasisFor(emphases, connectionId);
    const connectionSize = px(connectionEmphasis.size ?? style.slide4.supportSize, width);
    // Same colour as the headline (calSansText) now, not textSecondary --
    // per the locked design correction, same change as the support line.
    if (draw) ctx.fillStyle = style.colors.calSansText;
    ctx.font = `${styleFor(false, connectionEmphasis)} ${weightFor(400, connectionEmphasis)} ${Math.round(connectionSize)}px ${interFont}`;
    const lines = wrapText(ctx, episode.distantDevotionConnection, frame.contentW);
    const connectionOffset = posFor(positions, connectionId);
    let connectionFirst = 0;
    for (const line of lines) {
      cursorY += connectionSize * style.layout.bodyLineHeight;
      if (connectionFirst === 0) connectionFirst = cursorY;
      if (draw) ctx.fillText(line, frame.contentX + connectionOffset.dx, cursorY + connectionOffset.dy);
    }
    pushHotspot(hotspots, connectionId, frame.contentX, frame.contentW, connectionFirst, cursorY, connectionSize, connectionOffset);
    cursorY += frame.contentW * 0.06;
  }

  // CTA -- no icon, no decorative graphic. Muted, not bright accent green
  // -- the headline already carries the slide's emphasis. Same locked grey
  // as Slide 1's tagline (slide0TaglineText), not textSecondary, per the
  // locked design correction.
  if (draw) ctx.fillStyle = style.colors.slide0TaglineText;
  ctx.font = `${styleFor(false, ctaEmphasisForSize)} ${weightFor(700, ctaEmphasisForSize)} ${Math.round(ctaSize)}px ${interFont}`;
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
  canvasHeight: number,
  episode: ComposedEpisode,
  slideIndex: number,
  tamilFont: string,
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  text: CarouselTextOverrides | undefined,
  hotspots?: CarouselHotspot[],
  hasImage?: boolean,
  invertColors?: boolean
): number {
  switch (slideIndex) {
    case 0:
      return drawSlide0Stop(
        ctx,
        style,
        frame,
        width,
        canvasHeight,
        episode,
        tamilFont,
        interFont,
        calSansFont,
        startY,
        draw,
        positions,
        emphases,
        hotspots,
        Boolean(invertColors)
      );
    case 1:
      return drawSlide1Understand(ctx, style, frame, width, canvasHeight, episode, tamilFont, interFont, calSansFont, startY, draw, positions, emphases, hotspots);
    case 2:
      return drawSlide2Family(
        ctx,
        style,
        frame,
        width,
        episode,
        interFont,
        calSansFont,
        startY,
        draw,
        positions,
        emphases,
        text?.slide2?.paragraphs,
        hotspots,
        hasImage
      );
    case 3:
      return drawSlide3Action(ctx, style, frame, width, episode, interFont, calSansFont, startY, draw, positions, emphases, text?.slide3, hotspots);
    case 4:
    default:
      return drawSlide4Carry(
        ctx,
        style,
        frame,
        width,
        episode,
        interFont,
        calSansFont,
        startY,
        draw,
        positions,
        emphases,
        text?.slide4,
        hotspots
      );
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
  const { width, height, slideIndex, tamilFont, interFont, calSansFont } = opts;
  const style = resolveStyle(opts.design?.style, opts.design?.invertColors);
  const episode = applyTextOverrides(opts.episode, opts.design?.text);
  const frame = computeFrame(style, width, height, slideIndex);
  const positions = opts.design?.positions;
  const emphases = opts.design?.emphases;
  const text = opts.design?.text;
  const hotspots: CarouselHotspot[] = [];

  drawSurface(ctx, width, height, style.colors);
  if (slideIndex === 1) {
    // Full-bleed white page, replacing the usual dark/white field -- the
    // outer of Slide 2's three nested cards (drawSlide1Understand draws
    // the other two) sits on top of this. See
    // CarouselColors.slide1PageBackground/slide1OuterCardBackground. Its
    // bottom edge is clamped to frame.contentBottom so it never covers
    // the footer lockup every slide still draws below that line, even
    // though the 60px bottom margin alone would, on most formats, land
    // well past it.
    ctx.fillStyle = style.colors.slide1PageBackground;
    ctx.fillRect(0, 0, width, height);
    const outerMarginX = px(style.slide1.outerCardMarginX, width);
    const outerMarginTop = px(style.slide1.outerCardMarginTop, width);
    const outerMarginBottom = px(style.slide1.outerCardMarginBottom, width);
    const outerBottom = Math.min(height - outerMarginBottom, frame.contentBottom);
    // Visual-only nudge, same convention as every other draggable
    // hotspot -- the green/black cards nested on top still anchor to the
    // unoffset margins (recomputed independently in drawSlide1Understand).
    const outerCardOffset = posFor(positions, "slide1.outerCard");
    ctx.fillStyle = style.colors.slide1OuterCardBackground;
    ctx.beginPath();
    ctx.roundRect(
      outerMarginX + outerCardOffset.dx,
      outerMarginTop + outerCardOffset.dy,
      width - outerMarginX * 2,
      outerBottom - outerMarginTop,
      px(32, width)
    );
    ctx.fill();
    hotspots.push({
      id: "slide1.outerCard",
      x: outerMarginX + outerCardOffset.dx,
      y: outerMarginTop + outerCardOffset.dy,
      width: width - outerMarginX * 2,
      height: outerBottom - outerMarginTop,
    });
  }
  if (slideIndex === 2 && opts.familyImage) {
    drawSlide2BackgroundPhoto(ctx, style, width, height, opts.familyImage);
  }
  if (slideIndex === 0 && opts.design?.invertColors) {
    drawSlide0HeroPanel(ctx, style, width, height);
  }

  ctx.textBaseline = "alphabetic";

  const measuredEndY = layoutSlide(
    ctx,
    style,
    frame,
    width,
    height,
    episode,
    slideIndex,
    tamilFont,
    interFont,
    calSansFont,
    frame.contentTop,
    false,
    positions,
    emphases,
    text,
    undefined,
    Boolean(opts.familyImage),
    opts.design?.invertColors
  );
  const contentHeight = measuredEndY - frame.contentTop;
  const available = frame.contentBottom - frame.contentTop;
  const slack = Math.max(0, available - contentHeight);
  const balancedStartY = frame.contentTop + slack * style.layout.verticalBalanceBias;

  drawHeader(ctx, style, frame, width, height, slideIndex, calSansFont, positions, emphases, hotspots);

  layoutSlide(
    ctx,
    style,
    frame,
    width,
    height,
    episode,
    slideIndex,
    tamilFont,
    interFont,
    calSansFont,
    balancedStartY,
    true,
    positions,
    emphases,
    text,
    hotspots,
    Boolean(opts.familyImage),
    opts.design?.invertColors
  );

  drawFooterLockup(ctx, style, frame, width, height, calSansFont, interFont, opts, positions, emphases, hotspots);

  return hotspots;
}

export async function renderAathichoodiCarouselSlideForExport(
  episode: ComposedEpisode,
  slideIndex: number,
  logoImage: HTMLImageElement | null,
  format: { width: number; height: number; branding: boolean },
  fonts: { tamilSerifFont: string; tamilFont: string; interFont: string; calSansFont: string },
  brandingWordmark?: string,
  brandingHandle?: string,
  design?: CarouselDesignOverrides,
  familyImage?: HTMLImageElement | null
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
    familyImage,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
    design,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
