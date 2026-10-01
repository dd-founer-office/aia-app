/**
 * Daily Aathichoodi Series — Child Lesson + AiA Connection Pools
 * ----------------------------------------------------------------------------
 * child_lesson: why this matters, in language a child can hold onto --
 * theme-tagged, only ever used on the Static card format (the carousel's
 * Slide 5 uses aia_connection instead, see below), never a sales pitch.
 *
 * aia_connection (Carousel Slide 5): keeps the same throughline -- "a value
 * only becomes real once it's lived, which is Aram in Action's whole idea"
 * -- but, per later founder direction (the original theme-agnostic 6-entry
 * pool read as too few and too generic), is now theme-tagged like every
 * other pool in the series: 6 specific paraphrases per theme, naming the
 * actual value (self-control, generosity, ...) instead of speaking only in
 * the abstract. Rotated with anti-repetition so the exact same line doesn't
 * recur every episode. Never claims a specific AiA initiative unless one is
 * registered in aia-initiatives.ts (handled separately in cta.ts), and
 * never mentions Distant Devotion here -- that only ever comes from a
 * curated per-episode override or a genuine service-registry match.
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
  theme: ThemeId;
  text: string;
}

/** Same throughline as before -- a value only becomes real once it's
 *  lived, which is Aram in Action's whole idea -- but now theme-specific
 *  (6 per theme) instead of 6 generic lines shared by the whole series, so
 *  Slide 5's "upper part" reads as connected to the actual episode rather
 *  than a recycled catch-all sentence. */
const AIA_CONNECTIONS: readonly AnchorPhrase[] = [
  { id: "character-1", theme: "character", text: "Character isn't something your child learns in theory — it's something Aram in Action helps them actually practice." },
  { id: "character-2", theme: "character", text: "Good character becomes real the moment it's lived, not just understood. That's Aram in Action's whole idea." },
  { id: "character-3", theme: "character", text: "Knowing what's right is one thing. Aram in Action is about helping your child actually do it." },
  { id: "character-4", theme: "character", text: "Aram in Action turns a lesson in character into something your child can actually practice in real life." },
  { id: "character-5", theme: "character", text: "A value like this means little until it's lived — Aram in Action exists to help your child live it." },
  { id: "character-6", theme: "character", text: "This is what Aram in Action believes: character isn't taught in a sentence, it's built in practice." },

  { id: "self-control-1", theme: "self-control", text: "Self-control isn't just a lesson — it's a skill Aram in Action helps your child actually build." },
  { id: "self-control-2", theme: "self-control", text: "Knowing to pause is one thing. Aram in Action helps your child practice it until it becomes real." },
  { id: "self-control-3", theme: "self-control", text: "Aram in Action turns a lesson about patience into something your child can actually live out." },
  { id: "self-control-4", theme: "self-control", text: "This is Aram in Action's idea: a value like self-control only becomes real once it's practiced, not just known." },
  { id: "self-control-5", theme: "self-control", text: "Aram in Action exists for moments exactly like this — turning self-control from an idea into a habit." },
  { id: "self-control-6", theme: "self-control", text: "A child doesn't learn patience from a sentence. Aram in Action helps them build it through practice." },

  { id: "generosity-1", theme: "generosity", text: "Generosity means little until it's practiced — that's exactly what Aram in Action helps your child do." },
  { id: "generosity-2", theme: "generosity", text: "Aram in Action turns the idea of giving into something your child actually gets to live out." },
  { id: "generosity-3", theme: "generosity", text: "Knowing to give is one thing. Aram in Action is about helping your child actually do it." },
  { id: "generosity-4", theme: "generosity", text: "This is Aram in Action's whole idea: a value like generosity only becomes real once it's lived." },
  { id: "generosity-5", theme: "generosity", text: "Aram in Action helps your child practice generosity, not just hear about it." },
  { id: "generosity-6", theme: "generosity", text: "A lesson in giving is just words until it's practiced — Aram in Action helps make it real." },

  { id: "family-1", theme: "family", text: "Family values mean little until they're lived daily — that's what Aram in Action helps build." },
  { id: "family-2", theme: "family", text: "Aram in Action turns a lesson about family into something your child actually practices at home." },
  { id: "family-3", theme: "family", text: "Knowing to care for family is one thing. Aram in Action helps your child actually do it." },
  { id: "family-4", theme: "family", text: "This is Aram in Action's idea: showing up for family only becomes real once it's practiced." },
  { id: "family-5", theme: "family", text: "Aram in Action exists to help a value like this move from a lesson into daily family life." },
  { id: "family-6", theme: "family", text: "A lesson about family is just a sentence until it's lived — Aram in Action helps make it real." },

  { id: "gratitude-1", theme: "gratitude", text: "Gratitude means little until it's spoken and lived — that's exactly what Aram in Action helps build." },
  { id: "gratitude-2", theme: "gratitude", text: "Aram in Action turns a lesson in gratitude into something your child actually practices." },
  { id: "gratitude-3", theme: "gratitude", text: "Knowing to say thank you is one thing. Aram in Action helps your child actually live it." },
  { id: "gratitude-4", theme: "gratitude", text: "This is Aram in Action's whole idea: gratitude only becomes real once it's practiced, not just felt." },
  { id: "gratitude-5", theme: "gratitude", text: "Aram in Action helps your child practice gratitude, not just understand it." },
  { id: "gratitude-6", theme: "gratitude", text: "A lesson in gratitude is just words until it's lived — Aram in Action helps make it real." },

  { id: "responsibility-1", theme: "responsibility", text: "Responsibility means little until it's practiced — that's exactly what Aram in Action helps build." },
  { id: "responsibility-2", theme: "responsibility", text: "Aram in Action turns a lesson in responsibility into something your child actually lives out." },
  { id: "responsibility-3", theme: "responsibility", text: "Knowing to follow through is one thing. Aram in Action helps your child actually do it." },
  { id: "responsibility-4", theme: "responsibility", text: "This is Aram in Action's idea: responsibility only becomes real once it's practiced, not just known." },
  { id: "responsibility-5", theme: "responsibility", text: "Aram in Action helps your child build responsibility through practice, not just instruction." },
  { id: "responsibility-6", theme: "responsibility", text: "A lesson in responsibility is just a sentence until it's lived — Aram in Action helps make it real." },

  { id: "community-1", theme: "community", text: "Community means little until it's practiced — that's exactly what Aram in Action helps build." },
  { id: "community-2", theme: "community", text: "Aram in Action turns a lesson about community into something your child actually lives out." },
  { id: "community-3", theme: "community", text: "Knowing to include others is one thing. Aram in Action helps your child actually do it." },
  { id: "community-4", theme: "community", text: "This is Aram in Action's idea: community only becomes real once it's practiced, not just understood." },
  { id: "community-5", theme: "community", text: "Aram in Action helps your child practice community, not just hear about it." },
  { id: "community-6", theme: "community", text: "A lesson about community is just words until it's lived — Aram in Action helps make it real." },

  { id: "devotion-1", theme: "devotion", text: "Devotion means little until it's practiced quietly and often — that's exactly what Aram in Action helps build." },
  { id: "devotion-2", theme: "devotion", text: "Aram in Action turns a lesson in devotion into something your child actually lives out." },
  { id: "devotion-3", theme: "devotion", text: "Knowing why a tradition matters is one thing. Aram in Action helps your child actually live it." },
  { id: "devotion-4", theme: "devotion", text: "This is Aram in Action's idea: devotion only becomes real once it's practiced, not just inherited." },
  { id: "devotion-5", theme: "devotion", text: "Aram in Action helps your child practice devotion, not just observe it." },
  { id: "devotion-6", theme: "devotion", text: "A lesson in devotion is just words until it's lived — Aram in Action helps make it real." },

  { id: "speech-1", theme: "speech", text: "Choosing your words well means little until it's practiced — that's exactly what Aram in Action helps build." },
  { id: "speech-2", theme: "speech", text: "Aram in Action turns a lesson about speech into something your child actually lives out." },
  { id: "speech-3", theme: "speech", text: "Knowing to speak kindly is one thing. Aram in Action helps your child actually do it." },
  { id: "speech-4", theme: "speech", text: "This is Aram in Action's idea: a value like this only becomes real once it's practiced, not just known." },
  { id: "speech-5", theme: "speech", text: "Aram in Action helps your child practice thoughtful speech, not just understand it." },
  { id: "speech-6", theme: "speech", text: "A lesson about words is just words until it's lived — Aram in Action helps make it real." },

  { id: "education-1", theme: "education", text: "Curiosity means little until it's practiced and fed — that's exactly what Aram in Action helps build." },
  { id: "education-2", theme: "education", text: "Aram in Action turns a lesson in curiosity into something your child actually lives out." },
  { id: "education-3", theme: "education", text: "Knowing to keep learning is one thing. Aram in Action helps your child actually do it." },
  { id: "education-4", theme: "education", text: "This is Aram in Action's idea: a value like learning only becomes real once it's practiced, not just known." },
  { id: "education-5", theme: "education", text: "Aram in Action helps your child practice curiosity, not just hear about it." },
  { id: "education-6", theme: "education", text: "A lesson in learning is just words until it's lived — Aram in Action helps make it real." },

  { id: "honesty-1", theme: "honesty", text: "Honesty means little until it's practiced, even when it costs something — that's exactly what Aram in Action helps build." },
  { id: "honesty-2", theme: "honesty", text: "Aram in Action turns a lesson in honesty into something your child actually lives out." },
  { id: "honesty-3", theme: "honesty", text: "Knowing to tell the truth is one thing. Aram in Action helps your child actually do it." },
  { id: "honesty-4", theme: "honesty", text: "This is Aram in Action's idea: honesty only becomes real once it's practiced, not just known." },
  { id: "honesty-5", theme: "honesty", text: "Aram in Action helps your child practice honesty, not just understand it." },
  { id: "honesty-6", theme: "honesty", text: "A lesson in honesty is just words until it's lived — Aram in Action helps make it real." },
];

export function selectChildLesson(theme: ThemeId, episodeNumber: number, recentIds: readonly string[]): { id: string; text: string } {
  const pool = CHILD_LESSONS.filter((t) => t.theme === theme);
  const template = pickFresh(pool, recentIds, episodeNumber);
  return { id: template.id, text: template.text };
}

export function selectAiaConnection(theme: ThemeId, episodeNumber: number, recentIds: readonly string[]): { id: string; text: string } {
  const pool = AIA_CONNECTIONS.filter((t) => t.theme === theme);
  const template = pickFresh(pool, recentIds, episodeNumber);
  return { id: template.id, text: template.text };
}

/** A curated episode's aiaConnection is sometimes the exact approved
 *  phrase (e.g. Episode 1's gold master uses AIA_CONNECTIONS[0] verbatim).
 *  When it matches a pool entry, the caller should record that entry's
 *  real id in history -- not a generic "curated" sentinel -- so
 *  anti-repetition actually knows that sentence was used and won't hand
 *  it back out to a later, non-curated episode. */
export function matchAiaConnectionId(text: string): string | undefined {
  return AIA_CONNECTIONS.find((template) => template.text === text)?.id;
}
