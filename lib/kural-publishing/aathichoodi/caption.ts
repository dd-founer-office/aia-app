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
 *  question appended, so the caption always has one -- per the brief's
 *  fixed structure -- without duplicating a hook that's already a question. */
function parentQuestion(hook: string): string {
  if (hook.trim().endsWith("?")) return hook;
  return "What would it look like to live this out with your child today?";
}

export function generateCaption(episode: ComposedEpisode): string {
  const lines = [
    episode.hook,
    "",
    `Today's Aathichoodi: ${episode.tamilText} (${episode.transliteration})`,
    episode.simpleMeaning,
    "",
    parentQuestion(episode.hook),
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
