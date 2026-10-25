/**
 * Weekly Aathichoodi Copy Draft
 * ----------------------------------------------------------------------------
 * Standalone generator: runs the REAL, deterministic content engine
 * (lib/kural-publishing/aathichoodi/content-engine.ts) for a run of
 * consecutive episodes and prints the resulting slide copy + caption for
 * human review. No LLM call, no invented content -- this is the exact
 * same composeEpisode() the live Asset Generator UI calls, just driven
 * headlessly so a week's worth of episodes can be drafted in one pass
 * instead of one "Generate Next Episode" click at a time.
 *
 * History (anti-repetition pools) is threaded from episode 1 through to
 * just before the requested start episode, then discarded -- so the
 * requested range's pool selections reflect what a real sequential
 * run-through from episode 1 would have left behind, same as the live
 * UI's own localStorage-backed history.
 *
 * This script never writes to canon.ts or any other content file. Its
 * only output is the console draft below -- turning any of it into
 * approved, curated episode content is a separate, deliberate edit to
 * canon.ts after a human has reviewed it here.
 *
 * Usage:
 *   npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]
 *   npx tsx scripts/weekly-aathichoodi-copy.ts 39        # defaults to 7
 *   npx tsx scripts/weekly-aathichoodi-copy.ts 39 5
 */

import { composeEpisode } from "../lib/kural-publishing/aathichoodi/content-engine";
import { EMPTY_HISTORY, type SeriesHistory } from "../lib/kural-publishing/aathichoodi/history-store";
import { generateCaption } from "../lib/kural-publishing/aathichoodi/caption";
import { TOTAL_EPISODES } from "../lib/kural-publishing/aathichoodi/canon";

function parseArgs(): { start: number; count: number } {
  const [startArg, countArg] = process.argv.slice(2);
  const start = Number(startArg);
  const count = countArg ? Number(countArg) : 7;
  if (!Number.isInteger(start) || start < 1) {
    console.error("Usage: npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]");
    console.error(`  startEpisode must be a positive integer (canon has ${TOTAL_EPISODES} episodes).`);
    process.exit(1);
  }
  if (!Number.isInteger(count) || count < 1) {
    console.error("count must be a positive integer.");
    process.exit(1);
  }
  return { start, count };
}

function buildHistoryUpTo(startEpisode: number): SeriesHistory {
  let history: SeriesHistory = EMPTY_HISTORY;
  for (let ep = 1; ep < startEpisode; ep++) {
    const result = composeEpisode(ep, history);
    if (!result) continue; // episode number not in canon -- just skip, nothing to thread
    history = result.nextHistory;
  }
  return history;
}

function main(): void {
  const { start, count } = parseArgs();
  let history = buildHistoryUpTo(start);

  for (let i = 0; i < count; i++) {
    const epNum = start + i;
    const result = composeEpisode(epNum, history);
    if (!result) {
      console.log(`\n=== Episode ${epNum}: NO CANON ENTRY (canon has ${TOTAL_EPISODES} episodes) ===`);
      continue;
    }
    const { episode, nextHistory } = result;
    history = nextHistory;

    console.log(`\n${"=".repeat(70)}`);
    console.log(`EPISODE ${episode.episodeNumber} -- ${episode.tamilText} (${episode.transliteration})`);
    console.log(`Theme: ${episode.themeLabel} | Verified: ${episode.verified} | Format: ${episode.recommendedFormat}`);
    console.log(`Meaning: ${episode.simpleMeaning}`);
    console.log(`${"-".repeat(70)}`);
    console.log(`SLIDE 1 (STOP)`);
    console.log(`  Hook: ${episode.hook}`);
    console.log(`  Tagline: ${episode.tagline}`);
    console.log(`SLIDE 2 (UNDERSTAND)`);
    console.log(`  ${episode.understanding}`);
    console.log(`SLIDE 3 (SEE IT IN FAMILY LIFE)`);
    console.log(`  ${episode.familyAngle}`);
    console.log(`SLIDE 4 (PRACTICE TODAY)`);
    console.log(`  Action: ${episode.todayAction}`);
    console.log(`  Child lesson: ${episode.childLesson}`);
    console.log(`SLIDE 5 (CARRY IT FORWARD)`);
    console.log(`  AiA connection: ${episode.aiaConnection}`);
    console.log(`  CTA: [${episode.cta.type}] ${episode.cta.copy}`);
    console.log(`${"-".repeat(70)}`);
    console.log(`CAPTION:`);
    console.log(generateCaption(episode));
  }
}

main();
