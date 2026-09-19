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
 * Everything else here (hookLines, humanMomentLine, meaningLine, todayLine,
 * reflectionLines) is NEW modern editorial framing this Reel format needs
 * that doesn't already exist in canon.ts in the right form: canon's own
 * `hook`/`visualStoryDirection`/`curated.modernReflection` fields serve the
 * existing 2-slide Carousel's own Hook slide and were written for that
 * slide's own wording and (for visualStoryDirection) as an English
 * production note for a single concrete scene -- the Reel's 7-frame grammar
 * asks for different, shorter, Tamil-first copy per frame (a generalized
 * human-situation line for Frame 2 rather than one specific scene, a
 * simple-Tamil meaning statement for Frame 4 rather than the Carousel's
 * English literal gloss, etc.). Keeping this as its own small overlay
 * -- rather than overloading canon.ts's existing fields with second
 * meanings, or duplicating canon.ts's schema -- is what "do not overwrite
 * existing canon data" and "keep additional editorial fields separate from
 * the original poem text" call for.
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
  /** Frame 2 (Human Moment). One short, GENERALIZED modern-situation line
   *  in Tamil -- never a specific hardcoded scene (no named airport, no
   *  named prop). Deliberately distinct from canon.ts's
   *  visualStoryDirection, which is a concrete single-image scene idea for
   *  a hypothetical future art step, not this frame's own content. */
  humanMomentLine: string;
  /** Optional short English production note restating the same
   *  generalized situation -- an internal editorial caption, never
   *  dialogue, never a claim about the classical poem. */
  humanMomentNote?: string;
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
  /** Frame 5 (Today). Concrete modern-life connection, kept short. */
  todayLine: string;
  /** Frame 6 (Reflection). Exact lines as specified for this experiment. */
  reflectionLines: readonly string[];
}

export const PURANANURU_REEL_STORYBOARD_CONTENT: readonly ReelStoryboardEditorial[] = [
  {
    poemNumber: 91,
    hookLines: ["உங்களுக்கு கிடைத்த ஒரே வாய்ப்பு.", "கொடுத்துவிடுவீர்களா?"],
    hookTreatment: "bold",
    humanMomentLine: "ஒருவருக்குக் கிடைத்த அரிய வாய்ப்பு. இன்னொருவருக்கு அது இன்னும் தேவை.",
    humanMomentNote: "Someone finally receives something rare and valuable -- another person needs it more.",
    // canon.ts tamilText lines 8-10 (0-indexed): the fruit + the act of
    // giving, the poem's own closing clause. Lines 0-7 (the opening
    // martial praise/blessing) are left out of this short excerpt, per
    // the approved storyboard's own selection -- not because they are
    // unsourced, just because they are not the strongest lines for a
    // 7-second frame.
    excerptLineRange: [8, 10],
    meaningLine:
      "ஆயுளை நீட்டிக்கும் என நம்பப்பட்ட ஒரு அரிய பழம் அதியமானுக்குக் கிடைத்தது. அதைத் தனக்கு வைத்துக்கொள்ளாமல், அவன் ஔவையாருக்குக் கொடுத்தான்.",
    todayLine: "நம்மால் தக்கவைத்துக்கொள்ளக் கூடிய ஒரு அரிய வாய்ப்பை, அது இன்னும் தேவைப்படும் இன்னொருவருக்குத் தருவது.",
    reflectionLines: ["உங்களுக்கு மிகவும் தேவையான ஒன்றை,", "யாருக்காவது கொடுத்திருப்பீர்களா?"],
  },
  {
    poemNumber: 189,
    hookLines: ["செல்வம் சேர்ப்பதற்கா?", "பகிர்வதற்கா?"],
    hookTreatment: "bold",
    humanMomentLine: "ஒருவரிடம் தேவைக்கு மேல் இருக்கிறது. இன்னொருவரின் அடிப்படைத் தேவை தெரிகிறது.",
    humanMomentNote: "Someone has more than they need -- another person's basic need is visible.",
    // canon.ts tamilText lines 4-8 (0-indexed): "எல்லோரும் ஒன்றே உண்கிறோம்,
    // உடுக்கிறோம்" through the poem's own close, "செல்வத்துப் பயனே ஈதல்"
    // included and emphasized (see emphasizeLineIndex).
    excerptLineRange: [4, 8],
    emphasizeLineIndex: 7,
    meaningLine: "நம் தனிப்பட்ட தேவைகள் வரையறுக்கப்பட்டவை. மீதம் இருப்பதை என்ன செய்கிறோம் என்பதே கேள்வி.",
    todayLine: "நம் தேவைக்கு மிஞ்சுவதை நாம் என்ன செய்கிறோம் என்பது.",
    reflectionLines: ["உங்கள் வசதி,", "உங்களுக்காக மட்டும் இருக்கிறதா?"],
  },
  {
    poemNumber: 192,
    hookLines: ["வீட்டைவிட்டு தூரம்.", "இங்கே யாரும் தெரியாது."],
    // "quiet" per the brief: a philosophical poem should feel before it
    // explains, not open with a slogan-sized line like the other two.
    hookTreatment: "quiet",
    humanMomentLine: "அறிமுகமில்லா இடத்தில், ஒரு சிறு கருணை.",
    humanMomentNote: "Someone arrives somewhere unfamiliar and experiences a small moment of human kindness.",
    // canon.ts tamilText line 0 ONLY, per the brief's explicit instruction
    // not to include the unresolved middle portion of this poem (the
    // "புணை / புனை" wording disagreement recorded in canon.ts's own header
    // stays untouched and out of scope for this first Reel cut).
    excerptLineRange: [0, 0],
    meaningLine: "எந்த இடமும் முற்றிலும் அந்நியமானது இல்லை. எந்த மனிதரும் முற்றிலும் தொடர்பற்றவர் இல்லை.",
    todayLine: "நமக்கு அறிமுகமில்லாத ஒருவரை நாம் எப்படி நடத்துகிறோம் என்பது.",
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
  humanMomentLine: string;
  humanMomentNote?: string;
  /** Exact lines sliced from the live ComposedPoem's own tamilText at the
   *  configured excerptLineRange -- never a separately authored copy. */
  excerptTamilLines: readonly string[];
  excerptTransliterationLines?: readonly string[];
  /** Index WITHIN excerptTamilLines (already adjusted from the absolute
   *  emphasizeLineIndex) to render with visual emphasis, if any. */
  emphasizeExcerptIndex?: number;
  meaningLine: string;
  todayLine: string;
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
    humanMomentLine: editorial.humanMomentLine,
    humanMomentNote: editorial.humanMomentNote,
    excerptTamilLines,
    excerptTransliterationLines,
    emphasizeExcerptIndex,
    meaningLine: editorial.meaningLine,
    todayLine: editorial.todayLine,
    reflectionLines: editorial.reflectionLines,
  };
}
