/**
 * Kural Publishing — Renderer (MVP, Visual Pass 05)
 * ----------------------------------------------------------------------------
 * Deliberately isolated from lib/living-field/renderer.ts. That renderer is
 * the locked, live requestAnimationFrame engine for the ambient app
 * background; this one draws a single static frame for export and must
 * never be confused with or wired into it. It reuses one piece of *data*
 * from the Kernel (the modern-tamil-247 glyph list) and nothing else --
 * no shared config, no shared renderer functions, no animation loop.
 *
 * Spatial behaviour for Kural 200 specifically (not a general rule for
 * future Kurals -- see kural200-state.ts):
 *
 *   LEFT (0 -> denseEnd)         a linguistic ecosystem -- density itself
 *                                creates the depth, not a background panel
 *   CENTRE (denseEnd -> quiet)   dissolve -- population, scale, and paths
 *                                thin; content narrows toward Kural-derived
 *                                material; components converge into formed,
 *                                then emerging, then selected Tamil
 *   RIGHT (quietStart -> edge)   protected silence -- the Kural and its
 *                                editorial thought, and nothing else
 *
 * Visual Pass 04 governing principle (per founder direction, reference
 * used only for compositional qualities -- nothing traced/composited):
 *   DENSITY CREATES DEPTH. DEPTH CREATES DARKNESS. FORMATION CREATES
 *   ORDER. SILENCE CREATES CLARITY.
 * Pass 03's atmosphere read as a background panel with a visible edge
 * around the transition -- pass 04 deliberately weakened that layer and
 * pushed the actual visual weight back onto glyph population, overlap,
 * and the Formation Path network.
 *
 * Pass 05 governing rule (does not touch composition/density/atmosphere --
 * see pass 04's own header for that): every glyph belongs to one of three
 * semantic depths -- AMBIENT (broad modern-Tamil environment), KURAL
 * MATERIAL (real substrings of the actual Kural 200 text), or SEMANTIC
 * SURVIVOR (the formation nodes -- see deriveFormationNodes, rendered only
 * the ambient loop). The rule: the more visually prominent a form becomes,
 * the more directly it must relate to the source content -- so the
 * high-contrast LARGE/ANCHOR ambient tiers are now always Kural material,
 * never arbitrary. Formation Paths also become a real three-tier system
 * (primary/secondary/tertiary) with exactly 5 primary paths, and an
 * INTERNAL debug overlay (never on the export path) can reveal them.
 *
 * Determinism: every random draw in this file goes through the seeded
 * generator derived from the Kural number (kural200-state.deriveSeed).
 * Nothing here calls Math.random(). Same content + same seed + same
 * renderer version -> byte-identical canvas output.
 */

// MODERN_TAMIL is not imported -- MILESTONE 04 / STAGE 1 is Brahmi/
// Vatteluttu only, no modern Tamil ("this stage is purely glyph ->
// memory... nothing has become a modern letter yet"). It will return
// once Stage 2 (Letter Recognition) is approved and reintroduces it.
import { TAMIL_BRAHMI, VATTELUTTU, type Glyph, type GlyphPath } from "@/lib/living-field/glyphs";
import { createSeededRandom, type SeededRandom } from "./seeded-random";
import {
  deriveSeed,
  type KuralPublishingContent,
} from "./kural200-state";

/** Locked KKA master palette. Semantic roles, not arbitrary names:
 *   - deepCode: the deepest language world (near-black, faint navy character)
 *   - heritageBronze: the dominant Tamil-material colour -- aged, warm
 *   - illuminatedGold: rare heritage illumination (meaning, continuity)
 *   - livingCyan: rarest colour in the system -- activation, living
 *     intelligence. Must stay precious; see drawAmbientGlyph/drawFormationNode.
 *   - warmParchment: the editorial ground. Reference-matched: sampled
 *     directly from the founder-approved target image (#F3E4CF at three
 *     separate points), a light warm cream -- supersedes the previous
 *     golden-tan olai chuvadi value per the explicit reference-match
 *     instruction ("even the text size and weight too and the logo
 *     placement too I need same").
 *   - vignetteEdge: the tone the cream deepens toward at the left edge
 *     (sampled #D1B898 mid-vignette in the same reference; drawAtmosphere
 *     continues darker at the extreme edge).
 *   - kuralInk: primary Tamil typography colour
 *   - mutedEarth: metadata / tertiary information */
const COLORS = {
  deepCode: "#10131A",
  heritageBronze: "#9C7A48",
  illuminatedGold: "#D9A94E",
  livingCyan: "#5FCBD8",
  warmParchment: "#F3E4CF",
  vignetteEdge: "#D1B898",
  kuralInk: "#241E18",
  mutedEarth: "#8C7B62",
} as const;

// ---------------------------------------------------------------------------
// Typography System -- Four roles: Kural, Reflection, Meta, Footer. Nothing
// below is an independent pixel choice -- every size is a ratio of BASE
// (Footer's size). The relational scale itself is unchanged from the
// approved Typography Review Board relationship:
//
//   Kural = 2 x Reflection
//   Reflection = 1.3 x Footer
//   Meta = 1.15 x Footer
//   Footer = Base (1x)
//
// Family/weight/style were updated from "Direction F / Signature" (sans,
// weight 500, Reflection italic) to a serif direction (Noto Serif Tamil /
// Noto Serif, weight 700, no italic) per explicit founder direction after
// a Canva exploration -- this is a real supersession of Direction F's
// values, not a refinement of it; the ratio structure is what's proven,
// the family/weight/style are what's being iterated. See app/layout.tsx
// for the two new fonts this required loading (--font-tamil-serif,
// --font-serif) and KuralHeroCanvas.tsx for how they're resolved and
// threaded through, alongside the ambient field's original sans fonts
// (tamilFont/sansFont), which are untouched.
//
// BASE_SIZE_FRACTION is the one absolute number in the whole system --
// Footer's size as a fraction of canvas height -- and it is what makes the
// scale "responsive": every token resolves relative to actual canvas
// height, so the same ratios hold at any output size, not just 1648x928.
// To change the typography system going forward, edit TYPOGRAPHY_TOKENS
// (or BASE_SIZE_FRACTION to rescale everything at once) -- never hardcode
// a font size, weight, line-height, tracking, or family inside a draw
// function again.
// ---------------------------------------------------------------------------

const BASE_SIZE_FRACTION = 0.023;

interface TypographyToken {
  /** Human-readable role, shown nowhere in the render -- documentation only. */
  role: string;
  fontFamily: "tamil" | "sans";
  weight: number;
  italic: boolean;
  /** Multiple of BASE_SIZE_FRACTION * canvas height. */
  sizeRatio: number;
  /** Safety-floor multiple for fit-shrink text (Kural, Reflection). Text
   *  can shrink toward this but never below it, and never above sizeRatio. */
  minSizeRatio: number;
  /** Multiple of the token's own *resolved* size, not of BASE. */
  lineHeightRatio: number;
  /** Em units, relative to the token's own resolved size. */
  letterSpacingEm: number;
  align: "left";
}

const TYPOGRAPHY_TOKENS = {
  footer: {
    role: "Footer -- tertiary credit line",
    fontFamily: "sans",
    weight: 500,
    italic: false,
    sizeRatio: 1.275,
    minSizeRatio: 1.275,
    lineHeightRatio: 1,
    letterSpacingEm: 0.03,
    align: "left",
  },
  meta: {
    role: "Meta -- குறள் [n] identity label",
    fontFamily: "tamil",
    weight: 500,
    italic: false,
    sizeRatio: 1.425,
    minSizeRatio: 1.425,
    lineHeightRatio: 1,
    // GOLD MASTER: widened, matching the visible tracking in the
    // founder's reference image -- 0.02 -> 0.08. The "KURAL-N" segment
    // is rendered bolder than the rest at draw time (drawKuralHero),
    // not via this token, since a single TypographyToken can't express
    // two weights within one line.
    letterSpacingEm: 0.08,
    align: "left",
  },
  reflection: {
    role: "Reflection -- English secondary voice",
    fontFamily: "sans",
    // GOLD MASTER: explicit founder correction against a reference
    // image -- bold, uppercase, tight tracking (a small-caps editorial
    // masthead style), replacing the earlier "Option C" airy-lowercase
    // treatment. weight 500 -> 700, letterSpacingEm 0.06 -> 0.01 (tight,
    // not wide -- the reference's capitals sit close together, unlike
    // the previous quote-like spacing). Text itself is uppercased in
    // computeHeroLayout, not just styled here.
    weight: 700,
    italic: false,
    sizeRatio: 1.575,
    minSizeRatio: 1.35,
    lineHeightRatio: 1.55,
    letterSpacingEm: 0.01,
    align: "left",
  },
  kural: {
    role: "Kural -- Tamil primary voice",
    fontFamily: "tamil",
    weight: 700,
    italic: false,
    sizeRatio: 2.6,
    minSizeRatio: 1.25,
    lineHeightRatio: 1.52,
    letterSpacingEm: 0,
    align: "left",
  },
} as const satisfies Record<string, TypographyToken>;

/** Resolves a token's target size in px for the given canvas height. This
 *  is the size fit-shrink text starts from (Kural, Reflection) or the size
 *  fixed-length text renders at directly (Meta, Footer). */
function tokenSize(token: TypographyToken, height: number): number {
  return height * BASE_SIZE_FRACTION * token.sizeRatio;
}

/** Resolves a token's safety-floor size in px -- fit-shrink text may
 *  shrink toward this but never below it. */
function tokenMinSize(token: TypographyToken, height: number): number {
  return height * BASE_SIZE_FRACTION * token.minSizeRatio;
}

/** Builds the canvas font string for a token at a resolved size, reading
 *  family/weight/italic entirely from the token -- no draw function
 *  chooses these independently. */
function tokenFont(token: TypographyToken, size: number, tamilFont: string, sansFont: string): string {
  const family = token.fontFamily === "tamil" ? tamilFont : sansFont;
  const style = token.italic ? "italic " : "";
  return `${style}${token.weight} ${size}px ${family}`;
}

/** Applies a token's letter-spacing to the context for the given resolved
 *  size (letterSpacingEm is relative to the token's own size, not a fixed
 *  px value). Native CanvasRenderingContext2D.letterSpacing -- supported
 *  in Chrome/Edge 99+ and Safari 16.4+; harmlessly ignored elsewhere, text
 *  still renders correctly without tracking. */
function applyTokenTracking(ctx: CanvasRenderingContext2D, token: TypographyToken, size: number): void {
  if ("letterSpacing" in ctx) {
    ctx.letterSpacing = `${(token.letterSpacingEm * size).toFixed(2)}px`;
  }
}

/** All three scripts of one continuous civilization, per the founder's
 *  explicit direction to bring the full Living Field script system into
 *  this tool (previously deliberately modern-Tamil-only -- see the one-day
 *  MVP's original commit -- but never revisited against what the Kernel
 *  itself already does elsewhere). MILESTONE 01 reads from these pools
 *  according to the explicit five-state Formation Grammar system
 *  (see MILESTONE_ZONES /
 *  pickMilestoneZone) rather than a continuous wave. */
type AmbientScript = "modern" | "brahmi" | "vatteluttu";
interface AmbientGlyph {
  glyph: Glyph;
  script: AmbientScript;
}

// GOLD MASTER, explicit founder-directed feature: some Layer 1 (Brahmi/
// Vatteluttu) glyphs are marked as "belonging" to whichever Kural is
// loaded, when their real phonetic identity matches a letter this
// Kural's actual text uses (zonePools.exactLetters). These are
// index-aligned to TAMIL_BRAHMI.glyphs / VATTELUTTU.glyphs exactly (both
// pools preserve their original array order all the way through
// HISTORICAL_POOL's construction and every filter downstream -- verified
// before relying on it).
//
// BRAHMI: verified directly against the real Unicode Tamil-Brahmi block
// chart (U+11000, confirmed via web search before writing this), not
// guessed. Two entries are genuinely ambiguous -- ancient Brahmi had one
// undifferentiated E and one O; Tamil's short/long split (எ/ஏ, ஒ/ஓ) is a
// later, Tamil-specific innovation the ancestral script doesn't
// distinguish -- so those two map to BOTH modern variants; either
// appearing in the Kural counts as a match.
const BRAHMI_TO_MODERN: readonly (readonly string[])[] = [
  ["அ"], ["ஆ"], ["இ"], ["ஈ"], ["உ"], ["ஊ"],
  ["எ", "ஏ"], ["ஐ"], ["ஒ", "ஓ"], ["ஔ"],
  ["க\u0BCD"], ["ங\u0BCD"], ["ச\u0BCD"], ["ஞ\u0BCD"], ["ட\u0BCD"], ["ண\u0BCD"],
  ["த\u0BCD"], ["ந\u0BCD"], ["ப\u0BCD"], ["ம\u0BCD"], ["ய\u0BCD"], ["ர\u0BCD"], ["ல\u0BCD"], ["வ\u0BCD"],
];

// VATTELUTTU: founder-supplied reference chart, cross-verified before
// use -- two independent shape matches (the unmistakable rounded
// triangle at index 19, and the numeral-1-like stroke at index 16) both
// landed exactly where a straightforward reading of the chart predicted,
// and the resulting phonetic sequence falls into real standard Tamil
// alphabetical order (க ங ச ஞ ட ண த ந ப ம ய ர ல வ ழ ள) once the chart's
// two loosely-transliterated "na" labels are read as ங/ந and its "ṛa"
// as ழ். Explicitly confirmed by the founder before this was written.
const VATTELUTTU_TO_MODERN: readonly (readonly string[])[] = [
  ["அ"], ["ஆ"], ["இ"], ["உ"], ["எ"],
  ["க\u0BCD"], ["ங\u0BCD"], ["ச\u0BCD"], ["ஞ\u0BCD"], ["ட\u0BCD"], ["ண\u0BCD"], ["த\u0BCD"], ["ந\u0BCD"],
  ["ப\u0BCD"], ["ம\u0BCD"], ["ய\u0BCD"], ["ர\u0BCD"], ["ல\u0BCD"], ["வ\u0BCD"], ["ழ\u0BCD"], ["ள\u0BCD"],
];

const HISTORICAL_POOL: readonly AmbientGlyph[] = [
  ...TAMIL_BRAHMI.glyphs.map((glyph): AmbientGlyph => ({ glyph, script: "brahmi" })),
  ...VATTELUTTU.glyphs.map((glyph): AmbientGlyph => ({ glyph, script: "vatteluttu" })),
];

export interface RenderKuralPublishingOptions {
  width: number;
  height: number;
  content: KuralPublishingContent;
  /** Resolved app font-family strings (see KuralHeroCanvas for how these are
   *  read from --font-tamil-sans / --font-sans / --font-tamil-serif /
   *  --font-serif / --font-brahmi), each with its own fallback chain
   *  already appended. tamilFont/sansFont/brahmiFont are the ambient
   *  field's fonts (untouched by the Typography System token change
   *  below); tamilSerifFont/serifFont are the editorial block's fonts as
   *  of the serif typography direction. There is no fallback font for
   *  Vatteluttu because it needs none -- it never renders as text, only
   *  as traced vector paths (see drawPathGlyph). */
  tamilFont: string;
  sansFont: string;
  tamilSerifFont: string;
  serifFont: string;
  brahmiFont: string;
  /** Canonical KKA logo, once it exists. Left undefined/null draws nothing --
   *  never a placeholder box or generated mark. */
  logoImage?: HTMLImageElement | null;
  /** INTERNAL, development-only. When true, overlays the primary Formation
   *  Paths and their participating glyphs at high contrast so the intended
   *  structure can be verified against a screenshot instead of guessed at.
   *  Must never be true on the export path -- see
   *  KuralHeroCanvas.renderKuralPublishingForExport, which always renders
   *  with this forced false regardless of the live preview's toggle state. */
  debugFormationLogic?: boolean;
}

export function renderKuralPublishing(
  ctx: CanvasRenderingContext2D,
  opts: RenderKuralPublishingOptions
): void {
  const { width, height, content, tamilFont, sansFont, tamilSerifFont, serifFont, brahmiFont } = opts;
  const rand = createSeededRandom(deriveSeed(content.kuralNumber));

  // Real substrings of the actual verified Kural text, not invented glyphs --
  // used throughout the field so its content is always tied to what's
  // actually loaded, never fabricated.
  const kuralSyllables = extractTamilSyllables(
    `${content.tamilLine1} ${content.tamilLine2}`
  );

  // This Kural's exact மெய்/உயிர் units, exact உயிர்மெய் compounds, and
  // actual words, all derived from the real content (see
  // buildMilestoneZonePools's doc comment).
  const zonePools = buildMilestoneZonePools(kuralSyllables, content);

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height);

  // GOLD MASTER, THE HERO -- layout computed FIRST, before any field
  // content draws, so the field can genuinely know where the Kural will
  // sit and thin around it (kuralClearingFactor, threaded through
  // drawLivingField below) rather than the Kural being stamped on top of
  // a field that had no idea it was coming.
  // GOLD MASTER: explicit founder instruction -- Noto Sans Tamil for the
  // Kural, not Noto Serif Tamil. Passing tamilFont/sansFont (the sans
  // pair) into the "tamil" font slot instead of tamilSerifFont/serifFont.
  const kuralLayout = computeHeroLayout(ctx, width, height, content, tamilFont, sansFont);

  drawLivingField(ctx, width, height, tamilFont, brahmiFont, rand, zonePools, content, kuralLayout);

  // The hero itself, drawn last -- on top of the (now cleared-around)
  // field, real typeset text, no glow, uniform weight throughout.
  drawKuralHero(ctx, content, kuralLayout, tamilFont, sansFont);

  // tamilSerifFont/serifFont are not consumed now that the Kural uses
  // Noto Sans Tamil instead -- kept in the destructure for parity with
  // the options contract (the editorial block, if it returns, still
  // uses the serif pair).
  void tamilSerifFont;
  void serifFont;
}

/** Splits Tamil text into orthographic syllables (an independent vowel, or
 *  a consonant with an optional vowel-sign/virama) -- a real decomposition
 *  of the actual verified string, not a fabricated glyph set. Recomputed
 *  from `content` at render time since the control panel can edit the
 *  Tamil lines. */
function extractTamilSyllables(text: string): string[] {
  const matches = text.match(/[\u0B85-\u0B94]|[\u0B95-\u0BB9][\u0BBE-\u0BCD]?/g);
  return matches ?? [];
}

// ---------------------------------------------------------------------------
// Atmosphere -- a MUCH lighter hand than the previous pass. Colour fades out
// well inside the dense field itself (by ~0.85 * denseEnd), not at the quiet
// boundary, so there is no visible panel edge anywhere near the
// transition/formation region. What depth remains here is a soft support
// layer; the language mass is what should read as dark and deep.
// ---------------------------------------------------------------------------

/** Distance to the nearest canvas edge, SMOOTHED. A hard Math.min(x, w-x,
 *  y, h-y) is mathematically correct as "nearest edge distance" and works
 *  fine for the glyph density (placement is discrete and jittered, which
 *  hides the underlying shape) -- but for a continuous colour fill, that
 *  same hard min produces genuinely rectangular, hard-cornered level-set
 *  contours, especially visible on a wide landscape canvas. Confirmed
 *  directly: the first version of this fix rendered a visible boxed frame
 *  -- exactly the kind of hard boundary this whole project has worked to
 *  eliminate. Smoothed via a soft-minimum (log-sum-exp) instead, which
 *  rounds the corners into a genuine vignette while still treating every
 *  edge equally -- no edge is weighted differently from another, only the
 *  hard corner of the min() itself is softened. */
function softEdgeDistance(x: number, y: number, width: number, height: number, softness: number): number {
  const dl = x;
  const dr = width - x;
  const dt = y;
  const db = height - y;
  const sum = Math.exp(-dl / softness) + Math.exp(-dr / softness) + Math.exp(-dt / softness) + Math.exp(-db / softness);
  return -softness * Math.log(sum);
}

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // FIX, direct founder correction, second pass: the first fix attempt
  // used a discrete multi-stop colour lookup (matching the old gradient's
  // stops exactly), which read fine as a smooth native CSS gradient but
  // produced clearly visible BANDING once rendered as flat-filled grid
  // cells -- confirmed directly by rendering it. Replaced with a single
  // continuous smoothstep between exactly two colours -- no discrete
  // thresholds anywhere, so no band edges can exist. Distance is still
  // the smoothed nearest-edge metric (Spatial Constitution Law A,
  // softEdgeDistance above), and cell size is reduced so the remaining
  // per-cell flat-fill quantization is well below the threshold of
  // visibility.
  const norm = Math.min(width, height) * 0.5;
  const softness = Math.min(width, height) * 0.16;
  const cell = 10;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const edgeColor = mix(COLORS.vignetteEdge, COLORS.heritageBronze, 0.22);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cy = r * cell;
      const d = softEdgeDistance(cx, cy, width, height, softness);
      const t = norm > 0 ? Math.min(1, Math.max(0, d / norm)) : 1;
      const smooth = t * t * (3 - 2 * t); // smoothstep -- continuous, no seams
      ctx.fillStyle = mix(edgeColor, COLORS.warmParchment, smooth);
      ctx.fillRect(cx, cy, cell, cell);
    }
  }

  // No elongated "vein" strata patches, and no darker-toned variant --
  // removed entirely per founder direction. Against the light reference
  // ground, even a low-opacity darkened patch read as a visible shadow
  // shape, not texture. Depth now comes only from drawLocalTonalVariation
  // and drawParchmentTexture below -- fine, cell-based grain with no
  // large-scale shape to be seen as an artifact.

  drawLocalTonalVariation(ctx, width, height);
  drawParchmentTexture(ctx, width, height);
}

/** A pure function of position, not of the seeded generator -- deliberately
 *  does NOT consume any `rand` draws, so adding this never shifts the RNG
 *  sequence that macro clusters / the ambient field / Formation Paths all
 *  depend on downstream. That's what makes this a genuine "refine without
 *  rebuilding": composition stays byte-identical to before except for this
 *  additional, independent grain layer softening the dark-panel/light-panel
 *  read within the already-dark region. */
function positionHash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** Smoothly interpolated hash sampled at fine pixel coordinates against a
 *  coarse grid spaced gridStep apart -- a single octave of organic value
 *  noise. Bilinear interpolation is what turns a hard hash lookup into a
 *  soft undulation instead of a blocky, digital-looking grid -- this is
 *  the fix for texture that could read as a noise filter. */
function smoothNoise(px: number, py: number, gridStep: number): number {
  const fx = px / gridStep;
  const fy = py / gridStep;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const h00 = positionHash(x0, y0);
  const h10 = positionHash(x0 + 1, y0);
  const h01 = positionHash(x0, y0 + 1);
  const h11 = positionHash(x0 + 1, y0 + 1);
  const top = h00 + (h10 - h00) * tx;
  const bottom = h01 + (h11 - h01) * tx;
  return top + (bottom - top) * ty;
}

/** Three octaves layered together -- a large, slow undulation (buried
 *  strata), a medium patch scale (material variation), and a fine grain
 *  (surface texture). This is what "many invisible layers beneath the
 *  visible letters" actually means procedurally: depth is not one texture
 *  pass, it's several, at different scales, summed. Still a pure function
 *  of position -- zero rand draws, so composition is untouched. */
function organicDepth(px: number, py: number): number {
  const strata = smoothNoise(px + 50, py + 120, 210);
  const material = smoothNoise(px + 900, py + 300, 68);
  const grain = smoothNoise(px + 1400, py + 800, 21);
  return strata * 0.5 + material * 0.32 + grain * 0.18;
}

function drawLocalTonalVariation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // FIX, same founder correction as drawAtmosphere above: was
  // xFrac/colorEnd-based and only ever iterated columns up to
  // colorEnd*width -- i.e. only ever ran in the left portion of the
  // canvas at all. Now fades by the same smoothed nearest-edge distance
  // as the base gradient and covers every cell, matching Spatial
  // Constitution Law A.
  const norm = Math.min(width, height) * 0.55;
  const softness = Math.min(width, height) * 0.16;
  const cell = 13;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cy = r * cell;
      const d = softEdgeDistance(cx, cy, width, height, softness);
      const ef = norm > 0 ? Math.min(1, Math.max(0, d / norm)) : 0;
      const fade = Math.max(0, 1 - ef / 0.42);
      const n = organicDepth(cx, cy);
      const delta = (n - 0.5) * 0.1 * fade;
      if (Math.abs(delta) < 0.005) continue;
      ctx.fillStyle =
        delta > 0
          ? mixAlpha(COLORS.vignetteEdge, COLORS.heritageBronze, 0.35, delta * 0.7)
          : mixAlpha(COLORS.warmParchment, "#FFFFFF", 0.5, -delta * 0.6);
      ctx.fillRect(cx, cy, cell, cell);
    }
  }
}

/** Warm Parchment's own material texture -- "archival paper, soft mineral
 *  surface, warm light," explicitly NOT "heavy paper grain, wood, grunge."
 *  Same non-RNG position-hash technique as drawLocalTonalVariation (zero
 *  rand draws, so it can't perturb composition). FIX, same founder
 *  correction: previously confined to whichever columns
 *  drawLocalTonalVariation's left-only pass DIDN'T cover (a
 *  right-portion-only complement to a left-portion-only vignette) -- now
 *  covers the full canvas, since fine grain was never inherently
 *  directional in the first place; there was no reason it should have
 *  been limited to part of the canvas once the vignette itself stopped
 *  being left-only. Pure warm-toward-parchment variation only; never
 *  introduces the dark tones the vignette uses. */
function drawParchmentTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const cell = 18;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cy = r * cell;
      const n = smoothNoise(cx + 2200, cy + 1500, 58);
      const delta = (n - 0.5) * 0.032;
      if (Math.abs(delta) < 0.003) continue;
      ctx.fillStyle =
        delta > 0
          ? mixAlpha(COLORS.warmParchment, COLORS.heritageBronze, 0.5, delta)
          : mixAlpha(COLORS.warmParchment, "#FFFFFF", 0.5, -delta * 0.6);
      ctx.fillRect(cx, cy, cell, cell);
    }
  }
}

// ---------------------------------------------------------------------------
// GOLD MASTER, RAINFALL / FILTRATION MODEL: two independent fields, not
// one. Memory density stays edge-based (Spatial Constitution Law A/C) --
// dense at every edge equally, thinning toward the interior, exponential
// decay, never reaching exactly zero. Certainty is the separate axis that
// runs vertically now (see STAGES, defined further below, alongside the
// functions that use it) -- like rain filtering through soil: the soil
// itself doesn't favour any side; what changes with depth is how filtered
// the water passing through it has become.
// ---------------------------------------------------------------------------

/** GOLD MASTER MILESTONE 2 REBOOT: one placed word or formation-stage's
 *  approximate on-canvas footprint, in pixels, centre-anchored (matches
 *  drawAmbientGlyph's textAlign="center"/textBaseline="middle"). Used only
 *  to check "does the NEXT candidate word overlap any word already
 *  committed this pass" -- see placedWordBoxes in drawAmbientField and
 *  wordWouldOverlap below. */
interface PlacedWordBox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/** A small padding margin is added on top of the raw measured overlap so
 *  words get real breathing room, not just technically-non-touching
 *  edges -- "each word deserves space." */
const WORD_OVERLAP_PADDING = 6;

function wordWouldOverlap(box: PlacedWordBox, placed: readonly PlacedWordBox[]): boolean {
  for (const p of placed) {
    const dx = Math.abs(box.x - p.x);
    const dy = Math.abs(box.y - p.y);
    if (dx < box.halfW + p.halfW + WORD_OVERLAP_PADDING && dy < box.halfH + p.halfH + WORD_OVERLAP_PADDING) {
      return true;
    }
  }
  return false;
}

interface MilestoneZonePools {
  exactLetters: readonly string[]; // this Kural's true உயிர்/மெய் units only -- a real independent vowel, or a consonant+pulli (dead consonant). A bare single-character consonant (மெய்+implicit அ) is NOT in this list; see exactCompounds.
  exactCompounds: readonly string[]; // this Kural's real உயிர்மெய் compounds
  words: readonly string[]; // this Kural's actual words, whitespace-split
  /** GOLD MASTER MILESTONE 2 REBOOT: every real word's progressive
   *  grapheme-safe prefixes, e.g. இதனை -> [இ, இத, இதனை]. Built by
   *  segmenting each word with the same grapheme regex extractTamilSyllables
   *  uses (never a raw character slice, which could sever a consonant from
   *  its own vowel sign mid-glyph and draw something invalid) and taking
   *  every cumulative prefix of that grapheme sequence. Region 4 (Formation)
   *  picks a random prefix from a random word's stage list -- "different
   *  words may be at different stages... every transformation remains
   *  readable." The full word itself is the last stage in each list, so
   *  Region 4 and Region 5 read from the same underlying data, just at
   *  different points in it. */
  wordFormationStages: readonly (readonly string[])[];
}

// The 12 real, independent உயிர் letters -- the only characters a bare
// single-code-point grapheme can legitimately be classified as உயிர்.
// Everything else that shows up as a single character (த, க, ப, ய, ல...)
// is NOT a separate "bare consonant" category -- it is மெய் + the
// implicit vowel அ, which Tamil never marks visibly (unlike இ, உ, ஏ,
// etc., which all get their own visible sign). A plain "த" IS a complete
// உயிர்மெய் letter, specifically the அ-vowel case, not an atomic unit
// alongside real உயிர். Length alone cannot distinguish "இ" from "த" --
// both are one code point -- so the vowel set has to be checked explicitly.
const PULLI = "\u0BCD";
const UYIR_SET = new Set(["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"]);
// The visible bound vowel sign -> its own independent உயிர் letter.
// அ has no entry because அ has no visible sign at all -- that absence
// IS how an implicit-அ உயிர்மெய் is recognized (see atomicPartsOf).
const VOWEL_SIGN_TO_INDEPENDENT: Record<string, string> = {
  "\u0BBE": "ஆ", "\u0BBF": "இ", "\u0BC0": "ஈ", "\u0BC1": "உ", "\u0BC2": "ஊ",
  "\u0BC6": "எ", "\u0BC7": "ஏ", "\u0BC8": "ஐ", "\u0BCA": "ஒ", "\u0BCB": "ஓ", "\u0BCC": "ஔ",
};
// GOLD MASTER, direct founder request: "the background must contain
// all these uyir and mei letters" -- த் + அ = த, ன் + ஐ = னை, verified
// together turn by turn before this was written. For any உயிர்மெய்
// grapheme, returns its real [மெய் pulli-form, உயிர் independent-form]
// pair. For an already-atomic grapheme (a real உயிர், or a மெய் already
// in pulli form), returns it unchanged -- there is nothing further to
// decompose. Module-level (not local to buildMilestoneZonePools) because
// deriveFormationNodes needs the identical logic -- one source of truth
// for what "atomic" means, not two copies that could drift apart.
function atomicPartsOf(grapheme: string): readonly string[] {
  if (UYIR_SET.has(grapheme)) return [grapheme];
  if (grapheme.length === 2 && grapheme[1] === PULLI) return [grapheme];
  if (grapheme.length === 1) return [grapheme + PULLI, "அ"]; // implicit-அ case
  const base = grapheme[0];
  const sign = grapheme.slice(1);
  const uyir = VOWEL_SIGN_TO_INDEPENDENT[sign];
  return uyir ? [base + PULLI, uyir] : [grapheme];
}

function buildMilestoneZonePools(kuralSyllables: readonly string[], content: KuralPublishingContent): MilestoneZonePools {
  const exactLetters: string[] = [];
  const exactCompounds: string[] = [];
  for (const s of kuralSyllables) {
    const isUyir = s.length === 1 && UYIR_SET.has(s); // one of the 12 real independent vowels
    const isMei = s.length === 2 && s[1] === PULLI; // consonant + virama (dead consonant)
    if (isUyir || isMei) {
      if (!exactLetters.includes(s)) exactLetters.push(s);
    } else if (!exactCompounds.includes(s)) {
      // Covers both a bare consonant (மெய் + implicit அ) and any explicit
      // consonant+vowel-sign form -- both are genuinely உயிர்மெய்.
      exactCompounds.push(s);
      // Its real atomic parts also belong in exactLetters -- "the
      // background must contain all these uyir and mei letters," not
      // just the ones that happen to already stand alone in the text.
      for (const atom of atomicPartsOf(s)) {
        if (!exactLetters.includes(atom)) exactLetters.push(atom);
      }
    }
  }
  const words = `${content.tamilLine1} ${content.tamilLine2}`
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const wordFormationStages: (readonly string[])[] = words.map((word) => {
    const graphemes = extractTamilSyllables(word);
    const stages: string[] = [];
    let acc = "";
    for (const g of graphemes) {
      acc += g;
      stages.push(acc);
    }
    return stages.length > 0 ? stages : [word];
  });

  return { exactLetters, exactCompounds, words, wordFormationStages };
}

// ---------------------------------------------------------------------------
// GOLD MASTER, RAINFALL / FILTRATION MODEL. Five vertical stages, top to
// bottom -- the actual linguistic laws made spatial, per explicit founder
// direction ("language begins as enormous undifferentiated memory at the
// upper field, progressively resolves... the Kural is the surviving
// sentence near the lower region"). No divider anywhere: each stage
// occupies a real, mostly-flat zone (approved directly against a
// reference the founder chose), and only the boundary between consecutive
// stages softens -- not a continuous blend across the whole canvas, which
// an earlier exploration tried and the founder rejected as reading too
// uniform/foggy, losing the reference's clarity.
//
// Nothing here moves. Per the Spatial Constitution's Law D, still in
// force: a stage's rules only ever decide how certain a FIXED position
// looks: this function computes grid positions once per stage and never
// repositions anything afterward.
// ---------------------------------------------------------------------------

// GOLD MASTER, direct founder correction: the five stages were living in
// horizontal Y-bands (top-to-bottom, per the earlier-approved Rainfall/
// Filtration story), while the memory layer itself was already genuinely
// four-edge symmetric -- two different spatial logics running at once,
// with letters only ever appearing in a horizontal strip regardless of
// how close a point was to the left/right edges. Founder chose explicitly
// to abandon the vertical story and go fully radial: every stage now
// resolves by distance from the NEAREST edge, in every direction equally,
// matching the same principle Stage 1's memory layer already uses.
//
// Each stage is a "ring" in edge-distance space (ef: 0 = right at an
// edge, 1 = the deepest interior point) rather than a Y range. Rings
// blend rather than cutting hard, and each later stage's ring sits
// closer to the interior than the one before it -- letters closer than
// memory, uyirmei closer than letters, words closer than uyirmei, with
// the sentence itself reserved for the deepest interior (see
// drawAssembledSentence, still not called this milestone).
// GOLD MASTER, LAYER SEPARATION -- explicit founder-approved re-tuning.
// The previous values (letters .16-.62, uyirmei .36-.80, words .32-.56)
// overlapped each other across 0.2-0.4 units of range -- direct founder
// observation, confirmed: "layer one is not recognisable... why the
// layer has been mixed up." Anywhere in roughly ef 0.36-0.56, all three
// stages were actively competing for the same physical territory. This
// was a real side effect of the previous fix (pulling words clear of
// the hero's grown footprint landed it inside letters'/uyirmei's own
// space instead of finding new room) that went unflagged at the time.
//
// Re-tuned so each stage is a genuinely separate band, touching its
// neighbour only at a thin transition edge -- not stacked across most
// of its own width. Memory (drawMemoryLayer, no ring of its own) now
// gets a real exclusive zone too: nothing else has peakLo below 0.14,
// so ef 0-0.14 is memory alone, the one place it reads as purely
// itself rather than one quiet layer competing with three louder ones
// in the same space. Words' fadeOutHi (0.52) still stays safely clear
// of the hero's own footprint (~0.56), preserving the previous fix.
const STAGE_RINGS = {
  letters: { peakLo: 0.14, peakHi: 0.24, fadeOutHi: 0.28 },
  uyirmei: { peakLo: 0.3, peakHi: 0.38, fadeOutHi: 0.42 },
  words: { peakLo: 0.42, peakHi: 0.48, fadeOutHi: 0.52 },
} as const;

function smoothstep(lo: number, hi: number, x: number): number {
  if (lo === hi) return x < lo ? 0 : 1;
  const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}

/** A ring's acceptance strength at a given edge-distance fraction: rises
 *  from 0 at peakLo, holds near 1 through the peak band, eases back down
 *  to 0 by fadeOutHi -- a bump, not a step, so no stage has a hard
 *  boundary where it starts or stops appearing. */
function ringStrength(ef: number, ring: { peakLo: number; peakHi: number; fadeOutHi: number }): number {
  const risingEdge = smoothstep(ring.peakLo, ring.peakHi, ef);
  const fallingEdge = 1 - smoothstep(ring.peakHi, ring.fadeOutHi, ef);
  return Math.min(risingEdge, fallingEdge);
}

function applyGlow(ctx: CanvasRenderingContext2D, color: string, blur: number): void {
  // GOLD MASTER, explicit reversal of Sprint 01's "no glow, no gimmicks" --
  // approved directly against a reference the founder chose, which used
  // glow specifically to mark resolving/resolved content. Kept modest
  // (small blur radius, bronze/gold family only, never on raw memory).
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
}

function clearGlow(ctx: CanvasRenderingContext2D): void {
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.shadowBlur = 0;
}

/** MILESTONE 04 / STAGE 1 -- Memory Field. Complete rebuild per explicit,
 *  detailed founder spec, superseding the earlier mixed-script/size-varied
 *  version entirely:
 *
 *  - Tamil-Brahmi + Vatteluttu ONLY. No modern Tamil at this stage --
 *    "this stage is purely glyph -> memory," recognition hasn't happened
 *    yet, so nothing here is allowed to already look like a modern letter.
 *  - ONE fixed size, ONE basic weight, for every glyph, no exceptions.
 *    Depth is opacity ONLY -- explicitly not blur, not scale.
 *  - Guaranteed no overlap: placement uses a grid sized so a glyph plus
 *    its jitter radius can never reach a neighbouring cell's glyph, so no
 *    pairwise distance checks are needed and performance stays bounded.
 *    Jitter is large enough relative to the cell that the grid itself
 *    never reads as a grid -- "the viewer should not be able to trace a
 *    designed path" -- while staying small enough that adjacency across
 *    cells can't collide.
 *  - True four-edge density (Spatial Constitution Law A/C): dense at
 *    every edge and corner equally, quieter toward the interior, never
 *    reaching zero anywhere -- "memory never reaches zero."
 *  - Brahmi and Vatteluttu carry EQUAL status -- selected via a flat 50/50
 *    roll, not proportional to either script's real character-set size
 *    (which would let one dominate), and neither gets a size or opacity
 *    boost over the other. */
function drawMemoryLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brahmiFont: string,
  rand: SeededRandom,
  kuralBox: HeroLayout["box"],
  zonePools: MilestoneZonePools,
  extraBoxes?: readonly HeroLayout["box"][]
): void {
  // GOLD MASTER: increased from 6 to 17 -- explicit founder instruction:
  // "the tamil brahmi and the vatteluthu must be as same in size as the
  // uyir and mei eluthu so that it will be visible." Matches
  // STAGE_RINGS.letters' own size exactly (17, see the letters call
  // below), so Layer 1 reads as genuinely comparable to Layer 2, not a
  // smudge underneath it. Direct founder report against a real render:
  // Layer 1 "looking like some dots and irregular shapes" at the old
  // 6px size -- too small to read as actual letterforms at all.
  const FIXED_SIZE = 17;
  const FIXED_WEIGHT = 500;
  const brahmiGlyphs = HISTORICAL_POOL.filter((g) => g.script === "brahmi");
  const vatteluttuGlyphs = HISTORICAL_POOL.filter((g) => g.script === "vatteluttu");

  // Cell sized comfortably larger than the fixed glyph so that even at
  // maximum jitter, adjacent cells' glyphs cannot touch -- this is what
  // makes "no overlap" a guarantee rather than a probability. Scaled up
  // to match the larger glyph size above (roughly the same proportions
  // the old 30x26 cell kept relative to the old 6px glyph) -- explicit
  // founder instruction, "you can reduce the width": fewer, larger,
  // clearer marks instead of many tiny ones, a direct consequence of
  // needing more room per glyph to stay overlap-free at this size.
  const cellW = 55;
  const cellH = 48;
  const cols = Math.ceil(width / cellW);
  const rows = Math.ceil(height / cellH);
  // Jitter kept well inside half a cell width/height so neighbouring
  // cells' glyphs, even fully jittered toward each other, still clear
  // the fixed glyph size with margin.
  const jitterX = cellW * 0.32;
  const jitterY = cellH * 0.32;

  // GOLD MASTER: Layer 1 confined to its own region -- explicit founder
  // correction. Previously spanned the whole canvas edge-to-edge at
  // fading density (per the Spatial Constitution's "memory never
  // reaches zero, present everywhere" principle, in force since Stage
  // 1) -- direct founder report: this made Layer 1's marks show up in
  // the same screen regions Layers 2/3/4 also occupy, reading as if
  // Brahmi/Vatteluttu were "occupying all layers" rather than being its
  // own distinct band. This is a real, explicit reversal of that
  // earlier principle, not a quiet tweak -- said plainly here rather
  // than left implicit. fadeOutHi sits right at letters' own peakLo
  // (0.14), so Layer 1 hands off to letters with the same soft, no-hard-
  // edge transition every other layer boundary already uses, rather
  // than stopping dead.
  const confineRing = { peakLo: 0, peakHi: 0, fadeOutHi: STAGE_RINGS.letters.peakLo };

  // GOLD MASTER: "each belonging letter should appear only once" --
  // explicit founder correction, no repetition. Tracks which ancient
  // glyph IDENTITIES (not modern letters -- see below) have already
  // been highlighted anywhere on the canvas; a second occurrence of the
  // same ancient letter still draws (as an ordinary, unhighlighted
  // background mark) but never gets bolded/darkened twice. Keyed by
  // script+index rather than by modern-letter-equivalent, since the two
  // ambiguous Brahmi entries (𑀏/𑀑) each cover two modern letters --
  // tracking by the ancient glyph's own identity is the one definition
  // of "the same letter" that stays unambiguous for every entry.
  const highlightedOnce = new Set<string>();

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const gx = (ci + 0.5) * cellW + rand.range(-jitterX, jitterX);
      const gy = (ri + 0.5) * cellH + rand.range(-jitterY, jitterY);
      if (gx < 4 || gx > width - 4 || gy < 4 || gy > height - 4) continue;

      // Four-edge density: distance to the NEAREST edge, not one favoured
      // side. Exponential decay, asymptotic -- never exactly zero.
      const d = Math.min(gx, width - gx, gy, height - gy);
      const norm = Math.min(width, height) * 0.46;
      const ef = norm > 0 ? Math.min(1, d / norm) : 0;
      const density = Math.exp(-1.55 * ef);
      const confine = ringStrength(ef, confineRing);

      // GOLD MASTER, THE HERO: "a quiet clearing around it" -- explicit
      // founder agreement. Smoothly suppresses acceptance near/inside
      // the hero's real measured footprint (computeHeroLayout), never
      // a hard edge.
      const clearing = kuralClearingFactor(gx, gy, kuralBox, extraBoxes);
      if (!rand.chance(Math.min(1, density * 0.92 + 0.06) * clearing * confine)) continue;

      const isBrahmi = rand.chance(0.5); // equal status, flat roll
      const pool = isBrahmi ? brahmiGlyphs : vatteluttuGlyphs;
      if (pool.length === 0) continue;
      // Same formula rand.pick used internally (arr[Math.floor(rnd()*len)])
      // -- byte-identical RNG consumption and resulting glyph selection to
      // before this feature existed. Needed as an explicit index (not just
      // the picked value) so the phonetic-equivalent tables below can be
      // looked up; pick() alone doesn't expose which index it chose.
      const idx = Math.floor(rand.range(0, pool.length));
      const ambient = pool[idx];

      // GOLD MASTER: does this glyph's real phonetic identity belong to
      // this Kural -- i.e. does ANY of its modern-Tamil equivalent(s)
      // appear in the real, verified atomic letter inventory this
      // Kural's actual text uses (zonePools.exactLetters, which already
      // includes every decomposed உயிர்/மெய் component, not just letters
      // that happen to stand alone in the text)? Verified mapping tables
      // above -- Brahmi against the real Unicode chart, Vatteluttu
      // against the founder's own reference, cross-checked against real
      // Tamil alphabetical order before being trusted.
      const equivalents = isBrahmi ? BRAHMI_TO_MODERN[idx] : VATTELUTTU_TO_MODERN[idx];
      const identityKey = `${isBrahmi ? "b" : "v"}${idx}`;
      const belongsToKural =
        (equivalents?.some((eq) => zonePools.exactLetters.includes(eq)) ?? false) &&
        !highlightedOnce.has(identityKey);
      if (belongsToKural) highlightedOnce.add(identityKey);

      // Opacity is the ONLY depth signal -- many distinguishable levels
      // of presence (clearly visible down to barely perceptible), tied
      // to the same edge-density value so edges read as more present and
      // the interior quieter, without ever hitting a hard floor of zero.
      const opacity = 0.05 + density * 0.5 + rand.range(-0.04, 0.04);
      const clampedOpacity = Math.max(0.04, Math.min(0.62, opacity));

      // GOLD MASTER: "belongs to this Kural" gets bolder weight AND
      // darker/more saturated colour together, per explicit founder
      // choice -- blended toward kuralInk (the darkest tone in the whole
      // palette) rather than staying pure heritageBronze, plus a real
      // opacity floor so it can never accidentally render as faint as an
      // unrelated glyph.
      const displayColor = belongsToKural ? mix(COLORS.heritageBronze, COLORS.kuralInk, 0.6) : COLORS.heritageBronze;
      const displayOpacity = belongsToKural ? Math.max(clampedOpacity, 0.55) : clampedOpacity;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = withAlpha(displayColor, displayOpacity);
      if (ambient.glyph.kind === "path") {
        ctx.save();
        ctx.translate(gx, gy);
        if (belongsToKural) {
          ctx.strokeStyle = withAlpha(displayColor, displayOpacity);
          ctx.lineWidth = FIXED_SIZE * 0.06;
          ctx.lineJoin = "round";
        }
        drawPathGlyph(ctx, ambient.glyph.value, FIXED_SIZE, belongsToKural);
        ctx.restore();
      } else {
        const weight = belongsToKural ? 700 : FIXED_WEIGHT;
        ctx.font = `${weight} ${FIXED_SIZE}px ${brahmiFont}`;
        ctx.fillText(ambient.glyph.value, gx, gy);
      }
    }
  }
}

/** One stage's content, placed radially across the WHOLE canvas -- not a
 *  Y-band. Uses the same guaranteed-no-overlap technique as
 *  drawMemoryLayer (a grid sized comfortably larger than the glyph, with
 *  jitter bounded well inside half a cell), but acceptance at each cell
 *  is governed by that cell's position in the stage's edge-distance ring
 *  (see ringStrength) rather than a fixed vertical range. Size and
 *  opacity stay close to uniform within a stage -- hierarchy comes from
 *  stage-to-stage differences and ring position, not variation within
 *  one placement. */
function drawRadialStage(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ring: { peakLo: number; peakHi: number; fadeOutHi: number },
  items: readonly string[],
  rand: SeededRandom,
  opts: {
    tamilFont: string;
    fontFamily: "sans-serif" | "serif";
    size: number;
    opacity: number;
    color: string;
    weight: number;
    glow: boolean;
    cellW: number;
    cellH: number;
    allowOverlapGuard: boolean;
    // GOLD MASTER, explicit founder request: "how we did for layer 1
    // same here -- the uyir and mei letter that belongs to the kural are
    // highlighted." Every item this function ever draws already belongs
    // to the Kural by construction (the caller only ever passes real
    // content, e.g. zonePools.exactLetters) -- unlike Layer 1, which
    // draws from an unrelated ancient-script pool where only SOME
    // glyphs happen to phonetically match. So the meaningful parallel
    // isn't "which items belong" (all of them do) but "which occurrence
    // of each belonging item is the one that reads as resolved" -- each
    // distinct item gets exactly one bold, darker instance; its other
    // occurrences elsewhere on the canvas stay in the normal quiet
    // styling. Defaults to false so letters/uyirmei/words all keep
    // their current behaviour unless explicitly opted in.
    highlightFirstOccurrence?: boolean;
  },
  kuralBox: HeroLayout["box"],
  extraBoxes: readonly HeroLayout["box"][] | undefined,
  // GOLD MASTER: shared across multiple drawRadialStage calls (letters,
  // uyirmei, ...) so overlap is checked between STAGES, not just within
  // one -- explicit founder thumb rule: "no letter must be overlapped,"
  // full stop, not "no letter overlaps another letter in the same
  // layer." Each caller passes the SAME array; defaults to a fresh one
  // so any future standalone caller keeps working unchanged.
  sharedPlacedBoxes: PlacedWordBox[] = []
): void {
  if (items.length === 0) return;

  const norm = Math.min(width, height) * 0.46;

  /** Whether (gx, gy) is currently a legal place to draw `value`: passes
   *  the ring/clearing gate AND (if enabled) doesn't overlap anything
   *  already placed. Shared by both phases below so "legal" is defined
   *  identically everywhere -- one source of truth, not two copies that
   *  could quietly drift apart. `probabilistic` controls whether ring
   *  strength is a hard gate (Phase 1 -- deterministic accept-if-legal,
   *  since candidate positions are already randomly sampled and the
   *  point of this phase is a real guarantee, not another layer of
   *  chance) or a soft one via rand.chance (Phase 2 -- preserves the
   *  organic, thinned-toward-the-edges density character every other
   *  layer already has). */
  function tryPlace(gx: number, gy: number, value: string, probabilistic: boolean): PlacedWordBox | null {
    if (gx < 4 || gx > width - 4 || gy < 4 || gy > height - 4) return null;
    const d = Math.min(gx, width - gx, gy, height - gy);
    const ef = norm > 0 ? Math.min(1, d / norm) : 0;
    const strength = ringStrength(ef, ring);
    const clearing = kuralClearingFactor(gx, gy, kuralBox, extraBoxes);
    const combined = strength * clearing;
    if (probabilistic ? !rand.chance(combined) : combined <= 0) return null;
    if (opts.allowOverlapGuard) {
      ctx.font = `${opts.weight} ${opts.size}px ${opts.tamilFont}, ${opts.fontFamily}`;
      const measured = ctx.measureText(value);
      const box: PlacedWordBox = { x: gx, y: gy, halfW: measured.width / 2, halfH: opts.size * 0.6 };
      if (wordWouldOverlap(box, sharedPlacedBoxes)) return null;
      return box;
    }
    return { x: gx, y: gy, halfW: 0, halfH: 0 };
  }

  /** `highlighted` renders bold + darker/more saturated, matching Layer
   *  1's exact treatment (mix toward kuralInk, opacity floored) -- one
   *  definition of "resolved" reused across layers rather than
   *  reinvented per layer. */
  function draw(value: string, gx: number, gy: number, ef: number, highlighted: boolean): void {
    const strength = ringStrength(ef, ring);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const weight = highlighted ? 700 : opts.weight;
    const color = highlighted ? mix(COLORS.heritageBronze, COLORS.kuralInk, 0.6) : opts.color;
    const baseOpacity = opts.opacity * (0.6 + 0.4 * strength);
    const opacity = highlighted ? Math.max(baseOpacity, 0.7) : baseOpacity;
    ctx.font = `${weight} ${opts.size}px ${opts.tamilFont}, ${opts.fontFamily}`;
    ctx.fillStyle = withAlpha(color, opacity);
    if (opts.glow) applyGlow(ctx, withAlpha(COLORS.illuminatedGold, 0.55), opts.size * 0.3);
    ctx.fillText(value, gx, gy);
    if (opts.glow) clearGlow(ctx);
  }

  // FIX, real regression found and fixed with an actual guarantee, not
  // tuned parameters: grid-cycling alone (try each item once per pass
  // through the grid, retry-with-a-cap on overlap) turned out unreliable
  // once the words ring got squeezed into tighter, more contested space
  // (pulled clear of the grown hero box, but now overlapping letters'
  // and uyirmei's own territory more). Confirmed directly, repeatedly:
  // tuning grid density and retry limits didn't fix "one word missing"
  // -- it only changed WHICH word dropped out (எண்ணி vs பொருள்,
  // depending on the exact parameters), because the underlying method
  // never actually guaranteed coverage, just made it more or less
  // likely by luck.
  //
  // PHASE 1: for every distinct item, search directly and persistently
  // (many random candidate positions inside this stage's own bounding
  // area, not tied to any grid) until one succeeds or a generous budget
  // is exhausted. This gives each item a real, independent chance to
  // find its own space, rather than competing for whichever grid cell
  // the outer loop happens to reach when its turn in the cycle comes up.
  // This loop visits each distinct item exactly once, which is also
  // exactly the "one highlighted occurrence" highlightFirstOccurrence
  // needs -- no separate tracking required.
  const uniqueItems = Array.from(new Set(items));
  for (const value of uniqueItems) {
    let placed = false;
    for (let attempt = 0; attempt < 300 && !placed; attempt++) {
      const gx = rand.range(4, width - 4);
      const gy = rand.range(4, height - 4);
      const box = tryPlace(gx, gy, value, false);
      if (!box) continue;
      if (opts.allowOverlapGuard) sharedPlacedBoxes.push(box);
      const d = Math.min(gx, width - gx, gy, height - gy);
      const ef = norm > 0 ? Math.min(1, d / norm) : 0;
      draw(value, gx, gy, ef, opts.highlightFirstOccurrence === true);
      placed = true;
    }
  }

  // PHASE 2: the existing grid-cycling pass, unchanged in spirit --
  // additional opportunistic repeats for visual richness, now layered
  // on top of Phase 1's guarantee rather than being solely responsible
  // for it. Probabilistic acceptance here (not the deterministic gate
  // Phase 1 uses) -- preserves the organic, edge-thinned density
  // character every other layer already has.
  const cols = Math.ceil(width / opts.cellW);
  const rows = Math.ceil(height / opts.cellH);
  const jitterX = opts.cellW * 0.32;
  const jitterY = opts.cellH * 0.32;
  let itemIdx = 0;

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const gx = (ci + 0.5) * opts.cellW + rand.range(-jitterX, jitterX);
      const gy = (ri + 0.5) * opts.cellH + rand.range(-jitterY, jitterY);
      const value = items[itemIdx % items.length];
      const box = tryPlace(gx, gy, value, true);
      if (!box) continue;
      if (opts.allowOverlapGuard) sharedPlacedBoxes.push(box);
      itemIdx++;

      const d = Math.min(gx, width - gx, gy, height - gy);
      const ef = norm > 0 ? Math.min(1, d / norm) : 0;
      draw(value, gx, gy, ef, false);
    }
  }
}

/** GOLD MASTER, POSITIONAL SPLIT -- see the call site's own comment for
 *  the full reasoning. Places every item in `items` exactly once (no
 *  opportunistic repeats -- unlike drawRadialStage's Phase 2, this
 *  layer's whole point is that each curated word appears a single,
 *  deliberate time), constrained to either the top or bottom half of
 *  the canvas. Reuses the same ring-strength/clearing/overlap
 *  primitives drawRadialStage itself uses, so a word placed here is
 *  governed by the identical "how resolved is this position" logic --
 *  only the search space (top half vs bottom half) differs.
 *
 *  Currently unused: superseded for Kural 675's top group by
 *  drawWordFormation and for the bottom group by
 *  drawWordsInReadingOrder (explicit founder correction requiring
 *  reading-order sequencing, which this function's random search
 *  doesn't guarantee). Kept intact, not deleted -- a genuinely reusable
 *  building block for any future case that wants an unordered top/
 *  bottom split without the reading-order requirement. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawWordsInHalf(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  ring: { peakLo: number; peakHi: number; fadeOutHi: number },
  items: readonly string[],
  rand: SeededRandom,
  opts: {
    tamilFont: string;
    fontFamily: "sans-serif" | "serif";
    size: number;
    opacity: number;
    color: string;
    weight: number;
  },
  kuralBox: HeroLayout["box"],
  sharedPlacedBoxes: PlacedWordBox[],
  half: "top" | "bottom"
): void {
  if (items.length === 0) return;

  const norm = Math.min(width, height) * 0.46;
  const yMin = half === "top" ? 4 : height / 2;
  const yMax = half === "top" ? height / 2 : height - 4;

  const uniqueItems = Array.from(new Set(items));
  for (const value of uniqueItems) {
    let placed = false;
    for (let attempt = 0; attempt < 400 && !placed; attempt++) {
      const gx = rand.range(4, width - 4);
      const gy = rand.range(yMin, yMax);
      const d = Math.min(gx, width - gx, gy, height - gy);
      const ef = norm > 0 ? Math.min(1, d / norm) : 0;
      const strength = ringStrength(ef, ring);
      const clearing = kuralClearingFactor(gx, gy, kuralBox);
      if (strength * clearing <= 0) continue;

      ctx.font = `${opts.weight} ${opts.size}px ${opts.tamilFont}, ${opts.fontFamily}`;
      const measured = ctx.measureText(value);
      const box: PlacedWordBox = { x: gx, y: gy, halfW: measured.width / 2, halfH: opts.size * 0.6 };
      if (wordWouldOverlap(box, sharedPlacedBoxes)) continue;
      sharedPlacedBoxes.push(box);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = withAlpha(opts.color, opts.opacity * (0.6 + 0.4 * strength));
      ctx.fillText(value, gx, gy);
      placed = true;
    }
  }
}

/** GOLD MASTER, real founder-reported fix: the region drawWordFormation
 *  actually occupies, computed with the EXACT same Y-range formula that
 *  function itself uses (topMargin/bottomMargin), so this box and the
 *  words drawn inside it can never drift out of sync. Used to give the
 *  formation treatment its own suppression zone (via
 *  kuralClearingFactor's extraBox) so Layer 1/2/3's ambient content
 *  stops populating the same pixels -- full canvas width, since Layer
 *  2's own letters already span the whole width at this height anyway,
 *  and jittered formation words can land anywhere across that span. */
function computeFormationZoneBox(width: number, kuralLayout: HeroLayout): HeroLayout["box"] {
  const wordSize = kuralLayout.kuralSize * 0.47;
  const topMargin = 24;
  const bottomMargin = Math.max(topMargin + wordSize, kuralLayout.box.y0 - 20);
  return {
    x0: 0,
    y0: Math.max(0, topMargin - wordSize * 0.9),
    x1: width,
    y1b: bottomMargin + wordSize * 0.4,
  };
}

/** GOLD MASTER, real founder-reported fix: the region
 *  drawWordsInReadingOrder actually occupies, computed with the EXACT
 *  same Y-range formula that function itself uses, so this box and the
 *  words drawn inside it can never drift out of sync. Mirrors
 *  computeFormationZoneBox's own role for the top group -- explicit
 *  founder correction that the top and bottom groups' protection didn't
 *  match: the top zone got its own clearing already, the bottom zone
 *  never did, leaving it just as exposed to Layer 2's letters as
 *  before any of this was fixed. */
function computeBottomZoneBox(width: number, height: number, kuralBox: HeroLayout["box"]): HeroLayout["box"] {
  const yMin = Math.min(height - 24, kuralBox.y1b + 40);
  const yMax = height - 24;
  return {
    x0: 0,
    y0: yMin,
    x1: width,
    y1b: yMax,
  };
}

/** Measures the real x-position of every space-separated written token in
 *  a Tamil line, using whatever font/size is currently set on ctx --
 *  caller must set ctx.font to match the Kural's own rendering before
 *  calling this, so the measured positions are genuinely the same ones
 *  the real Kural text will occupy. */
function measureLineTokens(
  ctx: CanvasRenderingContext2D,
  line: string,
  startX: number
): { token: string; startX: number; endX: number; centerX: number }[] {
  const tokens = line.split(" ");
  const spaceWidth = ctx.measureText(" ").width;
  let x = startX;
  const results: { token: string; startX: number; endX: number; centerX: number }[] = [];
  for (const tok of tokens) {
    const w = ctx.measureText(tok).width;
    results.push({ token: tok, startX: x, endX: x + w, centerX: x + w / 2 });
    x += w + spaceWidth;
  }
  return results;
}

/** GOLD MASTER, explicit founder-approved concept, verified against the
 *  real measured position of every written token before being built --
 *  "the kural's porul karuvi is formed by the layer 4 words... i no
 *  need extra word... porul and karuvi." Each group is either a real
 *  pair (two curated words that combine into ONE written compound in
 *  the Kural's own text, e.g. பொருள்+கருவி -> பொருள்கருவி) or a single
 *  (a curated word that already matches a standalone written token
 *  exactly, e.g. காலம்). NO duplicate combined-word text is ever drawn
 *  -- the Kural's own already-rendered text at kuralY1 IS the "formed"
 *  result.
 *
 *  GOLD MASTER, real founder corrections against an actual render, not
 *  guessed: (1) no connecting lines -- shown purely by position now, no
 *  drawn line to the Kural text below; (2) no straight-row alignment --
 *  every group's vertical position is staggered across several bands
 *  instead of one fixed y; (3) real overlap protection -- the previous
 *  version placed words at a single fixed (x,y) with no collision check
 *  at all, and a real render showed exactly the predicted result:
 *  pair-words overlapping each other, and separately colliding with
 *  Layer 1's own ambient glyphs in the same territory. Fixed by
 *  searching multiple candidate positions per word (varying y, and x
 *  jitter near the group's target token) against the SAME shared
 *  cross-layer overlap tracker every other layer already uses, so a
 *  formation word can never collide with anything, ambient or not.
 *
 *  Scoped to the FIRST line only, per explicit founder-approved
 *  decision after a real geometry problem was found and shown directly:
 *  the second line sits close to the first (not near the canvas edge),
 *  while the available bottom placement zone only starts well below the
 *  whole hero block. Line 2's words (இருள்தீர/எண்ணி/செயல்) are not true
 *  multi-word compounds anyway -- each already stands alone in the
 *  written text -- so they get a different, simpler treatment; see
 *  drawWordsInReadingOrder below.
 *
 *  ARCHITECTURAL NOTE, direct founder catch against a real render: this
 *  function does NOT place content inside Layer 4's own designated ring
 *  (STAGE_RINGS.words). It uses raw pixel positioning near the canvas
 *  edge, which lands inside Layer 2's (letters) own territory instead
 *  -- confirmed by direct calculation, not assumed. Checked and ruled
 *  out constraining this to Layer 4's actual ring instead: for Kural
 *  675 there's only ~20px of clearance between STAGE_RINGS.words' own
 *  inner edge and the hero's clearing zone, not enough for this layout.
 *  Kept as a deliberate, explicitly acknowledged exception -- the
 *  shared overlap tracker (sharedPlacedBoxes) still guarantees no
 *  literal glyph collision with Layer 2's content, but the two layers
 *  do now share the same physical territory, not separate rings. */
function drawWordFormation(
  ctx: CanvasRenderingContext2D,
  width: number,
  kuralLayout: HeroLayout,
  tamilLine1: string,
  groups: readonly (readonly string[])[],
  tamilFont: string,
  color: string,
  rand: SeededRandom,
  sharedPlacedBoxes: PlacedWordBox[]
): void {
  ctx.font = `700 ${kuralLayout.kuralSize}px ${tamilFont}, sans-serif`;
  const tokens = measureLineTokens(ctx, tamilLine1, kuralLayout.leftX);

  // Available top territory: from a small margin at the canvas edge
  // down to just above the hero's own clearing box -- verified by
  // direct measurement before building (roughly 190px of real room for
  // Kural 675's own proportions). Several distinct row bands within
  // that territory, so groups land at genuinely different heights
  // rather than one straight line.
  const wordSize = kuralLayout.kuralSize * 0.47;
  const topMargin = 24;
  const bottomMargin = Math.max(topMargin + wordSize, kuralLayout.box.y0 - 20);
  const rowBands = [topMargin + wordSize * 0.5, (topMargin + bottomMargin) / 2, bottomMargin - wordSize * 0.5];

  ctx.font = `600 ${wordSize}px ${tamilFont}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  let tokenIdx = 0;
  let rowCursor = 0; // cycles through rowBands so consecutive groups don't share a row either
  for (const group of groups) {
    const tok = tokens[tokenIdx];
    tokenIdx++;
    if (!tok) continue; // safety: more groups than tokens would be a real content mismatch

    for (const word of group) {
      const measured = ctx.measureText(word);
      const halfW = measured.width / 2;
      const halfH = wordSize * 0.6;
      let placed = false;
      for (let attempt = 0; attempt < 60 && !placed; attempt++) {
        const y = rowBands[(rowCursor + attempt) % rowBands.length];
        const xJitter = rand.range(-wordSize * 1.8, wordSize * 1.8);
        const x = Math.min(width - halfW - 4, Math.max(halfW + 4, tok.centerX + xJitter));
        const box: PlacedWordBox = { x, y, halfW, halfH };
        if (wordWouldOverlap(box, sharedPlacedBoxes)) continue;
        sharedPlacedBoxes.push(box);
        ctx.fillStyle = withAlpha(color, 0.85);
        ctx.fillText(word, x, y);
        placed = true;
      }
      rowCursor++;
    }
  }
}

/** GOLD MASTER, explicit founder correction: "i need like the down part
 *  the irultheera should come first then enni then seyal" -- the bottom
 *  group's words must appear in their real left-to-right reading order,
 *  not scattered randomly the way drawWordsInHalf placed them. Divides
 *  the available bottom width into one horizontal segment per word, in
 *  the order given, then searches for a non-overlapping position within
 *  each word's own segment -- guarantees reading order while still
 *  respecting the same shared overlap tracker every other layer uses. */
function drawWordsInReadingOrder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kuralBox: HeroLayout["box"],
  words: readonly string[],
  tamilFont: string,
  size: number,
  color: string,
  rand: SeededRandom,
  sharedPlacedBoxes: PlacedWordBox[]
): void {
  if (words.length === 0) return;
  ctx.font = `600 ${size}px ${tamilFont}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const yMin = Math.min(height - 24, kuralBox.y1b + 40);
  const yMax = height - 24;
  const margin = 60;
  const usableWidth = width - margin * 2;
  const segmentWidth = usableWidth / words.length;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const measured = ctx.measureText(word);
    const halfW = measured.width / 2;
    const halfH = size * 0.6;
    const segStart = margin + i * segmentWidth;
    const segCenterX = segStart + segmentWidth / 2;
    let placed = false;
    for (let attempt = 0; attempt < 80 && !placed; attempt++) {
      const x = Math.min(segStart + segmentWidth - halfW - 4, Math.max(segStart + halfW + 4, segCenterX + rand.range(-segmentWidth * 0.3, segmentWidth * 0.3)));
      const y = rand.range(yMin, yMax);
      const box: PlacedWordBox = { x, y, halfW, halfH };
      if (wordWouldOverlap(box, sharedPlacedBoxes)) continue;
      sharedPlacedBoxes.push(box);
      ctx.fillStyle = withAlpha(color, 0.85);
      ctx.fillText(word, x, y);
      placed = true;
    }
  }
}

/** The whole Living Field for this pass: background memory (full canvas,
 *  edge-density) plus the four resolution stages, each its own ring in
 *  edge-distance space rather than a Y-band. The fifth stage (the
 *  assembled sentence) is drawn separately by drawAssembledSentence,
 *  called from renderKuralPublishing, since it uses the locked Kural
 *  typography token rather than the field's own glyph system. */
function drawLivingField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  brahmiFont: string,
  rand: SeededRandom,
  zonePools: MilestoneZonePools,
  content: KuralPublishingContent,
  kuralLayout: HeroLayout
): void {
  const kuralBox = kuralLayout.box;
  // GOLD MASTER, real founder-reported "mashing up" fix, corrected a
  // second time after a real asymmetry was caught: "top and bottom are
  // not matching our layer where it lives" -- the top zone
  // (drawWordFormation) got its own clearing already; the bottom zone
  // (drawWordsInReadingOrder) never did, leaving it just as exposed to
  // Layer 2's letters as before any of this was fixed. Both zones only
  // need to exist for Kural 675 (the only Kural with either treatment)
  // -- every other Kural's Layers 1-3 behave exactly as before,
  // unaffected.
  const extraClearingZones =
    content.kuralNumber === "675"
      ? [computeFormationZoneBox(width, kuralLayout), computeBottomZoneBox(width, height, kuralBox)]
      : undefined;
  drawMemoryLayer(ctx, width, height, brahmiFont, rand, kuralBox, zonePools, extraClearingZones);

  // GOLD MASTER, explicit founder thumb rule: "no letter must be
  // overlapped" -- not just within one layer, across all of them. One
  // shared box-tracking array, passed to every drawRadialStage call
  // below, so Layer 3 genuinely checks against Layer 2's placements
  // too, not just its own.
  const sharedBoxes: PlacedWordBox[] = [];

  // MILESTONE 04 / STAGE 2 -- Letter Recognition: உயிர் + மெய் only (real
  // independent vowels and dead consonants this Kural actually uses --
  // zonePools.exactLetters, not the உயிர்மெய் compounds, which stay a
  // later stage). Radial (STAGE_RINGS.letters) -- no top/bottom
  // favouring, resolution grows inward from every direction.
  const letterItems = zonePools.exactLetters.length > 0 ? zonePools.exactLetters : ["அ"];
  drawRadialStage(ctx, width, height, STAGE_RINGS.letters, letterItems, rand, {
    tamilFont, fontFamily: "sans-serif", size: 17, opacity: 0.34, color: COLORS.heritageBronze,
    weight: 500, glow: false, cellW: 60, cellH: 52, allowOverlapGuard: true,
    highlightFirstOccurrence: true,
  }, kuralBox, extraClearingZones, sharedBoxes);

  // MILESTONE 04 / STAGE 3 -- Uyirmei Formation. GOLD MASTER, explicit
  // founder plan: every item drawn here is a real உயிர்மெய் compound
  // this Kural actually uses (zonePools.exactCompounds), each one
  // genuinely decomposable into real உயிர்+மெய் components (verified via
  // atomicPartsOf, the same decomposition checked turn by turn against
  // the reference table earlier) -- "born from the uyir and mei" is a
  // real content guarantee, not just a label. Placement itself is
  // radial, its own ring closer to the centre than letters
  // (STAGE_RINGS.uyirmei), matching Layer 2's own mechanism -- not
  // anchored next to specific component positions. Quiet bronze, no
  // gold, no glow, matching Layer 1/2's own restraint. Reserved centre
  // space (for the Kural/metadata later) stays untouched, since
  // STAGE_RINGS.uyirmei's own fadeOutHi already keeps it short of the
  // deepest interior.
  const uyirmeiItems = zonePools.exactCompounds.filter((c) => atomicPartsOf(c).length === 2);
  if (uyirmeiItems.length > 0) {
    drawRadialStage(ctx, width, height, STAGE_RINGS.uyirmei, uyirmeiItems, rand, {
      tamilFont, fontFamily: "serif", size: 19, opacity: 0.42, color: COLORS.heritageBronze,
      weight: 500, glow: false, cellW: 64, cellH: 56, allowOverlapGuard: true,
      highlightFirstOccurrence: true,
    }, kuralBox, extraClearingZones, sharedBoxes);
  }

  // MILESTONE 04 SCOPE: two more layers still to come (words, sentence)
  // -- kept intact and unchanged below, not deleted, ready to return one
  // at a time as each is explicitly approved.
  //
  // MILESTONE 04 / STAGE 4 -- Words With Meaning. GOLD MASTER, explicit
  // founder-authorized, and genuinely different in kind from Layers 2/3:
  // this content is NOT mechanically derivable from the Kural text the
  // way exactLetters/exactCompounds are (those come from real Unicode
  // decomposition of whatever is actually loaded). Breaking a Kural into
  // meaning-bearing chunks and choosing which word represents each idea
  // requires real semantic judgement -- worked out together turn by
  // turn for this specific Kural (675, Amaichchu Iyal) before any of
  // this was written. Curated per-Kural content, stated plainly as such,
  // not disguised as something the code figured out on its own.
  //
  // GOLD MASTER, POSITIONAL SPLIT: explicit founder correction -- "words
  // repeating" (fixed: each word now places exactly once, no
  // opportunistic Phase 2 repeats the way letters/uyirmei still have)
  // and an explicit new placement rule: words belonging to the Kural's
  // FIRST line (பொருள்/கருவி/காலம்/வினை/இடம்/ஐந்தும் -- the five
  // factors) must appear in the canvas's TOP half; words belonging to
  // the SECOND line (இருள்தீர/எண்ணி/செயல் -- the instruction) must
  // appear in the BOTTOM half. This is a real, deliberate exception to
  // the radial/no-directional-bias principle every other layer in this
  // file follows -- said plainly here rather than done quietly, and
  // justified specifically because these words carry real positional
  // meaning tied to which line of the Kural they actually come from,
  // not an arbitrary top/bottom split.
  // GOLD MASTER, WORD FORMATION: explicit founder-approved treatment,
  // built only after the real geometry was verified by direct
  // measurement, shown visually, and corrected once already ("i no
  // need extra word... porul and karuvi" -- the first version wrongly
  // drew a duplicate combined-word text; fixed to converge into the
  // Kural's own already-rendered text instead). Groups here are the
  // real written-token structure of line 1 itself: பொருள்கருவி and
  // வினையிடனொடு are genuine two-word compounds in the Kural's own
  // text, காலம் and ஐந்தும் are already standalone tokens. Order matters
  // -- must match the order these tokens actually appear in
  // content.tamilLine1, since drawWordFormation consumes tokens
  // left-to-right, one group per token, in sequence.
  //
  // ARCHITECTURAL CORRECTION, direct founder catch against a real
  // render: this treatment does NOT live inside Layer 4's own
  // designated ring (STAGE_RINGS.words, ef 0.42-0.52) the way every
  // other layer's content stays inside its own ring. It uses raw pixel
  // positioning near the canvas edges instead -- which, verified by
  // direct calculation, lands at roughly ef 0.21 for a typical word
  // here, squarely inside LAYER 2's (letters, ef 0.14-0.28) own
  // territory, not Layer 4's. This was built without flagging that
  // departure, which is the real problem -- not a matter of opinion.
  // Checked whether it could be fixed by constraining to Layer 4's own
  // ring instead: for Kural 675, STAGE_RINGS.words' own inner edge
  // (ef 0.52) lands at y~222, and the hero's clearing zone starts at
  // y~243 -- about 20px of usable space, not enough for a two-word pair
  // with staggered rows. Genuinely not geometrically workable for this
  // content, so kept here as a deliberate, explicitly acknowledged
  // exception instead -- the same honest treatment already given to the
  // top/bottom split above, not a second silent one. The shared
  // overlap-guard (sharedBoxes, passed into both drawWordFormation and
  // drawWordsInReadingOrder below) is what actually prevents this from
  // colliding with Layer 2's own glyphs -- verified working -- but it
  // does not, and cannot, keep the two layers in separate territory.
  const LAYER4_LINE1_FORMATION_GROUPS: readonly (readonly string[])[] = [
    ["பொருள்", "கருவி"],
    ["காலம்"],
    ["வினை", "இடம்"],
    ["ஐந்தும்"],
  ];
  const LAYER4_BOTTOM_WORDS_KURAL_675: readonly string[] = ["இருள்தீர", "எண்ணி", "செயல்"];
  if (content.kuralNumber === "675") {
    drawWordFormation(ctx, width, kuralLayout, content.tamilLine1, LAYER4_LINE1_FORMATION_GROUPS, tamilFont, COLORS.heritageBronze, rand, sharedBoxes);
    drawWordsInReadingOrder(ctx, width, height, kuralBox, LAYER4_BOTTOM_WORDS_KURAL_675, tamilFont, 24, COLORS.heritageBronze, rand, sharedBoxes);
  }

  // MILESTONE 04 SCOPE: one more layer still to come (the assembled
  // sentence) -- kept intact and unchanged below, not deleted.
}


/** Draws a Vatteluttu letterform from its traced outline. Identical
 *  technique to the Living Field Kernel's own renderer and the original
 *  ambient-letter-field exploration: points are in a 0-10 unit box,
 *  normalized to size-scaled coordinates centered on the current
 *  translation, filled with the even-odd rule so interior holes (letter
 *  counters) render as true gaps rather than solid fill. Caller is
 *  expected to have already translated to the glyph's origin and set
 *  fillStyle; this only builds and fills the path. */
function drawPathGlyph(ctx: CanvasRenderingContext2D, shape: GlyphPath, size: number, alsoStroke = false): void {
  ctx.beginPath();
  shape.outer.forEach((p, i) => {
    const px = (p[0] / 10 - 0.5) * size;
    const py = (p[1] / 10 - 0.5) * size;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  shape.holes.forEach((hole) => {
    hole.forEach((p, i) => {
      const px = (p[0] / 10 - 0.5) * size;
      const py = (p[1] / 10 - 0.5) * size;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
  });
  ctx.fill("evenodd");
  // GOLD MASTER: path glyphs (Vatteluttu) have no font-weight to bolden --
  // an additional stroke on the same path, using the caller's already-set
  // strokeStyle/lineWidth, approximates "thicker" for a vector shape.
  // Defaulted off so the pre-existing call site's behaviour is unchanged.
  if (alsoStroke) ctx.stroke();
}

/** GOLD MASTER, RAINFALL / FILTRATION MODEL -- the assembled Kural itself,
 *  rendered directly in the "sentence" stage's band. This is a deliberate,
 *  explicit reversal of the "do not build the Kural yet" rule every prior
 *  milestone in this arc enforced -- approved directly against a reference
 *  the founder chose, which showed the complete sentence at the bottom of
 *  exactly this five-stage structure. Simplified compared to the old
 *  drawForegroundKural (still preserved below, unchanged, unused): no
 *  logo, no meta label, no English, no footer, no rules -- this stage
 *  shows only the two Tamil lines, reusing the locked Kural typography
 *  token (size/weight unchanged) for visual consistency with every other
 *  pass that has ever rendered this text. */

/** GOLD MASTER, THE HERO -- computed once, before anything else draws,
 *  so the surrounding field can genuinely know where the Kural will sit
 *  and thin around it (see kuralClearingFactor below), rather than the
 *  Kural being drawn on top of a field that had no idea it was coming.
 *
 *  True left alignment, per explicit founder correction against a
 *  reference image: BOTH lines share the exact same left x -- not each
 *  line independently centered. Line 1 (4 words) is necessarily wider
 *  than line 2 (3 words); that is the block's own right edge, not
 *  something to normalize away. What gets centered on the canvas is the
 *  block's own bounding box (spanning from the shared left edge to
 *  line 1's right edge) -- the only way to honour both "left-aligned"
 *  and "respects the same reserved centre zone every other layer
 *  already does," which a naive text-align:left starting exactly at
 *  canvas-center would not: that would lean the whole block right of
 *  where the reserved zone actually is. */
interface HeroLayout {
  leftX: number;
  kuralY1: number;
  kuralY2: number;
  kuralSize: number;
  reflectionLines: readonly string[];
  reflectionYs: readonly number[];
  reflectionSize: number;
  metaText: string;
  metaY: number;
  metaSize: number;
  box: { x0: number; y0: number; x1: number; y1b: number };
}

/** GOLD MASTER, THE HERO, EXTENDED -- Kural + English reflection line +
 *  identity/series/issue metadata line, all sharing the SAME left edge
 *  (the same "universal, left-aligned" rule the founder locked for the
 *  Kural itself, extended to the whole editorial stack rather than
 *  treating the Kural as a one-off). The WHOLE stack -- not just the
 *  Kural -- is centred vertically as one unit, since filling the
 *  previously-reserved centre space with more than two lines means the
 *  Kural alone sitting at exact centre would push the reflection/meta
 *  lines low and unbalanced.
 *
 *  Reflection line uses content.englishLine1/englishLine2 (already
 *  real, existing fields on KuralPublishingContent -- nothing new
 *  needed, whatever the founder types into the existing form is what
 *  renders here). englishLine2 is optional -- a Kural whose reflection
 *  fits on one line simply renders one. Metadata composes from
 *  content.kuralNumber/series/issue: "Kural-{n} | {series} | Issue
 *  {issue}" -- explicit founder request, read as a pipe separator
 *  (typed as a capital I, the standard autocorrect substitution for
 *  "|"); flagged directly before building in case that reading is
 *  wrong. */
function computeHeroLayout(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  tamilFont: string,
  sansFont: string
): HeroLayout {
  const kuralToken = TYPOGRAPHY_TOKENS.kural;
  const reflectionToken = TYPOGRAPHY_TOKENS.reflection;
  const metaToken = TYPOGRAPHY_TOKENS.meta;
  const maxTextWidth = width * 0.72;

  // --- Kural ---
  const kuralLines = [content.tamilLine1, content.tamilLine2];
  const kuralSize = fitTokenSize(ctx, kuralToken, kuralLines, tamilFont, sansFont, maxTextWidth, height);
  ctx.font = tokenFont(kuralToken, kuralSize, tamilFont, sansFont);
  applyTokenTracking(ctx, kuralToken, kuralSize);
  const kuralWidth1 = ctx.measureText(content.tamilLine1).width;
  const kuralWidth2 = ctx.measureText(content.tamilLine2).width;
  const blockWidth = Math.max(kuralWidth1, kuralWidth2);
  const leftX = (width - blockWidth) / 2;
  const kuralLineGap = kuralSize * kuralToken.lineHeightRatio;

  // FIX: consistent ascent/descent fractions used everywhere below --
  // previously kuralBlockHeight used a different, smaller ascent number
  // (0.32) than the actual y1 offset used later (0.82), and none of the
  // block-height calculations accounted for descent below the LAST
  // line's baseline at all. Confirmed directly against a real render:
  // the reflection line's first line visibly overlapped the Kural's
  // second line. A block's full visual height, from a "top" cursor to
  // where the next block may safely begin, is: ascent (to the first
  // baseline) + internal line gaps + descent (below the last baseline).
  const ASCENT_FRAC = 0.82;
  const DESCENT_FRAC = 0.3;
  const kuralBlockHeight = kuralSize * ASCENT_FRAC + kuralLineGap + kuralSize * DESCENT_FRAC;

  // --- Reflection (English) ---
  // GOLD MASTER: uppercased here (not just visually styled) so
  // fitTokenSize measures the actual text that will be rendered --
  // per the founder's reference image, the reflection line is set in
  // bold, tight tracking, matching a small-caps editorial masthead
  // style -- normal case, per explicit founder correction ("i no need
  // all uppercase") against the previous all-caps version.
  const reflectionLines = [content.englishLine1, content.englishLine2].filter((l) => l.trim().length > 0);
  const reflectionSize =
    reflectionLines.length > 0
      ? fitTokenSize(ctx, reflectionToken, reflectionLines, tamilFont, sansFont, maxTextWidth, height)
      : 0;
  const reflectionLineGap = reflectionSize * reflectionToken.lineHeightRatio;
  const reflectionBlockHeight =
    reflectionLines.length > 0
      ? reflectionSize * ASCENT_FRAC + reflectionLineGap * (reflectionLines.length - 1) + reflectionSize * DESCENT_FRAC
      : 0;

  // --- Metadata ---
  // Split into two segments (bold "Kural-N" + lighter " | Series |
  // Issue X") at draw time in drawKuralHero -- metaText here stays the
  // full combined string for width/clearing-box measurement purposes.
  // Normal case, per explicit founder correction ("i no need all
  // uppercase") against the previous all-caps version.
  const metaText = `Kural-${content.kuralNumber} | ${content.series} | Issue ${content.issue}`;
  const metaSize = tokenSize(metaToken, height); // fixed-length token -- not fit-shrunk
  const metaBlockHeight = metaSize * ASCENT_FRAC + metaSize * DESCENT_FRAC;

  // --- Stack the whole block, centred as one unit ---
  // GOLD MASTER, explicit founder-approved spacing -- "Generous"
  // (1.5x / 2.8x), chosen directly against a visual exploration built
  // from this exact layout's own real pixel measurements before any
  // code was touched: previously 32px between the Kural and reflection,
  // 40px between reflection and metadata (kuralSize*0.55 / metaSize*1.3)
  // -- confirmed too tight relative to the font sizes involved. Now
  // 83px and 85px respectively for Kural 675's actual proportions.
  const gapAboveReflection = reflectionLines.length > 0 ? kuralSize * 1.5 : 0;
  const gapAboveMeta = metaSize * 2.8;
  const totalHeight = kuralBlockHeight + gapAboveReflection + reflectionBlockHeight + gapAboveMeta + metaBlockHeight;

  let cursorY = height / 2 - totalHeight / 2;
  const kuralY1 = cursorY + kuralSize * ASCENT_FRAC;
  const kuralY2 = kuralY1 + kuralLineGap;
  cursorY += kuralBlockHeight + gapAboveReflection;

  const reflectionYs: number[] = [];
  for (let i = 0; i < reflectionLines.length; i++) {
    reflectionYs.push(cursorY + reflectionSize * ASCENT_FRAC + i * reflectionLineGap);
  }
  cursorY += reflectionBlockHeight + gapAboveMeta;

  const metaY = cursorY + metaSize * ASCENT_FRAC;

  // --- Clearing box: the FULL stack, not just the Kural ---
  const padX = kuralSize * 0.4;
  const padTop = kuralSize * 0.85;
  const padBottom = metaSize * 0.5;
  return {
    leftX,
    kuralY1,
    kuralY2,
    kuralSize,
    reflectionLines,
    reflectionYs,
    reflectionSize,
    metaText,
    metaY,
    metaSize,
    box: {
      x0: leftX - padX,
      y0: kuralY1 - padTop,
      x1: leftX + blockWidth + padX,
      y1b: metaY + padBottom,
    },
  };
}

/** How strongly a given point should be suppressed for sitting inside or
 *  near the hero's own footprint -- 0 = fully suppressed (never place
 *  ambient content here, so nothing can visually collide with the
 *  ink), rising smoothly to 1 well outside the box. Explicit founder
 *  agreement: "a quiet clearing around it" -- gradual, not a hard-edged
 *  panel boundary, which every constitution in this project has argued
 *  against. */
function kuralClearingFactor(x: number, y: number, box: HeroLayout["box"], extraBoxes?: readonly HeroLayout["box"][]): number {
  // FIX: was proportional to the box's own size (18%/35% of box
  // dimensions) -- fine when the box was just the two-line Kural, but
  // once the hero grew to include the reflection and metadata lines,
  // the box got taller, and the feather grew right along with it,
  // compounding rather than staying modest. Confirmed directly by
  // computing real numbers: 0% of Layer 4's candidate cells survived
  // the clearing after that growth -- the feathered suppression zone
  // had grown to cover nearly the whole region words were allowed to
  // occupy. Fixed pixel feather instead -- a real, bounded soft edge
  // that doesn't compound as the box's own size changes.
  const featherX = 70;
  const featherY = 55;
  const clearingFor = (b: HeroLayout["box"]): number => {
    const dx = x < b.x0 ? b.x0 - x : x > b.x1 ? x - b.x1 : 0;
    const dy = y < b.y0 ? b.y0 - y : y > b.y1b ? y - b.y1b : 0;
    if (dx === 0 && dy === 0) return 0; // inside the box -- fully clear
    const t = Math.min(1, Math.max(dx / featherX, dy / featherY));
    return t * t * (3 - 2 * t); // smoothstep -- gradual, no hard edge
  };
  // GOLD MASTER, real founder-reported "mashing up" fix: word formation
  // (drawWordFormation, and its bottom-group counterpart
  // drawWordsInReadingOrder) lives outside Layer 4's own ring, in the
  // same physical territory Layer 2's letters occupy -- verified
  // previously, and not fixable by relocating the treatment (not
  // enough vertical room in Layer 4's own ring for this content). The
  // actual fix is the other direction: give BOTH zones their own
  // suppression here, the same technique already used for the hero's
  // own clearing, so Layer 1/2/3's ambient content stops populating the
  // same pixels the formation/reading-order words occupy -- at either
  // edge, not just the top one. extraBoxes is an array, not a single
  // box, precisely because the top zone (near y=0) and bottom zone
  // (near y=height) are non-contiguous -- one box can't represent both.
  // Optional so every existing caller (the hero's own clearing) is
  // unaffected.
  let result = clearingFor(box);
  if (extraBoxes) {
    for (const b of extraBoxes) {
      result = Math.min(result, clearingFor(b));
    }
  }
  return result;
}

/** The hero itself. Real typeset text via fillText -- not glyph-by-glyph
 *  field placement like every other layer -- is itself the deliberate
 *  technique contrast that marks this as the one thing that survived,
 *  per explicit founder agreement. No glow (agreed: "pure survival, zero
 *  decoration"). No internal weight hierarchy between words -- explicit
 *  founder disagreement with giving செயல் extra emphasis; every word
 *  renders at identical weight and colour, uniformly. Reflection and
 *  meta lines reuse the already-locked tokens exactly as specified
 *  (reflection: italic sans; meta: tamil-family per the constitution,
 *  not overridden here) -- both share the Kural's own left edge. */
/** GOLD MASTER, explicit founder-approved emboss treatment for the Kural
 *  itself -- "Option C: raised emboss, stronger depth," chosen directly
 *  against an exploration built on the real current background (warm
 *  parchment centre, kuralInk text), not a hypothetical one. Classic
 *  layered-offset technique -- there is no native Canvas emboss filter,
 *  so this is genuinely how it has to be built: a dark shadow copy
 *  offset down-right, a light highlight copy offset up-left, then the
 *  real ink colour on top. Scoped to the Kural's own two lines only, per
 *  the request itself ("give some embossed effect to the kural") --
 *  reflection/meta stay plain. */
function drawEmbossedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void {
  const offset = 2.4;
  const opacity = 0.55;
  ctx.fillStyle = withAlpha("#000000", opacity);
  ctx.fillText(text, x + offset, y + offset);
  ctx.fillStyle = withAlpha("#FFFFFF", opacity);
  ctx.fillText(text, x - offset, y - offset);
  ctx.fillStyle = COLORS.kuralInk;
  ctx.fillText(text, x, y);
}

function drawKuralHero(ctx: CanvasRenderingContext2D, content: KuralPublishingContent, layout: HeroLayout, tamilFont: string, sansFont: string): void {
  const kuralToken = TYPOGRAPHY_TOKENS.kural;
  const reflectionToken = TYPOGRAPHY_TOKENS.reflection;
  const metaToken = TYPOGRAPHY_TOKENS.meta;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = tokenFont(kuralToken, layout.kuralSize, tamilFont, sansFont);
  applyTokenTracking(ctx, kuralToken, layout.kuralSize);
  drawEmbossedText(ctx, content.tamilLine1, layout.leftX, layout.kuralY1);
  drawEmbossedText(ctx, content.tamilLine2, layout.leftX, layout.kuralY2);

  if (layout.reflectionLines.length > 0) {
    ctx.font = tokenFont(reflectionToken, layout.reflectionSize, tamilFont, sansFont);
    applyTokenTracking(ctx, reflectionToken, layout.reflectionSize);
    ctx.fillStyle = withAlpha(COLORS.kuralInk, 0.82);
    for (let i = 0; i < layout.reflectionLines.length; i++) {
      ctx.fillText(layout.reflectionLines[i], layout.leftX, layout.reflectionYs[i]);
    }
  }

  // GOLD MASTER: metadata split into two segments to match the
  // reference image -- "KURAL-N" bold, " | SERIES | ISSUE X" lighter.
  // A single fillText call can't express two weights, so this measures
  // the bold segment's width first to know where the lighter segment
  // starts. Both share the meta token's widened tracking.
  ctx.font = tokenFont(metaToken, layout.metaSize, tamilFont, sansFont);
  applyTokenTracking(ctx, metaToken, layout.metaSize);
  const metaColor = withAlpha(mix(COLORS.heritageBronze, COLORS.kuralInk, 0.35), 1.0);
  const boldSegment = `Kural-${content.kuralNumber}`;
  const restSegment = ` | ${content.series} | Issue ${content.issue}`;

  ctx.font = `700 ${layout.metaSize}px ${tamilFont}, sans-serif`;
  applyTokenTracking(ctx, metaToken, layout.metaSize);
  ctx.fillStyle = metaColor;
  ctx.fillText(boldSegment, layout.leftX, layout.metaY);
  const boldWidth = ctx.measureText(boldSegment).width;

  ctx.font = tokenFont(metaToken, layout.metaSize, tamilFont, sansFont);
  applyTokenTracking(ctx, metaToken, layout.metaSize);
  ctx.fillStyle = metaColor;
  ctx.fillText(restSegment, layout.leftX + boldWidth, layout.metaY);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawAssembledSentence(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  tamilFont: string,
  sansFont: string
): void {
  const kuralToken = TYPOGRAPHY_TOKENS.kural;
  const maxTextWidth = width * 0.86;
  const lines = [content.tamilLine1, content.tamilLine2];
  const size = fitTokenSize(ctx, kuralToken, lines, tamilFont, sansFont, maxTextWidth, height);
  const lineGap = size * kuralToken.lineHeightRatio;
  const cy = height / 2;
  const y1 = cy - lineGap / 2 + size * 0.32;
  const y2 = y1 + lineGap;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = tokenFont(kuralToken, size, tamilFont, sansFont);
  applyTokenTracking(ctx, kuralToken, size);
  ctx.fillStyle = COLORS.kuralInk;
  ctx.fillText(content.tamilLine1, width / 2, y1);
  ctx.fillText(content.tamilLine2, width / 2, y2);
}



// ---------------------------------------------------------------------------
// GOLD MASTER SPRINT 02 -- the Kural does not sit in an editorial column
// beside the field. It sits INSIDE the same field everything else is
// dissolving in, and is the one thing in it that resolved. No masthead,
// no rules, no divider, no boxed column -- "the moment you draw a line to
// separate language from text, you've rebuilt the exact wall this idea
// exists to dissolve." குறள் [n] is the smallest fragment that also
// happened to survive, sitting close enough to read as part of the same
// small miracle, not a caption introducing it. English is a whisper
// written in the margin after reading the sentence. The logo is
// discovered last, alone, small, near the close of the page -- never
// paired with anything, never announced.
// ---------------------------------------------------------------------------

// MILESTONE 01: not called this milestone (see renderKuralPublishing) --
// "no typography, no editorial block, no logo, no footer... only the
// journey is shown." The Sprint 01-03 composition below is fully intact
// and unchanged, ready to return exactly as-is once a future milestone
// asks for the editorial layer back.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawForegroundKural(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  /** The caller passes the serif fonts here (tamilSerifFont, serifFont)
   *  per the locked Typography System. */
  tamilFont: string,
  sansFont: string,
  logoImage: HTMLImageElement | null
): void {
  // The Kural resolves inside the field, not after a boundary the field
  // stops at -- left-aligned per the locked Kural display rule, but its
  // left edge is a resolution point in the field, not a column edge.
  const leftX = width * 0.45;
  const maxTextWidth = width - leftX - width * 0.04;

  // குறள் [n] -- the smallest fragment that also survived, sitting just
  // above the Kural as part of the same small miracle, not a masthead.
  const metaToken = TYPOGRAPHY_TOKENS.meta;
  const metaSize = tokenSize(metaToken, height);
  const metaY = height * 0.375;
  ctx.textAlign = metaToken.align;
  ctx.textBaseline = "alphabetic";
  ctx.font = tokenFont(metaToken, metaSize, tamilFont, sansFont);
  applyTokenTracking(ctx, metaToken, metaSize);
  ctx.fillStyle = withAlpha(COLORS.heritageBronze, 0.85);
  ctx.fillText(`குறள் ${content.kuralNumber}`, leftX, metaY);

  // The Kural -- the one complete sentence. Unchanged size, weight, and
  // ink from every prior pass; only where it sits in the page changed.
  const kuralToken = TYPOGRAPHY_TOKENS.kural;
  const kuralLines = [content.tamilLine1, content.tamilLine2];
  const kuralSize = fitTokenSize(ctx, kuralToken, kuralLines, tamilFont, sansFont, maxTextWidth, height);
  const kuralY1 = height * 0.44;
  const kuralY2 = kuralY1 + kuralSize * kuralToken.lineHeightRatio;

  ctx.textAlign = kuralToken.align;
  ctx.font = tokenFont(kuralToken, kuralSize, tamilFont, sansFont);
  applyTokenTracking(ctx, kuralToken, kuralSize);
  ctx.fillStyle = COLORS.kuralInk;
  ctx.fillText(content.tamilLine1, leftX, kuralY1);
  ctx.fillText(content.tamilLine2, leftX, kuralY2);

  // English -- a whisper written in the margin after reading the
  // sentence, not a second voice competing for the eye. Close beneath,
  // not a formally separated row.
  const reflectionToken = TYPOGRAPHY_TOKENS.reflection;
  const englishLines = [content.englishLine1, content.englishLine2];
  const engSize = fitTokenSize(ctx, reflectionToken, englishLines, tamilFont, sansFont, maxTextWidth, height);
  const engY1 = kuralY2 + height * 0.055;
  const engY2 = engY1 + engSize * reflectionToken.lineHeightRatio;

  ctx.textAlign = reflectionToken.align;
  ctx.font = tokenFont(reflectionToken, engSize, tamilFont, sansFont);
  applyTokenTracking(ctx, reflectionToken, engSize);
  ctx.fillStyle = withAlpha(COLORS.kuralInk, 0.62);
  ctx.fillText(content.englishLine1, leftX, engY1);
  ctx.fillText(content.englishLine2, leftX, engY2);

  // Footer -- present, but unimportant. The smallest thing near the
  // Kural's close, no separator, no ornament.
  const footerToken = TYPOGRAPHY_TOKENS.footer;
  const footerSize = tokenSize(footerToken, height);
  const footerY = engY2 + height * 0.06;
  ctx.textAlign = footerToken.align;
  ctx.font = tokenFont(footerToken, footerSize, tamilFont, sansFont);
  applyTokenTracking(ctx, footerToken, footerSize);
  ctx.fillStyle = withAlpha(COLORS.mutedEarth, 0.85);
  ctx.fillText(`${content.series} \u2022 #${content.issue}`, leftX, footerY);

  // The logo -- discovered last, alone, small, near the close of the
  // page. Never paired with anything, never at the top, never announced.
  if (logoImage) {
    const naturalW = logoImage.naturalWidth || logoImage.width;
    const naturalH = logoImage.naturalHeight || logoImage.height;
    if (naturalW && naturalH) {
      const logoH = height * 0.05;
      const scale = logoH / naturalH;
      const w = naturalW * scale;
      const logoX = leftX;
      const logoY = footerY + height * 0.05;
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(logoImage, logoX, logoY, w, logoH);
      ctx.restore();
    }
  }
}

/** Shrinks a token's size (never below its own minSizeRatio floor) until
 *  every line fits maxWidth, using the browser's own text metrics -- not
 *  an estimate, and measured WITH the token's tracking applied, so a
 *  tracked token (Reflection) can never be under-measured and clip once
 *  drawn. This is the fit-shrink safety net: Kural and Reflection can
 *  never be clipped by the canvas edge regardless of edited content
 *  length. Restores no state on its own; caller sets ctx.font and
 *  tracking again before actually drawing. */
function fitTokenSize(
  ctx: CanvasRenderingContext2D,
  token: TypographyToken,
  lines: readonly string[],
  tamilFont: string,
  sansFont: string,
  maxWidth: number,
  height: number
): number {
  let size = tokenSize(token, height);
  const minSize = tokenMinSize(token, height);
  while (size > minSize) {
    ctx.font = tokenFont(token, size, tamilFont, sansFont);
    applyTokenTracking(ctx, token, size);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(color: string): [number, number, number] {
  // FIX: accepts both "#RRGGBB" hex and "rgb(r, g, b)" strings -- mix()
  // returns the latter, and this function is sometimes called on mix()'s
  // own output (chained/double blending). Without this, that chain
  // silently produced NaN channels -> a solid black fill, confirmed
  // directly by rendering it.
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g);
    if (parts && parts.length >= 3) {
      return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
    }
  }
  return [
    parseInt(color.slice(1, 3), 16),
    parseInt(color.slice(3, 5), 16),
    parseInt(color.slice(5, 7), 16),
  ];
}

/** Blends two hex colours, t=0 -> a, t=1 -> b. Used to derive every
 *  atmosphere/contrast tone in this file from the existing design tokens,
 *  rather than introducing new arbitrary colours. */
function mix(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(r1 + (r2 - r1) * c);
  const g = Math.round(g1 + (g2 - g1) * c);
  const b = Math.round(b1 + (b2 - b1) * c);
  return `rgb(${r}, ${g}, ${b})`;
}

function mixAlpha(hexA: string, hexB: string, t: number, alpha: number): string {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const c = Math.max(0, Math.min(1, t));
  const r = Math.round(r1 + (r2 - r1) * c);
  const g = Math.round(g1 + (g2 - g1) * c);
  const b = Math.round(b1 + (b2 - b1) * c);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}
