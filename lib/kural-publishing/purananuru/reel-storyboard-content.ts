/**
 * Purananuru — Reel Storyboard Editorial Content
 * ----------------------------------------------------------------------------
 * The Reel Storyboard template's own editorial overlay, kept entirely
 * separate from PURANANURU_CANON (lib/kural-publishing/purananuru/canon.ts).
 * This file adds NO literary data of its own -- it never stores a copy of
 * tamilText, poet, or simpleMeaning. Where a frame needs classical Tamil
 * (Frame 3), it is selected by LINE RANGE into the canon entry's own
 * tamilText/transliteration at compose time (see excerptLineRange below and
 * buildComposedReelStoryboard's slicing), so the actual characters shown are
 * always read live from canon.ts -- there is no second copy of the poem
 * text anywhere in this file for it to drift out of sync with.
 *
 * Everything else here (hookLines, frame2Scene/frame5Scene, meaningLine,
 * reflectionLines) is NEW modern editorial framing this Reel format needs
 * that doesn't already exist in canon.ts in the right form: canon's own
 * `hook`/`visualStoryDirection`/`curated.modernReflection` fields serve the
 * existing 2-slide Carousel's own Hook slide and were written for that
 * slide's own wording and (for visualStoryDirection) as an English
 * production note for a single concrete PHOTOGRAPHIC scene -- the Reel's
 * 7-frame grammar asks for different, shorter, Tamil-first copy per frame
 * (an abstract, geometric visual-scene composition for Frame 2 / Frame 5
 * rather than one concrete photographic scene, a simple-Tamil meaning
 * statement for Frame 4 rather than the Carousel's English literal gloss,
 * etc.). Keeping this as its own small overlay -- rather than overloading
 * canon.ts's existing fields with second meanings, or duplicating canon.ts's
 * schema -- is what "do not overwrite existing canon data" and "keep
 * additional editorial fields separate from the original poem text" call
 * for.
 *
 * ACCURACY: every Tamil line below is either (a) an exact reference into
 * canon.ts's own sourced tamilText (Frame 3, via line range -- never
 * retyped), or (b) new editorial content -- modern interpretation, a modern
 * hook, a modern reflection question -- clearly never presented as the
 * classical poem's own words. No historical fact is introduced beyond what
 * canon.ts's own simpleMeaning/poet fields already establish.
 */

import type { ComposedPoem } from "./content-engine";

export type HookTreatment = "bold" | "quiet";

/** The six abstract visual-scene concepts used across Frame 2 and Frame 5,
 *  one pair per poem. Purely a categorical tag for the renderer's drawing
 *  dispatcher (purananuru-reel-storyboard-renderer.ts's drawVisualScene) --
 *  never rendered as text. */
export type ReelVisualSceneType =
  | "rare-gift"
  | "choice"
  | "abundance"
  | "sharing"
  | "stranger"
  | "belonging";

/** What narrative job this scene does within its poem's Frame 2 -> Frame 5
 *  pair -- Phase 8A's "story arc" vocabulary, purely editorial metadata
 *  (never drawn, never read by the renderer). Deliberately a small closed
 *  set rather than the richer taxonomy the Phase 8A brief sketched
 *  (CONTRAST/SITUATION/TENSION/TRANSFORMATION/RESOLUTION): "situation" is
 *  folded into "contrast"/"tension" (every Frame 2 in this dataset opens
 *  on one of those two, never a neutral establishing shot), and
 *  reel-visual-story-qa.ts's scene-type/story-role pairing check is what
 *  keeps this set meaningfully enforced rather than decorative. */
export type ReelStoryRole = "contrast" | "tension" | "transformation" | "resolution";

/** What kind of visual axis the composition is fundamentally built on --
 *  the same axis for both scenes in a poem's pair (Frame 5 resolves the
 *  same relationship Frame 2 establishes, it doesn't introduce a new
 *  one). Matches this file's `sceneType` naming convention (lowercase,
 *  hyphenated) rather than the brief's illustrative ALL-CAPS/arrow
 *  examples. "figure-figure" is left unused by the current three poems
 *  but kept in the union for a future poem whose composition is a plain
 *  two-person relationship with no object or group involved. */
export type ReelVisualRelationship = "object-person" | "column-column" | "individual-community" | "figure-figure";

/** Art direction for one abstract, geometric visual composition -- NOT an
 *  image-generation prompt and NOT a place to store literary text. Every
 *  field here describes shapes, weight, and spatial relationships (a
 *  future illustrator or the current Canvas renderer's own abstract
 *  primitives), never a literal photographic scene, a named prop, or a
 *  stereotype. See this file's own module header: canon.ts's tamilText /
 *  poet / simpleMeaning are never duplicated here, and neither is any new
 *  literary content -- `captionLine` is the one short piece of NEW
 *  editorial Tamil text this scene contributes, kept intentionally brief
 *  ("one short supporting phrase at most") since the composition itself,
 *  not a paragraph of copy, is what carries Frame 2 / Frame 5.
 *
 *  Phase 8A adds three purely editorial "story arc" fields (storyRole,
 *  emotionalMovement, visualRelationship) so reel-visual-story-qa.ts can
 *  check, deterministically, whether a poem's Frame 2 -> Frame 5 pair
 *  actually describes a coherent transformation rather than two
 *  unrelated compositions. None of the three is read by the renderer or
 *  drawn on the exported PNG -- see PublishingWorkspace.tsx's own
 *  "Visual Story Direction" sidebar panel, the one place they surface. */
export interface ReelVisualScene {
  sceneType: ReelVisualSceneType;
  /** Short internal English label (e.g. "ONE RARE THING") -- shown only in
   *  the workspace's own "Visual Story Direction" sidebar panel, never
   *  burned into the exported PNG. */
  title: string;
  /** Internal art-direction description of the composition's intent, for
   *  the sidebar panel and for whoever eventually briefs an illustrator --
   *  never a literal image-generation prompt (no named location, no named
   *  prop, no ethnicity/costume detail). */
  description: string;
  /** One-line technical note on the abstract shapes/weights used, so the
   *  renderer's drawVisualScene dispatcher and the sidebar panel describe
   *  the same composition consistently. */
  visualMotif: string;
  /** One-line note on the spatial layout (figure/column/gap placement). */
  composition: string;
  /** The one short Tamil phrase actually drawn on the exported frame below
   *  the composition -- new editorial copy, never classical text, never a
   *  retyped canon.ts line. */
  captionLine: string;
  /** This scene's narrative job -- see ReelStoryRole. reel-visual-story-qa
   *  checks this against `sceneType` (a "resolution"-family scene type
   *  paired with a "contrast"/"tension" role is flagged as a mismatch). */
  storyRole: ReelStoryRole;
  /** The poem's whole Frame 2 -> Frame 5 arc, in short "A -> B" form (e.g.
   *  "Stranger -> Belonging") -- deliberately IDENTICAL on both scenes in
   *  a pair, since it names the arc the PAIR tells, not a per-frame
   *  state. reel-visual-story-qa checks both halves agree. Describes the
   *  visual/emotional movement only, never a retelling of the poem. */
  emotionalMovement: string;
  /** The visual axis this composition is built on -- see
   *  ReelVisualRelationship. Also identical across a poem's Frame 2 /
   *  Frame 5 pair (Frame 5 resolves the same axis Frame 2 opened, it
   *  doesn't switch to a different one). */
  visualRelationship: ReelVisualRelationship;
}

export interface ReelStoryboardEditorial {
  poemNumber: number;
  /** Frame 1 (Hook). Exact lines as authored for the Reel -- deliberately
   *  independent of canon.ts's own `hook` field, which serves the existing
   *  Carousel's Slide 1 and is worded for that slide, not this one. */
  hookLines: readonly string[];
  /** "bold" (large, centered emphasis) for a story/idea-led hook; "quiet"
   *  for a philosophical poem where the brief calls for restraint over a
   *  slogan (Purananuru 192). Purely a rendering hint, never content. */
  hookTreatment: HookTreatment;
  /** Frame 2 (Human Moment). An abstract, editorial visual-scene
   *  composition -- deliberately distinct from canon.ts's
   *  visualStoryDirection, which is a concrete single-image scene idea for
   *  a hypothetical future PHOTOGRAPHIC art step, not this frame's own
   *  abstract-geometry content. */
  frame2Scene: ReelVisualScene;
  /** Frame 3 (Purananuru). 0-indexed, inclusive [start, end] line range
   *  into the SAME canon entry's tamilText.split("\n") /
   *  transliteration.split("\n") -- resolved at compose time, never
   *  duplicated here as literal Tamil. */
  excerptLineRange: readonly [number, number];
  /** Optional absolute line index (within the full poem, not the excerpt)
   *  to render with visual emphasis -- e.g. poem 189's brief calls for
   *  "செல்வத்துப் பயனே ஈதல்" to appear prominently within its excerpt. */
  emphasizeLineIndex?: number;
  /** Frame 4 (Meaning). Simple contemporary Tamil explanation of the
   *  selected idea -- modern interpretation, not a retranslation of the
   *  verse, and never merged into canon.ts's own simpleMeaning field. */
  meaningLine: string;
  /** Frame 5 (Today). The same abstract visual-scene grammar as Frame 2,
   *  showing the SAME sceneType family's resolution (the object crossing
   *  the gap, the columns leveling, the isolated figure joining the
   *  cluster) rather than a second unrelated composition. */
  frame5Scene: ReelVisualScene;
  /** Frame 6 (Reflection). Exact lines as specified for this experiment. */
  reflectionLines: readonly string[];
}

export const PURANANURU_REEL_STORYBOARD_CONTENT: readonly ReelStoryboardEditorial[] = [
  {
    poemNumber: 91,
    hookLines: ["உங்களுக்கு கிடைத்த ஒரே வாய்ப்பு.", "கொடுத்துவிடுவீர்களா?"],
    hookTreatment: "bold",
    // Universal "one rare thing, two figures" composition -- no airport, no
    // boarding-pass concept (that belongs to a different, earlier
    // storyboard and is explicitly out of scope here).
    frame2Scene: {
      sceneType: "rare-gift",
      title: "ONE RARE THING",
      description:
        "A single valuable object held close by one figure. A second figure remains separated across a quiet visual gap. The composition should communicate possession and someone else's need -- universal, no specific place or prop.",
      visualMotif: "One glowing accent object beside Figure A; Figure B stands apart, dimmed, without the object.",
      composition: "Two abstract figures on a shared baseline, separated by open space; the object sits only near Figure A.",
      captionLine: "ஒரே ஒரு அரிய பொருள்.",
      storyRole: "contrast",
      emotionalMovement: "Rare Gift → Choice",
      visualRelationship: "object-person",
    },
    // canon.ts tamilText lines 8-10 (0-indexed): the fruit + the act of
    // giving, the poem's own closing clause. Lines 0-7 (the opening
    // martial praise/blessing) are left out of this short excerpt, per
    // the approved storyboard's own selection -- not because they are
    // unsourced, just because they are not the strongest lines for a
    // 7-second frame.
    excerptLineRange: [8, 10],
    meaningLine:
      "ஆயுளை நீட்டிக்கும் என நம்பப்பட்ட ஒரு அரிய பழம் அதியமானுக்குக் கிடைத்தது. அதைத் தனக்கு வைத்துக்கொள்ளாமல், அவன் ஔவையாருக்குக் கொடுத்தான்.",
    frame5Scene: {
      sceneType: "choice",
      title: "THE CHOICE",
      description:
        "The same valuable object now shown moving from Figure A toward Figure B, mid-transfer, across the same gap seen in the earlier scene -- the moment of the choice itself, not a location.",
      visualMotif: "The accent object sits along a connecting arc between the two figures, now closer to Figure B than before.",
      composition: "Same two-figure baseline as before; the gap has narrowed and the object has crossed into it.",
      captionLine: "அந்த தேர்வு.",
      storyRole: "transformation",
      emotionalMovement: "Rare Gift → Choice",
      visualRelationship: "object-person",
    },
    reflectionLines: ["உங்களுக்கு மிகவும் தேவையான ஒன்றை,", "யாருக்காவது கொடுத்திருப்பீர்களா?"],
  },
  {
    poemNumber: 189,
    hookLines: ["செல்வம் சேர்ப்பதற்கா?", "பகிர்வதற்கா?"],
    hookTreatment: "bold",
    // Editorial quantity contrast -- NOT literal money, NOT luxury imagery,
    // NOT a rich/poor stereotype: two abstract columns of equal shape,
    // unequal height, kept dignified.
    frame2Scene: {
      sceneType: "abundance",
      title: "MORE THAN I NEED",
      description:
        "An editorial quantity contrast: one abstract column of accumulated units clearly taller than a second, modest column representing a basic need. Not money, not luxury goods, not rich-vs-poor stereotypes -- a dignified visual contrast in quantity only.",
      visualMotif: "Two vertical columns of stacked abstract units, unequal height, identical shape and color.",
      composition: "Two columns side by side on a shared baseline, generous whitespace between them.",
      captionLine: "தேவைக்கு மேல் இருப்பது.",
      storyRole: "contrast",
      emotionalMovement: "Abundance → Sharing",
      visualRelationship: "column-column",
    },
    // canon.ts tamilText lines 4-8 (0-indexed): "எல்லோரும் ஒன்றே உண்கிறோம்,
    // உடுக்கிறோம்" through the poem's own close, "செல்வத்துப் பயனே ஈதல்"
    // included and emphasized (see emphasizeLineIndex).
    excerptLineRange: [4, 8],
    emphasizeLineIndex: 7,
    meaningLine: "நம் தனிப்பட்ட தேவைகள் வரையறுக்கப்பட்டவை. மீதம் இருப்பதை என்ன செய்கிறோம் என்பதே கேள்வி.",
    // Deliberately no donation button, no charity logo, no reference to
    // Aram in Action -- this is a literary experiment, not a fundraising
    // creative.
    frame5Scene: {
      sceneType: "sharing",
      title: "WHAT WILL I DO WITH WHAT REMAINS?",
      description:
        "The relationship between the two columns shifts: a few units move from the taller column toward the shorter one, which is now nearly level with it -- accumulation becoming usefulness. No donation iconography of any kind.",
      visualMotif: "A few units mid-transit along a connecting arc from the tall column to the short column; the two heights are now visibly closer.",
      composition: "Same two-column layout as Frame 2, redrawn with the height gap reduced.",
      captionLine: "மிச்சம் இருப்பதை என்ன செய்வேன்?",
      storyRole: "resolution",
      emotionalMovement: "Abundance → Sharing",
      visualRelationship: "column-column",
    },
    reflectionLines: ["உங்கள் வசதி,", "உங்களுக்காக மட்டும் இருக்கிறதா?"],
  },
  {
    poemNumber: 192,
    hookLines: ["வீட்டைவிட்டு தூரம்.", "இங்கே யாரும் தெரியாது."],
    // "quiet" per the brief: a philosophical poem should feel before it
    // explains, not open with a slogan-sized line like the other two.
    hookTreatment: "quiet",
    // No flags, no maps, no airport clichés, no "world peace" imagery --
    // kept intimate and human: one isolated figure, visual distance from a
    // small cluster of others.
    frame2Scene: {
      sceneType: "stranger",
      title: "A STRANGER",
      description:
        "One isolated figure set apart from a loose cluster of other abstract figures, with a visible gap of empty space between them -- communicating unfamiliarity, kept intimate and human rather than geographic.",
      visualMotif: "One dimmed, outlined figure alone on one side; a small cluster of filled figures on the other, separated by clear space.",
      composition: "Asymmetric composition: the isolated figure occupies roughly a third of the width, the cluster the rest, with a quiet gap between.",
      captionLine: "ஒரு அந்நியன்.",
      storyRole: "tension",
      emotionalMovement: "Stranger → Belonging",
      visualRelationship: "individual-community",
    },
    // canon.ts tamilText line 0 ONLY, per the brief's explicit instruction
    // not to include the unresolved middle portion of this poem (the
    // "புணை / புனை" wording disagreement recorded in canon.ts's own header
    // stays untouched and out of scope for this first Reel cut).
    excerptLineRange: [0, 0],
    meaningLine: "எந்த இடமும் முற்றிலும் அந்நியமானது இல்லை. எந்த மனிதரும் முற்றிலும் தொடர்பற்றவர் இல்லை.",
    frame5Scene: {
      sceneType: "belonging",
      title: "NOT A STRANGER ANYMORE",
      description:
        "The same isolated figure now sits closer to the cluster, filled in with the same visual weight as the others, becoming part of the group -- no flags, no maps, no world-peace imagery, just the distance closing.",
      visualMotif: "The formerly outlined figure is now filled and positioned at the near edge of the cluster; the earlier gap is closed.",
      composition: "Same cluster layout as Frame 2, redrawn with the figure integrated into the group.",
      captionLine: "இனி அந்நியன் இல்லை.",
      storyRole: "resolution",
      emotionalMovement: "Stranger → Belonging",
      visualRelationship: "individual-community",
    },
    reflectionLines: ["இன்று நீங்கள் சந்திக்கும் அந்நியர்,", "உங்களுக்கு எப்படிப்பட்டவர்?"],
  },
];

export function getReelStoryboardEditorial(poemNumber: number): ReelStoryboardEditorial | undefined {
  return PURANANURU_REEL_STORYBOARD_CONTENT.find((e) => e.poemNumber === poemNumber);
}

export interface ComposedReelStoryboard {
  poemNumber: number;
  totalPoems: number;
  poet: string;
  themeLabel: string;
  verified: boolean;
  sourceUrl: string;
  hookLines: readonly string[];
  hookTreatment: HookTreatment;
  frame2Scene: ReelVisualScene;
  /** Exact lines sliced from the live ComposedPoem's own tamilText at the
   *  configured excerptLineRange -- never a separately authored copy. */
  excerptTamilLines: readonly string[];
  excerptTransliterationLines?: readonly string[];
  /** Index WITHIN excerptTamilLines (already adjusted from the absolute
   *  emphasizeLineIndex) to render with visual emphasis, if any. */
  emphasizeExcerptIndex?: number;
  meaningLine: string;
  frame5Scene: ReelVisualScene;
  reflectionLines: readonly string[];
}

/** Derives the Reel Storyboard's own content view from an already-composed
 *  ComposedPoem (the same object the existing 2-slide Carousel renders) --
 *  reused, not recomputed: both templates share one compose pipeline
 *  (content-engine.ts's loadPoem/generateNextPoem, untouched by this file).
 *  Returns null when no Reel editorial overlay exists yet for this poem
 *  number (e.g. a future poem added to canon.ts before its Reel content is
 *  authored) -- callers render an honest "not yet available" frame rather
 *  than guessing. */
export function buildComposedReelStoryboard(poem: ComposedPoem): ComposedReelStoryboard | null {
  const editorial = getReelStoryboardEditorial(poem.poemNumber);
  if (!editorial) return null;

  const [start, end] = editorial.excerptLineRange;
  const tamilLines = poem.tamilText.split("\n");
  const excerptTamilLines = tamilLines.slice(start, end + 1);

  const translitLines = poem.transliteration?.split("\n");
  const excerptTransliterationLines =
    translitLines && translitLines.length === tamilLines.length
      ? translitLines.slice(start, end + 1)
      : undefined;

  const emphasizeExcerptIndex =
    editorial.emphasizeLineIndex !== undefined && editorial.emphasizeLineIndex >= start && editorial.emphasizeLineIndex <= end
      ? editorial.emphasizeLineIndex - start
      : undefined;

  return {
    poemNumber: poem.poemNumber,
    totalPoems: poem.totalPoems,
    poet: poem.poet,
    themeLabel: poem.themeLabel,
    verified: poem.verified,
    sourceUrl: poem.sourceUrl,
    hookLines: editorial.hookLines,
    hookTreatment: editorial.hookTreatment,
    frame2Scene: editorial.frame2Scene,
    excerptTamilLines,
    excerptTransliterationLines,
    emphasizeExcerptIndex,
    meaningLine: editorial.meaningLine,
    frame5Scene: editorial.frame5Scene,
    reflectionLines: editorial.reflectionLines,
  };
}
