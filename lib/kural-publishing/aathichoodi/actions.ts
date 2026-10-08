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
 * a complete sentence with nothing trailing after the closing quote in
 * `text` itself.
 *
 * `support` -- the panel's own muted "after" line (per explicit founder
 * direction that every episode's Slide 3 show one, not just the hand-
 * curated ones). This is a PROMPT TO HELP THE PARENT use the question
 * above it -- how to start it, what to do if the child is stuck, when to
 * say it -- the same role a curated episode's own hand-authored trailing
 * clause plays (e.g. episode 22: "Start with whatever they've been
 * saying, 'I'll do it later,' about."). It is NOT a restatement of the
 * aathichoodi's meaning (that's episode.simpleMeaning's job, used
 * elsewhere) and NOT an abstract insight about character development
 * (that's Slide 2/Understand's reframing line's job, understanding.ts) --
 * it stays concrete and operational, tied to this specific entry's own
 * question.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";

interface ActionTemplate extends Pickable {
  theme: ThemeId;
  text: string;
  support: string;
}

const ACTIONS: readonly ActionTemplate[] = [
  { id: "character-1", theme: "character", text: "Notice one moment today when your child does the right thing with no one watching, and name it out loud: \"I saw that, and it mattered.\"", support: "Say it the moment you notice it — waiting until later makes it feel like an afterthought." },
  { id: "character-2", theme: "character", text: "Pick one small rule your family already follows and explain why in one sentence: \"We do this because it's who we are.\"", support: "Keep the rule ordinary — brushing teeth or saying please works better than a big moral lesson." },
  { id: "character-3", theme: "character", text: "Tonight, ask your child about a moment today when doing right was hard, and just listen: \"Tell me what that was like.\"", support: "If nothing comes to mind right away, ask about yesterday instead." },
  { id: "character-4", theme: "character", text: "Point out one small honest choice you made today, out loud, in front of your child: \"I could have skipped that, but I didn't.\"", support: "A small one works best — returning extra change, admitting you forgot something." },
  { id: "character-5", theme: "character", text: "Ask your child today to describe someone they think has great character, then ask: \"What do they do that makes you say that?\"", support: "Let them pick anyone — a friend, a teacher, even a character from a show is a fine start." },
  { id: "character-6", theme: "character", text: "The next time no one's watching today, quietly ask your child: \"What would you do if I weren't here right now?\"", support: "Ask it as genuine curiosity, not a test — there's no answer you're hoping for." },

  { id: "self-control-1", theme: "self-control", text: "The next time anger starts rising today, agree on one signal that means: \"Let's pause before we speak.\"", support: "Agree on the signal now, in a calm moment — it won't stick if you're inventing it mid-argument." },
  { id: "self-control-2", theme: "self-control", text: "The next time your child wants more today, try one phrase before answering: \"Let's pause for ten seconds first.\"", support: "Count out loud together so the pause actually happens, instead of rushing past it." },
  { id: "self-control-3", theme: "self-control", text: "Tonight, name the pause out loud the moment you see your child use it: \"I noticed you stopped and thought about that.\"", support: "Say it right away, even mid-moment — waiting until bedtime loses the connection." },
  { id: "self-control-4", theme: "self-control", text: "Before bed, ask your child about one moment today they wanted to react but didn't: \"What helped you hold back?\"", support: "If they can't think of one, ask about a time it was hard instead — that's just as useful to talk through." },
  { id: "self-control-5", theme: "self-control", text: "Agree on a shared phrase for hard moments today: \"Let's breathe first, decide second.\"", support: "Try it on yourself first tonight, out loud, so they see you use it too." },
  { id: "self-control-6", theme: "self-control", text: "The next time your child is upset today, try asking instead of telling: \"Do you need a minute before we talk about this?\"", support: "If they say yes, actually give them the minute before bringing it up again." },

  { id: "generosity-1", theme: "generosity", text: "Before you use something today, ask your child: \"Is there someone who needs this more than we do?\"", support: "Ask it about something small and ordinary — a snack or a toy, not a big decision." },
  { id: "generosity-2", theme: "generosity", text: "Ask your child to choose one item they no longer need, then ask together: \"Who could use this more than us?\"", support: "Let them pick the item and the person — the choice matters more than the item itself." },
  { id: "generosity-3", theme: "generosity", text: "Ask your child today to give away one thing they'd normally keep for themselves, and say why: \"I want you to have this more than I do.\"", support: "Something small is enough — this works better as a quick moment than a big production." },
  { id: "generosity-4", theme: "generosity", text: "Notice a moment today your child gives without being asked, and name it: \"That was generous, and I saw it.\"", support: "Say it as soon as you notice — it loses its effect if you mention it hours later." },
  { id: "generosity-5", theme: "generosity", text: "At dinner tonight, ask your child: \"Who could you give something to this week, and what would you give?\"", support: "Help them land on something realistic they can actually do this week, not just talk about." },
  { id: "generosity-6", theme: "generosity", text: "Before your child spends on themselves today, pause and ask together: \"Is there someone this would help more?\"", support: "Ask it as a quick check, not a guilt trip — it's fine if the answer is still themselves sometimes." },

  { id: "family-1", theme: "family", text: "Spend five uninterrupted minutes with one family member today, and simply say: \"I just wanted to spend time with you.\"", support: "Set a timer if it helps — the point is five minutes with nothing else competing for attention." },
  { id: "family-2", theme: "family", text: "Ask a grandparent or parent one question today: \"What was it like when you were my age?\"", support: "If a grandparent isn't around to ask, you can answer this one yourself instead." },
  { id: "family-3", theme: "family", text: "Tonight, ask each family member to share one thing they're grateful another family member did this week.", support: "Go around in order so nobody has to volunteer first." },
  { id: "family-4", theme: "family", text: "Encourage your child today to help a sibling with something small, unprompted: \"Want a hand with that?\"", support: "Pick a moment where the sibling genuinely could use help, so the offer means something." },
  { id: "family-5", theme: "family", text: "Set aside device-free time tonight and just ask: \"What was the best part of your day?\"", support: "Put your own phone away too — the question lands differently when you're not holding one." },
  { id: "family-6", theme: "family", text: "Ask your child today what makes your family feel like a team, and really listen to the answer.", support: "Ask it casually, maybe in the car or at dinner, rather than as a sit-down conversation." },

  { id: "gratitude-1", theme: "gratitude", text: "Help your child write or say one thank-you today, starting with: \"Thank you for helping me with...\"", support: "A spoken thank-you works just as well if writing feels like too much today." },
  { id: "gratitude-2", theme: "gratitude", text: "At dinner tonight, go around the table and each finish this sentence: \"I'm grateful for...\"", support: "Go first yourself so everyone has an example to follow." },
  { id: "gratitude-3", theme: "gratitude", text: "Ask your child today to name one person who helped them this month that they haven't thanked yet.", support: "If they name someone, help them actually send the thank-you before the day ends." },
  { id: "gratitude-4", theme: "gratitude", text: "Tonight, help your child write a short note to someone who did something kind for them recently.", support: "Two or three honest sentences are plenty — it doesn't need to be long to count." },
  { id: "gratitude-5", theme: "gratitude", text: "At dinner, ask your child: \"What's something small someone did for you today that you're glad about?\"", support: "Prompt with an example if they're stuck — a held door, a shared seat, anything small counts." },
  { id: "gratitude-6", theme: "gratitude", text: "Encourage your child today to thank someone directly, by name, for something specific: \"Thank you for...\"", support: "Help them name the specific thing — a generic 'thanks for everything' is harder for the other person to feel." },

  { id: "responsibility-1", theme: "responsibility", text: "Pick one task your child already does, and do it together today, saying: \"Let's finish this properly, start to finish.\"", support: "Let them lead the parts they already know, and only step in where they actually need help." },
  { id: "responsibility-2", theme: "responsibility", text: "Give your child one small responsibility today, framed simply: \"This one is entirely yours to finish.\"", support: "Pick something they can realistically finish in one sitting today, not a multi-day task." },
  { id: "responsibility-3", theme: "responsibility", text: "Give your child a task today with no reminder planned, and afterward just notice it: \"You didn't need me to ask twice.\"", support: "Say it afterward even if it took longer than you'd have liked — the point is they got there." },
  { id: "responsibility-4", theme: "responsibility", text: "Ask your child tonight about something they said they'd do today: \"Did you get to finish that?\"", support: "If the answer is no, ask what got in the way before deciding what happens next." },
  { id: "responsibility-5", theme: "responsibility", text: "Let your child pick one responsibility to fully own this week, and say: \"This one's yours, start to finish.\"", support: "Let them choose which one — it sticks better than one you assign for them." },
  { id: "responsibility-6", theme: "responsibility", text: "If your child forgets something today, ask instead of reminding: \"What's your plan to make that right?\"", support: "Give them a moment to come up with their own plan before offering yours." },

  { id: "community-1", theme: "community", text: "Encourage your child today to walk up to someone who's often overlooked and say: \"Hi, want to join us?\"", support: "Practice saying the line together first if they're nervous to say it alone." },
  { id: "community-2", theme: "community", text: "Talk with your child today about someone they know, and ask: \"What makes them a good friend?\"", support: "Any friend they mention is a fine starting point — it doesn't need to be their closest one." },
  { id: "community-3", theme: "community", text: "Ask your child today who in their class or team might be feeling left out, and what one small thing they could do about it.", support: "Let the idea be theirs, even if it's smaller than what you might have suggested." },
  { id: "community-4", theme: "community", text: "Encourage your child to invite someone new into an activity today: \"Come join us.\"", support: "It can be as simple as one extra spot at the table or in the game." },
  { id: "community-5", theme: "community", text: "Tonight, ask your child: \"Who made you feel included this week, and how?\"", support: "Follow up by asking whether they've told that person it mattered." },
  { id: "community-6", theme: "community", text: "Point out a moment today your child included someone, and name it out loud: \"That was you making room for someone.\"", support: "Mention it in front of them the same day, even if it felt like a small moment." },

  { id: "devotion-1", theme: "devotion", text: "Take one quiet minute today, as a family, and simply say: \"Let's just be still together for a moment.\"", support: "No phones, no talking required — the stillness itself is the point." },
  { id: "devotion-2", theme: "devotion", text: "Share with your child today the story behind one family tradition, starting with: \"Do you know why we do this?\"", support: "Pick a tradition you actually remember the story behind, even a small one." },
  { id: "devotion-3", theme: "devotion", text: "Tonight, explain the story behind one small family ritual before doing it together.", support: "A sentence or two of explanation is enough before you begin." },
  { id: "devotion-4", theme: "devotion", text: "Take one quiet minute today and ask your child: \"What does this moment mean to you?\"", support: "Let them answer in their own words, even if it's not what you expected to hear." },
  { id: "devotion-5", theme: "devotion", text: "Invite your child to lead one small family ritual today, even just once.", support: "Let them do it their own way, even if it's not quite how you'd lead it yourself." },
  { id: "devotion-6", theme: "devotion", text: "Ask your child tonight: \"Is there a tradition of ours you'd want to keep going someday?\"", support: "Whatever they name, treat it as worth remembering, not just a passing answer." },

  { id: "speech-1", theme: "speech", text: "Before speaking in frustration today, try pausing to ask: \"Is this kind, and is this true?\"", support: "Say the question out loud yourself a few times, so they hear it before they're expected to use it." },
  { id: "speech-2", theme: "speech", text: "Catch one moment today to compliment someone sincerely, right in front of your child: \"I really appreciate that you did that.\"", support: "Pick something true and specific — your child notices when praise sounds genuine." },
  { id: "speech-3", theme: "speech", text: "Before your child speaks in anger today, agree on a shared check: \"Would I want this said to me?\"", support: "Agree on it in a calm moment — it won't help if you're introducing it mid-argument." },
  { id: "speech-4", theme: "speech", text: "Ask your child today to give someone a specific, honest compliment: \"I noticed that you...\"", support: "Help them think of something true and specific, not just a generic nice word." },
  { id: "speech-5", theme: "speech", text: "Tonight, talk about one thing your child almost said today but didn't, and why.", support: "If nothing comes to mind, ask about a moment they held back from saying something unkind." },
  { id: "speech-6", theme: "speech", text: "If your child hears gossip today, talk through it together: \"What happens if this stops with you?\"", support: "Keep the conversation about the choice in front of them, not about whoever said it first." },

  { id: "education-1", theme: "education", text: "Spend fifteen minutes today learning something new together, starting with: \"Let's figure this out together.\"", support: "Pick something neither of you already knows — figuring it out together is the point." },
  { id: "education-2", theme: "education", text: "Ask your child today what they're curious about, then say: \"Let's go find one real answer together.\"", support: "Follow their curiosity even if it's not a subject you'd have picked yourself." },
  { id: "education-3", theme: "education", text: "Ask your child today what they're curious about right now, and spend ten minutes looking into it together.", support: "Let the ten minutes run longer if the question turns out to be a good one." },
  { id: "education-4", theme: "education", text: "Tonight, share something you learned recently that surprised you, and ask what surprised them this week.", support: "Go first with your own answer — it makes theirs easier to share." },
  { id: "education-5", theme: "education", text: "The next time your child gets something wrong today, ask instead of correcting: \"What do you think happened there?\"", support: "Let them talk it through fully before you say whether they're right." },
  { id: "education-6", theme: "education", text: "Pick one 'why' question your child has asked recently and actually go find the answer together.", support: "If you can't remember one, just ask them again tonight — there's always a new one waiting." },

  { id: "honesty-1", theme: "honesty", text: "If a small mistake happens today, model owning it out loud: \"That one's on me — I got that wrong.\"", support: "Say it plainly, without over-explaining or excusing it afterward." },
  { id: "honesty-2", theme: "honesty", text: "The next time you referee a disagreement today, say your reasoning out loud: \"Here's why I think this is fair.\"", support: "Let them push back on your reasoning — it's the explanation that matters, not having the final word." },
  { id: "honesty-3", theme: "honesty", text: "If your child makes a small mistake today, thank them for telling you the truth about it, out loud.", support: "Say the thank-you before addressing the mistake itself — the honesty comes first." },
  { id: "honesty-4", theme: "honesty", text: "Ask your child tonight about a moment today when honesty was the harder choice, and how it went.", support: "If they didn't choose honesty that time, talk it through without making it a bigger deal than it needs to be." },
  { id: "honesty-5", theme: "honesty", text: "Model owning a small mistake in front of your child today: \"I got that wrong, and here's what I'm doing about it.\"", support: "Follow through on the fix, even a small one — that's what makes the words real." },
  { id: "honesty-6", theme: "honesty", text: "Talk with your child today about the difference between a lie and a surprise, using a real example if you can.", support: "A birthday surprise is an easy, low-stakes example to start with." },
];

export function selectAction(
  theme: ThemeId,
  episodeNumber: number,
  recentActionIds: readonly string[]
): { id: string; text: string; support: string } {
  const pool = ACTIONS.filter((a) => a.theme === theme);
  const template = pickFresh(pool, recentActionIds, episodeNumber);
  return { id: template.id, text: template.text, support: template.support };
}
