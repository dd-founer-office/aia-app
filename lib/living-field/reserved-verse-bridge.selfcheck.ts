/**
 * Reserved Verse Bridge — Self-Check
 * ----------------------------------------------------------------------------
 * Standalone, dependency-free verification script -- same pattern as every
 * self-check in lib/living-field/.
 *
 * Run with `npx tsx lib/living-field/reserved-verse-bridge.selfcheck.ts`.
 *
 * Uses neutral placeholder text, not real KKA-001 content -- same reasoning
 * as living-region.selfcheck.ts: this file has no opinion about any specific
 * poem, and its self-check shouldn't either.
 */

import { buildReservedVerseInput } from "./reserved-verse-bridge";

let failures = 0;
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  }
}

function run(): void {
  // --- 1. Basic two-line, multi-word parsing. ---
  const raw = "அகர முதல எழுத்து\nபகவன் முதல் நூல்";
  const result = buildReservedVerseInput(raw);

  assert(result.lines.length === 2, `parses exactly 2 lines (got ${result.lines.length})`);
  assert(result.lines[0].length === 3, `line 1 has 3 words (got ${result.lines[0].length})`);
  assert(result.lines[1].length === 3, `line 2 has 3 words (got ${result.lines[1].length})`);

  for (const line of result.lines) {
    for (const word of line) {
      assert(word.length > 0, `every word segments into at least one grapheme (got ${JSON.stringify(word)})`);
    }
  }
  console.log("basic two-line parse verified:", JSON.stringify(result));

  // --- 2. Whitespace robustness: extra spaces, blank lines, trailing
  //        whitespace must never produce empty lines or empty words. ---
  const messy = "  அகர   முதல  \n\nபகவன்   முதல்  \n  ";
  const messyResult = buildReservedVerseInput(messy);
  assert(
    messyResult.lines.length === 2,
    `messy input still yields exactly 2 non-empty lines (got ${messyResult.lines.length})`
  );
  assert(
    messyResult.lines[0].length === 2,
    `messy line 1 has 2 words, no empty-string artifacts (got ${messyResult.lines[0].length})`
  );
  assert(
    messyResult.lines[1].length === 2,
    `messy line 2 has 2 words, no empty-string artifacts (got ${messyResult.lines[1].length})`
  );

  // --- 3. Determinism. ---
  const again = buildReservedVerseInput(raw);
  assert(JSON.stringify(result) === JSON.stringify(again), "buildReservedVerseInput is deterministic");

  // --- 4. Grapheme correctness spot-check: a consonant+pulli compound
  //        ("த்") must stay one grapheme, not split into 2 code points. ---
  const compoundWord = buildReservedVerseInput("அறத்தை").lines[0][0];
  assert(
    compoundWord.includes("த்"),
    `consonant+pulli compound "த்" is preserved as one grapheme cluster (got ${JSON.stringify(compoundWord)})`
  );
  assert(
    compoundWord.every((g) => [...g].length <= 2),
    `no grapheme in the result is an unsegmented multi-character run (got ${JSON.stringify(compoundWord)})`
  );

  // --- 5. Empty input. ---
  const empty = buildReservedVerseInput("");
  assert(empty.lines.length === 0, "empty input produces zero lines, not an array with an empty line");

  if (failures === 0) {
    console.log(`\nPASS: all Reserved Verse Bridge checks passed`);
  } else {
    console.error(`\n${failures} check(s) failed`);
    process.exit(1);
  }
}

run();
