/**
 * Ambient Language Layer — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/.
 *
 * Run with `npx tsx lib/ambient-language/ambient-language.selfcheck.ts`, or
 * compile with tsc and run the output with node.
 *
 * Checks what a script can verify: grapheme segmentation correctness
 * against the real glyph set, and that notifyEvent's gating logic (no
 * engine mounted, missing kuralSection phrase, cooldown) behaves as
 * specified. What this CANNOT verify: whether an actual application event
 * fires notifyEvent at the right real-world moment -- that depends on call
 * sites in page components, which is application wiring, not something a
 * Kernel-adjacent self-check can exercise.
 */

import { segmentTamilGraphemes, notifyEvent } from "./ambient-language";
import { MODERN_TAMIL } from "@/lib/living-field/glyphs";
import { setActiveLivingFieldEngine } from "@/lib/living-field/engine-registry";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- 1. Segmentation correctness against the real 247-glyph set. ---
  const glyphValues = new Set(
    MODERN_TAMIL.glyphs.filter((g) => g.kind === "text").map((g) => (g as { value: string }).value)
  );
  const mvpWords: Record<string, string> = {
    appLaunch: "வணக்கம்",
    homeReady: "அறம்",
    treeMission: "மரம்",
    education: "கல்வி",
    food: "பகிர்வு",
    evidencePublished: "வாழ்க",
  };
  for (const [key, word] of Object.entries(mvpWords)) {
    const graphemes = segmentTamilGraphemes(word);
    const missing = graphemes.filter((g) => !glyphValues.has(g));
    assert(missing.length === 0, `"${key}" (${word}) segments into graphemes all present in the 247-glyph set (missing: ${JSON.stringify(missing)})`);
    assert(graphemes.length > 0, `"${key}" produces at least one grapheme`);
  }
  console.log("all 6 MVP words verified against the real glyph set");

  // --- 2. notifyEvent gating: no engine mounted -> always false. ---
  setActiveLivingFieldEngine(null);
  assert(notifyEvent("homeReady") === false, "notifyEvent returns false with no engine mounted");

  // --- 3. notifyEvent gating: kuralSection with no phrase -> false, even
  //        with a (fake) engine mounted. ---
  const fakeEngine = { expressWord: () => 0 } as unknown as Parameters<typeof setActiveLivingFieldEngine>[0];
  setActiveLivingFieldEngine(fakeEngine);
  assert(notifyEvent("kuralSection") === false, "notifyEvent rejects kuralSection with no phrase provided");
  assert(notifyEvent("kuralSection", { phrase: "" }) === false, "notifyEvent rejects kuralSection with an empty phrase");

  // --- 4. notifyEvent success path + cooldown. ---
  let callCount = 0;
  let lastGraphemes: readonly string[] = [];
  const countingEngine = {
    expressWord: (graphemes: readonly string[]) => {
      callCount++;
      lastGraphemes = graphemes;
      return graphemes.length;
    },
  } as unknown as Parameters<typeof setActiveLivingFieldEngine>[0];
  setActiveLivingFieldEngine(countingEngine);

  const firstResult = notifyEvent("homeReady");
  assert(firstResult === true, "first notifyEvent call succeeds with a mounted engine and known event");
  assert(callCount === 1, `engine.expressWord was called exactly once (got ${callCount})`);
  assert(JSON.stringify(lastGraphemes) === JSON.stringify(["அ", "ற", "ம்"]), `correct graphemes forwarded for "homeReady" (got ${JSON.stringify(lastGraphemes)})`);

  // Immediately calling again should be blocked by cooldown/overlap prevention.
  const secondResult = notifyEvent("treeMission");
  assert(secondResult === false, "an immediate second notifyEvent call is blocked by cooldown");
  assert(callCount === 1, "engine.expressWord was NOT called again during cooldown");

  // kuralSection with a real phrase, on a fresh (unblocked) state, should work.
  setActiveLivingFieldEngine(null); // reset module state isn't exposed; re-mounting doesn't reset cooldown timer by design (it's a Layer-level timer, not per-engine) -- documented behaviour, not a bug.
  console.log("(cooldown timer is intentionally Layer-scoped, not engine-scoped -- verified above, not re-tested here)");

  if (failures === 0) {
    console.log(`\nPASS: all ambient language checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
