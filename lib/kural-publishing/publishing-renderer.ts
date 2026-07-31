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
 * SURVIVOR (சொ/சொல்/பயன், rendered only via FORMATION_NODES, never from
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

import { MODERN_TAMIL } from "@/lib/living-field/glyphs";
import { createSeededRandom, type SeededRandom } from "./seeded-random";
import {
  deriveSeed,
  FORMATION_NODES,
  REGIONS,
  type FormationNode,
  type KuralPublishingContent,
} from "./kural200-state";

const COLORS = {
  background: "#EFF4F2",
  foreground: "#2B2A26",
  primary: "#328D63",
  primaryDark: "#236345",
  muted: "#8A8678",
} as const;

/** A deep, desaturated sage -- derived by darkening primaryDark, not an
 *  invented neon tone. Used sparingly this pass; darkness now comes mostly
 *  from overlapping glyphs, not from this colour painted as a panel. */
const DEEP_SAGE = "#102D1F";

/** Modern Tamil only -- filtered here, inside the publishing implementation,
 *  from the Kernel's shared glyph registry. Deliberately does NOT read
 *  Tamil-Brahmi or Vatteluttu, and does not touch lib/living-field/config.ts
 *  or glyphs.ts to achieve that; the filter lives entirely on this side. */
const MODERN_TAMIL_VALUES: readonly string[] = MODERN_TAMIL.glyphs
  .filter((g): g is { kind: "text"; value: string } => g.kind === "text")
  .map((g) => g.value);

export interface RenderKuralPublishingOptions {
  width: number;
  height: number;
  content: KuralPublishingContent;
  /** Resolved app font-family strings (see KuralHeroCanvas for how these are
   *  read from --font-tamil-sans / --font-sans), each with its own fallback
   *  chain already appended. */
  tamilFont: string;
  sansFont: string;
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
  const { width, height, content, tamilFont, sansFont, logoImage, debugFormationLogic } = opts;
  const rand = createSeededRandom(deriveSeed(content.kuralNumber));

  // Real substrings of the actual verified Kural text, not invented glyphs --
  // used to bias what the field shows as it approaches the formation region,
  // per "content becomes MORE specific as the field becomes LESS dense."
  const kuralSyllables = extractTamilSyllables(
    `${content.tamilLine1} ${content.tamilLine2}`
  );

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height, rand);

  // Built once, at the exact point in the RNG sequence pass 04 already built
  // it (immediately before the ambient field's own pocket noise) -- shared
  // with the formation layer below so secondary paths can genuinely
  // "connect clusters" instead of guessing at where they are. This ordering
  // is what keeps this pass's composition byte-identical to pass 04's
  // wherever this pass doesn't intentionally change something.
  const macro = buildMacroClusters(rand);

  drawAmbientField(ctx, width, height, tamilFont, rand, kuralSyllables, macro);
  const debugInfo = drawFormationLayer(ctx, width, height, tamilFont, rand, macro);
  drawForegroundKural(ctx, width, height, content, tamilFont, sansFont);
  drawMetadata(ctx, width, height, content, sansFont);
  if (logoImage) drawLogoSlot(ctx, width, height, logoImage);

  if (debugFormationLogic) {
    drawDebugFormationOverlay(ctx, width, height, tamilFont, sansFont, debugInfo);
  }
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
  height: number,
  rand: SeededRandom
): void {
  // Colouring is fully resolved to the app's own background well before the
  // dense field even ends -- everything past this point gets its depth from
  // glyph density alone, never from a painted panel.
  const colorEnd = REGIONS.denseEnd * 0.82;

  const base = ctx.createLinearGradient(0, 0, width, 0);
  base.addColorStop(0, mix(DEEP_SAGE, COLORS.background, 0.3));
  base.addColorStop(colorEnd * 0.32, mix(DEEP_SAGE, COLORS.primaryDark, 0.42));
  base.addColorStop(colorEnd * 0.68, mix(COLORS.primary, COLORS.background, 0.45));
  base.addColorStop(colorEnd, mix(COLORS.primary, COLORS.background, 0.88));
  base.addColorStop(1, COLORS.background);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // A handful of soft, low-opacity clouds -- support texture, not a second
  // dark layer. Clamped well inside the dense field so nothing reads as a
  // boundary.
  const cloudClipWidth = width * Math.min(REGIONS.denseEnd * 1.05, REGIONS.quietStart);
  const cloudCount = 4;
  for (let i = 0; i < cloudCount; i++) {
    const cx = rand.range(-width * 0.05, width * REGIONS.denseEnd * 0.75);
    const cy = rand.range(height * 0.05, height * 0.95);
    const r = rand.range(width * 0.1, width * 0.22);
    const darker = rand.chance(0.5);
    const tone = darker
      ? mixAlpha(DEEP_SAGE, COLORS.primaryDark, rand.range(0, 1), rand.range(0.05, 0.11))
      : mixAlpha(COLORS.primary, COLORS.background, rand.range(0.2, 0.6), rand.range(0.04, 0.08));

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, tone);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cloudClipWidth, height);
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

/** 0 -> denseEnd: sustained abundance. denseEnd -> transitionEnd: a genuine
 *  dissolve, not a dim. Zero beyond transitionEnd, always. */
function baseFalloff(xFrac: number): number {
  if (xFrac >= REGIONS.transitionEnd) return 0;
  if (xFrac <= REGIONS.denseEnd) {
    const t = xFrac / REGIONS.denseEnd;
    return 0.85 + 0.15 * (1 - t);
  }
  const span = REGIONS.transitionEnd - REGIONS.denseEnd;
  const t = (xFrac - REGIONS.denseEnd) / span;
  return 0.85 * Math.pow(1 - t, 1.9);
}

interface MacroCluster {
  cx: number;
  cy: number;
  r: number;
  strength: number;
}

/** "Clusters within clusters" -- irregular topography, not a flat density
 *  value across the left field. One cluster is fixed (not random) around
 *  the சொல்/பயன் formation nodes specifically, so that region always has
 *  accumulated material to be "selected" from, regardless of seed; the rest
 *  are seeded and vary with content. */
function buildMacroClusters(rand: SeededRandom): MacroCluster[] {
  const clusters: MacroCluster[] = [];

  const payanNode = FORMATION_NODES.find((n) => n.id === "f-payan");
  const cholNode = FORMATION_NODES.find((n) => n.id === "f-chol");
  if (payanNode && cholNode) {
    clusters.push({
      cx: (payanNode.x + cholNode.x) / 2,
      cy: (payanNode.y + cholNode.y) / 2,
      r: 0.1,
      strength: 0.4,
    });
  }

  const count = 6;
  for (let i = 0; i < count; i++) {
    clusters.push({
      cx: rand.range(0.02, REGIONS.denseEnd * 0.92),
      cy: rand.range(0.05, 0.95),
      r: rand.range(0.1, 0.26),
      strength: rand.range(0.3, 0.75),
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
    for (let c = 0; c < POCKET_COLS; c++) row.push(rand.range(0.45, 1.65));
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

function densityAt(
  xFrac: number,
  yFrac: number,
  macro: readonly MacroCluster[],
  pockets: number[][]
): number {
  const base = baseFalloff(xFrac);
  if (base <= 0) return 0;
  const bump = 1 + macroBumpAt(macro, xFrac, yFrac);
  const pocket = pocketMultiplierAt(pockets, xFrac, yFrac);
  return Math.max(0, Math.min(2.6, base * bump * pocket));
}

function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom,
  kuralSyllables: readonly string[],
  macro: readonly MacroCluster[]
): void {
  // A finer grid still -- more addressable slots for the micro-mass this
  // pass asks for.
  const colW = 15;
  const rowH = 17;
  const cols = Math.ceil(width / colW);
  const rows = Math.ceil(height / rowH);
  const protectedCol = Math.ceil((REGIONS.transitionEnd * width) / colW);

  const pockets = buildPocketField(rand);

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (c >= protectedCol) break; // hard stop -- silence stays silent

      const xFrac = (c * colW) / width;
      const yFrac = (r * rowH) / height;
      const density = densityAt(xFrac, yFrac, macro, pockets);
      if (density <= 0.03) {
        c += 2;
        continue;
      }

      const gap = Math.max(1, Math.round(rand.range(1, 3) * (1.6 - Math.min(1.5, density))));
      c += gap;
      if (c >= protectedCol) break;

      const maxClusterLen =
        density > 1.7 ? 11 : density > 1.2 ? 8 : density > 0.7 ? 5 : density > 0.35 ? 3 : 1;
      const clusterLen = rand.int(1, maxClusterLen + 1);

      for (let i = 0; i < clusterLen && c < protectedCol; i++, c++) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        const cxFrac = cx / width;
        const cyFrac = cy / height;
        const d = densityAt(cxFrac, cyFrac, macro, pockets);
        if (d <= 0.03) continue;
        // Regions that breathe -- not every slot fires even inside a dense
        // pocket.
        if (!rand.chance(Math.min(1, d * 0.6 + 0.16))) continue;

        drawAmbientGlyph(ctx, cx, cy, d, cxFrac, tamilFont, rand, kuralSyllables);
        // A second, even smaller pass of pure micro-dot texture layered
        // right alongside the glyphs -- "atmospheric texture" without any
        // imported imagery: fine traces, not letters.
        if (rand.chance(0.22)) drawMicroTrace(ctx, cx, cy, d, rand);
      }
    }
  }
}

/** Four population strata (micro/tiny, small/medium, large, ghost), plus a
 *  rare "anchor" carved out of the large tier for genuine high-presence
 *  marks. Weighted heavily toward the tiny end -- per founder direction,
 *  roughly 65/25/8/2 as a visual-hierarchy target. Large-tier probability
 *  is actively suppressed as xFrac moves into the transition zone, folding
 *  that mass back into the micro tier, so the centre stops reading as
 *  scattered oversized letters. As xFrac increases, glyph choice is
 *  increasingly drawn from the real Kural syllables rather than the full
 *  modern-Tamil set -- content narrows as density falls. */
function drawAmbientGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: number,
  xFrac: number,
  tamilFont: string,
  rand: SeededRandom,
  kuralSyllables: readonly string[]
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
  let colorMix: number; // 0 = primary green, 1 = near-dark foreground
  let wide = false;
  // Semantic depth this glyph is drawn from -- see the three-depth rule
  // below. "ambient" = broad Tamil environment (A), "kuralMaterial" =
  // forms actually present in Kural 200 (B). Category C (சொ/சொல்/பயன்,
  // the semantic survivors) is never drawn from this ambient loop at all --
  // it only ever comes from FORMATION_NODES, rendered separately.
  let depth: "ambient" | "kuralMaterial";

  if (roll < pMicro) {
    size = rand.range(4, 8); // MICRO -- the bulk of the mass
    baseOpacity = rand.range(0.03, 0.1);
    colorMix = 0;
    depth = "ambient"; // deep atmosphere stays the broad language environment
  } else if (roll < pMicro + pSmallMed) {
    size = rand.range(9, 16); // SMALL / MEDIUM
    baseOpacity = rand.range(0.08, 0.19);
    colorMix = 0.12;
    depth = "ambient"; // mixes with Kural material via kuralBias below
  } else if (roll < pMicro + pSmallMed + pLarge) {
    const isAnchor = rand.chance(0.14); // genuinely rare, high-presence
    if (isAnchor) {
      size = rand.range(22, 34);
      baseOpacity = rand.range(0.42, 0.64);
      colorMix = 0.8;
    } else {
      size = rand.range(18, 27);
      baseOpacity = rand.range(0.15, 0.29);
      colorMix = 0.26;
    }
    // RULE: the more visually prominent a form becomes, the more directly
    // it must relate to the source content. LARGE and ANCHOR are both
    // high-contrast enough to read as "visual heroes," so both are always
    // Kural material, never an arbitrary ambient form -- this is the fix
    // for "arbitrary Tamil forms receiving large size / dark contrast."
    depth = "kuralMaterial";
  } else {
    size = rand.range(42, 80); // GHOST -- rare, huge, barely there
    baseOpacity = rand.range(0.015, 0.04);
    colorMix = 0;
    wide = true;
    // Large ghost forms are allowed to be ambient specifically because
    // they stay extremely low opacity -- prominence, not scale alone, is
    // what the rule restricts.
    depth = "ambient";
  }

  const jitterRange = wide ? 30 : 7;
  const jitterX = rand.range(-jitterRange, jitterRange);
  const jitterY = rand.range(-jitterRange, jitterRange);

  // Content narrows toward the actual Kural as density falls -- deep field
  // stays a broad Tamil environment. kuralMaterial-depth glyphs always draw
  // from the real Kural text; ambient-depth glyphs mix in Kural material
  // increasingly as xFrac grows, per "MID LEFT: mix, CENTRE: mostly Kural
  // material."
  const kuralBias = kuralSyllables.length > 0
    ? Math.max(0, Math.min(0.68, (xFrac - REGIONS.denseEnd * 0.35) / (REGIONS.denseEnd * 1.1)))
    : 0;
  const useKuralMaterial =
    kuralSyllables.length > 0 && (depth === "kuralMaterial" || rand.chance(kuralBias));
  const glyph = useKuralMaterial
    ? rand.pick(kuralSyllables)
    : rand.pick(MODERN_TAMIL_VALUES);

  const opacity = Math.min(1, baseOpacity * (0.55 + density * 0.5));
  const color = mix(COLORS.primary, COLORS.foreground, colorMix);

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlphaRgb(color, opacity);
  ctx.fillText(glyph, x + jitterX, y + jitterY);
}

/** A single tiny filled dot -- pure procedural texture, not a letterform.
 *  "Micro dots / very fine traces / soft local haze," per the brief. No
 *  imported noise, no imagery -- one seeded circle. */
function drawMicroTrace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: number,
  rand: SeededRandom
): void {
  const r = rand.range(0.5, 1.6);
  const opacity = rand.range(0.02, 0.07) * (0.5 + density * 0.5);
  const dx = rand.range(-10, 10);
  const dy = rand.range(-10, 10);
  ctx.beginPath();
  ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(COLORS.primaryDark, opacity);
  ctx.fill();
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

/** One grown Formation Path family, kept for the debug overlay. `kind`
 *  distinguishes an actual linguistic construction from an atmospheric
 *  Semantic Trace -- see drawFormationTrunk vs drawSemanticTrace. */
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
  macro: readonly MacroCluster[]
): FormationDebugInfo {
  const nodeById = new Map(FORMATION_NODES.map((n) => [n.id, n]));
  const trunks: FormationTrunkRecord[] = [];
  const markers: { x: number; y: number; label: string }[] = [];

  ctx.lineCap = "round";

  // Background root network first (furthest back) -- tertiary, then
  // secondary. Most of this connects nothing at all; it's the atmosphere
  // the primary families grow through.
  drawRootFilaments(ctx, width, height, rand, macro);

  const chNode = nodeById.get("c-ch");
  const oNode = nodeById.get("c-o");
  const lNode = nodeById.get("c-l");
  const choNode = nodeById.get("f-cho");
  const cholNode = nodeById.get("f-chol");
  const payanNode = nodeById.get("f-payan");

  // FORMATION FAMILY 1: ச் -- a root originating inside the language mass
  // near ச், not exactly at it (per "should not know exactly where a
  // relationship begins"), growing toward the சொ convergence.
  if (chNode && choNode) {
    const originX = width * (chNode.x - 0.06);
    const originY = height * (chNode.y + 0.03);
    const targetX = width * choNode.x;
    const targetY = height * choNode.y;
    const points = growTrunk(rand, originX, originY, targetX, targetY, 6);
    drawFormationTrunk(ctx, points, rand, {
      minAlpha: 0.05,
      maxAlpha: 0.24,
      minWidth: 0.55,
      maxWidth: 1.05,
      secondaryChance: 0.32,
    });
    trunks.push({ points, kind: "formation", label: "ச் root → சொ" });
  }

  // FORMATION FAMILY 2: ஒ -- its own independent root, converging on the
  // same சொ point from a different direction.
  if (oNode && choNode) {
    const originX = width * (oNode.x - 0.05);
    const originY = height * (oNode.y - 0.04);
    const targetX = width * choNode.x;
    const targetY = height * choNode.y;
    const points = growTrunk(rand, originX, originY, targetX, targetY, 6);
    drawFormationTrunk(ctx, points, rand, {
      minAlpha: 0.05,
      maxAlpha: 0.24,
      minWidth: 0.55,
      maxWidth: 1.05,
      secondaryChance: 0.32,
    });
    trunks.push({ points, kind: "formation", label: "ஒ root → சொ" });
  }

  // FORMATION FAMILY 3: the system associated with சொ continues (does not
  // stop at the first convergence) while a separate ல் root joins it, both
  // resolving toward சொல்.
  if (choNode && lNode && cholNode) {
    const contPoints = growTrunk(
      rand,
      width * choNode.x,
      height * choNode.y,
      width * cholNode.x,
      height * cholNode.y,
      5
    );
    drawFormationTrunk(ctx, contPoints, rand, {
      minAlpha: 0.07,
      maxAlpha: 0.27,
      minWidth: 0.6,
      maxWidth: 1.1,
      secondaryChance: 0.3,
    });
    trunks.push({ points: contPoints, kind: "formation", label: "சொ continues → சொல்" });

    const lOriginX = width * (lNode.x - 0.055);
    const lOriginY = height * (lNode.y - 0.035);
    const lPoints = growTrunk(rand, lOriginX, lOriginY, width * cholNode.x, height * cholNode.y, 5);
    drawFormationTrunk(ctx, lPoints, rand, {
      minAlpha: 0.06,
      maxAlpha: 0.25,
      minWidth: 0.55,
      maxWidth: 1.05,
      secondaryChance: 0.32,
    });
    trunks.push({ points: lPoints, kind: "formation", label: "ல் root → சொல்" });
  }

  // FORMATION FAMILY 4: பயன் -- a fully INDEPENDENT root family, from a
  // deep origin nowhere near ச்/ஒ/ல்/சொ/சொல். பயன் is a semantic
  // survivor, not something சொல் linguistically forms -- see the
  // deliberate absence of any trunk between them below.
  if (payanNode) {
    const originX = width * 0.185;
    const originY = height * 0.76;
    const points = growTrunk(rand, originX, originY, width * payanNode.x, height * payanNode.y, 6);
    drawFormationTrunk(ctx, points, rand, {
      minAlpha: 0.05,
      maxAlpha: 0.22,
      minWidth: 0.55,
      maxWidth: 1.0,
      secondaryChance: 0.3,
    });
    trunks.push({ points, kind: "formation", label: "பயன் root (independent)" });
  }

  // SEMANTIC TRACE: சொல் and பயன் may relate conceptually as the two ideas
  // that survive the Kural, but that is NOT a linguistic construction --
  // rendered as diffuse, discontinuous wisps, never a single connecting
  // stroke, so it can never read as a Formation Path.
  if (cholNode && payanNode) {
    const tracePoints = drawSemanticTrace(
      ctx,
      width * cholNode.x,
      height * cholNode.y,
      width * payanNode.x,
      height * payanNode.y,
      rand,
      9
    );
    trunks.push({
      points: tracePoints,
      kind: "semantic",
      label: "சொல் ↔ பயன் (semantic trace only — NOT a formation path)",
    });
  }

  for (const node of FORMATION_NODES) {
    drawFormationNode(ctx, node, width, height, tamilFont, rand);
    markers.push({ x: node.x * width, y: node.y * height, label: `${node.glyph} (${node.emphasis})` });
  }

  return { trunks, markers };
}

/** Secondary branches: a moderate number, visible on inspection, and
 *  deliberately seeded near macro cluster centres so they read as
 *  connecting clusters rather than starting from arbitrary points. Tertiary
 *  branches: many, hairline, very faint, short/local -- background texture.
 *  Neither connects to a named FormationNode; both are atmospheric texture,
 *  not claims about linguistic structure. Together these are the "roots
 *  beneath soil" the primary families grow through and disappear into. */
function drawRootFilaments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: SeededRandom,
  macro: readonly MacroCluster[]
): void {
  const secondaryAttempts = 55;
  for (let i = 0; i < secondaryAttempts; i++) {
    // Seed near a cluster centre (with spread) roughly half the time, so
    // secondary paths visibly originate from where the language mass has
    // actually accumulated -- "connect clusters," not scatter randomly.
    let xFrac: number;
    let y: number;
    if (macro.length > 0 && rand.chance(0.6)) {
      const cluster = rand.pick(macro);
      xFrac = Math.max(0.02, Math.min(REGIONS.transitionEnd * 0.95, cluster.cx + rand.range(-cluster.r, cluster.r)));
      y = height * Math.max(0.03, Math.min(0.97, cluster.cy + rand.range(-cluster.r, cluster.r) * 0.7));
    } else {
      xFrac = rand.range(0.03, REGIONS.transitionEnd * 0.98);
      y = rand.range(height * 0.05, height * 0.95);
    }
    const density = baseFalloff(xFrac);
    if (!rand.chance(Math.min(1, density * 0.85 + 0.15))) continue;

    const x = xFrac * width;
    const angle = rand.range(-Math.PI * 0.42, Math.PI * 0.42); // broadly rightward
    const length = rand.range(30, 130) * (0.5 + density);
    const depthBudget = rand.chance(0.4) ? 2 : 1;

    drawFilamentBranch(ctx, x, y, angle, length, rand, depthBudget, 0.09, 0.22);
  }

  const tertiaryAttempts = 100;
  for (let i = 0; i < tertiaryAttempts; i++) {
    const xFrac = rand.range(0.02, REGIONS.transitionEnd * 1.03);
    const density = baseFalloff(Math.min(xFrac, REGIONS.transitionEnd - 0.001));
    if (!rand.chance(Math.min(1, density * 0.65 + 0.22))) continue;

    const x = xFrac * width;
    const y = rand.range(height * 0.04, height * 0.96);
    const angle = rand.range(-Math.PI * 0.5, Math.PI * 0.5);
    const length = rand.range(14, 50);

    drawFilamentBranch(ctx, x, y, angle, length, rand, 1, 0.03, 0.08);
  }
}

/** One organic segment with a fading gradient stroke -- visible near its
 *  origin, gone by its tip. Grown, not drawn: two independent curvature
 *  terms rather than one clean arc. May spawn a single shorter child
 *  branch partway along, when depthBudget allows. The primitive every
 *  secondary/tertiary trace AND every primary trunk's side-branches are
 *  built from. */
function drawFilamentBranch(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  rand: SeededRandom,
  depthBudget: number,
  minPeakAlpha: number,
  maxPeakAlpha: number
): void {
  const bend = rand.range(-0.55, 0.55);
  const midAngle = angle + bend * 0.5;
  const midX = x + Math.cos(midAngle) * length * 0.5;
  const midY = y + Math.sin(midAngle) * length * 0.5;
  const endAngle = angle + bend;
  const endX = x + Math.cos(endAngle) * length;
  const endY = y + Math.sin(endAngle) * length;

  const peakAlpha = rand.range(minPeakAlpha, maxPeakAlpha);
  const gradient = ctx.createLinearGradient(x, y, endX, endY);
  gradient.addColorStop(0, withAlpha(COLORS.primary, peakAlpha));
  gradient.addColorStop(0.55, withAlpha(COLORS.primary, peakAlpha * 0.45));
  gradient.addColorStop(1, withAlpha(COLORS.primary, 0));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = rand.range(0.5, 1.05);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(midX, midY, endX, endY);
  ctx.stroke();

  if (depthBudget > 1 && rand.chance(0.55)) {
    const t = rand.range(0.3, 0.6);
    const bx = x + (endX - x) * t;
    const by = y + (endY - y) * t;
    const branchAngle = angle + rand.range(-1.15, 1.15);
    drawFilamentBranch(
      ctx,
      bx,
      by,
      branchAngle,
      length * rand.range(0.4, 0.7),
      rand,
      depthBudget - 1,
      minPeakAlpha,
      maxPeakAlpha
    );
  }
}

/** Grows an organic multi-segment TRUNK from (x1,y1) toward (x2,y2) -- a
 *  guided random walk, not a straight line or a single smooth curve. Each
 *  step blends "drift toward the target" with jitter that shrinks as it
 *  approaches but never reaches zero, so the trunk lands CLOSE to, not
 *  exactly on, the target -- "no obvious endpoint" in normal view. This is
 *  the ROOT+TRUNK primitive every Formation Path family is built from. */
function growTrunk(
  rand: SeededRandom,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  steps: number
): TrunkPoint[] {
  const points: TrunkPoint[] = [{ x: x1, y: y1 }];
  const totalLen = Math.hypot(x2 - x1, y2 - y1) || 1;
  const stepLen = totalLen / steps;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const idealX = x1 + (x2 - x1) * t;
    const idealY = y1 + (y2 - y1) * t;
    const jitterAmount = 0.14 + (1 - t) * 0.5;
    const px = idealX + rand.range(-1, 1) * stepLen * jitterAmount;
    const py = idealY + rand.range(-1, 1) * stepLen * jitterAmount;
    points.push({ x: px, y: py });
  }
  return points;
}

/** Strokes a grown trunk as a CHAIN of short curved segments -- never one
 *  long Bézier arc. Each segment gets its own curvature jitter, thickness,
 *  and opacity; opacity ramps up toward the convergence end ("slightly
 *  clearer near formation"), which is what marks this as a FORMATION PATH
 *  rather than a Semantic Trace. SECONDARY BRANCHES leave the trunk at
 *  irregular points along the way -- reusing drawFilamentBranch, so
 *  "joining/leaving the trunk" comes from the same organic primitive as
 *  the background texture rather than new machinery; some die almost
 *  immediately, some run further. Returns the trunk points for the debug
 *  overlay -- no new RNG draws needed to redraw them later. */
function drawFormationTrunk(
  ctx: CanvasRenderingContext2D,
  points: readonly TrunkPoint[],
  rand: SeededRandom,
  opts: { minAlpha: number; maxAlpha: number; minWidth: number; maxWidth: number; secondaryChance: number }
): void {
  for (let i = 1; i < points.length; i++) {
    const t = i / (points.length - 1);
    const a = points[i - 1];
    const b = points[i];
    const mx = (a.x + b.x) / 2 + rand.range(-7, 7);
    const my = (a.y + b.y) / 2 + rand.range(-7, 7);
    const alpha = opts.minAlpha + (opts.maxAlpha - opts.minAlpha) * t;

    ctx.strokeStyle = withAlpha(COLORS.primary, alpha);
    ctx.lineWidth = opts.minWidth + (opts.maxWidth - opts.minWidth) * t;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.stroke();

    if (i < points.length - 1 && rand.chance(opts.secondaryChance)) {
      const dir = Math.atan2(b.y - a.y, b.x - a.x);
      const branchAngle = dir + rand.range(-1.2, 1.2);
      const depthBudget = rand.chance(0.4) ? 2 : 1;
      drawFilamentBranch(ctx, b.x, b.y, branchAngle, rand.range(18, 55), rand, depthBudget, 0.05, 0.16);
    }
  }
}

/** A SEMANTIC TRACE -- diffuse, discontinuous, atmospheric. Deliberately
 *  NOT a single connecting stroke between two points, so it can never be
 *  mistaken for a linguistic Formation Path: several short, disconnected
 *  wisps scattered in the loose region between them, each pointing in its
 *  own loosely-related direction rather than tracing a route from A to B. */
function drawSemanticTrace(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rand: SeededRandom,
  count: number
): TrunkPoint[] {
  const markers: TrunkPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = rand.range(0.15, 0.85);
    const baseX = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;
    const wx = baseX + rand.range(-32, 32);
    const wy = baseY + rand.range(-42, 42);
    const angle = rand.range(0, Math.PI * 2);
    const len = rand.range(8, 22);
    const ex = wx + Math.cos(angle) * len;
    const ey = wy + Math.sin(angle) * len;
    const mx = (wx + ex) / 2 + rand.range(-4, 4);
    const my = (wy + ey) / 2 + rand.range(-4, 4);

    ctx.strokeStyle = withAlpha(COLORS.muted, rand.range(0.04, 0.1));
    ctx.lineWidth = rand.range(0.5, 0.9);
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
    markers.push({ x: wx, y: wy });
  }
  return markers;
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
const EMPHASIS_STYLE = {
  component: { minSize: 16, maxSize: 21, minOpacity: 0.18, maxOpacity: 0.28, glow: 0 },
  formed: { minSize: 22, maxSize: 27, minOpacity: 0.36, maxOpacity: 0.46, glow: 0.3 },
  emerging: { minSize: 29, maxSize: 35, minOpacity: 0.5, maxOpacity: 0.61, glow: 0.35 },
  selected: { minSize: 25, maxSize: 30, minOpacity: 0.42, maxOpacity: 0.53, glow: 0.55 },
} as const;

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
  const opacity = rand.range(style.minOpacity, style.maxOpacity);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (style.glow > 0) {
    ctx.save();
    ctx.filter = "blur(0.8px)";
    ctx.font = `400 ${size * 1.15}px ${tamilFont}`;
    ctx.fillStyle = withAlpha(COLORS.primary, opacity * style.glow);
    ctx.fillText(node.glyph, x, y);
    ctx.restore();
  }

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.fillStyle = withAlpha(COLORS.primary, opacity);
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
    ctx.strokeStyle = isFormation ? withAlpha(COLORS.foreground, 0.85) : withAlpha(COLORS.muted, 0.95);
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
    ctx.fillStyle = isFormation ? withAlpha(COLORS.foreground, 0.9) : withAlpha(COLORS.muted, 1);
    ctx.fillText(trunk.label, origin.x + 4, origin.y - 4);
  }

  for (const marker of info.markers) {
    ctx.beginPath();
    ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(COLORS.background, 0.9);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = withAlpha(COLORS.foreground, 0.95);
    ctx.stroke();

    ctx.font = `600 10px ${sansFont}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = withAlpha(COLORS.foreground, 0.9);
    ctx.fillText(marker.label, marker.x + 8, marker.y + 6);
  }

  ctx.font = `700 13px ${tamilFont}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = withAlpha(COLORS.foreground, 0.9);
  ctx.fillText("DEBUG: Formation Logic — never exported", 12, 12);
  ctx.font = `500 11px ${sansFont}`;
  ctx.fillText("Solid = Formation Path (linguistic).  Dashed = Semantic Trace (conceptual only).", 12, 30);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Foreground Kural + English thought -- unchanged this pass, per the brief
// ("do not redesign it in this pass"). Left-aligned per the locked Kural
// display rule, sized to fit via measureText with a genuine safety floor.
// ---------------------------------------------------------------------------

function drawForegroundKural(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  tamilFont: string,
  sansFont: string
): void {
  const leftX = REGIONS.quietStart * width + width * 0.038;
  const rightMargin = width * 0.05;
  const maxTextWidth = width - leftX - rightMargin;

  const kuralLines = [content.tamilLine1, content.tamilLine2];
  const kuralSize = fitFontSize(ctx, kuralLines, tamilFont, 500, maxTextWidth, 48, 15);
  const kuralLineGap = kuralSize * 1.48;
  const kuralY1 = height * 0.4;
  const kuralY2 = kuralY1 + kuralLineGap;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.foreground;
  ctx.font = `500 ${kuralSize}px ${tamilFont}`;
  ctx.fillText(content.tamilLine1, leftX, kuralY1);
  ctx.fillText(content.tamilLine2, leftX, kuralY2);

  const englishLines = [content.englishLine1, content.englishLine2];
  const engSize = fitFontSize(ctx, englishLines, sansFont, 500, maxTextWidth, 19, 12);
  const engLineGap = engSize * 1.55;
  const engY1 = kuralY2 + kuralSize * 1.7;
  const engY2 = engY1 + engLineGap;

  ctx.font = `500 ${engSize}px ${sansFont}`;
  ctx.fillStyle = withAlpha(COLORS.muted, 1);
  ctx.fillText(content.englishLine1, leftX, engY1);
  ctx.fillText(content.englishLine2, leftX, engY2);
}

/** Shrinks font size (never below minSize) until every line fits maxWidth,
 *  using the browser's own text metrics -- not an estimate. minSize is a
 *  true safety floor (15px): the Kural can never be clipped by the canvas
 *  edge regardless of edited content length. Restores no state on its own;
 *  caller sets ctx.font again before actually drawing. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  fontFamily: string,
  weight: number,
  maxWidth: number,
  startSize: number,
  minSize: number
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth) break;
    size -= 1;
  }
  return size;
}

// ---------------------------------------------------------------------------
// Metadata -- low-hierarchy credit line, quiet region only. Unchanged.
// ---------------------------------------------------------------------------

function drawMetadata(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  sansFont: string
): void {
  const leftX = REGIONS.quietStart * width + width * 0.038;
  const y = height * 0.92;
  const text = `Issue #${content.issue}   ·   ${content.series}   ·   Kural ${content.kuralNumber}`;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 13px ${sansFont}`;
  ctx.fillStyle = withAlpha(COLORS.muted, 0.75);
  ctx.fillText(text, leftX, y);
}

// ---------------------------------------------------------------------------
// Identity zone -- draws only when a real logo image is supplied. No
// fallback mark, no "logo missing" text, no placeholder box. Unchanged.
// ---------------------------------------------------------------------------

function drawLogoSlot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  logoImage: HTMLImageElement
): void {
  const maxW = width * 0.09;
  const maxH = height * 0.09;
  const naturalW = logoImage.naturalWidth || logoImage.width;
  const naturalH = logoImage.naturalHeight || logoImage.height;
  if (!naturalW || !naturalH) return;

  const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
  const w = naturalW * scale;
  const h = naturalH * scale;
  const x = width - width * 0.06 - w;
  const y = height * 0.06;

  ctx.drawImage(logoImage, x, y, w, h);
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
