/**
 * Daily Aathichoodi Series — Caption Generator
 * ----------------------------------------------------------------------------
 * A separate text artifact from the carousel/static slide copy -- per the
 * brief, NOT a repeat of all five slides. Structure: Hook -> Aathichoodi ->
 * short reflection -> parent question -> today's action -> AiA connection
 * -> CTA -> the fixed sign-off line.
 */

import type { ComposedEpisode } from "./content-engine";

const SIGNOFF = "சொல்லில் தமிழ் • செயலில் அறம்!";

/** Hooks phrased as statements (not questions) get a standard parent
 *  question appended, so the caption always has a distinct reflection
 *  question -- per the brief's fixed structure. Hooks already phrased as a
 *  question (most of them are) don't get a second, duplicate question --
 *  the hook itself already fills that role. */
function parentQuestion(hook: string): string | null {
  if (hook.trim().endsWith("?")) return null;
  return "What would it look like to live this out with your child today?";
}

export function generateCaption(episode: ComposedEpisode): string {
  const question = parentQuestion(episode.hook);
  const lines = [
    episode.hook,
    "",
    `Today's Aathichoodi: ${episode.tamilText} (${episode.transliteration})`,
    episode.simpleMeaning,
    ...(question ? ["", question] : []),
    "",
    `Today's action: ${episode.todayAction}`,
    "",
    episode.aiaConnection,
  ];

  if (episode.distantDevotionConnection) {
    lines.push("", episode.distantDevotionConnection);
  }

  lines.push("", episode.cta.copy, "", SIGNOFF);

  return lines.join("\n");
}
