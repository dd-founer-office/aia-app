/**
 * Living Field — Natural Distribution Engine
 * ----------------------------------------------------------------------------
 * Build Sprint 03B (Natural Distribution Engine v1.0).
 *
 * Runs once per layout build, immediately after the Field Engine generates
 * base slot positions and BEFORE the Civilization Engine assigns scripts —
 * see field-layout.ts's `buildFieldLayout()` for the three-stage pipeline
 * this now participates in. Never runs per animation frame. Refines WHERE
 * each slot sits; never touches WHICH slots exist, WHICH script a slot
 * gets, or anything affinity- or render-related.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS DOES NOT TOUCH (explicit contracts from the spec)
 * ---------------------------------------------------------------------------
 * - Civilization Engine (script/glyph selection, historical weighting): not
 *   imported, not called, not referenced. This module only sees {x, y, col,
 *   row, stratum} slots — it has no concept of scripts or glyphs at all.
 * - Affinity Engine (neighborhoods, density, breathing offsets): not
 *   imported, not called. Affinity runs afterward, in engine.ts, on
 *   whatever final positions this module produces — exactly as it already
 *   did in Sprint 03A, just with slightly different input coordinates.
 * - Renderer: not imported, not referenced, not modified anywhere in this
 *   sprint. It already reads cell.x/cell.y generically.
 *
 * ---------------------------------------------------------------------------
 * INTERPRETING "ORGANIC, NEVER GEOMETRIC" / "NEVER VISIBLE CLUSTERS"
 * ---------------------------------------------------------------------------
 * The existing clustered-scatter macro pattern (which grid cells are
 * occupied at all, in loose bursts separated by gaps) is UNCHANGED here —
 * that macro whitespace/population structure is what the spec's own
 * Principle 2 ("some regions should feel gently populated") describes, and
 * every sprint so far has preserved it as core visual identity. What this
 * module addresses is the MICRO-level fact that, until now, every occupied
 * slot sat dead-center in a mechanical 60x40px grid cell — visually "equal
 * spacing" at close inspection. This module nudges each slot's exact pixel
 * position by a smooth, deterministic amount so that mechanical alignment
 * disappears, without changing which cells are populated.
 *
 * ---------------------------------------------------------------------------
 * WHY VALUE NOISE, NOT INDEPENDENT PER-CELL JITTER
 * ---------------------------------------------------------------------------
 * Reading "eliminating artificial randomness" and "soft density variation...
 * never sharp transitions" together: independent per-cell `Math.random()`
 * jitter is itself a kind of "artificial randomness" -- high-frequency,
 * uncorrelated, and prone to occasional unnatural-looking tight pairs or
 * gaps purely by chance (a known property of naive uniform random
 * processes). A smooth 2D value-noise field gives each slot a nudge that
 * varies gently as you move across the field -- nearby slots get nudged in
 * similar directions/amounts, distant slots don't -- which is closer to how
 * real scattered natural material (leaves, pebbles) actually clusters and
 * thins gradually rather than independently per point. It's also fully
 * deterministic (a pure function of position), satisfying "preserve
 * deterministic generation where possible" for this stage specifically --
 * unlike the existing cluster/gap and glyph-dealing logic, which still use
 * Math.random() and are explicitly out of scope to change here.
 *
 * ---------------------------------------------------------------------------
 * LIVING REGION ADDITION (Sprint 04A, Commit 1)
 * ---------------------------------------------------------------------------
 * `applyNaturalDistribution()` gains one optional parameter, `jitterFraction`,
 * defaulting to the exported `JITTER_FRACTION` constant -- bit-identical
 * behaviour for every existing call site, which omits it. field-layout.ts's
 * reserved-verse pass calls this function a second time, on just the
 * reserved slots, with a much smaller override (a fraction of
 * JITTER_FRACTION itself, per living-region.ts's `positionJitterScale`) so
 * a revealed verse gets the same "never mechanically rectangular" subtlety
 * the rest of the field has, without ever risking legibility. The noise
 * field, hashing, and smoothstep math are completely unchanged -- only
 * which jitter fraction scales the result is now a parameter instead of
 * always reading the module constant directly.
 */

import type { FieldStratum } from "./config";

/** The Field Engine's output before Civilization assigns a glyph: a
 *  position and depth stratum, nothing else. Natural Distribution operates
 *  on this shape and hands slots (with refined x, y) on to Civilization. */
export interface FieldSlot {
  x: number;
  y: number;
  col: number;
  row: number;
  stratum: FieldStratum;
}

/** Max nudge as a fraction of the base cell pitch, per axis, for an ordinary
 *  field slot. Deliberately gentle -- large enough to break dead-center grid
 *  alignment, small enough that adjacent slots can't be pushed into overlap
 *  or read as a deliberate new shape. Exported (Sprint 04A) so a caller can
 *  derive a smaller override relative to this same baseline, rather than
 *  hardcoding an unrelated absolute value elsewhere. */
export const JITTER_FRACTION = 0.35;

/** Noise-field frequency: how quickly the nudge direction/amount changes as
 *  you move across the grid. Lower = broader, smoother drift; higher =
 *  finer-grained variation. Tuned to change noticeably over several cells,
 *  not from one cell to its immediate neighbour (that would look like
 *  independent per-cell jitter again). */
const NOISE_FREQUENCY = 0.08;

/** Large odd offset used to decorrelate the Y-axis noise sample from the
 *  X-axis one, so slots don't just slide diagonally in lockstep. */
const Y_AXIS_NOISE_OFFSET = 977.31;

/**
 * Deterministic integer-lattice hash -> [-1, 1]. Intentionally duplicated
 * (not imported) from the small hash helper affinity-engine.ts uses for its
 * own, unrelated purpose -- Sprint 03A's file is explicitly not to be
 * modified for this sprint, including "just" adding a shared import to it.
 */
function latticeHash(ix: number, iy: number): number {
  let h = ix * 374761393 + iy * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Smooth 2D value noise via bilinear interpolation between lattice-hash
 *  corners. Standard, dependency-free, O(1) per sample. Returns a value in
 *  [-1, 1] that varies gradually as (x, y) moves -- the "soft density
 *  variation... never sharp transitions" the spec asks for, applied to
 *  position rather than density (see module header for why density itself
 *  is out of scope). */
function valueNoise2D(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const sx = smoothstep(x - x0);
  const sy = smoothstep(y - y0);

  const n00 = latticeHash(x0, y0);
  const n10 = latticeHash(x1, y0);
  const n01 = latticeHash(x0, y1);
  const n11 = latticeHash(x1, y1);

  const nx0 = n00 + sx * (n10 - n00);
  const nx1 = n01 + sx * (n11 - n01);
  return nx0 + sy * (nx1 - nx0);
}

/**
 * Nudges every slot's (x, y) in place by a smooth, deterministic amount.
 * Mutates the passed-in array's elements directly -- slots come from a
 * freshly generated, unshared array (see field-layout.ts), so this is safe
 * and avoids an unnecessary second allocation.
 *
 * `jitterFraction` defaults to `JITTER_FRACTION` (Sprint 01-03B behaviour,
 * bit-identical for every call site that omits it). A caller may override it
 * for a specific batch of slots -- currently only field-layout.ts's reserved
 * verse pass does this, with a smaller value.
 *
 * O(n): one bounded (4-corner) noise sample per axis per slot, no
 * neighbour lookups, no per-frame cost -- runs once per layout build.
 */
export function applyNaturalDistribution(
  slots: readonly FieldSlot[],
  cellWidth: number,
  cellHeight: number,
  jitterFraction: number = JITTER_FRACTION
): void {
  const maxDx = cellWidth * jitterFraction;
  const maxDy = cellHeight * jitterFraction;

  for (const slot of slots) {
    const nx = slot.col * NOISE_FREQUENCY;
    const ny = slot.row * NOISE_FREQUENCY;

    const dx = valueNoise2D(nx, ny) * maxDx;
    const dy = valueNoise2D(nx + Y_AXIS_NOISE_OFFSET, ny + Y_AXIS_NOISE_OFFSET) * maxDy;

    slot.x += dx;
    slot.y += dy;
  }
}
