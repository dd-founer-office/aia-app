/**
 * Living Field — Glyph Sets
 * ----------------------------------------------------------------------------
 * Glyph source for the Ambient Letter Field.
 *
 * Build Sprint 01 ships EXACTLY ONE active glyph set: the full 247-letter
 * modern Tamil alphabet (12 uyir + 18 pulli mei + 216 uyirmei + ஃ), generated
 * programmatically exactly as in Concept v0.6.
 *
 * Heritage scripts (Tamil-Brahmi, Vatteluttu) are FUTURE strata. Per founder
 * direction they are not implemented here in any form — no data, no hidden
 * layers, no placeholders. The GlyphSet interface + registry below are the
 * clean extension points: a future sprint registers additional sets without
 * touching layout, renderer, or engine code.
 */

/** A renderable glyph. Sprint 01 uses text glyphs only. `path` exists as a
 *  typed extension point for scripts with no Unicode encoding (Vatteluttu is
 *  rendered from traced outline paths in the exploration work); no path data
 *  ships in this sprint. */
export type Glyph =
  | { kind: "text"; value: string }
  | { kind: "path"; value: GlyphPath };

/** Traced letterform in a 0–10 unit box, drawn with even-odd fill so interior
 *  holes are preserved. Future use only. */
export interface GlyphPath {
  outer: ReadonlyArray<readonly [number, number]>;
  holes: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
}

/** A named, versioned collection of glyphs the field may draw from. */
export interface GlyphSet {
  id: string;
  glyphs: readonly Glyph[];
}

// ---------------------------------------------------------------------------
// Modern Tamil — full 247-letter set (unchanged generation from v0.6)
// ---------------------------------------------------------------------------

const VOWELS = ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"] as const;

const VOWEL_SIGNS = ["", "ா", "ி", "ீ", "ு", "ூ", "ெ", "ே", "ை", "ொ", "ோ", "ௌ"] as const;

const CONSONANTS = [
  "க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப",
  "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன",
] as const;

const PULLI = "\u0BCD";
const AYTHAM = "\u0B83"; // ஃ

function buildModernTamil247(): Glyph[] {
  const set: Glyph[] = [];
  for (const v of VOWELS) set.push({ kind: "text", value: v });
  for (const c of CONSONANTS) set.push({ kind: "text", value: c + PULLI });
  for (const c of CONSONANTS) {
    for (const s of VOWEL_SIGNS) set.push({ kind: "text", value: c + s });
  }
  set.push({ kind: "text", value: AYTHAM });
  return set; // 12 + 18 + 216 + 1 = 247
}

export const MODERN_TAMIL: GlyphSet = {
  id: "modern-tamil-247",
  glyphs: buildModernTamil247(),
};

// ---------------------------------------------------------------------------
// Registry — the extension point for future heritage strata.
// Sprint 01: modern Tamil only. Registering a future set here (e.g. a
// scholar-reviewed Tamil-Brahmi or traced Vatteluttu set) is the ONLY change
// needed at this layer; strata in config.ts would then reference set ids.
// ---------------------------------------------------------------------------

export const GLYPH_SETS: readonly GlyphSet[] = [MODERN_TAMIL];

export const ACTIVE_GLYPH_SET: GlyphSet = MODERN_TAMIL;

// ---------------------------------------------------------------------------
// Shuffled-deck dealing (unchanged principle from v0.6): every glyph is
// guaranteed to appear before any glyph repeats — a plain random pick per
// cell could not promise that.
// ---------------------------------------------------------------------------

function shuffled<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deals glyphs from a shuffled deck without replacement, reshuffling when
 *  exhausted. One dealer per field build. */
export function createGlyphDealer(set: GlyphSet = ACTIVE_GLYPH_SET): () => Glyph {
  let queue = shuffled(set.glyphs);
  return () => {
    if (queue.length === 0) queue = shuffled(set.glyphs);
    return queue.pop() as Glyph;
  };
}
