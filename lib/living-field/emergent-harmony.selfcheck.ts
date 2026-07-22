/**
 * Living Field — Emergent Harmony Self-Check
 * ----------------------------------------------------------------------------
 * Build Sprint 03C. Standalone, dependency-free verification script -- same
 * pattern as every prior self-check in this repo (no test framework
 * configured).
 *
 * Run with `npx tsx lib/living-field/emergent-harmony.selfcheck.ts`, or
 * compile with tsc and run the output with node.
 *
 * Checks what a script can verify:
 *   - Every cell with affinity gets valid, bounded harmony metadata.
 *   - Fully deterministic (unlike affinity's sanctioned breathing jitter,
 *     harmony has NO random component at all -- same input must give
 *     bit-identical output, always).
 *   - Spatially smooth, not blocky: neighbouring cells' amplitudeInfluence
 *     values are close to each other, ruling out the kind of hard
 *     boundary that could read as a "pattern."
 *   - No performance regression from adding this pass.
 *
 * What this CANNOT verify: whether the founder's actual acceptance test
 * passes -- "does the application feel more alive without being able to
 * explain why?" That is explicitly a subjective, multi-minute, real-screen
 * judgment call, not something any script can determine.
 */

import { buildFieldLayout } from "./field-layout";
import { applyAffinity } from "./affinity-engine";
import { applyEmergentHarmony, computeAmplitudeInfluence } from "./emergent-harmony";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  const layout = buildFieldLayout(1920, 4000, LIVING_FIELD_CONFIG);
  applyAffinity(layout.cells);
  applyEmergentHarmony(layout.cells);

  // --- 1. Every cell with affinity has valid, bounded harmony. ---
  let missingHarmony = 0;
  let outOfBounds = 0;
  const SPREAD = 0.08; // must match emergent-harmony.ts's AMPLITUDE_SPREAD
  for (const cell of layout.cells) {
    if (!cell.affinity) continue; // can't have harmony without affinity, by design
    if (!cell.harmony) {
      missingHarmony++;
      continue;
    }
    const v = cell.harmony.amplitudeInfluence;
    if (v < 1 - SPREAD - 1e-9 || v > 1 + SPREAD + 1e-9) outOfBounds++;
  }
  assert(missingHarmony === 0, `every cell with affinity has harmony metadata (${missingHarmony} missing)`);
  assert(outOfBounds === 0, `every amplitudeInfluence is within [1-${SPREAD}, 1+${SPREAD}] (${outOfBounds} out of bounds)`);

  // --- 2. Fully deterministic: pure function, zero randomness. ---
  let nondeterministic = 0;
  for (const cell of layout.cells) {
    if (!cell.affinity) continue;
    const a = computeAmplitudeInfluence(cell.affinity.localDensity, cell.affinity.affinityStrength);
    const b = computeAmplitudeInfluence(cell.affinity.localDensity, cell.affinity.affinityStrength);
    if (a !== b) nondeterministic++;
  }
  assert(nondeterministic === 0, `computeAmplitudeInfluence is a pure function (${nondeterministic} mismatches across repeat calls)`);

  // --- 3. Spatially smooth: nearby cells shouldn't jump discontinuously.
  //        Compare each cell to its nearest neighbour (by simple bounded
  //        scan) and confirm the typical difference is small relative to
  //        the total possible spread. ---
  const sample = layout.cells.filter((c) => c.harmony).slice(0, 400);
  let diffSum = 0;
  let pairs = 0;
  for (let i = 0; i < sample.length; i++) {
    let bestDist = Infinity;
    let bestJ = -1;
    for (let j = 0; j < sample.length; j++) {
      if (i === j) continue;
      const dx = sample[i].x - sample[j].x;
      const dy = sample[i].y - sample[j].y;
      const d = dx * dx + dy * dy;
      if (d < bestDist) {
        bestDist = d;
        bestJ = j;
      }
    }
    if (bestJ >= 0) {
      diffSum += Math.abs(sample[i].harmony!.amplitudeInfluence - sample[bestJ].harmony!.amplitudeInfluence);
      pairs++;
    }
  }
  const avgNeighborDiff = diffSum / pairs;
  console.log(
    `spatial smoothness: avg |amplitudeInfluence diff| between nearest-neighbour cells = ${avgNeighborDiff.toFixed(4)} ` +
      `(max possible spread = ${(2 * SPREAD).toFixed(2)})`
  );
  // Nearest neighbours should differ by only a small fraction of the total
  // possible spread -- a hard block boundary would show much larger jumps.
  assert(
    avgNeighborDiff < SPREAD * 0.5,
    `nearest-neighbour cells vary smoothly, not in hard blocks (avg diff ${avgNeighborDiff.toFixed(4)} vs threshold ${(SPREAD * 0.5).toFixed(4)})`
  );

  // --- 4. Performance: negligible added cost. ---
  function timeFor(width: number, height: number, repeats = 5): { n: number; ms: number } {
    let best = Infinity;
    let n = 0;
    for (let i = 0; i < repeats; i++) {
      const l = buildFieldLayout(width, height, LIVING_FIELD_CONFIG);
      applyAffinity(l.cells);
      const start = process.hrtime.bigint();
      applyEmergentHarmony(l.cells);
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
    `harmony pass perf: small n=${small.n} (${small.ms.toFixed(3)}ms), large n=${large.n} (${large.ms.toFixed(3)}ms), ` +
      `cell ratio=${cellRatio.toFixed(1)}x, time ratio=${timeRatio.toFixed(1)}x`
  );
  assert(timeRatio < cellRatio * 3, "harmony pass scales roughly linearly, not worse");

  if (failures === 0) {
    console.log(`\nPASS: all emergent harmony checks passed (${layout.cells.length} cells checked)`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
