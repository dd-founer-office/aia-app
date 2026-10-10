/**
 * Daily Aathichoodi Series — Child Lesson + AiA Connection Pools
 * ----------------------------------------------------------------------------
 * child_lesson: why this matters, in language a child can hold onto --
 * theme-tagged, only ever used on the Static card format (the carousel's
 * Slide 5 uses aia_connection instead, see below), never a sales pitch.
 *
 * aia_connection (Carousel Slide 5): theme-tagged like every other pool in
 * the series -- 6 entries per theme, rotated with anti-repetition. Earlier
 * revision of this pool (2024) shared one throughline sentence structure
 * across every entry ("X isn't something your child learns in theory --
 * it's something Aram in Action helps them actually practice", with the
 * theme noun swapped in) -- that read as a content template under the
 * strategy-alignment review (2026), not a reflection connected to the
 * actual episode, and worked against the standing "never a sales pitch"
 * rule by turning every single episode's closing beat into a brand
 * mention. Rewritten per that review: each entry is its own sentence, not
 * an instance of a shared frame -- most are a direct, verse-adjacent
 * observation with no brand name at all; a minority (roughly one in three)
 * name "Aram in Action" naturally, each in its own distinct phrasing, never
 * repeating another entry's sentence shape. Never claims a specific AiA
 * initiative unless one is registered in aia-initiatives.ts (handled
 * separately in cta.ts), and never mentions Distant Devotion here -- that
 * only ever comes from a curated per-episode override or a genuine
 * service-registry match.
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
  { id: "character-1", theme: "character", text: "A child who chooses honesty when no one's watching has already learned something most adults are still working on." },
  { id: "character-2", theme: "character", text: "Character doesn't announce itself. It just shows up, consistently, in the moments nobody's grading." },
  { id: "character-3", theme: "character", text: "What your child does when it's inconvenient says more than what they say when it's easy." },
  { id: "character-4", theme: "character", text: "Aram in Action is built on moments exactly like this one — small, unwatched, and real." },
  { id: "character-5", theme: "character", text: "A value practiced in private, repeatedly, is what eventually becomes a person." },
  { id: "character-6", theme: "character", text: "Nobody claps for the right choice made in an empty room. That's exactly why it counts." },

  { id: "self-control-1", theme: "self-control", text: "The pause itself is the practice — not the outcome, the gap before it." },
  { id: "self-control-2", theme: "self-control", text: "A child who can wait a beat before reacting has just built something that will serve them for years." },
  { id: "self-control-3", theme: "self-control", text: "That half-second of restraint is worth naming out loud. It's harder than it looks from the outside." },
  { id: "self-control-4", theme: "self-control", text: "Aram in Action calls this living a value: not knowing to pause, but actually doing it, today." },
  { id: "self-control-5", theme: "self-control", text: "Patience isn't a personality trait your child either has or doesn't. It's a rep, and today was one." },
  { id: "self-control-6", theme: "self-control", text: "A feeling that passes without taking over is a quiet kind of win worth noticing." },

  { id: "generosity-1", theme: "generosity", text: "Giving before being asked leaves a longer memory than giving because you were told to." },
  { id: "generosity-2", theme: "generosity", text: "What your child gives away today teaches more than any conversation about generosity could." },
  { id: "generosity-3", theme: "generosity", text: "Aram in Action keeps an eye out for moments exactly like this — where a value stops being an idea." },
  { id: "generosity-4", theme: "generosity", text: "A child who notices someone else's need, unprompted, has already done the hardest part." },
  { id: "generosity-5", theme: "generosity", text: "Generosity practiced young rarely needs to be relearned later. It just needs the chance to keep happening." },
  { id: "generosity-6", theme: "generosity", text: "What's given first, before it's asked for, carries a different weight — your child is learning to feel that." },

  { id: "family-1", theme: "family", text: "Family isn't built in the big, photographed moments. It's built in the ones nobody records." },
  { id: "family-2", theme: "family", text: "What your child remembers won't be the lecture. It'll be that you sat down and actually stayed." },
  { id: "family-3", theme: "family", text: "Showing up today, in some small way, is the whole practice — not a lead-up to something bigger later." },
  { id: "family-4", theme: "family", text: "Aram in Action exists for exactly this: the ordinary Tuesday that turns out to matter more than it looked like it would." },
  { id: "family-5", theme: "family", text: "A family that notices each other in small ways rarely needs the grand gesture to feel close." },
  { id: "family-6", theme: "family", text: "The five minutes you gave today will outlast most of what either of you says you'll remember about this week." },

  { id: "gratitude-1", theme: "gratitude", text: "A thank-you said on purpose lands differently than one said out of habit." },
  { id: "gratitude-2", theme: "gratitude", text: "Noticing what you've been given is a skill like any other — and today your child got to practice it." },
  { id: "gratitude-3", theme: "gratitude", text: "What gets named out loud tends to get remembered. Today was worth naming." },
  { id: "gratitude-4", theme: "gratitude", text: "Aram in Action treats a remembered kindness as its own small victory, not a footnote." },
  { id: "gratitude-5", theme: "gratitude", text: "A child who thinks to say thank you has already noticed something most people rush straight past." },
  { id: "gratitude-6", theme: "gratitude", text: "Gratitude felt quietly is easy to lose. Gratitude said out loud tends to stick." },

  { id: "responsibility-1", theme: "responsibility", text: "Finishing something properly, with no one checking, is responsibility actually taking root." },
  { id: "responsibility-2", theme: "responsibility", text: "A child trusted with something small today is a child a little more ready for something bigger tomorrow." },
  { id: "responsibility-3", theme: "responsibility", text: "What your child owns without being reminded is the real measure — not what they're told to do." },
  { id: "responsibility-4", theme: "responsibility", text: "Aram in Action isn't interested in the lecture about responsibility. It's interested in moments exactly like this one." },
  { id: "responsibility-5", theme: "responsibility", text: "Reliability isn't built in one big test. It's built in ordinary, forgettable tasks like today's." },
  { id: "responsibility-6", theme: "responsibility", text: "Nobody was going to notice if this got done halfway. Your child noticed anyway." },

  { id: "community-1", theme: "community", text: "Making room for someone else is a small act that changes how a whole room feels." },
  { id: "community-2", theme: "community", text: "A child who notices who's being left out has already learned the harder, more useful lesson." },
  { id: "community-3", theme: "community", text: "What your child does for someone outside the family teaches them as much as what happens inside it." },
  { id: "community-4", theme: "community", text: "Aram in Action keeps circling back to this: belonging is something you build, not something you wait for." },
  { id: "community-5", theme: "community", text: "Community doesn't start with a big gesture. It starts with one person deciding to include another." },
  { id: "community-6", theme: "community", text: "Today, your child was the one who made space. That's worth remembering next time they're the one left out." },

  { id: "devotion-1", theme: "devotion", text: "Stillness doesn't need an occasion. It just needs a moment, taken on purpose." },
  { id: "devotion-2", theme: "devotion", text: "A tradition explained is a tradition your child might actually choose to keep later, instead of just inheriting it." },
  { id: "devotion-3", theme: "devotion", text: "What your family does quietly, again and again, often teaches more than what's said once, loudly." },
  { id: "devotion-4", theme: "devotion", text: "Aram in Action treats quiet, repeated practice as seriously as it treats any grand occasion." },
  { id: "devotion-5", theme: "devotion", text: "Reverence doesn't have to be dramatic to be real. Quiet and repeated works just as well." },
  { id: "devotion-6", theme: "devotion", text: "Your child copied the ritual today without fully understanding it. That's usually how it starts." },

  { id: "speech-1", theme: "speech", text: "A word held back at the right moment can matter as much as one spoken well." },
  { id: "speech-2", theme: "speech", text: "What gets said in your house, and what doesn't, shapes your child more than either of you probably notices." },
  { id: "speech-3", theme: "speech", text: "A child who pauses before speaking in anger has just practiced something genuinely hard." },
  { id: "speech-4", theme: "speech", text: "Aram in Action keeps coming back to this: what you choose not to say can matter as much as what you do." },
  { id: "speech-5", theme: "speech", text: "Kind and honest aren't opposites — today was a chance to practice holding both at once." },
  { id: "speech-6", theme: "speech", text: "The gossip that stops with your child today is a habit worth naming, not just letting pass quietly." },

  { id: "education-1", theme: "education", text: "Curiosity followed for ten minutes teaches something a worksheet never could." },
  { id: "education-2", theme: "education", text: "A question chased down together tends to stick longer than an answer just handed over." },
  { id: "education-3", theme: "education", text: "What your child gets curious about today is worth taking seriously, even off the syllabus." },
  { id: "education-4", theme: "education", text: "Aram in Action treats learning as a lifelong habit, not something that ends when school lets out." },
  { id: "education-5", theme: "education", text: "Effort noticed and named out loud teaches more than a grade ever will." },
  { id: "education-6", theme: "education", text: "Your child just learned that not knowing something yet is where the interesting part starts." },

  { id: "honesty-1", theme: "honesty", text: "Owning a mistake out loud is harder than hiding it — and your child just watched you choose the harder one." },
  { id: "honesty-2", theme: "honesty", text: "A child who tells the truth when a lie was easier has just practiced something that will serve them for life." },
  { id: "honesty-3", theme: "honesty", text: "What your house treats as safe to admit shapes what your child is willing to tell you later, when it matters more." },
  { id: "honesty-4", theme: "honesty", text: "Aram in Action keeps returning to this: trust is built in the exact moments honesty costs something." },
  { id: "honesty-5", theme: "honesty", text: "Honesty doesn't need to be dramatic to count. Today, ordinary and true was enough." },
  { id: "honesty-6", theme: "honesty", text: "Fair judgment, given without playing favorites, is its own quiet form of honesty." },
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
