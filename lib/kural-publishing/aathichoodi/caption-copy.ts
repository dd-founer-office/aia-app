/**
 * Daily Aathichoodi Series — Caption-Only Copy
 * ----------------------------------------------------------------------------
 * Explicit founder correction: the caption generator (caption.ts) was
 * reusing the slide's own hook/tagline/CTA verbatim -- "same as the text
 * we already have in the slides." A caption is a separate text artifact
 * from the graphic (per the brief), so every line here is its own
 * writing, never copy-pasted from hooks.ts/taglines.ts/cta.ts. Same
 * deterministic themed-pool + anti-repetition pattern as everywhere else
 * in this engine (no LLM call anywhere in this app).
 *
 * Three pools:
 *   - OPENERS: a caption-only observation/statement (not a question, so it
 *     never converges on the slide hook's own phrasing or rhythm).
 *   - CLOSERS: a caption-only reflection/prompt, distinct from the slide's
 *     "X today. / Y tomorrow." tagline couplet.
 *   - CTAS: keyed by CtaTypeId (not theme) since the action itself is what
 *     cta.ts already classified -- just worded differently than the
 *     slide's own cta.copy for the same action.
 */

import { pickFresh, type Pickable } from "./selection";
import type { ThemeId } from "./themes";
import type { CtaTypeId } from "./cta";

interface ThemedTemplate extends Pickable {
  theme: ThemeId;
  text: string;
}

const OPENERS: readonly ThemedTemplate[] = [
  { id: "character-1", theme: "character", text: "Character shows up in the moments nobody's grading." },
  { id: "character-2", theme: "character", text: "Kids build who they are long before anyone's watching." },
  { id: "character-3", theme: "character", text: "Character isn't one big decision. It's the sum of a hundred small ones." },

  { id: "self-control-1", theme: "self-control", text: "The gap between feeling it and saying it. That's where growth lives." },
  { id: "self-control-2", theme: "self-control", text: "Patience isn't taught in one lecture. It's built in a hundred small pauses." },
  { id: "self-control-3", theme: "self-control", text: "The moment you want to react is exactly the moment that teaches the most." },

  { id: "generosity-1", theme: "generosity", text: "Generosity isn't about having extra. It's about noticing at all." },
  { id: "generosity-2", theme: "generosity", text: "The kids who give easiest are usually the ones who saw it modeled first." },
  { id: "generosity-3", theme: "generosity", text: "A generous kid isn't born that way. They watched someone go first." },

  { id: "family-1", theme: "family", text: "The ordinary moments are the ones kids remember longest." },
  { id: "family-2", theme: "family", text: "Family isn't built in the big events. It's built on a Tuesday." },
  { id: "family-3", theme: "family", text: "Connection doesn't need an occasion. It just needs attention." },

  { id: "gratitude-1", theme: "gratitude", text: "Noticing what you have is a skill, not a personality trait." },
  { id: "gratitude-2", theme: "gratitude", text: "Gratitude said out loud teaches faster than gratitude felt quietly." },
  { id: "gratitude-3", theme: "gratitude", text: "What a child appreciates, they tend to protect." },

  { id: "responsibility-1", theme: "responsibility", text: "Ownership is a habit before it's ever a value." },
  { id: "responsibility-2", theme: "responsibility", text: "Kids rise to exactly the responsibility they're handed. No more, no less." },
  { id: "responsibility-3", theme: "responsibility", text: "Nobody's born responsible. It's practiced, badly, until it isn't." },

  { id: "community-1", theme: "community", text: "Belonging starts with someone deciding to include, not wait to be included." },
  { id: "community-2", theme: "community", text: "The kids who notice who's left out usually learned to look." },
  { id: "community-3", theme: "community", text: "A kind community starts with one kid who decided to notice." },

  { id: "devotion-1", theme: "devotion", text: "Stillness is a strange thing to teach a child in a loud world." },
  { id: "devotion-2", theme: "devotion", text: "Devotion doesn't need an audience. That's usually how you know it's real." },
  { id: "devotion-3", theme: "devotion", text: "Some of the most important things a child learns, they learn in silence." },

  { id: "speech-1", theme: "speech", text: "Words leave a mark long after the moment that caused them fades." },
  { id: "speech-2", theme: "speech", text: "What a child hears at home becomes what they say everywhere else." },
  { id: "speech-3", theme: "speech", text: "A child's words are usually an echo of a voice they trust." },

  { id: "education-1", theme: "education", text: "Curiosity fades fast if nobody answers it." },
  { id: "education-2", theme: "education", text: "The best learning rarely happens at a desk." },
  { id: "education-3", theme: "education", text: "Not every lesson that matters comes with homework." },

  { id: "honesty-1", theme: "honesty", text: "Honesty is easiest to teach right after it costs something." },
  { id: "honesty-2", theme: "honesty", text: "Kids learn what's actually true by watching what adults actually do." },
  { id: "honesty-3", theme: "honesty", text: "A house where mistakes are safe to admit is a house where truth survives." },
];

const CLOSERS: readonly ThemedTemplate[] = [
  { id: "character-1", theme: "character", text: "Worth sitting with tonight, parent to parent." },
  { id: "character-2", theme: "character", text: "One line, one small shift. That's how it starts." },
  { id: "character-3", theme: "character", text: "Small and consistent beats big and rare, every time." },

  { id: "self-control-1", theme: "self-control", text: "Not a fix. A first step for a hard moment." },
  { id: "self-control-2", theme: "self-control", text: "Practiced calm today is a calmer kid next year." },
  { id: "self-control-3", theme: "self-control", text: "The pause is the practice." },

  { id: "generosity-1", theme: "generosity", text: "Small enough to try before the day ends." },
  { id: "generosity-2", theme: "generosity", text: "The habit matters more than the size of the gift." },
  { id: "generosity-3", theme: "generosity", text: "Let them see the giving, not just hear about it." },

  { id: "family-1", theme: "family", text: "The five minutes that actually stick." },
  { id: "family-2", theme: "family", text: "None of this needs to be perfect. Just present." },
  { id: "family-3", theme: "family", text: "Today counts. It doesn't have to be a big day." },

  { id: "gratitude-1", theme: "gratitude", text: "Say it out loud tonight. It counts more than you'd think." },
  { id: "gratitude-2", theme: "gratitude", text: "A habit worth starting before bedtime tonight." },
  { id: "gratitude-3", theme: "gratitude", text: "A short thank-you, said often, outlasts a big one said once." },

  { id: "responsibility-1", theme: "responsibility", text: "Ownership, not obligation. The difference matters." },
  { id: "responsibility-2", theme: "responsibility", text: "One small task, all the way through, today." },
  { id: "responsibility-3", theme: "responsibility", text: "Let the task be theirs, start to finish." },

  { id: "community-1", theme: "community", text: "Kindness that costs nothing but attention." },
  { id: "community-2", theme: "community", text: "The easiest values lesson to practice this week." },
  { id: "community-3", theme: "community", text: "Noticing who's left out is a skill worth building early." },

  { id: "devotion-1", theme: "devotion", text: "A minute of stillness is harder than it sounds. Try it anyway." },
  { id: "devotion-2", theme: "devotion", text: "Quiet, on purpose, once today." },
  { id: "devotion-3", theme: "devotion", text: "One quiet minute, on purpose, is enough to start." },

  { id: "speech-1", theme: "speech", text: "One pause before speaking changes more than you'd expect." },
  { id: "speech-2", theme: "speech", text: "The words your kids repeat are usually yours first." },
  { id: "speech-3", theme: "speech", text: "Say it the way you'd want it said back to you." },

  { id: "education-1", theme: "education", text: "Fifteen minutes of real curiosity beats an hour of screen time." },
  { id: "education-2", theme: "education", text: "One good question is worth chasing together tonight." },
  { id: "education-3", theme: "education", text: "Follow the question wherever it goes today." },

  { id: "honesty-1", theme: "honesty", text: "The small truths matter as much as the big ones." },
  { id: "honesty-2", theme: "honesty", text: "Model it once and watch how fast it sticks." },
  { id: "honesty-3", theme: "honesty", text: "Make the truth the easy choice, not the brave one." },
];

interface CtaTemplate extends Pickable {
  type: CtaTypeId;
  text: string;
}

const CTAS: readonly CtaTemplate[] = [
  { id: "save-1", type: "SAVE", text: "Bookmark this one for the next time you need it." },
  { id: "save-2", type: "SAVE", text: "Worth keeping somewhere you'll actually see it again." },

  { id: "share-1", type: "SHARE", text: "Tag a parent who needs to see this today." },
  { id: "share-2", type: "SHARE", text: "Send this to someone raising kids alongside you." },

  { id: "comment-1", type: "COMMENT", text: "Drop a comment. How does your family handle this one?" },
  { id: "comment-2", type: "COMMENT", text: "We're curious how this plays out in your house. Tell us below." },

  { id: "try-today-1", type: "TRY_TODAY", text: "Give this a real try before bedtime tonight." },
  { id: "try-today-2", type: "TRY_TODAY", text: "Test this out today and see what happens." },

  { id: "parent-reflection-1", type: "PARENT_REFLECTION", text: "No action needed today. Just sit with this one a while." },
  { id: "parent-reflection-2", type: "PARENT_REFLECTION", text: "Some days the reflection is the whole lesson." },

  { id: "aia-participation-1", type: "AIA_PARTICIPATION", text: "Curious what this looks like in practice? Aram in Action can show you." },
  { id: "aia-participation-2", type: "AIA_PARTICIPATION", text: "There's a real way to put this into motion. Ask us how." },

  { id: "distant-devotion-1", type: "DISTANT_DEVOTION", text: "Distant Devotion turns this into something lasting. Worth a look." },
  { id: "distant-devotion-2", type: "DISTANT_DEVOTION", text: "A quiet way to carry this further, from wherever you are." },

  { id: "story-testimonial-1", type: "STORY_TESTIMONIAL", text: "Has this shown up in your own family? We'd genuinely love to hear it." },
  { id: "story-testimonial-2", type: "STORY_TESTIMONIAL", text: "If this sounds familiar, tell us your version of it." },

  { id: "soft-enquiry-1", type: "SOFT_ENQUIRY", text: "Wondering how this connects to Aram in Action? Just ask." },
  { id: "soft-enquiry-2", type: "SOFT_ENQUIRY", text: "There's more behind this one if you're curious. DM us." },
];

export function selectCaptionOpener(
  theme: ThemeId,
  episodeNumber: number,
  recentOpenerIds: readonly string[]
): { id: string; text: string } {
  const pool = OPENERS.filter((o) => o.theme === theme);
  const template = pickFresh(pool, recentOpenerIds, episodeNumber);
  return { id: template.id, text: template.text };
}

export function selectCaptionCloser(
  theme: ThemeId,
  episodeNumber: number,
  recentCloserIds: readonly string[]
): { id: string; text: string } {
  const pool = CLOSERS.filter((c) => c.theme === theme);
  const template = pickFresh(pool, recentCloserIds, episodeNumber + 1);
  return { id: template.id, text: template.text };
}

export function selectCaptionCta(
  ctaType: CtaTypeId,
  episodeNumber: number,
  recentCtaIds: readonly string[]
): { id: string; text: string } {
  const pool = CTAS.filter((c) => c.type === ctaType);
  const template = pickFresh(pool, recentCtaIds, episodeNumber);
  return { id: template.id, text: template.text };
}
