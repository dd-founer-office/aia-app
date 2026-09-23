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
 * scene, described plainly. The tie-back sentence is baked into each
 * template individually (not a shared mechanical suffix), so the closing
 * line varies naturally across the pool instead of reading as a formula.
 * Two-plus variants per theme; selection is anti-repetition (selection.ts).
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ScenarioTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const SCENARIOS: readonly ScenarioTemplate[] = [
  { id: "character-1", theme: "character", text: "Your child finds a stray coin on the classroom floor. No teacher saw it fall, no one's asking. What they do with it — pocket it, or hand it in — is character, quietly deciding itself." },
  { id: "character-2", theme: "character", text: "Your child gets away with a small shortcut on a school project. Nobody catches it, nobody asks. Whether they mention it anyway is where this Aathichoodi actually lives." },
  { id: "character-3", theme: "character", text: "Your child is handed extra change at the store — enough that no cashier would notice. Whether they mention it is this Aathichoodi, decided in about five seconds." },
  { id: "character-4", theme: "character", text: "Two kids get blamed for something only one of them did, and your child was the only witness. What they say next is character, not commentary." },
  { id: "character-5", theme: "character", text: "Your child could join in mocking someone the group has decided to pick on today. Standing apart from that, even quietly, is exactly what today's line asks for." },
  { id: "character-6", theme: "character", text: "Nobody would know if your child skipped the hardest part of an assignment to check. Doing it anyway is character, choosing itself when it's inconvenient." },

  { id: "self-control-1", theme: "self-control", text: "A sibling knocks over something your child spent an hour building — by accident. There's a few seconds where anger could win, or not. That pause is exactly what today's line is about." },
  { id: "self-control-2", theme: "self-control", text: "It's the fifth \"five more minutes\" of screen time tonight. How calmly the sixth \"no\" gets handled, on both sides, is this Aathichoodi being tested in real time." },
  { id: "self-control-3", theme: "self-control", text: "Your child loses a close game in front of everyone. There's a window — a few seconds — before they decide how to react. That window is this Aathichoodi, playing out live." },
  { id: "self-control-4", theme: "self-control", text: "Your child wants dessert before dinner, again, and the answer is no, again. How they handle 'no' tonight says as much as any lecture could." },
  { id: "self-control-5", theme: "self-control", text: "A sibling teases your child right where it stings. The urge to snap back is instant. What happens in the half-second after is exactly what today's line is about." },
  { id: "self-control-6", theme: "self-control", text: "Your child is exhausted and everything feels unfair tonight. Whether they can name that out loud instead of melting down is self-control, still being learned." },

  { id: "generosity-1", theme: "generosity", text: "Your child has exactly one favorite snack left, and a friend is visibly hungry. Splitting it without being asked is this Aathichoodi, in miniature." },
  { id: "generosity-2", theme: "generosity", text: "A classmate forgot their pencil case again. Your child notices before the teacher does, and slides one across without a word." },
  { id: "generosity-3", theme: "generosity", text: "Your child has saved up for something they really want, and a sibling is short on their own savings for something smaller. Chipping in anyway is this Aathichoodi, in real time." },
  { id: "generosity-4", theme: "generosity", text: "A friend at school is clearly having a hard week. Your child could let it pass, or bring them something small tomorrow. That choice starts tonight, at home." },
  { id: "generosity-5", theme: "generosity", text: "Your child's team wins, and the other team is visibly disappointed. Whether your child stays to say something kind instead of celebrating loudly is generosity, in a different form." },
  { id: "generosity-6", theme: "generosity", text: "There's exactly one good seat left, and your child gets there first. Offering it to someone else costs them something real — that's exactly what makes it count." },

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

  { id: "responsibility-1", theme: "responsibility", text: "Your child's room is clean enough to pass a glance, but the closet tells another story. Finishing the job properly, with no one checking, is this Aathichoodi." },
  { id: "responsibility-2", theme: "responsibility", text: "Your child is given one small job — feeding the dog, watering a plant — and does it without being reminded twice. That reliability is built one repetition at a time." },
  { id: "responsibility-3", theme: "responsibility", text: "Your child agrees to a chore, then gets distracted halfway through. Whether they come back and finish it later, unprompted, is this Aathichoodi, tested by boredom." },
  { id: "responsibility-4", theme: "responsibility", text: "Your child borrows something from a friend and it gets a little damaged. Telling the friend before they notice is responsibility, chosen the hard way." },
  { id: "responsibility-5", theme: "responsibility", text: "It's your child's turn to set up for a group activity, and nobody's checking. Doing it properly anyway, not just enough to pass, is this Aathichoodi at work." },
  { id: "responsibility-6", theme: "responsibility", text: "Your child promises to help with something tomorrow, then forgets by morning. How they handle that slip — excuse it, or own it — is responsibility, still forming." },

  { id: "community-1", theme: "community", text: "A new kid sits alone at lunch again. Your child could stay with their usual group, or not. That choice is this Aathichoodi, playing out in a cafeteria." },
  { id: "community-2", theme: "community", text: "Your child is deciding which friend to invite over this weekend. Who they pick, and why, says more about this value than any conversation could." },
  { id: "community-3", theme: "community", text: "A group project needs one more person, and the one left over isn't anyone's first pick. Whether your child speaks up for them is this Aathichoodi, decided by the group." },
  { id: "community-4", theme: "community", text: "Your child's neighborhood is doing a small cleanup, and it's genuinely optional. Showing up anyway, for no reward, is community, chosen freely." },
  { id: "community-5", theme: "community", text: "An older neighbor could use a hand carrying something inside. Your child notices before anyone asks them to help. That noticing is this Aathichoodi, quietly at work." },
  { id: "community-6", theme: "community", text: "Your child's team loses because of one teammate's mistake. Whether your child includes them in the conversation afterward kindly, or lets them stand alone, says something real." },

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
