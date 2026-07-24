/**
 * Living Field — Living Region
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 1: Reserved Semantic Cells.
 *
 * Governing principle for this file and everything that grows on top of it:
 *
 *   The Living Region is not a feature layered onto the Living Field.
 *   It is a property of the Living Field itself.
 *
 * This is why this module lives inside lib/living-field/ rather than beside
 * lib/ambient-language/ (a genuine peer, calling INTO the Kernel through one
 * method, per AmbientLanguageLayer.md). The Living Region is not a caller of
 * the Kernel -- it IS part of the Kernel: a capability of layout generation
 * itself, exactly like the Civilization Engine's script/glyph selection.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS COMMIT ADDS
 * ---------------------------------------------------------------------------
 * Reserved Semantic Cells: an OPTIONAL capability of buildFieldLayout()
 * (field-layout.ts). When a caller supplies a ReservedVerseInput, a small,
 * deterministic run of cells inside a configured viewport rectangle is
 * seeded with specific graphemes (in reading order, left-aligned lines)
 * instead of the normal random Civilization Engine dealing. Every cell
 * outside that rectangle, and every cell when no input is supplied, is
 * completely unaffected.
 *
 * No caller supplies a ReservedVerseInput yet (engine.ts is unchanged in
 * this commit). The application behaves exactly as it does today. Wiring a
 * real phrase in, and the press-and-hold interaction that reveals it, are
 * later commits in this same sprint, reviewed separately.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS MODULE HAS NO OPINION ABOUT TAMIL, KURAL, OR ANY SPECIFIC POEM
 * ---------------------------------------------------------------------------
 * This module never imports mock-data.ts, never imports anything from
 * lib/ambient-language/, and never segments a raw string itself. It
 * receives an already-segmented ReservedVerseInput -- lines of words of
 * grapheme-cluster strings -- from whichever caller wires it up (a later
 * commit's Home-page bridge, using the same Intl.Segmenter approach
 * lib/ambient-language/ambient-language.ts already established). A future
 * Aathichoodi line, proverb, or a different day's Kural is a new call with
 * new data, never a code change here.
 *
 * ---------------------------------------------------------------------------
 * CONFIGURATION SHAPE
 * ---------------------------------------------------------------------------
 * Per explicit direction, every Living Region tuning value lives in ONE
 * place, grouped the way the values are actually used: `viewport` (where the
 * rectangle sits), `typography` (how the verse lays out inside it),
 * `opacity` and `timings` (how the reveal/dismiss interaction behaves).
 * `opacity` and `timings` are not consumed by any code yet -- scaffolded now
 * so later commits add behaviour, not new config surface.
 *
 * LIVING_FIELD_CONFIG (config.ts) is intentionally left untouched: it is the
 * founder-locked, previously-calibrated general field tuning, and this
 * module is additive to it, not a modification of it.
 */

import type { FieldStratum } from "./config";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface LivingRegionViewportConfig {
  /** Which side of the viewport the rectangle is anchored to. Locked
   *  editorial rule: verses read left-aligned, so this stays "left" for
   *  KKA-style content -- kept as a real option, not a hardcoded assumption,
   *  since a future reflection type may anchor differently. */
  horizontalAnchor: "left" | "center" | "right";
  /** Rectangle width, as a fraction of viewport width (0–1). */
  width: number;
  /** Rectangle top edge, as a fraction of viewport height (0–1). */
  top: number;
  /** Margin from the anchored edge, as a fraction of viewport width. Unused
   *  when horizontalAnchor is "center". */
  horizontalMargin: number;
}

export interface LivingRegionTypographyConfig {
  /** Locked editorial display rule: word count per line, first line then
   *  second. Documentation only -- the caller's actual ReservedVerseInput is
   *  what gets placed; this isn't enforced here, since this module has no
   *  opinion on any specific poem's shape. */
  wordsPerLine: readonly [number, number];
  /** Empty grid columns inserted between two words on the same line. */
  wordGapColumns: number;
  /** Empty grid rows inserted between line 1 and line 2. */
  lineGapRows: number;
  /** Empty grid columns/rows kept between the verse and the rectangle's own
   *  edges -- the verse never touches the boundary the interaction layer
   *  will later use as its hit-target. */
  verseInset: { columns: number; rows: number };
  /** Which config.ts stratum id the verse borrows its font size and script
   *  weighting from. Always the shallowest/most legible configured stratum --
   *  a reflection is never rendered at an "ancient" depth. */
  stratumId: string;
  /** Fraction of the Field's ordinary Natural Distribution jitter (see
   *  natural-distribution.ts's JITTER_FRACTION) the verse receives.
   *  Deliberately small -- enough to avoid a mechanically rectangular look,
   *  never enough to harm legibility. */
  positionJitterScale: number;
}

/** Not consumed until the reveal/dismiss interaction lands (a later commit).
 *  Scaffolded now so all Living Region tuning lives in one file from the
 *  start, per explicit direction. */
export interface LivingRegionOpacityConfig {
  /** Opacity target when fully revealed (before the stratum's own wave/
   *  breath modulation). 1.0 would look flat/harsh against the field's
   *  otherwise very low opacities; kept below 1 on purpose. */
  revealOpacityTarget: number;
  /** Ceiling on the anticipation phase (0..holdThresholdMs), as a fraction
   *  of revealOpacityTarget. Deliberately low -- "the field notices your
   *  attention," not "the verse is loading." */
  anticipationCeilingFraction: number;
}

/** Not consumed until a later commit. See LivingRegionOpacityConfig comment. */
export interface LivingRegionTimingConfig {
  /** Press-and-hold duration required to cross from anticipation to reveal. */
  holdThresholdMs: number;
  /** Duration of the opacity ramp once the hold threshold is crossed. */
  revealDurationMs: number;
  /** Duration of the fade back to ambient on dismissal. */
  dismissDurationMs: number;
  /** Approximate inactivity duration, once revealed, before auto-dismissal. */
  idleDismissMs: number;
}

export interface LivingRegionConfig {
  viewport: LivingRegionViewportConfig;
  typography: LivingRegionTypographyConfig;
  opacity: LivingRegionOpacityConfig;
  timings: LivingRegionTimingConfig;
}

export const LIVING_REGION_CONFIG: LivingRegionConfig = {
  viewport: {
    horizontalAnchor: "left",
    width: 0.58,
    top: 0.44,
    horizontalMargin: 0.08,
  },
  typography: {
    wordsPerLine: [4, 3],
    wordGapColumns: 1,
    lineGapRows: 1,
    verseInset: { columns: 1, rows: 1 },
    stratumId: "near",
    positionJitterScale: 0.12,
  },
  opacity: {
    revealOpacityTarget: 0.92,
    anticipationCeilingFraction: 0.13,
  },
  timings: {
    holdThresholdMs: 700,
    revealDurationMs: 900,
    dismissDurationMs: 1400,
    idleDismissMs: 15000,
  },
};

// ---------------------------------------------------------------------------
// Rectangle derivation
// ---------------------------------------------------------------------------

export interface LivingRegionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Derives the viewport-space rectangle the Living Region occupies, in CSS
 *  px. Height is DERIVED from typography (line count, gaps, inset) rather
 *  than independently configured, so a future reflection with more lines
 *  never silently clips -- the rectangle always grows to fit what it's
 *  asked to hold. Pure function -- no randomness, no side effects. */
export function deriveLivingRegionRect(
  viewportWidth: number,
  viewportHeight: number,
  viewport: LivingRegionViewportConfig,
  typography: LivingRegionTypographyConfig,
  cellWidth: number,
  cellHeight: number
): LivingRegionRect {
  const lineCount = typography.wordsPerLine.length;
  const width = viewport.width * viewportWidth;
  const marginPx = viewport.horizontalMargin * viewportWidth;

  const left =
    viewport.horizontalAnchor === "right"
      ? viewportWidth - marginPx - width
      : viewport.horizontalAnchor === "center"
        ? (viewportWidth - width) / 2
        : marginPx;

  const top = viewport.top * viewportHeight;

  const rowSpan =
    lineCount + // one grid row per line
    (lineCount - 1) * typography.lineGapRows + // gaps between lines
    typography.verseInset.rows * 2; // top + bottom inset
  const height = rowSpan * cellHeight;

  return { left, top, width, height };
}

// ---------------------------------------------------------------------------
// Reserved Semantic Cells
// ---------------------------------------------------------------------------

/** One word, already segmented into the same grapheme-cluster units the
 *  field's glyph sets are built from (see lib/ambient-language's
 *  segmentTamilGraphemes for the Intl.Segmenter approach used elsewhere in
 *  the app). This module deliberately doesn't import or duplicate that
 *  logic -- it only ever consumes the result. */
export type ReservedVerseWord = readonly string[];
export type ReservedVerseLine = readonly ReservedVerseWord[];

export interface ReservedVerseInput {
  /** Ordered lines, each an ordered list of words, each word an ordered list
   *  of grapheme strings. The locked KKA display rule (4 words / 3 words,
   *  two lines) is enforced by the caller supplying that shape of data, not
   *  by this module -- this places however many lines/words it's given. */
  lines: readonly ReservedVerseLine[];
}

/** Permanent per-cell metadata a reserved cell carries once layout build
 *  finishes -- see field-cell.ts's ownership table. */
export interface ReservedVerseCellInfo {
  lineIndex: number;
  wordIndex: number;
  order: number;
}

export interface ReservedCellPlacement extends ReservedVerseCellInfo {
  x: number;
  y: number;
  col: number;
  row: number;
  glyphValue: string;
}

export interface ReservationResult {
  placements: ReservedCellPlacement[];
  /** "col,row" keys the ordinary Field Engine scatter must never place a
   *  random cell into -- see field-layout.ts's generateFieldSlots(). */
  occupied: ReadonlySet<string>;
}

/**
 * Computes exactly which grid cells host the verse, in reading order, and
 * marks them so the ordinary clustered-scatter never double-occupies them.
 * Pure and deterministic: the same rect + input + metrics always produce the
 * same placements. Has no concept of Math.random(), stratum, opacity, or
 * rendering of any kind -- only which (col, row) cells the verse needs and
 * what glyph belongs in each.
 */
export function reserveVerseSlots(
  rect: LivingRegionRect,
  input: ReservedVerseInput,
  typography: LivingRegionTypographyConfig,
  cellWidth: number,
  cellHeight: number
): ReservationResult {
  const colStart = Math.floor(rect.left / cellWidth) + typography.verseInset.columns;
  const colBoundary =
    Math.ceil((rect.left + rect.width) / cellWidth) - typography.verseInset.columns;
  const rowStart = Math.floor(rect.top / cellHeight) + typography.verseInset.rows;

  const placements: ReservedCellPlacement[] = [];
  const occupied = new Set<string>();
  let order = 0;
  let maxColUsed = colStart;

  input.lines.forEach((line, lineIndex) => {
    const row = rowStart + lineIndex * (1 + typography.lineGapRows);
    let col = colStart;
    line.forEach((word, wordIndex) => {
      word.forEach((glyphValue) => {
        occupied.add(`${col},${row}`);
        placements.push({
          x: col * cellWidth + cellWidth / 2,
          y: row * cellHeight + cellHeight / 2,
          col,
          row,
          lineIndex,
          wordIndex,
          order: order++,
          glyphValue,
        });
        maxColUsed = Math.max(maxColUsed, col);
        col += 1;
      });
      col += typography.wordGapColumns;
    });
  });

  if (maxColUsed >= colBoundary) {
    console.warn(
      "[Living Region] Reserved verse exceeds the configured rectangle " +
        "width at this viewport size -- increase livingRegion.viewport.width " +
        "or shorten the phrase. Placements were still computed; nothing is " +
        "clipped, but the rectangle used for the interaction hit-target may " +
        "no longer fully contain the verse."
    );
  }

  return { placements, occupied };
}

/** Resolves the FieldStratum the verse renders at (always the shallowest,
 *  most-legible configured stratum -- "today's living language"). Exported
 *  so field-layout.ts and the self-check share one lookup. Throws on a
 *  misconfigured stratumId -- same "configuration error, not a runtime
 *  condition to silently swallow" philosophy as glyphs.ts's getGlyphSet(). */
export function resolveVerseStratum(
  strata: readonly FieldStratum[],
  typography: LivingRegionTypographyConfig
): FieldStratum {
  const stratum = strata.find((s) => s.id === typography.stratumId);
  if (!stratum) {
    throw new Error(
      `[Living Region] typography.stratumId "${typography.stratumId}" does not ` +
        `match any configured stratum id.`
    );
  }
  return stratum;
}
