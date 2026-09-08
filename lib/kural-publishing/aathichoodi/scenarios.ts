/**
 * Daily Aathichoodi Series — Family Scenario Pool (Carousel Slide 3)
 * ----------------------------------------------------------------------------
 * Theme-tagged, realistic, emotionally warm family situations -- per the
 * brief, NOT exaggerated movie-style stories. Each template renders a
 * short paragraph that closes on the episode's own simple meaning as a
 * grammatically safe trailing clause, so it works regardless of how that
 * specific sentence is phrased (imperative, negative, affirmative).
 * Two-plus variants per theme so a theme doesn't always produce the same
 * scenario; selection is anti-repetition (selection.ts).
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ScenarioTemplate extends Pickable {
  theme: ThemeId;
  render: (meaning: string) => string;
}

function lower(meaning: string): string {
  const trimmed = meaning.replace(/\.$/, "");
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

const SCENARIOS: readonly ScenarioTemplate[] = [
  { id: "character-1", theme: "character", render: (m) => `No one is watching when your child decides whether to put the toy back or leave it for someone else to deal with. Small, unwitnessed choices like this are where character is actually built — and where today's Aathichoodi speaks: ${lower(m)}.` },
  { id: "character-2", theme: "character", render: (m) => `A child comes home proud of a shortcut that "worked" — but wasn't quite fair. The quiet conversation that follows, about doing things the right way even when a shortcut is tempting, is exactly what today's line teaches: ${lower(m)}.` },

  { id: "self-control-1", theme: "self-control", render: (m) => `Homework is late, tempers are short, and a sibling's teasing is the last straw. The next thirty seconds decide whether the evening spirals or settles — and today's Aathichoodi has something to say about that: ${lower(m)}.` },
  { id: "self-control-2", theme: "self-control", render: (m) => `A screen-time argument at bedtime, a craving for "just one more" treat, a habit that's easier to keep than to break — these small daily battles are where this Aathichoodi actually lives: ${lower(m)}.` },

  { id: "generosity-1", theme: "generosity", render: (m) => `Dinner is on the table and there's a knock at the door, or a classmate at school has nothing to share for lunch. What a child sees a parent do in that moment teaches more than any lecture could — and it's exactly what today's line asks: ${lower(m)}.` },
  { id: "generosity-2", theme: "generosity", render: (m) => `Two cousins are handed one plate of sweets between them. How they choose to split it — evenly, generously, or grudgingly — says everything about a value this family is already teaching, the same one Avvaiyar wrote centuries ago: ${lower(m)}.` },

  { id: "family-1", theme: "family", render: (m) => `Between school runs, work calls, and everyone's own schedule, it's easy for a family's most important relationships to run on autopilot. Today's Aathichoodi is a gentle nudge to notice them again: ${lower(m)}.` },
  { id: "family-2", theme: "family", render: (m) => `A grandparent sits a little longer at the table than everyone else, hoping someone will stay and talk. Whether a child notices, and whether a parent models noticing, is where this line becomes real: ${lower(m)}.` },

  { id: "gratitude-1", theme: "gratitude", render: (m) => `A teacher stayed late to help, a neighbor lent a hand, a friend showed up exactly when needed — and then life moved on without a proper thank-you. Today's Aathichoodi asks a family to go back and close that loop: ${lower(m)}.` },
  { id: "gratitude-2", theme: "gratitude", render: (m) => `At the dinner table, someone mentions an old favor almost in passing — the kind of debt of kindness that's easy to forget once life gets busy. This Aathichoodi exists precisely so it isn't forgotten: ${lower(m)}.` },

  { id: "responsibility-1", theme: "responsibility", render: (m) => `A chore gets done in a rush, just well enough to pass — until someone notices the corner that was cut. Today's Aathichoodi is about the difference between finishing a task and actually doing it well: ${lower(m)}.` },
  { id: "responsibility-2", theme: "responsibility", render: (m) => `Pocket money, a savings jar, or a first small job — this is where a child first learns what it means to earn and manage something of their own, which is exactly what this Aathichoodi speaks to: ${lower(m)}.` },

  { id: "community-1", theme: "community", render: (m) => `A new family moves in next door, or a classmate sits alone at lunch. Whether a child reaches out or looks away is shaped long before that moment — by lines like today's: ${lower(m)}.` },
  { id: "community-2", theme: "community", render: (m) => `Choosing which friends to spend time with isn't a small decision for a child — it shapes who they become. Today's Aathichoodi offers a simple compass for that choice: ${lower(m)}.` },

  { id: "devotion-1", theme: "devotion", render: (m) => `A family lights a lamp before a meal, or pauses for a moment of quiet before bed. These small, repeated acts of reverence are where devotion actually lives day to day — echoing today's line: ${lower(m)}.` },
  { id: "devotion-2", theme: "devotion", render: (m) => `A child asks, mid-conversation, why the family keeps a particular tradition. The answer a parent gives shapes how devotion is understood for a lifetime — and it's rooted in exactly what this Aathichoodi says: ${lower(m)}.` },

  { id: "speech-1", theme: "speech", render: (m) => `A sharp word slips out mid-argument between siblings, and it lands harder than intended. The apology that follows — or doesn't — teaches a child everything about the weight of words, which is what today's Aathichoodi is about: ${lower(m)}.` },
  { id: "speech-2", theme: "speech", render: (m) => `A child repeats something unkind they overheard, not realizing how it landed on the person it was about. Today's Aathichoodi is a chance to talk about the real power of what we choose to say: ${lower(m)}.` },

  { id: "education-1", theme: "education", render: (m) => `A hard subject, a discouraging grade, or simple boredom with a book — moments like these decide whether a child grows to love learning or dread it. Today's Aathichoodi speaks directly to that: ${lower(m)}.` },
  { id: "education-2", theme: "education", render: (m) => `A grandparent shares an old story or skill nobody in the family has written down. Whether a child stops to listen and learn is exactly the spirit of today's line: ${lower(m)}.` },

  { id: "honesty-1", theme: "honesty", render: (m) => `A broken vase, a missed assignment, a small mistake — and the easy lie that could cover it up. What a child chooses in that split second is where honesty is actually tested, and it's what today's Aathichoodi teaches: ${lower(m)}.` },
  { id: "honesty-2", theme: "honesty", render: (m) => `Two children each tell their own side of the same argument, and a parent has to decide who to believe. Judging fairly, without favoring one child over the other, is exactly what this Aathichoodi calls for: ${lower(m)}.` },
];

export function selectScenario(
  theme: ThemeId,
  episodeNumber: number,
  simpleMeaning: string,
  recentScenarioIds: readonly string[]
): { id: string; text: string } {
  const pool = SCENARIOS.filter((s) => s.theme === theme);
  const template = pickFresh(pool, recentScenarioIds, episodeNumber);
  return { id: template.id, text: template.render(simpleMeaning) };
}
