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
 * Layout is computed once per viewport size (and on rebuild), never per
 * frame — the render loop only modulates opacity.
 */

import type { LivingFieldConfig, FieldStratum, ScriptWeight } from "./config";
import { createGlyphDealer, getGlyphSet, type Glyph } from "./glyphs";

export interface FieldCell {
  /** Cell centre in CSS px. */
  x: number;
  y: number;
  /** Grid coordinates, used by the diagonal wave phase. */
  col: number;
  row: number;
  glyph: Glyph;
  stratum: FieldStratum;
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
 *  draw from that script's own dealer for this stratum. */
function dealGlyphForStratum(
  stratum: FieldStratum,
  dealers: Map<string, () => Glyph>
): Glyph {
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
  return deal();
}

export function buildFieldLayout(
  width: number,
  height: number,
  config: LivingFieldConfig
): FieldLayout {
  const cols = Math.ceil(width / config.cellWidth) + 1;
  const rows = Math.ceil(height / config.cellHeight) + 1;
  const dealers = buildDealers(config.strata);

  const cells: FieldCell[] = [];

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      c += Math.floor(rand(config.clusterGapMin, config.clusterGapMax));
      if (c >= cols) break;
      const clusterLen = Math.floor(rand(config.clusterLenMin, config.clusterLenMax));
      for (let i = 0; i < clusterLen && c < cols; i++, c++) {
        const stratum = weightedPick(config.strata);
        cells.push({
          x: c * config.cellWidth + config.cellWidth / 2,
          y: r * config.cellHeight + config.cellHeight / 2,
          col: c,
          row: r,
          glyph: dealGlyphForStratum(stratum, dealers),
          stratum,
        });
      }
    }
  }

  return { width, height, cells };
}
