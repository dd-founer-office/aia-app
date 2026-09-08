/**
 * Distant Devotion — Service Registry (CONFIGURATION, not content)
 * ----------------------------------------------------------------------------
 * INTENTIONALLY EMPTY. No catalog of real Distant Devotion services
 * (temple rituals, remembrance offerings, etc.) exists anywhere else in
 * this codebase as of this writing -- confirmed by a full-repo audit. Per
 * the standing rule ("never invent services... if information is missing,
 * expose a configuration layer rather than hardcoding assumptions"), this
 * file is that configuration layer: a typed, empty registry rather than
 * fabricated offerings.
 *
 * Effect: cta.ts's classifyCta() can only ever recommend the
 * DISTANT_DEVOTION CTA type when findMatchingService() returns a real
 * entry below. Until this array is populated with actual, founder-
 * approved services, no Aathichoodi episode will surface a Distant
 * Devotion CTA on its own -- only a curated override on a specific
 * canon entry (see canon.ts's `curated.distantDevotionConnection`, used
 * today only on episode 20 as an editorial note, not a live registry
 * match) can do that today.
 *
 * TO ACTIVATE: add real entries here, e.g.
 *   { id: "remembrance-lamp", theme: "gratitude",
 *     label: "Remembrance Lamp Offering",
 *     ctaCopy: "Light a Remembrance Lamp through Distant Devotion." }
 * Each entry's `theme` should match a ThemeId this service genuinely
 * relates to -- do not add a broad/catch-all theme just to force more
 * matches; an unmatched episode getting no Distant Devotion CTA is the
 * correct, intended behavior.
 */

import type { ThemeId } from "./themes";

export interface DistantDevotionService {
  id: string;
  theme: ThemeId;
  label: string;
  ctaCopy: string;
}

export const DISTANT_DEVOTION_SERVICES: readonly DistantDevotionService[] = [];

export function findMatchingService(theme: ThemeId): DistantDevotionService | undefined {
  return DISTANT_DEVOTION_SERVICES.find((s) => s.theme === theme);
}
