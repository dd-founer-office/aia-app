/**
 * Living Region Bridge — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/ (see ambient-language.selfcheck.ts, which
 * this closely mirrors since both are thin bridges over
 * getActiveLivingFieldEngine()).
 *
 * Run with `npx tsx lib/living-field/living-region-bridge.selfcheck.ts`.
 */

import { reportLivingRegionEvent, setLivingRegionVerse } from "./living-region-bridge";
import { setActiveLivingFieldEngine } from "./engine-registry";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- 1. No engine mounted -- both functions must be silent no-ops. ---
  setActiveLivingFieldEngine(null);
  let threw = false;
  try {
    reportLivingRegionEvent("pointerDown");
    setLivingRegionVerse(null);
  } catch {
    threw = true;
  }
  assert(!threw, "both functions are silent no-ops when no engine is mounted");

  // --- 2. An engine IS mounted -- calls forward exactly, with no extra logic. ---
  const calls: string[] = [];
  const fakeEngine = {
    reportLivingRegionEvent: (event: string) => calls.push(`event:${event}`),
    setReservedVerse: (input: unknown) => calls.push(`verse:${input === null ? "null" : "set"}`),
  } as unknown as Parameters<typeof setActiveLivingFieldEngine>[0];
  setActiveLivingFieldEngine(fakeEngine);

  reportLivingRegionEvent("pointerDown");
  reportLivingRegionEvent("pointerUp");
  reportLivingRegionEvent("cancel");
  reportLivingRegionEvent("dismiss");
  setLivingRegionVerse(null);
  setLivingRegionVerse({ lines: [] });

  assert(
    JSON.stringify(calls) ===
      JSON.stringify([
        "event:pointerDown",
        "event:pointerUp",
        "event:cancel",
        "event:dismiss",
        "verse:null",
        "verse:set",
      ]),
    `every call forwards exactly once, in order, with no added logic (got ${JSON.stringify(calls)})`
  );

  setActiveLivingFieldEngine(null);

  if (failures === 0) {
    console.log(`\nPASS: all Living Region Bridge checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
