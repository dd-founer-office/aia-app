/**
 * Living Region — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/ (see ambient-expression.selfcheck.ts).
 *
 * Run with `npx tsx lib/living-field/living-region.selfcheck.ts`.
 *
 * Commit 1A change: this now validates against the REAL KKA-001 verse text
 * (via reserved-verse-bridge.ts), not a neutral placeholder. Commit 1's
 * version used placeholder graphemes and passed cleanly -- but the geometry
 * it validated didn't survive contact with the real, longer verse (see
 * Commit 1A's header in living-region.ts for the full story). This
 * self-check exists specifically so that mistake can't repeat silently:
 * it fails loudly if a future phrase or config change doesn't fit.
 *
 * What this CAN verify: geometry (fits every tested viewport, no offscreen
 * clipping, correct word/line structure, left alignment, no overlapping
 * glyphs). What this CANNOT verify: whether the resulting denser patch is
 * visually indistinguishable from the ambient field before interaction --
 * that's a rendering question that needs actual pixels on an actual screen,
 * not a computed assertion. See this file's final section for what's still
 * an open item pending visual review.
 */

import {
  LIVING_REGION_CONFIG,
  deriveLivingRegionRect,
  reserveVerseSlots,
  resolveVerseStratum,
} from "./living-region";
import { buildReservedVerseInput } from "./reserved-verse-bridge";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

const { cellWidth, cellHeight, strata } = LIVING_FIELD_CONFIG;
const { viewport, typography } = LIVING_REGION_CONFIG;

// The REAL KKA-001 verse (see lib/mock-data.ts's mockKuralOfTheDay) --
// duplicated here as a literal, not imported, since this module must never
// depend on app-level mock data (see living-region.ts's header). If the day's
// Kural ever changes, update this literal to match so the self-check keeps
// validating real content, not stale content.
const KKA_001_RAW = "அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு";

const VIEWPORTS = [
  { label: "mobile SE (375x667)", w: 375, h: 667 },
  { label: "mobile (390x844)", w: 390, h: 844 },
  { label: "tablet (768x1024)", w: 768, h: 1024 },
  { label: "desktop (1440x900)", w: 1440, h: 900 },
] as const;

function run(): void {
  const input = buildReservedVerseInput(KKA_001_RAW);

  // --- 1. The real verse parses into exactly the locked 4-word/3-word shape. ---
  assert(input.lines.length === 2, `KKA-001 parses into exactly 2 lines (got ${input.lines.length})`);
  assert(
    input.lines[0]?.length === typography.wordsPerLine[0],
    `line 1 has ${typography.wordsPerLine[0]} words (got ${input.lines[0]?.length})`
  );
  assert(
    input.lines[1]?.length === typography.wordsPerLine[1],
    `line 2 has ${typography.wordsPerLine[1]} words (got ${input.lines[1]?.length})`
  );

  // --- 2. Fits every tested viewport, with no offscreen clipping. ---
  for (const { label, w, h } of VIEWPORTS) {
    const rect = deriveLivingRegionRect(w, h, viewport, typography, cellWidth, cellHeight);
    const { placements, occupiedFootprint } = reserveVerseSlots(rect, input, typography, cellWidth, cellHeight);

    assert(placements.length > 0, `[${label}] produces at least one placement`);
    assert(occupiedFootprint !== null, `[${label}] produces a non-null footprint`);
    if (!occupiedFootprint) continue;

    assert(
      occupiedFootprint.width <= rect.width,
      `[${label}] verse content fits within the available rectangle width ` +
        `(footprint ${occupiedFootprint.width.toFixed(0)}px vs available ${rect.width.toFixed(0)}px)`
    );
    assert(
      occupiedFootprint.left >= 0 && occupiedFootprint.left + occupiedFootprint.width <= w,
      `[${label}] footprint stays within the actual viewport (no offscreen clipping)`
    );
    assert(
      occupiedFootprint.top >= 0 && occupiedFootprint.top + occupiedFootprint.height <= h,
      `[${label}] footprint stays within the actual viewport height`
    );

    // Left alignment: both lines' first glyph must share the same x.
    const line0First = placements.filter((p) => p.lineIndex === 0).sort((a, b) => a.order - b.order)[0];
    const line1First = placements.filter((p) => p.lineIndex === 1).sort((a, b) => a.order - b.order)[0];
    assert(
      line0First.x === line1First.x,
      `[${label}] both lines start at the same x (left-aligned) -- line1 x=${line0First.x}, line2 x=${line1First.x}`
    );

    // No overlapping glyphs within a line (consecutive placements must be at
    // least one intra-word spacing apart).
    const spacing = cellWidth * typography.reservedCellSpacingFactor;
    for (const lineIndex of [0, 1]) {
      const line = placements.filter((p) => p.lineIndex === lineIndex).sort((a, b) => a.order - b.order);
      for (let i = 1; i < line.length; i++) {
        const gap = line[i].x - line[i - 1].x;
        assert(
          gap >= spacing - 0.01,
          `[${label}] line ${lineIndex} has no overlapping glyphs (gap ${gap.toFixed(2)}px, expected >= ${spacing.toFixed(2)}px)`
        );
      }
    }

    console.log(
      `[${label}] OK -- footprint ${occupiedFootprint.width.toFixed(0)}x${occupiedFootprint.height.toFixed(0)}px ` +
        `inside ${rect.width.toFixed(0)}px available, ${placements.length} graphemes placed`
    );
  }

  // --- 3. Determinism: same inputs, same outputs. ---
  const rectA = deriveLivingRegionRect(1440, 900, viewport, typography, cellWidth, cellHeight);
  const resultA = reserveVerseSlots(rectA, input, typography, cellWidth, cellHeight);
  const resultB = reserveVerseSlots(rectA, input, typography, cellWidth, cellHeight);
  assert(
    JSON.stringify(resultA.placements) === JSON.stringify(resultB.placements),
    "reserveVerseSlots is deterministic (same inputs produce identical placements)"
  );

  // --- 4. Stratum resolution. ---
  const verseStratum = resolveVerseStratum(strata, typography);
  assert(verseStratum.id === typography.stratumId, "resolved stratum matches configured stratumId");
  assert(verseStratum.id === "near", 'verse renders at the "near" (shallowest, most legible) stratum');

  let threw = false;
  try {
    resolveVerseStratum(strata, { ...typography, stratumId: "does-not-exist" });
  } catch {
    threw = true;
  }
  assert(threw, "resolveVerseStratum throws on an unknown stratumId rather than silently falling back");

  if (failures === 0) {
    console.log(`\nPASS: all Living Region checks passed (validated against the real KKA-001 verse)`);
    console.log(
      "\nSTILL OPEN, NOT VERIFIABLE HERE: whether the denser patch is visually " +
        "indistinguishable from the ambient field before interaction. That needs an " +
        "actual rendered screenshot once Commit 3 wires up the renderer -- please " +
        "confirm visually before considering this fully done."
    );
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
