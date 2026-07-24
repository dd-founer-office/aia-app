/**
 * Living Field — Reserved Verse Bridge
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 2.
 *
 * Turns a raw verse string (lines separated by "\n", words separated by
 * whitespace -- the shape mockKuralOfTheDay.kural_tamil, and any future
 * KKA-style record, already uses) into the ReservedVerseInput shape
 * living-region.ts's reserveVerseSlots() expects: lines of words of
 * grapheme-cluster strings.
 *
 * This is the only file in lib/living-field/ that knows what a "line" or
 * "word" means in raw text -- reserveVerseSlots() itself never parses text,
 * it only places already-segmented data (see living-region.ts's own header
 * for why that separation matters). Keeping the parsing here, one level up,
 * is what lets living-region.ts stay completely poem-agnostic.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS DUPLICATES SEGMENTATION LOGIC INSTEAD OF IMPORTING IT
 * ---------------------------------------------------------------------------
 * lib/ambient-language/ambient-language.ts already has a
 * segmentTamilGraphemes() using the exact same Intl.Segmenter approach.
 * This file doesn't import it. The Living Region is documented (see
 * living-region.ts's header) as a property of the Living Field Kernel
 * itself, not a peer caller like the Ambient Language Layer -- so the
 * dependency direction stays "peer imports two things from the Kernel,
 * never the reverse" (AmbientLanguageLayer.md). A Kernel-side file
 * importing from the peer module would invert that, and risks a real
 * circular dependency later if the peer ever needs something from here.
 * This is the same call natural-distribution.ts already made when it
 * duplicated affinity-engine.ts's lattice-hash helper rather than reach
 * across an unrelated module boundary for ~10 lines of stable, dependency-
 * free logic.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS FILE DOES NOT DO
 * ---------------------------------------------------------------------------
 * Never invents or alters verse content -- it only reshapes whatever string
 * it's given, exactly as given. Never imports mock-data.ts or anything
 * app-specific. The caller (a later commit's Home-page wiring) is
 * responsible for supplying the real, approved KKA-record text; this file
 * would do the identical thing for a completely different phrase.
 */

import type { ReservedVerseInput, ReservedVerseLine, ReservedVerseWord } from "./living-region";

/** Minimal local type for Intl.Segmenter -- a real, standard, widely-
 *  supported ECMA-402 API, but its TypeScript definitions only ship in the
 *  "ES2022.Intl" lib entry. Same shim, same reasoning, as
 *  lib/ambient-language/ambient-language.ts -- duplicated rather than
 *  imported per this file's header. */
interface MinimalSegmenter {
  segment(text: string): Iterable<{ segment: string }>;
}
interface MinimalIntlWithSegmenter {
  Segmenter: new (locale: string, options: { granularity: "grapheme" }) => MinimalSegmenter;
}

/** Segments one word into grapheme clusters via Intl.Segmenter, falling
 *  back to raw code-point splitting only if genuinely unavailable (should
 *  not happen in any realistically targeted environment) -- consistent with
 *  ambient-language.ts's own "best-effort, never throws" philosophy. */
function segmentGraphemes(text: string): string[] {
  const intlWithSegmenter = Intl as unknown as Partial<MinimalIntlWithSegmenter>;
  if (typeof intlWithSegmenter.Segmenter === "function") {
    const segmenter = new intlWithSegmenter.Segmenter("ta", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((s) => s.segment);
  }
  return [...text];
}

/**
 * Parses a raw verse string into a ReservedVerseInput.
 *
 * - Lines are split on "\n".
 * - Words within a line are split on runs of whitespace.
 * - Each word is segmented into grapheme clusters.
 * - Blank lines and empty words (leading/trailing/doubled whitespace) are
 *   dropped rather than producing empty entries.
 *
 * Pure function -- the same input always produces the same output. Does NOT
 * validate word-per-line counts against any editorial rule (e.g. the locked
 * 4-word/3-word KKA display rule) -- this function has no opinion on any
 * specific poem's shape, per living-region.ts's own ReservedVerseInput doc
 * comment. A caller that cares about that rule checks it on the result.
 */
export function buildReservedVerseInput(rawVerseText: string): ReservedVerseInput {
  const lines: ReservedVerseLine[] = rawVerseText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line): ReservedVerseWord[] =>
      line
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => segmentGraphemes(word))
    );

  return { lines };
}
