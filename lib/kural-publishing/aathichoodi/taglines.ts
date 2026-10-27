/**
 * Daily Aathichoodi Series — Closing Tagline Pool (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * The muted closer under the hook used to be fixed design-system copy,
 * identical on every episode, then became a per-episode "X today. / Y
 * tomorrow." couplet. Founder voice-alignment pass (reviewed against the
 * approved reference benchmarks): the couplet structure read as
 * templated rather than earned, and gave away the episode's resolution
 * before Slide 2 -- Slide 1 is a hook slide, so the tagline should build
 * curiosity toward the next slide, not answer it. Every entry is now a
 * SINGLE curiosity-building line (no couplet, no "today/tomorrow"
 * device) -- same themed-pool + anti-repetition pattern as hooks.ts/
 * scenarios.ts/actions.ts, just a different rhetorical shape. The
 * renderer (aathichoodi-carousel-renderer.ts's drawSlide0Stop) splits
 * `text` on "\n" and draws one row per segment, so a single line with no
 * "\n" renders correctly as one line with no renderer change needed.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface TaglineTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const TAGLINES: readonly TaglineTemplate[] = [
  { id: "character-1", theme: "character", text: "The best character shows up when nobody's grading it." },
  { id: "character-2", theme: "character", text: "Trust is built in the choices nobody sees." },

  { id: "self-control-1", theme: "self-control", text: "The pause before reacting is where real strength lives." },
  { id: "self-control-2", theme: "self-control", text: "Calm isn't the absence of anger. It's what comes after it." },

  { id: "generosity-1", theme: "generosity", text: "The smallest gift, given first, teaches the most." },
  { id: "generosity-2", theme: "generosity", text: "Generosity starts the moment you stop counting what's left." },

  { id: "family-1", theme: "family", text: "The closest families are built in the smallest moments." },
  { id: "family-2", theme: "family", text: "Attention, more than anything else, is what family remembers." },

  { id: "gratitude-1", theme: "gratitude", text: "A thank-you said out loud teaches faster than one just felt." },
  { id: "gratitude-2", theme: "gratitude", text: "Noticing what you have is a skill worth practicing daily." },

  { id: "responsibility-1", theme: "responsibility", text: "One task finished properly says more than ten done halfway." },
  { id: "responsibility-2", theme: "responsibility", text: "Ownership, once it's practiced, becomes who you are." },

  { id: "community-1", theme: "community", text: "Belonging starts the moment someone decides to include." },
  { id: "community-2", theme: "community", text: "A kinder community begins with one small, unprompted choice." },

  { id: "devotion-1", theme: "devotion", text: "Stillness, practiced quietly, becomes faith that lasts." },
  { id: "devotion-2", theme: "devotion", text: "Devotion doesn't need an audience to be real." },

  { id: "speech-1", theme: "speech", text: "Words chosen carefully build the trust that lasts." },
  { id: "speech-2", theme: "speech", text: "What's said once can't be unsaid, worth remembering early." },

  { id: "education-1", theme: "education", text: "Curiosity fed today becomes wisdom nobody can take away." },
  { id: "education-2", theme: "education", text: "The questions a child keeps asking shape who they become." },

  { id: "honesty-1", theme: "honesty", text: "The truth that costs something is the one that matters most." },
  { id: "honesty-2", theme: "honesty", text: "Trust, once earned honestly, doesn't need defending." },
];

export function selectTagline(
  theme: ThemeId,
  episodeNumber: number,
  recentTaglineIds: readonly string[]
): { id: string; text: string } {
  const pool = TAGLINES.filter((t) => t.theme === theme);
  const template = pickFresh(pool, recentTaglineIds, episodeNumber);
  return { id: template.id, text: template.text };
}
