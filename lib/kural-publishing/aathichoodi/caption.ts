/**
 * Daily Aathichoodi Series — Caption Generator
 * ----------------------------------------------------------------------------
 * A separate text artifact from the carousel/static slide copy, not a
 * repeat of it -- per explicit founder direction, short and punchy rather
 * than restating the long slide paragraphs (understanding/familyAngle/
 * todayAction), optimized for feed reach: a strong hook line up front
 * (what shows before Instagram truncates with "...more"), then the day's
 * Aathichoodi, the closing tagline as the emotional payoff, the CTA, the
 * fixed sign-off, and exactly 3 hashtags (episode.hashtags -- brand + theme
 * + a rotated broad-reach tag, see hashtags.ts).
 */

import type { ComposedEpisode } from "./content-engine";

const SIGNOFF = "சொல்லில் தமிழ் • செயலில் அறம்!";

export function generateCaption(episode: ComposedEpisode): string {
  const lines = [
    episode.hook,
    "",
    `${episode.tamilText} (${episode.transliteration}) — ${episode.simpleMeaning}`,
    "",
    ...episode.tagline.split("\n"),
    "",
    episode.cta.copy,
    "",
    SIGNOFF,
    "",
    episode.hashtags.join(" "),
  ];

  return lines.join("\n");
}
