/**
 * Living Field — Layout
 * ----------------------------------------------------------------------------
 * Builds the static structure of the field for a given viewport: which cells
 * are occupied, by which glyph, at which depth stratum.
 *
 * The clustered-scatter principle is unchanged from Concept v0.6: rows of
 * cells, filled as loose bursts (1–4 letters) separated by irregular gaps
 * (2–7 cells), so the field respects whitespace and the letter count scales
 * naturally with screen size. This sprint adds a depth stratum per cell.
 *
 * Layout is computed once per viewport size (and on rebuild), never per
 * frame — the render loop only modulates opacity.
 */

import type { LivingFieldConfig, FieldStratum } from "./config";
import { createGlyphDealer, type Glyph } from "./glyphs";

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

/** Weighted random stratum pick. */
function pickStratum(strata: readonly FieldStratum[], totalWeight: number): FieldStratum {
  let r = Math.random() * totalWeight;
  for (const s of strata) {
    r -= s.weight;
    if (r <= 0) return s;
  }
  return strata[strata.length - 1];
}

export function buildFieldLayout(
  width: number,
  height: number,
  config: LivingFieldConfig
): FieldLayout {
  const cols = Math.ceil(width / config.cellWidth) + 1;
  const rows = Math.ceil(height / config.cellHeight) + 1;
  const totalWeight = config.strata.reduce((sum, s) => sum + s.weight, 0);
  const deal = createGlyphDealer();

  const cells: FieldCell[] = [];

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      c += Math.floor(rand(config.clusterGapMin, config.clusterGapMax));
      if (c >= cols) break;
      const clusterLen = Math.floor(rand(config.clusterLenMin, config.clusterLenMax));
      for (let i = 0; i < clusterLen && c < cols; i++, c++) {
        cells.push({
          x: c * config.cellWidth + config.cellWidth / 2,
          y: r * config.cellHeight + config.cellHeight / 2,
          col: c,
          row: r,
          glyph: deal(),
          stratum: pickStratum(config.strata, totalWeight),
        });
      }
    }
  }

  return { width, height, cells };
}
