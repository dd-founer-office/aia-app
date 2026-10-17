/**
 * Daily Aathichoodi Series — Closing Tagline Pool (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * The muted two-line closer under the hook ("Small values today. / A
 * kinder tomorrow.") used to be fixed design-system copy, identical on
 * every episode. Explicit founder reversal: it's per-episode generated
 * content now, same themed-pool + anti-repetition pattern as hooks.ts/
 * scenarios.ts/actions.ts. Each entry keeps the same rhetorical shape --
 * a short "X today. / Y tomorrow." couplet -- so the device stays
 * recognizable across the series even though the words change. The "\n"
 * inside `text` forces the two-line break the renderer expects (see
 * aathichoodi-carousel-renderer.ts's drawSlide0Stop), not word-wrapping.
 *
 * ctaLabel: the Slide 1 "See How" button used to be one fixed string on
 * every episode, with no connection to the tagline sitting right above it
 * -- explicit founder correction. Each tagline now carries its own short
 * (2-3 word) button label that echoes that specific couplet's verb/keyword
 * (e.g. "One pause today. / A calmer child tomorrow." -> "Pause First"),
 * so the button reads as this episode's own call to action rather than a
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
  { id: "character-1", theme: "character", text: "Small choices today.\nA stronger character tomorrow.", ctaLabel: "Choose Well" },
  { id: "character-2", theme: "character", text: "Quiet integrity today.\nA trusted character tomorrow.", ctaLabel: "Build Trust" },

  { id: "self-control-1", theme: "self-control", text: "One pause today.\nA calmer child tomorrow.", ctaLabel: "Pause First" },
  { id: "self-control-2", theme: "self-control", text: "Small restraint today.\nGreater strength tomorrow.", ctaLabel: "Hold Steady" },

  { id: "generosity-1", theme: "generosity", text: "One small gift today.\nA generous heart tomorrow.", ctaLabel: "Give Today" },
  { id: "generosity-2", theme: "generosity", text: "Sharing today.\nAbundance tomorrow.", ctaLabel: "Share It" },

  { id: "family-1", theme: "family", text: "A little attention today.\nA closer family tomorrow.", ctaLabel: "Show Up" },
  { id: "family-2", theme: "family", text: "Small moments today.\nLifelong bonds tomorrow.", ctaLabel: "Make a Moment" },

  { id: "gratitude-1", theme: "gratitude", text: "One thank-you today.\nA grateful heart tomorrow.", ctaLabel: "Say Thanks" },
  { id: "gratitude-2", theme: "gratitude", text: "Noticing today.\nAppreciating tomorrow.", ctaLabel: "Notice It" },

  { id: "responsibility-1", theme: "responsibility", text: "One task today.\nA dependable adult tomorrow.", ctaLabel: "Own It" },
  { id: "responsibility-2", theme: "responsibility", text: "Small ownership today.\nReal responsibility tomorrow.", ctaLabel: "Step Up" },

  { id: "community-1", theme: "community", text: "One kindness today.\nA better community tomorrow.", ctaLabel: "Be Kind" },
  { id: "community-2", theme: "community", text: "Small inclusion today.\nBelonging tomorrow.", ctaLabel: "Include Someone" },

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
