/**
 * Distant Devotion — Asset Generator: Content Type Registry (MVP)
 * ----------------------------------------------------------------------------
 * Adds the content-type layer on top of the existing Kural Koorum Aram
 * publishing tool, per the Content -> Content Type -> Template -> Output
 * Format -> Asset model. Isolated to lib/kural-publishing/, same as every
 * other file in this feature -- imports nothing from lib/living-field/ and
 * does not touch kural200-state.ts or publishing-renderer.ts.
 *
 * Only two templates exist so far: "kka" (the original, untouched
 * publishing-renderer.ts, driven by KuralPublishingContent from
 * kural200-state.ts) and "aathichoodi" (new, lightweight, in
 * aathichoodi-renderer.ts). Content types without a dedicated template yet
 * (Tamil Learning, Announcement, Custom) render through the Aathichoodi
 * template using its generic field slots -- per the brief's own rule not to
 * build a complex separate system for every content type in this MVP. Each
 * can get its own template later without changing this registry's shape.
 */

export type TemplateId = "kka" | "aathichoodi";

export type ContentTypeId =
  | "aathichoodi"
  | "thirukkural"
  | "kka"
  | "tamil-learning"
  | "announcement"
  | "custom";

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
  { id: "aathichoodi", label: "Aathichoodi", template: "aathichoodi" },
  { id: "thirukkural", label: "Thirukkural", template: "kka" },
  { id: "kka", label: "Kural Koorum Aram", template: "kka" },
  { id: "tamil-learning", label: "Tamil Learning", template: "aathichoodi" },
  { id: "announcement", label: "Announcement", template: "aathichoodi" },
  { id: "custom", label: "Custom", template: "aathichoodi" },
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
export const GENERIC_DEFAULTS: Record
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
