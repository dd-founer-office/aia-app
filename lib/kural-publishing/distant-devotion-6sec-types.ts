/**
 * Distant Devotion — 6-Second Story: Data Model
 * ----------------------------------------------------------------------------
 * Deliberately minimal, and deliberately independent of the existing
 * Distant Devotion intelligence layer (lib/kural-publishing/distant-
 * devotion/types.ts -- Worlds, FLP lens, Treatment, Cultural-Claim/Safety-
 * Override machinery). That layer exists for longer-form, source-sensitive
 * storytelling composed from a prompt-compiler + external-model round trip.
 * A 6-Second Story is one real moment, two short human-authored lines, and
 * one uploaded photograph -- it doesn't carry the same citation/safety
 * stakes, so it doesn't inherit that apparatus. See the inspection report
 * (chat) for why this is a new, fourth independent content system rather
 * than a mode of the existing "distant-devotion" template.
 *
 * Pillar is a distinct taxonomy from the existing Worlds (LANGUAGE/VALUES/
 * PRACTICES/MEMORY) -- a simple, public, editorial/calendar label for this
 * format only. Fixed at exactly these four, per the locked content
 * strategy; never add a fifth.
 */

export type SixSecondPillar = "CULTURE" | "IDENTITY" | "WISDOM" | "ARAM";

export const SIX_SECOND_PILLARS: readonly SixSecondPillar[] = [
  "CULTURE",
  "IDENTITY",
  "WISDOM",
  "ARAM",
];

export const SIX_SECOND_PILLAR_LABELS: Record<SixSecondPillar, string> = {
  CULTURE: "Culture — What we inherited",
  IDENTITY: "Identity — Who we are",
  WISDOM: "Wisdom — What we learn",
  ARAM: "Aram — What we do",
};

/** Reference only, per the locked publishing rhythm (Mon/Wed/Fri/Sun). This
 *  app has no scheduling system -- shown in the UI as a plain label next to
 *  the pillar selector, never enforced or written anywhere. */
export const SIX_SECOND_PILLAR_DAY: Record<SixSecondPillar, string> = {
  CULTURE: "Monday",
  IDENTITY: "Wednesday",
  WISDOM: "Friday",
  ARAM: "Sunday",
};

export interface SixSecondStory {
  pillar: SixSecondPillar;
  /** Editorial/organizational note (e.g. "Kolam") -- not rendered on the
   *  asset itself. Topic is metadata for whoever is managing the content
   *  calendar. */
  topic: string;
  /** The CURIOSITY phase's (1.5–3.0s) word track, shown one at a time,
   *  right -> left, e.g. ["THINGS", "PAATI", "NEVER", "EXPLAINED"]. Not a
   *  fixed count -- the renderer scrolls through however many words are
   *  given, evenly across the 1.5s window. */
  hookWords: string[];
  line1: string;
  line2: string;
  /** Data URL of the uploaded photograph, same representation as the
   *  existing familyImageDataUrl pattern (aathichoodi-carousel-design-
   *  store.ts). null until a photo is uploaded -- the photograph is the
   *  hero of this format, so the UI gates Download on this being set. */
  visualDataUrl: string | null;
  /** Optional, real attribution only -- the renderer displays nothing if
   *  this is empty rather than fabricate a credit. */
  visualCredit: string;
  /** The social caption text, kept separate from the two on-image lines --
   *  same separation principle as the Aathichoodi series' own caption-
   *  copy.ts (the caption is its own piece of writing, not a copy of the
   *  graphic). Never rendered onto the canvas. */
  captionText: string;
  status: "DRAFT" | "READY";
}

/** Locked content for the first published story (the format's reference
 *  example) -- a woman drawing a kolam, per the final specification. */
export const DEFAULT_SIX_SECOND_STORY: SixSecondStory = {
  pillar: "CULTURE",
  topic: "Kolam",
  hookWords: ["THINGS", "PAATI", "NEVER", "EXPLAINED"],
  line1: "She didn't call it heritage.",
  line2: "She just kept doing it.",
  visualDataUrl: null,
  visualCredit: "",
  captionText: "",
  status: "DRAFT",
};
