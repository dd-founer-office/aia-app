/**
 * Purananuru — Canonical Dataset (Phase 1: 3-poem foundation)
 * ----------------------------------------------------------------------------
 * Preloaded, structured Purananuru content — the single source of truth for
 * the Tamil text itself, same role as lib/kural-publishing/aathichoodi/
 * canon.ts plays for the Daily Aathichoodi Series. Nothing downstream
 * (content-engine.ts, the carousel renderer) may reorder, merge, paraphrase,
 * or alter tamilText.
 *
 * SCOPE: this is the 3-poem foundation set requested for Phase 1 (proving
 * the content engine + generator integration), NOT the verified 50-poem
 * Master Content Index — that is a deliberately separate, later pass. Adding
 * poem 4..50 (and eventually toward the full 400) is purely appending
 * entries here; nothing in content-engine.ts, the renderer, or the
 * generator UI needs to change for that.
 *
 * PROVENANCE / VERIFICATION — READ BEFORE FLIPPING verified TO true:
 * This sandboxed environment has no general internet access (only a small
 * allowlist of package registries and this repo's own GitHub remote), so no
 * entry below has been checked against a primary printed source or a
 * complete critical e-text (e.g. Project Madurai's puRanAnURu etext,
 * pmuni0494_03, or Tamil Wikisource) from *within this session*. Per the
 * standing rule this project already follows (see the Aathichoodi canon's
 * own doc comment: "uncertainty is flagged, never silently papered over"),
 * every entry here is `verified: false` until a human — or a session with
 * real web access — actually checks it against sourceUrl and corrects
 * anything wrong. Nothing below is invented: each tamilText is either the
 * exact line(s) supplied directly in the founder's own brief, or lines
 * retrieved verbatim via search from the cited source, and is clearly
 * marked when it is a PARTIAL/opening excerpt rather than the poem's full
 * text. Where no real text could be retrieved at all (poem 139), the field
 * holds an explicit placeholder — never a fabricated verse — flagged
 * NEEDS_SOURCING so it fails quality-check.ts loudly instead of silently.
 */

import type { PurananuruThemeId } from "./themes";
import type { CtaTypeId } from "../aathichoodi/cta";

export interface CuratedPoemContent {
  /** Each field below is independently optional, same convention as
   *  aathichoodi/canon.ts's CuratedEpisodeContent — an editor can lock just
   *  one field while everything else stays whatever content-engine.ts's own
   *  (currently pass-through, pool-free) composition produces. */
  modernReflection?: string;
  todayAction?: string;
  aiaConnection?: string;
  distantDevotionConnection?: string;
  recommendedCta?: CtaTypeId;
  /** Optional override for the "Understand" framing content-engine.ts
   *  would otherwise derive from simpleMeaning alone. */
  understanding?: string;
}

export interface PurananuruCanonEntry {
  /** Canonical anthology numbering (1–400), NOT a sequential array index —
   *  Purananuru poems are sparse in this dataset (139, 189, 192, not
   *  1/2/3), unlike Aathichoodi's contiguous 1..109. */
  poemNumber: number;
  /** Each Purananuru poem has its own named poet, unlike the single-author
   *  Aathichoodi text — required, never blank. */
  poet: string;
  /** Canonical Tamil verse. Never altered, reordered, or paraphrased. See
   *  this file's own header for what "verified" does and does not mean for
   *  the text currently stored here. */
  tamilText: string;
  simpleMeaning: string;
  coreAramTheme: PurananuruThemeId;
  /** Short, direct hook line for Carousel Slide 1 — curated directly per
   *  poem (unlike Aathichoodi's hook, which is composed from a per-theme
   *  pool). Purananuru poems are individually rich enough, and few enough
   *  in this initial dataset, that hand-authoring one hook per poem is the
   *  right MVP choice; a theme-pool fallback can be added later in
   *  content-engine.ts without changing this field's shape. */
  hook: string;
  /** Art/story direction for the asset's imagery — e.g. "royal court,
   *  raised parasol, humble musician" — guidance for a human or a future
   *  image step, NOT an instruction this app executes automatically. Phase
   *  1 renders this as a visible caption on the asset, never as generated
   *  artwork (see purananuru-carousel-renderer.ts's own doc comment). */
  visualStoryDirection: string;
  /** True only once a human (or a session with real source access) has
   *  actually checked tamilText, poet, and poemNumber against sourceUrl.
   *  Never set true speculatively. */
  verified: boolean;
  /** Where to check this specific entry — per-poem (not one shared
   *  constant like Aathichoodi's single-text AATHICHOODI_SOURCE_URL)
   *  because Purananuru's 400 poems don't all come from one reference the
   *  way Aathichoodi's fixed 109-line text does. */
  sourceUrl: string;
  curated?: CuratedPoemContent;
}

export const PURANANURU_CANON: readonly PurananuruCanonEntry[] = [
  {
    poemNumber: 189,
    poet: "Nakkeerar (Madurai Kanakkayanar's son)",
    // Retrieved via search from puram400.blogspot.com/2010/12/189.html and
    // gunathamizh.com's commentary page (both cite this as the full poem);
    // NOT independently cross-checked against a primary e-text from this
    // session — verify against sourceUrl before treating as final.
    tamilText:
      "தெண்கடல் வளாகம் பொதுமை இன்றி\n" +
      "வெண்குடை நிழற்றிய ஒருமை யோர்க்கும்,\n" +
      "நடுநாள் யாமத்தும் பகலும் துஞ்சான்\n" +
      "கடுமாப் பார்க்கும் கல்லா ஒருவற்கும்,\n" +
      "உண்பது நாழி; உடுப்பவை இரண்டே;\n" +
      "பிறவும் எல்லாம் ஓரொக்கு மே;\n" +
      "அதனால்,\n" +
      "செல்வத்துப் பயனே ஈதல்; துய்ப்பேம் எனினே,\n" +
      "தப்புந பலவே.",
    simpleMeaning:
      "Whether you are the one king who alone rules the whole world under one white parasol, or an unlettered man who stays up night and day just to watch over his warhorse, you both eat a measure of rice and wear two clothes — everything else is the same for both. So the true purpose of wealth is to give it away; if we only mean to enjoy it ourselves, we lose sight of most of what it's for.",
    coreAramTheme: "generosity",
    hook: "If a king and a watchman eat the same measure of rice, what is wealth actually for?",
    visualStoryDirection:
      "A single frame contrasting a raised white royal parasol on one side with a lone, plainly-dressed watchman keeping vigil through the night on the other — same modest bowl of rice in front of each, underscoring that wealth's only real difference-maker is what you choose to give.",
    verified: false,
    sourceUrl: "http://puram400.blogspot.com/2010/12/189.html",
  },
  {
    poemNumber: 192,
    poet: "Kaniyan Poongundranar",
    // PARTIAL TEXT: this is a well-known 13-line poem; only the opening
    // quatrain and one further passage were retrieved via search (from
    // puram400.blogspot.com/2010/12/192.html and kuruvirotti.com) within
    // this session's no-internet-access constraints. The "…" marks a real
    // gap, not a stylistic choice — the remaining lines must be added from
    // a primary source before this entry is publish-ready or verified.
    tamilText:
      "யாதும் ஊரே; யாவரும் கேளிர்;\n" +
      "தீதும் நன்றும் பிறர் தர வாரா;\n" +
      "நோதலும் தணிதலும் அவற்றோ ரன்ன;\n" +
      "சாதலும் புதுவது அன்றே;\n" +
      "…\n" +
      "மின்னொடு வானம் தண்துளி தலைஇ\n" +
      "யானாது கல்பொருது இரங்கும்\n" +
      "மல்லல் பேரியாற்று நீர்வழிப் படூஉம்\n" +
      "புணைபோல் ஆருயிர் முறைவழிப் படூஉம்\n" +
      "என்பது திறவோர் காட்சியில் தெளிந்தனம்…",
    simpleMeaning:
      "Every town is our town, everyone is our kin. Good and evil don't come to us because of others; suffering and its relief are the same for everyone; and death is nothing new. Life rides its given course the way a raft rides a great river swollen by thunder and rain — this is what the wise have understood.",
    coreAramTheme: "universal-humanity",
    hook: "What if no place was a stranger's town, and no person was a stranger's kin?",
    visualStoryDirection:
      "Wide, borderless landscape motif — no single town, court, or household singled out — with a raft or vessel carried gently along a great river, evoking one shared human current rather than any one place or people.",
    verified: false,
    sourceUrl: "http://puram400.blogspot.com/2010/12/192.html",
  },
  {
    poemNumber: 139,
    poet: "Kapilar",
    // NEEDS_SOURCING: no full or partial verse text for this specific poem
    // number could be retrieved within this session (search returned only
    // an English paraphrase of its subject, not the Tamil text itself — see
    // this file's header). Per the standing "never invent or paraphrase
    // the classical text" rule, this is left as an explicit placeholder,
    // NOT a reconstructed verse. quality-check.ts's `verified` check
    // already surfaces this as a blocking warning; do not remove that
    // safeguard when poem 139 is completed.
    tamilText: "[NEEDS_SOURCING — Purananuru 139 Tamil text not yet retrieved from a primary source in this session. Do not publish.]",
    simpleMeaning:
      "Kapilar's praise of the chieftain Pegan: even amid war elephants and the anklets of victory, Pegan does not turn from what is right — a poem about generosity and integrity holding even under the pressure of conflict. (Paraphrase of secondary commentary only — pending the actual verse text.)",
    coreAramTheme: "generosity",
    hook: "Even at war, could you stay just as generous as you are in peace?",
    visualStoryDirection:
      "Chieftain Pegan's court amid the aftermath of battle — war elephants and victory anklets in the background, but the foreground moment is an act of giving, not combat, matching the poem's real subject (generosity under pressure) rather than the war imagery around it.",
    verified: false,
    sourceUrl: "https://ta.wikisource.org/wiki/புறநானூறு/பாடல்_131-140",
  },
];

export function getCanonEntry(poemNumber: number): PurananuruCanonEntry | undefined {
  return PURANANURU_CANON.find((e) => e.poemNumber === poemNumber);
}

export const TOTAL_POEMS = PURANANURU_CANON.length;
