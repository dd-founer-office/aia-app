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
import { LANGUAGE_CATEGORY_LABELS } from "./aathichoodi/canon";
import { drawLivingLanguageField, drawGlyphGridField, extractTamilGraphemes } from "./ambient-language-layer";
import { createSeededRandom } from "./seeded-random";
import { drawLivingThread, type LivingThreadLayer, type LTSurfaceType } from "./living-thread";

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
  /** The 3-category ("Language Beliefs/Practices/Management") pill row
   *  above Slide 4's panel, per the Figma file's own update -- one pill
   *  per episode's episode.languageCategory is shown "active" (filled),
   *  the other two stay outlined. Not mode-dependent, same reasoning as
   *  every other slide3* colour here (this slide's own light panel
   *  doesn't change with invertColors). */
  tagPillInactiveBackground: string;
  tagPillInactiveBorder: string;
  tagPillInactiveText: string;
  tagPillActiveBackground: string;
  tagPillActiveBorder: string;
  tagPillActiveText: string;
  /** Slide 5's own inline "PRACTICES"-style category pill (distinct
   *  component from Slide 4's tagPill row above -- see Slide4Style.
   *  showLanguagePill's own doc comment), per the Figma file's later
   *  update (node 12:46): bright yellow fill, dark text in LIGHT mode.
   *  Inverted in dark mode per the founder's dark-mode Figma pass (dark
   *  teal fill, mint text) -- genuinely mode-dependent now, despite the
   *  "not mode-dependent" claim this doc comment originally made. */
  languagePillBackground: string;
  languagePillText: string;
  /** Slide 5 (Carry It Forward)'s own bottom "sheet" band -- mint in light
   *  mode (the look built first, see drawSlide4Carry's own doc comment),
   *  dark teal in dark mode per the founder's dark-mode Figma pass
   *  (node 12:46's later dark variant) -- i.e. the OPPOSITE pairing from
   *  slide1GreenCardBackground's own light/dark values, so it needs its
   *  own dedicated token rather than reusing that one. slide4BandText is
   *  the Tamil line/CTA copy colour drawn on top of it, inverted to
   *  match (dark teal on the light-mode mint band, white on the dark-mode
   *  teal band). */
  slide4BandBackground: string;
  slide4BandText: string;
  /** Slide 5's OPTIONAL distantDevotionConnection support line (shown
   *  under the main aiaConnection headline only when that field is set) --
   *  muted grey in light mode, white in dark mode per the founder's dark-
   *  mode Figma pass. Its own token rather than reusing
   *  slide1ExplanationMutedText (which stays flat muted-grey in both
   *  modes everywhere else it's used) or slide1ExplanationText (whose
   *  dark-mode value is white but whose light-mode value is black, not
   *  muted grey). */
  slide4ConnectionText: string;
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
  /** The innermost of Slide 2's three nested cards -- a near-black panel
   *  (not pure black -- see slide1CardBorder) inset within
   *  slide1GreenCardBackground, holding the reading board and message
   *  panel as one unified card (per the Figma mockup's own node: a single
   *  fill, not two stacked panels with different backgrounds). */
  slide1CardBackground: string;
  /** slide1CardBackground's 1px stroke -- the Figma mockup draws this
   *  card with a subtle lighter-grey border (plus a drop shadow this file
   *  doesn't reproduce, canvas shadows being a much heavier effect for a
   *  1px-equivalent blur than CSS's). */
  slide1CardBorder: string;
  /** Slide 2's Tamil line and its romanized reading -- both plain white
   *  against slide1CardBackground. Distinct from slide0HeroHighlightText/
   *  slide0EyebrowText (also white) only in that this is Slide 2's, not
   *  Slide 1's -- kept as its own field per this file's one-field-per-
   *  element convention. */
  slide1CardText: string;
  /** The small rounded-square badge sitting above slide1GreenCardBackground,
   *  left-aligned to its edge -- holds the manuscript icon. White
   *  background at 80% opacity (per the Figma mockup -- baked into the
   *  rgba value here rather than a separate globalAlpha call), dark teal
   *  icon (slide1IconBadgeIconColor). */
  slide1IconBadgeBackground: string;
  /** The manuscript icon's own colour inside slide1IconBadgeBackground
   *  above -- dark teal, for contrast against the white badge. */
  slide1IconBadgeIconColor: string;
  /** Slide 2's "explanation" copy (the Avvaiyar's-wisdom paragraph) and
   *  the equivalent primary headline/question text on Slide 3/4/5 (Family
   *  Situation's scenario headline, Ask-Your-Child's question, Carry-It-
   *  Forward's aiaConnection headline is NOT this one -- see
   *  slide1ExplanationIntroText below) -- black in light mode, per the
   *  founder's dark-mode Figma pass now genuinely white in dark mode (NOT
   *  flat across modes any more, despite this field's own name/doc
   *  history suggesting otherwise). */
  slide1ExplanationText: string;
  /** The smaller "accent label" role that sits ABOVE slide1ExplanationText
   *  in the same slides (Slide 2's own "Avvaiyar puts it plainly:" intro
   *  line, Slide 4's "ASK YOUR CHILD TODAY" label) -- and, on the slides
   *  with no separate label at all, the role the single headline itself
   *  plays (Slide 3/Family Situation's scenario headline, Slide 5/Carry-
   *  It-Forward's aiaConnection headline). Black in light mode (same as
   *  slide1ExplanationText there -- the two are visually identical in
   *  light mode, this is a separate field only because dark mode splits
   *  them), mint in dark mode per the founder's dark-mode Figma pass. */
  slide1ExplanationIntroText: string;
  /** The muted grey used for BOTH the message panel's copy inside the
   *  black card and the explanation's last (supporting) paragraph below
   *  it -- the Figma mockup uses the identical value in both places. */
  slide1ExplanationMutedText: string;
  /** The "Pass It On" pill inside Slide 2's black card -- mint fill, dark
   *  text (this app's usual pill convention: dark fill/mint text, run in
   *  reverse here since the fill already sits on a dark card). */
  slide1CtaPillBackground: string;
  slide1CtaPillText: string;
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
  /** The dark-mode-only "See How" CTA pill under the tagline (per the
   *  founder's dark-mode Figma pass) -- font size only, same mint-pill/
   *  dark-teal-text treatment as slide1's "Pass It On" pill. Not shown in
   *  light mode, which has no button in the Figma source. */
  ctaSize: number;
}
export interface Slide1Style {
  /** The black card's static tagline ("Some words deserve to travel from
   *  your voice to theirs.") -- fixed design-system copy, the same for
   *  every episode, not generated per-episode content, but still founder-
   *  editable here like every other style field. Field names kept from
   *  this slide's previous "WHAT DOES THIS MEAN?" pill (which this
   *  replaced) to avoid an unrelated schema rename. */
  sectionHeadingText: string;
  sectionHeadingSize: number;
  tamilRefSize: number;
  transliterationSize: number;
  meaningSize: number;
  /** The explanation's 3 parts (episode.understanding, split via
   *  splitEditorialParagraphs) each get their own size now, matching the
   *  Figma mockup's own type scale -- a small intro, a large headline-
   *  style middle paragraph, and a smaller muted supporting paragraph.
   *  bodySize is the supporting paragraph's, kept under its original name
   *  since it's the one that existed before this split. */
  explanationIntroSize: number;
  explanationHeroSize: number;
  bodySize: number;
  /** The "Pass It On" CTA pill inside the black card. */
  ctaSize: number;
  /** Insets (reference px, same scale as every other size field here) for
   *  the three nested cards drawSlide1Understand/renderAathichoodiCarouselSlide
   *  draw -- see the "Outer card bounds"/"Gap between..." comments at each
   *  card's draw site for what each one measures. Click-and-drag resize
   *  (PublishingWorkspace.tsx's slide1.outerCard/greenCard/blackCard
   *  hotspots) shrinks a margin as its card is dragged bigger, so these
   *  are the one case where a hotspot's sizeField is declared `invert`.
   *  greenCardMarginTop is no longer "outer-card-top to green-card-top"
   *  (the icon badge now sits in its own non-overlapping flow slot above
   *  the green/main card, not notched into it) -- it's the gap between
   *  the icon badge's own bottom edge and the green/main card's top. */
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
  /** No longer drawn (see headerMetrics' hasEyebrow/sectionHeadingFor) --
   *  the Figma redesign (file H9LpyoKvzC5UanyL360JLs, node 7:3) has no
   *  eyebrow or section heading on this slide at all, same as Slide 2
   *  (UNDERSTAND). Left defined rather than removed so a stale style
   *  override a browser saved before this change doesn't error; both
   *  fields are simply inert now. */
  sectionHeadingText: string;
  sectionHeadingSize: number;
  /** The supporting (second) paragraph's size -- Inter Medium, muted. The
   *  headline (first) paragraph has its own field, headlineSize, since
   *  the two are deliberately different type scales (see drawSlide2Family). */
  bodySize: number;
  /** The headline paragraph's size -- Cal Sans, black, the dominant text
   *  on this slide (per the Figma spec: 40px/2.16px tracking at 1080
   *  reference scale). */
  headlineSize: number;
  /** This slide's own pale outer card -- same pattern as Slide 2's
   *  (slide1.outerCardMarginX/Top/Bottom) but independently adjustable,
   *  since each slide gets its own sidebar section. */
  outerCardMarginX: number;
  outerCardMarginTop: number;
  outerCardMarginBottom: number;
  /** The dark teal card nested inside the outer card, holding the family
   *  photo -- cardMarginX/Top inset it from the outer card's edges (X
   *  mirrors Slide 2's greenCardMarginX convention; Top replaces that
   *  slide's icon-badge-driven offset, since this card has no badge above
   *  it). The card's BOTTOM is content-driven from the photo's own height
   *  plus photoMarginBottom, same "compute bottom-up" pattern as Slide 2's
   *  black card. */
  cardMarginX: number;
  cardMarginTop: number;
  /** The photo itself sits flush with the teal card's TOP (no inset there
   *  -- per the Figma spec, it's cropped square into the card's rounded
   *  top corners) but inset by photoMarginX on the sides and
   *  photoMarginBottom underneath. photoHeight is the photo's own
   *  rendered height (reference px, 1080 scale) -- a deliberate design
   *  choice (how much of the card the photo fills), not derived from the
   *  uploaded image's own aspect ratio; the image is cropped to fill it
   *  via the same object-cover scaling Slide 2's old full-bleed photo
   *  used. */
  photoMarginX: number;
  photoMarginBottom: number;
  photoHeight: number;
}
export interface Slide3Style {
  /** The 3-category tag-pill row ("Language Beliefs/Practices/Management"),
   *  drawn above the panel -- per the Figma file's own later update (node
   *  9:26), read directly off its dev-mode inspector: 3 pills at x=90/315/
   *  544 (1080-reference scale), y=184, each 175x57 with an 8px radius.
   *  One pill (episode.languageCategory) is shown active/filled; episodes
   *  without that field set skip this row entirely (see drawSlide3Action).
   *  tagRowX holds each pill's literal left edge rather than a margin +
   *  uniform gap -- the Figma spec's own gaps aren't quite uniform (50px,
   *  then 54px), and three literal positions are simpler and more exact
   *  than reverse-engineering a formula from them. */
  showTagRow: boolean;
  tagRowY: number;
  tagRowX: readonly [number, number, number];
  tagRowPillW: number;
  tagRowPillH: number;
  tagRowPillRadius: number;
  tagRowTextSize: number;
  /** Now drawn directly by drawSlide3Action itself (black, Inter
   *  SemiBold, no eyebrow pill above it -- see headerMetrics' hasEyebrow)
   *  instead of the generic drawHeader heading mechanism every other
   *  slide's heading still goes through -- per the Figma redesign (file
   *  H9LpyoKvzC5UanyL360JLs, node 9:26), a fixed design-system label
   *  ("ASK YOUR CHILD TODAY"), not derived from the episode's own
   *  generated todayAction text (that varies too much in length/shape
   *  across episodes to carry this slide's single dominant heading).
   *  Per the Figma file's later update, this heading now lives INSIDE the
   *  panel's own bottom-up content stack (between the icon and the
   *  question) instead of as a page-level element above it -- its
   *  position is no longer its own headingMarginX/headingMarginTop (its
   *  new Figma x, 148, is simply panelMarginX + panelPadX, confirming the
   *  move into the panel's existing content flow; see drawSlide3Action). */
  sectionHeadingText: string;
  sectionHeadingSize: number;
  /** The supporting ("after") line's size -- Inter Medium, muted. The
   *  question ("quoted") has its own field, questionSize, since the two
   *  are deliberately different type scales. splitQuotedAction's "before"
   *  segment is no longer drawn at all in this design -- the fixed
   *  heading above replaces its role. */
  bodySize: number;
  questionSize: number;
  /** The light panel's own margin from the canvas edge (independent of
   *  the generic frame margin every other slide's body text uses) and its
   *  own internal padding -- same self-contained "literal 1080-reference
   *  px" pattern as Slide 2/Slide 3's cards, not a fraction of frame.contentW
   *  the way these fields worked before this redesign. The panel's HEIGHT
   *  is content-driven bottom-up from the icon + question + supporting
   *  line, same pattern as those slides' cards, not the Figma spec's
   *  literal 575px (episodes vary too much in copy length to hardcode it). */
  panelMarginX: number;
  panelMarginTop: number;
  panelPadX: number;
  panelPadY: number;
  panelRadius: number;
  /** Shows the small action-icon card above the question text -- a
   *  hand-drawn lightbulb, not the quote mark this used to be. */
  showActionIcon: boolean;
}
export interface Slide4Style {
  /** The whole generated aiaConnection statement, centered, as ONE Cal
   *  Sans headline -- not split into a heavier lead clause and a lighter
   *  trailing one the way this slide used to render it (see
   *  CarouselTextOverrides.slide4's own doc comment). */
  heroSize: number;
  headlineMarginTop: number;
  headlineMarginX: number;
  /** distantDevotionConnection's own size, when that optional field is
   *  set -- positioned between the headline and the band below. */
  supportSize: number;
  /** The CTA copy's size -- now drawn INSIDE the mint band (see
   *  bandMarginTop and friends), not as a plain line below the headline. */
  ctaSize: number;
  /** episode.tamilText's size inside the band -- this slide shows the
   *  canonical Tamil line again (Noto Sans Tamil SemiBold), same as
   *  Slide 2 (UNDERSTAND). */
  tamilSize: number;
  /** The mint "sheet" band itself (Figma: #68FFAD, same token as the
   *  slide1CtaPillBackground color) -- full canvas width, rounded only at
   *  the top corners, anchored to the canvas BOTTOM edge (not a content-
   *  driven height the way Slide 2/Slide 3's cards are -- the Figma
   *  source shows this band always filling the remaining space below
   *  bandMarginTop regardless of content length, like a bottom sheet).
   *  bandPadX is the Tamil line's own left inset within it; bandPadTop is
   *  the gap from the band's top edge to the Tamil line. The band itself
   *  is dark teal now, not mint (see CarouselColors.slide1GreenCardBackground,
   *  reused here -- same value, new meaning) -- per the Figma file's later
   *  update (node 12:46), which also turned the Tamil line and CTA copy
   *  white (slide1CardText, also reused) to match. */
  bandMarginTop: number;
  bandPadX: number;
  bandPadTop: number;
  brandNameSize: number;
  handleSize: number;
  showBranding: boolean;
  /** The CTA copy's own left inset (and, symmetrically, its wrap margin on
   *  the right) -- its own field because the Figma file's update put it at
   *  a different x (136) than the Tamil line's bandPadX (182) above it. */
  ctaPadX: number;
  /** Small "PRACTICES"-style category pill, inline immediately after the
   *  CTA copy's own last line -- per the Figma file's later update (node
   *  12:46), read directly off its dev-mode inspector: bright yellow fill
   *  (languagePillBackground), Inter Bold 20px dark text (languagePillText
   *  -- the file's own value, #0a3a6a, is almost certainly the same
   *  transposed-digit typo as #0A363A elsewhere in this project; treated
   *  as that color here), 8px corner radius. Text is the bare category
   *  word, uppercased ("PRACTICES", not "Language Practices" -- distinct
   *  from Slide 4's own 3-pill selector, a different component). Sized to
   *  its own text rather than the Figma file's literal 129x39 (that's
   *  specific to "PRACTICES"; other categories are shorter/longer words).
   *  Only drawn when episode.languageCategory is set (every episode except
   *  22, for now -- see canon.ts). Wraps to its own line below the CTA
   *  text when the last line has no room left for it. */
  showLanguagePill: boolean;
  pillTextSize: number;
  pillPadX: number;
  pillPadY: number;
  pillRadius: number;
  pillGap: number;
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
  /** `understanding` is a bulk override -- replaces the whole generated
   *  string before it's split into its 3-paragraph editorial shape (see
   *  splitEditorialParagraphs). `paragraphs` then overrides individual
   *  paragraphs on top of that split, by index -- each paragraph (intro/
   *  hero line/supporting line) is its own separately draggable/editable
   *  text box (see drawSlide1Understand), same pattern as slide2 below. */
  slide1?: { understanding?: string; paragraphs?: string[] };
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

/** Safety net for Slide 1's nested-card margins (drawSlide1Understand) --
 *  these come straight from editable style fields (click-drag resize AND
 *  the sidebar's free-typed NumField, which has no min/max of its own), so
 *  an extreme value can otherwise collapse a card's content area to zero
 *  or negative. That doesn't just look wrong: a non-positive wrap width
 *  makes the text-layout helpers produce zero lines, so pushHotspot never
 *  fires and the text silently disappears instead of just rendering
 *  oddly -- same for the icon badge if the green card around it collapses
 *  first. Clamps a single symmetric inset (applied to both sides of
 *  `available`) so the remaining space never drops below the ABSOLUTE
 *  `minSize` (already in canvas px, same scale as `available`/`inset` --
 *  pass it through px() at the call site) -- an absolute floor, not a
 *  fraction of `available`, since a fraction compounds badly across 3
 *  nested levels: if a parent card already got clamped down near its own
 *  floor, "15% of that" for the next level in is nowhere near enough. */
function clampInset(inset: number, available: number, minSize: number): number {
  const maxInset = Math.max(0, (available - minSize) / 2);
  return Math.min(Math.max(0, inset), maxInset);
}

/** Same safety net as clampInset, for an asymmetric top+bottom (or
 *  left+right) pair -- scales both down together, preserving whichever
 *  side was set larger, instead of clamping each independently and
 *  quietly erasing the designed asymmetry (e.g. the green card's
 *  deliberately bigger top margin for the icon badge). */
function clampInsetPair(a: number, b: number, available: number, minSize: number): [number, number] {
  const clampedA = Math.max(0, a);
  const clampedB = Math.max(0, b);
  const maxSum = Math.max(0, available - minSize);
  const sum = clampedA + clampedB;
  if (sum <= maxSum || sum <= 0) return [clampedA, clampedB];
  const scale = maxSum / sum;
  return [clampedA * scale, clampedB * scale];
}

// Reference px (1080-scale, same as every other size field) -- absolute
// floors clampInset enforces for the outer/green cards' WIDTH and the
// black card's width (drawSlide1Understand). The outer and green cards'
// own HEIGHT no longer needs a floor here: the black card's height (and
// so the green/outer cards wrapping it) is now computed bottom-up from
// its actual content -- so nothing in this chain can collapse to
// zero/negative the way an independently-set, container-driven margin
// could.
const MIN_OUTER_CARD_SIZE = 500;
const MIN_GREEN_CARD_SIZE = 450;
const MIN_BLACK_CARD_W = 200;

// Fallback pools for Slide 2's living-language layer (see
// drawSlide1Understand) -- only used if episode.tamilText/understanding
// ever came through completely empty, which shouldn't happen for a real
// canon.ts entry but keeps the field from rendering blank the same way
// aathichoodi-renderer.ts's own FALLBACK_GLYPHS does for the static cover.
const FALLBACK_AMBIENT_GLYPHS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"];

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
    // White in dark mode, per explicit founder direction (image reference:
    // the question itself reads white, bold -- only the tagline underneath
    // stays muted grey). Light mode (#000000, INVERTED_COLORS) unchanged.
    slide0HookText: "#FFFFFF",
    slide0EyebrowText: "#FFFFFF",
    slide1PageBackground: "#FFFFFF",
    // Dark-mode values below per the founder's dark-mode Figma pass
    // (5-slide "Dark" frame set) -- Slides 2-5 previously had no real dark
    // variant at all (their page background was unconditionally painted
    // white regardless of invertColors; see renderAathichoodiCarouselSlide's
    // own slideIndex===1/2/3/4 blocks). This is the first pass where these
    // tokens' DEFAULT_STYLE (dark) and INVERTED_COLORS (light) values
    // genuinely diverge instead of just being the same value duplicated in
    // both places pending a dark design that didn't exist yet.
    slide1OuterCardBackground: "#062023",
    slide1GreenCardBackground: "#0A363A",
    slide1CardBackground: "#134A45",
    slide1CardBorder: "#68FFAD",
    slide1CardText: "#FFFFFF",
    slide1IconBadgeBackground: "#68FFAD",
    slide1IconBadgeIconColor: "#0A363A",
    slide1ExplanationText: "#FFFFFF",
    slide1ExplanationIntroText: "#68FFAD",
    slide1ExplanationMutedText: "#788485",
    slide1CtaPillBackground: "#68FFAD",
    slide1CtaPillText: "#0A363A",
    slide3IconCardBackground: "#68FFAD",
    slide3IconColor: "#0A363A",
    tagPillInactiveBackground: "#0A363A",
    tagPillInactiveBorder: "#335356",
    tagPillInactiveText: "#788485",
    tagPillActiveBackground: "#000000",
    tagPillActiveBorder: "#000000",
    tagPillActiveText: "#FFFFFF",
    languagePillBackground: "#0A363A",
    languagePillText: "#68FFAD",
    slide4BandBackground: "#68FFAD",
    slide4BandText: "#0A363A",
    slide4ConnectionText: "#FFFFFF",
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
    // Matches style.slide1.ctaSize (the "Pass It On" pill) -- per explicit
    // founder direction that the two buttons be the same size.
    ctaSize: 20,
  },
  // Every value below is read directly off the Figma dev-mode inspector
  // (file H9LpyoKvzC5UanyL360JLs, node 1:3) -- that file's own frame is
  // 1080px wide, the same reference width px() scales against here, so
  // these translate 1:1 with no unit conversion.
  slide1: {
    sectionHeadingText: "Some words deserve to travel from your voice to theirs.",
    sectionHeadingSize: 26,
    tamilRefSize: 30,
    transliterationSize: 30,
    // Matches slide2.bodySize (Family Situation's content) -- locked
    // design correction, now that this line is set in Cal Sans.
    meaningSize: 32,
    explanationIntroSize: 36,
    explanationHeroSize: 54,
    bodySize: 34,
    ctaSize: 20,
    outerCardMarginX: 30,
    outerCardMarginTop: 30,
    outerCardMarginBottom: 30,
    greenCardMarginX: 54,
    // Icon-badge-bottom to main-card-top gap now (see the field's own doc
    // comment on Slide1Style) -- much smaller than the old "outer-card-
    // top to green-card-top" gap this used to measure.
    greenCardMarginTop: 54,
    // The whole green-to-black gap is blackCardMarginBottom alone now
    // (matches Figma's actual nesting -- green wraps black with one
    // gap, not two stacked ones), so this stays 0.
    greenCardMarginBottom: 0,
    blackCardMarginX: 160,
    blackCardMarginTop: 80,
    blackCardMarginBottom: 80,
  },
  slide2: {
    sectionHeadingText: "IT HAPPENS AT HOME",
    sectionHeadingSize: 24,
    bodySize: 34,
    headlineSize: 40,
    outerCardMarginX: 30,
    outerCardMarginTop: 30,
    outerCardMarginBottom: 30,
    cardMarginX: 54,
    cardMarginTop: 54,
    photoMarginX: 90,
    photoMarginBottom: 90,
    photoHeight: 749,
  },
  slide3: {
    showTagRow: true,
    tagRowY: 184,
    tagRowX: [90, 315, 544],
    tagRowPillW: 175,
    tagRowPillH: 57,
    tagRowPillRadius: 8,
    tagRowTextSize: 22,
    sectionHeadingText: "ASK YOUR CHILD TODAY",
    sectionHeadingSize: 40,
    bodySize: 34,
    questionSize: 54,
    panelMarginX: 76,
    panelMarginTop: 276,
    panelPadX: 72,
    panelPadY: 72,
    panelRadius: 24,
    showActionIcon: true,
  },
  slide4: {
    heroSize: 54,
    headlineMarginTop: 321,
    headlineMarginX: 136,
    supportSize: 25,
    ctaSize: 40,
    tamilSize: 54,
    bandMarginTop: 707,
    bandPadX: 182,
    bandPadTop: 95,
    ctaPadX: 136,
    brandNameSize: 22,
    handleSize: 17,
    // Restored per explicit founder direction (the Figma mockup's own
    // bottom edge left no visible room for it, but the founder wants the
    // same logo lockup Slide 1 has back on this slide too) -- it now sits
    // on top of the band (drawFooterLockup draws after drawSlide4Carry).
    // Mint badge background + white wordmark/handle text, per explicit
    // founder direction once the band itself turned dark teal (see
    // drawFooterLockup's own isSlide4 branch) -- mint-on-mint had no
    // contrast at all, confirmed live.
    showBranding: true,
    showLanguagePill: true,
    pillTextSize: 20,
    pillPadX: 16,
    pillPadY: 10,
    pillRadius: 8,
    pillGap: 16,
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
  textSecondary: "#0A363A",
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
  slide1CardBackground: "#222226",
  slide1CardBorder: "#3A3A3A",
  slide1CardText: "#FFFFFF",
  slide1IconBadgeBackground: "rgba(255, 255, 255, 0.8)",
  slide1IconBadgeIconColor: "#0A363A",
  slide1ExplanationText: "#000000",
  slide1ExplanationIntroText: "#000000",
  slide1ExplanationMutedText: "#788485",
  slide1CtaPillBackground: "#68FFAD",
  slide1CtaPillText: "#0A363A",
  slide3IconCardBackground: "rgba(255, 255, 255, 0.8)",
  slide3IconColor: "#0A363A",
  tagPillInactiveBackground: "#FFFFFF",
  tagPillInactiveBorder: "#000000",
  tagPillInactiveText: "#788485",
  tagPillActiveBackground: "#000000",
  tagPillActiveBorder: "#000000",
  tagPillActiveText: "#FFFFFF",
  languagePillBackground: "#FFF267",
  languagePillText: "#0A363A",
  slide4BandBackground: "#0A363A",
  slide4BandText: "#FFFFFF",
  slide4ConnectionText: "#788485",
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

/** Display order for the carousel -- per explicit founder direction: Stop,
 *  Family Situation, Today's Action, Understand, Share/CTA, instead of the
 *  slide0..slide4 order every internal name/field/hotspot-id/style-key/
 *  override-store-key above is still keyed by. Each entry is the INTERNAL
 *  slideIndex (0=Stop, 1=Understand, 2=Family Situation, 3=Today's Action,
 *  4=AiA/CTA) to show at that DISPLAY position -- so CAROUSEL_SLIDE_ORDER[2]
 *  is the internal slideIndex shown third. Deliberately NOT a rename of
 *  slide0Style/slide1Style/.../drawSlide0Stop/drawSlide1Understand/etc:
 *  every one of those, plus every saved CarouselPositions/
 *  CarouselTextEmphases/CarouselTextOverrides key and every "slideN.xxx"
 *  hotspot id, is keyed by a slide's own CONTENT identity (what it draws),
 *  not its position in the sequence -- renaming them to match display
 *  order would be a sprawling, purely-cosmetic rename touching dozens of
 *  call sites for zero behavioural gain, and would silently orphan every
 *  design/position override a user already saved under the old keys. The
 *  caller (PublishingWorkspace.tsx) is the only place that needs to
 *  translate between "which tab position is this" and "which internal
 *  slide do I render there" -- see its own use of this array for the tab
 *  list and the asset-export loop. */
export const CAROUSEL_SLIDE_ORDER: readonly number[] = [0, 2, 3, 1, 4];

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
  /** The two founder-supplied line-art icons (see MANUSCRIPT_ICON_PATH/
   *  PRACTICE_ICON_PATH in KuralHeroCanvas.tsx) -- fixed, app-wide assets,
   *  not per-episode, loaded once by the host component the same way
   *  logoImage above is. Null/undefined (not yet loaded, or the file is
   *  missing) falls back to a hand-vectored approximation -- see
   *  drawFileIconOrFallback. */
  manuscriptIcon?: HTMLImageElement | null;
  practiceIcon?: HTMLImageElement | null;
  /** The Living Thread ambient pattern layer's tile asset (see
   *  LIVING_THREAD_TILE_PATH in KuralHeroCanvas.tsx) -- a fixed, app-wide
   *  asset, not per-episode, loaded once the same way manuscriptIcon/
   *  practiceIcon above are. Null/undefined (not yet loaded) simply skips
   *  the layer for this render, same "no placeholder" convention as every
   *  other optional image here -- see applyLivingThread below. */
  livingThreadTile?: HTMLImageElement | null;
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
function sectionHeadingFor(): { text: string; size: number } {
  // Covers every slideIndex now: 0 has no heading, just the eyebrow; 1, 2
  // and 3 all drop BOTH the eyebrow and the generic header heading (see
  // headerMetrics' hasEyebrow) -- Slide 4's own heading is drawn directly
  // by drawSlide3Action instead, and 4 (CARRY IT FORWARD) never had one.
  return { text: "", size: DEFAULT_STYLE.slide1.sectionHeadingSize };
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
  const { text: headingText, size: headingSizeBase } = sectionHeadingFor();
  const heading = px(headingSizeBase, width);
  // The eyebrow badge's own vertical footprint -- tight padding, per the
  // locked correction ("reduce the space around the text keep it tight").
  // Shared with drawHeader so the badge's actual drawn height and the
  // space reserved for it can never drift apart. Only Slide 1 (STOP)
  // still carries the "AATHICHOODI" eyebrow -- each of Slides 2-5 dropped
  // it as its own Figma redesign landed (file H9LpyoKvzC5UanyL360JLs),
  // so no vertical space is reserved for it there any more; whatever
  // comes next on each of those slides moves straight up to the top
  // margin instead of leaving a dead gap.
  const hasEyebrow = slideIndex === 0;
  const eyebrowPadY = eyebrow * 0.42;
  const badgeH = hasEyebrow ? eyebrow + eyebrowPadY * 2 : 0;
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
  // correction. No divider line beneath it any more, and no pill
  // background -- just the "AATHICHOODI" text itself, in
  // slide0EyebrowText (white), per explicit founder direction. Only Slide
  // 1 (STOP) still draws it at all any more -- see headerMetrics'
  // hasEyebrow -- every other slide dropped it as its own Figma redesign
  // landed (file H9LpyoKvzC5UanyL360JLs).
  if (slideIndex === 0) {
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

    ctx.fillStyle = style.colors.slide0EyebrowText;
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
  // Slide 4's own badge colours now flip with invertColors, same as its
  // band (drawSlide4Carry): mint-bg/dark-teal-text in light mode (the
  // dark-teal band from episode 22's build), dark-teal-bg/mint-text in
  // dark mode per the founder's explicit instruction (the band itself is
  // mint there, so the badge needs the inverse to still read as its own
  // distinct shape against it). style.colors.logoBadgeBackground/Text
  // stay mode-aware for Slide 1, which uses its own existing pairing.
  const logoOffset = posFor(positions, "footer.logo");
  const isSlide4ForLogo = opts.slideIndex === 4;
  const invertColorsForFooter = Boolean(opts.design?.invertColors);
  const logoColors: CarouselColors = isSlide4ForLogo
    ? invertColorsForFooter
      ? { ...style.colors, logoBadgeBackground: "#68FFAD", logoBadgeText: "#0A363A" }
      : { ...style.colors, logoBadgeBackground: "#0A363A", logoBadgeText: "#68FFAD" }
    : style.colors;
  drawLogoBadge(ctx, logoColors, calSansFont, logoX + logoOffset.dx, rowY + logoOffset.dy, logoRadius);
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
  // Slide 4's wordmark/handle colour matches its own band text
  // (slide4BandText, drawSlide4Carry) -- white on the light-mode dark-teal
  // band, dark teal on the dark-mode mint band, per the founder's dark-
  // mode Figma pass. Hardcoded here rather than reading style.colors.
  // slide4BandText directly only to keep this function's own existing
  // isSlide4 branch shape; the values are identical to that token either
  // way. Slide 1 keeps the mode-aware style.colors.textPrimary/
  // textSecondary tokens instead of a hardcoded value: Slide 1's default
  // mode is still a dark background (unlike Slide 4), and white-on-white
  // would be invisible there in light/inverted mode -- those tokens
  // already resolve to the right color for both of Slide 1's own modes
  // without this footer needing to special-case slideIndex itself. Not
  // style.colors.textPrimary/textSecondary for Slide 4, though -- those
  // are ALSO the generic in-canvas-edit-textarea fallback colors
  // (PublishingWorkspace.tsx), shared across every slide's text fields;
  // changing them globally would make that textarea's own typed text
  // invisible on Slide 1's light/inverted mode whenever ANY field there is
  // being edited, not just this footer.
  const isSlide4 = opts.slideIndex === 4;
  const slide4FooterText = invertColorsForFooter ? "#FFFFFF" : "#0A363A";
  ctx.textAlign = "left";
  ctx.fillStyle = isSlide4 ? slide4FooterText : style.colors.textPrimary;
  ctx.font = `${styleFor(false, brandNameEmphasis)} ${weightFor(700, brandNameEmphasis)} ${Math.round(brandName)}px ${interFont}`;
  const brandNameY = rowY - textBlockHeight / 2 + brandName;
  ctx.fillText(opts.brandingWordmark.replace("AiA — ", ""), textX + brandNameOffset.dx, brandNameY + brandNameOffset.dy);
  pushHotspot(hotspots, "footer.brandName", textX, textEndX - textX, brandNameY, brandNameY, brandName, brandNameOffset);
  if (opts.brandingHandle) {
    const handleOffset = posFor(positions, "footer.handle");
    const handleEmphasis = emphasisFor(emphases, "footer.handle");
    ctx.fillStyle = isSlide4 ? slide4FooterText : style.colors.textSecondary;
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
 *  Top overshoot was cut too far in a previous pass (halved straight to
 *  0.55em, chasing a tighter hug) -- confirmed live that it clipped the
 *  tops of Tamil marks that sit ABOVE the consonant's own cap-height on
 *  "செய்" specifically: the ெ vowel sign's loop over செ, and the pulli
 *  (dead-consonant dot) over ய் (NOT a descender -- Tamil pulli sits above
 *  the letter, not below, unlike a Latin full stop). 0.85em is the
 *  tightest that still clears both marks with a hair of margin, confirmed
 *  via a full-resolution crop -- still noticeably tighter than the 1.1em
 *  this started from, just not as tight as 0.55em turned out to allow. */
function drawHeroWordHighlight(ctx: CanvasRenderingContext2D, accent: string, left: number, baseline: number, wordWidth: number, fontSize: number): void {
  const padX = fontSize * 0.12;
  const top = baseline - fontSize * 0.85;
  const bottom = baseline + fontSize * 0.16;
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
  // lineHeightRatio bumped from fitText's 1.32 default -- on a wrapped
  // (2+ line) hero, the last line's word-highlight box (see
  // drawHeroWordHighlight) needs clearance above it that the default
  // ratio didn't leave room for. Trimmed back down from an earlier 1.55
  // once that box's own overshoot was halved (see drawHeroWordHighlight's
  // doc comment) -- a tighter box needs less clearance.
  const hero = fitText(
    ctx,
    episode.tamilText,
    heroFont,
    frame.contentW,
    (frame.contentBottom - frame.contentTop) * 0.46,
    Math.round(px(style.slide0.heroSize, width)),
    Math.round(px(style.slide0.heroMinSize, width)),
    1.42
  );
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

  // Centred in both modes now, per explicit founder direction -- dark
  // mode used to be left-aligned, but the founder's own reference image
  // shows it centred same as light mode. Weight 500, not 600 -- reduced
  // by 100 per explicit founder direction (this "supporting line" under
  // the hero headline reads as too heavy at 600).
  if (draw) ctx.fillStyle = style.colors.slide0HookText;
  ctx.textAlign = "center";
  const hookX = frame.contentX + frame.contentW / 2;
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
  ctx.textAlign = "center";
  const taglineX = frame.contentX + frame.contentW / 2;
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

  // Dark-mode-only "See How" CTA pill, per the founder's dark-mode Figma
  // pass -- the light-mode source has no button here, so this is gated on
  // !invertColors. Same size, padding and text treatment as slide1's own
  // "Pass It On" pill now (style.slide0.ctaSize == style.slide1.ctaSize,
  // same ctaPadX/ctaPadY formula), per explicit founder direction that the
  // two buttons match -- plus a rounded-square dark-teal badge with a
  // WHITE arrow glyph (shaft + chevron) the Pass It On pill doesn't have.
  if (!invertColors) {
    const ctaSize = px(style.slide0.ctaSize, width);
    const ctaEmphasis = emphasisFor(emphases, "slide0.cta");
    const ctaLabel = "See How";
    ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(700, ctaEmphasis)} ${Math.round(ctaSize)}px ${interFont}`;
    const ctaTextWidth = ctx.measureText(ctaLabel).width;
    const ctaPadX = ctaSize * 1.0;
    const ctaPadY = ctaSize * 0.475;
    const ctaBadgeGap = ctaSize * 0.35;
    const ctaBadgeSize = ctaSize * 0.9;
    const ctaBadgeRadius = ctaBadgeSize * 0.28;
    const ctaPillW = ctaPadX + ctaTextWidth + ctaBadgeGap + ctaBadgeSize + ctaPadX * 0.7;
    const ctaPillH = ctaSize + ctaPadY * 2;
    const ctaRadius = px(8, width);
    const ctaOffset = posFor(positions, "slide0.cta");
    cursorY += ctaSize * 1.1;
    const ctaY = cursorY + ctaOffset.dy;
    const ctaX = frame.contentX + (frame.contentW - ctaPillW) / 2 + ctaOffset.dx;
    if (draw) {
      ctx.fillStyle = style.colors.slide1CtaPillBackground;
      ctx.beginPath();
      ctx.roundRect(ctaX, ctaY, ctaPillW, ctaPillH, ctaRadius);
      ctx.fill();
      ctx.fillStyle = style.colors.slide1CtaPillText;
      ctx.textBaseline = "middle";
      ctx.fillText(ctaLabel, ctaX + ctaPadX, ctaY + ctaPillH / 2 + ctaSize * 0.03);
      ctx.textBaseline = "alphabetic";

      const badgeX = ctaX + ctaPadX + ctaTextWidth + ctaBadgeGap;
      const badgeY = ctaY + (ctaPillH - ctaBadgeSize) / 2;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = ctaBadgeSize * 0.2;
      ctx.shadowOffsetY = ctaBadgeSize * 0.05;
      ctx.fillStyle = style.colors.slide1CtaPillText;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, ctaBadgeSize, ctaBadgeSize, ctaBadgeRadius);
      ctx.fill();
      ctx.restore();

      const badgeCx = badgeX + ctaBadgeSize / 2;
      const badgeCy = badgeY + ctaBadgeSize / 2;
      const h = ctaBadgeSize * 0.5;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = Math.max(1, ctaBadgeSize * 0.12);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const tipX = badgeCx + h * 0.42;
      const armX = tipX - h * 0.42;
      ctx.beginPath();
      ctx.moveTo(badgeCx - h * 0.42, badgeCy);
      ctx.lineTo(tipX, badgeCy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(armX, badgeCy - h * 0.42);
      ctx.lineTo(tipX, badgeCy);
      ctx.lineTo(armX, badgeCy + h * 0.42);
      ctx.stroke();
    }
    cursorY += ctaPillH;
    pushHotspot(hotspots, "slide0.cta", ctaX, ctaPillW, ctaY, ctaY + ctaPillH, ctaSize, ctaOffset);
  }

  return cursorY;
}

// Recolored-image cache for drawFileIconOrFallback below -- keyed by the
// image's own src plus the target color, since both icons are fixed,
// app-wide assets (not per-episode), so the same tint is computed once and
// reused across every render/drag/export rather than re-composited on
// every frame.
const iconTintCache = new Map<string, HTMLCanvasElement>();

/** Recolors a black-stroke-on-transparent source icon to a flat `color` via
 *  a `source-in` composite on an offscreen canvas -- the standard icon-
 *  tinting trick: drawImage the icon, then fill the same rect with
 *  `source-in` so the fill only survives where the icon's own alpha was
 *  already nonzero, replacing its (black) pixels with `color` while
 *  keeping its alpha mask intact. Done on an OFFSCREEN canvas, never
 *  directly on the slide's own ctx -- `source-in` also clears every OTHER
 *  pixel in the filled rect to transparent, which would punch a hole
 *  through whatever card background was already drawn behind the icon on
 *  the real canvas. */
function tintedIcon(img: HTMLImageElement, color: string): HTMLCanvasElement | null {
  const key = `${img.src}|${color}`;
  const cached = iconTintCache.get(key);
  if (cached) return cached;
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d");
  if (!octx) return null;
  octx.drawImage(img, 0, 0, w, h);
  octx.globalCompositeOperation = "source-in";
  octx.fillStyle = color;
  octx.fillRect(0, 0, w, h);
  iconTintCache.set(key, off);
  return off;
}

/** Draws a founder-supplied line-art icon image (see MANUSCRIPT_ICON_PATH/
 *  PRACTICE_ICON_PATH in KuralHeroCanvas.tsx), recolored to `color` and
 *  centered in a `size`-square box at (cx, cy) -- the REAL file, per the
 *  standing rule against approximating a supplied asset (founder feedback
 *  confirmed an earlier hand-vectored pass wasn't acceptable). Falls back
 *  to the hand-vectored `fallback` only for the brief window before the
 *  image has finished loading (see PublishingWorkspace.tsx's
 *  manuscriptIcon/practiceIcon state) -- never a permanent substitute. */
function drawFileIconOrFallback(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null | undefined,
  fallback: () => void,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  if (!image || !image.complete || image.naturalWidth === 0) {
    fallback();
    return;
  }
  const tinted = tintedIcon(image, color);
  if (!tinted) {
    fallback();
    return;
  }
  ctx.drawImage(tinted, cx - size / 2, cy - size / 2, size, size);
}

/** A palm-leaf manuscript mark -- two stacked bound bundles of leaves
 *  (each a rounded bar with two cord eyelets, joined top-to-bottom by the
 *  cord itself), a fanned top edge suggesting loose leaves, and a
 *  shadow/duplicate card peeking out behind the bottom bar (a stacked-box
 *  look) -- per the founder's own newly-supplied reference icon
 *  (manuscript-icon.png, this file's real asset; this is only the brief-
 *  window fallback before that image has loaded, see
 *  drawFileIconOrFallback). Hand-drawn with plain Canvas2D primitives,
 *  same convention as every other icon in this file (the circular "AiA"
 *  wordmark, the lightbulb). `size` is the icon's overall width/height;
 *  (cx, cy) is its centre. */
function drawManuscriptIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  const s = size / 2;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  // Bumped again (from 0.09) -- per explicit founder direction against the
  // newly-supplied reference icon ("increase the weight").
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const barW = s * 1.5;
  const barH = s * 0.56;
  const barRadius = barH * 0.4;
  const barX = cx - barW / 2;
  const topBarY = cy - barH * 1.05;
  const bottomBarY = cy + barH * 0.08;
  const dotInset = barW * 0.22;
  const dotR = Math.max(1.5, size * 0.045);

  // Shadow/duplicate card behind the bottom bar -- the stacked-box look
  // from the reference icon's own bottom-left offset outline.
  const shadowOffset = size * 0.045;
  ctx.beginPath();
  ctx.roundRect(barX - shadowOffset, bottomBarY + shadowOffset, barW, barH, barRadius);
  ctx.stroke();

  // Fanned loose-leaf edge above the top bar -- 3 overlapping strokes
  // sweeping up toward the top-right, like a stack of leaves splayed open.
  for (let i = 0; i < 3; i++) {
    const lift = barH * (0.3 + i * 0.16);
    ctx.beginPath();
    ctx.moveTo(barX + barW * (0.18 + i * 0.08), topBarY + barH * 0.05);
    ctx.lineTo(barX + barW * (0.92 - i * 0.05), topBarY - lift);
    ctx.stroke();
  }

  // Two stacked bars (the bound leaf bundles).
  ctx.beginPath();
  ctx.roundRect(barX, topBarY, barW, barH, barRadius);
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(barX, bottomBarY, barW, barH, barRadius);
  ctx.stroke();

  // Binding cord -- two vertical lines joining an eyelet (a ring, not a
  // filled dot) on the top bar to the matching eyelet on the bottom bar.
  for (const dx of [-dotInset, dotInset]) {
    const dotX = cx + dx;
    const topDotY = topBarY + barH / 2;
    const bottomDotY = bottomBarY + barH / 2;
    ctx.beginPath();
    ctx.moveTo(dotX, topDotY);
    ctx.lineTo(dotX, bottomDotY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(dotX, topDotY, dotR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(dotX, bottomDotY, dotR, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

/** "Understand" -- matches the Figma mockup (file H9LpyoKvzC5UanyL360JLs,
 *  node 1:3) exactly: a compact "shareable poster" plus separate
 *  explanation copy below it. Structure, outer to inner:
 *
 *  1. The pale outer card (drawn by the caller, slide1OuterCardBackground)
 *     -- also wraps the explanation copy below the card stack, not just
 *     the stack itself.
 *  2. A manuscript-icon badge, white (80% opacity) rounded square, in its
 *     own flow slot above the main card -- not notched into/overlapping
 *     it.
 *  3. The dark teal "main" card (slide1GreenCardBackground).
 *  4. A single near-black card inset within that (slide1CardBackground,
 *     with a 1px slide1CardBorder stroke), holding -- all centred, all
 *     stacked with no separate panel backgrounds:
 *       - The Tamil line (episode.tamilText, white), its romanized
 *         reading (episode.phoneticReading when authored -- see
 *         AathichoodiCanonEntry's own doc comment -- else
 *         episode.transliteration, also white),
 *       - The message copy (style.slide1.sectionHeadingText, fixed
 *         design-system copy, muted grey),
 *       - The "Pass It On" CTA pill (mint fill, dark text).
 *  5. Below the card stack, still inside the pale outer card: the
 *     episode's own explanation (episode.understanding), split into its
 *     existing 3-paragraph editorial shape (splitEditorialParagraphs) --
 *     a small bold intro, a large Cal Sans headline, and a smaller muted
 *     supporting paragraph, each with its own size per the mockup's type
 *     scale (Slide1Style.explanationIntroSize/explanationHeroSize/
 *     bodySize) -- left-aligned, black ink.
 *
 *  All card bounds are fixed-size (not sized to their own content) --
 *  `startY` (the balanced-layout position) is deliberately unused here,
 *  since there's no slack to balance inside a fixed card. */
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
  overrideParagraphs: string[] | undefined,
  hotspots?: CarouselHotspot[],
  manuscriptIcon?: HTMLImageElement | null,
  invertColors?: boolean
): number {
  void startY;
  void frame;
  const transliteration = px(style.slide1.transliterationSize, width);
  const tamilRef = px(style.slide1.tamilRefSize, width);
  ctx.textAlign = "left";

  // Outer card bounds mirror exactly what renderAathichoodiCarouselSlide
  // drew behind this (same margins, same frame.contentBottom clamp) --
  // recomputed here rather than threaded through, since it's cheap and
  // keeps this function self-contained.
  const outerMarginX = clampInset(px(style.slide1.outerCardMarginX, width), width, px(MIN_OUTER_CARD_SIZE, width));
  // Only the clamped BOTTOM value is actually needed below (outerBottom)
  // -- the top one doesn't factor into anything else in this function
  // anymore (greenTop derives from the icon badge, not outerMarginTop) --
  // but both raw values still have to go in together, since the pair
  // clamp bounds their SUM, not each independently. No frame.contentBottom
  // clamp -- see the matching outerBottom computation in
  // renderAathichoodiCarouselSlide for why.
  const [, outerMarginBottom] = clampInsetPair(
    px(style.slide1.outerCardMarginTop, width),
    px(style.slide1.outerCardMarginBottom, width),
    canvasHeight,
    px(MIN_OUTER_CARD_SIZE, width)
  );
  const outerBottom = canvasHeight - outerMarginBottom;

  const outerCardW = width - outerMarginX * 2;
  const greenMarginX = clampInset(px(style.slide1.greenCardMarginX, width), outerCardW, px(MIN_GREEN_CARD_SIZE, width));
  // Top/bottom no longer share a fixed budget with each other (see
  // greenTop/greenBottom below -- the card's whole vertical extent is now
  // content-driven, bottom-up, not squeezed into a pre-set outer-card
  // slice), so a simple absolute cap is enough: nothing here can collapse
  // another element to zero/negative anymore, the worst a huge value does
  // is push things an awkward distance, not erase them.
  const greenMarginTop = Math.min(150, Math.max(0, px(style.slide1.greenCardMarginTop, width)));
  const greenMarginBottom = Math.min(150, Math.max(0, px(style.slide1.greenCardMarginBottom, width)));
  const greenX = outerMarginX + greenMarginX;
  const greenW = width - outerMarginX * 2 - greenMarginX * 2;

  // The manuscript-icon badge sits in its own flow slot above the main
  // card -- no "notch into the card" overlap: greenMarginTop is purely
  // the gap between the badge's own bottom edge and the card's top (see
  // Slide1Style.greenCardMarginTop's own doc comment).
  const badgeSize = px(98, width);
  const badgeRadius = px(24, width);
  const badgeOffset = posFor(positions, "slide1.icon");
  const badgeX = greenX + badgeOffset.dx;
  const eyebrowBadgeBottom = headerMetrics(style, width, canvasHeight, 1).badgeBottom;
  const badgePad = px(12, width);
  const badgeY = eyebrowBadgeBottom + badgePad + badgeOffset.dy;
  const greenTop = badgeY + badgeSize + greenMarginTop;

  // Black card -- X-axis sizing is still top-down (width-only, never
  // circular), but its HEIGHT now drives everything below it: the card
  // stack is a compact poster, not a container stretched to fill the
  // outer pale card, so there's room left for the explanation copy
  // underneath. blackTop only depends on greenTop (known already);
  // blackBottom is computed from its own content height, below, then
  // greenBottom/greenH derive from THAT.
  const blackMarginX = clampInset(px(style.slide1.blackCardMarginX, width), greenW, px(MIN_BLACK_CARD_W, width));
  const blackMarginTop = Math.min(150, Math.max(0, px(style.slide1.blackCardMarginTop, width)));
  const blackMarginBottom = Math.min(150, Math.max(0, px(style.slide1.blackCardMarginBottom, width)));
  const blackX = greenX + blackMarginX;
  const blackW = Math.max(px(MIN_BLACK_CARD_W, width), greenW - blackMarginX * 2);
  const blackTop = greenTop + blackMarginTop;
  const blackRadius = px(24, width);
  const blackCenterX = blackX + blackW / 2;

  // Everything inside the black card is centred and stacked with a plain
  // top-down cursor -- no separate panel backgrounds any more (the Figma
  // mockup draws this as ONE card, not reading-board + message-panel).
  // framePad is this card's own top/bottom breathing room, symmetric.
  const framePad = blackW * 0.08;
  const innerW = blackW - framePad * 2;
  let cursorY = blackTop + framePad;

  const tamilRefOffset = posFor(positions, "slide1.tamilRef");
  const transliterationOffset = posFor(positions, "slide1.transliteration");
  const tamilRefEmphasis = emphasisFor(emphases, "slide1.tamilRef");
  const transliterationEmphasis = emphasisFor(emphases, "slide1.transliteration");
  const readingLine = episode.phoneticReading ?? episode.transliteration;

  cursorY += tamilRef;
  const tamilBaseline = cursorY;
  cursorY += tamilRef * 0.55 + transliteration;
  const translitBaseline = cursorY;
  cursorY += transliteration * 1.15;

  const messageCopy = style.slide1.sectionHeadingText;
  const messageCopySize = px(style.slide1.sectionHeadingSize, width);
  const messageCopyEmphasis = emphasisFor(emphases, "slide1.sectionHeading");
  const messageCopyOffset = posFor(positions, "slide1.sectionHeading");
  ctx.font = `${styleFor(false, messageCopyEmphasis)} ${weightFor(500, messageCopyEmphasis)} ${Math.round(messageCopySize)}px ${interFont}`;
  const messageLines = messageCopy ? wrapText(ctx, messageCopy, innerW) : [];
  const messageLineHeight = messageCopySize * 1.2;
  const messageTop = cursorY;
  for (let i = 0; i < messageLines.length; i++) cursorY += messageLineHeight;
  const messageBottom = cursorY;
  cursorY += messageCopySize * 0.7;

  const ctaSize = px(style.slide1.ctaSize, width);
  const ctaOffset = posFor(positions, "slide1.cta");
  const ctaEmphasis = emphasisFor(emphases, "slide1.cta");
  const ctaLabel = "Pass It On";
  ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(700, ctaEmphasis)} ${Math.round(ctaSize)}px ${interFont}`;
  const ctaPadX = ctaSize * 1.0;
  const ctaPadY = ctaSize * 0.475;
  const ctaTextWidth = ctx.measureText(ctaLabel).width;
  const ctaPillW = ctaTextWidth + ctaPadX * 2;
  const ctaPillH = ctaSize + ctaPadY * 2;
  const ctaRadius = px(8, width);
  const ctaX = blackCenterX - ctaPillW / 2 + ctaOffset.dx;
  const ctaY = cursorY + ctaOffset.dy;
  cursorY += ctaPillH;

  const blackBottom = cursorY + framePad;
  const greenBottom = blackBottom + blackMarginBottom + greenMarginBottom;
  const greenH = greenBottom - greenTop;
  const greenRadius = px(24, width);

  // Like every other draggable element, a card's own drag offset only
  // nudges where ITS rectangle is drawn/hit-tested -- it never feeds back
  // into the layout math above, so the badge/black-card/text positions
  // stay put even if a card's own background is dragged away from them.
  const greenCardOffset = posFor(positions, "slide1.greenCard");
  if (draw) {
    // Per the founder's dark-mode Figma pass (5-slide "Dark" frame set),
    // this whole nested pale-outer/green-card/black-card stack collapses
    // in dark mode to a single card floating directly on the page (see
    // the dashed-border card below) -- no green wrapper at all, confirmed
    // against the dark mockup (plain page colour right up to the card's
    // own edge, no second nested rect visible). invertColors === light
    // mode keeps the full nested-card stack exactly as built for episode
    // 22. The hotspot stays registered either way (see below) so the
    // drag/resize UI doesn't lose this element switching modes, even
    // though dark mode draws nothing for it to grab visually.
    if (invertColors) {
      ctx.fillStyle = style.colors.slide1GreenCardBackground;
      ctx.beginPath();
      ctx.roundRect(greenX + greenCardOffset.dx, greenTop + greenCardOffset.dy, greenW, greenH, greenRadius);
      ctx.fill();

      // Living-language layer, letter granularity, mint -- the same shared
      // ambient-field system the KKA cover and Distant Devotion already use
      // (ambient-language-layer.ts), brought into this card per explicit
      // founder direction. Clipped to the green card's own rounded rect and
      // drawn in its LOCAL coordinate space (translate, not re-derived
      // offsets) so drawLivingLanguageField's own (0,0)-anchored grid lands
      // correctly; no clearBox needed -- the black card drawn on top of this
      // later fully occludes its own footprint regardless, so letters only
      // ever end up visible in the green margin around it, which is exactly
      // the intended look. Sourced from this episode's own Tamil line, never
      // invented, same rule as every other ambient-field caller -- mixed
      // with occasional Tamil-Brahmi/Vatteluttu letterforms (see
      // drawLivingLanguageField's own doc comment) and a small glowing-mint
      // subset per explicit founder direction, in ONE unified placement pass
      // so these don't overlap each other the way two independent same-area
      // passes would. Light mode only -- the dark mockup shows no such
      // texture around the dashed card, just plain page colour.
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(greenX + greenCardOffset.dx, greenTop + greenCardOffset.dy, greenW, greenH, greenRadius);
      ctx.clip();
      ctx.translate(greenX + greenCardOffset.dx, greenTop + greenCardOffset.dy);
      const greenLetterPool = extractTamilGraphemes(episode.tamilText);
      drawLivingLanguageField(ctx, {
        width: greenW,
        height: greenH,
        rand: createSeededRandom(episode.episodeNumber * 7 + 3),
        font: tamilFont,
        contentGlyphs: greenLetterPool.length > 0 ? greenLetterPool : FALLBACK_AMBIENT_GLYPHS,
        // The established mint accent -- hardcoded here rather than reused
        // from an existing style.colors field, same reasoning as
        // drawFooterLockup's own Slide 4 hardcodes: no existing token means
        // "this specific element's mint", just the slide's accent value.
        // Mostly flat mint, a smaller glowing-mint subset on top.
        colors: [
          { color: "#68FFAD", weight: 8 },
          { color: "#68FFAD", weight: 2, glow: true },
        ],
      });
      ctx.restore();
    }

    ctx.fillStyle = style.colors.slide1IconBadgeBackground;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, badgeRadius);
    ctx.fill();
    drawFileIconOrFallback(
      ctx,
      manuscriptIcon,
      () => drawManuscriptIcon(ctx, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize * 0.62, style.colors.slide1IconBadgeIconColor),
      badgeX + badgeSize / 2,
      badgeY + badgeSize / 2,
      badgeSize * 0.78,
      style.colors.slide1IconBadgeIconColor
    );
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

  const blackCardOffset = posFor(positions, "slide1.blackCard");
  if (draw) {
    // Light mode: solid near-black card, drop shadow, solid subtle-grey
    // border -- unchanged from episode 22's build. Dark mode: per the
    // founder's dark-mode Figma pass, a lighter-teal "glass" card with a
    // DASHED mint border and no shadow (a shadow cast onto an
    // already-dark page reads as pointless noise, and the mockup shows
    // none) -- slide1CardBackground/slide1CardBorder are already the
    // right colour for whichever mode via style.colors, only the shadow/
    // dash treatment itself needs to branch here.
    if (invertColors) {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = px(16, width);
      ctx.shadowOffsetY = px(5, width);
      ctx.fillStyle = style.colors.slide1CardBackground;
      ctx.beginPath();
      ctx.roundRect(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy, blackW, blackBottom - blackTop, blackRadius);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = style.colors.slide1CardBackground;
      ctx.beginPath();
      ctx.roundRect(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy, blackW, blackBottom - blackTop, blackRadius);
      ctx.fill();
    }
    ctx.strokeStyle = style.colors.slide1CardBorder;
    ctx.lineWidth = Math.max(1, px(1, width));
    if (!invertColors) {
      // Dash/gap measured directly off the founder's dark-mode Figma
      // screenshot for this slide (pixel-sampled: ~18px dash / ~11px gap
      // at the screenshot's own scale, which translates to ~42/26 at the
      // 1080px reference width px() scales against) -- was 8/6, visibly
      // too fine next to the reference's bolder dashed outline.
      ctx.setLineDash([px(42, width), px(26, width)]);
    }
    ctx.beginPath();
    ctx.roundRect(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy, blackW, blackBottom - blackTop, blackRadius);
    ctx.stroke();
    if (!invertColors) {
      ctx.setLineDash([]);
    }

    // Living-language layer, now a "dot grid" of single letters rather
    // than a scattered word field -- per the founder's own reference (a
    // Figma noise/texture plugin's settings panel: dot-grid tiling, a soft
    // radial mask per glyph, 75% density, 0.5 dot size, randomized
    // opacity -- see drawGlyphGridField's own doc comment for the exact
    // mapping). Letters only, not words, per explicit founder direction
    // ("forget about words, only letters and glyphs for now").
    //
    // clearBox is narrower than the card's own framePad inset (NOT the
    // same box the text content wraps to) -- the actual centred Tamil
    // ref/reading/message/CTA stack is itself much narrower than that
    // full-width inset, so using the wider box left the whole left/right
    // side of the card empty at every height in between the top and
    // bottom bands (glyphs only ever appeared where the clearBox's own
    // vertical extent didn't reach). A safely-narrower width here just
    // lets glyphs fill that unused side margin instead -- harmless even
    // where real content runs wider than this estimate, since the actual
    // text is drawn afterward, on top, fully opaque (see below), not
    // alpha-blended over this layer.
    {
      const blackCardH = blackBottom - blackTop;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy, blackW, blackCardH, blackRadius);
      ctx.clip();
      ctx.translate(blackX + blackCardOffset.dx, blackTop + blackCardOffset.dy);
      const blackLetterPool = extractTamilGraphemes(`${episode.tamilText}${episode.understanding}`);
      const glyphClearW = blackW * 0.58;
      drawGlyphGridField(ctx, {
        width: blackW,
        height: blackCardH,
        rand: createSeededRandom(episode.episodeNumber * 7 + 1),
        font: tamilFont,
        glyphPool: blackLetterPool.length > 0 ? blackLetterPool : FALLBACK_AMBIENT_GLYPHS,
        clearBox: { x: (blackW - glyphClearW) / 2, y: framePad, width: glyphClearW, height: blackCardH - framePad * 2 },
        colors: [
          { color: style.colors.slide1ExplanationMutedText, weight: 5 },
          { color: style.colors.slide1CardText, weight: 4 },
          { color: "#68FFAD", weight: 1.5 },
        ],
      });
      ctx.restore();
    }
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

  if (draw) {
    ctx.textAlign = "center";
    ctx.fillStyle = style.colors.slide1CardText;
    ctx.font = `${styleFor(false, tamilRefEmphasis)} ${weightFor(700, tamilRefEmphasis)} ${Math.round(tamilRef)}px ${tamilFont}`;
    ctx.fillText(episode.tamilText, blackCenterX + tamilRefOffset.dx, tamilBaseline + tamilRefOffset.dy);
    ctx.font = `${styleFor(false, transliterationEmphasis)} ${weightFor(500, transliterationEmphasis)} ${Math.round(transliteration)}px ${interFont}`;
    ctx.fillText(readingLine, blackCenterX + transliterationOffset.dx, translitBaseline + transliterationOffset.dy);
    ctx.textAlign = "left";
  }
  pushHotspot(hotspots, "slide1.tamilRef", blackX, blackW, tamilBaseline, tamilBaseline, tamilRef, tamilRefOffset);
  pushHotspot(hotspots, "slide1.transliteration", blackX, blackW, translitBaseline, translitBaseline, transliteration, transliterationOffset);

  if (messageCopy) {
    if (draw) {
      ctx.textAlign = "center";
      ctx.fillStyle = style.colors.slide1ExplanationMutedText;
      ctx.font = `${styleFor(false, messageCopyEmphasis)} ${weightFor(500, messageCopyEmphasis)} ${Math.round(messageCopySize)}px ${interFont}`;
      let lineY = messageTop;
      for (const line of messageLines) {
        lineY += messageLineHeight;
        ctx.fillText(line, blackCenterX + messageCopyOffset.dx, lineY + messageCopyOffset.dy);
      }
      ctx.textAlign = "left";
    }
    pushHotspot(hotspots, "slide1.sectionHeading", blackX, blackW, messageTop + messageLineHeight, messageBottom, messageCopySize, messageCopyOffset);
  }

  // "Pass It On" CTA pill -- fixed copy (a design-system convention, not
  // per-episode content, same as the AATHICHOODI eyebrow text elsewhere),
  // size/position/bold/italic still fully editable.
  if (draw) {
    ctx.fillStyle = style.colors.slide1CtaPillBackground;
    ctx.beginPath();
    ctx.roundRect(ctaX, ctaY, ctaPillW, ctaPillH, ctaRadius);
    ctx.fill();
    ctx.fillStyle = style.colors.slide1CtaPillText;
    ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(700, ctaEmphasis)} ${Math.round(ctaSize)}px ${interFont}`;
    ctx.textBaseline = "middle";
    ctx.fillText(ctaLabel, ctaX + ctaPadX, ctaY + ctaPillH / 2 + ctaSize * 0.03);
    ctx.textBaseline = "alphabetic";
  }
  pushHotspot(hotspots, "slide1.cta", ctaX, ctaPillW, ctaY, ctaY + ctaPillH, ctaSize, ctaOffset);

  // Explanation -- episode.understanding, split into its existing
  // 3-paragraph editorial shape (splitEditorialParagraphs), each paragraph
  // its own size/weight/font per the mockup's type scale, drawn directly
  // on the light outer card (previously inside the black card). greenBottom
  // is now the card stack's true (compact) bottom, so there's real room
  // left here. Per the Figma source (3 separate text layers, not one
  // flowed block), each paragraph is its OWN hotspot (slide1.body.0/.1/.2)
  // with its own drag offset, bold/italic emphasis, and text override --
  // same pattern as drawSlide2Family's per-paragraph ids -- not one shared
  // "slide1.body" id moving/editing all three together.
  const introSize = px(style.slide1.explanationIntroSize, width);
  const heroSize = px(style.slide1.explanationHeroSize, width);
  const supportingSize = px(style.slide1.bodySize, width);
  const explanationBottom = outerBottom - px(40, width);
  let explanationCursorY = greenBottom + px(45, width);

  const paragraphs = splitEditorialParagraphs(episode.understanding);
  for (let i = 0; i < paragraphs.length; i++) {
    const isFirst = i === 0;
    const isLast = !isFirst && i === paragraphs.length - 1;
    const isHero = !isFirst && !isLast && i === 1;
    const size = isFirst ? introSize : isLast ? supportingSize : isHero ? heroSize : supportingSize;
    const lineHeight = size * (isHero ? 0.93 : 1.3);
    const id = `slide1.body.${i}`;
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    const text = overrideParagraphs?.[i] || paragraphs[i];
    if (draw) {
      ctx.fillStyle = isLast
        ? style.colors.slide1ExplanationMutedText
        : isFirst
          ? style.colors.slide1ExplanationIntroText
          : style.colors.slide1ExplanationText;
      if (isHero) {
        try {
          ctx.letterSpacing = `${Math.round(px(2.16, width))}px`;
        } catch {
          /* Canvas2D letterSpacing unsupported -- default tracking is fine */
        }
        ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${calSansFont}`;
      } else {
        ctx.font = `${styleFor(false, emphasis)} ${weightFor(isFirst ? 600 : 500, emphasis)} ${Math.round(size)}px ${interFont}`;
      }
    }
    const lines = wrapText(ctx, text, greenW);
    const paragraphFirstY = explanationCursorY;
    for (const line of lines) {
      if (explanationCursorY > explanationBottom) break;
      explanationCursorY += lineHeight;
      if (draw) ctx.fillText(line, greenX + offset.dx, explanationCursorY + offset.dy);
    }
    if (draw && isHero) {
      try {
        ctx.letterSpacing = "0px";
      } catch {
        /* no-op */
      }
    }
    pushHotspot(hotspots, id, greenX, greenW, paragraphFirstY, explanationCursorY, size, offset);
    // The hero line's own trailing gap to the supporting paragraph runs a
    // little wider than the others (Figma: 19px after the intro, 24px
    // after the hero, at this 1080 reference scale) -- not proportional to
    // font size the same way, just how the designer spaced it.
    explanationCursorY += lineHeight * (isHero ? 0.48 : 0.4);
  }
  return explanationCursorY;
}

/** "Family Situation" -- read directly off the Figma dev-mode inspector
 *  (file H9LpyoKvzC5UanyL360JLs, node 7:3): the founder-supplied family
 *  photo sits in a dark teal card (slide1GreenCardBackground, same token
 *  Slide 2's black-card-holding card uses), flush with the card's own
 *  top and cropped only at the bottom corners, on the SAME pale-page +
 *  rounded-outer-card page Slide 2 (UNDERSTAND) uses (drawn by the
 *  caller -- see the slideIndex===2 block in renderAathichoodiCarouselSlide).
 *  Below the card: the generated scenario copy as two distinct roles, not
 *  one flowed block -- a bold black Cal Sans headline (the scenario) and
 *  a muted Inter supporting line (its consequence), same per-paragraph
 *  hotspot pattern as before (id `slide2.body.N`, independently draggable/
 *  editable, override at index N replaces just that paragraph). Without a
 *  photo, the card is skipped entirely and the text starts right under
 *  the top margin -- the slide still reads consistently light either way,
 *  it just loses the card. */
function drawSlide2Family(
  ctx: CanvasRenderingContext2D,
  style: CarouselStyle,
  frame: Frame,
  width: number,
  canvasHeight: number,
  episode: ComposedEpisode,
  interFont: string,
  calSansFont: string,
  startY: number,
  draw: boolean,
  positions: CarouselPositions | undefined,
  emphases: CarouselTextEmphases | undefined,
  overrideParagraphs: string[] | undefined,
  hotspots?: CarouselHotspot[],
  familyImage?: HTMLImageElement | null,
  invertColors?: boolean
): number {
  // Self-positioning from the top margin, same as drawSlide1Understand --
  // the card is flush under the top margin, not vertically balanced, so
  // startY (the generic vertical-centering pass's result) doesn't apply.
  void startY;
  void frame;

  const outerMarginX = clampInset(px(style.slide2.outerCardMarginX, width), width, px(MIN_OUTER_CARD_SIZE, width));
  const [outerMarginTop, outerMarginBottom] = clampInsetPair(
    px(style.slide2.outerCardMarginTop, width),
    px(style.slide2.outerCardMarginBottom, width),
    canvasHeight,
    px(MIN_OUTER_CARD_SIZE, width)
  );
  // No frame.contentBottom clamp on the text loop below -- same bug as
  // Slide 2's had (see renderAathichoodiCarouselSlide's slideIndex===1
  // comment): that's the generic footer-safe-area boundary every OTHER
  // slide's body text respects, but this slide draws no footer either,
  // and clamping to it was cutting the supporting line off entirely once
  // the photo card pushed cursorY past it.
  const textBottom = canvasHeight - outerMarginBottom - px(40, width);
  const outerCardW = width - outerMarginX * 2;
  const cardMarginX = clampInset(px(style.slide2.cardMarginX, width), outerCardW, px(MIN_GREEN_CARD_SIZE, width));
  const cardMarginTop = Math.min(150, Math.max(0, px(style.slide2.cardMarginTop, width)));
  const cardX = outerMarginX + cardMarginX;
  const cardW = outerCardW - cardMarginX * 2;
  const cardTop = outerMarginTop + cardMarginTop;
  // Text aligns to the same left margin as the card, whether or not a
  // photo (and so the card) is actually drawn -- keeps the slide
  // consistent instead of text jumping between two different margins
  // depending on upload state.
  const textX = cardX;
  const textW = cardW;

  let cursorY = cardTop;

  if (familyImage) {
    const photoMarginX = Math.min(150, Math.max(0, px(style.slide2.photoMarginX, width)));
    const photoMarginBottom = Math.min(150, Math.max(0, px(style.slide2.photoMarginBottom, width)));
    const photoX = cardX + photoMarginX;
    const photoW = Math.max(px(MIN_BLACK_CARD_W, width), cardW - photoMarginX * 2);
    const photoTop = cardTop; // flush with the card's own top, per spec
    const photoH = px(style.slide2.photoHeight, width);
    const photoBottom = photoTop + photoH;
    const photoRadius = px(24, width);
    const cardRadius = px(24, width);
    const cardBottom = photoBottom + photoMarginBottom;
    const cardH = cardBottom - cardTop;

    const cardOffset = posFor(positions, "slide2.photoCard");
    if (draw) {
      ctx.fillStyle = style.colors.slide1GreenCardBackground;
      ctx.beginPath();
      ctx.roundRect(cardX + cardOffset.dx, cardTop + cardOffset.dy, cardW, cardH, cardRadius);
      ctx.fill();
    }
    if (hotspots) {
      hotspots.push({
        id: "slide2.photoCard",
        x: cardX + cardOffset.dx,
        y: cardTop + cardOffset.dy,
        width: cardW,
        height: cardH,
      });
    }

    if (draw) {
      // Flush square top corners, rounded only at the bottom, in LIGHT
      // mode (episode 22's established build, unchanged). In dark mode,
      // per explicit founder direction, all four corners round -- so this
      // just uses roundRect's own all-corners form there instead of the
      // hand-traced partial-round path. Still one path fn, reused for the
      // drop shadow, the clipped photo, and the border stroke so all
      // three stay pixel-identical.
      const photoPath = () => {
        ctx.beginPath();
        if (invertColors) {
          ctx.moveTo(photoX, photoTop);
          ctx.lineTo(photoX + photoW, photoTop);
          ctx.lineTo(photoX + photoW, photoBottom - photoRadius);
          ctx.arcTo(photoX + photoW, photoBottom, photoX + photoW - photoRadius, photoBottom, photoRadius);
          ctx.lineTo(photoX + photoRadius, photoBottom);
          ctx.arcTo(photoX, photoBottom, photoX, photoBottom - photoRadius, photoRadius);
          ctx.closePath();
        } else {
          ctx.roundRect(photoX, photoTop, photoW, photoBottom - photoTop, photoRadius);
        }
      };

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx.shadowBlur = px(18, width);
      ctx.shadowOffsetY = px(4, width);
      photoPath();
      ctx.fillStyle = "#000000";
      ctx.fill();
      ctx.restore();

      ctx.save();
      photoPath();
      ctx.clip();
      const scale = Math.max(photoW / familyImage.width, photoH / familyImage.height);
      const drawW = familyImage.width * scale;
      const drawH = familyImage.height * scale;
      ctx.drawImage(familyImage, photoX + (photoW - drawW) / 2, photoTop + (photoH - drawH) / 2, drawW, drawH);
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = Math.max(1, px(1, width));
      photoPath();
      ctx.stroke();
    }
    // A plain rect, not pushHotspot -- that helper pads a text hotspot
    // above/below its baselines using the font size as a proxy for
    // ascent/descent, which would wildly inflate a ~750px-tall photo's
    // hotspot well past its actual drawn bounds.
    if (hotspots) {
      hotspots.push({ id: "slide2.photo", x: photoX, y: photoTop, width: photoW, height: photoH });
    }

    cursorY = cardBottom + px(37, width);
  }

  // splitEditorialParagraphs splits on EVERY sentence boundary -- fine for
  // Slide 4/Understand's fixed 3-part editorial shape, but familyAngle
  // scenarios (scenarios.ts) are often 3 sentences long, which produced a
  // 3rd muted paragraph here (two supporting lines stacked) instead of
  // this slide's intended 2-part shape (one mint headline, one muted
  // supporting line). Collapsing every sentence after the first back into
  // ONE paragraph restores that shape regardless of how many sentences
  // the scenario happens to be.
  const rawParagraphs = splitEditorialParagraphs(episode.familyAngle);
  const supportText = rawParagraphs.slice(1).join(" ");
  const generatedParagraphs = supportText ? [rawParagraphs[0], supportText] : rawParagraphs.slice(0, 1);
  for (let i = 0; i < generatedParagraphs.length; i++) {
    if (cursorY > textBottom) break;
    const isHeadline = i === 0;
    const id = `slide2.body.${i}`;
    const text = overrideParagraphs?.[i] || generatedParagraphs[i];
    const offset = posFor(positions, id);
    const emphasis = emphasisFor(emphases, id);
    // Own size per paragraph (emphasis.size), falling back to this role's
    // own named default (headlineSize/bodySize) -- not one shared field,
    // since the headline and supporting line are deliberately different
    // type scales (Figma: 40px Cal Sans vs 34px Inter Medium).
    const size = px(emphasis.size ?? (isHeadline ? style.slide2.headlineSize : style.slide2.bodySize), width);
    const lineHeight = size * (isHeadline ? 1.25 : 1.3);
    if (draw) {
      // isHeadline uses the "intro/accent" role (slide1ExplanationIntroText)
      // rather than slide1ExplanationText -- black in light mode either
      // way (identical today), but per the founder's dark-mode Figma pass
      // this slide's own headline is mint in dark mode, not white.
      ctx.fillStyle = isHeadline ? style.colors.slide1ExplanationIntroText : style.colors.slide1ExplanationMutedText;
      if (isHeadline) {
        try {
          ctx.letterSpacing = `${Math.round(px(1.6, width))}px`;
        } catch {
          /* Canvas2D letterSpacing unsupported -- default tracking is fine */
        }
        ctx.font = `${styleFor(false, emphasis)} ${weightFor(400, emphasis)} ${Math.round(size)}px ${calSansFont}`;
      } else {
        ctx.font = `${styleFor(false, emphasis)} ${weightFor(500, emphasis)} ${Math.round(size)}px ${interFont}`;
      }
    }
    const lines = wrapText(ctx, text, textW);
    let firstBaseline = 0;
    for (const line of lines) {
      cursorY += lineHeight;
      if (firstBaseline === 0) firstBaseline = cursorY;
      if (draw) ctx.fillText(line, textX + offset.dx, cursorY + offset.dy);
    }
    if (draw && isHeadline) {
      try {
        ctx.letterSpacing = "0px";
      } catch {
        /* no-op */
      }
    }
    pushHotspot(hotspots, id, textX, textW, firstBaseline, cursorY, size, offset);
    // Figma: a flat 37px gap after each paragraph -- the same rhythm the
    // card-to-headline and headline-to-supporting transitions both use,
    // not proportional to font size.
    cursorY += px(37, width);
  }

  return cursorY;
}

/** "Practice" -- a gear ring with a lightbulb at its centre (idea, turned
 *  into practiced action) plus a pencil beside it and a few sparkle
 *  dashes above, all pure outline strokes -- replacing the old solid-
 *  filled bulb-on-a-base glyph, per explicit founder direction and the
 *  attached reference icon. Same bold stroke weight as
 *  drawManuscriptIcon's own (per explicit founder direction, both icons
 *  now match). Drawn with plain Canvas2D primitives, same convention as
 *  every other icon in this file -- no icon font or external asset.
 *  `size` is the icon's overall height; (cx, cy) is its centre. */
function drawPracticeIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Gear + bulb sit left-of-centre, the pencil to the right -- same
  // overall layout as the reference icon.
  const gearCx = cx - size * 0.22;
  const gearR = size * 0.42;
  const toothCount = 8;
  const toothOuter = gearR * 1.14;
  const toothInner = gearR * 0.92;
  const toothHalfAngle = (Math.PI / toothCount) * 0.38;

  ctx.beginPath();
  for (let i = 0; i < toothCount; i++) {
    const a0 = (i / toothCount) * Math.PI * 2;
    const a1 = a0 + toothHalfAngle;
    const a2 = ((i + 1) / toothCount) * Math.PI * 2 - toothHalfAngle;
    const a3 = ((i + 1) / toothCount) * Math.PI * 2;
    const px0 = gearCx + Math.cos(a0) * toothInner;
    const py0 = cy + Math.sin(a0) * toothInner;
    const px1 = gearCx + Math.cos(a1) * toothOuter;
    const py1 = cy + Math.sin(a1) * toothOuter;
    const px2 = gearCx + Math.cos(a2) * toothOuter;
    const py2 = cy + Math.sin(a2) * toothOuter;
    const px3 = gearCx + Math.cos(a3) * toothInner;
    const py3 = cy + Math.sin(a3) * toothInner;
    if (i === 0) ctx.moveTo(px0, py0);
    else ctx.lineTo(px0, py0);
    ctx.lineTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.lineTo(px3, py3);
  }
  ctx.closePath();
  ctx.stroke();

  // Lightbulb -- dome, a twisted double-coil "filament" at the neck, two
  // angled leads down to a small base with one screw-thread line, all
  // outline only (no knockout fill needed now that nothing's solid).
  const bulbR = gearR * 0.5;
  const bulbCy = cy - bulbR * 0.3;
  ctx.beginPath();
  ctx.arc(gearCx, bulbCy, bulbR, Math.PI * 0.92, Math.PI * 2.08);
  ctx.stroke();

  const neckY = bulbCy + bulbR * 0.78;
  const coilR = bulbR * 0.22;
  ctx.beginPath();
  ctx.arc(gearCx - coilR * 0.9, neckY, coilR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(gearCx + coilR * 0.9, neckY, coilR, 0, Math.PI * 2);
  ctx.stroke();

  const baseW = bulbR * 0.9;
  const baseH = bulbR * 0.5;
  const baseX = gearCx - baseW / 2;
  const baseY = neckY + coilR * 0.6;
  ctx.beginPath();
  ctx.moveTo(gearCx - baseW * 0.32, neckY + coilR * 0.3);
  ctx.lineTo(baseX, baseY);
  ctx.lineTo(baseX, baseY + baseH * 0.6);
  ctx.lineTo(baseX + baseW * 0.15, baseY + baseH);
  ctx.lineTo(baseX + baseW * 0.85, baseY + baseH);
  ctx.lineTo(baseX + baseW, baseY + baseH * 0.6);
  ctx.lineTo(baseX + baseW, baseY);
  ctx.lineTo(gearCx + baseW * 0.32, neckY + coilR * 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(baseX + baseW * 0.1, baseY + baseH * 0.35);
  ctx.lineTo(baseX + baseW * 0.9, baseY + baseH * 0.35);
  ctx.stroke();

  // Sparkle dashes above the gear -- same convention as
  // drawManuscriptIcon's own, for a consistent icon language.
  const sparkleOrigin = { x: gearCx + gearR * 0.3, y: cy - gearR * 0.95 };
  const sparkleAngles = [-2.0, -1.65, -1.3, -0.95];
  for (const angle of sparkleAngles) {
    const innerR = size * 0.1;
    const outerR = size * 0.22;
    ctx.beginPath();
    ctx.moveTo(sparkleOrigin.x + Math.cos(angle) * innerR, sparkleOrigin.y + Math.sin(angle) * innerR);
    ctx.lineTo(sparkleOrigin.x + Math.cos(angle) * outerR, sparkleOrigin.y + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  // Pencil, to the right of the gear -- a long angled body with a flat
  // cap near the top (a short cross-line, like a ferrule) and a point at
  // the bottom.
  const pencilCx = cx + size * 0.42;
  const pencilW = size * 0.17;
  const pencilTop = cy - size * 0.46;
  const pencilTipY = cy + size * 0.46;
  const bodyBottom = pencilTipY - pencilW * 1.1;
  ctx.beginPath();
  ctx.moveTo(pencilCx - pencilW / 2, pencilTop);
  ctx.lineTo(pencilCx + pencilW / 2, pencilTop);
  ctx.lineTo(pencilCx + pencilW / 2, bodyBottom);
  ctx.lineTo(pencilCx, pencilTipY);
  ctx.lineTo(pencilCx - pencilW / 2, bodyBottom);
  ctx.closePath();
  ctx.stroke();
  const capY = pencilTop + pencilW * 0.8;
  ctx.beginPath();
  ctx.moveTo(pencilCx - pencilW / 2, capY);
  ctx.lineTo(pencilCx + pencilW / 2, capY);
  ctx.stroke();

  ctx.restore();
}

/** "Ask Your Child Today" -- read directly off the Figma dev-mode
 *  inspector (file H9LpyoKvzC5UanyL360JLs, node 9:26): a plain white page
 *  (no eyebrow, no outer/pale wrapping card -- just this slide's own
 *  fixed black heading and a single light panel), the panel holding the
 *  lightbulb icon badge, the generated question in large black Cal Sans,
 *  and the generated trailing line as a muted Inter supporting line
 *  underneath it -- all three stacked INSIDE the one panel, not a
 *  separate panel-plus-trailing-line-below-it the way this slide used to
 *  split them. splitQuotedAction's "before" segment is no longer drawn at
 *  all (see Slide3Style.sectionHeadingText's own doc comment) -- only
 *  "quoted" (the question) and "after" (the supporting line) are, each
 *  its own hotspot (slide3.question / slide3.after) for independent drag/
 *  resize/text-override, same as before this redesign. Self-positioning
 *  from its own margin fields, same "ignore startY" pattern as Slide 2/
 *  Slide 3's cards -- this slide's content sits near the top by design,
 *  not vertically balanced. */
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
  hotspots?: CarouselHotspot[],
  practiceIcon?: HTMLImageElement | null,
  livingThreadTile?: HTMLImageElement | null,
  invertColors?: boolean
): number {
  void startY;
  void frame;
  const generated = splitQuotedAction(episode.todayAction);
  const quoted = overrides?.question || generated.quoted;
  // Falls back to episode.todayActionSupport -- a concrete prompt to help
  // the parent use THIS question (see actions.ts's own doc comment) --
  // only when splitQuotedAction found no trailing clause of its own. True
  // for every generated (non-curated) episode now, per explicit founder
  // direction that every episode's Slide 3 show a supporting line, same
  // role curated episodes' own hand-authored trailing clause plays.
  const after = overrides?.after || generated.after || episode.todayActionSupport || "";

  // Tag-pill row -- "Language Beliefs/Practices/Management", per the
  // Figma file's later update (node 9:26). Episodes without
  // episode.languageCategory authored yet (every one except 22, for now --
  // see canon.ts's own doc comment on that field) skip this row entirely
  // rather than guessing a category, same "only render what's actually
  // set" convention distantDevotionConnection/aiaConnection follow.
  const category = episode.languageCategory;
  if (style.slide3.showTagRow && category) {
    const tagRowOffset = posFor(positions, "slide3.tagRow");
    const pillW = px(style.slide3.tagRowPillW, width);
    const pillH = px(style.slide3.tagRowPillH, width);
    const pillRadius = px(style.slide3.tagRowPillRadius, width);
    const pillY = px(style.slide3.tagRowY, width) + tagRowOffset.dy;
    const textSize = px(style.slide3.tagRowTextSize, width);
    if (draw) {
      try {
        ctx.letterSpacing = `${Math.round(px(0.88, width))}px`;
      } catch {
        /* Canvas2D letterSpacing unsupported -- default tracking is fine */
      }
      for (const [i, id] of (["beliefs", "practices", "management"] as const).entries()) {
        const pillX = px(style.slide3.tagRowX[i], width) + tagRowOffset.dx;
        const isActive = id === category;
        ctx.fillStyle = isActive ? style.colors.tagPillActiveBackground : style.colors.tagPillInactiveBackground;
        ctx.strokeStyle = isActive ? style.colors.tagPillActiveBorder : style.colors.tagPillInactiveBorder;
        ctx.lineWidth = Math.max(1, px(1, width));
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillRadius);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillStyle = isActive ? style.colors.tagPillActiveText : style.colors.tagPillInactiveText;
        ctx.font = `normal ${isActive ? 500 : 400} ${Math.round(textSize)}px ${interFont}`;
        const [firstWord, ...rest] = LANGUAGE_CATEGORY_LABELS[id].split(" ");
        const secondWord = rest.join(" ");
        const lineHeight = textSize * 1.15;
        const textCx = pillX + pillW / 2;
        const textCy = pillY + pillH / 2;
        ctx.fillText(firstWord, textCx, textCy - lineHeight * 0.1);
        ctx.fillText(secondWord, textCx, textCy + lineHeight * 0.9);
      }
      try {
        ctx.letterSpacing = "0px";
      } catch {
        /* no-op */
      }
    }
    if (hotspots) {
      const groupX = px(style.slide3.tagRowX[0], width) + tagRowOffset.dx;
      const groupRight = px(style.slide3.tagRowX[2], width) + pillW + tagRowOffset.dx;
      hotspots.push({
        id: "slide3.tagRow",
        x: groupX,
        y: pillY,
        width: groupRight - groupX,
        height: pillH,
      });
    }
  }

  // Heading -- "ASK YOUR CHILD TODAY" by default, a fixed design-system
  // label (see Slide3Style.sectionHeadingText), not episode content. Lives
  // inside the panel's own bottom-up content stack now (see below), not as
  // a page-level element above it -- per the Figma file's later update.
  const headingId = "slide3.sectionHeading";
  const headingOffset = posFor(positions, headingId);
  const headingEmphasis = emphasisFor(emphases, headingId);
  const headingSize = px(style.slide3.sectionHeadingSize, width);

  // Panel -- its own margin fields (independent of the generic frame
  // margin), content-driven height (icon + question + supporting line +
  // bottom padding), not the Figma spec's literal 575px (episode copy
  // varies too much in length to hardcode it, same reasoning as Slide 2/
  // Slide 3's cards).
  const panelX = px(style.slide3.panelMarginX, width);
  const panelW = width - panelX * 2;
  const panelTop = px(style.slide3.panelMarginTop, width);
  const panelPadX = px(style.slide3.panelPadX, width);
  const panelPadY = px(style.slide3.panelPadY, width);
  const panelRadius = px(style.slide3.panelRadius, width);

  const hasIcon = style.slide3.showActionIcon;
  const iconSize = px(98, width);
  const iconRadius = px(24, width);

  const questionId = "slide3.question";
  const qOffset = posFor(positions, questionId);
  const qEmphasis = emphasisFor(emphases, questionId);
  const qStyle = styleFor(false, qEmphasis);
  const qWeight = weightFor(400, qEmphasis);
  const questionSize = px(qEmphasis.size ?? style.slide3.questionSize, width);
  ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${calSansFont}`;
  const quoteLines = wrapText(ctx, quoted, panelW - panelPadX * 2);
  const quoteLineHeight = questionSize * 0.93;

  let innerCursorY = panelPadY;
  if (hasIcon) innerCursorY += iconSize + px(29, width);
  const headingTop = innerCursorY;
  if (style.slide3.sectionHeadingText) innerCursorY += headingSize + px(42, width);
  const questionTop = innerCursorY;
  innerCursorY += quoteLines.length * quoteLineHeight;
  innerCursorY += px(36, width);
  const afterTop = innerCursorY;

  const afterId = "slide3.after";
  const afterOffset = posFor(positions, afterId);
  const afterEmphasis = emphasisFor(emphases, afterId);
  const afterSize = px(afterEmphasis.size ?? style.slide3.bodySize, width);
  const afterLineHeight = afterSize * 1.3;
  let afterLines: string[] = [];
  if (after) {
    ctx.font = `${styleFor(false, afterEmphasis)} ${weightFor(500, afterEmphasis)} ${Math.round(afterSize)}px ${interFont}`;
    afterLines = wrapText(ctx, after, panelW - panelPadX * 2);
    innerCursorY += afterLines.length * afterLineHeight;
  }
  innerCursorY += panelPadY;
  const panelH = innerCursorY;

  const panelOffset = posFor(positions, "slide3.panel");
  if (draw) {
    ctx.fillStyle = style.colors.slide1OuterCardBackground;
    ctx.beginPath();
    ctx.roundRect(panelX + panelOffset.dx, panelTop + panelOffset.dy, panelW, panelH, panelRadius);
    ctx.fill();

    // Living Thread -- drawn immediately after this panel's own fill (not
    // from the dispatcher, unlike Slides 1/2/3's outer-card layers) since
    // this panel's background is repainted here, mid-draw, every render;
    // a layer drawn any earlier would just be erased by the fill above.
    // Icon/text below paint over it naturally, same "paint order is the
    // real protection, keepOut is just a bonus" reasoning as every other
    // Living Thread call site -- see living-thread.ts's own doc comment.
    if (livingThreadTile) {
      const panelRect = { x: panelX + panelOffset.dx, y: panelTop + panelOffset.dy, width: panelW, height: panelH };
      drawLivingThread(ctx, livingThreadTile, width, {
        rect: panelRect,
        radius: panelRadius,
        surface: invertColors ? "pale-green" : "dark-green",
        accents: [{ x: panelRect.x + panelRect.width * 0.971, y: panelRect.y + panelRect.height * 0.905 }],
        keepOut: [],
      });
    }
  }
  if (hotspots) {
    hotspots.push({
      id: "slide3.panel",
      x: panelX + panelOffset.dx,
      y: panelTop + panelOffset.dy,
      width: panelW,
      height: panelH,
    });
  }

  // Like every other draggable card, the panel's own drag offset only
  // nudges where ITS rectangle is drawn/hit-tested -- it never feeds back
  // into the icon/question/after's own layout math, so they stay put even
  // if the panel's background is dragged away from them (same convention
  // as Slide 2's black card and its contents).
  if (draw && hasIcon) {
    const iconX = panelX + panelPadX;
    const iconY = panelTop + panelPadY;
    ctx.fillStyle = style.colors.slide3IconCardBackground;
    ctx.beginPath();
    ctx.roundRect(iconX, iconY, iconSize, iconSize, iconRadius);
    ctx.fill();
    drawFileIconOrFallback(
      ctx,
      practiceIcon,
      () => drawPracticeIcon(ctx, iconX + iconSize / 2, iconY + iconSize / 2, iconSize * 0.62, style.colors.slide3IconColor),
      iconX + iconSize / 2,
      iconY + iconSize / 2,
      iconSize * 0.78,
      style.colors.slide3IconColor
    );
  }

  if (style.slide3.sectionHeadingText) {
    if (draw) {
      ctx.textAlign = "left";
      // "intro/accent" role (slide1ExplanationIntroText), not
      // slide1ExplanationText -- black in light mode either way, mint in
      // dark mode per the founder's dark-mode Figma pass (the question
      // text just below stays on slide1ExplanationText, white in dark).
      ctx.fillStyle = style.colors.slide1ExplanationIntroText;
      try {
        ctx.letterSpacing = `${Math.round(px(-2, width))}px`;
      } catch {
        /* Canvas2D letterSpacing unsupported -- default tracking is fine */
      }
      ctx.font = `${styleFor(false, headingEmphasis)} ${weightFor(600, headingEmphasis)} ${Math.round(headingSize)}px ${interFont}`;
      ctx.fillText(style.slide3.sectionHeadingText, panelX + panelPadX + headingOffset.dx, panelTop + headingTop + headingSize + headingOffset.dy);
      try {
        ctx.letterSpacing = "0px";
      } catch {
        /* no-op */
      }
    }
    ctx.font = `${styleFor(false, headingEmphasis)} ${weightFor(600, headingEmphasis)} ${Math.round(headingSize)}px ${interFont}`;
    const headingWidth = ctx.measureText(style.slide3.sectionHeadingText).width;
    pushHotspot(
      hotspots,
      headingId,
      panelX + panelPadX,
      headingWidth,
      panelTop + headingTop + headingSize,
      panelTop + headingTop + headingSize,
      headingSize,
      headingOffset
    );
  }

  if (draw) {
    ctx.textAlign = "left";
    ctx.fillStyle = style.colors.slide1ExplanationText;
    try {
      ctx.letterSpacing = `${Math.round(px(2.16, width))}px`;
    } catch {
      /* Canvas2D letterSpacing unsupported -- default tracking is fine */
    }
    ctx.font = `${qStyle} ${qWeight} ${Math.round(questionSize)}px ${calSansFont}`;
    let qy = panelTop + questionTop + qOffset.dy;
    for (const line of quoteLines) {
      qy += quoteLineHeight;
      ctx.fillText(line, panelX + panelPadX + qOffset.dx, qy);
    }
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
  pushHotspot(
    hotspots,
    questionId,
    panelX + panelPadX,
    panelW - panelPadX * 2,
    panelTop + questionTop + quoteLineHeight,
    panelTop + questionTop + quoteLines.length * quoteLineHeight,
    questionSize,
    qOffset
  );

  if (after) {
    if (draw) {
      ctx.fillStyle = style.colors.slide1ExplanationMutedText;
      ctx.font = `${styleFor(false, afterEmphasis)} ${weightFor(500, afterEmphasis)} ${Math.round(afterSize)}px ${interFont}`;
      let ay = panelTop + afterTop + afterOffset.dy;
      for (const line of afterLines) {
        ay += afterLineHeight;
        ctx.fillText(line, panelX + panelPadX + afterOffset.dx, ay);
      }
    }
    pushHotspot(
      hotspots,
      afterId,
      panelX + panelPadX,
      panelW - panelPadX * 2,
      panelTop + afterTop + afterLineHeight,
      panelTop + afterTop + afterLines.length * afterLineHeight,
      afterSize,
      afterOffset
    );
  }

  return panelTop + panelH;
}

/** "Carry It Forward" -- read directly off the Figma dev-mode inspector
 *  (file H9LpyoKvzC5UanyL360JLs, node 12:46): a plain white page, the
 *  whole generated aiaConnection statement as ONE centered Cal Sans
 *  headline (no more lead/trailing-clause em-dash split -- see
 *  CarouselTextOverrides.slide4's own doc comment), and a bright mint
 *  "sheet" band anchored to the canvas BOTTOM edge (not a content-driven
 *  height the way Slide 2/Slide 3/Slide 4's cards are -- this one always
 *  fills the remaining space below Slide4Style.bandMarginTop, like a
 *  bottom sheet, regardless of how much it needs), holding the canonical
 *  Tamil line again (first time it reappears since Slide 2) and the CTA
 *  copy underneath it. */
function drawSlide4Carry(
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
  overrides: { headline?: string; support?: string; ctaCopy?: string; distantDevotionConnection?: string } | undefined,
  hotspots?: CarouselHotspot[],
  livingThreadTile?: HTMLImageElement | null,
  invertColors?: boolean
): number {
  void startY;
  void frame;
  const centerX = width / 2;

  // The mint "reflection line" (episode.childLesson) -- per the founder's
  // reference image, this slide shows 4 text components: a mint
  // reflection line and a white "Aram in Action" message up top (both
  // always present, this slide's own content is never optional), then
  // the Tamil line and CTA copy in the band below (unchanged). Previously
  // this slot held episode.aiaConnection and the white slot below was the
  // optional distantDevotionConnection -- swapped per explicit founder
  // correction, since aiaConnection is the "Aram in Action" message, not
  // the reflection.
  const leadId = "slide4.headline";
  const leadOffset = posFor(positions, leadId);
  const leadEmphasis = emphasisFor(emphases, leadId);
  const heroSize = px(leadEmphasis.size ?? style.slide4.heroSize, width);
  const headline = overrides?.headline || episode.childLesson;
  const headlineMarginX = px(style.slide4.headlineMarginX, width);

  ctx.textAlign = "center";
  if (draw) {
    // "intro/accent" role (slide1ExplanationIntroText) -- black in light
    // mode (same as slide1ExplanationText there), mint in dark mode per
    // the founder's dark-mode Figma pass.
    ctx.fillStyle = style.colors.slide1ExplanationIntroText;
    try {
      ctx.letterSpacing = `${Math.round(px(2.16, width))}px`;
    } catch {
      /* Canvas2D letterSpacing unsupported -- default tracking is fine */
    }
  }
  ctx.font = `${styleFor(false, leadEmphasis)} ${weightFor(400, leadEmphasis)} ${Math.round(heroSize)}px ${calSansFont}`;
  const leadLines = wrapText(ctx, headline, width - headlineMarginX * 2);
  const leadLineHeight = heroSize * 0.93;
  let cursorY = px(style.slide4.headlineMarginTop, width);
  const headlineFirst = cursorY;
  for (const line of leadLines) {
    cursorY += leadLineHeight;
    if (draw) ctx.fillText(line, centerX + leadOffset.dx, cursorY + leadOffset.dy);
  }
  if (draw) {
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
  pushHotspot(hotspots, leadId, centerX - headlineMarginX, headlineMarginX * 2, headlineFirst + leadLineHeight, cursorY, heroSize, leadOffset);

  {
    // The white "Aram in Action" message -- episode.aiaConnection, always
    // shown now (previously this slot was the optional
    // distantDevotionConnection, which is unset for most episodes; see
    // this block's own doc comment above). overrides?.distantDevotionConnection
    // still wins when the founder has hand-edited this line -- the text
    // override's own field name is unchanged (so any already-saved
    // overrides keep applying), only the underlying episode content and
    // visual role moved.
    const connectionId = "slide4.connection";
    const connectionEmphasis = emphasisFor(emphases, connectionId);
    const connectionSize = px(connectionEmphasis.size ?? style.slide4.supportSize, width);
    cursorY += leadLineHeight * 0.5;
    // Its own token (slide4ConnectionText), not slide1ExplanationMutedText
    // -- muted grey in light mode (same value, unchanged look) but white
    // in dark mode per the founder's dark-mode Figma pass, where
    // slide1ExplanationMutedText itself stays flat muted-grey everywhere
    // else it's used.
    if (draw) ctx.fillStyle = style.colors.slide4ConnectionText;
    ctx.font = `${styleFor(false, connectionEmphasis)} ${weightFor(400, connectionEmphasis)} ${Math.round(connectionSize)}px ${interFont}`;
    const connectionText = overrides?.distantDevotionConnection || episode.aiaConnection;
    const lines = wrapText(ctx, connectionText, width - headlineMarginX * 2);
    const connectionOffset = posFor(positions, connectionId);
    let connectionFirst = 0;
    ctx.textAlign = "center";
    for (const line of lines) {
      cursorY += connectionSize * style.layout.bodyLineHeight;
      if (connectionFirst === 0) connectionFirst = cursorY;
      if (draw) ctx.fillText(line, centerX + connectionOffset.dx, cursorY + connectionOffset.dy);
    }
    pushHotspot(hotspots, connectionId, centerX - headlineMarginX, headlineMarginX * 2, connectionFirst, cursorY, connectionSize, connectionOffset);
  }
  ctx.textAlign = "left";

  // "Sheet" band -- full canvas width, rounded only at the top corners,
  // anchored to the canvas bottom edge (see Slide4Style.bandMarginTop's
  // own doc comment for why this isn't content-driven like every other
  // card in this redesign). Dark teal in light mode (episode 22's build),
  // MINT in dark mode -- the opposite pairing, per the founder's dark-mode
  // Figma pass (node 12:46's later dark variant) -- so this uses its own
  // dedicated slide4BandBackground token rather than reusing
  // slide1GreenCardBackground (which stays flat dark-teal everywhere else
  // it's used, e.g. Slide 2's photo card). slide4BandText (the Tamil
  // line/CTA copy colour, below) is inverted to match.
  const bandTop = px(style.slide4.bandMarginTop, width);
  const bandH = canvasHeight - bandTop;
  const bandOffset = posFor(positions, "slide4.band");
  if (draw) {
    ctx.fillStyle = style.colors.slide4BandBackground;
    ctx.beginPath();
    ctx.roundRect(bandOffset.dx, bandTop + bandOffset.dy, width, bandH, [px(24, width), px(24, width), 0, 0]);
    ctx.fill();

    // Living Thread -- drawn immediately after this band's own fill, same
    // "the fill happens mid-draw here, not from the dispatcher" reasoning
    // as Slide 3's panel (see its own comment). Light mode only: in dark
    // mode this band is mint (slide4BandBackground above), a surface
    // colour the Living Thread's 3-surface rule table doesn't cover -- see
    // buildLivingThreadLayers' own doc comment. seamAnchor must match the
    // dispatcher's own ground-layer anchor exactly (same rect, same (u,v))
    // so the two layers' tile grids align into one continuous diamond
    // crossing the seam, per the handover brief's own section 5.3.
    if (livingThreadTile && invertColors) {
      const bandRect = { x: bandOffset.dx, y: bandTop + bandOffset.dy, width, height: bandH };
      const seamAnchor = { x: bandRect.x + bandRect.width * 0.981, y: bandRect.y + bandRect.height * -0.026 };
      drawLivingThread(ctx, livingThreadTile, width, {
        rect: bandRect,
        radius: [px(24, width), px(24, width), 0, 0],
        surface: "dark-green",
        accents: [seamAnchor, { x: bandRect.x + bandRect.width * 0.926, y: bandRect.y + bandRect.height * 0.868 }],
        keepOut: [],
      });
    }
  }
  if (hotspots) {
    hotspots.push({ id: "slide4.band", x: bandOffset.dx, y: bandTop + bandOffset.dy, width, height: bandH });
  }

  // Like every other draggable card, the band's own drag offset only
  // nudges where ITS rectangle is drawn/hit-tested -- it never feeds back
  // into the Tamil/CTA's own layout math, so they stay put even if the
  // band's background is dragged away from them (same convention as
  // Slide 4's panel and its contents).
  const bandPadX = px(style.slide4.bandPadX, width);
  const bandPadTop = px(style.slide4.bandPadTop, width);

  const tamilId = "slide4.tamil";
  const tamilOffset = posFor(positions, tamilId);
  const tamilEmphasis = emphasisFor(emphases, tamilId);
  const tamilSize = px(tamilEmphasis.size ?? style.slide4.tamilSize, width);
  if (draw) {
    ctx.textAlign = "left";
    ctx.fillStyle = style.colors.slide4BandText;
    try {
      ctx.letterSpacing = `${Math.round(px(2.16, width))}px`;
    } catch {
      /* Canvas2D letterSpacing unsupported -- default tracking is fine */
    }
    ctx.font = `${styleFor(false, tamilEmphasis)} ${weightFor(600, tamilEmphasis)} ${Math.round(tamilSize)}px ${tamilFont}`;
    ctx.fillText(episode.tamilText, bandPadX + tamilOffset.dx, bandTop + bandPadTop + tamilSize + tamilOffset.dy);
    try {
      ctx.letterSpacing = "0px";
    } catch {
      /* no-op */
    }
  }
  pushHotspot(hotspots, tamilId, bandPadX, width - bandPadX * 2, bandTop + bandPadTop + tamilSize, bandTop + bandPadTop + tamilSize, tamilSize, tamilOffset);

  // CTA copy -- left-aligned at its own ctaPadX (NOT centered, and not the
  // Tamil line's own bandPadX -- the Figma file's later update put it at a
  // different x), per that same update, white against the now-dark-teal
  // band.
  const ctaId = "slide4.cta";
  const ctaEmphasis = emphasisFor(emphases, ctaId);
  const ctaSize = px(ctaEmphasis.size ?? style.slide4.ctaSize, width);
  const ctaCopy = overrides?.ctaCopy || episode.cta.copy;
  const ctaOffset = posFor(positions, ctaId);
  const ctaPadX = px(style.slide4.ctaPadX, width);
  ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(500, ctaEmphasis)} ${Math.round(ctaSize)}px ${interFont}`;
  if (draw) {
    ctx.textAlign = "left";
    ctx.fillStyle = style.colors.slide4BandText;
  }
  const ctaLines = wrapText(ctx, ctaCopy, width - ctaPadX * 2);
  const ctaLineHeight = ctaSize * 1.3;
  let ctaY = bandTop + bandPadTop + tamilSize * 1.5;
  const ctaFirst = ctaY;
  for (const line of ctaLines) {
    ctaY += ctaLineHeight;
    if (draw) ctx.fillText(line, ctaPadX + ctaOffset.dx, ctaY + ctaOffset.dy);
  }
  pushHotspot(hotspots, ctaId, ctaPadX, width - ctaPadX * 2, ctaFirst + ctaLineHeight, ctaY, ctaSize, ctaOffset);

  // Category pill -- inline immediately after the CTA's own LAST line (see
  // Slide4Style.showLanguagePill's own doc comment), wrapping onto its own
  // line below when that last line has no room left for it.
  if (style.slide4.showLanguagePill && episode.languageCategory && ctaLines.length > 0) {
    const pillId = "slide4.languagePill";
    const pillOffset = posFor(positions, pillId);
    const pillTextSize = px(style.slide4.pillTextSize, width);
    const pillPadX = px(style.slide4.pillPadX, width);
    const pillPadY = px(style.slide4.pillPadY, width);
    const pillRadius = px(style.slide4.pillRadius, width);
    const pillGap = px(style.slide4.pillGap, width);
    const pillText = episode.languageCategory.toUpperCase();

    ctx.font = `700 ${Math.round(pillTextSize)}px ${interFont}`;
    const pillTextWidth = ctx.measureText(pillText).width;
    const pillW = pillTextWidth + pillPadX * 2;
    const pillH = pillTextSize + pillPadY * 2;

    const lastLine = ctaLines[ctaLines.length - 1];
    ctx.font = `${styleFor(false, ctaEmphasis)} ${weightFor(500, ctaEmphasis)} ${Math.round(ctaSize)}px ${interFont}`;
    const lastLineWidth = ctx.measureText(lastLine).width;
    const lastLineBaseline = ctaY;
    const fitsInline = ctaPadX + lastLineWidth + pillGap + pillW <= width - ctaPadX;

    const pillX = (fitsInline ? ctaPadX + lastLineWidth + pillGap : ctaPadX) + pillOffset.dx;
    const pillTop =
      (fitsInline ? lastLineBaseline - ctaSize * 0.78 - (pillH - ctaSize) / 2 : lastLineBaseline + ctaLineHeight * 0.3) +
      pillOffset.dy;

    if (draw) {
      ctx.fillStyle = style.colors.languagePillBackground;
      ctx.beginPath();
      ctx.roundRect(pillX, pillTop, pillW, pillH, pillRadius);
      ctx.fill();
      ctx.textAlign = "left";
      ctx.fillStyle = style.colors.languagePillText;
      ctx.font = `700 ${Math.round(pillTextSize)}px ${interFont}`;
      ctx.fillText(pillText, pillX + pillPadX, pillTop + pillH / 2 + pillTextSize * 0.36);
    }
    pushHotspot(hotspots, pillId, pillX, pillW, pillTop, pillTop + pillH, pillTextSize, pillOffset);
  }
  ctx.textAlign = "left";

  return canvasHeight;
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
  familyImage?: HTMLImageElement | null,
  invertColors?: boolean,
  manuscriptIcon?: HTMLImageElement | null,
  practiceIcon?: HTMLImageElement | null,
  livingThreadTile?: HTMLImageElement | null
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
      return drawSlide1Understand(
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
        text?.slide1?.paragraphs,
        hotspots,
        manuscriptIcon,
        Boolean(invertColors)
      );
    case 2:
      return drawSlide2Family(
        ctx,
        style,
        frame,
        width,
        canvasHeight,
        episode,
        interFont,
        calSansFont,
        startY,
        draw,
        positions,
        emphases,
        text?.slide2?.paragraphs,
        hotspots,
        familyImage,
        Boolean(invertColors)
      );
    case 3:
      return drawSlide3Action(
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
        text?.slide3,
        hotspots,
        practiceIcon,
        livingThreadTile,
        Boolean(invertColors)
      );
    case 4:
    default:
      return drawSlide4Carry(
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
        text?.slide4,
        hotspots,
        livingThreadTile,
        Boolean(invertColors)
      );
  }
}

// ---------------------------------------------------------------------------
// Living Thread -- see living-thread.ts's own doc comment for the full
// mechanics. Everything below is this carousel's own mapping from "which
// slide, which colour mode" to the actual surface boxes/anchors/keep-out
// rects that module needs, built from this renderer's own real layout
// geometry (hotspot rects already computed elsewhere in this file, plus a
// few page-level rects this file already knows directly) -- never
// hardcoded fractions of a surface that might drift from how that surface
// is actually drawn.
// ---------------------------------------------------------------------------

/** Per the handover brief's own section 7 anchor table, resolved against
 *  whatever surface box actually exists for a given (slide, colour mode)
 *  pair -- most surfaces only exist in light/inverted mode (a separate
 *  pale/white card or page section); in dark/default mode that card never
 *  gets its own background fill (see each slideIndex's own comment in
 *  renderAathichoodiCarouselSlide), so the same anchor fractions are
 *  resolved against the full dark-green canvas instead, per explicit
 *  founder direction ("both modes, same anchors"). Slide 4's band is the
 *  one exception: in dark mode its own background is mint (slide4BandBackground),
 *  a surface colour the brief's 3-surface rule table (dark-green/pale-
 *  green/white) never covers -- that one layer is skipped there rather
 *  than guessing an unspecified thread-on-mint combination; the slide's
 *  other (ground) layer still applies. */
function buildLivingThreadLayers(
  style: CarouselStyle,
  width: number,
  height: number,
  slideIndex: number,
  invertColors: boolean,
  find: (id: string) => CarouselHotspot | undefined
): LivingThreadLayer[] {
  const layers: LivingThreadLayer[] = [];
  const fullCanvas = { x: 0, y: 0, width, height };
  const anchor = (rect: { x: number; y: number; width: number; height: number }, u: number, v: number) => ({
    x: rect.x + u * rect.width,
    y: rect.y + v * rect.height,
  });
  const rectOf = (h: CarouselHotspot | undefined) => (h ? { x: h.x, y: h.y, width: h.width, height: h.height } : null);
  const keepOutFrom = (ids: string[]) =>
    ids
      .map((id) => find(id))
      .filter((h): h is CarouselHotspot => Boolean(h))
      .map((h) => ({ x: h.x, y: h.y, width: h.width, height: h.height }));
  const footerIds = ["footer.logo", "footer.brandName", "footer.handle"];

  switch (slideIndex) {
    case 0: {
      // Cover -- light/inverted mode has two real surfaces (the dark
      // header panel, the white cover-ground below it); dark mode is one
      // full-bleed dark-green canvas, so both accents land on it together.
      if (invertColors) {
        const panelBottom = height * SLIDE0_HERO_PANEL_HEIGHT_FRACTION;
        const panelRadius = px(24, width);
        const headerRect = { x: 0, y: 0, width, height: panelBottom };
        layers.push({
          rect: headerRect,
          radius: [0, 0, panelRadius, panelRadius],
          surface: "dark-green",
          accents: [anchor(headerRect, 0.926, 0.13)],
          keepOut: keepOutFrom(["header.eyebrow", "slide0.hero", ...footerIds]),
        });
        const groundRect = { x: 0, y: panelBottom, width, height: height - panelBottom };
        layers.push({
          rect: groundRect,
          radius: 0,
          surface: "white",
          accents: [anchor(groundRect, 0.931, 0.895)],
          keepOut: keepOutFrom(["slide0.hook", "slide0.tagline", ...footerIds]),
        });
      } else {
        layers.push({
          rect: fullCanvas,
          radius: 0,
          surface: "dark-green",
          accents: [anchor(fullCanvas, 0.926, 0.13), anchor(fullCanvas, 0.931, 0.895)],
          keepOut: keepOutFrom(["header.eyebrow", "slide0.hero", "slide0.hook", "slide0.tagline", "slide0.cta", ...footerIds]),
        });
      }
      break;
    }
    case 1: {
      // Understand/Wisdom -- the pale outer card (light mode) or the full
      // canvas (dark mode, where the outer/green wrapper never draws).
      // Either way, keepOut covers the icon badge + the floating card
      // (which carries its own, unrelated ambient Tamil-letter field --
      // left untouched, see drawSlide1Understand) + the explanation body.
      const outer = invertColors ? rectOf(find("slide1.outerCard")) : fullCanvas;
      if (outer) {
        layers.push({
          rect: outer,
          radius: invertColors ? px(28, width) : 0,
          surface: invertColors ? "pale-green" : "dark-green",
          accents: [anchor(outer, 0.933, 0.055), anchor(outer, 0.057, 0.963)],
          keepOut: keepOutFrom(["slide1.icon", "slide1.blackCard", "slide1.body.0", "slide1.body.1", "slide1.body.2"]),
        });
      }
      break;
    }
    case 2: {
      // Scene/Family -- same pale-outer-card/full-canvas split as Slide 1.
      // The photo + its frame are kept out whole, per the brief's own
      // "untouched" direction for Slide 2.
      const outer = invertColors ? rectOf(find("slide2.outerCard")) : fullCanvas;
      if (outer) {
        layers.push({
          rect: outer,
          radius: invertColors ? px(28, width) : 0,
          surface: invertColors ? "pale-green" : "dark-green",
          accents: [anchor(outer, 0.966, 0.973)],
          keepOut: keepOutFrom(["slide2.photoCard", "slide2.body.0", "slide2.body.1"]),
        });
      }
      break;
    }
    // case 3 (Ask) isn't handled here -- its panel's own background is
    // repainted mid-draw inside drawSlide3Action itself every render (not
    // a one-time page-level fill like Slides 1/2's outer card), so a layer
    // drawn from this dispatcher-level pass would just be erased by that
    // later fill. See drawSlide3Action's own Living Thread call site,
    // right after that fill, instead.
    case 4: {
      // Practice/Carry -- only the ground (above the band) is handled
      // here; the band's own background is ALSO repainted mid-draw (same
      // reasoning as Slide 3's panel above), so its layer is drawn inside
      // drawSlide4Carry itself, right after that fill -- see its own call
      // site. The two layers still share one seam anchor (handover brief
      // section 5.3): this function resolves it against the same band
      // rect drawSlide4Carry uses, so both tile grids align.
      const band = rectOf(find("slide4.band"));
      if (band) {
        const groundRect = { x: 0, y: 0, width, height: band.y };
        const seamAnchor = anchor(band, 0.981, -0.026);
        const groundSurface: LTSurfaceType = invertColors ? "white" : "dark-green";
        layers.push({
          rect: groundRect,
          radius: 0,
          surface: groundSurface,
          accents: [seamAnchor],
          keepOut: keepOutFrom(["slide4.headline", "slide4.connection"]),
        });
      }
      break;
    }
  }
  return layers;
}

/** Draws every Living Thread layer for this slide, directly onto `ctx`,
 *  using whatever content geometry `knownHotspots` already carries --
 *  see this file's own call site in renderAathichoodiCarouselSlide for how
 *  that's assembled (the page-level surface rects already pushed by this
 *  point, plus a dedicated pixel-free pre-pass collecting everything
 *  else). No-ops per layer when fewer than one accent resolved (shouldn't
 *  happen given buildLivingThreadLayers above, but drawLivingThread
 *  already guards it too). */
function applyLivingThread(
  ctx: CanvasRenderingContext2D,
  tile: HTMLImageElement,
  style: CarouselStyle,
  width: number,
  height: number,
  slideIndex: number,
  invertColors: boolean,
  knownHotspots: CarouselHotspot[]
): void {
  const find = (id: string) => knownHotspots.find((h) => h.id === id);
  const layers = buildLivingThreadLayers(style, width, height, slideIndex, invertColors, find);
  for (const layer of layers) {
    drawLivingThread(ctx, tile, width, layer);
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
  // Slides 2-5 (slideIndex 1-4) previously painted an unconditional white
  // (or, for slideIndex 1/2, white-plus-a-pale-nested-card) page here
  // regardless of invertColors -- there was no real dark variant for any
  // of them until the founder's dark-mode Figma pass (5-slide "Dark" frame
  // set). In dark mode now, none of that light-mode page dressing is
  // drawn at all: drawSurface above already painted the correct dark-teal
  // field (style.colors.background), and each slide's own draw function
  // (drawSlide1Understand/drawSlide2Family/drawSlide3Action/
  // drawSlide4Carry) now reads mode-aware style.colors tokens for
  // whatever it draws on top of that. Light mode (invertColors) keeps
  // every one of these blocks exactly as built for episode 22.
  const invertColorsForPage = Boolean(opts.design?.invertColors);
  if (slideIndex === 1 && invertColorsForPage) {
    // Full-bleed white page, replacing the usual dark/white field -- the
    // outer of Slide 2's three nested cards (drawSlide1Understand draws
    // the other two) sits on top of this. See
    // CarouselColors.slide1PageBackground/slide1OuterCardBackground. Its
    // bottom edge is simply outerCardMarginBottom from the canvas edge --
    // no frame.contentBottom clamp here (that's the generic footer-safe-
    // area convention every OTHER slide's body text respects, but Slide 2
    // draws no footer lockup (see the branding condition below), and
    // clamping to it was silently shrinking this slide's whole card+
    // explanation area well short of the Figma spec's actual bottom edge).
    ctx.fillStyle = style.colors.slide1PageBackground;
    ctx.fillRect(0, 0, width, height);
    const outerMarginX = clampInset(px(style.slide1.outerCardMarginX, width), width, px(MIN_OUTER_CARD_SIZE, width));
    const [outerMarginTop, outerMarginBottom] = clampInsetPair(
      px(style.slide1.outerCardMarginTop, width),
      px(style.slide1.outerCardMarginBottom, width),
      height,
      px(MIN_OUTER_CARD_SIZE, width)
    );
    const outerBottom = height - outerMarginBottom;
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
      px(28, width)
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
  if (slideIndex === 2 && invertColorsForPage) {
    // Same full-bleed pale page + rounded outer card pattern as Slide 2
    // (UNDERSTAND) above, own margin fields (Slide2Style.outerCardMarginX/
    // Top/Bottom) so each slide's card is independently adjustable.
    // Drawn unconditionally (not just when a photo is set) -- drawSlide2Family
    // draws the teal photo card on top of this when familyImage is present,
    // or just the headline/supporting text directly on this pale page when
    // it isn't, so the slide reads consistently light either way.
    ctx.fillStyle = style.colors.slide1PageBackground;
    ctx.fillRect(0, 0, width, height);
    const outerMarginX = clampInset(px(style.slide2.outerCardMarginX, width), width, px(MIN_OUTER_CARD_SIZE, width));
    const [outerMarginTop, outerMarginBottom] = clampInsetPair(
      px(style.slide2.outerCardMarginTop, width),
      px(style.slide2.outerCardMarginBottom, width),
      height,
      px(MIN_OUTER_CARD_SIZE, width)
    );
    const outerBottom = height - outerMarginBottom;
    const outerCardOffset = posFor(positions, "slide2.outerCard");
    ctx.fillStyle = style.colors.slide1OuterCardBackground;
    ctx.beginPath();
    ctx.roundRect(
      outerMarginX + outerCardOffset.dx,
      outerMarginTop + outerCardOffset.dy,
      width - outerMarginX * 2,
      outerBottom - outerMarginTop,
      px(28, width)
    );
    ctx.fill();
    hotspots.push({
      id: "slide2.outerCard",
      x: outerMarginX + outerCardOffset.dx,
      y: outerMarginTop + outerCardOffset.dy,
      width: width - outerMarginX * 2,
      height: outerBottom - outerMarginTop,
    });
  }
  if (slideIndex === 3 && invertColorsForPage) {
    // Plain white page, per the Figma redesign (file H9LpyoKvzC5UanyL360JLs,
    // node 9:26) -- no separate outer/pale wrapping card like Slide 2/
    // Slide 2 above, just this slide's own single light panel
    // (drawSlide3Action) floating directly on white.
    ctx.fillStyle = style.colors.slide1PageBackground;
    ctx.fillRect(0, 0, width, height);
  }
  if (slideIndex === 4 && invertColorsForPage) {
    // Plain white page, per the Figma redesign (file H9LpyoKvzC5UanyL360JLs,
    // node 12:46) -- drawSlide4Carry draws the mint band directly on this,
    // same "just white, no wrapping card" pattern as Slide 4 above.
    ctx.fillStyle = style.colors.slide1PageBackground;
    ctx.fillRect(0, 0, width, height);
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
    opts.familyImage,
    opts.design?.invertColors,
    opts.manuscriptIcon,
    opts.practiceIcon
  );
  const contentHeight = measuredEndY - frame.contentTop;
  const available = frame.contentBottom - frame.contentTop;
  const slack = Math.max(0, available - contentHeight);
  const balancedStartY = frame.contentTop + slack * style.layout.verticalBalanceBias;

  if (opts.livingThreadTile) {
    // Pixel-free (mostly) geometry pre-pass: the SAME header/layout/footer
    // calls the real sequence below makes, at the real balancedStartY, just
    // to learn exactly where this slide's own content boxes will land --
    // see applyLivingThread's own doc comment. layoutSlide itself paints
    // nothing here (draw=false); drawHeader/drawFooterLockup have no such
    // flag and do paint, but idempotently (solid fills at a fixed,
    // deterministic position) -- the real calls below repaint the same
    // pixels on top regardless, so this costs one harmless extra paint,
    // never a visible difference.
    const ltHotspots: CarouselHotspot[] = [];
    drawHeader(ctx, style, frame, width, height, slideIndex, calSansFont, positions, emphases, ltHotspots);
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
      false,
      positions,
      emphases,
      text,
      ltHotspots,
      opts.familyImage,
      opts.design?.invertColors,
      opts.manuscriptIcon,
      opts.practiceIcon
    );
    drawFooterLockup(ctx, style, frame, width, height, calSansFont, interFont, opts, positions, emphases, ltHotspots);
    applyLivingThread(
      ctx,
      opts.livingThreadTile,
      style,
      width,
      height,
      slideIndex,
      Boolean(opts.design?.invertColors),
      [...hotspots, ...ltHotspots]
    );
  }

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
    opts.familyImage,
    opts.design?.invertColors,
    opts.manuscriptIcon,
    opts.practiceIcon,
    opts.livingThreadTile
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
  familyImage?: HTMLImageElement | null,
  manuscriptIcon?: HTMLImageElement | null,
  practiceIcon?: HTMLImageElement | null,
  livingThreadTile?: HTMLImageElement | null
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
    manuscriptIcon,
    practiceIcon,
    livingThreadTile,
    brandingWordmark: format.branding ? brandingWordmark : undefined,
    brandingHandle: format.branding ? brandingHandle : undefined,
    design,
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
