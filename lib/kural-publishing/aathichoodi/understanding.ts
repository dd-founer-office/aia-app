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
  { id: "character-3", theme: "character", text: "A child's character isn't tested by the big decisions — it's built in the small ones nobody's grading." },
  { id: "character-4", theme: "character", text: "What a child does when it's easy to get away with something is the truest measure of who they're becoming." },
  { id: "character-5", theme: "character", text: "Good character isn't a performance for approval. It's a habit that holds even when the applause disappears." },
  { id: "character-6", theme: "character", text: "The version of a child that shows up when it's inconvenient is the one that's actually real." },

  { id: "self-control-1", theme: "self-control", text: "What matters isn't the feeling itself, but the pause between feeling it and acting on it — a pause a child can learn." },
  { id: "self-control-2", theme: "self-control", text: "Self-control isn't suppressing a feeling. It's learning that the feeling will pass, even when it doesn't feel like it will." },
  { id: "self-control-3", theme: "self-control", text: "A child who can wait isn't suppressing who they are — they're discovering they're bigger than the urge of the moment." },
  { id: "self-control-4", theme: "self-control", text: "Self-control looks like nothing happening, which is exactly why it's so easy for a parent to miss when it's working." },
  { id: "self-control-5", theme: "self-control", text: "Every time a child chooses to wait instead of react, that pause gets a little easier to find the next time." },
  { id: "self-control-6", theme: "self-control", text: "The goal isn't a child who never feels the urge — it's one who's learned the urge isn't in charge." },

  { id: "generosity-1", theme: "generosity", text: "Giving isn't about having extra — it's a decision a child makes before checking what's left for themselves." },
  { id: "generosity-2", theme: "generosity", text: "A generous child isn't born knowing how to share. They learn it by watching someone choose to give first." },
  { id: "generosity-3", theme: "generosity", text: "Generosity a child only shows when they have plenty isn't really generosity yet — the real version shows up when it costs something." },
  { id: "generosity-4", theme: "generosity", text: "A child learns to give not by being told to, but by watching what the people around them choose to give up." },
  { id: "generosity-5", theme: "generosity", text: "What's given first, before being asked, means more than the same thing given after a request — a child can learn to notice that gap." },
  { id: "generosity-6", theme: "generosity", text: "Generosity practiced small and often becomes a child's instinct, not just an occasional good deed." },

  { id: "family-1", theme: "family", text: "The people who show up for a child every day are easy to take for granted — this asks a child to notice them back." },
  { id: "family-2", theme: "family", text: "Family isn't just who you live with. It's who you choose to look after, even in small, unnoticed ways." },
  { id: "family-3", theme: "family", text: "A child learns what family means less from what's said at dinner and more from what's done on the hard, unremarkable days." },
  { id: "family-4", theme: "family", text: "Family isn't a fact a child is born into — it's a practice they get better at, one small choice at a time." },
  { id: "family-5", theme: "family", text: "The small, unglamorous acts of care are what actually build a child's sense of belonging, more than any single big moment." },
  { id: "family-6", theme: "family", text: "A child who learns to show up for family learns, without being told, how to show up for everyone else too." },

  { id: "gratitude-1", theme: "gratitude", text: "A child who remembers who helped them grows into someone who remembers to help others. Gratitude is a habit, not just a feeling." },
  { id: "gratitude-2", theme: "gratitude", text: "Saying thank you costs nothing — but forgetting to costs a relationship its warmth, slowly, over time." },
  { id: "gratitude-3", theme: "gratitude", text: "A child who notices what's been given to them grows into someone who notices what they can give back." },
  { id: "gratitude-4", theme: "gratitude", text: "Gratitude fades fast if it's never spoken out loud — this is about a child learning to say it before the moment passes." },
  { id: "gratitude-5", theme: "gratitude", text: "The habit of noticing help, even small help, is what keeps a child from taking the people around them for granted." },
  { id: "gratitude-6", theme: "gratitude", text: "A thank-you costs a child nothing to say and gives the person who helped them everything they needed to hear." },

  { id: "responsibility-1", theme: "responsibility", text: "Finishing a task and finishing it well are two different habits — this is about which one a child practices." },
  { id: "responsibility-2", theme: "responsibility", text: "Responsibility isn't one big moment. It's a hundred small tasks done properly instead of just done." },
  { id: "responsibility-3", theme: "responsibility", text: "Responsibility a child only shows when someone's checking isn't responsibility yet — the real version holds up alone." },
  { id: "responsibility-4", theme: "responsibility", text: "A child learns to be trusted with more by first proving they can be trusted with less." },
  { id: "responsibility-5", theme: "responsibility", text: "Following through on small promises teaches a child that their word actually means something." },
  { id: "responsibility-6", theme: "responsibility", text: "What a child does after they've said yes matters more than how quickly they said it." },

  { id: "community-1", theme: "community", text: "Who a child spends time with quietly becomes who they grow up to be — this is about choosing that circle with care." },
  { id: "community-2", theme: "community", text: "Showing up for people who aren't family is a value that has to be taught, not assumed." },
  { id: "community-3", theme: "community", text: "A strong community isn't something a child just belongs to — it's something they help build, one small inclusion at a time." },
  { id: "community-4", theme: "community", text: "Noticing who's left out, and doing something about it, is a habit a child has to practice before it becomes instinct." },
  { id: "community-5", theme: "community", text: "A child who learns to include others when it's easy is more likely to do it when it's harder, later on." },
  { id: "community-6", theme: "community", text: "Community isn't the people already around a child — it's who they choose to bring in." },

  { id: "devotion-1", theme: "devotion", text: "Devotion isn't one grand gesture — it's the small, repeated moments of reverence a family keeps, day after day." },
  { id: "devotion-2", theme: "devotion", text: "A child learns what matters most to a family from what's practiced quietly and often, not from what's said." },
  { id: "devotion-3", theme: "devotion", text: "Devotion a child inherits without understanding rarely lasts — this is about giving the practice its meaning, not just its motion." },
  { id: "devotion-4", theme: "devotion", text: "A quiet, repeated ritual teaches a child that some things matter enough to make time for, even on ordinary days." },
  { id: "devotion-5", theme: "devotion", text: "Reverence isn't loud. A child learns it best from what a family does quietly and consistently, not what it announces." },
  { id: "devotion-6", theme: "devotion", text: "What a family keeps sacred, even in small ways, tells a child what it believes actually matters." },

  { id: "speech-1", theme: "speech", text: "Words leave a child's mouth and can't be called back — this is about choosing them like they matter, because they do." },
  { id: "speech-2", theme: "speech", text: "A child learns the weight of their own words by watching how carefully the people around them choose theirs." },
  { id: "speech-3", theme: "speech", text: "A child who learns to pause before speaking learns something most adults are still practicing." },
  { id: "speech-4", theme: "speech", text: "Words a child chooses carefully build trust; words said carelessly spend it, one slip at a time." },
  { id: "speech-5", theme: "speech", text: "Kindness in speech isn't about never being honest — it's about being honest without needing to wound." },
  { id: "speech-6", theme: "speech", text: "What a child doesn't say can matter as much as what they do — silence, chosen well, is speech too." },

  { id: "education-1", theme: "education", text: "Curiosity fades if it isn't fed. This is a reminder that learning is a habit worth protecting, especially while it's still easy." },
  { id: "education-2", theme: "education", text: "What a child learns young doesn't just fill their mind — it becomes the lens they see everything else through." },
  { id: "education-3", theme: "education", text: "A child who's allowed to be curious without judgment stays curious a lot longer than one who's afraid of a wrong answer." },
  { id: "education-4", theme: "education", text: "Learning that sticks isn't the kind memorized for a test — it's the kind a child chases because they actually want to know." },
  { id: "education-5", theme: "education", text: "What a child is curious about at home often matters more, long-term, than what they're taught at school." },
  { id: "education-6", theme: "education", text: "A child who watches an adult keep learning learns that growing up doesn't mean you stop." },

  { id: "honesty-1", theme: "honesty", text: "Honesty is easiest to choose when it costs nothing. This is about choosing it even when a small lie would be easier." },
  { id: "honesty-2", theme: "honesty", text: "A child who tells the truth even when it costs them something is building a kind of trust that lasts a lifetime." },
  { id: "honesty-3", theme: "honesty", text: "A child who tells small truths easily is building the muscle they'll need for the harder ones later." },
  { id: "honesty-4", theme: "honesty", text: "Honesty a child only practices when it's convenient isn't honesty yet — the real version costs something sometimes." },
  { id: "honesty-5", theme: "honesty", text: "Owning a mistake out loud teaches a child that trust survives honesty, but rarely survives being caught." },
  { id: "honesty-6", theme: "honesty", text: "A child learns the value of the truth by watching whether it's actually rewarded, or quietly punished, at home." },
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
