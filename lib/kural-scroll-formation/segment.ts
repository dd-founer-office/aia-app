/**
 * Kural Scroll Formation — Segmentation
 * ----------------------------------------------------------------------------
 * Deliberately isolated from lib/living-field/ entirely. This feature needs
 * literal glyph POSITION animation (scattered -> formed as the page scrolls),
 * which the locked Living Field Kernel rule -- "no later ambient engine
 * moves a glyph" (Sprint 03C) -- forbids touching. Same precedent as the KKA
 * Publishing Engine and Living Language Story branches: build outside the
 * Kernel rather than add an exception inside it. See living-region.ts /
 * living-region-state.ts (untouched, still governing the rest of the app)
 * for the rule this is deliberately not modifying.
 *
 * Grapheme segmentation logic intentionally duplicates
 * lib/living-field/reserved-verse-bridge.ts's approach (Intl.Segmenter, "ta"
 * locale, grapheme granularity) rather than importing it, for the identical
 * boundary reason reserved-verse-bridge.ts's own header documents: this is a
 * fully separate system, not a peer of the Kernel, so no dependency should
 * run in either direction.
 */

export interface KuralGrapheme {
  glyph: string;
  lineIndex: number;
  wordIndex: number;
  /** Index of this grapheme within its own word (0-based). Used to detect
   *  word start/end for spacing during layout. */
  glyphIndexInWord: number;
  wordLength: number;
  /** Reading-order index across the whole verse. Stable React key. */
  order: number;
}

/** Minimal local type for Intl.Segmenter -- a real, standard, widely-
 *  supported ECMA-402 API, but its TypeScript definitions only ship in the
 *  "ES2022.Intl" lib entry. Same shim, same reasoning, as
 *  reserved-verse-bridge.ts. */
interface MinimalSegmenter {
  segment(text: string): Iterable<{ segment: string }>;
}
interface MinimalIntlWithSegmenter {
  Segmenter: new (locale: string, options: { granularity: "grapheme" }) => MinimalSegmenter;
}

function segmentGraphemes(text: string): string[] {
  const intlWithSegmenter = Intl as unknown as Partial<MinimalIntlWithSegmenter>;
  if (typeof intlWithSegmenter.Segmenter === "function") {
    const segmenter = new intlWithSegmenter.Segmenter("ta", { granularity: "grapheme" });
    return [...segmenter.segment(text)].map((s) => s.segment);
  }
  return [...text];
}

/**
 * Parses a raw verse string ("\n"-separated lines, whitespace-separated
 * words) into a flat, reading-ordered list of graphemes with line/word
 * position preserved -- both the scatter layer and the formed layout need
 * to know where each grapheme sits in the verse's real structure.
 *
 * Pure function -- the same input always produces the same output.
 */
export function segmentKuralVerse(rawVerseText: string): KuralGrapheme[] {
  const result: KuralGrapheme[] = [];
  let order = 0;

  rawVerseText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line, lineIndex) => {
      line
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .forEach((word, wordIndex) => {
          const glyphs = segmentGraphemes(word);
          glyphs.forEach((glyph, glyphIndexInWord) => {
            result.push({
              glyph,
              lineIndex,
              wordIndex,
              glyphIndexInWord,
              wordLength: glyphs.length,
              order: order++,
            });
          });
        });
    });

  return result;
}
