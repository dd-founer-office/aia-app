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
 * PROVENANCE: sourced and cross-checked against
 * https://github.com/tk120404/Aathichudi (a structured, purpose-built
 * reference for this exact text: number, poem, classical word-gloss,
 * modern paraphrase, English translation for all 109 lines), then spot-
 * checked against well-established general knowledge of the text (lines 1,
 * 2, 16, 109 confirmed). `verified: false` on any entry means: re-check
 * that specific line against a primary printed source before treating it
 * as final — per the standing rule, uncertainty is flagged, never silently
 * papered over. As of this writing every line matched the source with no
 * flags raised, but the field exists precisely so a future line CAN be
 * marked without a schema change.
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
  familyAngle: string;
  childLesson: string;
  todayAction: string;
  aiaConnection: string;
  distantDevotionConnection?: string;
  recommendedCta: CtaTypeId;
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
}

export const AATHICHOODI_SOURCE_URL =
  "https://github.com/tk120404/Aathichudi";

export const AATHICHOODI_CANON: readonly AathichoodiCanonEntry[] = [
  { episodeNumber: 1, tamilText: "அறஞ்செய விரும்பு", simpleMeaning: "Desire to do righteous deeds.", transliteration: "Aram Seya Virumbu", primaryTheme: "character", verified: true,
    curated: {
      familyAngle: "Every family has small daily chances to do the right thing — even when no one is watching.",
      childLesson: "Doing good isn't a special occasion. It's a habit you build one small choice at a time.",
      todayAction: "Ask your child: \"What's one kind thing we can do today, just because it's right?\" Then do it together.",
      aiaConnection: "This is the seed of Aram in Action — wisdom that only means something once it becomes a deed.",
      recommendedCta: "PARENT_REFLECTION",
    },
  },
  { episodeNumber: 2, tamilText: "ஆறுவது சினம்", simpleMeaning: "Anger is meant to cool down and pass.", transliteration: "Aaruvathu Sinam", primaryTheme: "self-control", verified: true,
    curated: {
      familyAngle: "The evening a sibling fight boils over, or a parent snaps after a long day — anger visits every home.",
      childLesson: "Anger is a wave, not a wall. It always passes if you let it — you don't have to act on it while it's high.",
      todayAction: "Next time anger shows up at home today, try counting to ten together before anyone speaks.",
      aiaConnection: "Aram in Action starts with the hardest audience of all — ourselves, in the moment we're most upset.",
      recommendedCta: "TRY_TODAY",
    },
  },
  { episodeNumber: 3, tamilText: "இயல்வது கரவேல்", simpleMeaning: "Do not withhold help that is within your ability to give.", transliteration: "Iyalvathu Karavel", primaryTheme: "generosity", verified: true },
  { episodeNumber: 4, tamilText: "ஈவது விலக்கேல்", simpleMeaning: "Never stop someone else from giving.", transliteration: "Eevathu Vilakkel", primaryTheme: "generosity", verified: true },
  { episodeNumber: 5, tamilText: "உடையது விளம்பேல்", simpleMeaning: "Do not boast about what you own.", transliteration: "Udaiyathu Vilambel", primaryTheme: "character", verified: true },
  { episodeNumber: 6, tamilText: "ஊக்கமது கைவிடேல்", simpleMeaning: "Never give up your enthusiasm.", transliteration: "Ookkamathu Kaividel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 7, tamilText: "எண்ணெழுத் திகழேல்", simpleMeaning: "Never look down on numbers and letters — keep learning them.", transliteration: "Ennezhuth Thigazhel", primaryTheme: "education", verified: true },
  { episodeNumber: 8, tamilText: "ஏற்பது இகழ்ச்சி", simpleMeaning: "Depending on begging is shameful.", transliteration: "Erpathu Igazhchi", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 9, tamilText: "ஐயமிட்டுண்", simpleMeaning: "Give alms to those in need before you eat.", transliteration: "Aiyamittu Un", primaryTheme: "generosity", verified: true,
    curated: {
      familyAngle: "Before a family meal, there's often a moment to notice who has less — and choose to share first.",
      childLesson: "Generosity isn't what's left over. It's what you set aside on purpose, before you take your own share.",
      todayAction: "At today's meal, set aside a small portion — for a neighbor, a shelter, or anyone who needs it — before anyone eats.",
      aiaConnection: "This one line is Aram in Action's whole philosophy in four words: don't just feel for others, feed them.",
      recommendedCta: "AIA_PARTICIPATION",
    },
  },
  { episodeNumber: 10, tamilText: "ஒப்புர வொழுகு", simpleMeaning: "Live in harmony with the ways of the world.", transliteration: "Oppuravu Ozhugu", primaryTheme: "community", verified: true },
  { episodeNumber: 11, tamilText: "ஓதுவ தொழியேல்", simpleMeaning: "Never stop studying.", transliteration: "Oathuvathu Ozhiyel", primaryTheme: "education", verified: true },
  { episodeNumber: 12, tamilText: "ஒளவியம் பேசேல்", simpleMeaning: "Never speak with envy or jealousy.", transliteration: "Auviyam Pesel", primaryTheme: "speech", verified: true },
  { episodeNumber: 13, tamilText: "அஃகஞ் சுருக்கேல்", simpleMeaning: "Do not shortchange grain (or goods) when trading.", transliteration: "Ahkam Surukkel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 14, tamilText: "கண்டொன்று சொல்லேல்", simpleMeaning: "Do not say something different from what you actually saw.", transliteration: "Kandondru Sollel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 15, tamilText: "ஙப்போல் வளை", simpleMeaning: "Bend like the letter 'nga' — stay connected to your own people.", transliteration: "Ngapol Valai", primaryTheme: "community", verified: true },
  { episodeNumber: 16, tamilText: "சனிநீ ராடு", simpleMeaning: "Bathe regularly (traditionally, on Saturdays).", transliteration: "Sani Neeradu", primaryTheme: "self-control", verified: true },
  { episodeNumber: 17, tamilText: "ஞயம்பட வுரை", simpleMeaning: "Speak so that your words bring sweetness to the listener.", transliteration: "Nyayampada Urai", primaryTheme: "speech", verified: true },
  { episodeNumber: 18, tamilText: "இடம்பட வீடெடேல்", simpleMeaning: "Do not build a house larger than you need.", transliteration: "Idampada Veededel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 19, tamilText: "இணக்கமறிந் திணங்கு", simpleMeaning: "Know a person's true character before befriending them.", transliteration: "Inakkamarindhu Inangu", primaryTheme: "community", verified: true },
  { episodeNumber: 20, tamilText: "தந்தைதாய்ப் பேண்", simpleMeaning: "Care for and protect your father and mother.", transliteration: "Thandhai Thaai Pen", primaryTheme: "family", verified: true,
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
  { episodeNumber: 22, tamilText: "பருவத்தே பயிர்செய்", simpleMeaning: "Sow the crop in its proper season.", transliteration: "Paruvathey Payirsey", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 23, tamilText: "மன்றுபறித் துண்ணேல்", simpleMeaning: "Do not seize wealth unfairly through your position (e.g. taking bribes).", transliteration: "Mandru Parithu Unnel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 24, tamilText: "இயல்பலா தனசெயேல்", simpleMeaning: "Do not act against good, natural conduct.", transliteration: "Iyalpalaathana Seyel", primaryTheme: "character", verified: true },
  { episodeNumber: 25, tamilText: "அரவ மாட்டேல்", simpleMeaning: "Do not handle or provoke a snake.", transliteration: "Aravam Aattel", primaryTheme: "character", verified: true },
  { episodeNumber: 26, tamilText: "இலவம்பஞ்சிற் றுயில்", simpleMeaning: "Sleep on a cotton-soft bed (rest with proper care for your body).", transliteration: "Ilavampanjil Thuyil", primaryTheme: "self-control", verified: true },
  { episodeNumber: 27, tamilText: "வஞ்சகம் பேசேல்", simpleMeaning: "Never speak with deceit.", transliteration: "Vanjagam Pesel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 28, tamilText: "அழகலா தனசெயேல்", simpleMeaning: "Do not do disgraceful things.", transliteration: "Azhagalaathana Seyel", primaryTheme: "character", verified: true },
  { episodeNumber: 29, tamilText: "இளமையிற் கல்", simpleMeaning: "Learn while you are young.", transliteration: "Ilamaiyil Kal", primaryTheme: "education", verified: true,
    curated: {
      familyAngle: "Homework fatigue and busy schedules can make learning feel like a chore instead of a gift while there's still time for it.",
      childLesson: "The years when learning comes easiest don't come back — what you build now, you carry for life.",
      todayAction: "Spend fifteen unhurried minutes today learning something new together — a word, a skill, a story.",
      aiaConnection: "A mind shaped early toward learning is more likely to grow into a life shaped toward action.",
      recommendedCta: "SAVE",
    },
  },
  { episodeNumber: 30, tamilText: "அறனை மறவேல்", simpleMeaning: "Never forget righteousness.", transliteration: "Aranai Maravel", primaryTheme: "character", verified: true },
  { episodeNumber: 31, tamilText: "அனந்த லாடேல்", simpleMeaning: "Do not indulge in excessive sleep.", transliteration: "Anandhal Aadel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 32, tamilText: "கடிவது மற", simpleMeaning: "Let go of the urge to scold or rebuke in anger.", transliteration: "Kadivathu Mara", primaryTheme: "self-control", verified: true },
  { episodeNumber: 33, tamilText: "காப்பது விரதம்", simpleMeaning: "Protecting living beings is itself a sacred practice.", transliteration: "Kaappathu Viratham", primaryTheme: "generosity", verified: true },
  { episodeNumber: 34, tamilText: "கிழமைப் படவாழ்", simpleMeaning: "Live so that your body and wealth are of use to others.", transliteration: "Kizhamaipada Vaazh", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 35, tamilText: "கீழ்மை யகற்று", simpleMeaning: "Remove base or unworthy conduct from yourself.", transliteration: "Keezhmai Yagatru", primaryTheme: "character", verified: true },
  { episodeNumber: 36, tamilText: "குணமது கைவிடேல்", simpleMeaning: "Never let go of good character.", transliteration: "Gunamathu Kaividel", primaryTheme: "character", verified: true },
  { episodeNumber: 37, tamilText: "கூடிப் பிரியேல்", simpleMeaning: "Having befriended someone good, do not abandon them.", transliteration: "Koodi Piriyel", primaryTheme: "community", verified: true },
  { episodeNumber: 38, tamilText: "கெடுப்ப தொழி", simpleMeaning: "Give up the habit of ruining others.", transliteration: "Keduppathu Ozhi", primaryTheme: "character", verified: true },
  { episodeNumber: 39, tamilText: "கேள்வி முயல்", simpleMeaning: "Make effort to listen to and learn from the wise.", transliteration: "Kelvi Muyal", primaryTheme: "education", verified: true },
  { episodeNumber: 40, tamilText: "கைவினை கரவேல்", simpleMeaning: "Do not hide the craft/skill your hands know.", transliteration: "Kaivinai Karavel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 41, tamilText: "கொள்ளை விரும்பேல்", simpleMeaning: "Do not desire to plunder or take what is not yours.", transliteration: "Kollai Virumbel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 42, tamilText: "கோதாட் டொழி", simpleMeaning: "Give up flawed or dishonest games.", transliteration: "Kothaadu Ozhi", primaryTheme: "character", verified: true },
  { episodeNumber: 43, tamilText: "கௌவை அகற்று", simpleMeaning: "Remove slander and vilifying talk.", transliteration: "Kauvai Agatru", primaryTheme: "speech", verified: true },
  { episodeNumber: 44, tamilText: "சக்கர நெறிநில்", simpleMeaning: "Stand within the rule of law (the ruler's just order).", transliteration: "Chakkara Nerinil", primaryTheme: "community", verified: true },
  { episodeNumber: 45, tamilText: "சான்றோ ரினத்திரு", simpleMeaning: "Keep the company of the wise and virtuous.", transliteration: "Saandror Inathiru", primaryTheme: "community", verified: true },
  { episodeNumber: 46, tamilText: "சித்திரம் பேசேல்", simpleMeaning: "Do not speak falsehood as though it were true.", transliteration: "Chithiram Pesel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 47, tamilText: "சீர்மை மறவேல்", simpleMeaning: "Never forget the qualities that bring honor.", transliteration: "Seermai Maravel", primaryTheme: "character", verified: true },
  { episodeNumber: 48, tamilText: "சுளிக்கச் சொல்லேல்", simpleMeaning: "Do not speak in a way that provokes anger in the listener.", transliteration: "Sulikka Sollel", primaryTheme: "speech", verified: true },
  { episodeNumber: 49, tamilText: "சூது விரும்பேல்", simpleMeaning: "Never desire gambling.", transliteration: "Soothu Virumbel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 50, tamilText: "செய்வன திருந்தச்செய்", simpleMeaning: "Whatever you do, do it properly and well.", transliteration: "Seyvana Thiruntha Sey", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 51, tamilText: "சேரிடமறிந்து சேர்", simpleMeaning: "Know the right place before you join it.", transliteration: "Seridamarindhu Ser", primaryTheme: "community", verified: true },
  { episodeNumber: 52, tamilText: "சையெனத் திரியேல்", simpleMeaning: "Do not wander about in a way that draws others' scorn.", transliteration: "Saiyena Thiriyel", primaryTheme: "character", verified: true },
  { episodeNumber: 53, tamilText: "சொற்சோர்வு படேல்", simpleMeaning: "Do not let carelessness creep into your speech.", transliteration: "Sorsorvu Padel", primaryTheme: "speech", verified: true },
  { episodeNumber: 54, tamilText: "சோம்பித் திரியேல்", simpleMeaning: "Do not wander about in laziness.", transliteration: "Sombi Thiriyel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 55, tamilText: "தக்கோ னெனத்திரி", simpleMeaning: "Conduct yourself so others recognize you as trustworthy.", transliteration: "Thakkonena Thiri", primaryTheme: "character", verified: true },
  { episodeNumber: 56, tamilText: "தானமது விரும்பு", simpleMeaning: "Desire to give charity to those who deserve it.", transliteration: "Thaanamathu Virumbu", primaryTheme: "generosity", verified: true },
  { episodeNumber: 57, tamilText: "திருமாலுக் கடிமை செய்", simpleMeaning: "Be devoted in service to the divine (Tirumal).", transliteration: "Thirumaluk Kadimai Sey", primaryTheme: "devotion", verified: true },
  { episodeNumber: 58, tamilText: "தீவினை யகற்று", simpleMeaning: "Keep sinful deeds away from yourself.", transliteration: "Theevinai Yagatru", primaryTheme: "character", verified: true },
  { episodeNumber: 59, tamilText: "துன்பத்திற் கிடங்கொடேல்", simpleMeaning: "Do not give room to hardship (do not let it stop your effort).", transliteration: "Thunbathirku Idangodel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 60, tamilText: "தூக்கி வினைசெய்", simpleMeaning: "Weigh things carefully before you act.", transliteration: "Thooki Vinaisey", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 61, tamilText: "தெய்வ மிகழேல்", simpleMeaning: "Never scorn the divine.", transliteration: "Deiva Migazhel", primaryTheme: "devotion", verified: true },
  { episodeNumber: 62, tamilText: "தேசத்தோ டொத்துவாழ்", simpleMeaning: "Live in harmony with your country/community.", transliteration: "Deshathodu Othuvaazh", primaryTheme: "community", verified: true },
  { episodeNumber: 63, tamilText: "தையல்சொல் கேளேல்", simpleMeaning: "Do not act purely on your spouse's word without your own judgment.", transliteration: "Thaiyalsol Kelel", primaryTheme: "family", verified: true },
  { episodeNumber: 64, tamilText: "தொன்மை மறவேல்", simpleMeaning: "Never forget old, established bonds of friendship.", transliteration: "Thonmai Maravel", primaryTheme: "gratitude", verified: true },
  { episodeNumber: 65, tamilText: "தோற்பன தொடரேல்", simpleMeaning: "Do not pursue things bound to fail.", transliteration: "Thorpana Thodarel", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 66, tamilText: "நன்மை கடைப்பிடி", simpleMeaning: "Hold on firmly to doing good.", transliteration: "Nanmai Kadaipidi", primaryTheme: "character", verified: true },
  { episodeNumber: 67, tamilText: "நாடொப் பனசெய்", simpleMeaning: "Do what your community would approve of.", transliteration: "Naadoppana Sey", primaryTheme: "community", verified: true },
  { episodeNumber: 68, tamilText: "நிலையிற் பிரியேல்", simpleMeaning: "Do not depart from a good, steady standing.", transliteration: "Nilaiyil Piriyel", primaryTheme: "character", verified: true },
  { episodeNumber: 69, tamilText: "நீர்விளை யாடேல்", simpleMeaning: "Do not play recklessly in deep water.", transliteration: "Neervilai Yaadel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 70, tamilText: "நுண்மை நுகரேல்", simpleMeaning: "Do not consume things that harm your health.", transliteration: "Nunmai Nugarel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 71, tamilText: "நூல்பல கல்", simpleMeaning: "Learn from many books.", transliteration: "Noolpala Kal", primaryTheme: "education", verified: true },
  { episodeNumber: 72, tamilText: "நெற்பயிர் விளை", simpleMeaning: "Grow the paddy crop with real effort.", transliteration: "Nerpayir Vilai", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 73, tamilText: "நேர்பட வொழுகு", simpleMeaning: "Conduct yourself in an upright, straightforward way.", transliteration: "Nerpada Ozhugu", primaryTheme: "character", verified: true },
  { episodeNumber: 74, tamilText: "நைவினை நணுகேல்", simpleMeaning: "Do not go near deeds that cause others to suffer.", transliteration: "Naivinai Nanugel", primaryTheme: "character", verified: true },
  { episodeNumber: 75, tamilText: "நொய்ய வுரையேல்", simpleMeaning: "Do not speak trivial, empty words.", transliteration: "Noiya Uraiyel", primaryTheme: "speech", verified: true },
  { episodeNumber: 76, tamilText: "நோய்க்கிடங் கொடேல்", simpleMeaning: "Do not give an opening for illness (through careless habits).", transliteration: "Noaikku Idangodel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 77, tamilText: "பழிப்பன பகரேல்", simpleMeaning: "Do not utter words that bring blame or disgrace.", transliteration: "Pazhippana Pagarel", primaryTheme: "speech", verified: true },
  { episodeNumber: 78, tamilText: "பாம்பொடு பழகேல்", simpleMeaning: "Do not keep company with those as dangerous as a snake.", transliteration: "Paambodu Pazhagel", primaryTheme: "community", verified: true },
  { episodeNumber: 79, tamilText: "பிழைபடச் சொல்லேல்", simpleMeaning: "Do not speak in a way that leads to error or fault.", transliteration: "Pizhaipada Sollel", primaryTheme: "honesty", verified: true },
  { episodeNumber: 80, tamilText: "பீடு பெறநில்", simpleMeaning: "Stand firm on the path that earns true honor.", transliteration: "Peedu Perranil", primaryTheme: "character", verified: true },
  { episodeNumber: 81, tamilText: "புகழ்ந்தாரைப் போற்றிவாழ்", simpleMeaning: "Cherish and care for those who have supported you.", transliteration: "Pugazhndhaarai Potri Vaazh", primaryTheme: "gratitude", verified: true },
  { episodeNumber: 82, tamilText: "பூமி திருத்தியுண்", simpleMeaning: "Cultivate the land properly, and eat from it.", transliteration: "Bhoomi Thiruthi Un", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 83, tamilText: "பெரியாரைத் துணைக்கொள்", simpleMeaning: "Take the wise and elder as your support.", transliteration: "Periyarai Thunaikol", primaryTheme: "community", verified: true },
  { episodeNumber: 84, tamilText: "பேதைமை யகற்று", simpleMeaning: "Remove ignorance from yourself.", transliteration: "Pedhaimai Yagatru", primaryTheme: "education", verified: true },
  { episodeNumber: 85, tamilText: "பையலோ டிணங்கேல்", simpleMeaning: "Do not fall in with the foolish.", transliteration: "Paiyalodu Inangel", primaryTheme: "community", verified: true },
  { episodeNumber: 86, tamilText: "பொருடனைப் போற்றிவாழ்", simpleMeaning: "Guard and grow your wealth responsibly.", transliteration: "Porudanai Potri Vaazh", primaryTheme: "responsibility", verified: true },
  { episodeNumber: 87, tamilText: "போர்த்தொழில் புரியேல்", simpleMeaning: "Do not take up the work of war (needless conflict).", transliteration: "Porthozhil Puriyel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 88, tamilText: "மனந்தடு மாறேல்", simpleMeaning: "Do not let your mind waver or grow confused.", transliteration: "Manandhadu Maarel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 89, tamilText: "மாற்றானுக் கிடங்கொடேல்", simpleMeaning: "Do not give your adversary an opening to harm you.", transliteration: "Matraanukku Idangodel", primaryTheme: "community", verified: true },
  { episodeNumber: 90, tamilText: "மிகைபடச் சொல்லேல்", simpleMeaning: "Do not speak in exaggeration.", transliteration: "Migaipada Sollel", primaryTheme: "speech", verified: true },
  { episodeNumber: 91, tamilText: "மீதூண் விரும்பேல்", simpleMeaning: "Do not desire to overeat.", transliteration: "Meethoon Virumbel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 92, tamilText: "முனைமுகத்து நில்லேல்", simpleMeaning: "Do not stand at the front line of an unjust fight.", transliteration: "Munaimugathu Nillel", primaryTheme: "self-control", verified: true },
  { episodeNumber: 93, tamilText: "மூர்க்கரோ டிணங்கேல்", simpleMeaning: "Do not associate with the stubborn or violent.", transliteration: "Moorkkarodu Inangel", primaryTheme: "community", verified: true },
  { episodeNumber: 94, tamilText: "மெல்லினல்லாள் தோள்சேர்", simpleMeaning: "Remain devoted to your own spouse.", transliteration: "Mellinallaal Tholser", primaryTheme: "family", verified: true },
  { episodeNumber: 95, tamilText: "மேன்மக்கள் சொற்கேள்", simpleMeaning: "Listen to the words of noble, upright people.", transliteration: "Menmakkal Sorkel", primaryTheme: "community", verified: true },
  { episodeNumber: 96, tamilText: "மைவிழியார் மனையகல்", simpleMeaning: "Stay away from homes/relationships of moral hazard.", transliteration: "Maivizhiyaar Manaiagal", primaryTheme: "family", verified: true },
  { episodeNumber: 97, tamilText: "மொழிவ தறமொழி", simpleMeaning: "Speak clearly, so what you say is beyond doubt.", transliteration: "Mozhivadhu Aramozhi", primaryTheme: "speech", verified: true },
  { episodeNumber: 98, tamilText: "மோகத்தை முனி", simpleMeaning: "Turn away from excessive desire/attachment.", transliteration: "Mohathai Muni", primaryTheme: "self-control", verified: true },
  { episodeNumber: 99, tamilText: "வல்லமை பேசேல்", simpleMeaning: "Do not boast of your own ability.", transliteration: "Vallamai Pesel", primaryTheme: "character", verified: true },
  { episodeNumber: 100, tamilText: "வாதுமுற் கூறேல்", simpleMeaning: "Do not argue ahead of your elders/betters.", transliteration: "Vaadhumurr Koorel", primaryTheme: "speech", verified: true },
  { episodeNumber: 101, tamilText: "வித்தை விரும்பு", simpleMeaning: "Cherish the desire to learn skills and knowledge.", transliteration: "Vithai Virumbu", primaryTheme: "education", verified: true },
  { episodeNumber: 102, tamilText: "வீடு பெறநில்", simpleMeaning: "Stand firm on the path that leads to liberation.", transliteration: "Veedu Perranil", primaryTheme: "devotion", verified: true },
  { episodeNumber: 103, tamilText: "உத்தம னாயிரு", simpleMeaning: "Be a person of the highest, most upright character.", transliteration: "Uthamanaayiru", primaryTheme: "character", verified: true },
  { episodeNumber: 104, tamilText: "ஊருடன் கூடிவாழ்", simpleMeaning: "Live together in harmony with your town/village.", transliteration: "Oorudan Koodivaazh", primaryTheme: "community", verified: true },
  { episodeNumber: 105, tamilText: "வெட்டெனப் பேசேல்", simpleMeaning: "Do not speak harshly, as if cutting with a blade.", transliteration: "Vettena Pesel", primaryTheme: "speech", verified: true },
  { episodeNumber: 106, tamilText: "வேண்டி வினைசெயேல்", simpleMeaning: "Do not deliberately, knowingly do wrong.", transliteration: "Vendi Vinaiseyel", primaryTheme: "character", verified: true },
  { episodeNumber: 107, tamilText: "வைகறைத் துயிலெழு", simpleMeaning: "Rise from sleep at dawn.", transliteration: "Vaigarai Thuyilezhu", primaryTheme: "self-control", verified: true },
  { episodeNumber: 108, tamilText: "ஒன்னாரைத் தேறேல்", simpleMeaning: "Do not place your trust in an adversary.", transliteration: "Onnaarai Therel", primaryTheme: "community", verified: true },
  { episodeNumber: 109, tamilText: "ஓரஞ் சொல்லேல்", simpleMeaning: "Do not speak with bias — be fair and impartial.", transliteration: "Oram Sollel", primaryTheme: "honesty", verified: true,
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
