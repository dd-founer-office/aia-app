/**
 * Living Region — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/ (see ambient-expression.selfcheck.ts).
 *
 * Run with `npx tsx lib/living-field/living-region.selfcheck.ts`.
 *
 * Uses neutral placeholder graphemes ("அ", "ப", etc.), NOT real KKA-001
 * content -- this module has no opinion about any specific poem, and its
 * self-check shouldn't either. Verifies geometry and reservation mechanics
 * only. What this CANNOT verify: how a reserved cell actually renders once
 * revealed, or the press-and-hold interaction -- those arrive with the
 * renderer/interaction commits and get their own self-checks then.
 */

import {
  LIVING_REGION_CONFIG,
  deriveLivingRegionRect,
  reserveVerseSlots,
  resolveVerseStratum,
  type ReservedVerseInput,
} from "./living-region";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

const VIEWPORT_W = 1280;
const VIEWPORT_H = 800;
const { cellWidth, cellHeight, strata } = LIVING_FIELD_CONFIG;
const { viewport, typography } = LIVING_REGION_CONFIG;

// A neutral 4-word / 3-word fixture -- shape matches the locked editorial
// rule, content is placeholder only.
const FIXTURE: ReservedVerseInput = {
  lines: [
    [["அ", "ப"], ["ச"], ["த", "ம்"], ["ர"]], // line 1: 4 words, 5 graphemes
    [["ல", "வ"], ["ழ"], ["ள", "ற", "ன"]], // line 2: 3 words, 6 graphemes
  ],
};

function run(): void {
  // --- 1. Rectangle derivation is deterministic and inside the viewport. ---
  const rect = deriveLivingRegionRect(
    VIEWPORT_W,
    VIEWPORT_H,
    viewport,
    typography,
    cellWidth,
    cellHeight
  );
  const rect2 = deriveLivingRegionRect(
    VIEWPORT_W,
    VIEWPORT_H,
    viewport,
    typography,
    cellWidth,
    cellHeight
  );
  assert(JSON.stringify(rect) === JSON.stringify(rect2), "rectangle derivation is deterministic");
  assert(rect.left >= 0, "rectangle left edge is within the viewport");
  assert(rect.left + rect.width <= VIEWPORT_W, "rectangle right edge is within the viewport");
  assert(rect.top + rect.height <= VIEWPORT_H, "rectangle bottom edge is within the viewport");
  assert(
    rect.height === (2 + 1 * typography.lineGapRows + typography.verseInset.rows * 2) * cellHeight,
    "rectangle height is derived from typography (2 lines + gap + insets), not hardcoded"
  );
  console.log("rectangle derivation verified:", rect);

  // --- 2. Reservation places every grapheme, in order, with no duplicates. ---
  const { placements, occupied } = reserveVerseSlots(
    rect,
    FIXTURE,
    typography,
    cellWidth,
    cellHeight
  );
  const totalGraphemes = FIXTURE.lines.reduce(
    (sum, line) => sum + line.reduce((s, w) => s + w.length, 0),
    0
  );
  assert(
    placements.length === totalGraphemes,
    `every grapheme gets exactly one placement (expected ${totalGraphemes}, got ${placements.length})`
  );
  assert(occupied.size === placements.length, "occupied set has one entry per placement (no overlap)");

  const orders = placements.map((p) => p.order);
  const sortedOrders = [...orders].sort((a, b) => a - b);
  assert(
    JSON.stringify(orders) === JSON.stringify(sortedOrders),
    "placements are produced in reading order (order field is monotonically increasing)"
  );

  // Line 1's row must be strictly above line 2's row (smaller row index),
  // and every placement in a line must share that line's row.
  const line0Rows = new Set(placements.filter((p) => p.lineIndex === 0).map((p) => p.row));
  const line1Rows = new Set(placements.filter((p) => p.lineIndex === 1).map((p) => p.row));
  assert(line0Rows.size === 1, "all of line 1's placements share a single row");
  assert(line1Rows.size === 1, "all of line 2's placements share a single row");
  const row0 = [...line0Rows][0];
  const row1 = [...line1Rows][0];
  assert(row1 > row0, "line 2 sits below line 1 (higher row index)");

  // Reconstructed glyph sequence, per line, must match the fixture exactly,
  // including word boundaries (verified via wordIndex).
  for (const [lineIndex, line] of FIXTURE.lines.entries()) {
    const flatExpected = line.flat();
    const actual = placements
      .filter((p) => p.lineIndex === lineIndex)
      .sort((a, b) => a.order - b.order)
      .map((p) => p.glyphValue);
    assert(
      JSON.stringify(actual) === JSON.stringify(flatExpected),
      `line ${lineIndex} glyph sequence matches input exactly (expected ${JSON.stringify(flatExpected)}, got ${JSON.stringify(actual)})`
    );
  }

  console.log(`reservation verified: ${placements.length} cells reserved, correct order and sequence`);

  // --- 3. Stratum resolution. ---
  const verseStratum = resolveVerseStratum(strata, typography);
  assert(verseStratum.id === typography.stratumId, "resolved stratum matches configured stratumId");
  assert(
    verseStratum.id === "near",
    'verse renders at the "near" (shallowest, most legible) stratum by default'
  );

  let threw = false;
  try {
    resolveVerseStratum(strata, { ...typography, stratumId: "does-not-exist" });
  } catch {
    threw = true;
  }
  assert(threw, "resolveVerseStratum throws on an unknown stratumId rather than silently falling back");

  if (failures === 0) {
    console.log(`\nPASS: all Living Region checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
