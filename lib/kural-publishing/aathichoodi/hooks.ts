/**
 * Daily Aathichoodi Series — Parent Hook Selection (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * "Have you taught your child this?" is the series default -- per explicit
 * founder direction, every episode should reach for it first. A different
 * hook is used only when it is genuinely stronger for that episode's
 * specific emotional lesson: THEME_HOOK_PREFERENCE below is a deliberate,
 * editorial ranking per theme (not a random pool), so the choice is always
 * "which hook fits this value" rather than "which hook hasn't appeared
 * recently." Anti-repetition (recentHookIds) only breaks a tie when the
 * theme's top choice was itself just used -- it never overrides the
 * editorial preference order.
 */

import type { ThemeId } from "./themes";

export interface HookOption {
  id: string;
  text: string;
}

export const HOOKS: readonly HookOption[] = [
  { id: "have-you-taught", text: "Have you taught your child this?" },
  { id: "has-learned", text: "Has your child learned this yet?" },
  { id: "would-know-what-to-do", text: "Would your child know what to do in this situation?" },
  { id: "small-lesson", text: "One small lesson every parent can teach." },
  { id: "carry-for-life", text: "A lesson your child can carry for life." },
  { id: "before-success", text: "Before we teach our children to succeed, can we teach them this?" },
  { id: "what-remember", text: "What would you want your child to remember from this?" },
];

function hookById(id: string): HookOption {
  return HOOKS.find((h) => h.id === id) ?? HOOKS[0];
}

/** Editorial preference order per theme, "have-you-taught" first unless a
 *  specific theme's emotional lesson genuinely calls for something else:
 *  self-control/speech/honesty are about a live, in-the-moment choice, so
 *  "would you know what to do" fits better than the default; generosity/
 *  family are about a trait that lasts, so "carry for life" fits;
 *  gratitude is literally about remembering, so "what would you want them
 *  to remember" fits; responsibility/education are small daily habits, so
 *  "one small lesson" fits; community/honesty touch what really matters
 *  versus surface success, so "before we teach them to succeed" fits. */
const THEME_HOOK_PREFERENCE: Record<ThemeId, readonly string[]> = {
  character: ["have-you-taught", "what-remember", "small-lesson"],
  "self-control": ["would-know-what-to-do", "have-you-taught", "carry-for-life"],
  generosity: ["carry-for-life", "have-you-taught", "before-success"],
  family: ["have-you-taught", "carry-for-life", "what-remember"],
  gratitude: ["what-remember", "have-you-taught", "carry-for-life"],
  responsibility: ["small-lesson", "have-you-taught", "carry-for-life"],
  community: ["before-success", "have-you-taught", "would-know-what-to-do"],
  devotion: ["have-you-taught", "what-remember", "carry-for-life"],
  speech: ["would-know-what-to-do", "have-you-taught", "small-lesson"],
  education: ["have-you-taught", "small-lesson", "carry-for-life"],
  honesty: ["would-know-what-to-do", "before-success", "have-you-taught"],
};

export function pickHook(theme: ThemeId, recentHookIds: readonly string[]): HookOption {
  const preference = THEME_HOOK_PREFERENCE[theme];
  const fresh = preference.find((id) => !recentHookIds.includes(id));
  return hookById(fresh ?? preference[0]);
}
