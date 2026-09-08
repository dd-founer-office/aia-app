/**
 * Daily Aathichoodi Series — Child Lesson + AiA Connection Pools
 * ----------------------------------------------------------------------------
 * child_lesson: why this matters, in language a child can hold onto --
 * theme-tagged, only ever used on the Static card format (the carousel's
 * Slide 5 uses aia_connection instead, see below), never a sales pitch.
 *
 * aia_connection (Carousel Slide 5): a single, consistent throughline --
 * "wisdom becomes meaningful once it becomes action" -- per explicit
 * founder direction, this is Aram in Action's core idea and should stay
 * recognizable across the whole series rather than vary by theme. The pool
 * below holds paraphrases of that one idea (not different ideas), rotated
 * with anti-repetition so the exact same sentence doesn't recur every
 * episode. Never claims a specific AiA initiative unless one is registered
 * in aia-initiatives.ts (handled separately in cta.ts), and never mentions
 * Distant Devotion here -- that only ever comes from a curated per-episode
 * override or a genuine service-registry match.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface VoiceTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const CHILD_LESSONS: readonly VoiceTemplate[] = [
  { id: "character-1", theme: "character", text: "Who you are when no one's watching is who you really are." },
  { id: "self-control-1", theme: "self-control", text: "Waiting a moment before reacting is a kind of strength, not weakness." },
  { id: "generosity-1", theme: "generosity", text: "What you give away doesn't shrink you — it grows you." },
  { id: "family-1", theme: "family", text: "The people who care for you deserve to be cared for back." },
  { id: "gratitude-1", theme: "gratitude", text: "Remembering kindness is how kindness keeps going." },
  { id: "responsibility-1", theme: "responsibility", text: "Finishing something properly matters more than finishing it fast." },
  { id: "community-1", theme: "community", text: "Who you choose to spend time with shapes who you become." },
  { id: "devotion-1", theme: "devotion", text: "Small, steady acts of reverence matter more than grand gestures." },
  { id: "speech-1", theme: "speech", text: "Words can't be unsaid — choose them like they matter, because they do." },
  { id: "education-1", theme: "education", text: "What you learn now is something no one can ever take from you." },
  { id: "honesty-1", theme: "honesty", text: "The truth costs less now than a lie costs later." },
  { id: "character-2", theme: "character", text: "Good habits, repeated in small moments, become who you are." },
  { id: "self-control-2", theme: "self-control", text: "Feelings pass faster than the trouble they cause if you act on them too soon." },
  { id: "generosity-2", theme: "generosity", text: "Sharing first, before you're asked, is what makes generosity real." },
  { id: "family-2", theme: "family", text: "Showing up for family in small ways is what makes the big ways possible." },
  { id: "gratitude-2", theme: "gratitude", text: "Saying thank you costs nothing and means everything to the person who helped you." },
  { id: "responsibility-2", theme: "responsibility", text: "Something worth doing is worth doing all the way through." },
  { id: "community-2", theme: "community", text: "A good friend is someone whose company makes you want to be better." },
  { id: "devotion-2", theme: "devotion", text: "Reverence isn't about grand ceremony — it's about showing up quietly, again and again." },
  { id: "speech-2", theme: "speech", text: "A kind word costs you nothing but can carry someone through a hard day." },
  { id: "education-2", theme: "education", text: "Curiosity today becomes capability tomorrow." },
  { id: "honesty-2", theme: "honesty", text: "Being fair to everyone, even when it's inconvenient, is what earns real trust." },
];

interface AnchorPhrase extends Pickable {
  text: string;
}

/** Paraphrases of ONE idea, per explicit founder direction -- not eleven
 *  different theme-specific ideas. Item 1 is the exact approved phrase. */
const AIA_CONNECTIONS: readonly AnchorPhrase[] = [
  { id: "anchor-1", text: "Wisdom becomes meaningful when it becomes action — that's the whole idea behind Aram in Action." },
  { id: "anchor-2", text: "A value only becomes real once it's lived, not just known — that's what Aram in Action is built on." },
  { id: "anchor-3", text: "Aram in Action believes a lesson like this means little until it's practiced." },
  { id: "anchor-4", text: "Knowing this Aathichoodi is one thing. Living it, even once, is what Aram in Action is about." },
  { id: "anchor-5", text: "This is Aram in Action's whole idea: taking a value like this out of words and into daily life." },
  { id: "anchor-6", text: "A quote remembered is nice. A value practiced is Aram in Action." },
];

export function selectChildLesson(theme: ThemeId, episodeNumber: number, recentIds: readonly string[]): { id: string; text: string } {
  const pool = CHILD_LESSONS.filter((t) => t.theme === theme);
  const template = pickFresh(pool, recentIds, episodeNumber);
  return { id: template.id, text: template.text };
}

export function selectAiaConnection(episodeNumber: number, recentIds: readonly string[]): { id: string; text: string } {
  const template = pickFresh(AIA_CONNECTIONS, recentIds, episodeNumber);
  return { id: template.id, text: template.text };
}
