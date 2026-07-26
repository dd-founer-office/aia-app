/**
 * Living Language Story — Grapheme Source Selection (v0.2)
 * ----------------------------------------------------------------------------
 * Replaces v0.1's pixel-mask silhouette approach entirely. Three
 * responsibilities, all outside the Kernel, none touching a live canvas:
 *
 *   1. segmentGraphemes() -- correct Tamil grapheme segmentation via
 *      Intl.Segmenter. Never splits by JS code unit.
 *   2. measureGraphemeTargets() -- where each grapheme visually belongs in
 *      the CORRECTLY SHAPED final word, derived from the browser's own font
 *      metrics (ctx.measureText on cumulative prefixes of the real string),
 *      never from manually-positioned combining marks.
 *   3. selectGraphemeSources() -- deterministically picks which currently
 *      on-screen field cell each grapheme travels from, favouring spatial
 *      diversity (different regions of the field) balanced against calm
 *      travel distance. No Math.random anywhere in this file: the same
 *      layout always produces the same selection, per explicit direction.
 *
 * IMPORTANT ON GRAPHEME/GLYPH GRANULARITY: the Kernel's 247-glyph modern
 * Tamil set (lib/living-field/glyphs.ts) is built as full orthographic
 * units (consonant+pulli, consonant+vowel-sign compounds) -- not bare
 * Unicode code points. For வாழ்த்து specifically, this means every one of
 * its four grapheme clusters (வா, ழ், த், து) is byte-identical to an
 * existing literal glyph value already in that set. This is not a
 * coincidence this file relies on for correctness -- selectGraphemeSources()
 * still does an exact string-match search and honestly reports "not found"
 * (a fallback fragment, never a fabricated one) if a future target word
 * ever needed a grapheme the Kernel's glyph set doesn't happen to contain.
 */

export interface GraphemeTarget {
  x: number;
  y: number;
}

export type GraphemeSource =
  | { found: true; cellIndex: number; homeX: number; homeY: number }
  | { found: false };

/** Correct Tamil grapheme segmentation. Falls back to Array.from (code-point,
 *  not UTF-16 code-unit, iteration) only if Intl.Segmenter is unavailable in
 *  the runtime -- every modern evergreen browser supports it, so this is a
 *  defensive fallback, not the expected path. */
export function segmentGraphemes(word: string): string[] {
  const SegmenterCtor = (Intl as unknown as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  if (typeof SegmenterCtor === "function") {
    const segmenter = new SegmenterCtor("ta", { granularity: "grapheme" });
    return Array.from(segmenter.segment(word), (s) => s.segment);
  }
  return Array.from(word);
}

/**
 * Measures where each grapheme sits in the browser-shaped rendering of the
 * complete string, centred at (centerX, centerY) with textAlign "center" /
 * textBaseline "middle" -- the exact alignment the hero fillText call uses,
 * so these coordinates line up with where the real hero text will actually
 * paint. Uses a detached, never-appended canvas purely for measureText;
 * nothing here is ever drawn to the visible field.
 */
export function measureGraphemeTargets(
  fullWord: string,
  graphemes: readonly string[],
  fontFamily: string,
  fontWeight: number,
  fontSizePx: number,
  centerX: number,
  centerY: number
): GraphemeTarget[] {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return graphemes.map(() => ({ x: centerX, y: centerY }));

  ctx.font = `${fontWeight} ${fontSizePx}px ${fontFamily}`;

  // Cumulative prefix widths of the REAL shaped string -- e.g. for
  // ["வா","ழ்","த்","து"] this measures "", "வா", "வாழ்", "வாழ்த்",
  // "வாழ்த்து". The browser's own shaping engine, not this file, decides
  // what each prefix's rendered width is.
  const prefixWidths: number[] = [0];
  let running = "";
  for (const g of graphemes) {
    running += g;
    prefixWidths.push(ctx.measureText(running).width);
  }
  const totalWidth = prefixWidths[prefixWidths.length - 1];
  // Sanity check: the full accumulated string should equal fullWord for a
  // simple concatenative word like வாழ்த்து. If a future target word's
  // segmentation doesn't round-trip cleanly, fall back to measuring
  // fullWord directly for total width rather than trusting the sum.
  const measuredFullWidth =
    running === fullWord ? totalWidth : ctx.measureText(fullWord).width;

  const leftEdge = centerX - measuredFullWidth / 2;
  const targets: GraphemeTarget[] = [];
  for (let i = 0; i < graphemes.length; i++) {
    const startX = leftEdge + prefixWidths[i];
    const endX = leftEdge + prefixWidths[i + 1];
    targets.push({ x: (startX + endX) / 2, y: centerY });
  }
  return targets;
}

interface Candidate {
  cellIndex: number;
  x: number;
  y: number;
}

function quadrantOf(x: number, y: number, centerX: number, centerY: number): 0 | 1 | 2 | 3 {
  const left = x < centerX;
  const top = y < centerY;
  if (top && left) return 0; // top-left
  if (top && !left) return 1; // top-right
  if (!top && left) return 2; // bottom-left
  return 3; // bottom-right
}

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/**
 * Deterministically picks, from `candidates`, the one closest to
 * (centerX, centerY) -- ties broken by lowest cellIndex, so the result
 * never depends on array iteration order or Math.random. Used both for
 * "pick the nearest candidate in the assigned quadrant" and for the
 * any-quadrant fallback.
 */
function nearestDeterministic(
  candidates: readonly Candidate[],
  centerX: number,
  centerY: number
): Candidate | null {
  let best: Candidate | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = distSq(c.x, c.y, centerX, centerY);
    if (d < bestDist || (d === bestDist && best !== null && c.cellIndex < best.cellIndex)) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/**
 * For each grapheme, searches the CURRENT layout's cells for an exact
 * text-glyph match and deterministically picks one, preferring a fixed,
 * distinct target quadrant per grapheme index (0: top-left, 1: top-right,
 * 2: bottom-left, 3: bottom-right of the viewport, relative to the
 * composition centre) so the four sources visibly come from different
 * regions of the field. Falls back to the nearest match in ANY quadrant if
 * none exists in the assigned one, and to `{ found: false }` (logged, never
 * fabricated) if the grapheme isn't present anywhere in the current layout
 * at all -- see this module's header and story-controller.ts's console
 * note for that path.
 *
 * Deterministic by construction: no Math.random, only nearest-distance and
 * lowest-index tie-breaks. The same layout (same `cells` array, i.e. no
 * resize/rebuild in between) always produces the same selection.
 */
export function selectGraphemeSources(
  cells: readonly { x: number; y: number; glyph: { kind: "text" | "path"; value: unknown } }[],
  graphemes: readonly string[],
  centerX: number,
  centerY: number
): GraphemeSource[] {
  // Bucket every text-glyph cell by which grapheme it matches, once, up
  // front -- O(cells) total rather than O(cells * graphemes). Only cells
  // whose glyph matches one of the requested graphemes are tracked.
  const wanted = new Set(graphemes);
  const byGrapheme = new Map<string, Candidate[]>();
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell.glyph.kind !== "text") continue;
    const value = cell.glyph.value as string;
    if (!wanted.has(value)) continue;
    const list = byGrapheme.get(value);
    if (list) {
      list.push({ cellIndex: i, x: cell.x, y: cell.y });
    } else {
      byGrapheme.set(value, [{ cellIndex: i, x: cell.x, y: cell.y }]);
    }
  }

  const usedCellIndices = new Set<number>();
  const results: GraphemeSource[] = [];

  graphemes.forEach((grapheme, i) => {
    const candidates = (byGrapheme.get(grapheme) ?? []).filter(
      (c) => !usedCellIndices.has(c.cellIndex)
    );
    if (candidates.length === 0) {
      results.push({ found: false });
      return;
    }

    const assignedQuadrant = (i % 4) as 0 | 1 | 2 | 3;
    const inQuadrant = candidates.filter(
      (c) => quadrantOf(c.x, c.y, centerX, centerY) === assignedQuadrant
    );

    const chosen =
      nearestDeterministic(inQuadrant, centerX, centerY) ??
      nearestDeterministic(candidates, centerX, centerY);

    if (!chosen) {
      results.push({ found: false });
      return;
    }

    usedCellIndices.add(chosen.cellIndex);
    results.push({ found: true, cellIndex: chosen.cellIndex, homeX: chosen.x, homeY: chosen.y });
  });

  return results;
}
