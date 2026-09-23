/**
 * Daily Aathichoodi Series — Parent Hook Pool (Carousel Slide 1: STOP)
 * ----------------------------------------------------------------------------
 * "Have you taught your child this?" was the fixed, recurring hook for
 * every Aathichoodi post per earlier founder direction. Explicit founder
 * reversal: every episode should carry its own hook, not the same line
 * repeated post after post -- so this now follows the exact same themed-
 * pool + anti-repetition pattern as scenarios.ts/actions.ts, still phrased
 * as a short, direct parent-facing question (the series' psychological
 * entry point), just varied per theme instead of fixed. A curated
 * hookOverride (canon.ts) still wins when an editor has hand-authored one.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface HookTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const HOOKS: readonly HookTemplate[] = [
  { id: "character-1", theme: "character", text: "Would your child do the right thing with no one watching?" },
  { id: "character-2", theme: "character", text: "Is this who you want your child to become?" },

  { id: "self-control-1", theme: "self-control", text: "Has your child learned to pause before reacting?" },
  { id: "self-control-2", theme: "self-control", text: "Does your child know patience is a strength, not a weakness?" },

  { id: "generosity-1", theme: "generosity", text: "Does your child know the joy of giving before being asked?" },
  { id: "generosity-2", theme: "generosity", text: "Have you shown them what it means to give freely?" },

  { id: "family-1", theme: "family", text: "Does your child know how much this family means?" },
  { id: "family-2", theme: "family", text: "Have you told them why they matter to you?" },

  { id: "gratitude-1", theme: "gratitude", text: "Does your child know how to say thank you and mean it?" },
  { id: "gratitude-2", theme: "gratitude", text: "Have you taught them to notice what they're given?" },

  { id: "responsibility-1", theme: "responsibility", text: "Does your child know what it means to see something through?" },
  { id: "responsibility-2", theme: "responsibility", text: "Have you shown them ownership isn't a burden?" },

  { id: "community-1", theme: "community", text: "Does your child know kindness to strangers matters too?" },
  { id: "community-2", theme: "community", text: "Have you taught them to include, not just belong?" },

  { id: "devotion-1", theme: "devotion", text: "Does your child know how to be still, even for a moment?" },
  { id: "devotion-2", theme: "devotion", text: "Have you shown them what quiet devotion looks like?" },

  { id: "speech-1", theme: "speech", text: "Does your child know words can heal or wound?" },
  { id: "speech-2", theme: "speech", text: "Have you taught them to think before they speak?" },

  { id: "education-1", theme: "education", text: "Does your child know curiosity is worth chasing?" },
  { id: "education-2", theme: "education", text: "Have you shown them that learning never really stops?" },

  { id: "honesty-1", theme: "honesty", text: "Does your child know the truth matters, even when it's hard?" },
  { id: "honesty-2", theme: "honesty", text: "Have you taught them that honesty is safety, not risk?" },
];

export function selectHook(
  theme: ThemeId,
  episodeNumber: number,
  recentHookIds: readonly string[]
): { id: string; text: string } {
  const pool = HOOKS.filter((h) => h.theme === theme);
  const template = pickFresh(pool, recentHookIds, episodeNumber);
  return { id: template.id, text: template.text };
}
