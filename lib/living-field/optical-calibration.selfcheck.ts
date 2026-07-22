/**
 * Living Civilization v1.1 — Optical Calibration Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as the
 * affinity/natural-distribution self-checks, for the same reason (no test
 * framework configured in this repo).
 *
 * Run with `npx tsx lib/living-field/optical-calibration.selfcheck.ts`, or
 * compile with tsc and run the output with node.
 *
 * Post-lock version: the original evaluation script tested isolation
 * between presets A/B/C, which no longer exist -- that comparison logic
 * has been removed along with the presets themselves. This version verifies
 * the single locked calibration's values are correct and stable, and that
 * the full pipeline still produces valid, scriptId-tagged cells.
 *
 * What this CANNOT verify: whether the locked calibration still looks
 * right on a real screen. That was already confirmed via founder live
 * review before locking; this script is a regression guard for future
 * changes, not a re-review of the visual decision.
 */

import {
  LIVING_CIVILIZATION_V1_1,
  ACTIVE_CALIBRATION,
  SCRIPT_IDS,
  getScriptWeight,
  applyOpticalOpacity,
  applyOpticalSize,
} from "./optical-calibration";
import { buildFieldLayout } from "./field-layout";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- 1. The active calibration IS the locked v1.1 profile -- no
  //        environment variable, no alternate path. ---
  assert(ACTIVE_CALIBRATION === LIVING_CIVILIZATION_V1_1,
    "ACTIVE_CALIBRATION is always the locked v1.1 profile");

  // --- 2. Locked values are exactly what founder review selected
  //        (Version C from the evaluation phase). ---
  const modern = getScriptWeight(LIVING_CIVILIZATION_V1_1, "modern-tamil-247");
  assert(modern.opacityMultiplier === 1 && modern.sizeMultiplier === 1 && !modern.fontWeightOverride,
    "Modern Tamil remains unchanged in the locked calibration");

  const brahmi = getScriptWeight(LIVING_CIVILIZATION_V1_1, "tamil-brahmi-24");
  assert(brahmi.opacityMultiplier === 1.125 && brahmi.sizeMultiplier === 1.125,
    `Tamil-Brahmi is locked at +12.5% opacity/size (got opacity x${brahmi.opacityMultiplier}, size x${brahmi.sizeMultiplier})`);
  assert(brahmi.fontWeightOverride === 500,
    `Tamil-Brahmi is locked at font-weight 500 (got ${brahmi.fontWeightOverride})`);

  const vattel = getScriptWeight(LIVING_CIVILIZATION_V1_1, "vatteluttu-21");
  assert(vattel.opacityMultiplier === 1.125 && vattel.sizeMultiplier === 1.125,
    `Vatteluttu is locked at +12.5% opacity/size (got opacity x${vattel.opacityMultiplier}, size x${vattel.sizeMultiplier})`);
  assert(!vattel.fontWeightOverride,
    "Vatteluttu has no font-weight override (it's a path glyph, not text)");

  // --- 3. Pure math sanity, against the locked values. ---
  assert(Math.abs(applyOpticalOpacity(0.05, vattel) - 0.05625) < 1e-9,
    "opacity math applies the locked +12.5% correctly to a sample value");
  assert(applyOpticalOpacity(0.9, { opacityMultiplier: 2, sizeMultiplier: 1 }) === 1,
    "opacity clamps to 1.0 with an extreme multiplier (safety, not used by the locked profile)");
  assert(applyOpticalSize(14, brahmi) === 14 * 1.125,
    "size math applies the locked multiplier correctly");

  // --- 4. Full pipeline still produces valid, scriptId-tagged cells. ---
  const layout = buildFieldLayout(1920, 4000, LIVING_FIELD_CONFIG);
  let missingScriptId = 0;
  let unknownScriptId = 0;
  const knownIds = new Set(SCRIPT_IDS);
  for (const cell of layout.cells) {
    if (!cell.scriptId) missingScriptId++;
    else if (!knownIds.has(cell.scriptId as (typeof SCRIPT_IDS)[number])) unknownScriptId++;
  }
  assert(missingScriptId === 0, `every cell has a scriptId (${missingScriptId} missing)`);
  assert(unknownScriptId === 0, `every scriptId is one of the three registered scripts (${unknownScriptId} unrecognised)`);

  // --- 5. Performance: unchanged pipeline structure, just confirming no
  //        regression from removing the preset-selection indirection. ---
  function timeFor(width: number, height: number, repeats = 5): { n: number; ms: number } {
    let best = Infinity;
    let n = 0;
    for (let i = 0; i < repeats; i++) {
      const start = process.hrtime.bigint();
      const l = buildFieldLayout(width, height, LIVING_FIELD_CONFIG);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      n = l.cells.length;
      if (elapsedMs < best) best = elapsedMs;
    }
    return { n, ms: best };
  }
  const small = timeFor(1000, 1000);
  const large = timeFor(4000, 4000);
  const cellRatio = large.n / Math.max(small.n, 1);
  const timeRatio = large.ms / Math.max(small.ms, 0.001);
  console.log(
    `layout build perf: small n=${small.n} (${small.ms.toFixed(3)}ms), large n=${large.n} (${large.ms.toFixed(3)}ms), ` +
      `cell ratio=${cellRatio.toFixed(1)}x, time ratio=${timeRatio.toFixed(1)}x`
  );
  assert(timeRatio < cellRatio * 3, "layout build scaling still roughly linear");

  console.log("\nLocked calibration (Living Civilization v1.1):");
  for (const scriptId of SCRIPT_IDS) {
    const w = getScriptWeight(LIVING_CIVILIZATION_V1_1, scriptId);
    console.log(
      `  ${scriptId}: opacity x${w.opacityMultiplier}, size x${w.sizeMultiplier}` +
        (w.fontWeightOverride ? `, fontWeight ${w.fontWeightOverride}` : "")
    );
  }

  if (failures === 0) {
    console.log(`\nPASS: all locked-calibration checks passed (${layout.cells.length} cells checked)`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
