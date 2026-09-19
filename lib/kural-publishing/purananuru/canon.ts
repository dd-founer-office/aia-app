/**
 * Purananuru — Canonical Dataset (Phase 2: Source Verification & Canon Lock)
 * ----------------------------------------------------------------------------
 * Preloaded, structured Purananuru content — the single source of truth for
 * the Tamil text itself, same role as lib/kural-publishing/aathichoodi/
 * canon.ts plays for the Daily Aathichoodi Series. Nothing downstream
 * (content-engine.ts, the carousel renderer) may reorder, merge, paraphrase,
 * or alter tamilText.
 *
 * SCOPE: still the 3-poem foundation set (139, 189, 192) requested for
 * Phase 1/2 — NOT the verified 50-poem Master Content Index, which stays a
 * deliberately separate, later pass. Adding poem 4..50 (and eventually
 * toward the full 400) is purely appending entries here; nothing in
 * content-engine.ts, the renderer, or the generator UI needs to change.
 *
 * PHASE 2 CORRECTION — READ BEFORE TRUSTING POEM 139's METADATA:
 * Phase 1 preloaded poem 139 as a Kapilar poem about the chieftain Pegan's
 * generosity in war. Phase 2 source verification (multiple independent
 * searches against a Tamil-Wikipedia poet biography, and two dedicated
 * per-poem literature sites) found this was WRONG: Purananuru 139 is by
 * Maruthan Ilanagnanaar (மருதன் இளநாகனார்), in praise of the chieftain Ay
 * Andiran (ஆய் அண்டிரன்), turai பரிசில் கடாநிலை (a poet's direct appeal to a
 * patron for reward) — not Kapilar, not Pegan, not a war-generosity poem.
 * Kapilar's actual Pegan poem in this anthology is 143 (a different genre:
 * perunthinai, pleading with Pegan not to abandon his wife), which is NOT
 * in this dataset. Corrected below; see each field's own comment for what
 * changed and why.
 *
 * PROVENANCE / VERIFICATION — READ BEFORE FLIPPING verified TO true:
 * This sandboxed environment still has no general internet access in
 * Phase 2 (WebFetch/curl to every literature site tried — Wikisource,
 * Project Madurai, tamilvu.org, tamilsurangam.in, sangathamizh.com,
 * archive.org, oldtamilpoetry.com, sangamtranslationsbyvaidehi.com — was
 * rejected by the sandbox's own egress policy; confirmed again this
 * session). The only research channel available is an AI-mediated web
 * search tool that returns synthesized summaries of page content, not raw
 * HTML I can inspect character-by-character myself. Phase 2 ran many
 * independent, differently-worded queries per poem and cross-checked
 * results across multiple distinct site types (dedicated per-poem
 * commentary pages, poet biography pages, and general discussion blogs)
 * rather than accepting the first hit — real, meaningful corroboration for
 * poems 189 and 192's core text and all three poems' poet attribution. But
 * per the standing project rule (see the Aathichoodi canon's own doc
 * comment: "uncertainty is flagged, never silently papered over") AND this
 * task's own explicit instruction not to mark verified:true merely because
 * multiple sites repeat the same text, every entry below STAYS
 * `verified: false`: convergence across an AI search layer I cannot
 * personally audit character-by-character is not the same thing as
 * checking a primary critical edition myself. Nothing below is invented:
 * each tamilText is either supplied directly in the founder's own brief,
 * or lines retrieved verbatim via search and cross-checked across multiple
 * independent sources, and is clearly marked when it is a PARTIAL excerpt
 * rather than the poem's full text. Where real text could not be retrieved
 * at all for a stretch (most of poem 139), that stretch is left an explicit
 * NEEDS_SOURCING placeholder — never a reconstructed verse.
 *
 * transliteration is a NEW Phase 2 field (the schema otherwise deliberately
 * unchanged) — a mechanical, best-effort Tamil-to-roman rendering I
 * produced myself from the sourced tamilText, not itself sourced from an
 * external transliteration, and not a claim of correctness beyond that.
 * Optional, and left unset for any stretch of tamilText that is itself
 * unverified/fragmentary, so an empty field signals "don't trust this yet"
 * the same way NEEDS_SOURCING does for Tamil text.
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
  /** Best-effort mechanical Tamil-to-roman transliteration, produced by
   *  this project, not independently sourced — see this file's header.
   *  Optional: omitted for any poem/stretch whose Tamil text itself isn't
   *  sourced yet, rather than transliterating a placeholder. */
  transliteration?: string;
  simpleMeaning: string;
  coreAramTheme: PurananuruThemeId;
  /** Short, direct hook line for Carousel Slide 1 — curated directly per
   *  poem (unlike Aathichoodi's hook, which is composed from a per-theme
   *  pool). Purananuru poems are individually rich enough, and few enough
   *  in this initial dataset, that hand-authoring one hook per poem is the
   *  right MVP choice; a theme-pool fallback can be added later in
   *  content-engine.ts without changing this field's shape. */
  hook: string;
  /** Art/story direction for the asset's imagery — a MODERN, contemporary
   *  human situation the classical idea maps onto, not generic "ancient
   *  Tamil king" imagery (explicit Phase 2 editorial direction). Guidance
   *  for a human or a future image step, NOT an instruction this app
   *  executes automatically — Phase 1/2 render this as a visible caption,
   *  never as generated artwork (see purananuru-carousel-renderer.ts's own
   *  doc comment). */
  visualStoryDirection: string;
  /** True only once a human (or a session with real source access) has
   *  actually checked tamilText, poet, and poemNumber against sourceUrl.
   *  Never set true speculatively — see this file's header for why every
   *  entry stays false even after Phase 2's much stronger corroboration. */
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
    // PHASE 2: cross-checked again this session across 4 independent
    // source types that all agree — puram400.blogspot.com and
    // gunathamizh.com (dedicated per-poem commentary pages), plus (new
    // this phase) an independent Tamil Wikipedia BIOGRAPHY of Nakkeerar
    // that lists his 3 known Purananuru poems by number: "இவர்
    // புறநானூற்றில் மூன்று செய்யுள்களையும் (56, 189, 395)... இயற்றியவர்" —
    // 189 is explicitly one of them. This is stronger than "two sites
    // repeat the same text" (a distinct source TYPE — a poet biography,
    // not another poem-commentary page — independently names this poem
    // among his works), but still not a primary critical edition I opened
    // myself, hence verified stays false.
    poet: "Nakkeerar (Madurai Kanakkayanaar's son)",
    // PHASE 2: re-retrieved via a fresh, independently-worded search this
    // session and came back byte-for-byte identical to Phase 1's text and
    // to each other across puram400.blogspot.com and gunathamizh.com. The
    // specific line the brief asked to double-check, "செல்வத்துப் பயனே
    // ஈதல்" (not "செல்வத்தின் பயனே ஈதல்"), was also confirmed directly: a
    // search asking exactly which wording is correct returned "செல்வத்துப்
    // பயனே ஈதல் என்ற வாக்கு சரிஆகும்" citing the same two sources. No
    // source found disagreed with this wording. Still `verified: false`
    // per this file's header — no primary critical edition was opened.
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
    transliteration:
      "Thenkadal Valaagam Pothumai Indri\n" +
      "Venkudai Nizhatriya Orumaiyorkkum,\n" +
      "Nadunaal Yaamaththum Pagalum Thunjaan\n" +
      "Kadumaap Paarkkum Kallaa Oruvarkkum,\n" +
      "Unbadhu Naazhi; Uduppavai Irandey;\n" +
      "Piravum Ellaam Orokku Mey;\n" +
      "Adhanaal,\n" +
      "Selvaththup Payaney Eedhal; Thuyppeym Eninney,\n" +
      "Thappunda Palavey.",
    simpleMeaning:
      "Whether you are the one king who alone rules the whole world under one white parasol, or an unlettered man who stays up night and day just to watch over his warhorse, you both eat a measure of rice and wear two clothes — everything else is the same for both. So the true purpose of wealth is to give it away; if we only mean to enjoy it ourselves, we lose sight of most of what it's for.",
    coreAramTheme: "generosity",
    hook: "செல்வம் சேர்ப்பதற்கா? பகிர்வதற்கா?",
    visualStoryDirection:
      "Split-screen of two modern people checking the same bank balance at night: a founder after a big funding round, and a night-shift security guard scrolling his phone on break. Same modest dinner in frame for both. No palace, no parasol, no ancient king — the contrast is entirely in what each person does next with what they have.",
    verified: false,
    sourceUrl: "http://puram400.blogspot.com/2010/12/189.html",
    curated: {
      modernReflection:
        "Two people can hold wildly different amounts of wealth and still eat one plate, wear one outfit at a time. The only real difference wealth makes is what you choose to do with the surplus — and that choice is a daily one, not a one-time act of charity.",
      understanding:
        "Nakkeerar starts from something almost mathematically plain: strip away rank, and a king and a night watchman consume the same. Wealth's only real function, then, is what it lets you give beyond that — everything else is the same for everyone.",
    },
  },
  {
    poemNumber: 192,
    poet: "Kaniyan Poongundranar",
    // PHASE 2: substantially extended from Phase 1's 9-line, explicitly
    // gapped excerpt to an 11-line running text, built ONLY from lines
    // multiple independent sources returned verbatim (not paraphrase) —
    // opening quatrain (puram400.blogspot.com, kuruvirotti.com,
    // thamizhppanimanram.blogspot.com all agree), the raft passage (same
    // sources), and the closing "neither marvel at the great nor despise
    // the small" couplet (tamilsurangam.in's own dedicated page title is
    // literally "192. பெரியோர் சிறியோர்!", independently corroborated by a
    // second, differently-phrased search). Multiple sources describe this
    // as a 13-line poem; my 11-line reconstruction is content-complete as
    // far as every source's paraphrase/translation goes, but I could not
    // confirm the primary edition's own line BREAKS (Sangam metrical
    // lineation isn't the same as my clause-level line breaks) — flagged
    // as open below, not silently resolved.
    //
    // SOURCE DISAGREEMENT (record, don't silently resolve): one search
    // explicitly stated "the canonical Wikisource version shows 'புனை
    // போல்' ... while other scholarly sources cite it as 'புணை போல'".
    // "புணை" (raft) is the word that makes semantic sense here (matches
    // every translation's "raft/float" reading, including G.U. Pope's
    // "fragile raft"); "புனை" (to adorn/craft) does not fit the sentence's
    // meaning at all and looks like a transcription slip in whichever
    // source produced it. I have used "புணை" below because it is the only
    // reading consistent with the poem's own sense, but this is exactly
    // the kind of wording conflict that needs a human to open the actual
    // Wikisource page (blocked for me this session) and confirm which
    // reading it really carries before this line is treated as settled.
    tamilText:
      "யாதும் ஊரே, யாவரும் கேளிர்;\n" +
      "தீதும், நன்றும், பிறர் தர வாரா;\n" +
      "நோதலும், தணிதலும், அவற்றோர் அன்ன;\n" +
      "சாதலும் புதுவது அன்றே;\n" +
      "மின்னொடு வானம் தண்துளி தலைஇ\n" +
      "ஆனாது, கல்பொருது இரங்கும்,\n" +
      "மல்லல் பேர்யாற்று நீர்வழிப் படூஉம்\n" +
      "புணைபோல், ஆருயிர் முறைவழிப் படூஉம்\n" +
      "என்பது திறவோர் காட்சியில் தெளிந்தனம் ஆகலின்,\n" +
      "மாட்சியில் பெரியோரை வியத்தலும் இலமே;\n" +
      "சிறியோரை இகழ்தல் அதனினும் இலமே.",
    transliteration:
      "Yaadhum Oorey, Yaavarum Kelir;\n" +
      "Theedhum, Nandrum, Pirar Thara Vaaraa;\n" +
      "Nodhalum, Thanidhalum, Avatror Anna;\n" +
      "Saadhalum Pudhuvadhu Andrey;\n" +
      "Minnodu Vaanam Thanthuli Thalaii\n" +
      "Aanaadhu, Kalporudhu Irangum,\n" +
      "Mallal Peryaatru Neervazhip Paduum\n" +
      "Punaipol, Aaruyir Muraivazhip Paduum\n" +
      "Enbadhu Thiravor Kaatchiyil Thelindhanam Aagalin,\n" +
      "Maatchiyil Periyorai Viyaththalum Ilamey;\n" +
      "Siriyorai Igazhthal Adhaninum Ilamey.",
    simpleMeaning:
      "Every town is our town, everyone is our kin. Good and evil don't come to us because of others; suffering and its relief are the same for everyone; and death is nothing new. Life rides its given course the way a raft rides a great river swollen by thunder and rain — the wise have understood this, and so we neither marvel at the great nor despise the small.",
    coreAramTheme: "universal-humanity",
    hook: "எல்லோரும் நம் சொந்தமா? இல்லை நாம் தனித்தவரா?",
    visualStoryDirection:
      "A crowded train platform or airport arrivals hall — total strangers from visibly different backgrounds and classes momentarily reaching for the same handrail, or waiting side by side for the same delayed flight. No one is more or less remarkable than the other; the camera treats every face with the same weight.",
    verified: false,
    sourceUrl: "http://puram400.blogspot.com/2010/12/192.html",
    curated: {
      modernReflection:
        "Strip away hometown, job title, and bank balance, and everyone is riding the same raft down the same river — the same joys, the same losses, the same one death waiting at the end. That's not a reason for despair; it's the reason no stranger is really a stranger.",
      understanding:
        "Kaniyan Poongundranar opens with the single most quoted line in Tamil ethics — no town is foreign, no person unrelated — then grounds it in something harder to argue with: everyone's pain, relief, and death arrive the same way, so no one is worth envying or looking down on.",
    },
  },
  {
    poemNumber: 139,
    // PHASE 2 CORRECTION: Phase 1 preloaded this as a Kapilar poem about
    // Pegan's wartime generosity. That was wrong. Independent verification
    // this session — a Tamil Wikipedia biography of the poet Maruthan
    // Ilanagnanaar listing his 5 known Purananuru poems (52, 55, 138, 139,
    // 349); tamilsurangam.in's own dedicated page for poem 139, titled
    // "139. சாதல் அஞ்சாய் நீயே!" and tagged with பரிசில் (reward),
    // கூறேன்/மெய்/பொய் (I-will-not-say/truth/falsehood); and the
    // puram400.blogspot.com discussion group's own notes — all
    // independently agree: poem 139 is by Maruthan Ilanagnanaar, turai
    // பரிசில் கடாநிலை (a poet's direct appeal to a patron for reward),
    // in praise of the chieftain Ay Andiran (ஆய் அண்டிரன்), not Kapilar,
    // not Pegan. Kapilar's actual Pegan poem in this anthology is 143 (a
    // different genre — perunthinai, pleading with Pegan not to leave his
    // wife for a mistress), confirmed by puram400.blogspot.com,
    // sangathamizh.com, and tamilsurangam.in's own dedicated page for 143
    // — and is NOT part of this dataset.
    poet: "Maruthan Ilanagnanaar (மருதன் இளநாகனார்)",
    // NEEDS_SOURCING: only two short fragments could be confirmed as
    // actual quoted lines (not paraphrase) — the poem's own traditional
    // opening/title line, and one further declarative line, both
    // corroborated by tamilsurangam.in's own tag cloud for this specific
    // poem (independent confirmation the words are really in the poem's
    // vocabulary, not just an AI paraphrase). The majority of the poem's
    // body was NOT retrievable this session and is explicitly marked
    // below rather than reconstructed. One near-miss is worth recording:
    // a search for wording near "சாதல்" + "நீயே" returned a fuller-looking
    // passage, but cross-checking it showed it was actually Purananuru 91
    // (a different poem, coincidentally sharing those two words) — caught
    // and discarded rather than used, exactly the failure mode this task
    // warned about.
    tamilText:
      "சாதல் அஞ்சாய் நீயே…\n" +
      "[NEEDS_SOURCING — most of Purananuru 139's body could not be retrieved from a reliable source this session; do not publish.]\n" +
      "…வாழ்தல் வேண்டிப் பொய் கூறேன்; மெய் கூறுவல்.",
    transliteration:
      "Saadhal Anjaai Neeyey…\n" +
      "…Vaazhthal Vendip Poy Kooren; Mei Kooruval.",
    simpleMeaning:
      "A praise-poem for the chieftain Ay Andiran, in the பரிசில் கடாநிலை genre where a poet appeals directly to a patron for reward. Its two confirmed lines frame the poem's own ethical claim: it praises Ay Andiran's fearlessness toward death, and the poet insists the praise itself is not flattery bought by need — \"I will not lie for my living; I speak only the truth.\" (Full meaning pending the missing body of the poem.)",
    coreAramTheme: "honesty",
    hook: "பாராட்டு உண்மையா? பணத்துக்காகவா?",
    visualStoryDirection:
      "A freelance reviewer or consultant at their laptop, cursor hovering over a glowing 5-star rating for a paying client's mediocre product, then instead typing an honest, less flattering line — a modern echo of refusing to praise for pay, matching the poem's own confirmed declaration far better than any court/battlefield imagery would.",
    verified: false,
    sourceUrl: "http://www.tamilsurangam.in/literatures/ettuthogai/purananooru/purananooru_139.html",
    curated: {
      modernReflection:
        "The poem's own defense isn't 'I praise you because you paid me' — it's 'I would say this even if you hadn't.' That's a genuinely hard bar for anyone whose living depends on the person they're describing.",
      understanding:
        "Even in a genre built around asking a patron for support, Maruthan Ilanagnanaar draws a line: whatever is said in this poem is offered as true, not manufactured because a reward is on the line — an early, blunt statement of editorial integrity.",
    },
  },
];

export function getCanonEntry(poemNumber: number): PurananuruCanonEntry | undefined {
  return PURANANURU_CANON.find((e) => e.poemNumber === poemNumber);
}

export const TOTAL_POEMS = PURANANURU_CANON.length;
