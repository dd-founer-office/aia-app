/**
 * Purananuru — Automated Quality Checks
 * ----------------------------------------------------------------------------
 * Purananuru counterpart to aathichoodi/quality-check.ts. Same non-blocking
 * "surface warnings, let a human decide" contract — findings are shown to
 * the user, never used to silently reject a composed poem.
 *
 * The `verified` and NEEDS_SOURCING checks below are the load-bearing ones
 * for this dataset: see canon.ts's own header for why every entry still
 * ships as verified: false even after Phase 2's much deeper source
 * verification, and why poem 139's tamilText is still partly a placeholder
 * rather than invented verse. Do not relax either check just to make the
 * initial 3-poem set warning-free — the warnings are correct.
 */

import { getCanonEntry } from "./canon";
import type { ComposedPoem } from "./content-engine";

export interface QualityCheckResult {
  passed: boolean;
  warnings: string[];
}

const PLACEHOLDER_MARKER = "NEEDS_SOURCING";

export function runQualityChecks(poem: ComposedPoem): QualityCheckResult {
  const warnings: string[] = [];

  const canonEntry = getCanonEntry(poem.poemNumber);
  if (!canonEntry) {
    warnings.push(`Poem ${poem.poemNumber} is not in the preloaded Purananuru canon.`);
  } else if (canonEntry.tamilText !== poem.tamilText) {
    warnings.push("Tamil text does not match the canonical dataset — this should never happen; do not publish.");
  }

  if (poem.tamilText.includes(PLACEHOLDER_MARKER)) {
    warnings.push(
      `Poem ${poem.poemNumber}'s Tamil text is a sourcing placeholder, not the real verse — do not publish this asset.`
    );
  } else if (!poem.verified) {
    warnings.push(
      `Poem ${poem.poemNumber} is flagged unverified — confirm tamilText, poet, and poem number against sourceUrl before publishing.`
    );
  }

  if (!poem.simpleMeaning.trim()) {
    warnings.push("Simple meaning is empty.");
  }
  if (!poem.hook.trim()) {
    warnings.push("Hook is empty.");
  }
  if (!poem.visualStoryDirection.trim()) {
    warnings.push("Visual/story direction is empty.");
  }
  if (!poem.sourceUrl.trim()) {
    warnings.push("No source URL recorded for this poem — provenance cannot be checked.");
  }

  return { passed: warnings.length === 0, warnings };
}
