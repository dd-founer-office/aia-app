/**
 * Daily Aathichoodi Series — Today's Action Pool (Carousel Slide 4)
 * ----------------------------------------------------------------------------
 * "Don't just teach the word. Practice the value." Realistic, small,
 * specific actions a parent can do with or encourage a child to do TODAY,
 * connected directly to the episode. Same anti-repetition pattern as
 * hooks.ts/scenarios.ts.
 *
 * Every entry ends in a short, literally-sayable phrase in quotes ("lead-in
 * context: \"the actual thing to say or ask\"") -- not just a stylistic
 * choice. drawSlide3Action (the renderer) parses this text with
 * splitQuotedAction and puts whatever's between the quotes into Slide 4's
 * highlighted "question" panel; text with no quotes at all falls back to
 * putting the ENTIRE sentence in that panel, which reads as a confusing
 * parent-facing instruction dressed up as a child-facing question (caught
 * live on Episode 2's un-quoted original). Keep every entry's quoted part
 * a complete sentence with nothing trailing after the closing quote, so
 * there's never a leftover fragment for the "after" paragraph either.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ActionTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const ACTIONS: readonly ActionTemplate[] = [
  { id: "character-1", theme: "character", text: "Notice one moment today when your child does the right thing with no one watching, and name it out loud: \"I saw that, and it mattered.\"" },
  { id: "character-2", theme: "character", text: "Pick one small rule your family already follows and explain why in one sentence: \"We do this because it's who we are.\"" },

  { id: "self-control-1", theme: "self-control", text: "The next time anger starts rising today, agree on one signal that means: \"Let's pause before we speak.\"" },
  { id: "self-control-2", theme: "self-control", text: "The next time your child wants more today, try one phrase before answering: \"Let's pause for ten seconds first.\"" },

  { id: "generosity-1", theme: "generosity", text: "Before you use something today, ask your child: \"Is there someone who needs this more than we do?\"" },
  { id: "generosity-2", theme: "generosity", text: "Ask your child to choose one item they no longer need, then ask together: \"Who could use this more than us?\"" },

  { id: "family-1", theme: "family", text: "Spend five uninterrupted minutes with one family member today, and simply say: \"I just wanted to spend time with you.\"" },
  { id: "family-2", theme: "family", text: "Ask a grandparent or parent one question today: \"What was it like when you were my age?\"" },

  { id: "gratitude-1", theme: "gratitude", text: "Help your child write or say one thank-you today, starting with: \"Thank you for helping me with...\"" },
  { id: "gratitude-2", theme: "gratitude", text: "At dinner tonight, go around the table and each finish this sentence: \"I'm grateful for...\"" },

  { id: "responsibility-1", theme: "responsibility", text: "Pick one task your child already does, and do it together today, saying: \"Let's finish this properly, start to finish.\"" },
  { id: "responsibility-2", theme: "responsibility", text: "Give your child one small responsibility today, framed simply: \"This one is entirely yours to finish.\"" },

  { id: "community-1", theme: "community", text: "Encourage your child today to walk up to someone who's often overlooked and say: \"Hi, want to join us?\"" },
  { id: "community-2", theme: "community", text: "Talk with your child today about someone they know, and ask: \"What makes them a good friend?\"" },

  { id: "devotion-1", theme: "devotion", text: "Take one quiet minute today, as a family, and simply say: \"Let's just be still together for a moment.\"" },
  { id: "devotion-2", theme: "devotion", text: "Share with your child today the story behind one family tradition, starting with: \"Do you know why we do this?\"" },

  { id: "speech-1", theme: "speech", text: "Before speaking in frustration today, try pausing to ask: \"Is this kind, and is this true?\"" },
  { id: "speech-2", theme: "speech", text: "Catch one moment today to compliment someone sincerely, right in front of your child: \"I really appreciate that you did that.\"" },

  { id: "education-1", theme: "education", text: "Spend fifteen minutes today learning something new together, starting with: \"Let's figure this out together.\"" },
  { id: "education-2", theme: "education", text: "Ask your child today what they're curious about, then say: \"Let's go find one real answer together.\"" },

  { id: "honesty-1", theme: "honesty", text: "If a small mistake happens today, model owning it out loud: \"That one's on me — I got that wrong.\"" },
  { id: "honesty-2", theme: "honesty", text: "The next time you referee a disagreement today, say your reasoning out loud: \"Here's why I think this is fair.\"" },
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
