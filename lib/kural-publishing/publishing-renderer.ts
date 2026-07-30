/**
 * Kural Publishing — Renderer (MVP, Visual Pass 04)
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
 * around the transition -- this pass deliberately weakens that layer and
 * pushes the actual visual weight back onto glyph population, overlap,
 * and the Formation Path network.
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
  FORMATION_PATHS,
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
}

export function renderKuralPublishing(
  ctx: CanvasRenderingContext2D,
  opts: RenderKuralPublishingOptions
): void {
  const { width, height, content, tamilFont, sansFont, logoImage } = opts;
  const rand = createSeededRandom(deriveSeed(content.kuralNumber));

  // Real substrings of the actual verified Kural text, not invented glyphs --
  // used to bias what the field shows as it approaches the formation region,
  // per "content becomes MORE specific as the field becomes LESS dense."
  const kuralSyllables = extractTamilSyllables(
    `${content.tamilLine1} ${content.tamilLine2}`
  );

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height, rand);

  drawAmbientField(ctx, width, height, tamilFont, rand, kuralSyllables);
  drawFormationLayer(ctx, width, height, tamilFont, rand);
  drawForegroundKural(ctx, width, height, content, tamilFont, sansFont);
  drawMetadata(ctx, width, height, content, sansFont);
  if (logoImage) drawLogoSlot(ctx, width, height, logoImage);
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
  kuralSyllables: readonly string[]
): void {
  // A finer grid still -- more addressable slots for the micro-mass this
  // pass asks for.
  const colW = 15;
  const rowH = 17;
  const cols = Math.ceil(width / colW);
  const rows = Math.ceil(height / rowH);
  const protectedCol = Math.ceil((REGIONS.transitionEnd * width) / colW);

  const macro = buildMacroClusters(rand);
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

  if (roll < pMicro) {
    size = rand.range(4, 8); // MICRO -- the bulk of the mass
    baseOpacity = rand.range(0.03, 0.1);
    colorMix = 0;
  } else if (roll < pMicro + pSmallMed) {
    size = rand.range(9, 16); // SMALL / MEDIUM
    baseOpacity = rand.range(0.08, 0.19);
    colorMix = 0.12;
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
  } else {
    size = rand.range(42, 80); // GHOST -- rare, huge, barely there
    baseOpacity = rand.range(0.015, 0.04);
    colorMix = 0;
    wide = true;
  }

  const jitterRange = wide ? 30 : 7;
  const jitterX = rand.range(-jitterRange, jitterRange);
  const jitterY = rand.range(-jitterRange, jitterRange);

  // Content narrows toward the actual Kural as density falls -- deep field
  // stays a broad Tamil environment.
  const kuralBias = kuralSyllables.length > 0
    ? Math.max(0, Math.min(0.68, (xFrac - REGIONS.denseEnd * 0.35) / (REGIONS.denseEnd * 1.1)))
    : 0;
  const glyph = rand.chance(kuralBias)
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
// Formation Paths -- a discoverable branching network again. Three tiers:
// primary (the linguistically real edges), secondary (fewer, slightly
// clearer, connecting local clusters), tertiary (many, extremely thin,
// very faint). All grown through and between the glyph mass, not drawn as
// a foreground web.
// ---------------------------------------------------------------------------

function drawFormationLayer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  const nodeById = new Map(FORMATION_NODES.map((n) => [n.id, n]));

  ctx.lineCap = "round";

  // Root network first (furthest back) -- tertiary, then secondary. Most of
  // this connects nothing at all.
  drawRootFilaments(ctx, width, height, rand);

  // The three linguistically real relationships, blended into the same
  // texture next.
  for (const path of FORMATION_PATHS) {
    const from = nodeById.get(path.fromId);
    const to = nodeById.get(path.toId);
    if (!from || !to) continue;
    drawFormationBranch(ctx, from, to, width, height, rand);
  }

  for (const node of FORMATION_NODES) {
    drawFormationNode(ctx, node, width, height, tamilFont, rand);
  }
}

/** Secondary branches: fewer, slightly clearer, connect local clusters --
 *  begin inside dense clusters (density-weighted) and mostly taper into
 *  nothing, some branching once. Tertiary branches: many, extremely thin,
 *  very faint, short/local -- background texture. Neither connects to a
 *  named FormationNode; both are texture, not claims about linguistic
 *  structure. */
function drawRootFilaments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: SeededRandom
): void {
  const secondaryAttempts = 85;
  for (let i = 0; i < secondaryAttempts; i++) {
    const xFrac = rand.range(0.03, REGIONS.transitionEnd * 0.98);
    const density = baseFalloff(xFrac);
    if (!rand.chance(Math.min(1, density * 0.85 + 0.15))) continue;

    const x = xFrac * width;
    const y = rand.range(height * 0.05, height * 0.95);
    const angle = rand.range(-Math.PI * 0.42, Math.PI * 0.42); // broadly rightward
    const length = rand.range(28, 125) * (0.5 + density);
    const depthBudget = rand.chance(0.36) ? 2 : 1;

    drawFilamentBranch(ctx, x, y, angle, length, rand, depthBudget, 0.07, 0.2);
  }

  const tertiaryAttempts = 95;
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
 *  branch partway along, when depthBudget allows. */
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

/** The three linguistically real relationships (primary paths) -- very few,
 *  discoverable, leading toward actual Kural-derived formations. Reaches
 *  exact from/to points (unlike the decorative filaments), but with two
 *  independent bends and a fading gradient stroke so it reads as part of
 *  the same root network -- and, most of the time, spawns a stray branch
 *  that goes nowhere, further disguising it as "the one clean connector." */
function drawFormationBranch(
  ctx: CanvasRenderingContext2D,
  from: FormationNode,
  to: FormationNode,
  width: number,
  height: number,
  rand: SeededRandom
): void {
  const x1 = from.x * width;
  const y1 = from.y * height;
  const x2 = to.x * width;
  const y2 = to.y * height;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const bow1 = rand.range(12, 30) * (rand.chance(0.5) ? 1 : -1);
  const bow2 = rand.range(9, 26) * (rand.chance(0.5) ? 1 : -1);
  const cx1 = x1 + dx * 0.28 + nx * bow1;
  const cy1 = y1 + dy * 0.28 + ny * bow1;
  const cx2 = x1 + dx * 0.7 + nx * bow2;
  const cy2 = y1 + dy * 0.7 + ny * bow2;

  const peakAlpha = rand.range(0.16, 0.27);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, withAlpha(COLORS.primary, peakAlpha * 0.5));
  gradient.addColorStop(0.5, withAlpha(COLORS.primary, peakAlpha));
  gradient.addColorStop(1, withAlpha(COLORS.primary, peakAlpha * 0.3));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = rand.range(0.7, 1.15);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.stroke();

  if (rand.chance(0.8)) {
    const t = rand.range(0.3, 0.6);
    const bx = x1 + dx * t + nx * bow1 * 0.5;
    const by = y1 + dy * t + ny * bow1 * 0.5;
    const branchAngle = Math.atan2(dy, dx) + rand.range(-1.3, 1.3);
    drawFilamentBranch(ctx, bx, by, branchAngle, rand.range(26, 62), rand, 1, 0.08, 0.18);
  }
}

/** Styling per emphasis tier. `component` (ச், ஒ) is deliberately close to
 *  ordinary ambient weight now -- embedded, not enlarged to identify it, per
 *  "do not enlarge them simply to identify them." Each subsequent tier
 *  gains a little presence, never becoming heading-like. `selected`
 *  (பயன்) is drawn with a soft under-layer via a slight canvas blur --
 *  "this idea survived" rather than "this was constructed" -- and sits
 *  inside a guaranteed macro cluster (see buildMacroClusters) so it reads
 *  as selected from accumulated material, not placed on empty ground. */
const EMPHASIS_STYLE = {
  component: { minSize: 16, maxSize: 21, minOpacity: 0.18, maxOpacity: 0.28 },
  formed: { minSize: 22, maxSize: 27, minOpacity: 0.36, maxOpacity: 0.46 },
  emerging: { minSize: 29, maxSize: 35, minOpacity: 0.5, maxOpacity: 0.61 },
  selected: { minSize: 25, maxSize: 30, minOpacity: 0.42, maxOpacity: 0.53 },
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

  if (node.emphasis === "selected") {
    ctx.save();
    ctx.filter = "blur(0.8px)";
    ctx.font = `400 ${size * 1.15}px ${tamilFont}`;
    ctx.fillStyle = withAlpha(COLORS.primary, opacity * 0.55);
    ctx.fillText(node.glyph, x, y);
    ctx.restore();
  }

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.fillStyle = withAlpha(COLORS.primary, opacity);
  ctx.fillText(node.glyph, x, y);
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
