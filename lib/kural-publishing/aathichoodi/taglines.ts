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
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface TaglineTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const TAGLINES: readonly TaglineTemplate[] = [
  { id: "character-1", theme: "character", text: "Small choices today.\nA stronger character tomorrow." },
  { id: "character-2", theme: "character", text: "Quiet integrity today.\nA trusted character tomorrow." },

  { id: "self-control-1", theme: "self-control", text: "One pause today.\nA calmer child tomorrow." },
  { id: "self-control-2", theme: "self-control", text: "Small restraint today.\nGreater strength tomorrow." },

  { id: "generosity-1", theme: "generosity", text: "One small gift today.\nA generous heart tomorrow." },
  { id: "generosity-2", theme: "generosity", text: "Sharing today.\nAbundance tomorrow." },

  { id: "family-1", theme: "family", text: "A little attention today.\nA closer family tomorrow." },
  { id: "family-2", theme: "family", text: "Small moments today.\nLifelong bonds tomorrow." },

  { id: "gratitude-1", theme: "gratitude", text: "One thank-you today.\nA grateful heart tomorrow." },
  { id: "gratitude-2", theme: "gratitude", text: "Noticing today.\nAppreciating tomorrow." },

  { id: "responsibility-1", theme: "responsibility", text: "One task today.\nA dependable adult tomorrow." },
  { id: "responsibility-2", theme: "responsibility", text: "Small ownership today.\nReal responsibility tomorrow." },

  { id: "community-1", theme: "community", text: "One kindness today.\nA better community tomorrow." },
  { id: "community-2", theme: "community", text: "Small inclusion today.\nBelonging tomorrow." },

  { id: "devotion-1", theme: "devotion", text: "One quiet moment today.\nLifelong devotion tomorrow." },
  { id: "devotion-2", theme: "devotion", text: "Stillness today.\nFaith tomorrow." },

  { id: "speech-1", theme: "speech", text: "Kind words today.\nTrust tomorrow." },
  { id: "speech-2", theme: "speech", text: "Careful speech today.\nLasting trust tomorrow." },

  { id: "education-1", theme: "education", text: "Curiosity today.\nWisdom tomorrow." },
  { id: "education-2", theme: "education", text: "One question today.\nA lifetime of learning tomorrow." },

  { id: "honesty-1", theme: "honesty", text: "Honesty today.\nIntegrity tomorrow." },
  { id: "honesty-2", theme: "honesty", text: "One truth today.\nTrust tomorrow." },
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
