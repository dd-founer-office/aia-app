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

import { MODERN_TAMIL, TAMIL_BRAHMI, VATTELUTTU, type Glyph, type GlyphPath } from "@/lib/living-field/glyphs";
import { createSeededRandom, type SeededRandom } from "./seeded-random";
import {
  deriveSeed,
  REGIONS,
  type FormationNode,
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
    letterSpacingEm: 0.02,
    align: "left",
  },
  reflection: {
    role: "Reflection -- English secondary voice",
    fontFamily: "sans",
    weight: 500,
    italic: true,
    sizeRatio: 1.575,
    minSizeRatio: 1.35,
    lineHeightRatio: 1.55,
    letterSpacingEm: 0.02,
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
  const { width, height, content, tamilFont, brahmiFont } = opts;
  const rand = createSeededRandom(deriveSeed(content.kuralNumber));

  // Real substrings of the actual verified Kural text, not invented glyphs --
  // used to bias what the field shows as it approaches the formation region,
  // per "content becomes MORE specific as the field becomes LESS dense."
  const kuralSyllables = extractTamilSyllables(
    `${content.tamilLine1} ${content.tamilLine2}`
  );

  // MILESTONE 01 -- this Kural's exact மெய்/உயிர் units, exact உயிர்மெய்
  // compounds, and actual words, all derived from the real content (see
  // buildMilestoneZonePools's doc comment).
  const zonePools = buildMilestoneZonePools(kuralSyllables, content);

  // GOLD MASTER, explicit founder-authorized: the six Formation Nodes are
  // no longer static, Kural-200-specific data -- derived fresh from
  // whatever content is actually loaded (see deriveFormationNodes).
  const formationNodes = deriveFormationNodes(content);

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height);

  // Built once, at the exact point in the RNG sequence pass 04 already built
  // it (immediately before the ambient field's own pocket noise) -- shared
  // with the formation layer below so secondary paths can genuinely
  // "connect clusters" instead of guessing at where they are. This ordering
  // is what keeps this pass's composition byte-identical to pass 04's
  // wherever this pass doesn't intentionally change something.
  const macro = buildMacroClusters(rand, formationNodes);

  drawAmbientField(ctx, width, height, tamilFont, brahmiFont, rand, kuralSyllables, zonePools, macro, formationNodes);
  drawFormationLayer(ctx, width, height, tamilFont, rand, formationNodes);

  // MILESTONE 01 SCOPE: "No typography. No editorial block. No logo. No
  // footer... The completed Kural is NOT rendered. Only the journey is
  // shown." drawForegroundKural and the debug overlay are deliberately
  // not called this milestone -- both still exist, untouched, ready to
  // return once a future milestone explicitly asks for the editorial
  // layer back. Nothing about them was changed; they are simply not
  // part of this deliverable.
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

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Reference-matched ground: light warm cream everywhere, with only a
  // soft vignette deepening toward the extreme left edge. Gradient stops
  // are the measured fractions from the approved target image (sampled at
  // x-fracs 0.018 / 0.09 / 0.24, fully resolved cream by ~0.4).
  const colorEnd = REGIONS.denseEnd * 0.82;

  const base = ctx.createLinearGradient(0, 0, width, 0);
  base.addColorStop(0, mix(COLORS.vignetteEdge, COLORS.heritageBronze, 0.4));
  base.addColorStop(0.02, COLORS.vignetteEdge);
  base.addColorStop(0.09, mix(COLORS.vignetteEdge, COLORS.warmParchment, 0.5));
  base.addColorStop(0.24, mix(COLORS.vignetteEdge, COLORS.warmParchment, 0.82));
  base.addColorStop(0.42, COLORS.warmParchment);
  base.addColorStop(1, COLORS.warmParchment);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // No elongated "vein" strata patches, and no darker-toned variant --
  // removed entirely per founder direction. Against the light reference
  // ground, even a low-opacity darkened patch read as a visible shadow
  // shape, not texture. Depth now comes only from drawLocalTonalVariation
  // and drawParchmentTexture below -- fine, cell-based grain with no
  // large-scale shape to be seen as an artifact.

  drawLocalTonalVariation(ctx, width, height, colorEnd);
  drawParchmentTexture(ctx, width, height, colorEnd);
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
  height: number,
  colorEnd: number
): void {
  const cell = 13;
  const cols = Math.ceil((colorEnd * width) / cell);
  const rows = Math.ceil(height / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cell;
      const cy = r * cell;
      const xFrac = cx / width;
      const fade = Math.max(0, 1 - xFrac / colorEnd);
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
 *  rand draws, so it can't perturb composition), but confined to the
 *  editorial region and at roughly a third of the amplitude -- this is
 *  meant to be felt, not seen. Pure warm-toward-parchment variation only;
 *  never introduces the dark tones the language side uses. */
function drawParchmentTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colorEnd: number
): void {
  const cell = 18;
  const startCol = Math.floor((colorEnd * width) / cell);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  for (let r = 0; r < rows; r++) {
    for (let c = startCol; c < cols; c++) {
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
// Ambient field -- a true micro-language mass. Population is dominated by
// tiny/micro marks (per founder direction: roughly 65% micro/tiny, 25%
// small/medium, 8% large, 2% ghost, as a visual-hierarchy target, not an
// exact quota). Darkness is local and irregular (macro clusters + fine
// pockets), and large glyphs are actively suppressed in the transition zone
// so the centre doesn't read as "unrelated large letters."
// ---------------------------------------------------------------------------

/** Continuous exponential decay from the extreme left edge -- no plateau,
 *  no hard stop. "Maximum glyph density only at the extreme left edge...
 *  density decreases continuously across the entire canvas... never stop
 *  at 40%, never stop at 60%, continue fading until the far right." This
 *  never returns exactly zero (asymptotic decay), which is what makes the
 *  eventual population placement in drawAmbientField a true continuous
 *  fade rather than a boundary -- "fog disappearing into air," not a wall. */
function baseFalloff(xFrac: number): number {
  // MILESTONE 01: retuned from 6.0. That decay was tuned for a page where
  // the Kural itself was the payoff at the far end, so the field could
  // fade to near-nothing approaching it. This milestone has NO Kural --
  // the exact-letters/exact-compounds/words zones ARE the payoff, and
  // need genuine visible population for the evolution to actually read,
  // not just be structurally correct at near-zero opacity. Flattened so
  // density only drops to roughly a fifth of its start value by the far
  // edge, not a few tenths of a percent.
  const k = 1.8;
  return Math.exp(-k * xFrac);
}

interface MacroCluster {
  cx: number;
  cy: number;
  r: number;
  strength: number;
}

/** "Clusters within clusters" -- irregular topography, not a flat density
 *  value across the left field. One cluster is fixed (not random) around
 *  the "formed"/"selected" formation nodes specifically, so that region
 *  always has accumulated material to be "selected" from, regardless of
 *  seed or content; the rest are seeded and vary with content. */
function buildMacroClusters(rand: SeededRandom, nodes: readonly FormationNode[]): MacroCluster[] {
  const clusters: MacroCluster[] = [];

  const selNode = nodes.find((n) => n.id === "sel");
  const f2Node = nodes.find((n) => n.id === "f-2") ?? nodes.find((n) => n.id === "f-1");
  if (selNode && f2Node) {
    clusters.push({
      cx: (selNode.x + f2Node.x) / 2,
      cy: (selNode.y + f2Node.y) / 2,
      r: 0.1,
      strength: 0.4,
    });
  }

  const count = 8;
  for (let i = 0; i < count; i++) {
    clusters.push({
      cx: rand.range(0.02, 0.72),
      cy: rand.range(0.05, 0.95),
      r: rand.range(0.08, 0.22),
      strength: rand.range(0.25, 0.75),
    });
  }
  return clusters;
}

function macroBumpAt(clusters: readonly MacroCluster[], xFrac: number, yFrac: number): number {
  let bump = 0;
  for (const c of clusters) {
    const dx = xFrac - c.cx;
    const dy = (yFrac - c.cy) * 0.6; // clusters read wider than tall
    const d2 = dx * dx + dy * dy;
    bump += c.strength * Math.exp(-d2 / (c.r * c.r * 0.5));
  }
  return bump;
}

/** Fine pocket grid -- small clearings and denser patches within a macro
 *  cluster, looked up with light neighbour-averaging so edges blend rather
 *  than showing a visible grid. */
const POCKET_COLS = 13;
const POCKET_ROWS = 8;

function buildPocketField(rand: SeededRandom): number[][] {
  const field: number[][] = [];
  for (let r = 0; r < POCKET_ROWS; r++) {
    const row: number[] = [];
    // GOLD MASTER SPRINT 03: widened from 0.45-1.65 to 0.12-2.3 -- genuine
    // near-empty patches alongside genuinely denser ones, not a narrow
    // range that reads as smooth variance. "Some areas are dense. Some
    // are empty." The disappearance should feel organic and archaeological,
    // not like an even fade.
    for (let c = 0; c < POCKET_COLS; c++) row.push(rand.range(0.12, 2.3));
    field.push(row);
  }
  return field;
}

function pocketMultiplierAt(field: number[][], xFrac: number, yFrac: number): number {
  const fc = Math.min(POCKET_COLS - 1, Math.max(0, Math.floor(xFrac * POCKET_COLS)));
  const fr = Math.min(POCKET_ROWS - 1, Math.max(0, Math.floor(yFrac * POCKET_ROWS)));
  const rightC = Math.min(POCKET_COLS - 1, fc + 1);
  const belowR = Math.min(POCKET_ROWS - 1, fr + 1);
  return (field[fr][fc] * 2 + field[fr][rightC] + field[belowR][fc]) / 4;
}

/** Final MVP pass: a small local clearing around every Formation Node
 *  position -- "immediately around each survivor... create a subtle local
 *  clearing... reduce unrelated ambient glyph competition." A pure spatial
 *  density multiplier, not a change to glyph categorisation or the
 *  Kural-bias logic (both frozen this pass) -- it only thins out whatever
 *  would otherwise land in that small radius. This is the direct fix for
 *  survivor glyphs (சொ especially) previously reading as duplicated by
 *  nearby ambient/Kural-material text sitting right on top of them. */
const CLEARING_RADIUS = 0.05;
const CLEARING_STRENGTH = 0.55;

function clearingAt(xFrac: number, yFrac: number, nodes: readonly FormationNode[]): number {
  let factor = 1;
  for (const node of nodes) {
    const dx = xFrac - node.x;
    const dy = (yFrac - node.y) * 0.6;
    const d2 = dx * dx + dy * dy;
    const dip = CLEARING_STRENGTH * Math.exp(-d2 / (CLEARING_RADIUS * CLEARING_RADIUS * 0.5));
    factor = Math.min(factor, 1 - dip);
  }
  return Math.max(0.15, factor);
}

/** GOLD MASTER SPRINT 03: "the only object that feels perfectly preserved
 *  ... its ink is deeper, its edges are cleaner." Not a size or weight
 *  change (both locked) -- a density clearing over the Kural's own two
 *  lines specifically, so nothing in the field ever sits directly behind
 *  or through its actual letterforms. The field still shows in the
 *  margins around it (above குறள் [n], between the lines, below toward
 *  English) -- only the two exact bands the Kural itself occupies clear. */
const KURAL_CLEAR_X = 0.45;
const KURAL_CLEAR_Y1 = 0.44;
const KURAL_CLEAR_Y2 = 0.531;
const KURAL_CLEAR_RADIUS_Y = 0.035;

function kuralClearingAt(xFrac: number, yFrac: number): number {
  if (xFrac < KURAL_CLEAR_X) return 1;
  const r2 = KURAL_CLEAR_RADIUS_Y * KURAL_CLEAR_RADIUS_Y * 0.5;
  const dy1 = yFrac - KURAL_CLEAR_Y1;
  const dy2 = yFrac - KURAL_CLEAR_Y2;
  const dip1 = 0.9 * Math.exp(-(dy1 * dy1) / r2);
  const dip2 = 0.9 * Math.exp(-(dy2 * dy2) / r2);
  return Math.max(0.05, 1 - Math.max(dip1, dip2));
}

function densityAt(
  xFrac: number,
  yFrac: number,
  macro: readonly MacroCluster[],
  pockets: number[][],
  nodes: readonly FormationNode[]
): number {
  const base = baseFalloff(xFrac);
  if (base <= 0) return 0;
  const bump = 1 + macroBumpAt(macro, xFrac, yFrac);
  const pocket = pocketMultiplierAt(pockets, xFrac, yFrac);
  const clearing = clearingAt(xFrac, yFrac, nodes);
  const kuralClearing = kuralClearingAt(xFrac, yFrac);
  return Math.max(0, Math.min(2.6, base * bump * pocket * clearing * kuralClearing));
}

/** MILESTONE 01/2 -- Living Language Evolution / Formation Grammar. Zones, left to right,
 *  each a real linguistic stage: random Tamil-Brahmi, random Vatteluttu,
 *  random Modern Tamil, then narrowing to what THIS Kural actually needs
 *  -- its exact மெய்/உயிர் letters, then its exact உயிர்மெய் compounds,
 *  then its actual words. All derived from `content` at render time
 *  (never hardcoded to Kural 200 specifically), the same principle
 *  extractTamilSyllables already uses -- if the control panel content
 *  changes, these zones recompute correctly.
 *
 *  The completed Kural is never rendered as editorial text this
 *  milestone -- see renderKuralPublishing, which does not call
 *  drawForegroundKural at all right now. Only the journey is shown. */
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

/** GOLD MASTER, explicit founder-authorized replacement for the old
 *  hardcoded FORMATION_NODES: derives the same SHAPE of formation story
 *  (two components merging into a formed fragment, extending into an
 *  emerging fragment, plus one independent selected word -- exactly the
 *  ச்+ஒ->சொ->சொல் / பயன் structure the original data always had) from
 *  whichever Kural's content is actually loaded, instead of always
 *  showing Kural 200's own words regardless of content. Confirmed
 *  necessary directly: rendering Kural 517 with the old static data
 *  showed சொல்/பயன் -- words with nothing to do with the loaded verse.
 *
 *  Positions are the same six fixed slots the field has used since the
 *  last rescale (still inside the dense-fragments zone) -- only WHICH
 *  glyphs occupy them is now dynamic, not where they sit. Deterministic:
 *  always the first real word for the component/formed/emerging chain,
 *  always the next distinct word for "selected," so the same content
 *  always produces the same six nodes. */
function deriveFormationNodes(content: KuralPublishingContent): readonly FormationNode[] {
  const positions: { id: string; x: number; y: number; emphasis: FormationNode["emphasis"] }[] = [
    { id: "c-1", x: 0.228, y: 0.34, emphasis: "component" },
    { id: "c-2", x: 0.239, y: 0.63, emphasis: "component" },
    { id: "c-3", x: 0.38, y: 0.605, emphasis: "component" },
    { id: "f-1", x: 0.338, y: 0.49, emphasis: "formed" },
    { id: "f-2", x: 0.373, y: 0.4, emphasis: "emerging" },
    { id: "sel", x: 0.346, y: 0.565, emphasis: "selected" },
  ];

  const words = `${content.tamilLine1} ${content.tamilLine2}`
    .split(/\s+/)
    .filter((w) => w.length > 0);
  const wordA = words[0];
  const wordB = words.find((w) => w !== wordA) ?? words[0];

  if (!wordA) {
    // Defensive fallback only -- content should never actually be empty,
    // but never render nothing rather than crash.
    return [];
  }

  const graphemesA = extractTamilSyllables(wordA);
  const firstGrapheme = graphemesA[0] ?? wordA;
  const atoms = atomicPartsOf(firstGrapheme);
  const nodes: FormationNode[] = [];

  if (atoms.length === 2) {
    // The common case: the first grapheme is a real உயிர்மெய், so it has
    // two genuine atomic parts -- exactly the ச்+ஒ->சொ shape.
    nodes.push({ id: "c-1", glyph: atoms[0], x: positions[0].x, y: positions[0].y, emphasis: "component" });
    nodes.push({ id: "c-2", glyph: atoms[1], x: positions[1].x, y: positions[1].y, emphasis: "component" });
  } else {
    // The first grapheme was already atomic (a real உயிர், or already a
    // pulli-form மெய்) -- nothing to decompose, so it stands alone as
    // its own single component rather than manufacturing a second one
    // that doesn't linguistically exist.
    nodes.push({ id: "c-1", glyph: atoms[0], x: positions[0].x, y: positions[0].y, emphasis: "component" });
  }

  // A third component, if this Kural's real content offers one: the
  // grapheme immediately after the first, shown as its own atomic root
  // (matching ல்'s original role -- a separate root joining the chain,
  // not part of the same உயிர்மெய்).
  if (graphemesA[1]) {
    const secondAtoms = atomicPartsOf(graphemesA[1]);
    nodes.push({ id: "c-3", glyph: secondAtoms[0], x: positions[2].x, y: positions[2].y, emphasis: "component" });
  }

  nodes.push({ id: "f-1", glyph: firstGrapheme, x: positions[3].x, y: positions[3].y, emphasis: "formed" });

  const twoGraphemePrefix = graphemesA.slice(0, 2).join("");
  if (twoGraphemePrefix && twoGraphemePrefix !== firstGrapheme) {
    nodes.push({ id: "f-2", glyph: twoGraphemePrefix, x: positions[4].x, y: positions[4].y, emphasis: "emerging" });
  }

  if (wordB) {
    nodes.push({ id: "sel", glyph: wordB, x: positions[5].x, y: positions[5].y, emphasis: "selected" });
  }

  return nodes;
}

/** GOLD MASTER MILESTONE 2 REBOOT -- The Evolution of Language. The zone
 *  LIST, boundaries, and blending logic below are exactly as Milestone 2
 *  left them -- untouched, per "do not discard any existing work." What
 *  metric decides zone membership has changed TWICE now: Milestone 2 used
 *  xFrac (implied a left-to-right reading direction -- rejected). 2A used
 *  radial distance from one fixed point (implied language "rushing toward
 *  a destination," explicitly rejected this reboot: "NOT convergence...
 *  NOT iron filings pulled by a magnet"). This version uses distance from
 *  the NEAREST canvas edge instead -- "outer regions" (all four, not one
 *  corner) are Ancient Memory, and resolution grows inward from every
 *  side into a broad interior band, not toward a single point. That
 *  interior is an actual band of space, not a coordinate, which is also
 *  structurally why this can't collapse into "one dense cluster" the way
 *  2A did -- there is no single (x,y) everything is pulled toward. See
 *  edgeGrowthFrac() below, and its call site in drawAmbientGlyph. */
function edgeGrowthFrac(x: number, y: number, width: number, height: number): number {
  const distToEdge = Math.min(x, width - x, y, height - y);
  const maxPossible = Math.min(width, height) / 2;
  return maxPossible > 0 ? Math.min(1, distToEdge / maxPossible) : 0;
}

/** GOLD MASTER MILESTONE 2 -- Formation Grammar. Five explicit states,
 *  restructured from Milestone 1's six sequential zones per the founder's
 *  new grouping: State 1 (Ancient Memory) mixes Tamil-Brahmi, Vatteluttu,
 *  and Modern Tamil TOGETHER in the same region, rather than as three
 *  separate consecutive zones -- "random, unrelated, no meaning." States
 *  2-5 (Modern Tamil Letters / Required Letters / Uyirmei Formation /
 *  Word Formation) map directly onto Milestone 1's modern/exactLetters/
 *  exactCompounds/words pools, which needed no changes -- only the
 *  grouping and boundaries did. Locked and untouched by this milestone:
 *  baseFalloff, drawAtmosphere, the placement grid, and every opacity/
 *  size formula -- "do not modify density, background, fade behaviour,
 *  overall field composition." This only changes WHICH POOL a glyph's
 *  characters draw from at a given position, never whether/how brightly
 *  it draws. Blending in the last 35% of each state's span is unchanged
 *  from Milestone 1 -- still no hard boundaries. As of Milestone 2A, the
 *  "position" fed in is radial distance from the Kural's centre, not
 *  xFrac -- see edgeGrowthFrac above. */
const MILESTONE_ZONES = [
  { name: "ancientMemory", lo: 0, hi: 0.22 },
  { name: "modernOnly", lo: 0.22, hi: 0.4 },
  { name: "requiredLetters", lo: 0.4, hi: 0.58 },
  { name: "uyirmeiFormation", lo: 0.58, hi: 0.76 },
  { name: "wordFormation", lo: 0.76, hi: 1.0 },
] as const;

function pickMilestoneZone(growthFrac: number, rand: SeededRandom): (typeof MILESTONE_ZONES)[number]["name"] {
  let idx = MILESTONE_ZONES.length - 1;
  for (let i = 0; i < MILESTONE_ZONES.length; i++) {
    if (growthFrac < MILESTONE_ZONES[i].hi || i === MILESTONE_ZONES.length - 1) {
      idx = i;
      break;
    }
  }
  const zone = MILESTONE_ZONES[idx];
  const span = zone.hi - zone.lo;
  const progress = span > 0 ? (growthFrac - zone.lo) / span : 1;
  const blendStart = 0.65;
  if (progress > blendStart && idx < MILESTONE_ZONES.length - 1) {
    const blendT = (progress - blendStart) / (1 - blendStart);
    if (rand.chance(Math.min(1, blendT))) return MILESTONE_ZONES[idx + 1].name;
  }
  return zone.name;
}

function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  brahmiFont: string,
  rand: SeededRandom,
  kuralSyllables: readonly string[],
  zonePools: MilestoneZonePools,
  macro: readonly MacroCluster[],
  nodes: readonly FormationNode[]
): void {
  // GOLD MASTER MILESTONE 2 REBOOT: "words should NEVER overlap, never
  // stack, never become a cloud." Tracked for the lifetime of this one
  // field-drawing pass -- every Region 4/5 word-like placement checks
  // against every box already placed before it, and only commits if
  // clear. Never reset mid-pass; this is what makes the guarantee global
  // across the whole canvas, not just locally per-cluster.
  const placedWordBoxes: PlacedWordBox[] = [];

  // Formation Nodes (ச்/ஒ/ல்/சொ/சொல்/பயன்) are drawn by a SEPARATE system
  // (drawFormationLayer, called after this function returns) at fixed
  // positions from kural200-state.ts -- the ambient word-placement below
  // has no way to know they exist unless told. Pre-seeded here so words
  // correctly avoid colliding with them too, not just with each other.
  // Sized off each node's own emphasis tier max size, with generous
  // padding since Tamil glyphs can render wider than their nominal size.
  for (const node of nodes) {
    const style = EMPHASIS_STYLE[node.emphasis];
    const approxHalf = style.maxSize * 1.1;
    placedWordBoxes.push({
      x: node.x * width,
      y: node.y * height,
      halfW: approxHalf,
      halfH: approxHalf,
    });
  }

  // A finer grid still -- more addressable slots for the micro-mass this
  // pass asks for.
  const colW = 19;
  const rowH = 20;
  const cols = Math.ceil(width / colW);
  const rows = Math.ceil(height / rowH);

  const pockets = buildPocketField(rand);

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const xFrac = (c * colW) / width;
      const yFrac = (r * rowH) / height;
      const density = densityAt(xFrac, yFrac, macro, pockets, nodes);
      // GOLD MASTER SPRINT 02: lowered from 0.004 to genuinely let the
      // far edge of a full-canvas field still occasionally place a mark,
      // not just skip forever -- "still present, still dissolving, never
      // abruptly ending" has to be true all the way to x=1, not just
      // true in theory. This is still a skip for slots too faint to
      // matter at all, not a boundary -- density keeps decaying
      // continuously past this point regardless.
      if (density <= 0.0006) {
        c += 6;
        continue;
      }

      const gap = Math.max(3, Math.round(rand.range(2, 4) * (1.6 - Math.min(1.3, density))));
      c += gap;
      if (c >= cols) break;

      const maxClusterLen =
        density > 1.7 ? 11 : density > 1.2 ? 8 : density > 0.7 ? 5 : density > 0.35 ? 3 : 1;
      const clusterLen = rand.int(1, maxClusterLen + 1);

      for (let i = 0; i < clusterLen && c < cols; i++, c += density > 1.5 ? (rand.chance(0.5) ? 1 : 2) : rand.chance(0.35) ? 2 : 3) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        const cxFrac = cx / width;
        const cyFrac = cy / height;
        const d = densityAt(cxFrac, cyFrac, macro, pockets, nodes);
        if (d <= 0.0006) continue;
        // Regions that breathe -- not every slot fires even inside a dense
        // pocket. Far to the right this naturally makes placement rare
        // without ever forbidding it outright.
        if (!rand.chance(Math.min(1, d * 0.6 + 0.05))) continue;

        drawAmbientGlyph(ctx, cx, cy, width, height, d, cxFrac, tamilFont, brahmiFont, rand, kuralSyllables, zonePools, placedWordBoxes);
        // A second, even smaller pass of pure micro-dot texture layered
        // right alongside the glyphs -- "atmospheric texture" without any
        // imported imagery: fine traces, not letters.
        if (rand.chance(0.22)) drawMicroTrace(ctx, cx, cy, d, rand);
      }
    }
  }
}

/** Four population strata (micro/tiny, small/medium, large, distant-giant),
 *  plus a rare "anchor" carved out of the large tier for genuine
 *  high-presence marks. Weighted heavily toward the tiny end -- per
 *  founder direction, roughly 65/25/8/2 as a visual-hierarchy target.
 *  STARFIELD MODEL: size varies only modestly across all four strata
 *  (roughly 6-19px, not the old 4-80px) -- "stars aren't wildly uneven in
 *  size; some shine, some sit quiet." Brightness (opacity), not scale, is
 *  what carries the "some shine, some quiet" hierarchy. Large-tier
 *  probability is actively suppressed as xFrac moves into the transition
 *  zone, folding that mass back into the micro tier, so the centre stops
 *  reading as scattered letters. As xFrac increases, glyph choice is
 *  increasingly drawn from the real Kural syllables rather than the full
 *  modern-Tamil set -- content narrows as density falls. */
function drawAmbientGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  density: number,
  xFrac: number,
  tamilFont: string,
  brahmiFont: string,
  rand: SeededRandom,
  kuralSyllables: readonly string[],
  zonePools: MilestoneZonePools,
  placedWordBoxes: PlacedWordBox[]
): void {
  // Suppress LARGE/GHOST probability as the field moves toward the
  // formation region -- their mass folds back into MICRO instead.
  const centreSuppress = Math.max(0, Math.min(1, (xFrac - REGIONS.denseEnd * 0.4) / (REGIONS.denseEnd * 0.9)));
  const pMicro = 0.65 + 0.08 * centreSuppress;
  const pSmallMed = 0.25 + 0.02 * centreSuppress;
  const pLarge = Math.max(0.01, 0.08 - 0.08 * centreSuppress);
  // pGhost is whatever remains.

  const roll = rand.next();
  let size: number;
  let baseOpacity: number;
  let colorMix: number; // 0 = heritage bronze, 1 = kural ink (near-black)
  let wide = false;
  // MILESTONE 01: which CONTENT a glyph draws from is now governed purely
  // by spatial zone (see pickMilestoneZone below), not by how visually
  // prominent its size tier is -- the old "large/anchor tiers must always
  // be Kural material" rule belonged to the previous continuous-wave
  // system and is superseded by the explicit zone system (now five
  // states, per GOLD MASTER Milestone 2's Formation Grammar restructure).

  // STARFIELD MODEL: stars aren't wildly uneven in size -- some shine,
  // some sit quiet, but the sky doesn't contain a handful of letters 10x
  // the size of their neighbours. Size range compressed from the old
  // 4-80px (~20x variance) to roughly 6-19px (~3x) across every tier;
  // "shine vs quiet" is now carried almost entirely by opacity/brightness,
  // not scale. The old GHOST tier (42-80px) is gone outright -- there is
  // no star that dwarfs the rest of the sky.
  if (roll < pMicro) {
    size = rand.range(6, 9); // quiet, distant stars -- the bulk of the sky
    baseOpacity = rand.range(0.03, 0.12);
    colorMix = 0.05;
  } else if (roll < pMicro + pSmallMed) {
    size = rand.range(8, 12); // ordinary stars -- a little closer, a little steadier
    baseOpacity = rand.range(0.08, 0.24);
    colorMix = 0.28;
  } else if (roll < pMicro + pSmallMed + pLarge) {
    const isAnchor = rand.chance(0.14); // genuinely rare, high-presence
    if (isAnchor) {
      size = rand.range(13, 18); // a star that shines -- brighter, only modestly bigger
      baseOpacity = rand.range(0.5, 0.75);
      colorMix = 0.82;
      // Reference-matched: no gold/cyan illumination in the field -- the
      // reference image's glyphs are all quiet bronze/tan on the light
      // ground. Anchors keep their presence through size/opacity alone.
      // (rand rolls preserved so the downstream sequence is unchanged.)
      rand.chance(0.22);
      rand.chance(0.08);
    } else {
      size = rand.range(11, 15);
      baseOpacity = rand.range(0.22, 0.4);
      colorMix = 0.5;
    }
  } else {
    size = rand.range(14, 20); // a distant giant -- still barely bigger than
    baseOpacity = rand.range(0.02, 0.05); // its neighbours, just very dim
    colorMix = 0.1;
    wide = true;
    // Rare, very faint, and only slightly larger -- prominence stays about
    // brightness, not scale, even for the field's biggest marks.
  }

  const jitterRange = wide ? 30 : 7;
  const jitterX = rand.range(-jitterRange, jitterRange);
  const jitterY = rand.range(-jitterRange, jitterRange);

  // GOLD MASTER MILESTONE 2 -- Formation Grammar. Five states, left to
  // right: (1) Ancient Memory -- Tamil-Brahmi, Vatteluttu, and Modern
  // Tamil MIXED together, random, unrelated; (2) Modern Tamil Letters --
  // ancient scripts fade out, still random, no words; (3) Required
  // Letters -- only this Kural's exact மெய்/உயிர் units remain probable;
  // (4) Uyirmei Formation -- this Kural's exact உயிர்மெய் compounds;
  // (5) Word Formation -- this Kural's actual words, still floating
  // independently, never arranged into sentence structure. Zone
  // boundaries blend into each other (see pickMilestoneZone) rather than
  // cutting hard -- "no visible boundary" still holds even though the
  // stages themselves are explicit and literal, not a continuous wave.
  // The completed Kural itself is never assembled here; see
  // renderKuralPublishing, which does not call drawForegroundKural this
  // milestone -- "stop at the word level."
  const growthFrac = edgeGrowthFrac(x, y, width, height);
  const zone = pickMilestoneZone(growthFrac, rand);
  let ambient: AmbientGlyph;
  // GOLD MASTER MILESTONE 04 -- Law 8/9 made visual: only requiredLetters,
  // uyirmeiFormation, and wordFormation ever draw content that is
  // genuinely tied to this Kural. ancientMemory and modernOnly (and the
  // defensive fallback) are, by definition, "everything else" -- the
  // content Law 9 says must quietly return to memory as resolution
  // happens nearby. This flag is what lets the opacity/colour step below
  // tell those two cases apart.
  let isRequired = false;
  if (zone === "ancientMemory") {
    // "Contains Tamil-Brahmi, Vatteluttu, Modern Tamil. Random.
    // Unrelated." -- an equal three-way roll per glyph, not proportional
    // to each script's real character-set size, so all three are
    // genuinely visible as a mix rather than Modern Tamil's 247 drowning
    // out Brahmi's 24 and Vatteluttu's 21.
    const scriptRoll = rand.next();
    if (scriptRoll < 1 / 3) {
      ambient = rand.pick(HISTORICAL_POOL.filter((g) => g.script === "brahmi"));
    } else if (scriptRoll < 2 / 3) {
      ambient = rand.pick(HISTORICAL_POOL.filter((g) => g.script === "vatteluttu"));
    } else {
      ambient = { glyph: rand.pick(MODERN_TAMIL.glyphs), script: "modern" };
    }
  } else if (zone === "modernOnly") {
    ambient = { glyph: rand.pick(MODERN_TAMIL.glyphs), script: "modern" };
  } else if (zone === "requiredLetters" && zonePools.exactLetters.length > 0) {
    ambient = { glyph: { kind: "text", value: rand.pick(zonePools.exactLetters) }, script: "modern" };
    isRequired = true;
  } else if (zone === "uyirmeiFormation" && zonePools.wordFormationStages.length > 0) {
    // Region 4 -- Formation: a random word, at a random point in its own
    // grapheme-safe progressive growth (இ -> இத -> இதனை). Every stage is
    // a real, valid prefix -- never a severed glyph -- because it was
    // built from extractTamilSyllables' grapheme segmentation, not a raw
    // character slice.
    const stages = rand.pick(zonePools.wordFormationStages);
    ambient = { glyph: { kind: "text", value: rand.pick(stages) }, script: "modern" };
    isRequired = true;
  } else if (zone === "wordFormation" && zonePools.words.length > 0) {
    ambient = { glyph: { kind: "text", value: rand.pick(zonePools.words) }, script: "modern" };
    isRequired = true;
  } else {
    // Defensive fallback only -- e.g. a future Kural with no உயிர்மெய்
    // compounds at all would otherwise have nothing to draw from in
    // that zone. Falls back to this Kural's syllables generally, then
    // to plain Modern Tamil, never to an empty draw.
    ambient = kuralSyllables.length > 0
      ? { glyph: { kind: "text", value: rand.pick(kuralSyllables) }, script: "modern" }
      : { glyph: rand.pick(MODERN_TAMIL.glyphs), script: "modern" };
  }

  // Optical Calibration Version C, revised for the starfield model:
  // historical scripts read visually quieter than Modern Tamil at the
  // same nominal size, so both Tamil-Brahmi and Vatteluttu get a
  // brightness (opacity) floor to compensate -- size is deliberately left
  // untouched now, per "don't increase font size... stars aren't wildly
  // uneven in size." Brahmi additionally renders at font-weight 500
  // rather than 400 for the same reason -- the only weight Noto Sans
  // Brahmi actually ships is 400, so this asks the browser's own
  // synthetic-bold fallback for the extra weight rather than a real
  // loaded weight; harmless, and it's the closest approximation available.
  const isHistorical = ambient.script !== "modern";
  // Starfield rule: visibility comes from brightness, not scale -- so
  // historical scripts get NO size adjustment at all now (previously a
  // 12.5%-plus-floor size boost, which directly contradicted "don't
  // increase font size"). They stay exactly the size their tier already
  // gave them; what makes them findable is a genuine brightness floor.
  //
  // MILESTONE 01 exception: multi-character WORDS are a different case
  // entirely -- a whole word rendered at a single letter's 6-20px size
  // is just an illegible smear, which would defeat the entire point of
  // this milestone (proving the field can show "words forming"). Words
  // get a real size floor so they read as words, not noise.
  const isWord =
    (zone === "wordFormation" || zone === "uyirmeiFormation") &&
    ambient.glyph.kind === "text" &&
    ambient.glyph.value.length > 1;
  const calibratedSize = isWord ? Math.max(size * 1.8, 16) : size;

  // Opacity is now a direct, floor-less function of density -- as density
  // continuously decays toward the right edge (see baseFalloff), opacity
  // decays with it, genuinely toward zero, not toward some minimum
  // presence. This is what makes far-right glyphs "almost subconscious"
  // rather than just smaller/rarer at a constant faint brightness.
  const baseCalibratedOpacity = isWord
    ? Math.max(baseOpacity * 1.6, 0.18)
    : isHistorical
      ? Math.max(baseOpacity * 1.3, 0.22)
      : baseOpacity;

  // GOLD MASTER MILESTONE 04 -- Law 9, Elimination, made visual: "everything
  // that is no longer required simply returns to the Living Language
  // Field... the page should become quieter, not emptier." Required
  // content (isRequired) is exempt -- per Law 8/"Recognition," it gains
  // confidence through being SELECTED more often as growthFrac increases
  // (already true via pickMilestoneZone's blending), not through being
  // rendered brighter or bigger here. Everything else quietly loses
  // certainty as growthFrac increases: opacity eases down (never to zero
  // -- memory doesn't vanish, it just quiets) and colour eases back
  // toward bronze, away from ink, so unrelated marks read as
  // less-certain even when they still happen to appear near a place
  // where something is resolving.
  const certaintyLoss = isRequired ? 1 : 1 - growthFrac * 0.55;
  const opacity = Math.min(1, baseCalibratedOpacity * Math.min(1, density * 1.25) * certaintyLoss);
  const colorMixDecayed = isRequired ? colorMix : colorMix * certaintyLoss;

  const color = mix(COLORS.heritageBronze, COLORS.kuralInk, colorMixDecayed);
  ctx.fillStyle = withAlphaRgb(color, opacity);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (ambient.glyph.kind === "path") {
    ctx.save();
    ctx.translate(x + jitterX, y + jitterY);
    drawPathGlyph(ctx, ambient.glyph.value, calibratedSize);
    ctx.restore();
  } else if (isWord) {
    // GOLD MASTER MILESTONE 2 REBOOT: "words should NEVER overlap, never
    // stack, never become a cloud. Each word deserves space." Set the
    // font FIRST so measureText reflects the real size/weight this word
    // would actually draw at, then check the resulting footprint against
    // every word already committed this pass. If it collides, this
    // candidate simply never gets drawn -- "some words are only half
    // formed, some nearly complete" already licenses an attempt not
    // completing; skipping silently is exactly that, not a bug.
    const weight = ambient.script === "brahmi" ? 500 : 400;
    const family = ambient.script === "brahmi" ? brahmiFont : tamilFont;
    ctx.font = `${weight} ${calibratedSize}px ${family}`;
    const measured = ctx.measureText(ambient.glyph.value);
    const candidate: PlacedWordBox = {
      x: x + jitterX,
      y: y + jitterY,
      halfW: measured.width / 2,
      halfH: calibratedSize * 0.6,
    };
    if (!wordWouldOverlap(candidate, placedWordBoxes)) {
      ctx.fillText(ambient.glyph.value, candidate.x, candidate.y);
      placedWordBoxes.push(candidate);
    }
  } else {
    const weight = ambient.script === "brahmi" ? 500 : 400;
    const family = ambient.script === "brahmi" ? brahmiFont : tamilFont;
    ctx.font = `${weight} ${calibratedSize}px ${family}`;
    ctx.fillText(ambient.glyph.value, x + jitterX, y + jitterY);
  }
}

/** Draws a Vatteluttu letterform from its traced outline. Identical
 *  technique to the Living Field Kernel's own renderer and the original
 *  ambient-letter-field exploration: points are in a 0-10 unit box,
 *  normalized to size-scaled coordinates centered on the current
 *  translation, filled with the even-odd rule so interior holes (letter
 *  counters) render as true gaps rather than solid fill. Caller is
 *  expected to have already translated to the glyph's origin and set
 *  fillStyle; this only builds and fills the path. */
function drawPathGlyph(ctx: CanvasRenderingContext2D, shape: GlyphPath, size: number): void {
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
}

/** A single tiny hairline mark -- pure procedural texture, not a letterform
 *  and not a particle. Gold Master direction is explicit: avoid anything
 *  that resembles particles or digital noise. A short stroke reads as an
 *  ink trace or a worn mark in material; a filled dot reads as a rendered
 *  point -- the difference is deliberate. */
function drawMicroTrace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: number,
  rand: SeededRandom
): void {
  const len = rand.range(1.4, 3.4);
  const angle = rand.range(0, Math.PI);
  const opacity = rand.range(0.02, 0.06) * (0.5 + density * 0.5);
  const dx = rand.range(-10, 10);
  const dy = rand.range(-10, 10);
  const x1 = x + dx;
  const y1 = y + dy;
  const x2 = x1 + Math.cos(angle) * len;
  const y2 = y1 + Math.sin(angle) * len;
  ctx.strokeStyle = withAlpha(COLORS.heritageBronze, opacity);
  ctx.lineWidth = 0.6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ---------------------------------------------------------------------------
// Formation Paths -- the structural system, not decoration behind letters.
// Three tiers: TERTIARY (many, hairline, very faint, local), SECONDARY
// (moderate, visible on inspection, connect clusters), PRIMARY (3-5,
// clearly discoverable, the actual linguistic/emergence journeys). Paths
// are drawn before glyphs, so glyph clusters naturally occlude parts of
// them -- "some paths should disappear behind glyph clusters."
// ---------------------------------------------------------------------------

/** A point along a grown trunk or scattered trace -- used only to let the
 *  debug overlay redraw the exact same shapes at high contrast. No extra
 *  RNG draws happen when redrawing these, so debug rendering never touches
 *  determinism and stays fully decoupled from export. */
interface TrunkPoint {
  x: number;
  y: number;
}

/** One grown Formation Path family -- kept for the debug overlay's type,
 *  though `trunks` is always empty now that path lines aren't drawn (see
 *  "remove the formation vein"). `kind` distinguished an actual linguistic
 *  construction from an atmospheric Semantic Trace when both still drew. */
interface FormationTrunkRecord {
  points: TrunkPoint[];
  kind: "formation" | "semantic";
  label: string;
}

export interface FormationDebugInfo {
  trunks: FormationTrunkRecord[];
  markers: { x: number; y: number; label: string }[];
}

function drawFormationLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom,
  nodes: readonly FormationNode[]
): FormationDebugInfo {
  const trunks: FormationTrunkRecord[] = [];
  const markers: { x: number; y: number; label: string }[] = [];

  ctx.lineCap = "round";

  // Background root filament network removed entirely per founder
  // direction ("remove the formation vein") -- it drew nothing but
  // decorative connecting lines, exactly what was asked to go.

  // GOLD MASTER: node lookups are role-based now (formed/emerging/
  // selected), not by the old Kural-200-specific ids ("f-cho"/"f-chol"/
  // "f-payan") -- deriveFormationNodes generates different glyphs and ids
  // for different content, but the emphasis roles are always present in
  // the same shape, so keying off role is what actually generalizes.
  const formedNode = nodes.find((n) => n.emphasis === "formed");
  const emergingNode = nodes.find((n) => n.emphasis === "emerging");
  const selectedNode = nodes.find((n) => n.emphasis === "selected");

  // FORMATION FAMILY: the formed fragment's convergence point -- "a single
  // small, precious glow... it marks the glyph itself as a place something
  // happened, without drawing how." Line removed per founder direction
  // ("remove the formation vein"); only the glyphs themselves
  // (drawFormationNode, below) and their small convergence marks remain.
  if (formedNode) {
    drawPathGlowPoint(ctx, width * formedNode.x, height * formedNode.y, COLORS.heritageBronze, 0.09);
  }

  // The system continues extending past the first convergence.
  if (emergingNode) {
    drawPathGlowPoint(ctx, width * emergingNode.x, height * emergingNode.y, COLORS.heritageBronze, 0.1);
  }

  // The selected node -- a fully INDEPENDENT survivor, not something the
  // formed/emerging chain linguistically produces. Deliberately no trunk
  // or trace drawn between them, per the same founder direction.
  if (selectedNode) {
    drawPathGlowPoint(ctx, width * selectedNode.x, height * selectedNode.y, COLORS.heritageBronze, 0.09);
  }

  for (const node of nodes) {
    drawFormationNode(ctx, node, width, height, tamilFont, rand);
    markers.push({ x: node.x * width, y: node.y * height, label: `${node.glyph} (${node.emphasis})` });
  }

  return { trunks, markers };
}


/** A very few points along a real Formation Path get a small, precious
 *  illumination halo of their own -- "small path moments." Deterministic:
 *  only ever called at the specific t values a family designates as
 *  meaningful (its activation peak, its resolution end), never scattered
 *  randomly across the whole network -- "light should travel through
 *  selected relationships, not coat the whole system." */
function drawPathGlowPoint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  strength: number
): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, 10);
  grad.addColorStop(0, withAlpha(color, strength));
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
}


/** Styling per emphasis tier. `component` (ச், ஒ, ல்) is deliberately
 *  close to ordinary ambient weight -- embedded, not enlarged to identify
 *  it, per "do not enlarge them simply to identify them," and gets no
 *  glow. Each subsequent tier gains a little presence, never becoming
 *  heading-like. `formed`/`emerging`/`selected` all get a very subtle soft
 *  under-layer via a slight canvas blur -- convergence communicated
 *  through "local glow/contrast only if extremely subtle," per the brief,
 *  rather than through any drawn node/circle. `selected` (பயன்) keeps the
 *  strongest version of this since it was never built from visible
 *  components at all -- "this idea survived" rather than "this was
 *  constructed." */
/** Styling per emphasis tier, per Art Direction Pass 01B. `component`
 *  (ச், ஒ, ல்) stays close to ordinary heritage-field weight -- embedded,
 *  not enlarged to identify it -- but carries a whisper of living cyan in
 *  its glow, since these are the formation participants "eligible for
 *  subtle cyan activation." `formed` (சொ) and `emerging` (சொல்) resolve in
 *  ILLUMINATED GOLD -- heritage, meaning, continuity. `selected` (பயன்)
 *  resolves in LIVING CYAN instead of gold -- its own independent
 *  resolution colour, matching its path family (see drawFormationLayer),
 *  and visibly different from சொ/சொல் so the three survivors don't read
 *  as identical. */
/** Reference-matched: all formation tiers now render in the bronze/ink
 *  family only -- no gold, no cyan -- matching the reference image's field,
 *  where every glyph is a quiet bronze/tan mark on the light ground and
 *  gold exists only in the editorial elements (rules, dash, dot). Glows
 *  removed entirely (glow: 0) for the same reason. Hierarchy between the
 *  tiers is preserved through size and opacity alone.
 *
 *  Sizes brought down to the starfield model's own range (roughly 6-19px
 *  -- see "Starfield model: brightness carries hierarchy, not size") --
 *  these were locked before that pass existed and never revisited, which
 *  is why formation nodes visually dominated the field at up to 35px next
 *  to a starfield capped at 19px. Direct founder report on real content:
 *  "so sol payan and all in bigger font size." Hierarchy among the four
 *  tiers now lives mostly in opacity, the same principle the rest of the
 *  field already uses. */
const EMPHASIS_STYLE = {
  component: { minSize: 9, maxSize: 12, minOpacity: 0.28, maxOpacity: 0.4, glow: 0, glowColor: COLORS.heritageBronze, textColor: COLORS.heritageBronze },
  formed: { minSize: 11, maxSize: 14, minOpacity: 0.55, maxOpacity: 0.68, glow: 0, glowColor: COLORS.heritageBronze, textColor: COLORS.heritageBronze },
  emerging: { minSize: 13, maxSize: 17, minOpacity: 0.68, maxOpacity: 0.8, glow: 0, glowColor: COLORS.heritageBronze, textColor: mix(COLORS.heritageBronze, COLORS.kuralInk, 0.35) },
  selected: { minSize: 12, maxSize: 16, minOpacity: 0.58, maxOpacity: 0.72, glow: 0, glowColor: COLORS.heritageBronze, textColor: COLORS.heritageBronze },
} as const;

/** The field/editorial boundary. Rescaled from 0.532 to 0.3, matching
 *  REGIONS.quietStart in kural200-state.ts -- "30% is living language
 *  space, 70% the text space." Formation nodes whose positions fall
 *  at/after this line (there shouldn't be any now that all six were
 *  rescaled into the narrower field, but this stays as a general
 *  safeguard) are faded to near-subconscious so they never compete with
 *  the editorial text. */
const EDITORIAL_LEFT_FRAC = 0.3;
const EDITORIAL_NODE_FADE = 0.14;

function drawFormationNode(
  ctx: CanvasRenderingContext2D,
  node: FormationNode,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  const x = node.x * width;
  const y = node.y * height;
  const style = EMPHASIS_STYLE[node.emphasis];
  const size = rand.range(style.minSize, style.maxSize);
  let opacity = rand.range(style.minOpacity, style.maxOpacity);
  if (node.x >= EDITORIAL_LEFT_FRAC) opacity *= EDITORIAL_NODE_FADE;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (style.glow > 0) {
    ctx.save();
    ctx.filter = "blur(1.1px)";
    ctx.font = `400 ${size * 1.15}px ${tamilFont}`;
    ctx.fillStyle = withAlpha(style.glowColor, opacity * style.glow);
    ctx.fillText(node.glyph, x, y);
    ctx.restore();
  }

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.fillStyle = withAlpha(style.textColor, opacity);
  ctx.fillText(node.glyph, x, y);
}

// ---------------------------------------------------------------------------
// Debug overlay -- INTERNAL, development-only. Redraws the grown trunks
// (using the exact points already computed above -- no new RNG draws, so
// this never touches determinism) at high contrast, colour-coded by kind
// so FORMATION PATHS and SEMANTIC TRACES are visually distinguishable, plus
// a labelled marker at every node and trunk origin. Purely additive:
// nothing below it is altered. Callers must only ever pass
// debugFormationLogic: true on a live preview, never on the export path --
// see KuralHeroCanvas.renderKuralPublishingForExport.
// ---------------------------------------------------------------------------

// MILESTONE 01: not called this milestone (see renderKuralPublishing) --
// no editorial block means nothing for the debug overlay to annotate.
// Kept intact, untouched, for when a future milestone re-enables it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function drawDebugFormationOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  sansFont: string,
  info: FormationDebugInfo
): void {
  ctx.save();
  ctx.lineCap = "round";

  for (const trunk of info.trunks) {
    if (trunk.points.length < 2) continue;
    const isFormation = trunk.kind === "formation";
    ctx.strokeStyle = isFormation ? withAlpha(COLORS.kuralInk, 0.85) : withAlpha(COLORS.mutedEarth, 0.95);
    ctx.lineWidth = isFormation ? 2 : 1.5;
    if (!isFormation) ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(trunk.points[0].x, trunk.points[0].y);
    for (let i = 1; i < trunk.points.length; i++) {
      ctx.lineTo(trunk.points[i].x, trunk.points[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const origin = trunk.points[0];
    ctx.font = `600 10px ${sansFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = isFormation ? withAlpha(COLORS.kuralInk, 0.9) : withAlpha(COLORS.mutedEarth, 1);
    ctx.fillText(trunk.label, origin.x + 4, origin.y - 4);
  }

  for (const marker of info.markers) {
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(COLORS.warmParchment, 0.9);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = withAlpha(COLORS.kuralInk, 0.95);
    ctx.stroke();

    ctx.font = `600 10px ${sansFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = withAlpha(COLORS.kuralInk, 0.9);
    ctx.fillText(marker.label, marker.x + 8, marker.y + 6);
  }

  ctx.font = `700 13px ${tamilFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = withAlpha(COLORS.kuralInk, 0.9);
  ctx.fillText("DEBUG: Formation Logic — never exported", 12, 12);
  ctx.font = `500 11px ${sansFont}`;
  ctx.fillText("Solid = Formation Path (linguistic).  Dashed = Semantic Trace (conceptual only).", 12, 30);

  ctx.restore();
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

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
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

/** Same as withAlpha, but for an "rgb(r, g, b)" string produced by mix(). */
function withAlphaRgb(rgbStr: string, alpha: number): string {
  const inner = rgbStr.slice(rgbStr.indexOf("(") + 1, rgbStr.indexOf(")"));
  return `rgba(${inner}, ${Math.max(0, Math.min(1, alpha))})`;
}
