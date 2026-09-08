/**
 * Daily Aathichoodi Series — Today's Action Pool (Carousel Slide 4)
 * ----------------------------------------------------------------------------
 * "Don't just teach the word. Practice the value." Realistic, small,
 * specific actions a parent can do with or encourage a child to do TODAY,
 * connected directly to the episode. Same anti-repetition pattern as
 * hooks.ts/scenarios.ts.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ActionTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const ACTIONS: readonly ActionTemplate[] = [
  { id: "character-1", theme: "character", text: "Notice one moment today when your child does the right thing with no one watching, and name it out loud: \"I saw that, and it mattered.\"" },
  { id: "character-2", theme: "character", text: "Pick one small rule your family already follows and explain, in one sentence, why it matters — not just that it's a rule." },

  { id: "self-control-1", theme: "self-control", text: "Agree on a simple family signal (a word or gesture) anyone can use today when they feel anger rising, before it comes out as words." },
  { id: "self-control-2", theme: "self-control", text: "The next time your child wants \"just one more,\" pause together for ten seconds before answering yes or no." },

  { id: "generosity-1", theme: "generosity", text: "Set aside one small thing today — a snack, a toy, a few minutes — to give to someone else before you use it yourself." },
  { id: "generosity-2", theme: "generosity", text: "Ask your child to pick one item they no longer need and decide together who could use it more." },

  { id: "family-1", theme: "family", text: "Spend five uninterrupted minutes today with the family member this line points to — no phones, just attention." },
  { id: "family-2", theme: "family", text: "Ask a grandparent or parent one question about their own childhood today, and really listen to the answer." },

  { id: "gratitude-1", theme: "gratitude", text: "Help your child write or say one specific thank-you today to someone who helped them recently." },
  { id: "gratitude-2", theme: "gratitude", text: "At dinner, go around the table and each name one person you're grateful for today, and why." },

  { id: "responsibility-1", theme: "responsibility", text: "Pick one task your child already does, and today, do it together all the way through — properly, not just finished." },
  { id: "responsibility-2", theme: "responsibility", text: "Give your child one small responsibility today that's entirely theirs to see through, start to finish." },

  { id: "community-1", theme: "community", text: "Encourage your child to say hello to, or include, one person today who often gets overlooked." },
  { id: "community-2", theme: "community", text: "Talk with your child about what makes someone a good friend, using someone they actually know as the example." },

  { id: "devotion-1", theme: "devotion", text: "Take one quiet minute today, as a family, before a meal or at bedtime, without rushing through it." },
  { id: "devotion-2", theme: "devotion", text: "Share with your child the story behind one small tradition your family keeps, today." },

  { id: "speech-1", theme: "speech", text: "Before speaking in frustration today, try pausing to ask: \"Is this kind, and is this true?\"" },
  { id: "speech-2", theme: "speech", text: "Catch one moment today to compliment someone sincerely, and let your child see you do it." },

  { id: "education-1", theme: "education", text: "Spend fifteen minutes today learning something new together — a word, a fact, a skill neither of you had before." },
  { id: "education-2", theme: "education", text: "Ask your child what they're curious about right now, and help them find one real answer today." },

  { id: "honesty-1", theme: "honesty", text: "If a small mistake happens today, model owning it out loud before anyone has to ask." },
  { id: "honesty-2", theme: "honesty", text: "The next time you referee a disagreement today, say your reasoning out loud so fairness is visible, not just decided." },
];

export function selectAction(
  theme: ThemeId,
  episodeNumber: number,
  recentActionIds: readonly string[]
): { id: string; text: string } {
  const pool = ACTIONS.filter((a) => a.theme === theme);
  const template = pickFresh(pool, recentActionIds, episodeNumber);
  return { id: template.id, text: template.text };
}
