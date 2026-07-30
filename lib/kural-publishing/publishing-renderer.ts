/**
 * Kural Publishing — Renderer (MVP, Visual Pass 03)
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
 *   LEFT (0 -> denseEnd)         a dense linguistic world -- atmosphere,
 *                                depth strata, macro clusters
 *   CENTRE (denseEnd -> quiet)   dissolve -- population and paths thin and
 *                                break apart; components converge into
 *                                formed, then emerging, then selected Tamil
 *   RIGHT (quietStart -> edge)   protected silence -- the Kural and its
 *                                editorial thought, and nothing else
 *
 * This pass adds atmospheric tonal depth and a much larger, multi-strata
 * glyph population and root-filament network, per visual-pass-03 direction
 * (reference: an approved conceptual image -- used only for compositional
 * qualities: density, depth, atmosphere, hierarchy, transition, energy.
 * Nothing from that reference is drawn, traced, cropped, or composited into
 * this canvas; every mark below is procedurally generated from the seed).
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
 *  invented neon tone. Anchors the atmosphere's left edge ("linguistic
 *  depth", per the brief) without going flat black. */
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

  ctx.clearRect(0, 0, width, height);
  drawAtmosphere(ctx, width, height, rand);

  drawAmbientField(ctx, width, height, tamilFont, rand);
  drawFormationLayer(ctx, width, height, tamilFont, rand);
  drawForegroundKural(ctx, width, height, content, tamilFont, sansFont);
  drawMetadata(ctx, width, height, content, sansFont);
  if (logoImage) drawLogoSlot(ctx, width, height, logoImage);
}

// ---------------------------------------------------------------------------
// Atmosphere -- tonal depth, not a flat background. A multi-stop left->right
// transition (deep sage -> primaryDark -> primary -> sage-mint -> the app's
// own background) plus several large, deterministically placed translucent
// radial "clouds" over the left field, so the shift reads as environment
// rather than a CSS gradient. Clamped to never bleed past REGIONS.quietStart
// -- the quiet region stays exactly the app's background colour, i.e. air.
// ---------------------------------------------------------------------------

function drawAtmosphere(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: SeededRandom
): void {
  const q = REGIONS.quietStart;

  const base = ctx.createLinearGradient(0, 0, width, 0);
  base.addColorStop(0, DEEP_SAGE);
  base.addColorStop(0.14, mix(DEEP_SAGE, COLORS.primaryDark, 0.6));
  base.addColorStop(q * 0.5, COLORS.primaryDark);
  base.addColorStop(q * 0.75, COLORS.primary);
  base.addColorStop(q * 0.94, mix(COLORS.primary, COLORS.background, 0.6));
  base.addColorStop(q, mix(COLORS.primary, COLORS.background, 0.93));
  base.addColorStop(1, COLORS.background);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // Layered translucent clouds -- deterministic placement, radii, and tone,
  // clamped so nothing paints past the quiet boundary.
  const cloudClipWidth = width * q;
  const cloudCount = 7;
  for (let i = 0; i < cloudCount; i++) {
    const cx = rand.range(-width * 0.08, width * (REGIONS.denseEnd + 0.12));
    const cy = rand.range(height * 0.05, height * 0.95);
    const r = rand.range(width * 0.13, width * 0.3);
    const darker = rand.chance(0.55);
    const tone = darker
      ? mixAlpha(DEEP_SAGE, COLORS.primaryDark, rand.range(0, 1), rand.range(0.1, 0.22))
      : mixAlpha(COLORS.primary, COLORS.background, rand.range(0.15, 0.65), rand.range(0.08, 0.16));

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, tone);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cloudClipWidth, height);
  }
}

// ---------------------------------------------------------------------------
// Ambient field -- a language mass on the left that dissolves toward
// REGIONS.transitionEnd, never a uniform scatter. Three multipliers combine:
// a left->right base falloff (with a genuine "dissolve" curve, not a linear
// fade), several macro cluster bumps (clusters within clusters), and a fine
// pocket grid (small clearings within clusters).
// ---------------------------------------------------------------------------

/** 0 -> denseEnd: sustained abundance (a mass, not a peak that immediately
 *  fades). denseEnd -> transitionEnd: a steep "dissolve" -- population
 *  genuinely breaks apart, not just dims. Zero beyond transitionEnd, always. */
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

/** "Clusters within clusters": a handful of large gaussian-ish bumps seeded
 *  across the left field, so density accumulates in a few regions rather
 *  than spreading evenly -- per "allow clusters within clusters." */
function buildMacroClusters(rand: SeededRandom): MacroCluster[] {
  const clusters: MacroCluster[] = [];
  const count = 5;
  for (let i = 0; i < count; i++) {
    clusters.push({
      cx: rand.range(0.02, REGIONS.denseEnd * 0.88),
      cy: rand.range(0.06, 0.94),
      r: rand.range(0.13, 0.3),
      strength: rand.range(0.35, 0.8),
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
const POCKET_COLS = 11;
const POCKET_ROWS = 7;

function buildPocketField(rand: SeededRandom): number[][] {
  const field: number[][] = [];
  for (let r = 0; r < POCKET_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < POCKET_COLS; c++) row.push(rand.range(0.5, 1.6));
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
  return Math.max(0, Math.min(2.4, base * bump * pocket));
}

function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  // A finer grid than before -- more addressable slots is what lets the
  // left read as "hundreds of visible marks, many more barely perceptible"
  // rather than a scattering.
  const colW = 19;
  const rowH = 22;
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

      const gap = Math.max(1, Math.round(rand.range(1, 4) * (1.6 - Math.min(1.5, density))));
      c += gap;
      if (c >= protectedCol) break;

      // Pockets and macro clusters can push density well above 1 -- that is
      // the substantial population increase the correction asked for,
      // concentrated in a few accumulated regions rather than spread evenly.
      const maxClusterLen =
        density > 1.6 ? 9 : density > 1.1 ? 6 : density > 0.65 ? 4 : density > 0.3 ? 2 : 1;
      const clusterLen = rand.int(1, maxClusterLen + 1);

      for (let i = 0; i < clusterLen && c < protectedCol; i++, c++) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        const cxFrac = cx / width;
        const cyFrac = cy / height;
        const d = densityAt(cxFrac, cyFrac, macro, pockets);
        if (d <= 0.03) continue;
        // Intentional gaps within a cluster -- regions that breathe, per
        // the brief -- not every slot fires even inside a dense pocket.
        if (!rand.chance(Math.min(1, d * 0.62 + 0.14))) continue;

        drawAmbientGlyph(ctx, cx, cy, d, tamilFont, rand);
      }
    }
  }
}

/** Five depth/contrast strata -- DEEP dominates, MID and NEAR give
 *  progressively stronger contrast, GHOST is rare/huge/barely-there, and
 *  ANCHOR is a genuinely rare, high-presence, near-dark mark that gives the
 *  left field a few visual anchors instead of uniform faintness. Colour
 *  itself shifts toward `foreground` for the stronger tiers -- contrast
 *  comes from tone as well as opacity, not opacity alone. */
function drawAmbientGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  const roll = rand.next();
  let size: number;
  let baseOpacity: number;
  let colorMix: number; // 0 = primary green, 1 = near-dark foreground
  let wide = false;

  if (roll < 0.48) {
    size = rand.range(6, 11); // DEEP -- very many, tiny, low opacity
    baseOpacity = rand.range(0.025, 0.08);
    colorMix = 0;
  } else if (roll < 0.75) {
    size = rand.range(12, 18); // MID -- medium, greater contrast
    baseOpacity = rand.range(0.07, 0.17);
    colorMix = 0.12;
  } else if (roll < 0.895) {
    size = rand.range(19, 28); // NEAR -- fewer, larger, higher contrast
    baseOpacity = rand.range(0.15, 0.3);
    colorMix = 0.28;
  } else if (roll < 0.965) {
    size = rand.range(44, 82); // GHOST -- rare, huge, barely there
    baseOpacity = rand.range(0.018, 0.045);
    colorMix = 0;
    wide = true;
  } else {
    size = rand.range(25, 38); // ANCHOR -- genuinely rare, high presence
    baseOpacity = rand.range(0.45, 0.68);
    colorMix = 0.82;
  }

  const jitterRange = wide ? 32 : 9;
  const jitterX = rand.range(-jitterRange, jitterRange);
  const jitterY = rand.range(-jitterRange, jitterRange);
  const glyph = rand.pick(MODERN_TAMIL_VALUES);
  const opacity = Math.min(1, baseOpacity * (0.55 + density * 0.5));
  const color = mix(COLORS.primary, COLORS.foreground, colorMix);

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlphaRgb(color, opacity);
  ctx.fillText(glyph, x + jitterX, y + jitterY);
}

// ---------------------------------------------------------------------------
// Formation Paths -- a branching root/mycelium-like network, not diagram
// connectors. Primary (the three linguistically real edges), secondary
// (decorative branches, mostly connecting nothing), and tertiary (very
// faint additional texture) all share the same drawing language, so no
// single path reads as "the clean connector."
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

  // Decorative root network first (furthest back) -- secondary + tertiary
  // passes. Most of this connects nothing at all.
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

/** Secondary branches: begin inside dense clusters (density-weighted via
 *  rand.chance), wander, and mostly taper into nothing. Tertiary branches:
 *  a second, much fainter and shorter pass for background texture -- "very
 *  faint tertiary branches," per the brief. Neither connects to a named
 *  FormationNode; both are texture, not claims about linguistic structure. */
function drawRootFilaments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: SeededRandom
): void {
  const secondaryAttempts = 70;
  for (let i = 0; i < secondaryAttempts; i++) {
    const xFrac = rand.range(0.03, REGIONS.transitionEnd * 0.98);
    const density = baseFalloff(xFrac);
    if (!rand.chance(Math.min(1, density * 0.9 + 0.12))) continue;

    const x = xFrac * width;
    const y = rand.range(height * 0.05, height * 0.95);
    const angle = rand.range(-Math.PI * 0.42, Math.PI * 0.42); // broadly rightward
    const length = rand.range(30, 130) * (0.5 + density);
    const depthBudget = rand.chance(0.34) ? 2 : 1;

    drawFilamentBranch(ctx, x, y, angle, length, rand, depthBudget, 0.05, 0.16);
  }

  const tertiaryAttempts = 55;
  for (let i = 0; i < tertiaryAttempts; i++) {
    const xFrac = rand.range(0.02, REGIONS.transitionEnd * 1.02);
    const density = baseFalloff(Math.min(xFrac, REGIONS.transitionEnd - 0.001));
    if (!rand.chance(Math.min(1, density * 0.7 + 0.18))) continue;

    const x = xFrac * width;
    const y = rand.range(height * 0.04, height * 0.96);
    const angle = rand.range(-Math.PI * 0.5, Math.PI * 0.5);
    const length = rand.range(16, 58);

    drawFilamentBranch(ctx, x, y, angle, length, rand, 1, 0.02, 0.06);
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

/** The three linguistically real relationships (primary paths). Reaches
 *  exact from/to points (unlike the decorative filaments), but with two
 *  independent bends and a fading gradient stroke so it reads as one more
 *  root among many -- and, most of the time, spawns a stray branch that
 *  goes nowhere, further disguising it as "the one clean connector." */
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

  const peakAlpha = rand.range(0.13, 0.22);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, withAlpha(COLORS.primary, peakAlpha * 0.5));
  gradient.addColorStop(0.5, withAlpha(COLORS.primary, peakAlpha));
  gradient.addColorStop(1, withAlpha(COLORS.primary, peakAlpha * 0.3));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = rand.range(0.65, 1.1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.stroke();

  if (rand.chance(0.8)) {
    const t = rand.range(0.3, 0.6);
    const bx = x1 + dx * t + nx * bow1 * 0.5;
    const by = y1 + dy * t + ny * bow1 * 0.5;
    const branchAngle = Math.atan2(dy, dx) + rand.range(-1.3, 1.3);
    drawFilamentBranch(ctx, bx, by, branchAngle, rand.range(28, 66), rand, 1, 0.06, 0.15);
  }
}

/** Styling per emphasis tier. `component` sits close to ordinary NEAR-tier
 *  ambient weight (findable only by being consistently there, at a
 *  consistent position, not by being loud); each subsequent tier gains a
 *  little presence, never becoming heading-like. `selected` (பயன்) is
 *  drawn with a soft under-layer via a slight canvas blur -- "this idea
 *  survived" rather than "this was constructed" -- since, unlike சொ/சொல்,
 *  it was never built from visible components on this canvas. */
const EMPHASIS_STYLE = {
  component: { minSize: 15, maxSize: 20, minOpacity: 0.24, maxOpacity: 0.36 },
  formed: { minSize: 23, maxSize: 28, minOpacity: 0.4, maxOpacity: 0.5 },
  emerging: { minSize: 30, maxSize: 36, minOpacity: 0.52, maxOpacity: 0.63 },
  selected: { minSize: 26, maxSize: 31, minOpacity: 0.44, maxOpacity: 0.55 },
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
// Foreground Kural + English thought -- the quiet region's only content.
// Left-aligned per the locked Kural display rule (never centered), sized to
// fit within the protected region via measureText. minSize is a genuine
// safety floor now (15px), not a number that happened to be big enough for
// one draft of the text -- this is the fix for the right-edge clipping bug.
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
  // Larger and more generously spaced than before -- the Kural is the
  // primary textual voice; the Living Layer must not compete with it. The
  // fit loop will shrink below startSize whenever needed and never returns
  // a size wider than maxTextWidth, so this can never clip the canvas edge
  // regardless of how long the input text is.
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

  // Neutral, not green -- clearly subordinate to the Kural, more editorial
  // presence than a whisper but never a second voice competing with it.
  ctx.font = `500 ${engSize}px ${sansFont}`;
  ctx.fillStyle = withAlpha(COLORS.muted, 1);
  ctx.fillText(content.englishLine1, leftX, engY1);
  ctx.fillText(content.englishLine2, leftX, engY2);
}

/** Shrinks font size (never below minSize) until every line fits maxWidth,
 *  using the browser's own text metrics -- not an estimate. minSize here is
 *  a true safety floor (15px for the Kural): whatever comes out of this
 *  function is guaranteed to measure at or under maxWidth at that size for
 *  any realistic Kural line length, so foreground text can never be clipped
 *  by the canvas edge. Restores no state on its own; caller sets ctx.font
 *  again before actually drawing. */
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
// Metadata -- low-hierarchy credit line, quiet region only.
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
// fallback mark, no "logo missing" text, no placeholder box.
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
