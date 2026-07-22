/**
 * Living Field — Affinity Engine
 * ----------------------------------------------------------------------------
 * Build Sprint 03A (Affinity Engine Specification v1.0).
 *
 * Runs once per layout build, after `buildFieldLayout()` and before any
 * rendering — see engine.ts's `rebuild()` for the integration point. Never
 * runs per animation frame. Produces invisible metadata only; the renderer
 * consumes exactly one field from it (`breathingOffset`) and remains
 * otherwise unaware this module exists, per the spec's Renderer Contract.
 *
 * Pipeline (matches the spec's diagram):
 *   Generate Positions  → already done by buildFieldLayout()
 *   Find Nearby Glyphs  → spatial hash grid (see below)
 *   Estimate Density    → normalised neighbour count per cell
 *   Assign Neighborhood → grid bucket id
 *   Calculate Affinity  → density + proximity + neighborhood coherence
 *   Assign Breathing Offset → neighborhood phase + small jitter
 *
 * ---------------------------------------------------------------------------
 * NEIGHBORHOOD DISCOVERY -- implementation choice (spec leaves this open)
 * ---------------------------------------------------------------------------
 * Neighborhoods are formed with a spatial hash grid: space is partitioned
 * into fixed-size buckets, and every glyph belongs to exactly one bucket.
 * This satisfies "no fixed radius" as the spec means it -- no per-glyph
 * radius search producing ambiguous, overlapping membership -- while still
 * giving each glyph exactly one primary neighborhood, no visible borders,
 * and O(n) cost. Bucket size is tuned (see NEIGHBORHOOD_CELL_PX below) so
 * a typical bucket contains roughly the spec's target of 8-20 glyphs given
 * the field's actual clustered-scatter density; this is a starting
 * calibration, not a hard guarantee for every viewport size.
 *
 * ---------------------------------------------------------------------------
 * DETERMINISM -- what's actually deterministic here
 * ---------------------------------------------------------------------------
 * neighborhoodId, localDensity, and affinityStrength are pure functions of
 * the cells' already-fixed (x, y) positions -- zero randomness. Rebuilding
 * from the same layout always reproduces the same values. breathingOffset's
 * neighborhood-base component is likewise a deterministic hash of the
 * neighborhood id; only the small jitter on top of it (explicitly sanctioned
 * by the spec as a "small tie-breaker") uses Math.random(). Full end-to-end
 * determinism (identical breathing across rebuilds) is NOT implemented here,
 * since it would require threading a seeded PRNG through the layout's own
 * cluster/glyph randomness -- out of scope for 03A, which explicitly leaves
 * the layout itself unmodified.
 */

import type { FieldCell } from "./field-layout";
import type { GlyphAffinity } from "./affinity-types";

/** Bucket size in CSS px. Calibrated against the field's ACTUAL measured
 *  density (not guessed): at the shipped cluster-scatter settings, the field
 *  averages ~0.00014 occupied cells/px^2, so a ~380x260px bucket (same 1.5:1
 *  aspect as the 60x40 cell pitch) lands close to the spec's 8-20
 *  glyphs/neighborhood midpoint. Verified empirically in
 *  affinity-engine.selfcheck.ts -- if cluster density settings change later,
 *  re-run that script and retune here. */
const NEIGHBORHOOD_CELL_PX = { w: 380, h: 260 } as const;

/** Radius (px) used for local density / nearest-neighbour scans. Chosen to
 *  comfortably cover one bucket's worth of neighbours without needing to
 *  scan the whole field. */
const INFLUENCE_RADIUS_PX = 150;

/** Neighbour count at/above which density is considered "1.0 dense" for
 *  normalisation purposes. An empirical cap, not a hard limit on how many
 *  neighbours a cell can actually have. */
const DENSITY_SATURATION_COUNT = 14;

/** Distance (px) at/beyond which nearest-neighbour proximity contributes
 *  ~0 to affinity strength. */
const PROXIMITY_SATURATION_PX = 200;

/** Small jitter range (radians) layered on top of each neighborhood's base
 *  phase. Deliberately tiny -- enough to prevent mechanical synchronisation,
 *  never enough to read as a new visible pulsing pattern. */
const BREATHING_JITTER_RADIANS = 0.15;

function bucketKey(bx: number, by: number): string {
  return `N-${bx}-${by}`;
}

/** FNV-1a-style string hash -> deterministic [0, 1) float. Used to derive a
 *  stable base breathing phase per neighborhood id without needing a formal
 *  seeded-PRNG dependency. */
function hash01(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned 32-bit -> [0, 1)
  return (h >>> 0) / 0xffffffff;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function distance(a: FieldCell, b: FieldCell): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Attaches `affinity` to every cell in place. Cells come from a freshly
 * built FieldLayout (buildFieldLayout()'s return value isn't shared or
 * aliased elsewhere), so in-place mutation is safe and avoids allocating a
 * second full array purely to satisfy immutability that nothing depends on.
 *
 * O(n) average case: cells are bucketed once (O(n)), then each cell only
 * scans its own bucket plus the 8 adjacent buckets (bounded, not O(n) per
 * cell) for density/nearest-neighbour/coherence -- never all-pairs.
 */
export function applyAffinity(cells: readonly FieldCell[]): void {
  if (cells.length === 0) return;

  // --- 1. Neighborhood discovery: bucket every cell once. ---
  const buckets = new Map<string, FieldCell[]>();
  const cellBucketCoord = new Map<FieldCell, { bx: number; by: number }>();

  for (const cell of cells) {
    const bx = Math.floor(cell.x / NEIGHBORHOOD_CELL_PX.w);
    const by = Math.floor(cell.y / NEIGHBORHOOD_CELL_PX.h);
    cellBucketCoord.set(cell, { bx, by });
    const key = bucketKey(bx, by);
    const list = buckets.get(key);
    if (list) list.push(cell);
    else buckets.set(key, [cell]);
  }

  /** Cells in the 3x3 bucket neighbourhood around (bx, by), including the
   *  cell's own bucket. Bounded work regardless of total field size. */
  function localCandidates(bx: number, by: number): FieldCell[] {
    const out: FieldCell[] = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const list = buckets.get(bucketKey(bx + dx, by + dy));
        if (list) out.push(...list);
      }
    }
    return out;
  }

  // --- 2. Local density per cell (pure function of position). ---
  const densityByCell = new Map<FieldCell, number>();
  const nearestDistByCell = new Map<FieldCell, number>();

  for (const cell of cells) {
    const { bx, by } = cellBucketCoord.get(cell)!;
    const candidates = localCandidates(bx, by);

    let neighborCount = 0;
    let nearestDist = Infinity;
    for (const other of candidates) {
      if (other === cell) continue;
      const d = distance(cell, other);
      if (d <= INFLUENCE_RADIUS_PX) neighborCount++;
      if (d < nearestDist) nearestDist = d;
    }

    densityByCell.set(cell, clamp01(neighborCount / DENSITY_SATURATION_COUNT));
    nearestDistByCell.set(
      cell,
      Number.isFinite(nearestDist) ? nearestDist : PROXIMITY_SATURATION_PX
    );
  }

  // --- 3. Neighborhood average density, for the coherence term below. ---
  const neighborhoodDensitySum = new Map<string, number>();
  const neighborhoodCount = new Map<string, number>();
  for (const cell of cells) {
    const { bx, by } = cellBucketCoord.get(cell)!;
    const key = bucketKey(bx, by);
    const d = densityByCell.get(cell)!;
    neighborhoodDensitySum.set(key, (neighborhoodDensitySum.get(key) ?? 0) + d);
    neighborhoodCount.set(key, (neighborhoodCount.get(key) ?? 0) + 1);
  }
  const neighborhoodAvgDensity = new Map<string, number>();
  for (const [key, sum] of neighborhoodDensitySum) {
    neighborhoodAvgDensity.set(key, sum / (neighborhoodCount.get(key) ?? 1));
  }

  // --- 4/5/6. Affinity strength + breathing offset, written onto each cell. ---
  for (const cell of cells) {
    const { bx, by } = cellBucketCoord.get(cell)!;
    const neighborhoodId = bucketKey(bx, by);

    const localDensity = densityByCell.get(cell)!;
    const nearestDist = nearestDistByCell.get(cell)!;
    const proximityScore = clamp01(1 - nearestDist / PROXIMITY_SATURATION_PX);
    const avgDensity = neighborhoodAvgDensity.get(neighborhoodId) ?? localDensity;
    const coherenceScore = clamp01(1 - Math.abs(localDensity - avgDensity));

    const affinityStrength = clamp01((localDensity + proximityScore + coherenceScore) / 3);

    const neighborhoodBasePhase = hash01(neighborhoodId) * 2 * Math.PI;
    const jitter = (Math.random() * 2 - 1) * BREATHING_JITTER_RADIANS;
    const breathingOffset = neighborhoodBasePhase + jitter;

    cell.affinity = {
      neighborhoodId,
      localDensity,
      affinityStrength,
      breathingOffset,
    };
  }
}
