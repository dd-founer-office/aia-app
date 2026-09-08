/**
 * Daily Aathichoodi Series — Parent Hook Pool (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * The controlled hook system from the brief -- always parent-focused, the
 * generator picks the most natural one per episode rather than repeating a
 * single fixed sentence. Selection is anti-repetition (selection.ts),
 * seeded by episode number so the same episode always starts from the same
 * pick when history is empty, but advances as history-store.ts tracks use.
 */

import { pickFresh, type Pickable } from "./selection";

export interface HookOption extends Pickable {
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

export function pickHook(episodeNumber: number, recentHookIds: readonly string[]): HookOption {
  return pickFresh(HOOKS, recentHookIds, episodeNumber);
}
