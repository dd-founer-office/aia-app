/**
 * Daily Aathichoodi Series — Theme Taxonomy
 * ----------------------------------------------------------------------------
 * New editorial metadata layer, not part of the classical text. Used only to
 * pick which hook/scenario/action pools apply for a given canon entry (see
 * content-engine.ts). This is a SECONDARY layer over the fixed sequence —
 * it groups episodes conceptually (per the brief's "Character -> self-
 * control -> generosity -> ..." journey framing) without ever reordering
 * AATHICHOODI_CANON itself.
 */

export type ThemeId =
  | "character"
  | "self-control"
  | "generosity"
  | "family"
  | "gratitude"
  | "responsibility"
  | "community"
  | "devotion"
  | "speech"
  | "education"
  | "honesty";

export interface ThemeConfig {
  id: ThemeId;
  label: string;
}

export const THEMES: readonly ThemeConfig[] = [
  { id: "character", label: "Character" },
  { id: "self-control", label: "Self-Control" },
  { id: "generosity", label: "Generosity" },
  { id: "family", label: "Family" },
  { id: "gratitude", label: "Gratitude" },
  { id: "responsibility", label: "Responsibility" },
  { id: "community", label: "Community" },
  { id: "devotion", label: "Devotion" },
  { id: "speech", label: "Speech" },
  { id: "education", label: "Education" },
  { id: "honesty", label: "Honesty" },
];

export function themeLabel(id: ThemeId): string {
  return THEMES.find((t) => t.id === id)?.label ?? id;
}
