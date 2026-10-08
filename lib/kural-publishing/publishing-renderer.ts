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

import { createSeededRandom } from "./seeded-random";
import {
  deriveSeed,
  type KuralPublishingContent,
} from "./kural200-state";
import {
  smoothNoise,
  drawGlyphGridField,
  extractTamilGraphemes as extractTamilSyllables,
  type AmbientClearBox,
} from "./ambient-language-layer";

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

/** Resolves a token's target size in px for the given canvas dimensions.
 *  This is the size fit-shrink text starts from (Kural, Reflection) or
 *  the size fixed-length text renders at directly (Meta, Footer).
 *
 *  FIX, found while adding new export formats (WhatsApp Status/
 *  Instagram Story/Instagram Post): this scaled by height alone, which
 *  happened to work for every format built so far because height was
 *  always the smaller dimension (1648x928 landscape, 1080x1080 square).
 *  The first portrait format (1080x1920) exposed the real assumption --
 *  confirmed directly by rendering it: reflection and metadata text
 *  overflowed off the right edge, since sizing scaled up with the much
 *  taller height while the available width stayed narrow. Scaling by
 *  the smaller of width/height instead is a no-op for every existing
 *  format (where height already IS the smaller dimension) and correctly
 *  shrinks text for any format where width becomes the real constraint. */
function tokenSize(token: TypographyToken, width: number, height: number): number {
  return Math.min(width, height) * BASE_SIZE_FRACTION * token.sizeRatio;
}

/** Resolves a token's safety-floor size in px -- fit-shrink text may
 *  shrink toward this but never below it. Same width/height fix as
 *  tokenSize above, for the same reason. */
function tokenMinSize(token: TypographyToken, width: number, height: number): number {
  return Math.min(width, height) * BASE_SIZE_FRACTION * token.minSizeRatio;
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
   *  as traced vector paths (see drawGlyphGridField/drawVatteluttuGlyph
   *  in ambient-language-layer.ts). */
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
  /** GOLD MASTER, explicit founder request: social-format exports (WhatsApp
   *  Status, Instagram Post, Instagram Story) need a small wordmark +
   *  handle for social use -- the original landscape publication format
   *  does not. Both optional and both off by default, so every existing
   *  caller (the current landscape page) is completely unaffected unless
   *  it explicitly opts in. Real text supplied by the founder ("AiA --
   *  Aram in Action" / "aram_in_action"), not invented. */
  brandingWordmark?: string;
  brandingHandle?: string;
}

export function renderKuralPublishing(
  ctx: CanvasRenderingContext2D,
  opts: RenderKuralPublishingOptions
): void {
  const { width, height, content, tamilFont, sansFont, tamilSerifFont, serifFont, brahmiFont } = opts;
  const rand = createSeededRandom(deriveSeed(content.kuralNumber));

  // Real substrings of the actual verified Kural text, not invented glyphs --
  // this is the glyph field's own content pool (see drawGlyphGridField
  // below), so it's always tied to what's actually loaded, never
  // fabricated.
  const kuralSyllables = extractTamilSyllables(
    `${content.tamilLine1} ${content.tamilLine2}`
  );

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height);

  // GOLD MASTER, THE HERO -- layout computed FIRST, before any field
  // content draws, so the field can genuinely know where the Kural will
  // sit and thin around it (see the clearBox passed to drawGlyphGridField
  // below) rather than the Kural being stamped on top of a field that had
  // no idea it was coming.
  // GOLD MASTER: explicit founder instruction -- Noto Sans Tamil for the
  // Kural, not Noto Serif Tamil. Passing tamilFont/sansFont (the sans
  // pair) into the "tamil" font slot instead of tamilSerifFont/serifFont.
  const kuralLayout = computeHeroLayout(ctx, width, height, content, tamilFont, sansFont);

  // GOLD MASTER, CORRECTED, explicit founder correction against the
  // SAME reference image sent twice: "i checked but im not getting the
  // same colours and effect used in the attached image." Real mistake
  // in the previous pass, not a new request -- misread "not faded" as
  // "not toned" and removed the bronze treatment entirely, when the
  // reference actually wants BOTH at once: full opacity/clarity AND
  // warm bronze/antique toning (the reference's own circle background
  // is a dark warm brown, not the source PNG's navy blue; its circuit
  // tracery reads gold/amber, not the source's cyan). Restoring the
  // 'color'-blend bronze tint (verified working, including the circular
  // clip fix for the transparent-corner bleed bug found earlier) at a
  // stronger intensity than the previous muted pass used, since the
  // reference shows the blue almost entirely replaced by warm tones,
  // not just partially shifted.
  const logoRect = opts.logoImage ? computeLogoRect(ctx, kuralLayout, tamilFont, opts.logoImage, width, height) : null;

  if (opts.logoImage && logoRect) {
    const logoW = logoRect.x1 - logoRect.x0;
    const logoH = logoRect.y1b - logoRect.y0;
    const centerX = logoRect.x0 + logoW / 2;
    const centerY = logoRect.y0 + logoH / 2;
    const rotationRad = (-13 * Math.PI) / 180;

    ctx.save();
    ctx.globalAlpha = 0.97;
    ctx.shadowColor = "rgba(36, 30, 24, 0.35)"; // COLORS.kuralInk at low alpha -- a soft, warm-dark shadow, not pure black
    ctx.shadowBlur = 22;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 8;
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.drawImage(opts.logoImage, -logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();

    // Bronze/antique toning -- 'color' blend mode shifts hue/saturation
    // toward heritageBronze while preserving the original artwork's own
    // luminance (the actual engraved detail survives, this never
    // flattens into a solid tint). Clipped to the seal's real circular
    // extent (not its square bounding box) -- the earlier bleed bug
    // into the PNG's transparent corners is still fixed here.
    ctx.save();
    ctx.globalAlpha = 0.8;
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationRad);
    ctx.beginPath();
    ctx.arc(0, 0, logoW / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = COLORS.heritageBronze;
    ctx.fillRect(-logoW / 2, -logoH / 2, logoW, logoH);
    ctx.restore();
  }

  // Ambient Tamil glyph field -- the same dot-grid tiling (polka-dot
  // texture, letters only) built for the Aathichoodi carousel's Slide 4
  // dashed card, per explicit founder direction to replace this cover's
  // whole previous bespoke ambient system (Layer 1-4, Formation Paths,
  // milestone-gated stages) with it wholesale. Real letters from the
  // actual Kural text (kuralSyllables, never invented), Vatteluttu/
  // Tamil-Brahmi mixed in and concentrated toward the outer edge (see
  // drawGlyphGridField's own doc comment). Cleared only around the Kural/
  // reflection/metadata stack, NOT the seal logo -- per computeLogoRect's
  // own doc comment ("CORRECTION, watermark revision"), the logo is used
  // as a watermark, so ambient content should pass naturally OVER it, not
  // be kept clear of it. ancientFont passes this app's real loaded Noto
  // Sans Brahmi font (brahmiFont, see RenderKuralPublishingOptions)
  // instead of the Aathichoodi version's literal "sans-serif" fallback,
  // since one is actually available here.
  const kuralClearBox: AmbientClearBox = {
    x: kuralLayout.box.x0,
    y: kuralLayout.box.y0,
    width: kuralLayout.box.x1 - kuralLayout.box.x0,
    height: kuralLayout.box.y1b - kuralLayout.box.y0,
  };
  drawGlyphGridField(ctx, {
    width,
    height,
    rand,
    font: tamilFont,
    ancientFont: brahmiFont,
    glyphPool: kuralSyllables.length > 0 ? kuralSyllables : ["அ"],
    clearBox: kuralClearBox,
    colors: [
      { color: COLORS.heritageBronze, weight: 5 },
      { color: COLORS.illuminatedGold, weight: 2 },
    ],
  });

  // The hero itself, drawn last -- on top of the (now cleared-around)
  // field, real typeset text, no glow, uniform weight throughout.
  drawKuralHero(ctx, content, kuralLayout, tamilFont, sansFont);

  if (opts.brandingWordmark || opts.brandingHandle) {
    drawSocialBranding(ctx, width, height, opts.brandingWordmark, opts.brandingHandle, sansFont);
  }

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
  // GOLD MASTER, ORGANIC ILLUMINATION: explicit founder correction --
  // "the existing background has a warm central glow... it currently
  // risks looking like a conventional spotlight... break the
  // symmetry... diffused natural light falling across handmade paper."
  // The base gradient's own distance metric (softEdgeDistance) is
  // perfectly symmetric by construction -- smooth-min of distance to
  // all four edges, meaning the brightest point is always exactly
  // centred and the falloff is always geometrically even. The EXISTING
  // drawLocalTonalVariation pass below already adds noise-based
  // variation, but confirmed by close inspection that it's too subtle
  // (a max +/-5% brightness delta) to break the base gradient's own
  // structural symmetry -- the "centred glow" read comes from the base
  // gradient itself, not from lacking a second layer on top of it.
  // Fixed at the source: the distance value itself is perturbed by a
  // large-scale, slow noise field (smoothNoise at a wide gridStep, the
  // same "strata" scale organicDepth already uses below) before being
  // used for brightness, so the illumination's own shape becomes
  // organic -- the brightest region shifts and the falloff becomes
  // uneven, rather than staying perfectly circular. Zero rand draws
  // (pure function of position), so this can't perturb the RNG sequence
  // any other layer depends on.
  const norm = Math.min(width, height) * 0.5;
  const softness = Math.min(width, height) * 0.16;
  const cell = 10;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const edgeColor = mix(COLORS.vignetteEdge, COLORS.heritageBronze, 0.22);
  const illuminationPerturbStrength = norm * 0.16;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cy = r * cell;
      const rawD = softEdgeDistance(cx, cy, width, height, softness);
      const perturb = (smoothNoise(cx + 3000, cy + 3000, 340) - 0.5) * 2 * illuminationPerturbStrength;
      const d = rawD + perturb;
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

/** GOLD MASTER, THE HERO -- computed once, before anything else draws,
 *  so the surrounding field can genuinely know where the Kural will sit
 *  and thin around it (see the clearBox built from this layout's own
 *  `box`, passed to drawGlyphGridField in renderKuralPublishing), rather
 *  than the Kural being drawn on top of a field that had no idea it was
 *  coming.
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
  const kuralSize = fitTokenSize(ctx, kuralToken, kuralLines, tamilFont, sansFont, maxTextWidth, width, height);
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
      ? fitTokenSize(ctx, reflectionToken, reflectionLines, tamilFont, sansFont, maxTextWidth, width, height)
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
  const metaSize = tokenSize(metaToken, width, height); // fixed-length token -- not fit-shrunk
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

/** GOLD MASTER, explicit founder-approved placement (revised from an
 *  earlier "beside the reflection" version): "near the metadata line
 *  and much bigger in size." Measures the metadata line's own real
 *  width (re-using the exact bold+regular split drawKuralHero itself
 *  renders with) and uses the gap to its right, same principle as the
 *  earlier reflection placement but against a different, wider anchor.
 *
 *  Vertical placement is NOT centred on the metadata line -- verified
 *  by direct measurement that only ~15px of room exists between the
 *  metadata line and the hero box's own bottom edge, nowhere near
 *  enough to centre a genuinely bigger mark. Instead the logo's TOP
 *  aligns near the metadata's own height and extends downward into the
 *  real open space below the hero box (roughly 239px of canvas room
 *  before the bottom edge for this canvas size), so a bigger size has
 *  somewhere real to go rather than being forced into a 15px gap. */
/** GOLD MASTER, explicit founder placement (multiply-revised): "why
 *  can't we use the space [to the right of the hero block] and double
 *  the size" -- superseded a first version that sat beside the metadata
 *  line alone. Verified by direct measurement before building, across
 *  every row in the hero stack, not just one: the Kural's own first
 *  line is the widest element (right edge at x~1337 for Kural 675),
 *  leaving essentially no safe gap beside it -- so a genuinely bigger
 *  logo can't sit beside the Kural rows. Positioned instead below both
 *  Kural lines (clear of kuralY2), to the right of the reflection's own
 *  longest line, sized to roughly double the previous pass.
 *
 *  CORRECTION, watermark revision: this rect was previously ALSO passed
 *  into drawLivingField as an exclusion zone, since at this size the
 *  logo extends past the hero box's own edges into territory ambient
 *  content could otherwise reach. That's gone now -- explicit founder
 *  request to use the logo "as a watermark," which means ambient
 *  content should pass naturally OVER it, not be kept clear of it. This
 *  function still only computes WHERE the logo goes (position/size),
 *  not whether anything else avoids that space. Returns null if there's
 *  genuinely no room, rather than forcing an overlap. */
function computeLogoRect(
  ctx: CanvasRenderingContext2D,
  layout: HeroLayout,
  tamilFont: string,
  logoImage: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): HeroLayout["box"] | null {
  const reflectionToken = TYPOGRAPHY_TOKENS.reflection;
  ctx.font = tokenFont(reflectionToken, layout.reflectionSize, tamilFont, tamilFont);
  applyTokenTracking(ctx, reflectionToken, layout.reflectionSize);
  const reflectionRightEdge =
    layout.reflectionLines.length > 0
      ? Math.max(...layout.reflectionLines.map((l) => layout.leftX + ctx.measureText(l).width))
      : layout.leftX;

  const naturalW = logoImage.naturalWidth || logoImage.width;
  const naturalH = logoImage.naturalHeight || logoImage.height;
  if (!naturalW || !naturalH) return null;

  const margin = 30;
  const startX = reflectionRightEdge + margin;
  const startY = layout.kuralY2 + margin;
  // "Double the size" -- roughly double the previous metadata-side
  // sizing (0.16 -> 0.32 of canvas height), capped by whichever real
  // constraint is tighter: staying on-canvas horizontally, or
  // vertically before the canvas's own bottom edge.
  const maxByWidth = canvasWidth - startX - margin;
  const maxByHeight = canvasHeight - startY - margin;
  const targetH = Math.min(canvasHeight * 0.32, maxByWidth / (naturalW / naturalH), maxByHeight);
  if (targetH < 24) return null; // genuinely no room -- skip rather than force an overlap

  const scale = targetH / naturalH;
  const w = naturalW * scale;
  return { x0: startX, y0: startY, x1: startX + w, y1b: startY + targetH };
}

/** GOLD MASTER, explicit founder request: "add branding elements for
 *  social use" for the new WhatsApp Status / Instagram Post / Instagram
 *  Story export formats -- the original landscape publication format
 *  does not carry this (see renderKuralPublishing, which only calls this
 *  when brandingWordmark/brandingHandle are explicitly supplied). Real
 *  text supplied directly by the founder, not invented: wordmark "AiA --
 *  Aram in Action", handle "aram_in_action".
 *
 *  Positioned near the bottom of the canvas, centred horizontally, well
 *  below the hero stack -- deliberately the quietest text on the page,
 *  matching the established hierarchy (Kural > reflection > metadata >
 *  branding). Sized off Math.min(width,height), same fix as tokenSize/
 *  tokenMinSize, so it scales sensibly across the very different aspect
 *  ratios these export formats use (portrait, square) without needing a
 *  separate size table per format. */
function drawSocialBranding(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  wordmark: string | undefined,
  handle: string | undefined,
  sansFont: string
): void {
  const scale = Math.min(width, height);
  const wordmarkSize = scale * 0.024;
  const handleSize = scale * 0.018;
  const bottomMargin = scale * 0.045;
  const gap = scale * 0.012;

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const handleY = height - bottomMargin;
  const wordmarkY = handle ? handleY - handleSize - gap : handleY;

  if (wordmark) {
    ctx.font = `600 ${wordmarkSize}px ${sansFont}`;
    ctx.fillStyle = withAlpha(COLORS.kuralInk, 0.7);
    ctx.fillText(wordmark, width / 2, wordmarkY);
  }
  if (handle) {
    ctx.font = `500 ${handleSize}px ${sansFont}`;
    ctx.fillStyle = withAlpha(COLORS.heritageBronze, 0.75);
    ctx.fillText(`@${handle.replace(/^@/, "")}`, width / 2, handleY);
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
  width: number,
  height: number
): number {
  let size = tokenSize(token, width, height);
  const minSize = tokenMinSize(token, width, height);
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
