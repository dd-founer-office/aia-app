/**
 * Living Kernel — Ambient Expression Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * prior self-check in this repo.
 *
 * Run with `npx tsx lib/living-field/ambient-expression.selfcheck.ts`, or
 * compile with tsc and run the output with node.
 */

import { buildFieldLayout } from "./field-layout";
import { LIVING_FIELD_CONFIG } from "./config";
import {
  applyAmbientExpression,
  expressionEnvelope01,
  computeExpressionOpacityMultiplier,
  isExpressionActive,
  EXPRESSION_TOTAL_DURATION_MS,
} from "./ambient-expression";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- 1. Envelope shape: 0 before start, rises, holds at 1, falls, back
  //        to 0. Verified numerically at fixed points against the known
  //        rise/hold/fall constants (3000/4000/4000). ---
  assert(expressionEnvelope01(-100) === 0, "envelope is 0 before start");
  assert(expressionEnvelope01(0) === 0, "envelope is 0 at exact start");
  assert(expressionEnvelope01(1500) > 0 && expressionEnvelope01(1500) < 1, "envelope is mid-rise partway through rise");
  assert(expressionEnvelope01(3000) === 1, "envelope reaches 1 exactly at end of rise");
  assert(expressionEnvelope01(5000) === 1, "envelope holds at 1 mid-hold");
  assert(expressionEnvelope01(6999) === 1, "envelope still 1 at very end of hold");
  assert(expressionEnvelope01(7001) < 1 && expressionEnvelope01(7001) > 0, "envelope is mid-fall just after hold ends");
  assert(expressionEnvelope01(11000) === 0, "envelope reaches 0 exactly at total duration");
  assert(expressionEnvelope01(20000) === 0, "envelope stays 0 well after total duration");
  assert(EXPRESSION_TOTAL_DURATION_MS === 11000, `total duration is rise+hold+fall (got ${EXPRESSION_TOTAL_DURATION_MS})`);

  let prevRise = -1;
  let risesMonotonically = true;
  for (let ms = 0; ms <= 3000; ms += 100) {
    const v = expressionEnvelope01(ms);
    if (v < prevRise) risesMonotonically = false;
    prevRise = v;
  }
  assert(risesMonotonically, "envelope rises monotonically during the rise phase");

  let prevFall = 2;
  let fallsMonotonically = true;
  for (let ms = 7000; ms <= 11000; ms += 100) {
    const v = expressionEnvelope01(ms);
    if (v > prevFall) fallsMonotonically = false;
    prevFall = v;
  }
  assert(fallsMonotonically, "envelope falls monotonically during the fall phase");

  // --- 2. isExpressionActive matches the envelope's own active window. ---
  assert(isExpressionActive(1000, 1000) === true, "active at the exact start time");
  assert(isExpressionActive(1000, 1000 + 11000) === false, "inactive exactly at total duration");
  assert(isExpressionActive(1000, 500) === false, "inactive before start (elapsed negative)");

  // --- 3. computeExpressionOpacityMultiplier: exactly 1 with no
  //        expression, >1 during an active one, back to 1 once expired. ---
  assert(computeExpressionOpacityMultiplier(undefined, 12345) === 1, "multiplier is exactly 1 with no expression at all");
  const midHold = computeExpressionOpacityMultiplier({ startTime: 0 }, 5000);
  assert(midHold > 1, `multiplier is >1 during hold (got ${midHold})`);
  const expired = computeExpressionOpacityMultiplier({ startTime: 0 }, 999999);
  assert(expired === 1, `multiplier returns to exactly 1 once fully expired (got ${expired})`);

  // --- 4. applyAmbientExpression: matches real cells against real
  //        graphemes on a real layout, and only those cells. ---
  const layout = buildFieldLayout(1920, 4000, LIVING_FIELD_CONFIG);
  const targetGraphemes = ["அ", "ற", "ம்"]; // அறம் ("home")
  const startTime = 123456;
  const matchedCount = applyAmbientExpression(layout.cells, targetGraphemes, startTime);

  let cellsWithExpression = 0;
  let mismatchedExpression = 0;
  for (const cell of layout.cells) {
    if (cell.expression) {
      cellsWithExpression++;
      const isRealMatch = cell.glyph.kind === "text" && targetGraphemes.includes(cell.glyph.value);
      if (!isRealMatch) mismatchedExpression++;
      if (cell.expression.startTime !== startTime) mismatchedExpression++;
    }
  }
  assert(cellsWithExpression === matchedCount, "applyAmbientExpression's return count matches actual tagged cells");
  assert(mismatchedExpression === 0, `every expression-tagged cell is a real grapheme match with the correct startTime (${mismatchedExpression} wrong)`);
  console.log(
    `matched ${matchedCount} cells out of ${layout.cells.length} total for graphemes ${JSON.stringify(targetGraphemes)} ` +
      `(best-effort matching -- 0 matches would also be valid on an unlucky layout)`
  );

  // --- 5. Empty grapheme list matches nothing, throws nothing. ---
  const layout2 = buildFieldLayout(800, 800, LIVING_FIELD_CONFIG);
  const emptyMatch = applyAmbientExpression(layout2.cells, [], 0);
  assert(emptyMatch === 0, "empty grapheme list matches zero cells");

  if (failures === 0) {
    console.log(`\nPASS: all ambient expression checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
