/**
 * Aram in Action — Initiative Registry (CONFIGURATION, not content)
 * ----------------------------------------------------------------------------
 * INTENTIONALLY EMPTY, same rule and same reasoning as
 * distant-devotion-services.ts. No catalog of real, running AiA
 * initiatives/campaigns exists anywhere else in this codebase. Populate
 * this once real initiatives are ready to be linked from specific
 * episodes; until then the AIA_PARTICIPATION CTA type only ever appears
 * via a curated per-episode override (canon.ts), never invented generically.
 *
 * TO ACTIVATE: add real entries here, e.g.
 *   { id: "annadhanam-drive", theme: "generosity",
 *     label: "Annadhanam Drive",
 *     ctaCopy: "Join the next Annadhanam Drive with Aram in Action." }
 */

import type { ThemeId } from "./themes";

export interface AiaInitiative {
  id: string;
  theme: ThemeId;
  label: string;
  ctaCopy: string;
}

export const AIA_INITIATIVES: readonly AiaInitiative[] = [];

export function findMatchingInitiative(theme: ThemeId): AiaInitiative | undefined {
  return AIA_INITIATIVES.find((i) => i.theme === theme);
}
