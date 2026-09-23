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
  { id: "character-3", theme: "character", text: "Tonight, ask your child about a moment today when doing right was hard, and just listen: \"Tell me what that was like.\"" },
  { id: "character-4", theme: "character", text: "Point out one small honest choice you made today, out loud, in front of your child: \"I could have skipped that, but I didn't.\"" },
  { id: "character-5", theme: "character", text: "Ask your child today to describe someone they think has great character, then ask: \"What do they do that makes you say that?\"" },
  { id: "character-6", theme: "character", text: "The next time no one's watching today, quietly ask your child: \"What would you do if I weren't here right now?\"" },

  { id: "self-control-1", theme: "self-control", text: "The next time anger starts rising today, agree on one signal that means: \"Let's pause before we speak.\"" },
  { id: "self-control-2", theme: "self-control", text: "The next time your child wants more today, try one phrase before answering: \"Let's pause for ten seconds first.\"" },
  { id: "self-control-3", theme: "self-control", text: "Tonight, name the pause out loud the moment you see your child use it: \"I noticed you stopped and thought about that.\"" },
  { id: "self-control-4", theme: "self-control", text: "Before bed, ask your child about one moment today they wanted to react but didn't: \"What helped you hold back?\"" },
  { id: "self-control-5", theme: "self-control", text: "Agree on a shared phrase for hard moments today: \"Let's breathe first, decide second.\"" },
  { id: "self-control-6", theme: "self-control", text: "The next time your child is upset today, try asking instead of telling: \"Do you need a minute before we talk about this?\"" },

  { id: "generosity-1", theme: "generosity", text: "Before you use something today, ask your child: \"Is there someone who needs this more than we do?\"" },
  { id: "generosity-2", theme: "generosity", text: "Ask your child to choose one item they no longer need, then ask together: \"Who could use this more than us?\"" },
  { id: "generosity-3", theme: "generosity", text: "Ask your child today to give away one thing they'd normally keep for themselves, and say why: \"I want you to have this more than I do.\"" },
  { id: "generosity-4", theme: "generosity", text: "Notice a moment today your child gives without being asked, and name it: \"That was generous, and I saw it.\"" },
  { id: "generosity-5", theme: "generosity", text: "At dinner tonight, ask your child: \"Who could you give something to this week, and what would you give?\"" },
  { id: "generosity-6", theme: "generosity", text: "Before your child spends on themselves today, pause and ask together: \"Is there someone this would help more?\"" },

  { id: "family-1", theme: "family", text: "Spend five uninterrupted minutes with one family member today, and simply say: \"I just wanted to spend time with you.\"" },
  { id: "family-2", theme: "family", text: "Ask a grandparent or parent one question today: \"What was it like when you were my age?\"" },
  { id: "family-3", theme: "family", text: "Tonight, ask each family member to share one thing they're grateful another family member did this week." },
  { id: "family-4", theme: "family", text: "Encourage your child today to help a sibling with something small, unprompted: \"Want a hand with that?\"" },
  { id: "family-5", theme: "family", text: "Set aside device-free time tonight and just ask: \"What was the best part of your day?\"" },
  { id: "family-6", theme: "family", text: "Ask your child today what makes your family feel like a team, and really listen to the answer." },

  { id: "gratitude-1", theme: "gratitude", text: "Help your child write or say one thank-you today, starting with: \"Thank you for helping me with...\"" },
  { id: "gratitude-2", theme: "gratitude", text: "At dinner tonight, go around the table and each finish this sentence: \"I'm grateful for...\"" },
  { id: "gratitude-3", theme: "gratitude", text: "Ask your child today to name one person who helped them this month that they haven't thanked yet." },
  { id: "gratitude-4", theme: "gratitude", text: "Tonight, help your child write a short note to someone who did something kind for them recently." },
  { id: "gratitude-5", theme: "gratitude", text: "At dinner, ask your child: \"What's something small someone did for you today that you're glad about?\"" },
  { id: "gratitude-6", theme: "gratitude", text: "Encourage your child today to thank someone directly, by name, for something specific: \"Thank you for...\"" },

  { id: "responsibility-1", theme: "responsibility", text: "Pick one task your child already does, and do it together today, saying: \"Let's finish this properly, start to finish.\"" },
  { id: "responsibility-2", theme: "responsibility", text: "Give your child one small responsibility today, framed simply: \"This one is entirely yours to finish.\"" },
  { id: "responsibility-3", theme: "responsibility", text: "Give your child a task today with no reminder planned, and afterward just notice it: \"You didn't need me to ask twice.\"" },
  { id: "responsibility-4", theme: "responsibility", text: "Ask your child tonight about something they said they'd do today: \"Did you get to finish that?\"" },
  { id: "responsibility-5", theme: "responsibility", text: "Let your child pick one responsibility to fully own this week, and say: \"This one's yours, start to finish.\"" },
  { id: "responsibility-6", theme: "responsibility", text: "If your child forgets something today, ask instead of reminding: \"What's your plan to make that right?\"" },

  { id: "community-1", theme: "community", text: "Encourage your child today to walk up to someone who's often overlooked and say: \"Hi, want to join us?\"" },
  { id: "community-2", theme: "community", text: "Talk with your child today about someone they know, and ask: \"What makes them a good friend?\"" },
  { id: "community-3", theme: "community", text: "Ask your child today who in their class or team might be feeling left out, and what one small thing they could do about it." },
  { id: "community-4", theme: "community", text: "Encourage your child to invite someone new into an activity today: \"Come join us.\"" },
  { id: "community-5", theme: "community", text: "Tonight, ask your child: \"Who made you feel included this week, and how?\"" },
  { id: "community-6", theme: "community", text: "Point out a moment today your child included someone, and name it out loud: \"That was you making room for someone.\"" },

  { id: "devotion-1", theme: "devotion", text: "Take one quiet minute today, as a family, and simply say: \"Let's just be still together for a moment.\"" },
  { id: "devotion-2", theme: "devotion", text: "Share with your child today the story behind one family tradition, starting with: \"Do you know why we do this?\"" },
  { id: "devotion-3", theme: "devotion", text: "Tonight, explain the story behind one small family ritual before doing it together." },
  { id: "devotion-4", theme: "devotion", text: "Take one quiet minute today and ask your child: \"What does this moment mean to you?\"" },
  { id: "devotion-5", theme: "devotion", text: "Invite your child to lead one small family ritual today, even just once." },
  { id: "devotion-6", theme: "devotion", text: "Ask your child tonight: \"Is there a tradition of ours you'd want to keep going someday?\"" },

  { id: "speech-1", theme: "speech", text: "Before speaking in frustration today, try pausing to ask: \"Is this kind, and is this true?\"" },
  { id: "speech-2", theme: "speech", text: "Catch one moment today to compliment someone sincerely, right in front of your child: \"I really appreciate that you did that.\"" },
  { id: "speech-3", theme: "speech", text: "Before your child speaks in anger today, agree on a shared check: \"Would I want this said to me?\"" },
  { id: "speech-4", theme: "speech", text: "Ask your child today to give someone a specific, honest compliment: \"I noticed that you...\"" },
  { id: "speech-5", theme: "speech", text: "Tonight, talk about one thing your child almost said today but didn't, and why." },
  { id: "speech-6", theme: "speech", text: "If your child hears gossip today, talk through it together: \"What happens if this stops with you?\"" },

  { id: "education-1", theme: "education", text: "Spend fifteen minutes today learning something new together, starting with: \"Let's figure this out together.\"" },
  { id: "education-2", theme: "education", text: "Ask your child today what they're curious about, then say: \"Let's go find one real answer together.\"" },
  { id: "education-3", theme: "education", text: "Ask your child today what they're curious about right now, and spend ten minutes looking into it together." },
  { id: "education-4", theme: "education", text: "Tonight, share something you learned recently that surprised you, and ask what surprised them this week." },
  { id: "education-5", theme: "education", text: "The next time your child gets something wrong today, ask instead of correcting: \"What do you think happened there?\"" },
  { id: "education-6", theme: "education", text: "Pick one 'why' question your child has asked recently and actually go find the answer together." },

  { id: "honesty-1", theme: "honesty", text: "If a small mistake happens today, model owning it out loud: \"That one's on me — I got that wrong.\"" },
  { id: "honesty-2", theme: "honesty", text: "The next time you referee a disagreement today, say your reasoning out loud: \"Here's why I think this is fair.\"" },
  { id: "honesty-3", theme: "honesty", text: "If your child makes a small mistake today, thank them for telling you the truth about it, out loud." },
  { id: "honesty-4", theme: "honesty", text: "Ask your child tonight about a moment today when honesty was the harder choice, and how it went." },
  { id: "honesty-5", theme: "honesty", text: "Model owning a small mistake in front of your child today: \"I got that wrong, and here's what I'm doing about it.\"" },
  { id: "honesty-6", theme: "honesty", text: "Talk with your child today about the difference between a lie and a surprise, using a real example if you can." },
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
