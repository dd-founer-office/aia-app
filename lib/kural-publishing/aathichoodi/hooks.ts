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
  { id: "character-3", theme: "character", text: "Would your child tell the truth even when a lie is easier?" },
  { id: "character-4", theme: "character", text: "Does your child know who they are matters more than who's watching?" },
  { id: "character-5", theme: "character", text: "Have you shown them that character is built in private, not performed in public?" },
  { id: "character-6", theme: "character", text: "Would your child stand for what's right even if it cost them something?" },

  { id: "self-control-1", theme: "self-control", text: "Has your child learned to pause before reacting?" },
  { id: "self-control-2", theme: "self-control", text: "Does your child know patience is a strength, not a weakness?" },
  { id: "self-control-3", theme: "self-control", text: "Has your child learned that a feeling passing through doesn't mean it has to win?" },
  { id: "self-control-4", theme: "self-control", text: "Does your child know that saying no to themselves is a kind of strength?" },
  { id: "self-control-5", theme: "self-control", text: "Have you shown them how to wait, even when waiting is hard?" },
  { id: "self-control-6", theme: "self-control", text: "Does your child know that calm is something you practice, not something you're born with?" },

  { id: "generosity-1", theme: "generosity", text: "Does your child know the joy of giving before being asked?" },
  { id: "generosity-2", theme: "generosity", text: "Have you shown them what it means to give freely?" },
  { id: "generosity-3", theme: "generosity", text: "Does your child know giving doesn't require having extra?" },
  { id: "generosity-4", theme: "generosity", text: "Have you shown them that generosity is a choice, not a leftover?" },
  { id: "generosity-5", theme: "generosity", text: "Does your child notice who has less before you point it out?" },
  { id: "generosity-6", theme: "generosity", text: "Have you taught them that what you give away is never really lost?" },

  { id: "family-1", theme: "family", text: "Does your child know how much this family means?" },
  { id: "family-2", theme: "family", text: "Have you told them why they matter to you?" },
  { id: "family-3", theme: "family", text: "Does your child know that showing up for family is a daily choice, not a given?" },
  { id: "family-4", theme: "family", text: "Have you told them what makes this family different from any other?" },
  { id: "family-5", theme: "family", text: "Does your child know that family isn't only who you're related to?" },
  { id: "family-6", theme: "family", text: "Have you shown them what it looks like to choose family, even on hard days?" },

  { id: "gratitude-1", theme: "gratitude", text: "Does your child know how to say thank you and mean it?" },
  { id: "gratitude-2", theme: "gratitude", text: "Have you taught them to notice what they're given?" },
  { id: "gratitude-3", theme: "gratitude", text: "Does your child notice the small things people do for them?" },
  { id: "gratitude-4", theme: "gratitude", text: "Have you taught them that gratitude is something you practice, not just feel?" },
  { id: "gratitude-5", theme: "gratitude", text: "Does your child know that a real thank-you is more than a habit of politeness?" },
  { id: "gratitude-6", theme: "gratitude", text: "Have you shown them what it looks like to remember, not just receive?" },

  { id: "responsibility-1", theme: "responsibility", text: "Does your child know what it means to see something through?" },
  { id: "responsibility-2", theme: "responsibility", text: "Have you shown them ownership isn't a burden?" },
  { id: "responsibility-3", theme: "responsibility", text: "Does your child finish what they start, even the boring parts?" },
  { id: "responsibility-4", theme: "responsibility", text: "Have you shown them that being trusted is earned in small moments?" },
  { id: "responsibility-5", theme: "responsibility", text: "Does your child take ownership without being reminded?" },
  { id: "responsibility-6", theme: "responsibility", text: "Have you taught them that responsibility isn't about getting caught, it's about following through?" },

  { id: "community-1", theme: "community", text: "Does your child know kindness to strangers matters too?" },
  { id: "community-2", theme: "community", text: "Have you taught them to include, not just belong?" },
  { id: "community-3", theme: "community", text: "Does your child know that belonging works better when it includes others?" },
  { id: "community-4", theme: "community", text: "Have you shown them what it looks like to make room for someone new?" },
  { id: "community-5", theme: "community", text: "Does your child understand that a good community is built, not just joined?" },
  { id: "community-6", theme: "community", text: "Have you taught them to notice who's being left out?" },

  { id: "devotion-1", theme: "devotion", text: "Does your child know how to be still, even for a moment?" },
  { id: "devotion-2", theme: "devotion", text: "Have you shown them what quiet devotion looks like?" },
  { id: "devotion-3", theme: "devotion", text: "Does your child know how to sit still with something bigger than themselves?" },
  { id: "devotion-4", theme: "devotion", text: "Have you shown them why your family keeps the traditions it keeps?" },
  { id: "devotion-5", theme: "devotion", text: "Does your child understand devotion as a daily practice, not a single event?" },
  { id: "devotion-6", theme: "devotion", text: "Have you taught them what quiet reverence actually feels like?" },

  { id: "speech-1", theme: "speech", text: "Does your child know words can heal or wound?" },
  { id: "speech-2", theme: "speech", text: "Have you taught them to think before they speak?" },
  { id: "speech-3", theme: "speech", text: "Does your child know that words, once said, can't be taken back?" },
  { id: "speech-4", theme: "speech", text: "Have you shown them the difference between honest and unkind?" },
  { id: "speech-5", theme: "speech", text: "Does your child think before they speak, especially when upset?" },
  { id: "speech-6", theme: "speech", text: "Have you taught them that silence is sometimes the kinder choice?" },

  { id: "education-1", theme: "education", text: "Does your child know curiosity is worth chasing?" },
  { id: "education-2", theme: "education", text: "Have you shown them that learning never really stops?" },
  { id: "education-3", theme: "education", text: "Does your child know that not knowing something yet is where learning starts?" },
  { id: "education-4", theme: "education", text: "Have you shown them that curiosity is worth protecting?" },
  { id: "education-5", theme: "education", text: "Does your child see learning as something that happens everywhere, not just at school?" },
  { id: "education-6", theme: "education", text: "Have you taught them that effort matters more than getting it right the first time?" },

  { id: "honesty-1", theme: "honesty", text: "Does your child know the truth matters, even when it's hard?" },
  { id: "honesty-2", theme: "honesty", text: "Have you taught them that honesty is safety, not risk?" },
  { id: "honesty-3", theme: "honesty", text: "Does your child tell the truth even when it's not the easy answer?" },
  { id: "honesty-4", theme: "honesty", text: "Have you shown them that honesty is safer than the story that hides it?" },
  { id: "honesty-5", theme: "honesty", text: "Does your child know a small lie can grow into a bigger problem?" },
  { id: "honesty-6", theme: "honesty", text: "Have you taught them that owning a mistake is stronger than covering it?" },
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
