#!/usr/bin/env -S npx tsx
/**
 * Daily Aathichoodi Series — Weekly Copy Draft Generator
 * ----------------------------------------------------------------------------
 * Composes N consecutive episodes (default 7) through the exact same
 * deterministic composeEpisode() pipeline the Asset Generator UI uses --
 * nothing here invents new copy. Every line is either a curated, hand-
 * authored field from canon.ts, or one pool entry selected by the same
 * anti-repetition selector (pickFresh, see selection.ts) the app itself
 * calls. This script exists only to batch that same pipeline and print the
 * result as a reviewable document, since the in-browser UI composes one
 * episode at a time.
 *
 * KNOWN LIMITATION: the in-browser anti-repetition history lives in
 * localStorage, which this standalone script has no access to. Each run
 * starts from an empty history and rebuilds it episode-by-episode across
 * this batch only -- so repeats are still avoided *within* the week, but
 * the script doesn't know what pool variation was shown in a previous
 * week's batch or in the live app. Always skim a new week's draft against
 * the last one before approving.
 *
 * Usage:
 *   npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]
 *
 * Examples:
 *   npx tsx scripts/weekly-aathichoodi-copy.ts 23        # episodes 23-29
 *   npx tsx scripts/weekly-aathichoodi-copy.ts 23 5       # episodes 23-27
 */

import { composeEpisode, nextEpisodeNumber, type ComposedEpisode } from "../lib/kural-publishing/aathichoodi/content-engine";
import { getCanonEntry, TOTAL_EPISODES, SLIDE3_ACTION_HEADING_LABELS } from "../lib/kural-publishing/aathichoodi/canon";
import { EMPTY_HISTORY, type SeriesHistory } from "../lib/kural-publishing/aathichoodi/history-store";
import { generateCaption } from "../lib/kural-publishing/aathichoodi/caption";
import { splitQuotedAction, splitEditorialParagraphs, DEFAULT_STYLE } from "../lib/kural-publishing/aathichoodi-carousel-renderer";

function parseArgs(): { start: number; count: number } {
  const [startArg, countArg] = process.argv.slice(2);
  const start = Number(startArg);
  const count = countArg ? Number(countArg) : 7;
  if (!Number.isInteger(start) || start < 1) {
    console.error("Usage: npx tsx scripts/weekly-aathichoodi-copy.ts <startEpisode> [count]");
    console.error(`  startEpisode: 1-${TOTAL_EPISODES}`);
    console.error("  count: defaults to 7");
    process.exit(1);
  }
  if (!Number.isInteger(count) || count < 1) {
    console.error("count must be a positive integer");
    process.exit(1);
  }
  return { start, count };
}

/** Which of this episode's fields are hand-authored vs composed live from
 *  the theme pools -- useful for a reviewer to know at a glance how much
 *  of this episode is an editor's own words vs the generator's rotation. */
function curatedFieldsFor(episodeNumber: number): string[] {
  const entry = getCanonEntry(episodeNumber);
  const curated = entry?.curated;
  if (!curated) return [];
  const fields: string[] = [];
  if (curated.hookOverride) fields.push("hook");
  if (curated.understanding) fields.push("understanding");
  if (curated.familyAngle) fields.push("family situation");
  if (curated.todayAction) fields.push("today's action");
  if (curated.childLesson) fields.push("reflection line");
  if (curated.aiaConnection) fields.push("carry-it-forward line");
  return fields;
}

function renderEpisodeMarkdown(episode: ComposedEpisode): string {
  const curatedFields = curatedFieldsFor(episode.episodeNumber);
  const action = splitQuotedAction(episode.todayAction);
  const understandingLines = splitEditorialParagraphs(episode.understanding);

  const lines: string[] = [];
  lines.push(`## Episode ${episode.episodeNumber} — ${episode.themeLabel}`);
  lines.push("");
  lines.push(
    `*${episode.verified ? "✓ verified source" : "⚠ unverified — check source"} · ${episode.recommendedFormat === "static" ? "Static" : "Carousel"} · ${
      curatedFields.length > 0 ? `Curated: ${curatedFields.join(", ")}` : "Fully generated from theme pools"
    }*`
  );
  lines.push("");
  lines.push(`**Tamil:** ${episode.tamilText} (${episode.transliteration})`);
  lines.push(`**Meaning:** ${episode.simpleMeaning}`);
  lines.push("");
  lines.push("**Slide 1 — STOP**");
  lines.push(`- Hook: ${episode.hook}`);
  lines.push(`- Tagline: ${episode.tagline.replace(/\n/g, " / ")}`);
  lines.push(`- CTA button: See How`);
  lines.push("");
  lines.push("**Slide 2 — UNDERSTAND**");
  lines.push(`- ${understandingLines.join("\n- ")}`);
  lines.push("");
  lines.push("**Slide 3 — SEE IT IN FAMILY LIFE**");
  lines.push(`- ${episode.familyAngle}`);
  lines.push("");
  const heading = episode.languageCategory
    ? SLIDE3_ACTION_HEADING_LABELS[episode.languageCategory]
    : DEFAULT_STYLE.slide3.sectionHeadingText;
  lines.push("**Slide 4 — TODAY'S ACTION**");
  lines.push(
    `- Heading: ${heading}${episode.languageCategory ? "" : " *(no language category classified yet — showing the design system's fixed default; classify this episode for a Rethink/Ask/Try heading instead)*"}`
  );
  lines.push(`- Highlighted: "${action.quoted}"`);
  if (action.after || episode.todayActionSupport) lines.push(`- Supporting line: ${action.after || episode.todayActionSupport}`);
  lines.push("");
  lines.push("**Slide 5 — CARRY IT FORWARD + AiA**");
  lines.push(`- Reflection line: ${episode.childLesson}`);
  lines.push(`- AiA connection: ${episode.aiaConnection}`);
  lines.push(`- CTA: ${episode.cta.copy} *(${episode.cta.type})*`);
  lines.push("");
  lines.push("**Caption**");
  lines.push("```");
  lines.push(generateCaption(episode));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  const { start, count } = parseArgs();

  let history: SeriesHistory = EMPTY_HISTORY;
  let episodeNumber = start;
  const episodes: ComposedEpisode[] = [];
  const missing: number[] = [];

  for (let i = 0; i < count; i++) {
    const result = composeEpisode(episodeNumber, history);
    if (!result) {
      missing.push(episodeNumber);
    } else {
      episodes.push(result.episode);
      history = result.nextHistory;
    }
    episodeNumber = nextEpisodeNumber(episodeNumber);
  }

  const out: string[] = [];
  out.push(`# Aathichoodi Daily Series — Week Draft`);
  out.push("");
  out.push(
    `Episodes ${episodes.map((e) => e.episodeNumber).join(", ")}. Generated ${new Date().toISOString().slice(0, 10)} by the series' own deterministic content engine (lib/kural-publishing/aathichoodi/content-engine.ts) -- no line here is newly invented; it's either a curated, hand-authored field or one pool entry picked by the app's own anti-repetition selector.`
  );
  out.push("");
  out.push(
    `**Review note:** this batch's anti-repetition history starts fresh at Episode ${start} (this script has no access to the live app's browser-stored history), so repeats are avoided *within* this week but not checked against prior weeks -- skim against last week's draft before approving.`
  );
  out.push("");
  if (missing.length > 0) {
    out.push(`**Could not compose:** episode(s) ${missing.join(", ")} not found in the canon (out of range or missing entry).`);
    out.push("");
  }
  out.push("---");
  out.push("");
  for (const episode of episodes) {
    out.push(renderEpisodeMarkdown(episode));
    out.push("---");
    out.push("");
  }

  console.log(out.join("\n"));
}

main();
