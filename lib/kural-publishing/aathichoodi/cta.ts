/**
 * Daily Aathichoodi Series — CTA Intelligence
 * ----------------------------------------------------------------------------
 * Classifies which call-to-action fits a given episode, following the
 * brief's conversion journey: SEE -> RELATE -> REFLECT -> ACT -> TRUST ->
 * PARTICIPATE -> CONVERT. AIA_PARTICIPATION and DISTANT_DEVOTION are
 * DELIBERATELY gated behind real data registries (aia-initiatives.ts,
 * distant-devotion-services.ts) rather than always-available choices --
 * per the standing rule against inventing services, this classifier can
 * only ever recommend those two CTA types when a genuine matching entry
 * exists in one of those registries. Until real initiatives/services are
 * added there, every episode falls back to a content-appropriate generic
 * CTA (SAVE / SHARE / COMMENT / TRY_TODAY / PARENT_REFLECTION), never a
 * hardcoded sales pitch.
 */

import type { ThemeId } from "./themes";
import { findMatchingInitiative } from "./aia-initiatives";
import { findMatchingService } from "./distant-devotion-services";

export type CtaTypeId =
  | "SAVE"
  | "SHARE"
  | "COMMENT"
  | "TRY_TODAY"
  | "PARENT_REFLECTION"
  | "AIA_PARTICIPATION"
  | "DISTANT_DEVOTION"
  | "STORY_TESTIMONIAL"
  | "SOFT_ENQUIRY";

export interface CtaConfig {
  id: CtaTypeId;
  label: string;
  /** Short, non-salesy copy template. `{value}` is replaced with the
   *  episode's own simple meaning at compose time. */
  copyTemplate: string;
}

export const CTA_TYPES: readonly CtaConfig[] = [
  { id: "SAVE", label: "Save", copyTemplate: "Save this now — you'll want it the next time this comes up at home." },
  { id: "SHARE", label: "Share", copyTemplate: "Send this to one parent right now who needs to see it today." },
  { id: "COMMENT", label: "Comment", copyTemplate: "Comment below: how will your family live this out this week?" },
  { id: "TRY_TODAY", label: "Try Today", copyTemplate: "Don't just read it — try today's action with your child before bedtime." },
  { id: "PARENT_REFLECTION", label: "Parent Reflection", copyTemplate: "Sit with this tonight, then talk about it with your child tomorrow." },
  { id: "AIA_PARTICIPATION", label: "AiA Participation", copyTemplate: "Take the next step — turn this value into action with Aram in Action." },
  { id: "DISTANT_DEVOTION", label: "Distant Devotion", copyTemplate: "Carry this value forward today through Distant Devotion." },
  { id: "STORY_TESTIMONIAL", label: "Story / Testimonial", copyTemplate: "Tell us how your family has lived this — your story could help another parent." },
  { id: "SOFT_ENQUIRY", label: "Soft Enquiry", copyTemplate: "Want to bring this into your family's routine? Ask us how." },
];

export function ctaConfig(id: CtaTypeId): CtaConfig {
  return CTA_TYPES.find((c) => c.id === id) ?? CTA_TYPES[0];
}

/** Generic (always-available) CTA pool, rotated by theme + anti-repetition
 *  history when no curated override and no registry match apply. Each
 *  theme now lists 5 relevant types (was 3) so more real variety cycles
 *  through before anything repeats, on top of the stronger, more directly
 *  action-driving copy in CTA_TYPES above. */
const GENERIC_CTA_BY_THEME: Record<ThemeId, readonly CtaTypeId[]> = {
  character: ["PARENT_REFLECTION", "SAVE", "COMMENT", "TRY_TODAY", "SHARE"],
  "self-control": ["TRY_TODAY", "PARENT_REFLECTION", "SAVE", "COMMENT", "SHARE"],
  generosity: ["TRY_TODAY", "AIA_PARTICIPATION", "SHARE", "COMMENT", "SAVE"],
  family: ["PARENT_REFLECTION", "STORY_TESTIMONIAL", "SHARE", "TRY_TODAY", "SAVE"],
  gratitude: ["PARENT_REFLECTION", "COMMENT", "SHARE", "TRY_TODAY", "SAVE"],
  responsibility: ["TRY_TODAY", "SAVE", "COMMENT", "PARENT_REFLECTION", "SHARE"],
  community: ["SHARE", "COMMENT", "SAVE", "TRY_TODAY", "PARENT_REFLECTION"],
  devotion: ["SOFT_ENQUIRY", "PARENT_REFLECTION", "SAVE", "TRY_TODAY", "COMMENT"],
  speech: ["TRY_TODAY", "PARENT_REFLECTION", "SAVE", "COMMENT", "SHARE"],
  education: ["SAVE", "SHARE", "TRY_TODAY", "COMMENT", "PARENT_REFLECTION"],
  honesty: ["PARENT_REFLECTION", "COMMENT", "SAVE", "TRY_TODAY", "SHARE"],
};

export interface CtaSelection {
  type: CtaTypeId;
  copy: string;
}

/** Picks a CTA for an episode. A curated recommendation always wins (an
 *  editor already decided it deliberately). Otherwise: a real AiA
 *  initiative or Distant Devotion service match is preferred (the brief's
 *  "only when there is a genuine connection" rule), falling back to the
 *  theme's generic pool with anti-repetition rotation. */
export function classifyCta(
  theme: ThemeId,
  simpleMeaning: string,
  recentCtaTypes: readonly CtaTypeId[],
  curatedOverride?: CtaTypeId
): CtaSelection {
  if (curatedOverride) {
    return { type: curatedOverride, copy: fillCopy(curatedOverride, simpleMeaning) };
  }

  const initiative = findMatchingInitiative(theme);
  if (initiative) {
    return { type: "AIA_PARTICIPATION", copy: initiative.ctaCopy };
  }

  const service = findMatchingService(theme);
  if (service) {
    return { type: "DISTANT_DEVOTION", copy: service.ctaCopy };
  }

  const pool = GENERIC_CTA_BY_THEME[theme];
  const fresh = pool.find((id) => !recentCtaTypes.includes(id));
  const chosen = fresh ?? pool[0];
  return { type: chosen, copy: fillCopy(chosen, simpleMeaning) };
}

function fillCopy(id: CtaTypeId, simpleMeaning: string): string {
  return ctaConfig(id).copyTemplate.replace("{value}", simpleMeaning);
}
