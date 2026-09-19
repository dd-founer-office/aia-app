/**
 * Purananuru — Aram Theme Taxonomy
 * ----------------------------------------------------------------------------
 * New editorial metadata layer, not part of the classical text — same role
 * as lib/kural-publishing/aathichoodi/themes.ts, but a SEPARATE, Purananuru-
 * scoped union. Purananuru is anthology poetry about kings, war, generosity,
 * and public life, not Aathichoodi's household maxims, so its Aram themes
 * are genuinely different (kingship, heroism, war-ethics, impermanence have
 * no equivalent in the Aathichoodi taxonomy) — kept as its own type rather
 * than folded into ThemeId so neither taxonomy has to carry the other's
 * irrelevant members.
 *
 * Deliberately small for the initial 3-poem dataset (only "generosity" and
 * "universal-humanity" are used today) but covers the other themes the
 * Master Content Index is expected to need, so adding poem 4..50 later is
 * just new canon.ts entries, not a themes.ts edit.
 */

export type PurananuruThemeId =
  | "generosity"
  | "universal-humanity"
  | "kingship"
  | "heroism"
  | "war-ethics"
  | "impermanence";

export interface PurananuruThemeConfig {
  id: PurananuruThemeId;
  label: string;
}

export const PURANANURU_THEMES: readonly PurananuruThemeConfig[] = [
  { id: "generosity", label: "Generosity" },
  { id: "universal-humanity", label: "Universal Humanity" },
  { id: "kingship", label: "Kingship" },
  { id: "heroism", label: "Heroism" },
  { id: "war-ethics", label: "War Ethics" },
  { id: "impermanence", label: "Impermanence" },
];

export function purananuruThemeLabel(id: PurananuruThemeId): string {
  return PURANANURU_THEMES.find((t) => t.id === id)?.label ?? id;
}
