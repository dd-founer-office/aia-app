/**
 * Living Field — Layout
 * ----------------------------------------------------------------------------
 * Builds the static structure of the field for a given viewport: which cells
 * are occupied, by which glyph, at which depth stratum.
 *
 * The clustered-scatter principle is unchanged from Concept v0.6 / Sprint 01:
 * rows of cells, filled as loose bursts (1–4 letters) separated by irregular
 * gaps (2–7 cells), so the field respects whitespace and the letter count
 * scales naturally with screen size.
 *
 * Sprint 02 (Living Civilization Layer v1.0): this is the ONLY file where
 * civilization/script decisions are made. For each stratum, a dealer is
 * built per (stratum, script) pairing referenced in that stratum's
 * `scriptWeights`; per cell, a script is chosen by weighted pick, then a
 * glyph is drawn from that script's own no-repeat deck. This keeps the
 * "every glyph in a set appears before any repeat" guarantee intact per
 * script, while the overall mix converges to the configured ratio across
 * the many cells a stratum contains. renderer.ts and engine.ts are
 * completely unaware any of this exists — they still just receive a
 * FieldCell with a resolved `glyph` and paint it.
 *
 * Sprint 03B (Natural Distribution Engine v1.0): `buildFieldLayout()` is now
 * an explicit three-stage pipeline instead of one fused loop:
 *
 *   1. Field Engine       — generateFieldSlots(): the SAME clustered-scatter
 *                           grid/gap/stratum logic as before, unchanged,
 *                           just no longer assigning a glyph yet.
 *   2. Natural Distribution — applyNaturalDistribution() (natural-
 *                           distribution.ts): nudges each slot's exact pixel
 *                           position by a smooth, deterministic amount.
 *   3. Civilization Engine — dealGlyphForStratum()/buildDealers(): 100%
 *                           unchanged logic from Sprint 02, just now called
 *                           as its own explicit stage on the refined slots.
 *
 * Affinity (Sprint 03A) is unaffected: it still runs afterward, in
 * engine.ts, on whatever final cells this file returns — nothing here was
 * touched to accommodate that, it already treated x/y generically.
 *
 * Living Kernel v1.0 architecture hardening: `FieldCell`/`FieldLayout` now
 * live in field-cell.ts, a neutral shared contract file, and are re-exported
 * here so no other file's import path needs to change. This file (Field
 * Engine + Civilization Engine) no longer needs any type-level knowledge of
 * downstream engines (Affinity, Harmony) at all -- see field-cell.ts for why
 * that matters.
 *
 * Layout is computed once per viewport size (and on rebuild), never per
 * frame — the render loop only modulates opacity.
 *
 * ---------------------------------------------------------------------------
 * SPRINT 04A (LIVING REGION v1), COMMIT 1A: LOCALIZED SEMANTIC DENSITY
 * ---------------------------------------------------------------------------
 * `buildFieldLayout()` gains one new, fully OPTIONAL fourth parameter,
 * `reservedVerse`. When omitted (every current call site — see engine.ts,
 * unchanged in this commit), this file behaves exactly as it always has:
 * same slots, same random scatter, same glyph dealing, same output. Nothing
 * about today's rendered field changes.
 *
 * When a caller does supply a ReservedVerseInput (a later commit's job, once
 * the Home page is wired up), the pipeline gains one new step, run between
 * Field Engine and the rest:
 *
 *   1. Field Engine (unchanged logic) generates the ordinary clustered
 *      scatter -- EXCEPT it now skips any cell whose centre falls inside
 *      the reserved verse's pixel footprint (see the new
 *      `occupiedFootprint` parameter below), so the two never collide.
 *   2. living-region.ts's reserveVerseSlots() independently computes exactly
 *      where the verse's cells sit, at the Living Region's own DENSER local
 *      pitch (not the ambient grid's 60px cells -- see living-region.ts's
 *      Commit 1A header for why), and what grapheme belongs in each.
 *   3. Natural Distribution runs TWICE: once on the ordinary slots at the
 *      field's normal jitter, once on the reserved slots at a much smaller
 *      jitter derived from the Living Region's own local density (not the
 *      ambient field's) -- "extremely subtle natural variation... never
 *      reduce readability."
 *   4. Civilization Engine deals random glyphs to ordinary slots exactly as
 *      before; reserved slots get their predetermined grapheme directly,
 *      never a randomly dealt one, and are tagged with `reservedVerse`
 *      metadata (field-cell.ts) so a later commit's renderer/interaction
 *      code can find them.
 *
 * Reserved cells are real FieldCells in the same array Civilization Engine
 * has always produced -- not a parallel list, not an overlay. Affinity and
 * Harmony (engine.ts) run on the full returned cell array exactly as today,
 * with no awareness that `reservedVerse` exists at all, so a reserved cell
 * breathes and waves precisely like its neighbours until a later commit's
 * interaction layer deliberately changes its opacity.
 */

import type { LivingFieldConfig, FieldStratum, ScriptWeight } from "./config";
import { createGlyphDealer, getGlyphSet, type Glyph } from "./glyphs";
import { applyNaturalDistribution, type FieldSlot } from "./natural-distribution";
import type { FieldCell, FieldLayout } from "./field-cell";
import {
  LIVING_REGION_CONFIG,
  deriveLivingRegionRect,
  reserveVerseSlots,
  resolveVerseStratum,
  pointInRect,
  type ReservedVerseInput,
  type LivingRegionRect,
} from "./living-region";

export type { FieldCell, FieldLayout } from "./field-cell";

const rand = (a: number, b: number): number => Math.random() * (b - a) + a;

/** Weighted random pick from any {weight}-bearing list. Shared by both the
 *  stratum picker and the script picker below — weights don't need to sum
 *  to 1, they're normalised against their own total each call. */
function weightedPick<T extends { weight: number }>(items: readonly T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

/** Default script mix for a stratum that doesn't specify one: 100% modern
 *  Tamil. This is what makes a Sprint 01-style stratum config (no
 *  `scriptWeights` field at all) keep working completely unmodified. */
const DEFAULT_SCRIPT_WEIGHTS: readonly ScriptWeight[] = [
  { setId: "modern-tamil-247", weight: 1 },
];

/** One no-repeat dealer per (stratum, script) pairing, built fresh per
 *  layout so each viewport rebuild reshuffles independently. Keyed by
 *  `${stratum.id}::${setId}`. */
function buildDealers(strata: readonly FieldStratum[]): Map<string, () => Glyph> {
  const dealers = new Map<string, () => Glyph>();
  for (const stratum of strata) {
    const weights = stratum.scriptWeights ?? DEFAULT_SCRIPT_WEIGHTS;
    for (const sw of weights) {
      const key = `${stratum.id}::${sw.setId}`;
      if (!dealers.has(key)) {
        dealers.set(key, createGlyphDealer(getGlyphSet(sw.setId)));
      }
    }
  }
  return dealers;
}

/** Picks a glyph for one cell in `stratum`: choose a script by weight, then
 *  draw from that script's own dealer for this stratum. Returns which
 *  script was chosen alongside the glyph -- SAME selection logic as
 *  before, byte-identical; this only additionally surfaces information the
 *  function already computed internally (`chosen.setId`), for the Optical
 *  Weight Calibration pass to use at render time. Does not change what gets
 *  selected or with what probability. */
function dealGlyphForStratum(
  stratum: FieldStratum,
  dealers: Map<string, () => Glyph>
): { glyph: Glyph; scriptId: string } {
  const weights = stratum.scriptWeights ?? DEFAULT_SCRIPT_WEIGHTS;
  const chosen = weightedPick(weights);
  const deal = dealers.get(`${stratum.id}::${chosen.setId}`);
  if (!deal) {
    // Unreachable in practice — buildDealers() creates one for every
    // (stratum, scriptWeights entry) pairing up front.
    throw new Error(
      `Living Field: no dealer built for stratum "${stratum.id}" script "${chosen.setId}"`
    );
  }
  return { glyph: deal(), scriptId: chosen.setId };
}

/**
 * Field Engine, stage 1: the exact clustered-scatter grid/gap logic that
 * has been unchanged since Concept v0.6, producing base slot positions and
 * a depth stratum per slot. No glyph is assigned here -- that's stage 3
 * (Civilization), run after Natural Distribution refines these positions.
 *
 * BUG FIX (Living Field Foundation Completion v1.0, post-Part-1 follow-up):
 * every row previously started its scan by skipping a full
 * `[clusterGapMin, clusterGapMax)` gap BEFORE placing its first cluster --
 * the same range used for gaps BETWEEN clusters. Since clusterGapMin is 2,
 * columns 0 and 1 could never be occupied in ANY row, ever, by
 * construction, not chance. On a wide desktop viewport that's a small
 * sliver of the width; on a narrow mobile viewport (as few as ~8 columns
 * total) that same fixed-size gap eats over half the screen -- exactly the
 * "left edge empty, worse on mobile" behaviour reported after Part 1's
 * rollout made the field visible everywhere.
 *
 * First attempted fix (draw the first gap from `[0, clusterGapMax)`
 * instead) only partially helped -- averaging 4 columns on an 8-column
 * mobile screen still eats half the row. The right edge has no equivalent
 * structural minimum at all (the scan just runs until it can't fit
 * anymore, landing anywhere from 0 columns of leftover space upward), so
 * matching that: the first gap in each row is now drawn from a small fixed
 * `[0, clusterGapMin)` range (0 to 1 columns) -- most rows now start at or
 * within one column of the left edge, symmetric with how the right edge
 * already behaved. Every gap BETWEEN clusters is completely unchanged.
 * Nothing about Natural Distribution, Civilization, or Affinity is
 * touched -- they still just receive whatever slots this function
 * produces.
 *
 * Sprint 04A (Living Region v1): gains one new, optional `occupiedFootprint`
 * parameter -- a content-sized pixel rectangle the reserved verse's denser
 * lattice occupies (living-region.ts's reserveVerseSlots(), Commit 1A). When
 * an ordinary scatter cell's centre would fall inside that rectangle, it is
 * simply skipped (the cluster continues into the next column exactly as it
 * would have anyway); nothing about the gap/cluster-length random logic
 * itself changes. When `occupiedFootprint` is null (every call site before
 * this commit, and every call site in THIS commit too -- see
 * buildFieldLayout()'s doc comment), this is bit-identical to the prior
 * behaviour.
 *
 * Commit 1A note: this used to take an exact-match `Set<string>` of "col,row"
 * keys, back when reserved cells sat on the ambient grid's own columns.
 * Reserved cells now use their own, denser local pitch (see living-region.ts),
 * so exact-cell matching no longer means anything -- a pixel-space footprint
 * is the only geometry the two coordinate systems still share.
 */
function generateFieldSlots(
  width: number,
  height: number,
  config: LivingFieldConfig,
  occupiedFootprint: LivingRegionRect | null = null
): FieldSlot[] {
  const cols = Math.ceil(width / config.cellWidth) + 1;
  const rows = Math.ceil(height / config.cellHeight) + 1;

  const slots: FieldSlot[] = [];

  for (let r = 0; r < rows; r++) {
    let c = 0;
    let isFirstGapInRow = true;
    while (c < cols) {
      const gap = isFirstGapInRow
        ? Math.floor(rand(0, config.clusterGapMin))
        : Math.floor(rand(config.clusterGapMin, config.clusterGapMax));
      isFirstGapInRow = false;
      c += gap;
      if (c >= cols) break;
      const clusterLen = Math.floor(rand(config.clusterLenMin, config.clusterLenMax));
      for (let i = 0; i < clusterLen && c < cols; i++, c++) {
        const x = c * config.cellWidth + config.cellWidth / 2;
        const y = r * config.cellHeight + config.cellHeight / 2;
        if (occupiedFootprint && pointInRect(x, y, occupiedFootprint)) continue;
        slots.push({
          x,
          y,
          col: c,
          row: r,
          stratum: weightedPick(config.strata),
        });
      }
    }
  }

  return slots;
}

export function buildFieldLayout(
  width: number,
  height: number,
  config: LivingFieldConfig,
  reservedVerse?: ReservedVerseInput,
  requiredGlyphs?: readonly string[]
): FieldLayout {
  // --- Sprint 04A: Reserved Semantic Cells (fully inert when omitted) -----
  // Computing this BEFORE the ordinary Field Engine scatter lets that scatter
  // skip the exact footprint the verse needs, so the two passes never collide.
  let reservedCells: FieldCell[] = [];
  let occupiedFootprint: LivingRegionRect | null = null;

  if (reservedVerse) {
    // LIVING_REGION_CONFIG is imported directly (top of file) rather than
    // threaded through LivingFieldConfig -- see living-region.ts's header
    // for why its config is intentionally kept separate from the
    // founder-locked LIVING_FIELD_CONFIG.
    const { viewport, typography } = LIVING_REGION_CONFIG;
    const rect = deriveLivingRegionRect(
      width,
      height,
      viewport,
      typography,
      config.cellWidth,
      config.cellHeight
    );
    const reservation = reserveVerseSlots(rect, reservedVerse, typography, config.cellWidth, config.cellHeight);
    occupiedFootprint = reservation.occupiedFootprint;

    const verseStratum = resolveVerseStratum(config.strata, typography);
    const reservedSlots: (FieldSlot & { glyphValue: string; lineIndex: number; wordIndex: number; order: number })[] =
      reservation.placements.map((p) => ({
        x: p.x,
        y: p.y,
        col: p.col,
        row: p.row,
        stratum: verseStratum,
        glyphValue: p.glyphValue,
        lineIndex: p.lineIndex,
        wordIndex: p.wordIndex,
        order: p.order,
      }));

    // Reserved cells get their own, much smaller jitter, expressed relative
    // to their OWN local pitch (reservedCellSpacingFactor), not the ambient
    // field's jitter -- the two now operate at different densities, so
    // there's no shared baseline to scale from. See
    // typography.positionJitterScale's doc comment in living-region.ts.
    applyNaturalDistribution(
      reservedSlots,
      config.cellWidth,
      config.cellHeight,
      typography.reservedCellSpacingFactor * typography.positionJitterScale
    );

    reservedCells = reservedSlots.map((slot) => ({
      x: slot.x,
      y: slot.y,
      col: slot.col,
      row: slot.row,
      stratum: slot.stratum,
      glyph: { kind: "text", value: slot.glyphValue },
      scriptId: "modern-tamil-247",
      reservedVerse: {
        lineIndex: slot.lineIndex,
        wordIndex: slot.wordIndex,
        order: slot.order,
      },
    }));
  }

  // Stage 1: Field Engine — base positions + stratum, no glyph yet. Skips
  // any cell whose centre falls inside the reserved verse's footprint above
  // (no-op when `occupiedFootprint` is null, i.e. every call site today).
  const slots = generateFieldSlots(width, height, config, occupiedFootprint);

  // Stage 2: Natural Distribution Engine — refine exact pixel placement.
  // Mutates slot.x/slot.y in place; does not add, remove, or reorder slots,
  // and has no awareness of scripts, glyphs, or affinity.
  applyNaturalDistribution(slots, config.cellWidth, config.cellHeight);

  // Stage 3: Civilization Engine — unchanged logic from Sprint 02, now run
  // as its own explicit stage on the refined slots.
  //
  // v0.6 (Living Language Story presence guarantee): `requiredGlyphs`, when
  // supplied, is a generic glyph multiset (e.g. ["வ்","ஆ","ழ்","த்","த்","உ"])
  // -- this file has NO knowledge of what word or story requested it, and
  // never will; it receives only "these glyph values must exist at least
  // this many times." A small number of the ALREADY-naturally-scattered
  // slots (their positions decided entirely by Field Engine + Natural
  // Distribution above, completely unaffected by this) are chosen,
  // deterministically and evenly spread across the existing slot array (so
  // no spatial region, cluster, or density pattern is implied), and simply
  // receive the requested glyph value directly instead of a random deal.
  // Every other slot deals exactly as before. Duplicate entries in
  // `requiredGlyphs` (e.g. "த்" twice) each claim their OWN distinct slot --
  // multiplicity is never collapsed.
  //
  // Omitted (every call site before this commit, and every call site in
  // THIS commit except the Living Language Story prototype) -> the map
  // below stays empty -> bit-identical to prior behaviour. See
  // field-layout.selfcheck.ts's dedicated proof of this.
  const forcedGlyphBySlotIndex = new Map<number, string>();
  if (requiredGlyphs && requiredGlyphs.length > 0 && slots.length > 0) {
    const n = Math.min(requiredGlyphs.length, slots.length);
    if (requiredGlyphs.length > slots.length) {
      console.warn(
        `[Living Field] requiredGlyphs has ${requiredGlyphs.length} entries but this layout only has ` +
          `${slots.length} cells -- only the first ${n} could be guaranteed.`
      );
    }
    for (let i = 0; i < n; i++) {
      // Evenly spread across the slot array -- NOT a spatial region. Field
      // Engine generates slots row by row, so this lands requested glyphs
      // across naturally different rows/areas without ever computing or
      // implying a rectangle, cluster, or density change of any kind.
      const slotIndex = Math.floor((i * slots.length) / n);
      forcedGlyphBySlotIndex.set(slotIndex, requiredGlyphs[i]);
    }
  }

  const dealers = buildDealers(config.strata);
  const ordinaryCells: FieldCell[] = slots.map((slot, slotIndex) => {
    const forced = forcedGlyphBySlotIndex.get(slotIndex);
    const { glyph, scriptId } = forced
      ? { glyph: { kind: "text" as const, value: forced }, scriptId: "modern-tamil-247" }
      : dealGlyphForStratum(slot.stratum, dealers);
    return {
      x: slot.x,
      y: slot.y,
      col: slot.col,
      row: slot.row,
      stratum: slot.stratum,
      glyph,
      scriptId,
    };
  });

  return { width, height, cells: [...ordinaryCells, ...reservedCells] };
}
