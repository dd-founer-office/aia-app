/**
 * Living Language Story — Performer Selection (v0.2)
 * ----------------------------------------------------------------------------
 * Sits alongside grapheme-source.ts (left untouched, per explicit direction,
 * until this proof is visually approved) rather than replacing it. Where
 * grapheme-source.ts searched the field for cells whose EXISTING glyph
 * already matched a target grapheme (and could come up empty on a sparse
 * mobile layout -- see this module's design notes), this module never
 * searches for a match at all: any ordinary cell can become any performer,
 * because Story Mode now GIVES a chosen cell a temporary storyGlyph rather
 * than requiring one to already be there. Presence is no longer a concern;
 * choreography is the only concern.
 *
 * Two responsibilities:
 *
 *   1. selectPerformerHomes() -- pure, deterministic, no Math.random.
 *      Chooses four existing field cells as performer HOMEs based on visual
 *      choreography: distance from the stage, spatial separation from each
 *      other, mild depth-stratum preference, and on-screen safety. Never
 *      reads or considers `cell.glyph` at all -- selection is purely
 *      geometric.
 *   2. assignPerformersToTargets() -- given four chosen homes and four
 *      fixed, left-to-right target positions (from grapheme-source.ts's
 *      unchanged measureGraphemeTargets()), finds the assignment that
 *      minimizes path crossings, never compromising the destination's
 *      left-to-right grapheme order. Only 24 possible permutations of 4
 *      items -- brute-forced exactly, not approximated.
 *
 * Neither function touches a canvas, reads or writes FieldCell.x/y, or
 * knows anything about opacity, scale, or timing -- purely geometric
 * decisions, consumed by story-controller.ts to build StoryFragments.
 */

export interface PerformerCandidate {
  cellIndex: number;
  x: number;
  y: number;
  /** Whether this cell's stratum is the shallowest configured one ("near").
   *  Used only for a mild preference (deeper cells make a more convincing
   *  "distant star" at the start of their journey) -- never a hard filter. */
  isShallowestStratum: boolean;
}

export interface PerformerHome {
  cellIndex: number;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** Candidates within this fraction of the canvas width/height from any edge
 *  are disqualified entirely -- on-screen safety, not scored. */
const EDGE_MARGIN_FRACTION = 0.06;

/** Distance-from-center scoring peaks here (as a fraction of the shorter
 *  viewport dimension) and tapers off both closer and farther. Close
 *  candidates make too weak a journey to read as "coming from somewhere";
 *  far candidates risk edge-clipping and unrealistically long travel. */
const TARGET_DISTANCE_FRACTION = 0.325;
/** Half-width of the distance scoring band, same units as above. */
const DISTANCE_SPREAD = 0.25;

/** Mild bonus for a non-shallowest-stratum candidate -- "suitable existing
 *  stratum/depth," per explicit direction, not an exclusion. */
const DEEP_STRATUM_BONUS = 0.15;

/** How strongly angular separation from already-picked performers is
 *  rewarded, relative to the 0..1 distance score. Weighted higher than the
 *  distance/stratum terms specifically for performers 2-4, since spatial
 *  diversity from EACH OTHER (not just from center) is what the previous
 *  attempt's quadrant-bucketing approach got wrong. */
const SEPARATION_WEIGHT = 1.5;

function distanceScore(normalizedDist: number): number {
  const diff = Math.abs(normalizedDist - TARGET_DISTANCE_FRACTION);
  return Math.max(0, 1 - diff / DISTANCE_SPREAD);
}

/** Smallest angular difference between two angles (radians), wrapped into
 *  [0, PI] -- "how far apart do these two directions from center feel,"
 *  regardless of sign or which is larger. */
function angularDifference(a: number, b: number): number {
  let diff = Math.abs(a - b) % (2 * Math.PI);
  if (diff > Math.PI) diff = 2 * Math.PI - diff;
  return diff;
}

/**
 * Deterministically selects `count` (always 4 for this proof) existing
 * field cells as performer homes. Greedy: picks the best-scoring candidate
 * one at a time, each subsequent pick additionally rewarded for angular
 * separation from every already-picked performer -- this is what spreads
 * four picks around the composition without ever hardcoding quadrants, and
 * adapts to whatever a given layout's real cell distribution looks like.
 *
 * Ties at every step broken by lowest cellIndex, so a given `cells` array
 * (i.e. a given layout generation, un-resized) always produces the same
 * four homes. No Math.random anywhere in this function.
 */
export function selectPerformerHomes(
  cells: readonly PerformerCandidate[],
  centerX: number,
  centerY: number,
  canvasWidth: number,
  canvasHeight: number,
  count: number
): PerformerHome[] {
  const shorterDim = Math.min(canvasWidth, canvasHeight);
  const edgeMarginX = canvasWidth * EDGE_MARGIN_FRACTION;
  const edgeMarginY = canvasHeight * EDGE_MARGIN_FRACTION;

  const eligible = cells.filter(
    (c) =>
      c.x >= edgeMarginX &&
      c.x <= canvasWidth - edgeMarginX &&
      c.y >= edgeMarginY &&
      c.y <= canvasHeight - edgeMarginY
  );

  const picked: PerformerHome[] = [];
  const pickedAngles: number[] = [];
  const usedIndices = new Set<number>();

  for (let slot = 0; slot < count; slot++) {
    let best: PerformerCandidate | null = null;
    let bestScore = -Infinity;

    for (const candidate of eligible) {
      if (usedIndices.has(candidate.cellIndex)) continue;

      const dx = candidate.x - centerX;
      const dy = candidate.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normalizedDist = dist / shorterDim;
      const angle = Math.atan2(dy, dx);

      let score = distanceScore(normalizedDist);
      if (!candidate.isShallowestStratum) score += DEEP_STRATUM_BONUS;

      if (pickedAngles.length > 0) {
        const minSeparation = Math.min(
          ...pickedAngles.map((a) => angularDifference(angle, a))
        );
        // Normalize to 0..1 (PI = perfectly opposite = max reward).
        score += SEPARATION_WEIGHT * (minSeparation / Math.PI);
      }

      if (
        score > bestScore ||
        (score === bestScore && best !== null && candidate.cellIndex < best.cellIndex)
      ) {
        bestScore = score;
        best = candidate;
      }
    }

    if (!best) break; // fewer eligible cells than requested -- caller handles a short result
    usedIndices.add(best.cellIndex);
    picked.push({ cellIndex: best.cellIndex, x: best.x, y: best.y });
    pickedAngles.push(Math.atan2(best.y - centerY, best.x - centerX));
  }

  return picked;
}

// ---------------------------------------------------------------------------
// Assignment: which performer goes to which target, minimizing crossings
// ---------------------------------------------------------------------------

interface Point {
  x: number;
  y: number;
}

/** Standard 2D segment-intersection test (proper crossing only -- shared
 *  endpoints or collinear touches don't count, since performers never
 *  actually start or end at the same point as each other). */
function segmentsCross(a1: Point, a2: Point, b1: Point, b2: Point): boolean {
  function cross(o: Point, p: Point, q: Point): number {
    return (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);
  }
  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);
  return (d1 > 0 !== d2 > 0) && (d3 > 0 !== d4 > 0);
}

function permutations<T>(items: readonly T[]): T[][] {
  if (items.length <= 1) return [items.slice()];
  const result: T[][] = [];
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const p of permutations(rest)) {
      result.push([items[i], ...p]);
    }
  }
  return result;
}

/**
 * Finds, by exhaustive search over all 24 permutations of 4 items, which
 * assignment of performer HOMES to fixed target positions produces the
 * fewest crossing path-pairs -- ties broken by total travel distance
 * (shorter overall), then by the assignment's own lexical order over
 * cellIndex (full determinism, no arbitrary iteration-order dependence).
 *
 * `targets` MUST already be in the desired left-to-right destination order
 * (grapheme-source.ts's measureGraphemeTargets() output, unchanged) --
 * this function only permutes WHICH HOME goes to which target index, never
 * the targets themselves, so the destination's grapheme order can never be
 * compromised regardless of which permutation wins.
 */
export function assignPerformersToTargets(
  homes: readonly PerformerHome[],
  targets: readonly Point[]
): PerformerHome[] {
  if (homes.length !== targets.length) {
    throw new Error(
      `assignPerformersToTargets: ${homes.length} homes but ${targets.length} targets -- must match exactly`
    );
  }

  let bestAssignment: PerformerHome[] = homes.slice();
  let bestCrossings = Infinity;
  let bestTotalDistance = Infinity;

  for (const perm of permutations(homes)) {
    let crossings = 0;
    for (let i = 0; i < perm.length; i++) {
      for (let j = i + 1; j < perm.length; j++) {
        if (segmentsCross(perm[i], targets[i], perm[j], targets[j])) {
          crossings++;
        }
      }
    }

    let totalDistance = 0;
    for (let i = 0; i < perm.length; i++) {
      const dx = targets[i].x - perm[i].x;
      const dy = targets[i].y - perm[i].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    const permKey = perm.map((p) => p.cellIndex).join(",");
    const bestKey = bestAssignment.map((p) => p.cellIndex).join(",");

    const better =
      crossings < bestCrossings ||
      (crossings === bestCrossings && totalDistance < bestTotalDistance) ||
      (crossings === bestCrossings &&
        totalDistance === bestTotalDistance &&
        permKey < bestKey);

    if (better) {
      bestCrossings = crossings;
      bestTotalDistance = totalDistance;
      bestAssignment = perm;
    }
  }

  return bestAssignment;
}
