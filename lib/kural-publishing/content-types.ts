/**
 * Distant Devotion — Asset Generator: Content Type Registry (MVP)
 * ----------------------------------------------------------------------------
 * Adds the content-type layer on top of the existing Kural Koorum Aram
 * publishing tool, per the Content -> Content Type -> Template -> Output
 * Format -> Asset model. Isolated to lib/kural-publishing/, same as every
 * other file in this feature -- imports nothing from lib/living-field/ and
 * does not touch kural200-state.ts or publishing-renderer.ts.
 *
 * Three templates exist: "kka" (the original, untouched
 * publishing-renderer.ts, driven by KuralPublishingContent from
 * kural200-state.ts), "aathichoodi" (lightweight single-card, in
 * aathichoodi-renderer.ts), and "aathichoodi-carousel" (the Daily
 * Aathichoodi Series' 5-slide Family Carousel, in
 * aathichoodi-carousel-renderer.ts -- see lib/kural-publishing/aathichoodi/
 * for that feature's data + content-composition engine). Content types
 * without a dedicated template yet (Tamil Learning, Announcement, Custom)
 * render through the Aathichoodi template using its generic field slots --
 * per the brief's own rule not to build a complex separate system for every
 * content type in this MVP. Each can get its own template later without
 * changing this registry's shape.
 *
 * "aathichoodi-series" is distinct from the plain "aathichoodi" content
 * type above: the latter is one hand-typed demo card (unchanged, still
 * fully supported); the former is the data-driven Daily Series (canonical
 * 109-episode dataset + generated framing), which can render as either
 * Carousel (its nominal template below) or Static (reusing the "aathichoodi"
 * template/renderer via a content mapping) -- see PublishingWorkspace.tsx's
 * own effective-template derivation for that runtime switch.
 *
 * "distant-devotion" is a THIRD, independent content system (not a fourth
 * AiA/KKA-style template variant) -- see lib/kural-publishing/distant-
 * devotion/ for its intelligence layer (worlds, FLP lenses, network
 * dimension, safety validation) and distant-devotion-renderer.ts for its
 * own visual identity. It follows the exact aathichoodi/aathichoodi-carousel
 * precedent: one nominal template ("distant-devotion-carousel", multi-slide)
 * and one single-card counterpart ("distant-devotion"), switched at runtime
 * by the workspace exactly like isSeriesType/seriesFormat does for the
 * Daily Series. AiA and KKA's own templates/content types are unchanged by
 * its addition -- this is strictly additive.
 *
 * "distant-devotion-6sec" is a FOURTH, independent content system, sibling
 * to "distant-devotion" rather than a mode of it -- its own minimal data
 * model (distant-devotion-6sec-types.ts, no FLP/safety machinery), its own
 * renderer (distant-devotion-6sec-renderer.ts, full-bleed photo + two text
 * beats, the locked Bright Orange/Heritage Red/Soft Background/White
 * palette, not DD's terracotta card look), and its own localStorage key
 * (distant-devotion-6sec-store.ts). Nothing about the existing
 * "distant-devotion"/"distant-devotion-carousel" templates changes.
 *
 * "dd-carousel" ("DD- Carousel" in this selector) is a FIFTH, independent
 * content system -- a single directly-editable Tamil headline + English
 * support line, its own minimal data model (dd-carousel-slide1-types.ts)
 * and its own renderer (dd-carousel-slide1-renderer.ts, the deep heritage-
 * red/bright-orange panel look from the founder's Figma reference). It is
 * selected and shown directly in the workspace -- no prompt-compile/paste
 * step -- and defaults to the exact reference example so the design is
 * visible immediately on selection. Nothing about any other content type
 * or template changes.
 */

export type TemplateId =
  | "kka"
  | "aathichoodi"
  | "aathichoodi-carousel"
  | "distant-devotion"
  | "distant-devotion-carousel"
  | "distant-devotion-6sec"
  | "dd-carousel";

export type ContentTypeId =
  | "aathichoodi"
  | "aathichoodi-series"
  | "thirukkural"
  | "kka"
  | "tamil-learning"
  | "announcement"
  | "custom"
  | "distant-devotion"
  | "distant-devotion-6sec"
  | "dd-carousel";

export interface ContentTypeConfig {
  id: ContentTypeId;
  label: string;
  template: TemplateId;
}

/** Order matches the brief's Content Type selector list. "Thirukkural" and
 *  "Kural Koorum Aram" both route to the existing, untouched "kka" template
 *  and its existing field set -- this is the same content, offered under two
 *  selector entries because that's how the brief lists it, not two separate
 *  implementations. */
export const CONTENT_TYPES: readonly ContentTypeConfig[] = [
  { id: "aathichoodi-series", label: "Aathichoodi (Daily Series)", template: "aathichoodi-carousel" },
  { id: "aathichoodi", label: "Aathichoodi (Single Card)", template: "aathichoodi" },
  { id: "thirukkural", label: "Thirukkural", template: "kka" },
  { id: "kka", label: "Kural Koorum Aram", template: "kka" },
  { id: "tamil-learning", label: "Tamil Learning", template: "aathichoodi" },
  { id: "announcement", label: "Announcement", template: "aathichoodi" },
  { id: "custom", label: "Custom", template: "aathichoodi" },
  { id: "distant-devotion", label: "Distant Devotion", template: "distant-devotion-carousel" },
  { id: "distant-devotion-6sec", label: "Distant Devotion — 6-Second Story", template: "distant-devotion-6sec" },
  { id: "dd-carousel", label: "DD- Carousel", template: "dd-carousel" },
];

export function getContentType(id: ContentTypeId): ContentTypeConfig {
  return CONTENT_TYPES.find((c) => c.id === id) ?? CONTENT_TYPES[0];
}

/** Aathichoodi content fields, exactly as specified in the brief. Also
 *  reused, generically, by Tamil Learning / Announcement / Custom until
 *  those get dedicated fields -- the slot names are Aathichoodi-specific but
 *  map naturally onto any short "letter/label + Tamil line + reading +
 *  meaning + optional English + series" content. */
export interface AathichoodiContent {
  letter: string;
  tamilLine: string;
  easyReading: string;
  meaning: string;
  english: string;
  series: string;
}

export const DEFAULT_AATHICHOODI_CONTENT: AathichoodiContent = {
  letter: "அ",
  tamilLine: "அறம் செய விரும்பு",
  easyReading: "Aram Seya Virumbu",
  meaning: "Desire to do good deeds.",
  english: "Wish to do what is right.",
  series: "Aathichoodi",
};

/** Same shape as DEFAULT_AATHICHOODI_CONTENT, relabelled per content type so
 *  the field labels shown in the workspace make sense even though they share
 *  one underlying template and one data shape. */
export const GENERIC_DEFAULTS: Record<
  Extract<ContentTypeId, "tamil-learning" | "announcement" | "custom">,
  AathichoodiContent
> = {
  "tamil-learning": {
    letter: "பாடம் 1",
    tamilLine: "வணக்கம்",
    easyReading: "Vanakkam",
    meaning: "A respectful greeting, used any time of day.",
    english: "Hello / Greetings",
    series: "Tamil Learning",
  },
  announcement: {
    letter: "அறிவிப்பு",
    tamilLine: "புதிய அம்சம் வந்துவிட்டது",
    easyReading: "",
    meaning: "A new feature is now available.",
    english: "",
    series: "Announcement",
  },
  custom: {
    letter: "",
    tamilLine: "",
    easyReading: "",
    meaning: "",
    english: "",
    series: "",
  },
};

export function defaultAathichoodiContentFor(
  id: ContentTypeId
): AathichoodiContent {
  if (id === "tamil-learning" || id === "announcement" || id === "custom") {
    return GENERIC_DEFAULTS[id];
  }
  return DEFAULT_AATHICHOODI_CONTENT;
}

/** Field labels shown in the workspace form for the Aathichoodi template,
 *  overridden per content type so "Letter" reads as "Letter / Number" for
 *  Aathichoodi but "Title" for Announcement, etc. Keys match
 *  AathichoodiContent so PublishingWorkspace can iterate one list. */
export interface AathichoodiFieldLabels {
  letter: string;
  tamilLine: string;
  easyReading: string;
  meaning: string;
  english: string;
  series: string;
}

const AATHICHOODI_LABELS: AathichoodiFieldLabels = {
  letter: "Letter / Number",
  tamilLine: "Tamil line",
  easyReading: "Easy Reading",
  meaning: "Meaning",
  english: "Optional English",
  series: "Series",
};

const GENERIC_LABELS: AathichoodiFieldLabels = {
  letter: "Title",
  tamilLine: "Tamil line",
  easyReading: "Easy Reading (optional)",
  meaning: "Body",
  english: "Optional English",
  series: "Series",
};

export function fieldLabelsFor(id: ContentTypeId): AathichoodiFieldLabels {
  return id === "aathichoodi" ? AATHICHOODI_LABELS : GENERIC_LABELS;
}
