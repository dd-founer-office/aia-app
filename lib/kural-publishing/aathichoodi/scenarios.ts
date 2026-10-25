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
 *
 * Founder voice-alignment pass: about half the pool had drifted into a
 * repeated tie-back tic ("...is this Aathichoodi" / "...is exactly what
 * today's line is about") bolted onto an otherwise good scene. Rewritten
 * to land the same point without that formula -- the scene still makes
 * the value legible without announcing itself doing so.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ScenarioTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const SCENARIOS: readonly ScenarioTemplate[] = [
  { id: "character-1", theme: "character", text: "Your child finds a stray coin on the classroom floor. No teacher saw it fall, no one's asking. What they do with it — pocket it, or hand it in — is character, quietly deciding itself." },
  { id: "character-2", theme: "character", text: "Your child gets away with a small shortcut on a school project. Nobody catches it, nobody asks. Whether they mention it anyway is a choice only they'll ever know they made." },

  { id: "self-control-1", theme: "self-control", text: "A sibling knocks over something your child spent an hour building — by accident. There's a few seconds where anger could win, or not. That pause is the whole lesson, compressed into one breath." },
  { id: "self-control-2", theme: "self-control", text: "It's the fifth \"five more minutes\" of screen time tonight. How calmly the sixth \"no\" gets handled, on both sides, says more than any conversation about patience would." },

  { id: "generosity-1", theme: "generosity", text: "Your child has exactly one favorite snack left, and a friend is visibly hungry. Splitting it without being asked — nobody taught them to do the math that way." },
  { id: "generosity-2", theme: "generosity", text: "A classmate forgot their pencil case again. Your child notices before the teacher does, and slides one across without a word." },

  { id: "family-1", theme: "family", text: "Your child's grandparent tells the same story for the third time this month. Whether your child listens like it's the first time tells you something about how they see family." },
  { id: "family-2", theme: "family", text: "It's been a long day, and a parent looks it. Your child, without being asked, brings a glass of water and just sits down beside them." },

  { id: "gratitude-1", theme: "gratitude", text: "A coach stayed twenty minutes late helping your child practice, then went home to their own family. Whether your child actually says thank you for that is easy to miss and easy to teach." },
  { id: "gratitude-2", theme: "gratitude", text: "Your child mentions, almost in passing, how a cousin helped them out last year. Keeping that memory alive on purpose is its own small act of gratitude." },

  { id: "responsibility-1", theme: "responsibility", text: "Your child's room is clean enough to pass a glance, but the closet tells another story. Finishing the job properly, with no one checking, is the harder and truer version of done." },
  { id: "responsibility-2", theme: "responsibility", text: "Your child is given one small job — feeding the dog, watering a plant — and does it without being reminded twice. That reliability is built one repetition at a time." },

  { id: "community-1", theme: "community", text: "A new kid sits alone at lunch again. Your child could stay with their usual group, or not. That choice plays out in a cafeteria long before it shows up anywhere bigger." },
  { id: "community-2", theme: "community", text: "Your child is deciding which friend to invite over this weekend. Who they pick, and why, says more about this value than any conversation could." },

  { id: "devotion-1", theme: "devotion", text: "Before dinner, your family pauses for a moment everyone's done a thousand times. Tonight, your child actually means it instead of rushing through it." },
  { id: "devotion-2", theme: "devotion", text: "Your child asks why the family still keeps an old tradition nobody's explained to them. The answer you give shapes what devotion means to them for years." },

  { id: "speech-1", theme: "speech", text: "Your child is mid-argument with a sibling and reaches for the one thing they know will land hardest. Whether they say it anyway gets decided in a single breath." },
  { id: "speech-2", theme: "speech", text: "Your child hears a rumor about a classmate and is about to repeat it at dinner. Whether it goes any further is entirely up to what they choose to say next." },

  { id: "education-1", theme: "education", text: "Your child gets a question wrong in front of the whole class and wants to give up on the subject entirely. What you say next decides whether curiosity survives the embarrassment." },
  { id: "education-2", theme: "education", text: "A grandparent starts telling your child how something used to be done, long before phones. Whether your child puts the phone down to listen says something about what they think is worth knowing." },

  { id: "honesty-1", theme: "honesty", text: "Your child breaks something and has about three seconds to decide: own up, or blame the dog. What they choose in that gap is honesty in its plainest, least comfortable form." },
  { id: "honesty-2", theme: "honesty", text: "Two siblings tell two different stories about the same fight. Judging fairly — not just believing whoever spoke first — is harder than it sounds and worth getting right." },
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
