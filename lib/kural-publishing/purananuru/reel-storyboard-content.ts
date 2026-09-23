/**
 * Purananuru — Reel Storyboard Editorial Content
 * ----------------------------------------------------------------------------
 * LOCKED BUILD. The Reel Storyboard template's own editorial overlay, kept
 * entirely separate from PURANANURU_CANON (lib/kural-publishing/purananuru/
 * canon.ts). This file adds NO literary data of its own -- it never stores a
 * copy of tamilText, poet, or simpleMeaning. Where a frame needs classical
 * Tamil (Frame 4), it is selected by LINE RANGE into the canon entry's own
 * tamilText/transliteration at compose time (see excerptLineRange below and
 * buildComposedReelStoryboard's slicing), so the actual characters shown are
 * always read live from canon.ts -- there is no second copy of the poem text
 * anywhere in this file for it to drift out of sync with.
 *
 * MASTER STORY ARCHITECTURE. Every reel follows one journey, not seven
 * independent captions:
 *
 *   01 Parent Hook            -- speak to a parenting opportunity
 *   02 Modern Child Situation -- a situation a contemporary child recognises
 *   03 Human Action / Living Tamil Moment -- the simple action, + a reusable
 *                                 poem-specific Tamil phrase a family can
 *                                 actually use in real life
 *   04 Tamil Discovery        -- "this wisdom isn't new" -- verified canon
 *                                 Tamil + Tanglish + a concise English gloss
 *   05 Aram                   -- the value, named explicitly, never left an
 *                                 invisible layer
 *   06 How To Teach           -- a practical question a parent can ask today
 *   07 Practise / Pass It On  -- heritage -> family practice -> next
 *                                 generation, plus one configurable CTA
 *
 * The deeper brand architecture (IDENTITY -> ARAM -> BELONGING ->
 * CONTINUITY) stays the internal shape this journey is built on -- it is
 * never displayed as a rigid framework or footer on any frame.
 *
 * LANGUAGE ARCHITECTURE: English explains, Tamil carries the heritage,
 * Tanglish helps pronunciation. Concretely: `hook`, `modernSituation`,
 * `modernAction`, `discoveryIntro`, `discoveryMeaning`, `aram.explanation`,
 * `teachingQuestion`, and `heritageStatement`/`cta` are English narrative
 * text; Tamil script only ever appears in the canon excerpt (Frame 4) and
 * inside `livingTamilMoment.tamil` (Frames 1 and 3) -- never as the
 * majority of any frame's own text. reel-content-qa.ts's
 * checkLanguageArchitecture enforces this deterministically (no Tamil
 * script in the English-only fields).
 *
 * VISUAL GENERATION: exactly 2 cinematic AI image prompts per reel (see
 * reel-ai-visual-direction.ts), reused across frames via crop/reframe --
 * never one prompt per frame, never a per-frame abstract "visual scene"
 * object. Frames 4-7 are pure editorial typography; no AI image is
 * associated with them at all.
 *
 * ACCURACY: every Tamil line below is either (a) an exact reference into
 * canon.ts's own sourced tamilText (Frame 4, via line range -- never
 * retyped), or (b) new editorial content -- a modern hook, a living Tamil
 * phrase, a teaching question -- clearly never presented as the classical
 * poem's own words. No traditional Tamil Aram term is invented: `aram.
 * tamilTerm` stays unset unless canon.ts/this file's own sourced content
 * already verifies one -- none of the three poems below have one yet, so
 * all three poems' `aram` uses the English concept name only, per this
 * file's own explicit instruction not to fabricate Tamil vocabulary.
 */

import type { ComposedPoem } from "./content-engine";

/** The rhetorical pattern a poem's Frame 1 hook uses -- purely descriptive
 *  metadata (never rendered), so a future editor/QA pass can see at a
 *  glance whether the 3-poem set is actually varying its hook style
 *  (section 11's "do not make the series repetitive") rather than reusing
 *  one pattern every time. */
export type HookType = "parent-question" | "curiosity" | "living-tamil" | "modern-dilemma" | "heritage-discovery";

/** A reusable, poem-specific Tamil phrase a parent and child could
 *  actually say to each other in real life -- introduced as Frame 1's
 *  hero payoff, then repeated as Frame 3's own action beat. Deliberately
 *  optional (ReelStoryboardEditorial.livingTamilMoment?): only used when a
 *  poem's own action genuinely reduces to one natural, everyday phrase
 *  (see this file's own header -- "do not invent awkward Tamil just to
 *  fill the field"). */
export interface LivingTamilMoment {
  tamil: string;
  /** Tanglish -- pronunciation support only, never the reel's primary
   *  language (see this file's own header, LANGUAGE ARCHITECTURE). */
  transliteration?: string;
  english: string;
  /** Optional one-line note on when/how the phrase is actually used --
   *  editorial only, never itself rendered as a fourth line of text. */
  context?: string;
}

/** Frame 5's explicit naming of the poem's Aram (never left an invisible
 *  conceptual layer -- see this file's own header). `value` is the human
 *  value in the short English register reel-teaching content already used
 *  ("Generosity", "Belonging", "Sharing what you have"); `tamilTerm` stays
 *  unset for all three poems below (no traditional Tamil Aram vocabulary
 *  is verified in canon.ts yet) -- see this file's own header on why that
 *  is a deliberate absence, not an oversight. */
export interface ReelAram {
  value: string;
  tamilTerm?: string;
  explanation: string;
}

/** Frame 7's one configurable call to action -- deliberately never a
 *  hardcoded Follow+Like+Comment+Share+Save+Business bundle (section 4's
 *  own explicit instruction), one short label per poem. */
export interface ReelCta {
  label: string;
}

export interface ReelStoryboardEditorial {
  poemNumber: number;
  /** Frame 1 (Parent Hook). A parenting-opportunity question, never a
   *  generic slogan and never the same pattern reused for every poem --
   *  see `hookType`. */
  hook: string;
  hookType: HookType;
  /** Frame 2 (Modern Child Situation). A situation a contemporary child
   *  immediately recognises -- concrete, never abstract moral language,
   *  never opening with the ancient poem. */
  modernSituation: string;
  /** Frame 3 (Human Action). The simple action that expresses the value,
   *  paired with `livingTamilMoment` (below) when one exists for this
   *  poem. */
  modernAction: string;
  livingTamilMoment?: LivingTamilMoment;
  /** Frame 4 (Tamil Discovery). 0-indexed, inclusive [start, end] line
   *  range into the SAME canon entry's tamilText.split("\n") /
   *  transliteration.split("\n") -- resolved at compose time, never
   *  duplicated here as literal Tamil. */
  excerptLineRange: readonly [number, number];
  /** Optional absolute line index (within the full poem, not the excerpt)
   *  to render with visual emphasis. */
  emphasizeLineIndex?: number;
  /** Frame 4's own English lead-in line -- "this wisdom isn't new" (e.g.
   *  "Our Tamil ancestors had a much bigger idea about belonging."),
   *  never a retelling of the verse itself. */
  discoveryIntro: string;
  /** Frame 4's own concise English gloss of the excerpt -- English, not
   *  Tamil, per this file's own LANGUAGE ARCHITECTURE header (a deliberate
   *  change from this frame's earlier Tamil-gloss incarnation). Modern
   *  interpretation, not a retranslation of the verse, and never merged
   *  into canon.ts's own simpleMeaning field. */
  discoveryMeaning: string;
  /** Frame 5 (Aram). See ReelAram's own doc comment. */
  aram: ReelAram;
  /** Frame 6 (How To Teach). A practical question a parent can ask today
   *  -- a conversation starter, never an answer, never preachy. */
  teachingQuestion: string;
  /** Optional supporting list of concrete modern situations this poem's
   *  value could show up in -- editorial reference data for the sidebar
   *  and for whoever authors `modernSituation`/`teachingQuestion`, never
   *  itself drawn on the exported PNG as its own frame. */
  practiceExamples?: readonly string[];
  /** Frame 7 (Practise / Pass It On). Tamil heritage -> family practice ->
   *  next generation, in English narrative -- the closing statement,
   *  drawn alongside `cta` and the brand mark on the same frame. */
  heritageStatement: string;
  cta: ReelCta;
}

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
  hook: string;
  hookType: HookType;
  modernSituation: string;
  modernAction: string;
  livingTamilMoment?: LivingTamilMoment;
  /** Exact lines sliced from the live ComposedPoem's own tamilText at the
   *  configured excerptLineRange -- never a separately authored copy. */
  excerptTamilLines: readonly string[];
  excerptTransliterationLines?: readonly string[];
  /** Index WITHIN excerptTamilLines (already adjusted from the absolute
   *  emphasizeLineIndex) to render with visual emphasis, if any. */
  emphasizeExcerptIndex?: number;
  discoveryIntro: string;
  discoveryMeaning: string;
  aram: ReelAram;
  teachingQuestion: string;
  practiceExamples?: readonly string[];
  heritageStatement: string;
  cta: ReelCta;
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
    hook: editorial.hook,
    hookType: editorial.hookType,
    modernSituation: editorial.modernSituation,
    modernAction: editorial.modernAction,
    livingTamilMoment: editorial.livingTamilMoment,
    excerptTamilLines,
    excerptTransliterationLines,
    emphasizeExcerptIndex,
    discoveryIntro: editorial.discoveryIntro,
    discoveryMeaning: editorial.discoveryMeaning,
    aram: editorial.aram,
    teachingQuestion: editorial.teachingQuestion,
    practiceExamples: editorial.practiceExamples,
    heritageStatement: editorial.heritageStatement,
    cta: editorial.cta,
  };
}

export const PURANANURU_REEL_STORYBOARD_CONTENT: readonly ReelStoryboardEditorial[] = [
  {
    poemNumber: 91,
    hook: "Do you teach your child that real generosity sometimes means giving up something you actually wanted to keep?",
    hookType: "parent-question",
    modernSituation:
      "Your child has one favourite snack left.\n\nA friend didn't bring any today.\n\nNo one is telling them to share.\n\nWhat would you want your child to do?",
    modernAction: "Sometimes generosity starts with noticing -- and choosing to give it anyway.",
    // Natural, everyday phrase -- not a translation exercise. Verified
    // against this poem's own core action (offering something you were
    // keeping for yourself) rather than invented to fill the field.
    livingTamilMoment: {
      tamil: "இது உனக்கு வேணுமா?",
      transliteration: "Idhu Unakku Vaenumaa?",
      english: "Do you want this?",
      context: "A simple, natural offer a child can make when they notice someone else wants what they have.",
    },
    // canon.ts tamilText lines 8-10 (0-indexed): the fruit + the act of
    // giving, the poem's own closing clause -- unchanged from the prior
    // Reel Storyboard cut.
    excerptLineRange: [8, 10],
    discoveryIntro: "Our Tamil ancestors told a story about this exact choice.",
    // English gloss (Language Architecture: Frame 4's meaning is now
    // English, not Tamil) -- traces to canon.ts poemNumber 91's own
    // simpleMeaning ("a rare fruit believed to ward off death... Without
    // hesitation, Athiyaman kept none of it for himself and gave the
    // fruit to her").
    discoveryMeaning: "A rare, precious fruit reached a king -- and he gave it away without keeping any for himself.",
    aram: {
      value: "Generosity",
      explanation: "Giving something away not because it's extra, but because someone else needs it more.",
    },
    teachingQuestion:
      "Try asking your child:\n\nIf you had one of something\nand a friend had none,\nwhat would you do?\n\nLet them think it through themselves.",
    practiceExamples: ["a favourite snack", "a turn in a game", "a favourite object"],
    heritageStatement:
      "Our Tamil heritage has carried a powerful idea:\n\nWhat makes a gift meaningful\nis that it cost you something to give.\n\nGive your child the chance\nto discover that for themselves.",
    cta: { label: "Save this conversation for later." },
  },
  {
    poemNumber: 189,
    hook: "Extra pencils. A classmate with none. What would you want your child to do?",
    hookType: "modern-dilemma",
    modernSituation:
      "Your child has extra pencils in their bag.\n\nA classmate has none today.\n\nYour child didn't even notice -- until now.\n\nWhat happens next?",
    modernAction: "Sometimes the question isn't what you have. It's what you do with what's extra.",
    livingTamilMoment: {
      tamil: "இன்னும் இருக்கு, வேணுமா?",
      transliteration: "Innum Irukku, Vaenumaa?",
      english: "There's more -- want some?",
      context: "A natural, everyday way to offer what's left over, without making it a big gesture.",
    },
    // canon.ts tamilText lines 4-8 (0-indexed): "எல்லோரும் ஒன்றே உண்கிறோம்,
    // உடுக்கிறோம்" through the poem's own close, "செல்வத்துப் பயனே ஈதல்"
    // included and emphasized -- unchanged from the prior Reel Storyboard
    // cut.
    excerptLineRange: [4, 8],
    emphasizeLineIndex: 7,
    discoveryIntro: "Our Tamil ancestors already knew this about wealth.",
    // English gloss -- traces to canon.ts poemNumber 189's own
    // simpleMeaning ("you both eat a measure of rice and wear two
    // clothes... the true purpose of wealth is to give it away").
    discoveryMeaning:
      "A king and an ordinary watchman both eat the same, wear the same. What we have beyond that is only worth what we choose to do with it.",
    aram: {
      value: "Sharing what you have",
      explanation: "Recognising that what's beyond your own need is exactly the part worth giving.",
    },
    teachingQuestion:
      "Try asking your child:\n\nIf you had more of something\nthan you actually needed,\nwhat would you do with the extra?\n\nLet them think of their own answer.",
    practiceExamples: ["extra pencils", "extra snacks", "unused things", "sharing what you have"],
    heritageStatement:
      "Our Tamil heritage has carried a powerful idea:\n\nWhat you have beyond your need\nwas never really just yours to keep.\n\nGive your child the chance\nto notice their own \"extra.\"",
    cta: { label: "Save this conversation for later." },
  },
  {
    poemNumber: 192,
    hook: "What if one of the most important things you teach your child begins with two simple words?",
    hookType: "curiosity",
    modernSituation:
      "Someone new joins the class.\n\nThey don't know anyone yet.\nEveryone else already has their friends.\n\nWhat would you teach your child to do?",
    modernAction: "Sometimes belonging starts with one small invitation.",
    livingTamilMoment: {
      tamil: "விளையாட வரியா?",
      transliteration: "Vilayaada Variyaa?",
      english: "Want to play?",
      context: "A simple invitation any child can offer someone sitting alone.",
    },
    // canon.ts tamilText line 0 ONLY, per the poem's own explicit line-0
    // cut ("யாதும் ஊரே, யாவரும் கேளிர்") -- unchanged from the prior Reel
    // Storyboard cut; the unresolved "புணை / புனை" middle portion stays out
    // of scope.
    excerptLineRange: [0, 0],
    discoveryIntro: "Our Tamil ancestors had a much bigger idea about belonging.",
    // English gloss -- traces to canon.ts poemNumber 192's own
    // simpleMeaning ("Every town is our town, everyone is our kin").
    discoveryMeaning: "Every place can be home. Everyone can be kin.",
    aram: {
      value: "Belonging",
      explanation: "Seeing another person as someone who belongs -- not someone who is \"other.\"",
    },
    teachingQuestion:
      "Try asking your child:\n\nIf you saw someone sitting alone,\nwhat could you do?\n\nLet them think of their own answer.",
    practiceExamples: ["a new student", "someone alone at lunch", "a new family next door"],
    heritageStatement:
      "Our Tamil heritage has carried a powerful idea:\n\nPeople don't have to remain strangers.\n\nGive your child the chance\nto make someone feel they belong.",
    cta: { label: "Save this conversation for later." },
  },
];
