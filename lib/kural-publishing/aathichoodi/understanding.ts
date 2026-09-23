/**
 * Daily Aathichoodi Series — Slide 2 (UNDERSTAND) Composition
 * ----------------------------------------------------------------------------
 * Explains the Aathichoodi in modern life terms -- what a parent wants
 * their child to DEVELOP, never a dictionary entry ("here is the Tamil
 * word, here is the meaning, memorize it"). Shape: {opener} {the episode's
 * own simple meaning, restated as one plain clause} {a theme-rooted
 * sentence on what this actually builds in a child}. This mirrors the
 * approved Episode 1 benchmark exactly: "Avvaiyar begins with a powerful
 * idea: [the meaning, in plain words]. [what it builds in a child]."
 *
 * Both pools rotate with anti-repetition (opener is theme-independent,
 * reframing is per-theme) so the exact same sentence doesn't recur every
 * episode, while every episode still answers the same question: what does
 * this teach my child about living?
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface Opener extends Pickable {
  text: string;
}

const OPENERS: readonly Opener[] = [
  { id: "opener-1", text: "Avvaiyar begins with a powerful idea:" },
  { id: "opener-2", text: "Avvaiyar's wisdom here is simple:" },
  { id: "opener-3", text: "This line carries a quiet truth:" },
  { id: "opener-4", text: "Here's what Avvaiyar wants every child to carry:" },
  { id: "opener-5", text: "The lesson is small, but it runs deep:" },
  { id: "opener-6", text: "Avvaiyar puts it plainly:" },
];

interface Reframing extends Pickable {
  theme: ThemeId;
  text: string;
}

/** What this value actually builds in a child -- rooted in the theme, not
 *  the specific episode, so it reads as insight rather than a definition. */
const REFRAMINGS: readonly Reframing[] = [
  { id: "character-1", theme: "character", text: "That desire, once a child has it, becomes the root every other value grows from." },
  { id: "character-2", theme: "character", text: "Character isn't what a child does under supervision — it's what they choose when no one's checking." },

  { id: "self-control-1", theme: "self-control", text: "What matters isn't the feeling itself, but the pause between feeling it and acting on it — a pause a child can learn." },
  { id: "self-control-2", theme: "self-control", text: "Self-control isn't suppressing a feeling. It's learning that the feeling will pass, even when it doesn't feel like it will." },

  { id: "generosity-1", theme: "generosity", text: "Giving isn't about having extra — it's a decision a child makes before checking what's left for themselves." },
  { id: "generosity-2", theme: "generosity", text: "A generous child isn't born knowing how to share. They learn it by watching someone choose to give first." },

  { id: "family-1", theme: "family", text: "The people who show up for a child every day are easy to take for granted — this asks a child to notice them back." },
  { id: "family-2", theme: "family", text: "Family isn't just who you live with. It's who you choose to look after, even in small, unnoticed ways." },

  { id: "gratitude-1", theme: "gratitude", text: "A child who remembers who helped them grows into someone who remembers to help others. Gratitude is a habit, not just a feeling." },
  { id: "gratitude-2", theme: "gratitude", text: "Saying thank you costs nothing — but forgetting to costs a relationship its warmth, slowly, over time." },

  { id: "responsibility-1", theme: "responsibility", text: "Finishing a task and finishing it well are two different habits — this is about which one a child practices." },
  { id: "responsibility-2", theme: "responsibility", text: "Responsibility isn't one big moment. It's a hundred small tasks done properly instead of just done." },

  { id: "community-1", theme: "community", text: "Who a child spends time with quietly becomes who they grow up to be — this is about choosing that circle with care." },
  { id: "community-2", theme: "community", text: "Showing up for people who aren't family is a value that has to be taught, not assumed." },

  { id: "devotion-1", theme: "devotion", text: "Devotion isn't one grand gesture — it's the small, repeated moments of reverence a family keeps, day after day." },
  { id: "devotion-2", theme: "devotion", text: "A child learns what matters most to a family from what's practiced quietly and often, not from what's said." },

  { id: "speech-1", theme: "speech", text: "Words leave a child's mouth and can't be called back — this is about choosing them like they matter, because they do." },
  { id: "speech-2", theme: "speech", text: "A child learns the weight of their own words by watching how carefully the people around them choose theirs." },

  { id: "education-1", theme: "education", text: "Curiosity fades if it isn't fed. This is a reminder that learning is a habit worth protecting, especially while it's still easy." },
  { id: "education-2", theme: "education", text: "What a child learns young doesn't just fill their mind — it becomes the lens they see everything else through." },

  { id: "honesty-1", theme: "honesty", text: "Honesty is easiest to choose when it costs nothing. This is about choosing it even when a small lie would be easier." },
  { id: "honesty-2", theme: "honesty", text: "A child who tells the truth even when it costs them something is building a kind of trust that lasts a lifetime." },
];

function lowerFirst(text: string): string {
  const trimmed = text.replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

export interface UnderstandingResult {
  text: string;
  openerId: string;
  reframingId: string;
}

export function composeUnderstanding(
  theme: ThemeId,
  episodeNumber: number,
  simpleMeaning: string,
  recentOpenerIds: readonly string[],
  recentReframingIds: readonly string[]
): UnderstandingResult {
  const opener = pickFresh(OPENERS, recentOpenerIds, episodeNumber);
  const reframingPool = REFRAMINGS.filter((r) => r.theme === theme);
  const reframing = pickFresh(reframingPool, recentReframingIds, episodeNumber);
  return {
    text: `${opener.text} ${lowerFirst(simpleMeaning)}. ${reframing.text}`,
    openerId: opener.id,
    reframingId: reframing.id,
  };
}
