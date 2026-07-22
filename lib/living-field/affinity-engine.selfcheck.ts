/**
 * Living Field — Affinity Engine Self-Check
 * ----------------------------------------------------------------------------
 * Build Sprint 03A. Standalone, dependency-free verification script.
 *
 * No test framework (Jest/Vitest/etc.) was previously configured in this
 * project, so rather than introduce one unannounced, this is a plain
 * assertion script: run it with `npx tsx lib/living-field/affinity-engine.selfcheck.ts`
 * (or compile with tsc and run the output with node). It exits non-zero and
 * prints the failing assertion if anything is wrong; otherwise prints a
 * short PASS summary. If the team adopts a real test runner later, these
 * assertions translate directly into `it(...)` blocks with no logic changes.
 *
 * Checks the sprint's own Testing Checklist:
 *   Functional: every glyph has affinity; one neighborhood each; density
 *   normalised; breathing offsets assigned.
 *   Performance: cost scales roughly linearly with cell count, not O(n^2).
 *   Determinism: neighborhoodId / localDensity / affinityStrength are
 *   identical across repeated runs on the same positions (breathingOffset's
 *   jitter component is explicitly excluded from this check — the spec
 *   sanctions it as a small intentional random tie-breaker).
 */

import { buildFieldLayout } from "./field-layout";
import { applyAffinity } from "./affinity-engine";
import { LIVING_FIELD_CONFIG } from "./config";

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- Functional checks ---
  const layout = buildFieldLayout(1920, 4000, LIVING_FIELD_CONFIG);
  applyAffinity(layout.cells);

  assert(layout.cells.length > 0, "layout produced at least one cell");

  let missingAffinity = 0;
  let badDensity = 0;
  let badStrength = 0;
  let badOffset = 0;
  const neighborhoodSizes = new Map<string, number>();

  for (const cell of layout.cells) {
    if (!cell.affinity) {
      missingAffinity++;
      continue;
    }
    const { neighborhoodId, localDensity, affinityStrength, breathingOffset } = cell.affinity;

    if (localDensity < 0 || localDensity > 1 || Number.isNaN(localDensity)) badDensity++;
    if (affinityStrength < 0 || affinityStrength > 1 || Number.isNaN(affinityStrength)) badStrength++;
    if (!Number.isFinite(breathingOffset)) badOffset++;

    neighborhoodSizes.set(neighborhoodId, (neighborhoodSizes.get(neighborhoodId) ?? 0) + 1);
  }

  assert(missingAffinity === 0, `every cell has affinity metadata (${missingAffinity} missing)`);
  assert(badDensity === 0, `all localDensity values in [0,1] (${badDensity} out of range)`);
  assert(badStrength === 0, `all affinityStrength values in [0,1] (${badStrength} out of range)`);
  assert(badOffset === 0, `all breathingOffset values finite (${badOffset} non-finite)`);

  const sizes = [...neighborhoodSizes.values()];
  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
  console.log(
    `neighborhoods: ${sizes.length}, avg size: ${avgSize.toFixed(1)} ` +
      `(spec guideline: 8-20; interior-bucket average, edge buckets run smaller)`
  );

  // --- Determinism checks (excluding the sanctioned random jitter) ---
  const layoutA = buildFieldLayout(1200, 2000, LIVING_FIELD_CONFIG);
  const layoutB: typeof layoutA = { width: layoutA.width, height: layoutA.height, cells: layoutA.cells.map((c) => ({ ...c })) };
  applyAffinity(layoutA.cells);
  applyAffinity(layoutB.cells);

  let mismatchedNeighborhood = 0;
  let mismatchedDensity = 0;
  let mismatchedStrength = 0;
  for (let i = 0; i < layoutA.cells.length; i++) {
    const a = layoutA.cells[i].affinity!;
    const b = layoutB.cells[i].affinity!;
    if (a.neighborhoodId !== b.neighborhoodId) mismatchedNeighborhood++;
    if (Math.abs(a.localDensity - b.localDensity) > 1e-9) mismatchedDensity++;
    if (Math.abs(a.affinityStrength - b.affinityStrength) > 1e-9) mismatchedStrength++;
  }
  assert(mismatchedNeighborhood === 0, `neighborhoodId is deterministic (${mismatchedNeighborhood} mismatches)`);
  assert(mismatchedDensity === 0, `localDensity is deterministic (${mismatchedDensity} mismatches)`);
  assert(mismatchedStrength === 0, `affinityStrength is deterministic (${mismatchedStrength} mismatches)`);

  // --- Performance: rough linearity check, not O(n^2) ---
  // Date.now() is too coarse for the small case (sub-millisecond); use
  // process.hrtime.bigint() and take the min of several runs to cancel out
  // scheduling noise, which a single-sample millisecond timer can't.
  function timeFor(width: number, height: number, repeats = 5): { n: number; ms: number } {
    const l = buildFieldLayout(width, height, LIVING_FIELD_CONFIG);
    let best = Infinity;
    for (let i = 0; i < repeats; i++) {
      const cellsCopy = l.cells.map((c) => ({ ...c }));
      const start = process.hrtime.bigint();
      applyAffinity(cellsCopy);
      const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      if (elapsedMs < best) best = elapsedMs;
    }
    return { n: l.cells.length, ms: best };
  }

  const small = timeFor(1000, 1000);
  const large = timeFor(4000, 4000); // ~16x the area -> ~16x the cells

  const cellRatio = large.n / Math.max(small.n, 1);
  const timeRatio = large.ms / Math.max(small.ms, 0.001); // floor avoids div-by-zero on a true 0ms best-of-5

  console.log(
    `perf: small n=${small.n} (${small.ms.toFixed(3)}ms best-of-5), ` +
      `large n=${large.n} (${large.ms.toFixed(3)}ms best-of-5), ` +
      `cell ratio=${cellRatio.toFixed(1)}x, time ratio=${timeRatio.toFixed(1)}x`
  );
  // O(n^2) growth would show timeRatio near cellRatio^2 (~230x here). Allow
  // headroom (3x cellRatio, ~46x) for constant-factor overhead and measurement
  // slack while still clearly failing a true quadratic blowup.
  assert(
    timeRatio < cellRatio * 3,
    `scaling looks roughly linear, not quadratic (time ratio ${timeRatio.toFixed(1)}x vs cell ratio ${cellRatio.toFixed(1)}x)`
  );

  if (failures === 0) {
    console.log(`PASS: all affinity engine checks passed (${layout.cells.length} cells checked)`);
  } else {
    console.error(`${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
