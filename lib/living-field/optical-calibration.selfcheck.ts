/**
 * Living Civilization — Optical Weight Calibration Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as the
 * affinity/natural-distribution self-checks, for the same reason (no test
 * framework configured in this repo).
 *
 * Run with `npx tsx lib/living-field/optical-calibration.selfcheck.ts`, or
 * compile with tsc and run the output with node.
 *
 * What this CAN verify: the presets are correctly isolated (each changes
 * only what the spec says it should), the magnitude is in the requested
 * +10-15% band, the full layout pipeline still produces valid scriptId-
 * tagged cells, and rendering-adjacent math doesn't regress performance.
 *
 * What this CANNOT verify (flagged, not skipped): whether Vatteluttu/
 * Tamil-Brahmi actually LOOK more discoverable on a real screen, and
 * whether the field still feels like "a single unified civilization." That
 * needs the founder's eyes on the deployed site, once a calibration is
 * selected via NEXT_PUBLIC_OPTICAL_CALIBRATION and redeployed.
 */

import {
  CALIBRATION_A,
  CALIBRATION_B,
  CALIBRATION_C,
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
  // --- 1. Version A is truly a no-op baseline. ---
  for (const scriptId of SCRIPT_IDS) {
    const w = getScriptWeight(CALIBRATION_A, scriptId);
    assert(w.opacityMultiplier === 1 && w.sizeMultiplier === 1 && !w.fontWeightOverride,
      `Version A leaves "${scriptId}" completely unchanged`);
  }

  // --- 2. Version B changes ONLY Vatteluttu, by +10-15%. ---
  for (const scriptId of SCRIPT_IDS) {
    const w = getScriptWeight(CALIBRATION_B, scriptId);
    if (scriptId === "vatteluttu-21") {
      assert(w.opacityMultiplier >= 1.10 && w.opacityMultiplier <= 1.15,
        `Version B's Vatteluttu opacity increase is within +10-15% (got ${w.opacityMultiplier})`);
      assert(w.sizeMultiplier >= 1.10 && w.sizeMultiplier <= 1.15,
        `Version B's Vatteluttu size increase is within +10-15% (got ${w.sizeMultiplier})`);
    } else {
      assert(w.opacityMultiplier === 1 && w.sizeMultiplier === 1,
        `Version B leaves "${scriptId}" unchanged (spec: only Vatteluttu changes in B)`);
    }
  }

  // --- 3. Version C retains B's Vatteluttu exactly, changes ONLY
  //        Tamil-Brahmi (by +10-15%, plus an allowed font-weight bump),
  //        leaves Modern Tamil untouched. ---
  const bVattel = getScriptWeight(CALIBRATION_B, "vatteluttu-21");
  const cVattel = getScriptWeight(CALIBRATION_C, "vatteluttu-21");
  assert(
    bVattel.opacityMultiplier === cVattel.opacityMultiplier &&
      bVattel.sizeMultiplier === cVattel.sizeMultiplier,
    "Version C retains Version B's Vatteluttu weight exactly"
  );
  const cModern = getScriptWeight(CALIBRATION_C, "modern-tamil-247");
  assert(
    cModern.opacityMultiplier === 1 && cModern.sizeMultiplier === 1 && !cModern.fontWeightOverride,
    "Version C leaves Modern Tamil completely unchanged"
  );
  const cBrahmi = getScriptWeight(CALIBRATION_C, "tamil-brahmi-24");
  assert(cBrahmi.opacityMultiplier >= 1.10 && cBrahmi.opacityMultiplier <= 1.15,
    `Version C's Tamil-Brahmi opacity increase is within +10-15% (got ${cBrahmi.opacityMultiplier})`);
  assert(cBrahmi.sizeMultiplier >= 1.10 && cBrahmi.sizeMultiplier <= 1.15,
    `Version C's Tamil-Brahmi size increase is within +10-15% (got ${cBrahmi.sizeMultiplier})`);

  // --- 4. Pure math sanity: applyOpticalOpacity/Size behave correctly and
  //        clamp safely. ---
  assert(applyOpticalOpacity(0.05, CALIBRATION_A.weights["modern-tamil-247"]) === 0.05,
    "Version A opacity math is a true no-op");
  assert(Math.abs(applyOpticalOpacity(0.05, CALIBRATION_B.weights["vatteluttu-21"]) - 0.05625) < 1e-9,
    "Version B opacity math applies exactly +12.5% to a sample value");
  assert(applyOpticalOpacity(0.9, { opacityMultiplier: 2, sizeMultiplier: 1 }) === 1,
    "opacity clamps to 1.0 even with an extreme multiplier (safety, not used by A/B/C)");
  assert(applyOpticalSize(14, CALIBRATION_C.weights["tamil-brahmi-24"]) === 14 * 1.125,
    "size math applies the expected multiplier");

  // --- 5. Full pipeline still produces valid, scriptId-tagged cells. ---
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

  // --- 6. Performance: the render loop now iterates (stratum x script)
  //        instead of just (stratum) -- confirm layout build itself (which
  //        is what changed structurally, scriptId assignment) is still
  //        fast; render-loop timing itself needs a real canvas, out of
  //        scope for this dependency-free script (same limitation noted in
  //        prior self-checks). ---
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

  // --- Report the three presets' numbers plainly, for the engineering report. ---
  for (const cal of [CALIBRATION_A, CALIBRATION_B, CALIBRATION_C]) {
    console.log(`\nVersion ${cal.id} (${cal.label}):`);
    for (const scriptId of SCRIPT_IDS) {
      const w = getScriptWeight(cal, scriptId);
      console.log(
        `  ${scriptId}: opacity x${w.opacityMultiplier}, size x${w.sizeMultiplier}` +
          (w.fontWeightOverride ? `, fontWeight ${w.fontWeightOverride}` : "")
      );
    }
  }

  if (failures === 0) {
    console.log(`\nPASS: all optical calibration checks passed (${layout.cells.length} cells checked)`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
