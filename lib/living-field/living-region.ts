/**
 * Living Field — Living Region
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 1A: Localized Semantic Density.
 *
 * Governing principle for this file and everything that grows on top of it:
 *
 *   The Living Region is not a feature layered onto the Living Field.
 *   It is a natural property of the Living Field itself.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS COMMIT REPLACES COMMIT 1's GEOMETRY
 * ---------------------------------------------------------------------------
 * Commit 1 assumed one Living Field cell = one Tamil grapheme, using the
 * ambient field's own 60px cell pitch. Validated against the REAL KKA-001
 * verse (not a placeholder), that assumption doesn't scale: the longer line
 * needs ~1,100px of horizontal space at that pitch -- more than an entire
 * mobile viewport.
 *
 * This isn't a rendering exception bolted onto the field -- it's the same
 * kind of thing strata, affinity, and civilization already are: a way the
 * field's own local character varies from one neighborhood to the next.
 * Some regions of the field are older (deep stratum). Some are denser
 * (Living Region). Both are properties of the SAME continuous system, not
 * a second system layered on top of it.
 *
 * Concretely: within a Living Region, cells sit closer together than the
 * ambient field's normal pitch -- a `reservedCellSpacingFactor` of the
 * ambient cellWidth, not an independent typography value. Lines still land
 * on real field rows (vertical rhythm stays tied to the same grid every
 * other cell uses); only the horizontal advance between letters densifies.
 * Reserved cells are still real FieldCells, in the same array, rendered by
 * the exact same renderer.ts code path, at the exact same stratum opacity as
 * their neighbours -- nothing about HOW a cell renders changes, only how
 * many of them exist in this one neighbourhood and how close together they
 * sit.
 *
 * ---------------------------------------------------------------------------
 * OCCUPANCY: FOOTPRINT, NOT PER-CELL
 * ---------------------------------------------------------------------------
 * Commit 1 blocked the ambient scatter one exact (col, row) cell at a time.
 * That doesn't make sense once reserved cells no longer sit on the ambient
 * grid's own columns. Instead, this commit computes the actual pixel
 * bounding box the verse's cells occupy (content-sized, not the full
 * configured rectangle) and the ordinary Field Engine scatter simply never
 * places a cell whose center falls inside that box, plus a small padding.
 * Outside that box, and everywhere when no reserved verse is supplied, the
 * ambient field is completely unaffected.
 *
 * ---------------------------------------------------------------------------
 * PRE-REVEAL INDISTINGUISHABILITY (important, and honestly scoped)
 * ---------------------------------------------------------------------------
 * What THIS module can guarantee, and does: every reserved cell uses the
 * same stratum (and therefore the same baseOpacity/waveAmplitude/font size)
 * as an ordinary "near" cell, computed by the exact same renderer.ts code --
 * nothing here introduces a different opacity, colour, or size. The
 * bounding footprint is sized to the verse's actual content, not a large
 * fixed block, so the "cleared" area the ambient scatter avoids is as small
 * as the real text needs.
 *
 * What THIS module CANNOT guarantee on its own: whether the resulting denser
 * patch is visually perceptible before interaction is a rendering question,
 * not a geometry question -- it depends on actual pixels on an actual
 * screen. That needs a visual check once Commit 3 wires up rendering, not a
 * computed assertion here. This file's self-check verifies the geometry
 * (fits, no clipping, correct structure); it cannot verify how it looks.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS MODULE STILL HAS NO OPINION ABOUT TAMIL, KURAL, OR ANY POEM
 * ---------------------------------------------------------------------------
 * Unchanged from Commit 1: this module receives an already-segmented
 * ReservedVerseInput and never imports mock-data.ts or lib/ambient-language/.
 * A future Aathichoodi line or different day's Kural is new data, never a
 * code change here.
 */

import type { FieldStratum } from "./config";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface LivingRegionViewportConfig {
  /** Which side of the viewport the rectangle is anchored to. */
  horizontalAnchor: "left" | "center" | "right";
  /** MAXIMUM available width for the region, as a fraction of viewport width
   *  (0–1) -- a cap, not the verse's actual footprint. The verse's real
   *  content-sized footprint (see reserveVerseSlots) must fit inside this;
   *  reserveVerseSlots warns if it doesn't. */
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
   *  what gets placed; this module has no opinion on any specific poem's
   *  shape. */
  wordsPerLine: readonly [number, number];
  /** Local field density: how much closer together two consecutive reserved
   *  cells sit, as a fraction of the ambient field's own cellWidth. E.g.
   *  0.45 means each grapheme advances by 45% of an ordinary cell's width,
   *  not a full cell -- this is what makes the Living Region a DENSER
   *  neighbourhood of the same field, rather than a separately-typeset piece
   *  of text. Tuned empirically against the real KKA-001 verse (see this
   *  commit's validation notes) to actually fit a mobile viewport. */
  reservedCellSpacingFactor: number;
  /** Gap between two words on the same line, as a multiple of the single-
   *  grapheme advance above (reservedCellSpacingFactor * cellWidth) -- e.g.
   *  1.8 means a word gap 1.8x a single letter-advance. Expressed relative
   *  to the local density, not the ambient grid, for the same reason. */
  wordGapFactor: number;
  /** Gap between line 1 and line 2, in whole ambient grid ROWS -- vertical
   *  rhythm stays tied to the same row grid every other cell uses; only
   *  horizontal letter spacing densifies. */
  lineGapRows: number;
  /** Empty ambient rows kept above (and, mirrored, below) the verse within
   *  the region -- keeps the verse from touching the region's own vertical
   *  edges. */
  verseTopInsetRows: number;
  /** Padding, in CSS px, added around the verse's own content-sized bounding
   *  box before computing the footprint the ambient scatter must avoid.
   *  Small and content-relative, not a fixed large block -- the "cleared"
   *  area should be no bigger than the real text needs. */
  footprintPaddingPx: number;
  /** Which config.ts stratum id the verse borrows its font size, opacity
   *  formula, and script weighting from -- always the shallowest, most
   *  legible configured stratum. Reserved cells render through the EXACT
   *  same renderer.ts opacity pipeline as any other cell of this stratum;
   *  nothing about opacity/colour/size is special-cased for them. */
  stratumId: string;
  /** Max natural-variation nudge, as a fraction of the reserved letter
   *  advance itself (reservedCellSpacingFactor * cellWidth) -- deliberately
   *  small, enough to avoid a mechanically regular lattice, never enough to
   *  harm legibility. Scales with local density rather than the ambient
   *  field's own (much coarser) jitter, since the two operate at different
   *  pitches. */
  positionJitterScale: number;
}

/** Not consumed until the reveal/dismiss interaction lands (a later commit).
 *  Scaffolded now so all Living Region tuning lives in one file from the
 *  start, per explicit direction. */
export interface LivingRegionOpacityConfig {
  revealOpacityTarget: number;
  anticipationCeilingFraction: number;
}

/** Not consumed until a later commit. See LivingRegionOpacityConfig comment. */
export interface LivingRegionTimingConfig {
  holdThresholdMs: number;
  revealDurationMs: number;
  dismissDurationMs: number;
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
    width: 0.9,
    top: 0.44,
    horizontalMargin: 0.06,
  },
  typography: {
    wordsPerLine: [4, 3],
    // Validated (see this commit's validation notes) against the real
    // KKA-001 verse: fits mobile (375–390px), tablet (768px), and desktop
    // (1440px) with comfortable margin at these values. Re-validate with
    // reserved-verse-bridge + this module's own reservation math whenever
    // either the phrase or these numbers change -- don't assume a new
    // phrase fits without checking (see living-region.selfcheck.ts).
    reservedCellSpacingFactor: 0.32,
    wordGapFactor: 1.35,
    lineGapRows: 1,
    verseTopInsetRows: 1,
    footprintPaddingPx: 10,
    stratumId: "near",
    positionJitterScale: 0.16,
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
// Rectangle derivation (available space cap, not the verse's real footprint)
// ---------------------------------------------------------------------------

export interface LivingRegionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Derives the MAXIMUM viewport-space rectangle available to the Living
 *  Region, in CSS px -- a cap the actual content-sized footprint
 *  (reserveVerseSlots) must fit inside, not the footprint itself. Height is
 *  still derived from typography (line count, gaps, inset), same as
 *  Commit 1. Pure function -- no randomness, no side effects. */
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
    typography.verseTopInsetRows * 2; // top + bottom inset
  const height = rowSpan * cellHeight;

  return { left, top, width, height };
}

// ---------------------------------------------------------------------------
// Reserved Semantic Cells — localized density
// ---------------------------------------------------------------------------

export type ReservedVerseWord = readonly string[];
export type ReservedVerseLine = readonly ReservedVerseWord[];

export interface ReservedVerseInput {
  lines: readonly ReservedVerseLine[];
}

/** Permanent per-cell metadata a reserved cell carries once layout build
 *  finishes -- see field-cell.ts's ownership table. Unchanged from Commit 1. */
export interface ReservedVerseCellInfo {
  lineIndex: number;
  wordIndex: number;
  order: number;
}

export interface ReservedCellPlacement extends ReservedVerseCellInfo {
  x: number;
  y: number;
  /** Continuous (not necessarily integer) grid-column-equivalent, used only
   *  so the wave-phase formula (col * wavePhaseCol) varies smoothly across
   *  a denser patch exactly as it would across ordinary cells -- not used
   *  for occupancy or any exact-cell matching (that's the footprint's job
   *  now, not per-cell col/row keys). */
  col: number;
  row: number;
  glyphValue: string;
}

export interface ReservationResult {
  placements: ReservedCellPlacement[];
  /** The content-sized pixel footprint the ordinary Field Engine scatter
   *  must avoid (field-layout.ts's generateFieldSlots) -- null only when
   *  there are zero placements (e.g. empty input). Sized to the verse's
   *  actual content plus footprintPaddingPx, NOT the full available
   *  rectangle -- the "cleared" area is only as large as the real text
   *  needs. */
  occupiedFootprint: LivingRegionRect | null;
}

/**
 * Computes exactly where each grapheme sits, at the Living Region's local
 * density, in reading order -- and the content-sized pixel footprint the
 * ambient scatter must avoid. Pure and deterministic: the same rect + input
 * + metrics always produce the same result. Has no concept of Math.random(),
 * stratum, opacity, or rendering of any kind.
 */
export function reserveVerseSlots(
  rect: LivingRegionRect,
  input: ReservedVerseInput,
  typography: LivingRegionTypographyConfig,
  cellWidth: number,
  cellHeight: number
): ReservationResult {
  const spacing = cellWidth * typography.reservedCellSpacingFactor;
  const wordGap = spacing * typography.wordGapFactor;
  const rowStart = Math.floor(rect.top / cellHeight) + typography.verseTopInsetRows;

  const placements: ReservedCellPlacement[] = [];
  let order = 0;
  let maxX = rect.left;
  let minX = rect.left;
  let minRow = rowStart;
  let maxRow = rowStart;

  input.lines.forEach((line, lineIndex) => {
    const row = rowStart + lineIndex * (1 + typography.lineGapRows);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
    let x = rect.left;

    line.forEach((word, wordIndex) => {
      word.forEach((glyphValue, glyphIndex) => {
        placements.push({
          x,
          y: row * cellHeight + cellHeight / 2,
          col: x / cellWidth,
          row,
          lineIndex,
          wordIndex,
          order: order++,
          glyphValue,
        });
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        // Advance by the intra-word letter pitch between graphemes of the
        // SAME word only -- the word gap below is the sole spacing between
        // two words. (Bug fixed post-measurement: an earlier draft advanced
        // by `spacing` after every grapheme including a word's last one,
        // then added `wordGap` on top, silently doubling every inter-word
        // gap and overstating the verse's real footprint.)
        if (glyphIndex < word.length - 1) x += spacing;
      });
      if (wordIndex < line.length - 1) x += wordGap;
    });
  });

  if (placements.length === 0) {
    return { placements, occupiedFootprint: null };
  }

  const contentWidth = maxX - rect.left + spacing; // + trailing glyph's own width
  if (contentWidth > rect.width) {
    console.warn(
      `[Living Region] Reserved verse content (${contentWidth.toFixed(0)}px) exceeds ` +
        `the available rectangle width (${rect.width.toFixed(0)}px) at this viewport ` +
        `size -- increase livingRegion.viewport.width, reduce ` +
        `reservedCellSpacingFactor/wordGapFactor, or shorten the phrase. Placements ` +
        `were still computed; nothing is clipped, but the region's edge may sit inside ` +
        `the visible text.`
    );
  }

  const pad = typography.footprintPaddingPx;
  const occupiedFootprint: LivingRegionRect = {
    left: minX - spacing / 2 - pad,
    top: minRow * cellHeight - pad,
    width: maxX - minX + spacing + pad * 2,
    height: (maxRow - minRow + 1) * cellHeight + pad * 2,
  };

  return { placements, occupiedFootprint };
}

/** Resolves the FieldStratum the verse renders at (always the shallowest,
 *  most-legible configured stratum -- "today's living language"). Unchanged
 *  from Commit 1. Throws on a misconfigured stratumId -- same "configuration
 *  error, not a runtime condition to silently swallow" philosophy as
 *  glyphs.ts's getGlyphSet(). */
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

/** Point-in-rectangle test used by field-layout.ts's generateFieldSlots() to
 *  decide whether an ordinary ambient cell would fall inside the Living
 *  Region's occupied footprint (and so must be skipped). Exported so the
 *  test itself lives in one place rather than being reimplemented at the
 *  call site. */
export function pointInRect(x: number, y: number, r: LivingRegionRect): boolean {
  return x >= r.left && x <= r.left + r.width && y >= r.top && y <= r.top + r.height;
}
