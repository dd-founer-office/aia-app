/**
 * Purananuru — Canonical Dataset (Phase 2: Source Verification & Canon Lock)
 * ----------------------------------------------------------------------------
 * Preloaded, structured Purananuru content — the single source of truth for
 * the Tamil text itself, same role as lib/kural-publishing/aathichoodi/
 * canon.ts plays for the Daily Aathichoodi Series. Nothing downstream
 * (content-engine.ts, the carousel renderer) may reorder, merge, paraphrase,
 * or alter tamilText.
 *
 * SCOPE: still a 3-poem foundation set requested for Phase 1/2/4 — NOT the
 * verified 50-poem Master Content Index, which stays a deliberately
 * separate, later pass. Adding poem 4..50 (and eventually toward the full
 * 400) is purely appending entries here; nothing in content-engine.ts, the
 * renderer, or the generator UI needs to change.
 *
 * PHASE 4 — 139 SWAPPED OUT FOR 91: the active set is now 91, 189, 192.
 * Poem 139 (see the Phase 2 paragraph below for why its poet/subject were
 * corrected) never got past a two-fragment partial text despite a full
 * Phase 3 research pass, so it is deliberately NOT production-ready for the
 * first Reel experiment and has been removed from PURANANURU_CANON. It is
 * not deleted from the project: its fully-sourced-as-far-as-possible entry
 * (poet Maruthan Ilanagnanaar, subject Ay Andiran, both confirmed fragments,
 * NEEDS_SOURCING placeholder) lives in this file's git history (the Phase 2
 * commit) and can be re-added the same way 91 was added here, the moment
 * its complete text is actually sourced — no schema or architecture change
 * needed for that, just a new array entry. Purananuru 91 (Avvaiyar, on
 * Athiyaman Nedumaan Anji's gift of the life-prolonging nelli fruit) was
 * selected as its replacement after a dedicated Phase 3 candidate search
 * that also checked poems 312 and 201 — 91 had the strongest independent
 * source spread of the three, including one scholarly published
 * translation (George Hart & Hank Heifetz, "The Four Hundred Songs of War
 * and Wisdom", Columbia University Press, 1999) corroborating the exact
 * wording, not just the story.
 *
 * PHASE 2 CORRECTION — READ BEFORE TRUSTING POEM 139's METADATA (kept for
 * history; 139 is no longer in the active array below):
 * Phase 1 preloaded poem 139 as a Kapilar poem about the chieftain Pegan's
 * generosity in war. Phase 2 source verification (multiple independent
 * searches against a Tamil-Wikipedia poet biography, and two dedicated
 * per-poem literature sites) found this was WRONG: Purananuru 139 is by
 * Maruthan Ilanagnanaar (மருதன் இளநாகனார்), in praise of the chieftain Ay
 * Andiran (ஆய் அண்டிரன்), turai பரிசில் கடாநிலை (a poet's direct appeal to a
 * patron for reward) — not Kapilar, not Pegan, not a war-generosity poem.
 * Kapilar's actual Pegan poem in this anthology is 143 (a different genre:
 * perunthinai, pleading with Pegan not to abandon his wife), which is NOT
 * in this dataset.
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
    poemNumber: 91,
    // PHASE 3/4: selected as poem 139's replacement after a dedicated
    // candidate search (see the Phase 3 research report) that also
    // evaluated poems 312 and 201. Poet and text cross-checked across 4
    // independent source types: two separately-run dedicated per-poem
    // blogs that both title this poem "91. எமக்கு ஈத்தனையே!" (matching the
    // poem's own closing words) -- puram400.blogspot.com and
    // annamalai-subbu.blogspot.com; a genre/classification citation
    // (திணை: தும்பை, துறை: வாழ்த்தியல்); and, uniquely among this dataset's
    // three poems, an independently PUBLISHED scholarly translation (George
    // Hart & Hank Heifetz, "The Four Hundred Songs of War and Wisdom",
    // Columbia University Press, 1999), whose English -- "May you live as
    // long as he lives on whose head the crescent moon glows, whose neck is
    // as dark blue as sapphires" -- corroborates "பால்புரை பிறைநுதல்
    // பொலிந்த சென்னி நீல மணிமிடற்று ஒருவன் போல மன்னுக" almost word for
    // word. A handful of weaker, uncited search passes floated poem numbers
    // 92/95/102 for what appears to be this same poem -- recorded, not
    // silently adopted: 91 is the only number backed by a matching
    // dedicated-post URL/title pairing on two separate sites plus the
    // scholarly citation. Still `verified: false` per this file's header --
    // no primary critical edition was opened directly.
    poet: "Avvaiyar (ஔவையார்)",
    tamilText:
      "வலம்படு வாய்வாள் ஏந்தி ஒன்னார்\n" +
      "களம்படக் கடந்த கழல்தொடித் தடக்கை\n" +
      "ஆர்கலி நறவின் அதியர் கோமான்\n" +
      "போரடு திருவிற் பொலந்தார் அஞ்சி\n" +
      "பால்புரை பிறைநுதல் பொலிந்த சென்னி\n" +
      "நீல மணிமிடற்று ஒருவன் போல\n" +
      "மன்னுக பெரும! நீயே, தொன்னிலைப்\n" +
      "பெருமலை விடரகத்து அருமிசைக் கொண்ட\n" +
      "சிறியிலை நெல்லித் தீங்கனி குறியாது\n" +
      "ஆதல் நின்னகத்து அடக்கிச்\n" +
      "சாதல் நீங்க எமக்கு ஈத்தனையே.",
    transliteration:
      "Valampadu Vaaivaal Endhi Onnaar\n" +
      "Kalampadak Kadandha Kazhaltodith Thadakkai\n" +
      "Aarkali Naravin Adhiyar Komaan\n" +
      "Poradu Thiruvir Polandhaar Anji\n" +
      "Paalburai Pirainudhal Polindha Senni\n" +
      "Neela Manimidatru Oruvan Pola\n" +
      "Mannuga Peruma! Neeyey, Thonnilaip\n" +
      "Perumalai Vidaragaththu Arumisaik Konda\n" +
      "Siriyilai Nellith Theengani Kuriyaadhu\n" +
      "Aadhal Ninnagaththu Adakkich\n" +
      "Saadhal Neenga Emakku Eethanaiyey.",
    // Literal/simple meaning only -- the modern framing lives entirely in
    // curated.modernReflection/hook/visualStoryDirection below, never
    // blended into this field. See this file's header for the "do not
    // present modern interpretation as literal translation" rule this
    // split exists to satisfy.
    simpleMeaning:
      "Avvaiyar blesses Athiyaman Nedumaan Anji, wishing him a life as long and lasting as the blue-throated one's (a reference to Shiva). She explains why: on an ancient, hard-to-climb mountain, in a rare crevice, grew a small-leaved nelli (gooseberry) tree bearing a fruit believed to ward off death and prolong life. Without hesitation, Athiyaman kept none of it for himself and gave the fruit to her.",
    coreAramTheme: "generosity",
    hook: "உங்களுக்கு கிடைத்த அரிய ஒன்றை,\nயாருக்காவது கொடுப்பீர்களா?",
    visualStoryDirection:
      "A modern person finally gets the one available seat on a fully-booked flight home for a family emergency -- then notices a stranger at the gate who needs it even more (a mother trying to reach a sick child) and hands over the boarding pass instead of using it. No king, no court, no ancient mountain -- the rare, hard-won thing is modern and mundane, and the choice is the entire story.",
    verified: false,
    sourceUrl: "http://puram400.blogspot.com/2009/07/91.html",
    curated: {
      // Modern editorial interpretation only -- not a claim about what the
      // 8th-century poem itself says. Ends with the brief's own suggested
      // closing question rather than adding a new, unrequested schema field
      // for it (this dataset's schema stays exactly as it was in Phase 2).
      modernReflection:
        "நாம் கொடுப்பது எளிதாக கிடைத்ததா? அல்லது நமக்கே மிகவும் தேவையானதா? நீங்கள் இப்படிச் செய்வீர்களா?",
      understanding:
        "The value of generosity is greatest when we give something that is genuinely valuable to ourselves -- Avvaiyar's blessing is really a description of exactly that: a king who had every reason to keep a death-defying fruit for himself, and didn't.",
    },
  },
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
];

export function getCanonEntry(poemNumber: number): PurananuruCanonEntry | undefined {
  return PURANANURU_CANON.find((e) => e.poemNumber === poemNumber);
}

export const TOTAL_POEMS = PURANANURU_CANON.length;
