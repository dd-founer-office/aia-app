/**
 * Living Language Story — Glyph Assignment
 * ----------------------------------------------------------------------------
 * Pairs currently-on-screen Living Field cells with sampled text-mask
 * points, once, at story start. Never touches a cell's stored x/y -- it
 * only reads them, once, to decide which cells participate and where each
 * one's temporary target is.
 *
 * Per the spec's own v0.1 scope: this prioritises proving the visual
 * transformation over exact linguistic matching between a source glyph and
 * its destination stroke (no attempt is made to route a given glyph toward
 * a position that "belongs" to a specific letter of the target word).
 * Existing field glyphs act as the word's visual particles; which specific
 * glyph lands at which point is not semantically meaningful.
 *
 * Nearest-available pairing (rather than random pairing) is used
 * deliberately: it keeps each participating glyph's travel distance short,
 * which is what keeps the motion calm and organic rather than reading as a
 * chaotic swarm with long crossing paths. This is an O(candidates x points)
 * search, but it runs exactly ONCE per story start -- never inside the
 * render loop -- so the cost is a one-time set-up cost, not a per-frame one.
 * ----------------------------------------------------------------------------
 * RETIRED FROM ACTIVE USE (v0.2): this file is no longer imported by
 * story-controller.ts, which now builds exactly four grapheme fragments via
 * grapheme-source.ts instead of hundreds of mask-paired cells. Left on disk
 * per explicit direction, not deleted, until the new grammar is visually
 * accepted. Its own result type is now defined locally (below) rather than
 * imported from story-bridge-types.ts, since that file's `StoryAssignment`
 * shape has since been superseded by v0.2's `StoryFragment` -- this keeps
 * this retired module self-contained and independently compiling rather
 * than silently coupled to a type it no longer matches.
 */

import type { FieldCell } from "@/lib/living-field/field-cell";
import type { MaskPoint } from "./text-mask";

/** v0.1's own result shape, kept local now that this module is retired. */
export interface LegacyStoryAssignment {
  cellIndex: number;
  homeX: number;
  homeY: number;
  targetX: number;
  targetY: number;
}

/** Fisher-Yates shuffle of index order 0..length-1. Used to pick which
 *  subset of mask points participates when there are more mask points than
 *  available home cells, so the chosen subset isn't always the same
 *  scanline-ordered prefix. */
function shuffledIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildStoryAssignments(
  cells: readonly FieldCell[],
  maskPoints: readonly MaskPoint[]
): LegacyStoryAssignment[] {
  if (cells.length === 0 || maskPoints.length === 0) return [];

  const count = Math.min(cells.length, maskPoints.length);
  const pointOrder = shuffledIndices(maskPoints.length).slice(0, count);

  // Mutable working list of candidate home cells; entries are removed as
  // they get claimed, so no cell is ever assigned to more than one target.
  const available = cells.map((cell, index) => ({ index, x: cell.x, y: cell.y }));

  const assignments: LegacyStoryAssignment[] = [];
  for (const pointIndex of pointOrder) {
    const point = maskPoints[pointIndex];

    let bestPos = -1;
    let bestDistSq = Infinity;
    for (let i = 0; i < available.length; i++) {
      const candidate = available[i];
      const dx = candidate.x - point.x;
      const dy = candidate.y - point.y;
      const distSq = dx * dx + dy * dy;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestPos = i;
      }
    }
    if (bestPos === -1) break; // no candidates left (shouldn't happen given count <= cells.length)

    const chosen = available[bestPos];
    available.splice(bestPos, 1);

    const cell = cells[chosen.index];
    assignments.push({
      cellIndex: chosen.index,
      homeX: cell.x,
      homeY: cell.y,
      targetX: point.x,
      targetY: point.y,
    });
  }
  return assignments;
}
