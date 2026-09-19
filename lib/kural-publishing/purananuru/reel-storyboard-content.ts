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
 *
 * FINAL TEACHING ARCHITECTURE: the seven frames now follow one teaching
 * journey, not seven independent captions:
 *
 *   01 Hook               -- pose the human dilemma, reveal nothing yet
 *   02 Human Moment/Before -- SHOW the value: the choice not yet made
 *   03 Purananuru          -- this wisdom already exists in Tamil tradition
 *   04 What It Teaches     -- teachingDirection.coreValue + teachingMoment
 *   05 Human Moment/After  -- SHOW the value acted upon, resolved; a light
 *                             "today" undertone bridges toward the child
 *   06 Talk With Your Child -- teachingDirection.conversationHook
 *   07 Signature            -- unchanged brand frame
 *
 * Frame 2 / Frame 5 (Layer A, the cinematic human story) stay exactly what
 * they always were -- an abstract before/after visual pair that makes the
 * viewer FEEL the value, never an illustration of the child lesson itself
 * (no child needs to appear in them; see ReelTeachingDirection's own doc
 * comment on "story characters != teaching audience"). Frame 4 and Frame 6
 * (Layer B, the parent-to-child teaching bridge) are where the lesson is
 * actually spelled out, in Tamil, as a faithful rendering of the already-
 * approved teachingDirection -- never a second, independently-authored
 * interpretation of the poem.
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

/** Phase 9A -- a controlled, deliberately small vocabulary for HOW a poem's
 *  Frame 2 -> Frame 5 pair changes (never drawn, never animated by this
 *  phase -- see reel-motion-direction-qa.ts and PublishingWorkspace.tsx's
 *  own "Motion Direction" sidebar card, the only two places this reaches).
 *  Only the three motions the current three-poem dataset actually needs
 *  are defined, unlike ReelVisualRelationship's "figure-figure" (kept
 *  there because a plain two-figure relationship with no object/group is
 *  a near-certain future case); a fourth motion type isn't yet
 *  foreseeable from this dataset alone, so it isn't pre-added here --
 *  extend this union the next time a poem's pair needs one these three
 *  genuinely can't describe. */
export type ReelMotionType = "transfer" | "equalize" | "connect";

/** WHAT moves, or is moved toward -- semantic, renderer-resolvable
 *  identifiers, never a canvas coordinate or a reference to how
 *  drawVisualScene actually draws the shape. A future animation renderer
 *  resolves e.g. "isolatedFigure" to whatever shape the "stranger" /
 *  "belonging" scene cases draw, without this file (or the motion
 *  direction itself) knowing how. Reused by RELATIONSHIP FAMILY, not
 *  per-poem: any future "one object changes hands" poem reuses
 *  `giftObject`, any future quantity-contrast poem reuses
 *  `leftColumn`/`rightColumn`, any future isolation/inclusion poem reuses
 *  `isolatedFigure`/`communityGroup` -- see
 *  reel-motion-direction-qa.ts's own family-membership check, which is
 *  what keeps this list meaningfully enforced rather than decorative. */
export type ReelMotionTarget =
  | "primaryFigure"
  | "secondaryFigure"
  | "giftObject"
  | "leftColumn"
  | "rightColumn"
  | "isolatedFigure"
  | "communityGroup"
  | "connectionArc";

/** Cause and effect, not just "what moves" -- actor/action/target/
 *  consequence is the simplest representation that still carries story
 *  meaning: "the isolated figure moves toward the community group, and a
 *  connection results" says something; "animate figure" says nothing.
 *  `actor` and `target` are deliberately required to differ --
 *  reel-motion-direction-qa.ts rejects a motion pointing at itself as a
 *  no-op. */
export interface ReelMotionRelationship {
  actor: ReelMotionTarget;
  action: "moveToward" | "crossGap" | "levelWith" | "closeGap";
  target: ReelMotionTarget;
  /** Short semantic label for what results, e.g. "connection", "balance",
   *  "possession changes" -- editorial only, never drawn. */
  consequence: string;
}

/** Semantic pacing only -- NOT millisecond keyframes. This project has no
 *  existing timing-token convention to extend, so Phase 9A introduces the
 *  smallest one a future renderer needs: how long the transition should
 *  feel (`durationIntent`), and its coarse phase structure (`sequence`).
 *  A real renderer picks its own concrete durations/easing curves from
 *  these later -- this is direction, not implementation. */
export type ReelMotionPacing = "instant" | "brief" | "moderate" | "slow";
export type ReelMotionPhase = "hold" | "transition" | "settle";

export interface ReelMotionTiming {
  durationIntent: ReelMotionPacing;
  sequence: readonly ReelMotionPhase[];
}

/** Named easing intent only -- deliberately no cubic-bezier values or
 *  spring physics yet (Phase 9A brief's own explicit deferral); a future
 *  renderer maps these to whatever curve it actually implements. */
export type ReelMotionEasing = "linear" | "easeIn" | "easeOut" | "easeInOut";

/** What a future renderer should do instead of moving anything, when the
 *  viewer has motion reduced -- described here, not implemented (Phase 9A
 *  is direction only). "final-state" is expected to be the common case
 *  for this dataset: Frame 5's own static composition already exists and
 *  already IS the final state, so the safest fallback is usually just
 *  "render Frame 5 as already-drawn, skip Frame 2's transitional motion
 *  entirely" rather than a faded or instant version of the motion itself. */
export type ReelReducedMotionMode = "none" | "fade" | "final-state" | "instant";

export interface ReelReducedMotion {
  mode: ReelReducedMotionMode;
  /** Short editorial description of the fallback, e.g. "Show the final
   *  belonging state" -- shown in the sidebar only, never rendered. */
  description: string;
}

/** Phase 9A's whole motion-direction spec for one poem's Frame 2 -> Frame
 *  5 pair -- describes WHAT CHANGES, as a complement to ReelVisualScene
 *  (which describes what EXISTS in each frame). Lives once per poem
 *  (ReelStoryboardEditorial.motionDirection below), not once per scene,
 *  since it describes the transition between the two scenes, not either
 *  scene's own static content. Contains no canvas coordinates, no pixel
 *  values, no animation-library types -- a future animation renderer
 *  consumes this, the current static renderer never reads it (see
 *  purananuru-reel-storyboard-renderer.ts, genuinely unchanged by Phase
 *  9A). */
export interface ReelMotionDirection {
  motionType: ReelMotionType;
  relationship: ReelMotionRelationship;
  /** One short editorial sentence summarizing the actor -> action ->
   *  target chain, for the sidebar's own "Sequence" row (e.g. "Object
   *  crosses the gap"). Never drawn on the exported PNG. */
  sequenceLabel: string;
  timing: ReelMotionTiming;
  easing: ReelMotionEasing;
  reducedMotion: ReelReducedMotion;
}

/** Teaching-First Content Revision -- the bridge this whole Reel exists to
 *  build: Ancient Tamil Wisdom -> Human Value -> Teaching Moment -> Child's
 *  Modern Life -> Visual Story. Lives once per poem (like motionDirection
 *  above), not once per frame -- it describes the shared purpose of the
 *  whole Frame 2 -> Frame 5 pair, not either frame's own content.
 *
 *  STORY CHARACTERS != TEACHING AUDIENCE: the audience for this whole Reel
 *  is a child (via their parent), but that does NOT mean the visual
 *  story's own characters (frame2Scene/frame5Scene) need to be children --
 *  an adult-to-elder story (poem 91) or a two-neighbor story (poem 189)
 *  teaches the child just as well by being watched, not necessarily
 *  starred in. Nothing here changes frame2Scene/frame5Scene's own
 *  characters for that reason.
 *
 *  SOURCE OF TRUTH: every field here is derived FROM the existing canon.ts
 *  entry's own simpleMeaning/curated.understanding/curated.modernReflection
 *  (see PURANANURU_REEL_STORYBOARD_CONTENT's own per-poem comments below for
 *  exactly which canon language each field traces back to) -- never a new
 *  interpretation invented to make a poem fit a lesson. The poem's existing
 *  meaning always comes first; the teaching moment is read out of it, not
 *  imposed on it. */
export interface ReelTeachingDirection {
  /** The human value this poem can teach -- short, e.g. "Generosity",
   *  "Belonging". Must be one already supported by the poem's own
   *  coreAramTheme/simpleMeaning in canon.ts, never invented independently
   *  of them. */
  coreValue: string;
  /** What a parent could actually say to a child -- practical, human,
   *  faithful to the poem's own meaning, never a textbook definition of the
   *  coreValue (see this file's own module header: "Sharing is good" is
   *  explicitly the wrong register; the poem's own moral weight should
   *  survive the translation into parent-to-child language). */
  teachingMoment: string;
  /** Where this value shows up in a child's own modern life -- the bridge
   *  from the ancient poem to today, not a forced retelling of the poem's
   *  own scene with a child standing in for its original figures. */
  childRelevance: string;
  /** Optional short question or statement a parent could use right after
   *  showing the reel, to start a conversation rather than deliver a
   *  lecture -- kept genuinely short (reel-teaching-direction-qa.ts flags
   *  an overlong one), and not authored formulaically for poems where it
   *  doesn't add anything beyond teachingMoment/childRelevance already
   *  captured. */
  conversationHook?: string;
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
  /** Frame 4 ("What It Teaches"). A Tamil rendering of THIS poem's own
   *  teachingDirection.coreValue + teachingMoment (see each poem's own
   *  "Source:" comment below for exactly which words it traces to) -- not
   *  a retranslation of the verse, and never merged into canon.ts's own
   *  simpleMeaning field. Final Teaching Architecture revision: this used
   *  to be a plain gloss of the poem's literal meaning; its job is now
   *  specifically to answer "what does this poem TEACH", the same
   *  question teachingDirection.teachingMoment already answers in
   *  English for the parent-facing UI -- this is the Tamil-script version
   *  that actually appears on the exported PNG (drawn with tamilFont,
   *  same as every other frame's body text), so it cannot simply reuse
   *  the English string. coreValue/teachingMoment stay the single source
   *  of TRUTH; this is a faithful Tamil RENDERING of them, not an
   *  independently-evolving second interpretation -- exactly the same
   *  "same idea, different script" relationship hookLines already has to
   *  the poem's own dilemma. */
  meaningLine: string;
  /** Frame 5 (Today). The same abstract visual-scene grammar as Frame 2,
   *  showing the SAME sceneType family's resolution (the object crossing
   *  the gap, the columns leveling, the isolated figure joining the
   *  cluster) rather than a second unrelated composition. Final Teaching
   *  Architecture revision: this frame has two connected jobs -- resolve
   *  Frame 2's cinematic story (unchanged), AND bridge to "this happens
   *  in your child's world today too" (its captionLine below now carries
   *  a light "today" undertone alongside the resolution, where doing so
   *  doesn't cost the resolution its own clarity -- the fuller
   *  child-relevance text itself stays teachingDirection.childRelevance,
   *  read directly by the UI, never retyped here). */
  frame5Scene: ReelVisualScene;
  /** Frame 6 ("Talk With Your Child"). A Tamil rendering of THIS poem's
   *  own teachingDirection.conversationHook -- a genuine question for a
   *  parent to ask, not an answer, not a moral instruction (see each
   *  poem's own "Source:" comment below). Same "faithful rendering, not a
   *  second interpretation" relationship to conversationHook that
   *  meaningLine now has to coreValue/teachingMoment above. */
  reflectionLines: readonly string[];
  /** Phase 9A. Motion-direction spec for this poem's whole Frame 2 -> Frame
   *  5 transition -- see ReelMotionDirection's own doc comment. Direction
   *  only, not implemented: the static renderer never reads this field. */
  motionDirection: ReelMotionDirection;
  /** Teaching-First Content Revision. The parent-to-child bridge for this
   *  whole poem -- see ReelTeachingDirection's own doc comment. */
  teachingDirection: ReelTeachingDirection;
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
    // Frame 4 -- "What It Teaches". Tamil rendering of teachingDirection.
    // coreValue ("Generosity") + teachingMoment ("Real generosity isn't
    // giving away what you don't need -- it's noticing when someone else
    // needs the very thing you were counting on for yourself, and
    // choosing to let them have it anyway."). Replaces the old plain
    // poem-gloss meaningLine.
    meaningLine:
      "தாராள குணம் என்பது தேவையற்றதை மட்டும் கொடுப்பதல்ல. நமக்கு மிகவும் தேவையான ஒன்றை, இன்னொருவருக்கு அதிகத் தேவை என உணர்ந்து, அதைக் கொடுக்கத் தேர்ந்தெடுப்பதே தாராள குணம்.",
    frame5Scene: {
      sceneType: "choice",
      title: "THE CHOICE",
      description:
        "The same valuable object now shown moving from Figure A toward Figure B, mid-transfer, across the same gap seen in the earlier scene -- the moment of the choice itself, not a location.",
      visualMotif: "The accent object sits along a connecting arc between the two figures, now closer to Figure B than before.",
      composition: "Same two-figure baseline as before; the gap has narrowed and the object has crossed into it.",
      // Resolution ("the choice") + a light "today" undertone (Frame 5's
      // second job -- see this file's own module header) in one short
      // phrase: "A choice that's possible even today."
      captionLine: "இன்றும் சாத்தியமான தேர்வு.",
      storyRole: "transformation",
      emotionalMovement: "Rare Gift → Choice",
      visualRelationship: "object-person",
    },
    // Frame 6 -- "Talk With Your Child". Tamil rendering of
    // teachingDirection.conversationHook ("Have you ever had something
    // you really wanted to keep, but someone else needed it more?") -- a
    // genuine question, not an answer.
    reflectionLines: ["உங்களுக்குப் பிடித்த ஒன்றை வைத்துக்கொள்ள விரும்பினீர்களா,", "வேறொருவருக்கு அது அதிகத் தேவை என்றாலும்?"],
    // rare gift -> choice: the object itself is what moves, crossing the
    // same visual gap the two frames already share -- "transfer" per the
    // brief's own poem-91 example, actor is the object (not either
    // figure), since the figures' fill state simply follows the object's
    // possession, it doesn't independently "act".
    motionDirection: {
      motionType: "transfer",
      relationship: {
        actor: "giftObject",
        action: "crossGap",
        target: "secondaryFigure",
        consequence: "possession changes",
      },
      sequenceLabel: "Object crosses the gap",
      timing: { durationIntent: "brief", sequence: ["hold", "transition", "settle"] },
      easing: "easeInOut",
      reducedMotion: { mode: "final-state", description: "Show the final choice state" },
    },
    // Source: canon.ts poemNumber 91's own simpleMeaning ("Without
    // hesitation, Athiyaman kept none of it for himself and gave the fruit
    // to her") and curated.understanding ("a king who had every reason to
    // keep a death-defying fruit for himself, and didn't") -- coreAramTheme
    // is already "generosity"; the teaching moment below is that same idea
    // read for a parent-to-child audience, not a new interpretation of it.
    teachingDirection: {
      coreValue: "Generosity",
      teachingMoment:
        "Real generosity isn't giving away what you don't need -- it's noticing when someone else needs the very thing you were counting on for yourself, and choosing to let them have it anyway.",
      childRelevance:
        "This is the moment a child has to choose between keeping something they really want -- a favorite toy, the last piece of a snack, a turn they earned -- and giving it to someone who needs it more. It isn't really about the object; it's about noticing someone else's need and choosing to act on it.",
      conversationHook: "Have you ever had something you really wanted to keep, but someone else needed it more?",
    },
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
    // Frame 4 -- "What It Teaches". Tamil rendering of teachingDirection.
    // coreValue ("Sharing what you have") + teachingMoment ("your own
    // needs are still just as simple as theirs... What makes what you
    // have worth anything is what you choose to do with what's left
    // over, not how much of it you pile up.").
    meaningLine: "நமக்கு எவ்வளவு இருந்தாலும், நம் சொந்தத் தேவைகள் எளியவையே. மீதம் இருப்பதை என்ன செய்கிறோம் என்பதே, அதன் மதிப்பைத் தீர்மானிக்கிறது.",
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
      // Left as-is (Final Teaching Architecture pass): already a
      // self-directed, present-tense question ("What will I do with
      // what remains?") -- it reads as "today" on its own without
      // needing an explicit bridge word, unlike poem 91/192's captions.
      captionLine: "மிச்சம் இருப்பதை என்ன செய்வேன்?",
      storyRole: "resolution",
      emotionalMovement: "Abundance → Sharing",
      visualRelationship: "column-column",
    },
    // Frame 6 -- "Talk With Your Child". Tamil rendering of
    // teachingDirection.conversationHook ("If you had more of something
    // than you actually needed, what would you do with the extra?").
    reflectionLines: ["உங்களுக்குத் தேவைக்கு மேல் ஏதாவது இருந்தால்,", "அந்த மிச்சத்தை என்ன செய்வீர்கள்?"],
    // abundance -> sharing: the two columns move toward balance -- the
    // taller column is the actor (it has the excess to give up), the
    // shorter column is what it levels with. "equalize" per the brief's
    // own poem-189 example.
    motionDirection: {
      motionType: "equalize",
      relationship: {
        actor: "leftColumn",
        action: "levelWith",
        target: "rightColumn",
        consequence: "balance",
      },
      sequenceLabel: "Columns move toward balance",
      timing: { durationIntent: "moderate", sequence: ["hold", "transition", "settle"] },
      easing: "easeInOut",
      reducedMotion: { mode: "final-state", description: "Show the final leveled columns" },
    },
    // Source: canon.ts poemNumber 189's own simpleMeaning ("you both eat a
    // measure of rice and wear two clothes -- everything else is the same
    // for both... the true purpose of wealth is to give it away") and
    // curated.understanding ("wealth's only real function... is what it
    // lets you give beyond that"). Same coreAramTheme ("generosity") as
    // poem 91, but a distinct facet of it -- an ongoing responsibility over
    // surplus, not a single rare gift -- so coreValue is phrased as
    // "Sharing what you have" rather than duplicating poem 91's "Generosity"
    // label outright.
    teachingDirection: {
      coreValue: "Sharing what you have",
      teachingMoment:
        "However much more you have than someone else, your own needs are still just as simple as theirs -- food, clothes, rest. What makes what you have worth anything is what you choose to do with what's left over, not how much of it you pile up.",
      childRelevance:
        "This is the idea behind sharing school supplies, food, or a turn at something with a classmate who has less -- not because everyone should end up with the exact same amount, but because what you don't need yourself is exactly the part worth sharing.",
      conversationHook: "If you had more of something than you actually needed, what would you do with the extra?",
    },
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
    // Frame 4 -- "What It Teaches". Tamil rendering of teachingDirection.
    // coreValue ("Belonging") + teachingMoment ("No one is really a
    // stranger for long -- everyone goes through the same joys, the same
    // hard days, and the same ordinary life underneath whatever makes
    // them look different from you at first...").
    meaningLine:
      "வெளியில் நாம் வேறுபட்டுத் தெரியலாம். ஆனால் உள்ளே அனைவரும் ஒரே மகிழ்ச்சியையும் ஒரே கஷ்டத்தையும் கடந்து செல்கிறோம் -- அதனால் யாரும் முற்றிலும் அந்நியர் இல்லை.",
    frame5Scene: {
      sceneType: "belonging",
      title: "NOT A STRANGER ANYMORE",
      description:
        "The same isolated figure now sits closer to the cluster, filled in with the same visual weight as the others, becoming part of the group -- no flags, no maps, no world-peace imagery, just the distance closing.",
      visualMotif: "The formerly outlined figure is now filled and positioned at the near edge of the cluster; the earlier gap is closed.",
      composition: "Same cluster layout as Frame 2, redrawn with the figure integrated into the group.",
      // Resolution ("no longer a stranger") + a light "today" undertone
      // (Frame 5's second job -- see this file's own module header):
      // "Today too, this is no longer a stranger."
      captionLine: "இன்று இனி அந்நியன் இல்லை.",
      storyRole: "resolution",
      emotionalMovement: "Stranger → Belonging",
      visualRelationship: "individual-community",
    },
    // Frame 6 -- "Talk With Your Child". Tamil rendering of
    // teachingDirection.conversationHook ("What could we do when we see
    // someone standing alone?").
    reflectionLines: ["தனியாக நிற்கும் ஒருவரைப் பார்த்தால்,", "நாம் என்ன செய்யலாம்?"],
    // stranger -> belonging: the isolated figure is the actor, moving
    // toward the community group until the gap closes -- "connect" per
    // the brief's own poem-192 example (its "merge / connect" suggestion,
    // resolved to "connect" since the renderer's own belonging scene
    // keeps the figure a distinct shape at the cluster's edge, it never
    // actually blends into one shape with the others).
    motionDirection: {
      motionType: "connect",
      relationship: {
        actor: "isolatedFigure",
        action: "moveToward",
        target: "communityGroup",
        consequence: "connection",
      },
      sequenceLabel: "Move toward community, then close the gap",
      timing: { durationIntent: "moderate", sequence: ["hold", "transition", "settle"] },
      easing: "easeOut",
      reducedMotion: { mode: "final-state", description: "Show the final belonging state" },
    },
    // Source: canon.ts poemNumber 192's own simpleMeaning ("Every town is
    // our town, everyone is our kin... suffering and its relief are the
    // same for everyone") and curated.understanding ("no one is really a
    // stranger"). coreAramTheme is "universal-humanity"; coreValue below is
    // that same idea in the short, human-value register this field calls
    // for.
    teachingDirection: {
      coreValue: "Belonging",
      teachingMoment:
        "No one is really a stranger for long -- everyone goes through the same joys, the same hard days, and the same ordinary life underneath whatever makes them look different from you at first, so there's no one worth treating as more or less than yourself.",
      childRelevance:
        "This is what it feels like when a new student joins the class, when someone is sitting alone at lunch, or when a new family moves in next door -- the moment you notice they're not really so different from you, and you make room for them.",
      conversationHook: "What could we do when we see someone standing alone?",
    },
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
  motionDirection: ReelMotionDirection;
  teachingDirection: ReelTeachingDirection;
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
    motionDirection: editorial.motionDirection,
    teachingDirection: editorial.teachingDirection,
  };
}
