/**
 * Daily Aathichoodi Series — Closing Tagline Pool (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * The muted line(s) under the hook. Originally fixed design-system copy,
 * identical on every episode ("Small values today. / A kinder tomorrow."),
 * then (2026 founder reversal) made per-episode but still forced into a
 * templated "X today. / Y tomorrow." couplet shape on every entry --
 * which itself turned out to read as its own kind of formula once
 * compared against the Episodes 25-31 creative-benchmark PDF, whose
 * equivalent line is always ONE short, content-specific insight/contrast
 * sentence, never a fixed two-part device (e.g. "Some things are
 * fascinating to look at—but not safe to touch." / "The way we rest
 * matters, too."). Rewritten (voice-alignment pass, same incremental
 * per-theme process as scenarios.ts) to match that -- one sentence per
 * entry, specific to its own theme, no couplet. The renderer doesn't
 * require two lines: episode.tagline.split("\n").filter(Boolean) in
 * aathichoodi-carousel-renderer.ts's drawSlide0Stop just renders however
 * many non-empty lines `text` actually contains, so a single-line entry
 * needs no "\n" and no renderer change.
 *
 * Same incremental scope as scenarios.ts: character/self-control/
 * generosity/responsibility/community done (the themes needed so far).
 * family/gratitude/devotion/speech/education/honesty still use the old
 * couplet shape, to be aligned the same way once a week's batch needs
 * them -- see the aathichoodi-week skill's own doc comment on this loop.
 *
 * ctaLabel: the Slide 1 "See How" button used to be one fixed string on
 * every episode, with no connection to the tagline sitting right above it
 * -- explicit founder correction. Each tagline still carries its own short
 * (2-3 word) button label that echoes that entry's own verb/keyword, so
 * the button reads as this episode's own call to action rather than a
 * generic label pasted under every episode regardless of content. See
 * applyTextOverrides/drawSlide0Stop in aathichoodi-carousel-renderer.ts for
 * where this flows through (still overridable per-episode, same as hook/
 * tagline, via CarouselTextOverrides.slide0.ctaLabel).
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface TaglineTemplate extends Pickable {
  theme: ThemeId;
  text: string;
  ctaLabel: string;
}

const TAGLINES: readonly TaglineTemplate[] = [
  { id: "character-1", theme: "character", text: "Small choices, repeated, are what character is actually made of.", ctaLabel: "Choose Well" },
  { id: "character-2", theme: "character", text: "Trust is built in the choices nobody else sees.", ctaLabel: "Build Trust" },

  { id: "self-control-1", theme: "self-control", text: "The pause before reacting matters more than the reaction itself.", ctaLabel: "Pause First" },
  { id: "self-control-2", theme: "self-control", text: "Real strength is choosing to wait, not rushing to react.", ctaLabel: "Hold Steady" },

  { id: "generosity-1", theme: "generosity", text: "A gift given freely means more than one that's asked for.", ctaLabel: "Give Today" },
  { id: "generosity-2", theme: "generosity", text: "What's shared rarely feels smaller for the sharing.", ctaLabel: "Share It" },

  { id: "family-1", theme: "family", text: "A little attention today.\nA closer family tomorrow.", ctaLabel: "Show Up" },
  { id: "family-2", theme: "family", text: "Small moments today.\nLifelong bonds tomorrow.", ctaLabel: "Make a Moment" },

  { id: "gratitude-1", theme: "gratitude", text: "One thank-you today.\nA grateful heart tomorrow.", ctaLabel: "Say Thanks" },
  { id: "gratitude-2", theme: "gratitude", text: "Noticing today.\nAppreciating tomorrow.", ctaLabel: "Notice It" },

  { id: "responsibility-1", theme: "responsibility", text: "Finishing well matters more than finishing fast.", ctaLabel: "Own It" },
  { id: "responsibility-2", theme: "responsibility", text: "Real responsibility shows up when no one's checking.", ctaLabel: "Step Up" },

  { id: "community-1", theme: "community", text: "A small kindness can change how someone's whole day feels.", ctaLabel: "Be Kind" },
  { id: "community-2", theme: "community", text: "Belonging starts the moment someone decides to include, not wait.", ctaLabel: "Include Someone" },

  { id: "devotion-1", theme: "devotion", text: "One quiet moment today.\nLifelong devotion tomorrow.", ctaLabel: "Go Quiet" },
  { id: "devotion-2", theme: "devotion", text: "Stillness today.\nFaith tomorrow.", ctaLabel: "Sit Still" },

  { id: "speech-1", theme: "speech", text: "Kind words today.\nTrust tomorrow.", ctaLabel: "Speak Kindly" },
  { id: "speech-2", theme: "speech", text: "Careful speech today.\nLasting trust tomorrow.", ctaLabel: "Choose Words" },

  { id: "education-1", theme: "education", text: "Curiosity today.\nWisdom tomorrow.", ctaLabel: "Get Curious" },
  { id: "education-2", theme: "education", text: "One question today.\nA lifetime of learning tomorrow.", ctaLabel: "Ask Today" },

  { id: "honesty-1", theme: "honesty", text: "Honesty today.\nIntegrity tomorrow.", ctaLabel: "Live Honestly" },
  { id: "honesty-2", theme: "honesty", text: "One truth today.\nTrust tomorrow.", ctaLabel: "Speak Truth" },
];

export function selectTagline(
  theme: ThemeId,
  episodeNumber: number,
  recentTaglineIds: readonly string[]
): { id: string; text: string; ctaLabel: string } {
  const pool = TAGLINES.filter((t) => t.theme === theme);
  const template = pickFresh(pool, recentTaglineIds, episodeNumber);
  return { id: template.id, text: template.text, ctaLabel: template.ctaLabel };
}
