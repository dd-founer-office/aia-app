/**
 * Daily Aathichoodi Series — Caption Generator
 * ----------------------------------------------------------------------------
 * A separate text artifact from the carousel/static slide copy, per
 * explicit founder correction: it was reusing the slide's own hook,
 * tagline, and CTA verbatim -- "same as the text we already have in the
 * slides." Every line here now comes from caption-copy.ts's own pools
 * (captionOpener/captionCloser/captionCta), never from the fields the
 * slides themselves render (hook, tagline, cta.copy) -- the only shared
 * anchor is the Tamil line itself (tamilText/transliteration), kept for
 * searchability/continuity since it's the account's actual subject, not
 * editorial prose. Short and reach-optimized: a strong opener up front
 * (what shows before Instagram truncates with "...more"), the day's
 * Aathichoodi, a caption-only reflection, a caption-only CTA, the fixed
 * sign-off, and exactly 3 hashtags (episode.hashtags, see hashtags.ts).
 */

import type { ComposedEpisode } from "./content-engine";

const SIGNOFF = "சொல்லில் தமிழ் • செயலில் அறம்!";

export function generateCaption(episode: ComposedEpisode): string {
  const lines = [
    episode.captionOpener,
    "",
    `${episode.tamilText} (${episode.transliteration})`,
    "",
    episode.captionCloser,
    "",
    episode.captionCta,
    "",
    SIGNOFF,
    "",
    episode.hashtags.join(" "),
  ];

  return lines.join("\n");
}
