/**
 * Daily Aathichoodi Series — Canonical Dataset
 * ----------------------------------------------------------------------------
 * The complete, fixed 109-line Aathichoodi sequence attributed to Avvaiyar,
 * in its ORIGINAL order. This file is the single source of truth for the
 * Tamil text itself — nothing downstream (content-engine.ts, the carousel
 * renderer, the static-card mapping) may reorder, merge, paraphrase, or
 * alter tamilText. Only the editorial layer (primaryTheme and the optional
 * curated.* fields) is new material this project adds on top of the
 * classical text.
 *
 * PROVENANCE: tamilText for all 109 lines was corrected against a founder-
 * supplied reference document ("Avvaiyar_Aathichoodi_Authentic_Order.docx"),
 * which uses word-separated (non-sandhi'd) spelling throughout, grouped by
 * classical Tamil consonant class (உயிர் வருக்கம், ககர வருக்கம், etc.).
 * 47 of 109 entries were corrected to match it -- the earlier dataset
 * (sourced from https://github.com/tk120404/Aathichudi) had used the
 * traditional sandhi'd/joined spelling for most lines while a few (like
 * Episode 1) were already split, so the file was internally inconsistent;
 * it now consistently follows the reference document's spelling. One
 * correction (Episode 23) was a genuine word-level fix, not just spacing
 * -- see that entry's own comment. `verified: false` on any entry means:
 * re-check that specific line against a primary printed source before
 * treating it as final -- per the standing rule, uncertainty is flagged,
 * never silently papered over.
 *
 * FOLLOW-UP CORRECTION PASS (2026-09): that spelling pass corrected
 * tamilText but left simpleMeaning stale on four episodes where the
 * founder-supplied reference document's own English gloss differs from
 * what was already here. Fixed:
 *   - Episode 10: "Live in harmony with the ways of the world" ->
 *     "Act virtuously" (the reference document's own gloss).
 *   - Episode 16 (சனி நீராடு): "Bathe regularly (traditionally, on
 *     Saturdays)" -> "Bathe in cool, refreshing water" -- சனி here is an
 *     archaic/dialectal word for "cold," not the day of the week.
 *   - Episode 33 (காப்பது விரதம்): "Protecting living beings is itself a
 *     sacred practice" -> "Standing by a vow you've undertaken... is
 *     itself a sacred discipline" -- விரதம் as perseverance in a
 *     commitment, not animal protection.
 *   - Episode 63 (தையல் சொல் கேளேல்): "Do not act purely on your spouse's
 *     word" -> "Do not blindly trust words spoken carelessly or by the
 *     immature" -- தையல் read as a general "unformed/young person," not
 *     specifically "wife."
 * Episode 23's simpleMeaning was already corrected as part of the
 * original spelling pass and needed no further change.
 *
 * primaryTheme is a new editorial tag (this project's own taxonomy, see
 * themes.ts) used only to pick which hook/scenario/action pools apply when
 * content-engine.ts composes an episode -- it carries no claim about the
 * classical text's own structure, which content-engine.ts's own docs
 * explain is NOT reordered or grouped by theme for display purposes.
 *
 * curated is an OPTIONAL hand-authored override for family_angle /
 * child_lesson / today_action / aia_connection / distant_devotion_connection
 * / recommended_cta_type -- present only on a handful of flagship episodes
 * authored with real editorial care as voice references. Every other
 * episode gets these fields COMPOSED at generation time by
 * content-engine.ts from the theme pools, which is the actual production
 * path for all 109 episodes (curated is a quality anchor/example set, not
 * a coverage requirement) -- see content-engine.ts's own doc comment for
 * why: hand-authoring bespoke prose for all 109 lines is a genuine editorial
 * project in its own right, not something to fabricate wholesale in one
 * pass, whereas a real, working, non-repetitive composition engine is
 * exactly what's needed to generate the complete series today and is
 * straightforward to refine per-episode later without a schema change.
 */

import type { ThemeId } from "./themes";
import type { CtaTypeId } from "./cta";

export interface CuratedEpisodeContent {
  /** Each field below is independently optional -- an episode can curate
   *  just one (e.g. only aiaConnection, to lock in a specific line without
   *  hand-authoring the rest) while every other field still composes from
   *  the theme pools as normal. See content-engine.ts's per-field checks
   *  (curated?.familyAngle, curated?.aiaConnection, etc.) -- never a single
   *  blanket "is this episode curated at all" check, which would silently
   *  turn every OTHER unset field into undefined. */
  familyAngle?: string;
  childLesson?: string;
  todayAction?: string;
  aiaConnection?: string;
  distantDevotionConnection?: string;
  recommendedCta?: CtaTypeId;
  /** Optional hand-authored override for Slide 2 (UNDERSTAND). When
   *  omitted, understanding.ts composes it from the theme pools like every
   *  other field content-engine.ts doesn't have curated prose for. */
  understanding?: string;
  /** Optional hand-authored override for Slide 1's hook, for the rare
   *  episode where an editor wants something more specific than the
   *  theme's own generated pool (see hooks.ts). Every other episode gets
   *  its own per-theme hook automatically -- there is no more single fixed
   *  hook repeated across the series. */
  hookOverride?: string;
}

export interface AathichoodiCanonEntry {
  episodeNumber: number;
  /** Canonical Tamil line. Never altered, reordered, or paraphrased. */
  tamilText: string;
  /** Concise modern English meaning (a translation of the fixed text, not
   *  new content) -- maps to the existing AathichoodiContent.meaning slot
   *  when a Static card is rendered. */
  simpleMeaning: string;
  /** Plain romanized pronunciation -- maps to the existing
   *  AathichoodiContent.easyReading slot, matching how the rest of this
   *  app already uses that field (see DEFAULT_AATHICHOODI_CONTENT in
   *  content-types.ts: "Aram Seya Virumbu" under "அறம் செய விரும்பு"). */
  transliteration: string;
  primaryTheme: ThemeId;
  verified: boolean;
  curated?: CuratedEpisodeContent;
  /** Optional syllable-level phonetic breakdown of tamilText, for Slide 2's
   *  reading board (shown as its own line directly under the Tamil line,
   *  e.g. "pa–ru vath–thē  pa–yir  sey" -- a single hyphen within a word's
   *  syllables, two spaces between words). Hand-authored per episode --
   *  this is a real phonetic segmentation call, not something mechanically
   *  derivable from tamilText/transliteration alone. When omitted (the
   *  default for most episodes until these are authored), Slide 2 falls
   *  back to the plain transliteration line it always used. */
  phoneticReading?: string;
}

export const AATHICHOODI_SOURCE_URL =
  "https://github.com/tk120404/Aathichudi";

export const AATHICHOODI_CANON: readonly AathichoodiCanonEntry[] = [
  { episodeNumber: 1, tamilText: "அறம் செய விரும்பு", simpleMeaning: "Desire to do righteous deeds.", transliteration: "Aram Seya Virumbu", primaryTheme: "character", verified: true,
    // GOLD MASTER: founder-approved benchmark for the whole series (see
    // content-engine.ts's own doc comment). Every field here was reviewed
    // and corrected in two passes -- this is the exact approved copy, not
    // a draft. Do not regenerate this episode from the pools; that would
    // replace the approved benchmark with an unreviewed composition.
    // tamilText is deliberately spelled split ("அறம் செய", not the sandhi'd
    // "அறஞ்செய" the earlier tk120404/Aathichudi source used) -- explicit
    // founder style choice that turned out to match the reference document's
    // own spelling convention (see this file's PROVENANCE comment), not a
    // typo; don't "fix" it back to the sandhi'd form.
    curated: {
      understanding: "Avvaiyar begins with a powerful idea: don't just do good when someone's watching or asking — want to. That desire, once a child has it, becomes the root every other value in this series grows from.",
      familyAngle: "Your older child sees a sibling struggling to reach something on a high shelf. No one asked them to help — but they climb up and get it anyway. That small, unprompted choice is exactly what today's line is about.",
      childLesson: "Doing good isn't a special occasion. It's a habit you build one small choice at a time.",
      todayAction: "Tonight, before bed, ask: \"What's one good thing you did today that nobody asked you to do?\" Whatever the answer, celebrate the wanting — not just the doing.",
      aiaConnection: "Wisdom becomes meaningful when it becomes action — that's the whole idea behind Aram in Action.",
      recommendedCta: "SAVE",
    },
  },
  // Episode 2 is deliberately NOT curated -- it composes entirely from the
  // theme pools (hooks.ts/scenarios.ts/actions.ts/voice.ts/
  // understanding.ts), same as 102 of the other 108 episodes will. This is
  // the system's own test case: proof the reusable engine produces
  // Episode-1-quality output, distinctly, without hand-authored prose.
  { episodeNumber: 2, tamilText: "ஆறுவது சினம்", simpleMeaning: "Anger is meant to cool down and pass.", transliteration: "Aaruvathu Sinam", primaryTheme: "self-control", verified: true },
  { episodeNumber: 3, tamilText: "இயல்வது கரவேல்", simpleMeaning: "Do not withhold help that is within your ability to give.", transliteration: "Iyalvathu Karavel", primaryTheme: "generosity", verified: true,
    // Founder explicitly asked to lock this episode's Slide 5 line to the
    // series' primary anchor phrase (matches AIA_CONNECTIONS[0] in
    // voice.ts) rather than let it rotate -- a deliberate editorial choice,
    // not a repeat of the bug where Episode 1's curated text silently
    // escaped anti-repetition tracking. Every other field on this episode
    // (familyAngle/todayAction/childLesson/hook/etc.) still composes live
    // from the theme pools as normal -- curated fields are independently
    // optional, see CuratedEpisodeContent's doc comment.
    curated: {
      aiaConnection: "Wisdom becomes meaningful when it becomes action — that's the whole idea behind Aram in Action.",
    },
  },
  { episodeNumber: 4, tamilText: "ஈவது விலக்கேல்", simpleMeaning: "Never stop someone else from giving.", transliteration: "Eevathu Vilakkel", primaryTheme: "generosity", verified: true,
    // Curated: uncurated, this composes from the generosity pool's "be
    // generous yourself" angle, but the actual line points the other way
    // -- never get in the way of someone ELSE giving.
    curated: {
      hookOverride: "Does your child encourage others to give, instead of getting in the way?",
      understanding: "Avvaiyar's wisdom here points the other way: don't be the reason someone else couldn't give. It isn't only about being generous yourself — it's about never standing in the way of someone else's generosity.",
      familyAngle: "A sibling wants to give away a toy or share their snack, and your child thinks it's a bad idea and says so. Encouraging them to go ahead instead of talking them out of it is exactly what this line means.",
      todayAction: "The next time someone in your family wants to give or share something today, encourage them instead of questioning it: \"That's really kind of you — go ahead.\"",
      childLesson: "Don't just be generous yourself — never get in the way of someone else being generous.",
    },
  },
  { episodeNumber: 5, tamilText: "உடையது விளம்பேல்", simpleMeaning: "Do not boast about what you own.", transliteration: "Udaiyathu Vilambel", primaryTheme: "character", verified: true,
    // Curated: uncurated, this composes from the character pool's "do
    // right when unseen" angle, which has nothing to do with the actual
    // line -- not boasting about possessions.
    curated: {
      hookOverride: "Does your child know that what they own doesn't need to be announced?",
      understanding: "Avvaiyar's wisdom here is simple: don't boast about what you own. True character shows in how you treat others, not in showing off what you have.",
      familyAngle: "Your child gets a new toy, gadget, or pair of shoes, and wants to show it off to everyone at school to feel important. Being proud of it quietly, without needing to make others feel like they have less, is what this line is really about.",
      todayAction: "The next time your child shows off something new today, gently ask: \"Does everyone need to know you have this, or can you just enjoy it?\"",
      childLesson: "What you own doesn't make you better than anyone. How you treat people does.",
    },
  },
  { episodeNumber: 6, tamilText: "ஊக்கமது கைவிடேல்", simpleMeaning: "Never give up your enthusiasm.", transliteration: "Ookkamathu Kaividel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 7, tamilText: "எண் எழுத்து இகழேல்", simpleMeaning: "Never look down on numbers and letters — keep learning them.", transliteration: "Enn Ezhuthu Igazhel", primaryTheme: "education", verified: true },
  { episodeNumber: 8, tamilText: "ஏற்பது இகழ்ச்சி", simpleMeaning: "Living by begging when you're able to work is shameful.", transliteration: "Erpathu Igazhchi", primaryTheme: "responsibility", verified: true,
    // Curated per explicit founder correction: this line is specifically
    // about self-reliance and the dignity of labor -- not begging when
    // you're able to earn your own way -- not generic task-completion
    // "responsibility" (the theme it's tagged under here only for pool
    // bookkeeping; the responsibility POOL's own hook/understanding/
    // scenario/action entries are about finishing tasks properly, which
    // has nothing to do with self-reliance, so composing this episode
    // from that pool silently drifted its meaning). Every field below is
    // hand-authored so this episode never drifts again regardless of
    // what the responsibility pool itself contains.
    curated: {
      hookOverride: "Does your child know the pride of earning something themselves?",
      understanding: "Avvaiyar draws a clear line here: there's no shame in honest work, however small — the real disgrace is choosing to depend on others' charity when you're able to earn your own way. This line is about self-reliance and the dignity of labor, not about refusing to ever accept real help.",
      familyAngle: "Your child wants a new toy and asks you to just buy it. Instead of handing it over, you ask them to earn part of it — extra chores, saved allowance, a small job around the house. Watching them work for it, instead of simply being given it, is exactly what today's line is teaching.",
      childLesson: "Earning something yourself feels different from being given it — and that difference is worth protecting.",
      todayAction: "The next time your child asks for something today, before saying yes, ask: \"What could you do to earn part of this yourself?\"",
      aiaConnection: "Self-reliance isn't coldness — it's dignity. Aram in Action is about helping people stand on their own, not just get by.",
      recommendedCta: "TRY_TODAY",
    },
  },
  { episodeNumber: 9, tamilText: "ஐயம் இட்டு உண்", simpleMeaning: "Give alms to those in need before you eat.", transliteration: "Aiyam Ittu Un", primaryTheme: "generosity", verified: true,
    curated: {
      familyAngle: "Before a family meal, there's often a moment to notice who has less — and choose to share first.",
      childLesson: "Generosity isn't what's left over. It's what you set aside on purpose, before you take your own share.",
      todayAction: "At today's meal, set aside a small portion — for a neighbor, a shelter, or anyone who needs it — before anyone eats.",
      aiaConnection: "This one line is Aram in Action's whole philosophy in four words: don't just feel for others, feed them.",
      recommendedCta: "AIA_PARTICIPATION",
    },
  },
  { episodeNumber: 10, tamilText: "ஒப்புரவு ஒழுகு", simpleMeaning: "Act virtuously.", transliteration: "Oppuravu Ozhugu", primaryTheme: "community", verified: true },
  { episodeNumber: 11, tamilText: "ஓதுவது ஒழியேல்", simpleMeaning: "Never stop studying.", transliteration: "Oathuvathu Ozhiyel", primaryTheme: "education", verified: true },
  { episodeNumber: 12, tamilText: "ஔவியம் பேசேல்", simpleMeaning: "Never speak with envy or jealousy.", transliteration: "Auviyam Pesel", primaryTheme: "speech", verified: true },
  { episodeNumber: 13, tamilText: "அஃகம் சுருக்கேல்", simpleMeaning: "Do not shortchange grain (or goods) when trading.", transliteration: "Ahkam Surukkel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 14, tamilText: "கண்டொன்று சொல்லேல்", simpleMeaning: "Do not say something different from what you actually saw.", transliteration: "Kandondru Sollel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 15, tamilText: "ஙப் போல் வளை", simpleMeaning: "Bend like the letter 'nga' — stay connected to your own people.", transliteration: "Ngapol Valai", primaryTheme: "community", verified: true },
  { episodeNumber: 16, tamilText: "சனி நீராடு", simpleMeaning: "Bathe in cool, refreshing water.", transliteration: "Sani Neeradu", primaryTheme: "self-control", verified: true,
    // Curated per founder report: uncurated, this episode composed entirely
    // from the generic "self-control" pool (siblings fighting, anger,
    // screen-time standoffs) -- thematically tagged correctly but with zero
    // connection to the episode's own literal meaning (bathing in cool
    // water), reading as made-up/unrelated content bolted onto the real
    // line. Every field below is hand-authored around the actual meaning --
    // a small, concrete bodily discipline -- instead of general anger/
    // patience content, same fix pattern as episode 8's own curated block.
    curated: {
      hookOverride: "Does your child follow through on a hard morning routine, even when it's tempting to skip it?",
      understanding: "Avvaiyar's wisdom here is simple: bathe in cool, refreshing water. It's a small, concrete discipline — doing something bracing and unglamorous, on purpose, because it's good for you, not because it's easy.",
      familyAngle: "Your child would rather skip the shower and go straight to screen time this morning. Getting up and doing it anyway, without being nagged twice, is this Aathichoodi, in one ordinary morning.",
      todayAction: "Notice one small daily discipline your child follows through on without complaint today, and name it: \"I saw you do that even though you didn't feel like it.\"",
      childLesson: "Some good habits aren't fun in the moment — they're worth keeping anyway.",
    },
  },
  { episodeNumber: 17, tamilText: "ஞயம்பட உரை", simpleMeaning: "Speak so that your words bring sweetness to the listener.", transliteration: "Nyayampada Urai", primaryTheme: "speech", verified: true },
  { episodeNumber: 18, tamilText: "இடம்பட வீடு எடேல்", simpleMeaning: "Do not build a house larger than you need.", transliteration: "Idampada Veedu Edel", primaryTheme: "responsibility", verified: true,
    // Curated per founder report: uncurated, this episode pulled from the
    // generic "responsibility" pool (finishing chores, keeping promises) --
    // nothing to do with the actual line, which is about not wanting more
    // than you need. Every field below is written plainly and tied to the
    // real meaning instead, same fix pattern as episodes 8 and 16.
    curated: {
      hookOverride: "Does your child know when \"enough\" is actually enough?",
      understanding: "Avvaiyar's wisdom here is simple: don't build a house bigger than you need. It isn't only about houses. It's about not wanting more just because you can get more.",
      familyAngle: "Your child wants a bigger room, or a second toy just like the one they already have. Stopping to ask \"do I really need this?\" before asking for it is what this line is really about.",
      todayAction: "Before buying or asking for something today, ask together: \"Do we need this, or do we just want it?\"",
      childLesson: "More isn't always better. Sometimes enough is better.",
    },
  },
  { episodeNumber: 19, tamilText: "இணக்கம் அறிந்து இணங்கு", simpleMeaning: "Know a person's true character before befriending them.", transliteration: "Inakkam Arindhu Inangu", primaryTheme: "community", verified: true,
    curated: {
      hookOverride: "Does your child know how to tell who's a good friend before getting close to them?",
      understanding: "Avvaiyar's wisdom here is simple: know someone well before you get close to them. Friendship should come after you understand who someone really is, not before.",
      familyAngle: "Your child wants to be close friends with someone new, right away. Taking a little time to notice how that person actually treats others, before trusting them completely, is this Aathichoodi in real life.",
      todayAction: "Ask your child today: \"What have you noticed about how your new friend treats other people?\"",
      childLesson: "Get to know someone first. Closeness should come after you understand who they really are, not before.",
      aiaConnection: "Knowing someone's true character before trusting them is one thing — Aram in Action helps your child practice that kind of discernment, not just hear about it.",
    },
  },
  { episodeNumber: 20, tamilText: "தந்தை தாய்ப் பேண்", simpleMeaning: "Care for and protect your father and mother.", transliteration: "Thandhai Thaai Pen", primaryTheme: "family", verified: true,
    curated: {
      familyAngle: "The quiet, unglamorous work of checking in on aging parents, or simply thanking them, often gets crowded out by a busy week.",
      childLesson: "The people who cared for you when you couldn't care for yourself deserve that same care back, for as long as they need it.",
      todayAction: "Call, visit, or simply sit with a parent or grandparent today — no occasion needed.",
      aiaConnection: "Protecting family is the first circle of Aram in Action — action starts closest to home before it reaches the world.",
      distantDevotionConnection: "For families honoring a parent who has passed, Distant Devotion offers a way to keep this care alive through remembrance.",
      recommendedCta: "DISTANT_DEVOTION",
    },
  },
  { episodeNumber: 21, tamilText: "நன்றி மறவேல்", simpleMeaning: "Never forget a kindness done to you.", transliteration: "Nandri Maravel", primaryTheme: "gratitude", verified: true,
    curated: {
      familyAngle: "A grandmother's sacrifices, a teacher's patience, a friend's help in hard times — easy to receive, easy to forget.",
      childLesson: "Remembering who helped you isn't just politeness — it's what keeps a family and a community bound together.",
      todayAction: "Ask your child to name one person who helped them this week, and help them say thank you today.",
      aiaConnection: "Gratitude remembered becomes gratitude in action — the same spirit that drives every Aram in Action initiative.",
      recommendedCta: "PARENT_REFLECTION",
    },
  },
  { episodeNumber: 22, tamilText: "பருவத்தே பயிர் செய்", simpleMeaning: "Sow the crop in its proper season.", transliteration: "Paruvathey Payirsey", primaryTheme: "responsibility", verified: true,
    // Curated: uncurated, this composes from the responsibility pool's
    // "finish your chores properly" angle -- the actual line is about
    // TIMING (acting at the right moment), not task-completion.
    // phoneticReading: founder-supplied (Figma Slide 2 redesign).
    phoneticReading: "pa–ru vath–thē  pa–yir  sey",
    curated: {
      hookOverride: "Does your child know that the right time to act is now, not later?",
      understanding: "Avvaiyar's wisdom here uses farming: sow the crop in its proper season, not whenever it's convenient. A farmer who waits too long loses the harvest — some things in life only work if you do them at the right time, not late.",
      familyAngle: "Your child has a school project due in two weeks and keeps putting it off, thinking there's plenty of time. By the time they start, the time that actually mattered is already gone.",
      // The trailing sentence (after the quoted question) is founder-
      // supplied (Figma Slide 4 redesign) -- splitQuotedAction's "after"
      // segment, drawn as the panel's muted supporting line.
      todayAction: "Ask your child today: \"What's one thing you've been putting off that really needs to start now, not later?\" Start with whatever they've been saying, \"I'll do it later,\" about.",
      childLesson: "Some things only work if you do them at the right time. Waiting too long can lose the chance completely.",
      // Founder-supplied (Figma Slide 5 redesign) -- a single centered
      // statement now, not the lead/trailing-clause em-dash shape most
      // other episodes' generated aiaConnection has.
      aiaConnection: "Aram in Action turns a lesson in responsibility into something your child actually lives out.",
      // Guarantees the TRY_TODAY CTA copy ("Don't just read it — try
      // today's action...") the Figma mockup shows, rather than leaving
      // it to classifyCta's own rotation/history logic.
      recommendedCta: "TRY_TODAY",
    },
  },
  // Corrected from the earlier "மன்றுபறித் துண்ணேல்" (mandru = court/
  // tribunal) to the reference document's "மண் பறித்து உண்ணேல்" (maN =
  // land/earth) -- a genuine word-level fix, not just a spacing/sandhi
  // difference like the other 46 corrections in this file. simpleMeaning
  // updated to match: this line is specifically about not seizing land
  // that isn't yours, not the broader "position/bribery" framing the old
  // (incorrect) word had implied.
  { episodeNumber: 23, tamilText: "மண் பறித்து உண்ணேல்", simpleMeaning: "Do not seize land that is not rightfully yours.", transliteration: "Man Parithu Unnel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 24, tamilText: "இயல்பு அலாதன செய்யேல்", simpleMeaning: "Do not act against good, natural conduct.", transliteration: "Iyalbu Alathana Seyyel", primaryTheme: "character", verified: true },
  { episodeNumber: 25, tamilText: "அரவம் ஆட்டேல்", simpleMeaning: "Do not handle or provoke a snake.", transliteration: "Aravam Aattel", primaryTheme: "character", verified: true,
    // Curated: uncurated, this composes from the character pool's "do
    // right when unseen" angle -- the actual line is about not provoking
    // needless danger, a different idea entirely.
    curated: {
      hookOverride: "Does your child know that some risks just aren't worth taking, even to show off?",
      understanding: "Avvaiyar's wisdom here is literal: don't play with a snake. It isn't really about snakes — it's about not provoking danger just to prove you're brave or because it seems exciting.",
      familyAngle: "Your child wants to try something clearly risky — climbing somewhere unsafe, teasing an unfamiliar dog, daring a friend to do something dangerous — just because it feels exciting in the moment.",
      todayAction: "The next time your child wants to try something risky today just for a thrill, ask together: \"Is this worth the risk, or just the excitement?\"",
      childLesson: "Being brave doesn't mean taking every risk. Knowing which risks aren't worth it is its own kind of wisdom.",
    },
  },
  { episodeNumber: 26, tamilText: "இலவம் பஞ்சில் துயில்", simpleMeaning: "Sleep on a cotton-soft bed (rest with proper care for your body).", transliteration: "Ilavam Panjil Thuyil", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about bodily
    // self-care through proper rest, same drift pattern as episode 16.
    curated: {
      hookOverride: "Does your child take rest as seriously as they take play?",
      understanding: "Avvaiyar's wisdom here is simple: rest your body properly, with real care, not however's convenient. Taking care of your body through good rest is its own quiet discipline, easy to skip when there's always something more exciting to do.",
      familyAngle: "Your child wants to stay up late one more time, again, even though they're clearly tired. Choosing proper rest over squeezing in one more thing is exactly what this line is about.",
      todayAction: "Tonight, help your child wind down for proper rest at a reasonable time, and name it: \"Taking care of your body matters, even when staying up feels more fun.\"",
      childLesson: "Resting well isn't lazy. It's how you take care of yourself so you can actually show up tomorrow.",
    },
  },
  { episodeNumber: 27, tamilText: "வஞ்சகம் பேசேல்", simpleMeaning: "Never speak with deceit.", transliteration: "Vanjagam Pesel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 28, tamilText: "அழகு அலாதன செய்யேல்", simpleMeaning: "Do not do disgraceful things.", transliteration: "Azhagu Alathana Seyyel", primaryTheme: "character", verified: true },
  { episodeNumber: 29, tamilText: "இளமையில் கல்", simpleMeaning: "Learn while you are young.", transliteration: "Ilamaiyil Kal", primaryTheme: "education", verified: true,
    curated: {
      familyAngle: "Homework fatigue and busy schedules can make learning feel like a chore instead of a gift while there's still time for it.",
      childLesson: "The years when learning comes easiest don't come back — what you build now, you carry for life.",
      todayAction: "Spend fifteen unhurried minutes today learning something new together — a word, a skill, a story.",
      aiaConnection: "A mind shaped early toward learning is more likely to grow into a life shaped toward action.",
      recommendedCta: "SAVE",
    },
  },
  { episodeNumber: 30, tamilText: "அறனை மறவேல்", simpleMeaning: "Never forget righteousness.", transliteration: "Aranai Maravel", primaryTheme: "character", verified: true },
  { episodeNumber: 31, tamilText: "அனந்தல் ஆடேல்", simpleMeaning: "Do not indulge in excessive sleep.", transliteration: "Anandhal Aadel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 32, tamilText: "கடிவது மற", simpleMeaning: "Let go of the urge to scold or rebuke in anger.", transliteration: "Kadivathu Mara", primaryTheme: "self-control", verified: true },
  { episodeNumber: 33, tamilText: "காப்பது விரதம்", simpleMeaning: "Standing by a vow you've undertaken, without abandoning it, is itself a sacred discipline.", transliteration: "Kaappathu Viratham", primaryTheme: "generosity", verified: true },
  { episodeNumber: 34, tamilText: "கிழமைப்பட வாழ்", simpleMeaning: "Live so that your body and wealth are of use to others.", transliteration: "Kizhamaipada Vaazh", primaryTheme: "responsibility", verified: true,
    // Curated: uncurated, this composes from the responsibility pool's
    // "finish your chores properly" angle -- the actual line is about
    // putting what you have and can do to use for OTHERS, closer to
    // service than task-completion.
    curated: {
      hookOverride: "Does your child know that what they have and what they can do is meant to help others too?",
      understanding: "Avvaiyar's wisdom here is simple: live so that your body and what you have are actually useful to others — not just to yourself. What you can do, and what you own, means more when it helps someone besides you.",
      familyAngle: "Your child is strong, skilled, or has something useful, and a neighbor or classmate could really use that help. Offering it, instead of keeping it just for themselves, is exactly what this line means.",
      todayAction: "Ask your child today: \"Is there something you're good at, or something you have, that could help someone else this week?\"",
      childLesson: "What you can do, and what you have, means more when you use it to help someone else too.",
    },
  },
  { episodeNumber: 35, tamilText: "கீழ்மை அகற்று", simpleMeaning: "Remove base or unworthy conduct from yourself.", transliteration: "Keezhmai Agatru", primaryTheme: "character", verified: true },
  { episodeNumber: 36, tamilText: "குணமது கைவிடேல்", simpleMeaning: "Never let go of good character.", transliteration: "Gunamathu Kaividel", primaryTheme: "character", verified: true },
  { episodeNumber: 37, tamilText: "கூடிப் பிரியேல்", simpleMeaning: "Having befriended someone good, do not abandon them.", transliteration: "Koodi Piriyel", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about loyalty
    // to a good friendship you already have, a different idea.
    curated: {
      hookOverride: "Does your child stick with a good friend, even when a newer, more exciting friendship shows up?",
      understanding: "Avvaiyar's wisdom here is about loyalty: once you've found a good friend, don't just drop them. Making a good friend is only half of it — staying one is the harder, more important half.",
      familyAngle: "Your child makes a new, more exciting friend and starts drifting away from an old, genuinely good one without really meaning to. Noticing that drift, and making the effort to stay close anyway, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Is there a good friend you haven't checked in with in a while? Reach out to them today.\"",
      childLesson: "Making a good friend is easy. Staying one takes more effort — and it's worth it.",
      aiaConnection: "A friendship worth having is worth keeping — Aram in Action is about actually following through on the values we claim to have, loyalty included.",
    },
  },
  { episodeNumber: 38, tamilText: "கெடுப்பது ஒழி", simpleMeaning: "Give up the habit of ruining others.", transliteration: "Keduppathu Ozhi", primaryTheme: "character", verified: true },
  { episodeNumber: 39, tamilText: "கேள்வி முயல்", simpleMeaning: "Make effort to listen to and learn from the wise.", transliteration: "Kelvi Muyal", primaryTheme: "education", verified: true },
  { episodeNumber: 40, tamilText: "கைவினை கரவேல்", simpleMeaning: "Do not hide the craft/skill your hands know.", transliteration: "Kaivinai Karavel", primaryTheme: "responsibility", verified: true,
    // Curated: uncurated, this composes from the responsibility pool's
    // "finish your chores properly" angle -- the actual line is about
    // sharing/using a skill you have, not task-completion.
    curated: {
      hookOverride: "Does your child share what they're good at, instead of keeping it to themselves?",
      understanding: "Avvaiyar's wisdom here is simple: don't hide a skill you actually have. A skill kept hidden helps no one — not even you. What you're good at is meant to be used, and shared.",
      familyAngle: "Your child is good at something — drawing, fixing things, explaining homework — and a sibling or friend could really use that help. Offering to teach or help instead of keeping it to themselves is exactly what this line means.",
      todayAction: "Ask your child today: \"What are you good at that you could teach or help someone else with this week?\"",
      childLesson: "A skill you keep to yourself helps no one. Share what you're good at.",
    },
  },
  { episodeNumber: 41, tamilText: "கொள்ளை விரும்பேல்", simpleMeaning: "Do not desire to plunder or take what is not yours.", transliteration: "Kollai Virumbel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 42, tamilText: "கோதாட்டு ஒழி", simpleMeaning: "Give up flawed or dishonest games.", transliteration: "Kothaadu Ozhi", primaryTheme: "character", verified: true },
  { episodeNumber: 43, tamilText: "கௌவை அகற்று", simpleMeaning: "Remove slander and vilifying talk.", transliteration: "Kauvai Agatru", primaryTheme: "speech", verified: true },
  { episodeNumber: 44, tamilText: "சக்கர நெறி நில்", simpleMeaning: "Stand within the rule of law (the ruler's just order).", transliteration: "Chakkara Nerinil", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about following
    // fair rules even when inconvenient, a different idea.
    curated: {
      hookOverride: "Does your child follow the rules even when nobody's enforcing them?",
      understanding: "Avvaiyar's wisdom here is about living within fair rules, not just the ones that are convenient. A society holds together when people follow its rules even when breaking one would be easy and unnoticed.",
      familyAngle: "Your child finds a rule at school or in a game inconvenient and quietly considers bending it since no one would notice. Following it anyway, even when it's inconvenient, is exactly what this line is about.",
      todayAction: "The next time a rule feels inconvenient to your child today, ask: \"What happens if everyone decided rules were optional when they're inconvenient?\"",
      childLesson: "Rules only work if people follow them even when it's inconvenient. That includes you.",
      aiaConnection: "Following fair rules even when it's inconvenient is a value worth practicing, not just agreeing with — which is exactly what Aram in Action is about.",
    },
  },
  { episodeNumber: 45, tamilText: "சான்றோர் இனத்து இரு", simpleMeaning: "Keep the company of the wise and virtuous.", transliteration: "Saandror Inathu Iru", primaryTheme: "community", verified: true },
  { episodeNumber: 46, tamilText: "சித்திரம் பேசேல்", simpleMeaning: "Do not speak falsehood as though it were true.", transliteration: "Chithiram Pesel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 47, tamilText: "சீர்மை மறவேல்", simpleMeaning: "Never forget the qualities that bring honor.", transliteration: "Seermai Maravel", primaryTheme: "character", verified: true },
  { episodeNumber: 48, tamilText: "சுளிக்கச் சொல்லேல்", simpleMeaning: "Do not speak in a way that provokes anger in the listener.", transliteration: "Sulikka Sollel", primaryTheme: "speech", verified: true },
  { episodeNumber: 49, tamilText: "சூது விரும்பேல்", simpleMeaning: "Never desire gambling.", transliteration: "Soothu Virumbel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 50, tamilText: "செய்வன திருந்தச் செய்", simpleMeaning: "Whatever you do, do it properly and well.", transliteration: "Seyvana Thiruntha Sey", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 51, tamilText: "சேரிடம் அறிந்து சேர்", simpleMeaning: "Know the right place before you join it.", transliteration: "Seridam Arindhu Ser", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about
    // discernment before joining a group/environment, a different idea,
    // same drift pattern as episode 19.
    curated: {
      hookOverride: "Does your child think about what a group is actually like before joining it?",
      understanding: "Avvaiyar's wisdom here is about discernment: know what you're joining before you join it. A group, a team, a friend circle — it's worth understanding what it's actually like before you commit to being part of it.",
      familyAngle: "Your child is excited to join a new group or team without knowing much about how they treat people. Asking a few questions first — instead of joining just because it sounds exciting — is exactly what this line means.",
      todayAction: "Before your child joins something new this week, ask together: \"What do you actually know about this group, and how they treat people?\"",
      childLesson: "Know what you're joining before you join it. Excitement isn't the same as knowing.",
      aiaConnection: "Thinking before joining in is a value worth practicing deliberately — which is exactly what Aram in Action is about: turning a value like this into action, not just advice.",
    },
  },
  { episodeNumber: 52, tamilText: "சையெனத் திரியேல்", simpleMeaning: "Do not wander about in a way that draws others' scorn.", transliteration: "Saiyena Thiriyel", primaryTheme: "character", verified: true },
  { episodeNumber: 53, tamilText: "சொல் சோர்வுபடேல்", simpleMeaning: "Do not let carelessness creep into your speech.", transliteration: "Sol Sorvu Padel", primaryTheme: "speech", verified: true },
  { episodeNumber: 54, tamilText: "சோம்பித் திரியேல்", simpleMeaning: "Do not wander about in laziness.", transliteration: "Sombi Thiriyel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 55, tamilText: "தக்கோன் எனத் திரி", simpleMeaning: "Conduct yourself so others recognize you as trustworthy.", transliteration: "Thakkon Enath Thiri", primaryTheme: "character", verified: true },
  { episodeNumber: 56, tamilText: "தானமது விரும்பு", simpleMeaning: "Desire to give charity to those who deserve it.", transliteration: "Thaanamathu Virumbu", primaryTheme: "generosity", verified: true },
  { episodeNumber: 57, tamilText: "திருமாலுக்கு அடிமை செய்", simpleMeaning: "Be devoted in service to the divine (Tirumal).", transliteration: "Thirumaalukku Adimai Sey", primaryTheme: "devotion", verified: true },
  { episodeNumber: 58, tamilText: "தீவினை அகற்று", simpleMeaning: "Keep sinful deeds away from yourself.", transliteration: "Theevinai Agatru", primaryTheme: "character", verified: true },
  { episodeNumber: 59, tamilText: "துன்பத்திற்கு இடம் கொடேல்", simpleMeaning: "Do not give room to hardship (do not let it stop your effort).", transliteration: "Thunbathirku Idam Kodel", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about resilience
    // through hardship, a different idea.
    curated: {
      hookOverride: "Does your child keep going when something gets genuinely hard?",
      understanding: "Avvaiyar's wisdom here is about resilience: don't let hardship stop your effort. A hard moment is real, but letting it be the reason you quit is a choice — and a different one is always possible.",
      familyAngle: "Your child hits a genuinely hard moment — a tough assignment, a lost game, a friendship problem — and wants to give up on it entirely. Encouraging them to keep going, even just one more try, is exactly what this line is about.",
      todayAction: "The next time something feels genuinely hard for your child today, ask: \"What's one more thing you could try before deciding this is impossible?\"",
      childLesson: "Hard moments are real. Letting them stop you completely is still a choice — and not the only one.",
    },
  },
  { episodeNumber: 60, tamilText: "தூக்கி வினை செய்", simpleMeaning: "Weigh things carefully before you act.", transliteration: "Thooki Vinaisey", primaryTheme: "responsibility", verified: true,
    // Curated: uncurated, this composes from the responsibility pool's
    // "finish your chores properly" angle -- the actual line is about
    // deliberation before acting, a different idea.
    curated: {
      hookOverride: "Does your child stop to think before acting, especially on something big?",
      understanding: "Avvaiyar's wisdom here is about thinking before acting. Weigh a decision properly before you act on it — not after, when it's already too late to change your mind.",
      familyAngle: "Your child is about to make a decision — spend their savings, say something in anger, agree to something big — without really thinking it through. Pausing to actually weigh it first is exactly what this line means.",
      todayAction: "Before your child decides something big today, ask: \"Have you actually thought this through, or are you deciding fast because it feels good right now?\"",
      childLesson: "A decision made in a hurry and a decision made with thought can look the same in the moment — but they rarely turn out the same.",
    },
  },
  { episodeNumber: 61, tamilText: "தெய்வம் இகழேல்", simpleMeaning: "Never scorn the divine.", transliteration: "Deivam Igazhel", primaryTheme: "devotion", verified: true },
  { episodeNumber: 62, tamilText: "தேசத்தோடு ஒட்டி வாழ்", simpleMeaning: "Live in harmony with your country/community.", transliteration: "Desathodu Otti Vaazh", primaryTheme: "community", verified: true },
  { episodeNumber: 63, tamilText: "தையல் சொல் கேளேல்", simpleMeaning: "Do not blindly trust words spoken carelessly or by the immature.", transliteration: "Thaiyalsol Kelel", primaryTheme: "family", verified: true },
  { episodeNumber: 64, tamilText: "தொன்மை மறவேல்", simpleMeaning: "Never forget old, established bonds of friendship.", transliteration: "Thonmai Maravel", primaryTheme: "gratitude", verified: true },
  { episodeNumber: 65, tamilText: "தோற்பன தொடரேல்", simpleMeaning: "Do not pursue things bound to fail.", transliteration: "Thorpana Thodarel", primaryTheme: "responsibility", verified: true,
    // Curated: uncurated, this composes from the responsibility pool's
    // "finish what you start" angle -- the actual line is about knowing
    // when a pursuit genuinely isn't working, a different idea.
    curated: {
      hookOverride: "Does your child know the difference between persistence and stubbornness?",
      understanding: "Avvaiyar's wisdom here is about knowing when to stop: don't keep chasing something that's clearly not going to work. Sticking with things matters, but so does knowing when a path genuinely isn't working anymore.",
      familyAngle: "Your child keeps trying the exact same approach to something that clearly isn't working — a strategy in a game, a way of asking for something — instead of trying something different or letting it go.",
      todayAction: "If your child is stuck repeating something that isn't working today, ask: \"Is this still worth trying the same way, or is it time for something different?\"",
      childLesson: "Trying hard matters. So does noticing when the thing you're trying just isn't going to work.",
    },
  },
  { episodeNumber: 66, tamilText: "நன்மை கடைப்பிடி", simpleMeaning: "Hold on firmly to doing good.", transliteration: "Nanmai Kadaipidi", primaryTheme: "character", verified: true },
  { episodeNumber: 67, tamilText: "நாடு ஒப்பன செய்", simpleMeaning: "Do what your community would approve of.", transliteration: "Naadu Oppana Sey", primaryTheme: "community", verified: true },
  { episodeNumber: 68, tamilText: "நிலையில் பிரியேல்", simpleMeaning: "Do not depart from a good, steady standing.", transliteration: "Nilaiyil Piriyel", primaryTheme: "character", verified: true },
  { episodeNumber: 69, tamilText: "நீர் விளையாடேல்", simpleMeaning: "Do not play recklessly in deep water.", transliteration: "Neervilai Yaadel", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about physical safety,
    // the same drift pattern as episode 25.
    curated: {
      hookOverride: "Does your child take real physical risks seriously, not just exciting ones?",
      understanding: "Avvaiyar's wisdom here is literal: don't play recklessly in deep water. It's about respecting real danger, not being reckless with your own safety just because something feels like fun in the moment.",
      familyAngle: "Your child wants to go further out, climb higher, or push a physical limit than is actually safe, because it feels exciting. Knowing where the real line is, and stopping there, is exactly what this line is about.",
      todayAction: "The next time your child pushes a physical limit today, ask: \"Is this still safe, or just exciting?\"",
      childLesson: "Fun and safe aren't always the same thing. Knowing the difference matters more than knowing how to have fun.",
    },
  },
  { episodeNumber: 70, tamilText: "நுண்மை நுகரேல்", simpleMeaning: "Do not consume things that harm your health.", transliteration: "Nunmai Nugarel", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about health/body
    // care, a different idea.
    curated: {
      hookOverride: "Does your child know that what they put into their body matters, even when it's tempting?",
      understanding: "Avvaiyar's wisdom here is about care for your own body: don't consume what actually harms your health, even when it's tempting in the moment. What feels good right now and what's actually good for you aren't always the same thing.",
      familyAngle: "Your child wants to eat or drink something they know isn't good for them, just because it's there and tempting. Choosing otherwise, even when no one would stop them, is exactly what this line is about.",
      todayAction: "The next time your child reaches for something they know isn't good for them today, ask together: \"Is this actually good for you, or just tempting right now?\"",
      childLesson: "What feels good right now and what's actually good for you aren't always the same thing. Learning the difference takes practice.",
    },
  },
  { episodeNumber: 71, tamilText: "நூல் பல கல்", simpleMeaning: "Learn from many books.", transliteration: "Noolpala Kal", primaryTheme: "education", verified: true },
  { episodeNumber: 72, tamilText: "நெற்பயிர் விளைவு செய்", simpleMeaning: "Grow the paddy crop with real effort.", transliteration: "Nerpayir Vilaivu Sey", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 73, tamilText: "நேர்பட ஒழுகு", simpleMeaning: "Conduct yourself in an upright, straightforward way.", transliteration: "Nerpada Ozhugu", primaryTheme: "character", verified: true },
  { episodeNumber: 74, tamilText: "நைவினை நணுகேல்", simpleMeaning: "Do not go near deeds that cause others to suffer.", transliteration: "Naivinai Nanugel", primaryTheme: "character", verified: true },
  { episodeNumber: 75, tamilText: "நொய்ய உரையேல்", simpleMeaning: "Do not speak trivial, empty words.", transliteration: "Noiya Uraiyel", primaryTheme: "speech", verified: true },
  { episodeNumber: 76, tamilText: "நோய்க்கு இடம் கொடேல்", simpleMeaning: "Do not give an opening for illness (through careless habits).", transliteration: "Noikku Idam Kodel", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about health habits
    // and prevention, a different idea.
    curated: {
      hookOverride: "Does your child take small health habits seriously, even when no one's checking?",
      understanding: "Avvaiyar's wisdom here is about prevention: don't let carelessness open the door to illness. Small habits — washing hands, resting when sick, not pushing through when your body needs a break — are easy to skip, which is exactly why they matter.",
      familyAngle: "Your child is tired or unwell and wants to push through anyway and skip a basic health habit because it feels unnecessary today. Taking it seriously anyway is exactly what this line is about.",
      todayAction: "Ask your child today: \"What's one small health habit you sometimes skip, and why does it actually matter?\"",
      childLesson: "Small habits are easy to skip. That's exactly why they're worth keeping.",
    },
  },
  { episodeNumber: 77, tamilText: "பழிப்பன பகரேல்", simpleMeaning: "Do not utter words that bring blame or disgrace.", transliteration: "Pazhippana Pagarel", primaryTheme: "speech", verified: true },
  { episodeNumber: 78, tamilText: "பாம்பொடு பழகேல்", simpleMeaning: "Do not keep company with those as dangerous as a snake.", transliteration: "Paambodu Pazhagel", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about avoiding
    // harmful company, the opposite emphasis, same drift pattern as
    // episode 19.
    curated: {
      hookOverride: "Does your child know how to recognize when someone's influence is bad for them?",
      understanding: "Avvaiyar's wisdom here is a warning: don't keep close company with someone genuinely dangerous to be around. Some people are worth staying away from, however exciting or popular they seem.",
      familyAngle: "Your child is drawn to someone who's exciting to be around but who pushes them toward bad decisions or makes them feel worse about themselves. Noticing that pattern, and stepping back from it, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Is there someone whose company makes you feel like a worse version of yourself? What would it look like to spend less time with them?\"",
      childLesson: "Exciting and good for you aren't always the same thing. Pay attention to how someone's company actually makes you feel, over time.",
      aiaConnection: "Recognizing who's genuinely good to have around you is a value worth practicing deliberately — which is exactly what Aram in Action is about: turning a value like this into action, not just advice.",
    },
  },
  { episodeNumber: 79, tamilText: "பிழைபடச் சொல்லேல்", simpleMeaning: "Do not speak in a way that leads to error or fault.", transliteration: "Pizhaipada Sollel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 80, tamilText: "பீடு பெற நில்", simpleMeaning: "Stand firm on the path that earns true honor.", transliteration: "Peedu Perranil", primaryTheme: "character", verified: true },
  { episodeNumber: 81, tamilText: "புகழ்ந்தாரைப் போற்றி வாழ்", simpleMeaning: "Cherish and care for those who have supported you.", transliteration: "Pugazhndhaarai Potri Vaazh", primaryTheme: "gratitude", verified: true },
  { episodeNumber: 82, tamilText: "பூமி திருத்தி உண்", simpleMeaning: "Cultivate the land properly, and eat from it.", transliteration: "Bhoomi Thiruthi Un", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 83, tamilText: "பெரியாரைத் துணைக்கொள்", simpleMeaning: "Take the wise and elder as your support.", transliteration: "Periyarai Thunaikol", primaryTheme: "community", verified: true },
  { episodeNumber: 84, tamilText: "பேதைமை அகற்று", simpleMeaning: "Remove ignorance from yourself.", transliteration: "Pedhaimai Agatru", primaryTheme: "education", verified: true },
  { episodeNumber: 85, tamilText: "பையலோடு இணங்கேல்", simpleMeaning: "Do not fall in with the foolish.", transliteration: "Paiyalodu Inangel", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about resisting
    // peer pressure from a bad group, the opposite emphasis.
    curated: {
      hookOverride: "Does your child know when to walk away from a group making a bad decision?",
      understanding: "Avvaiyar's wisdom here is about peer pressure: don't go along with foolish people just because they're the group you're with. Being part of a group doesn't mean following it off a cliff.",
      familyAngle: "Your child's friends are about to do something clearly unwise, and going along feels easier than standing apart. Choosing not to go along, even if it means standing alone for a moment, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Has a group you were with ever pushed you to do something you knew wasn't smart? What did you do?\"",
      childLesson: "Being part of a group is good. Following it into a bad decision isn't — you're still allowed to say no.",
      aiaConnection: "Standing apart from a bad decision, even when it's hard, is a value worth practicing — which is exactly what Aram in Action is about: turning a value like this into action, not just advice.",
    },
  },
  { episodeNumber: 86, tamilText: "பொருள்தனைப் போற்றி வாழ்", simpleMeaning: "Guard and grow your wealth responsibly.", transliteration: "Porulthanai Potri Vaazh", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 87, tamilText: "போர்த்தொழில் புரியேல்", simpleMeaning: "Do not take up the work of war (needless conflict).", transliteration: "Porthozhil Puriyel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 88, tamilText: "மனம் தடுமாறேல்", simpleMeaning: "Do not let your mind waver or grow confused.", transliteration: "Manam Thadumaarel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 89, tamilText: "மாற்றானுக்கு இடம் கொடேல்", simpleMeaning: "Do not give your adversary an opening to harm you.", transliteration: "Matraanukku Idam Kodel", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about caution
    // around someone who means harm, the opposite emphasis.
    curated: {
      hookOverride: "Does your child know how to protect themselves without starting a fight?",
      understanding: "Avvaiyar's wisdom here is about caution: don't give someone who means you harm an easy opening to act on it. Being kind doesn't mean being careless about people who clearly don't have your best interest at heart.",
      familyAngle: "Your child keeps sharing something private with someone who's shown, more than once, that they'll use it against them. Being more careful about what they share, without becoming unkind, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Is there something you've been sharing with someone who hasn't earned that trust yet?\"",
      childLesson: "Being kind to people and being careful about who you trust with things that matter aren't the same decision.",
      aiaConnection: "Protecting yourself wisely, without becoming unkind, is a value worth practicing deliberately — which is exactly what Aram in Action is about.",
    },
  },
  { episodeNumber: 90, tamilText: "மிகைபடச் சொல்லேல்", simpleMeaning: "Do not speak in exaggeration.", transliteration: "Migaipada Sollel", primaryTheme: "speech", verified: true },
  { episodeNumber: 91, tamilText: "மீதூண் விரும்பேல்", simpleMeaning: "Do not desire to overeat.", transliteration: "Meethoon Virumbel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 92, tamilText: "முனைமுகத்து நில்லேல்", simpleMeaning: "Do not stand at the front line of an unjust fight.", transliteration: "Munaimugathu Nillel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 93, tamilText: "மூர்க்கரோடு இணங்கேல்", simpleMeaning: "Do not associate with the stubborn or violent.", transliteration: "Moorkkarodu Inangel", primaryTheme: "community", verified: true,
    // Curated: uncurated, this composes from the community pool's
    // "welcome new people in" angle -- the actual line is about avoiding
    // violent/aggressive company, the opposite emphasis.
    curated: {
      hookOverride: "Does your child know how to stay clear of someone who reacts with aggression?",
      understanding: "Avvaiyar's wisdom here is a warning: don't keep close company with someone who's stubborn or violent. Spending time around aggression, even if it's never aimed at you, shapes what starts to feel normal.",
      familyAngle: "Your child keeps spending time with someone who regularly loses their temper or pushes people around, and it's starting to feel normal to them. Noticing that, and stepping back, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Is there someone in your group who often gets aggressive? How does being around that make you feel, over time?\"",
      childLesson: "Spending time around aggression, even when it's not aimed at you, shapes what starts to feel normal. Pay attention to that.",
      aiaConnection: "Choosing your company with real care is a value worth practicing deliberately — which is exactly what Aram in Action is about: turning a value like this into action, not just advice.",
    },
  },
  { episodeNumber: 94, tamilText: "மெல்லினல்லாள் தோள் சேர்", simpleMeaning: "Remain devoted to your own spouse.", transliteration: "Mellinallaal Tholser", primaryTheme: "family", verified: true,
    // Curated: uncurated, this composes from the family pool's
    // "care for grandparents/siblings" angle -- the actual line is about
    // marital faithfulness, reframed here for a parent's own modeling
    // (the series' audience is a parent raising a child, not the child
    // directly, on this one).
    curated: {
      hookOverride: "What is your child learning about commitment, just from watching how you keep yours?",
      understanding: "Avvaiyar's wisdom here is about faithfulness: stay devoted to the commitments you've made, especially in your closest relationship. Children learn what commitment actually looks like by watching the adults around them keep theirs, not by being told to.",
      familyAngle: "Your child watches how you and your partner treat each other on an ordinary, unremarkable day — not just on anniversaries. That ordinary day is where they're actually learning what a committed relationship looks like.",
      todayAction: "Today, let your child see one small, ordinary moment of care between you and your partner — and name it simply: \"This is what keeping a promise looks like, every day.\"",
      childLesson: "Commitment isn't one big promise — it's a hundred small, ordinary choices to keep it.",
    },
  },
  { episodeNumber: 95, tamilText: "மேன்மக்கள் சொல் கேள்", simpleMeaning: "Listen to the words of noble, upright people.", transliteration: "Menmakkal Sol Kel", primaryTheme: "community", verified: true },
  { episodeNumber: 96, tamilText: "மைவிழியார் மனை அகல்", simpleMeaning: "Stay away from homes/relationships of moral hazard.", transliteration: "Maivizhiyaar Manai Agal", primaryTheme: "family", verified: true,
    // Curated: uncurated, this composes from the family pool's
    // "care for grandparents/siblings" angle, nothing to do with the
    // actual line -- generalized here to a family-appropriate lesson
    // about staying out of situations that lead toward wrongdoing,
    // rather than the classical text's specific, adult-oriented framing.
    curated: {
      hookOverride: "Does your child know how to recognize a situation that's quietly leading them toward trouble?",
      understanding: "Avvaiyar's wisdom here is about staying away from situations that are likely to lead you into wrongdoing, even if nothing's gone wrong yet. Some situations are easier to avoid than to get out of once you're already in them.",
      familyAngle: "Your child is invited somewhere, or into a situation, that quietly feels like it's headed toward trouble, even though nothing's happened yet. Choosing not to go, before it becomes a harder decision, is exactly what this line is about.",
      todayAction: "Ask your child today: \"Has a situation ever felt like it was quietly heading somewhere you shouldn't go? What did you do?\"",
      childLesson: "It's easier to stay out of a bad situation than to get out of one once you're already in it.",
    },
  },
  { episodeNumber: 97, tamilText: "மொழிவது அற மொழி", simpleMeaning: "Speak clearly, so what you say is beyond doubt.", transliteration: "Mozhivathu Aram Mozhi", primaryTheme: "speech", verified: true },
  { episodeNumber: 98, tamilText: "மோகத்தை முனி", simpleMeaning: "Turn away from excessive desire/attachment.", transliteration: "Mohathai Muni", primaryTheme: "self-control", verified: true },
  { episodeNumber: 99, tamilText: "வல்லமை பேசேல்", simpleMeaning: "Do not boast of your own ability.", transliteration: "Vallamai Pesel", primaryTheme: "character", verified: true,
    // Curated: uncurated, this composes from the character pool's "do
    // right when unseen" angle -- the actual line is about humility
    // regarding ability, same drift pattern as episode 5.
    curated: {
      hookOverride: "Does your child let their work speak for itself, instead of announcing it?",
      understanding: "Avvaiyar's wisdom here is simple: don't boast about your own ability. What you can actually do shows up in doing it — it doesn't need to be announced beforehand.",
      familyAngle: "Your child is good at something and wants to tell everyone how good they are before they've even done it. Letting the result speak for itself instead is exactly what this line means.",
      todayAction: "The next time your child wants to brag about something they're good at today, ask: \"Can you show it instead of saying it?\"",
      childLesson: "What you're actually good at doesn't need an announcement. It shows up on its own.",
    },
  },
  { episodeNumber: 100, tamilText: "வாது முற்கூறேல்", simpleMeaning: "Do not argue ahead of your elders/betters.", transliteration: "Vaadhumurr Koorel", primaryTheme: "speech", verified: true },
  { episodeNumber: 101, tamilText: "வித்தை விரும்பு", simpleMeaning: "Cherish the desire to learn skills and knowledge.", transliteration: "Vithai Virumbu", primaryTheme: "education", verified: true },
  { episodeNumber: 102, tamilText: "வீடு பெற நில்", simpleMeaning: "Stand firm on the path that leads to liberation.", transliteration: "Veedu Perranil", primaryTheme: "devotion", verified: true },
  { episodeNumber: 103, tamilText: "உத்தமனாய் இரு", simpleMeaning: "Be a person of the highest, most upright character.", transliteration: "Uthamanaai Iru", primaryTheme: "character", verified: true },
  { episodeNumber: 104, tamilText: "ஊருடன் கூடிவாழ்", simpleMeaning: "Live together in harmony with your town/village.", transliteration: "Oorudan Koodivaazh", primaryTheme: "community", verified: true },
  { episodeNumber: 105, tamilText: "வெட்டெனப் பேசேல்", simpleMeaning: "Do not speak harshly, as if cutting with a blade.", transliteration: "Vettena Pesel", primaryTheme: "speech", verified: true },
  { episodeNumber: 106, tamilText: "வேண்டி வினை செயேல்", simpleMeaning: "Do not deliberately, knowingly do wrong.", transliteration: "Vendi Vinaiseyel", primaryTheme: "character", verified: true },
  { episodeNumber: 107, tamilText: "வைகறைத் துயில் எழு", simpleMeaning: "Rise from sleep at dawn.", transliteration: "Vaigarai Thuyil Ezhu", primaryTheme: "self-control", verified: true,
    // Curated: uncurated, this composes from the self-control pool's
    // anger/screen-time angle -- the actual line is about a daily bodily
    // discipline, same drift pattern as episode 16.
    curated: {
      hookOverride: "Does your child follow through on a hard morning habit, even when staying in bed is easier?",
      understanding: "Avvaiyar's wisdom here is simple: rise early. It's a small, unglamorous discipline — choosing to start the day on purpose instead of however it happens to begin.",
      familyAngle: "Your child's alarm goes off and it would be so easy to just go back to sleep for ten more minutes, again. Getting up anyway, without three reminders, is this Aathichoodi, in one ordinary morning.",
      todayAction: "Notice if your child gets up without being nagged today, and name it: \"I saw you just get up — that's not nothing.\"",
      childLesson: "How you start your day isn't a small thing. It's practice for how you'll handle everything else in it.",
    },
  },
  { episodeNumber: 108, tamilText: "ஒன்னாரைத் தேறேல்", simpleMeaning: "Do not place your trust in an adversary.", transliteration: "Onnaarai Therel", primaryTheme: "community", verified: true },
  { episodeNumber: 109, tamilText: "ஓரம் சொல்லேல்", simpleMeaning: "Do not speak with bias — be fair and impartial.", transliteration: "Oram Sollel", primaryTheme: "honesty", verified: true,
    curated: {
      familyAngle: "Refereeing a dispute between siblings, or judging one child's story against another's, tests fairness at home every day.",
      childLesson: "Being fair means judging the situation, not who you love more or who spoke first.",
      todayAction: "The next time you settle a disagreement between children today, say out loud why your decision is fair — not just what it is.",
      aiaConnection: "A closing line for the series: Aram in Action asks us to act rightly for everyone, not just for our own.",
      recommendedCta: "SHARE",
    },
  },
];

export function getCanonEntry(episodeNumber: number): AathichoodiCanonEntry | undefined {
  return AATHICHOODI_CANON.find((e) => e.episodeNumber === episodeNumber);
}

export const TOTAL_EPISODES = AATHICHOODI_CANON.length;
