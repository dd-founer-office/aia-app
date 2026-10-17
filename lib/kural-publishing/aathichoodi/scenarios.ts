/**
 * Daily Aathichoodi Series — Family Scenario Pool (Carousel Slide 3: SEE IT
 * IN FAMILY LIFE)
 * ----------------------------------------------------------------------------
 * MANDATORY per explicit founder direction: a specific, believable,
 * ordinary family moment -- never a generic philosophical statement like
 * "Every family has opportunities to do the right thing." Each entry names
 * a real family actor (your child, a sibling, a grandparent, a parent) and
 * one concrete moment, short enough that a parent can picture it happening
 * in their own house. No "or" hedging between two different scenes -- one
 * scene, described plainly. Two-plus variants per theme; selection is
 * anti-repetition (selection.ts).
 *
 * VOICE PASS (2026, against the Episodes 25-31 creative-benchmark PDF):
 * the benchmark's "THE MOMENT" slide stays purely inside the scene --
 * short, present-tense beats, no explicit callback to "this Aathichoodi."
 * This pool's entries used to all end on a mechanical tie-back clause
 * ("...is this Aathichoodi, quietly at work" / "...is character, choosing
 * itself") -- a repeated structural tic the benchmark doesn't use at all.
 * character/self-control/generosity/responsibility/community have been
 * rewritten to drop that tic and tighten toward the benchmark's shorter,
 * more cinematic pacing (episodes 32-38's themes, the first week this
 * voice pass covers). family/gratitude/devotion/speech/education/honesty
 * are NOT yet rewritten -- still the earlier voice -- and will be, the
 * same way, once a week's batch needs them (see the aathichoodi-week
 * skill's own doc comment on this generate -> review -> refine loop).
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ScenarioTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const SCENARIOS: readonly ScenarioTemplate[] = [
  { id: "character-1", theme: "character", text: "A stray coin sits on the classroom floor. No teacher saw it fall, and nobody's asking. Pocketing it would be easy — and nobody would ever know the difference." },
  { id: "character-2", theme: "character", text: "Your child finds a shortcut on a school project that nobody would catch. The grade wouldn't change. Only your child would ever know it was taken." },
  { id: "character-3", theme: "character", text: "A cashier hands back too much change. It's a small enough amount that no one would notice. It's also the whole decision, settled in about five seconds." },
  { id: "character-4", theme: "character", text: "Two classmates get blamed for something only one of them actually did, and your child is the only one who saw it happen. Speaking up costs something. Staying quiet costs something else." },
  { id: "character-5", theme: "character", text: "The group has decided to pick on someone today, and joining in is the easy way to stay in. Standing apart, even quietly, is its own kind of cost." },
  { id: "character-6", theme: "character", text: "Nobody is checking the hardest part of today's assignment. Skipping it wouldn't even be noticed. Doing it anyway happens for an audience of one." },

  { id: "self-control-1", theme: "self-control", text: "A sibling knocks over something your child spent an hour building. It was an accident — but for a second, that doesn't matter. What happens in that second is the whole thing." },
  { id: "self-control-2", theme: "self-control", text: "It's the fifth \"five more minutes\" tonight. The sixth \"no\" is coming. How it lands, from either side, is already being decided." },
  { id: "self-control-3", theme: "self-control", text: "Your child loses a close game in front of everyone. There's a window — a few seconds, maybe less — before the reaction sets in." },
  { id: "self-control-4", theme: "self-control", text: "Dessert before dinner, again. The answer is still no. Tonight's version of that argument is already starting to write itself." },
  { id: "self-control-5", theme: "self-control", text: "A sibling finds the exact thing that stings and says it anyway. The urge to fire back is instant. The half-second after it isn't." },
  { id: "self-control-6", theme: "self-control", text: "Everything feels unfair tonight, and your child is exhausted enough to show it. Whether it turns into words or a meltdown is still an open question." },

  { id: "generosity-1", theme: "generosity", text: "One favorite snack left, and a friend is visibly hungry. Splitting it costs something real — and happens without being asked." },
  { id: "generosity-2", theme: "generosity", text: "A classmate has forgotten their pencil case again. Your child notices before the teacher does, and slides one across without a word." },
  { id: "generosity-3", theme: "generosity", text: "Your child has been saving for something they want, and a sibling is short for something smaller. Chipping in costs the thing they've been waiting for." },
  { id: "generosity-4", theme: "generosity", text: "A friend is quietly having a hard week. Noticing is easy. Bringing them something tomorrow is the part that actually counts." },
  { id: "generosity-5", theme: "generosity", text: "Your child's team wins, and the other side is visibly deflated. Celebrating is the natural move. Saying something kind instead is a different one." },
  { id: "generosity-6", theme: "generosity", text: "The last good seat, and your child got there first. Giving it up costs the thing they just won." },

  { id: "family-1", theme: "family", text: "Your child's grandparent tells the same story for the third time this month. Whether your child listens like it's the first time is where this Aathichoodi shows up." },
  { id: "family-2", theme: "family", text: "It's been a long day, and a parent looks it. Your child, without being asked, brings a glass of water and just sits down beside them." },
  { id: "family-3", theme: "family", text: "A sibling is struggling with something your child already knows how to do. Helping isn't required, and it's not always fun. Whether your child offers anyway is this Aathichoodi, at home." },
  { id: "family-4", theme: "family", text: "Your child overhears a parent worrying quietly about something. They can't fix it, but they can sit closer tonight. That small choice is family, showing up." },
  { id: "family-5", theme: "family", text: "It's a cousin's turn to be the center of attention at a gathering, not your child's. How your child handles that shift says something real about what family means to them." },
  { id: "family-6", theme: "family", text: "Your child's sibling is having a rough week, and it would be easy to just stay out of it. Checking in anyway, without being told to, is this Aathichoodi in one small gesture." },

  { id: "gratitude-1", theme: "gratitude", text: "A coach stayed twenty minutes late helping your child practice, then went home to their own family. Whether your child actually says thank you for that is this Aathichoodi, in one small moment." },
  { id: "gratitude-2", theme: "gratitude", text: "Your child mentions, almost in passing, how a cousin helped them out last year. Keeping that memory alive on purpose is exactly what today's line asks for." },
  { id: "gratitude-3", theme: "gratitude", text: "A neighbor quietly returns something your child lost weeks ago. It would be easy to just take it back and move on. Pausing to actually thank them is this Aathichoodi, small and real." },
  { id: "gratitude-4", theme: "gratitude", text: "Your child gets help finishing something hard, and by tomorrow they've already forgotten who helped. Bringing that name back up, unprompted, is gratitude actually taking root." },
  { id: "gratitude-5", theme: "gratitude", text: "A sibling gave up something they wanted so your child could have their turn. Whether your child notices that sacrifice at all is exactly what today's line is testing." },
  { id: "gratitude-6", theme: "gratitude", text: "Your child is retelling a proud moment and leaves out the person who helped them get there. Adding that person back into the story is gratitude, in the details." },

  { id: "responsibility-1", theme: "responsibility", text: "The room looks clean enough to pass a glance. The closet tells a different story. Nobody's going to open it today except your child." },
  { id: "responsibility-2", theme: "responsibility", text: "One small job — feeding the dog, watering the plant — no reminder needed this time. That's not an accident. It's a rep." },
  { id: "responsibility-3", theme: "responsibility", text: "A chore gets started, then abandoned halfway for something more interesting. Whether it gets finished later, unprompted, is still undecided." },
  { id: "responsibility-4", theme: "responsibility", text: "Something borrowed came back a little damaged. Mentioning it before anyone notices costs more than staying quiet would." },
  { id: "responsibility-5", theme: "responsibility", text: "It's your child's turn to set up for the group, and nobody's checking. Doing it properly anyway, not just enough to pass, is a choice nobody will see." },
  { id: "responsibility-6", theme: "responsibility", text: "A promise made yesterday is already half-forgotten by morning. What happens next — an excuse, or an admission — is still being decided." },

  { id: "community-1", theme: "community", text: "A new kid sits alone again today. Staying with the usual group is easier. Walking over isn't." },
  { id: "community-2", theme: "community", text: "It's time to pick who gets invited this weekend. The name chosen says more than any conversation about it would." },
  { id: "community-3", theme: "community", text: "A group project needs one more person, and the one left over isn't anyone's first pick. Someone has to say something." },
  { id: "community-4", theme: "community", text: "The neighborhood cleanup is genuinely optional today — no one's checking who shows up. Showing up anyway means something different because of that." },
  { id: "community-5", theme: "community", text: "An older neighbor is struggling with something heavy. Noticing before being asked is the first half of this. Offering is the second." },
  { id: "community-6", theme: "community", text: "A teammate's mistake cost the game. Including them in the conversation afterward, instead of letting them stand alone, is the harder option — and the one that matters." },

  { id: "devotion-1", theme: "devotion", text: "Before dinner, your family pauses for a moment everyone's done a thousand times. Tonight, your child actually means it instead of rushing through it." },
  { id: "devotion-2", theme: "devotion", text: "Your child asks why the family still keeps an old tradition nobody's explained to them. The answer you give shapes what devotion means to them for years." },
  { id: "devotion-3", theme: "devotion", text: "Your family visits a place of worship or quiet remembrance, and your child is restless the whole time. What you say afterward shapes whether this feels like a chore or something real to them." },
  { id: "devotion-4", theme: "devotion", text: "Your child asks why you still light a lamp, say a prayer, or keep a small ritual nobody's forcing them to keep. The answer you give is devotion, passed down in one conversation." },
  { id: "devotion-5", theme: "devotion", text: "There's a moment tonight where the family could rush through a routine, or actually be present in it. Which one happens is this Aathichoodi, decided in seconds." },
  { id: "devotion-6", theme: "devotion", text: "Your child sees an elder pause for a quiet moment before eating or starting the day. Whether they ask about it, or just copy it without understanding, is where devotion starts to take root." },

  { id: "speech-1", theme: "speech", text: "Your child is mid-argument with a sibling and reaches for the one thing they know will land hardest. Whether they say it anyway is this Aathichoodi, decided in a single breath." },
  { id: "speech-2", theme: "speech", text: "Your child hears a rumor about a classmate and is about to repeat it at dinner. Whether it goes any further is entirely up to what they choose to say next." },
  { id: "speech-3", theme: "speech", text: "Your child knows a piece of gossip that would make them the center of attention if they shared it. Whether they let it stop with them is this Aathichoodi, tested by temptation." },
  { id: "speech-4", theme: "speech", text: "A friend asks your child's honest opinion about something they're proud of, but it's not very good. Finding a kind, truthful answer is speech, doing real work." },
  { id: "speech-5", theme: "speech", text: "Your child is losing an argument and reaches for something personal to say, something that would really land. Whether they say it anyway is decided in one breath." },
  { id: "speech-6", theme: "speech", text: "Someone compliments your child in front of a sibling who didn't get the same praise. What your child says next — nothing, or something generous — is this Aathichoodi, quietly at work." },

  { id: "education-1", theme: "education", text: "Your child gets a question wrong in front of the whole class and wants to give up on the subject entirely. What you say next decides whether curiosity survives the embarrassment." },
  { id: "education-2", theme: "education", text: "A grandparent starts telling your child how something used to be done, long before phones. Whether your child puts the phone down to listen is this Aathichoodi, right there." },
  { id: "education-3", theme: "education", text: "Your child finishes their homework quickly and could stop there, or dig one question deeper out of curiosity. Which one they choose is this Aathichoodi, right at the edge of 'good enough.'" },
  { id: "education-4", theme: "education", text: "A subject is genuinely hard for your child this term, and it would be easier to just avoid it. Sticking with it anyway is learning, chosen the hard way." },
  { id: "education-5", theme: "education", text: "Your child asks a question you don't actually know the answer to. Looking it up together, instead of guessing, is education, modeled in real time." },
  { id: "education-6", theme: "education", text: "There's a documentary or article your child could skip for something easier tonight. Choosing the harder, more interesting thing is this Aathichoodi, quietly at work." },

  { id: "honesty-1", theme: "honesty", text: "Your child breaks something and has about three seconds to decide: own up, or blame the dog. What they choose in that gap is this Aathichoodi in its purest form." },
  { id: "honesty-2", theme: "honesty", text: "Two siblings tell two different stories about the same fight. Judging fairly — not just believing whoever spoke first — is exactly what today's line calls for." },
  { id: "honesty-3", theme: "honesty", text: "Your child says they finished something they actually didn't. It would be easy to let it slide by tomorrow. Correcting it themselves, unprompted, is this Aathichoodi, choosing itself." },
  { id: "honesty-4", theme: "honesty", text: "Your child is asked a direct question by a teacher and the honest answer might get them in a little trouble. What they say next is honesty, tested for real." },
  { id: "honesty-5", theme: "honesty", text: "A friend asks your child to back up a story that isn't quite true. Whether your child goes along with it, or says what actually happened, is this Aathichoodi in a single moment." },
  { id: "honesty-6", theme: "honesty", text: "Your child finds money on the ground at school with no name on it. Turning it in instead of pocketing it is honesty, with no one checking." },
];

export function selectScenario(
  theme: ThemeId,
  episodeNumber: number,
  recentScenarioIds: readonly string[]
): { id: string; text: string } {
  const pool = SCENARIOS.filter((s) => s.theme === theme);
  const template = pickFresh(pool, recentScenarioIds, episodeNumber);
  return { id: template.id, text: template.text };
}
