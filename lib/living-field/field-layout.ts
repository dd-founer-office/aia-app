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
 * Layout is computed once per viewport size (and on rebuild), never per
 * frame — the render loop only modulates opacity.
 */

import type { LivingFieldConfig, FieldStratum, ScriptWeight } from "./config";
import { createGlyphDealer, getGlyphSet, type Glyph } from "./glyphs";
import type { GlyphAffinity } from "./affinity-types";
import type { GlyphHarmony } from "./harmony-types";
import { applyNaturalDistribution, type FieldSlot } from "./natural-distribution";

export interface FieldCell {
  /** Cell centre in CSS px. */
  x: number;
  y: number;
  /** Grid coordinates, used by the diagonal wave phase. */
  col: number;
  row: number;
  glyph: Glyph;
  stratum: FieldStratum;
  /** Optical Weight Calibration: which registered glyph set (glyphs.ts)
   *  this cell's glyph came from. Set by the SAME Civilization Engine
   *  decision that chose the glyph itself (dealGlyphForStratum) -- not a
   *  separate classification pass, so it can never drift out of sync with
   *  what was actually selected. Used only by renderer.ts's optical
   *  calibration step; does not influence selection, layout, or affinity. */
  scriptId: string;
  /** Sprint 03A: invisible spatial metadata, populated by
   *  affinity-engine.ts's applyAffinity() as a pass AFTER
   *  buildFieldLayout() returns — not set here. Optional in the type
   *  because buildFieldLayout() itself doesn't produce it; guaranteed
   *  present at runtime once the affinity pass has run (see engine.ts). */
  affinity?: GlyphAffinity;
  /** Sprint 03C: minimal behavioural metadata, populated by
   *  emergent-harmony.ts's applyEmergentHarmony() as a pass AFTER affinity
   *  runs -- not set here. Optional for the same reason `affinity` is:
   *  buildFieldLayout() doesn't produce it; guaranteed present at runtime
   *  once the harmony pass has run (see engine.ts). */
  harmony?: GlyphHarmony;
}

export interface FieldLayout {
  width: number;
  height: number;
  cells: FieldCell[];
}

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
 */
function generateFieldSlots(
  width: number,
  height: number,
  config: LivingFieldConfig
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
        slots.push({
          x: c * config.cellWidth + config.cellWidth / 2,
          y: r * config.cellHeight + config.cellHeight / 2,
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
  config: LivingFieldConfig
): FieldLayout {
  // Stage 1: Field Engine — base positions + stratum, no glyph yet.
  const slots = generateFieldSlots(width, height, config);

  // Stage 2: Natural Distribution Engine — refine exact pixel placement.
  // Mutates slot.x/slot.y in place; does not add, remove, or reorder slots,
  // and has no awareness of scripts, glyphs, or affinity.
  applyNaturalDistribution(slots, config.cellWidth, config.cellHeight);

  // Stage 3: Civilization Engine — unchanged logic from Sprint 02, now run
  // as its own explicit stage on the refined slots.
  const dealers = buildDealers(config.strata);
  const cells: FieldCell[] = slots.map((slot) => {
    const { glyph, scriptId } = dealGlyphForStratum(slot.stratum, dealers);
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

  return { width, height, cells };
}
