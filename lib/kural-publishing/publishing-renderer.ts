/**
 * Kural Publishing — Renderer (MVP)
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
 *   LEFT (0 -> denseEnd)         dense linguistic possibility
 *   CENTRE (denseEnd -> quiet)   Formation Paths; components converging
 *                                into selected, formed Tamil
 *   RIGHT (quietStart -> edge)   protected silence; the Kural and its
 *                                editorial thought, and nothing else
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
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  drawAmbientField(ctx, width, height, tamilFont, rand);
  drawFormationLayer(ctx, width, height, tamilFont, rand);
  drawForegroundKural(ctx, width, height, content, tamilFont, sansFont);
  drawMetadata(ctx, width, height, content, sansFont);
  if (logoImage) drawLogoSlot(ctx, width, height, logoImage);
}

// ---------------------------------------------------------------------------
// Ambient field -- dense left, tapering to zero by REGIONS.transitionEnd.
// Clustered-scatter (gap + cluster run), not a uniform grid -- density is a
// real change in glyph population, not a single opacity multiplier over an
// evenly-filled grid.
// ---------------------------------------------------------------------------

/** Two segments, matching the ABUNDANCE -> CONNECTION -> FORMATION ->
 *  SELECTION -> SILENCE narrative spatially, not just as an opacity ramp:
 *   - 0 -> denseEnd: density stays high (1.0 easing only to 0.82) -- a
 *     sustained mass, not a peak that immediately starts fading.
 *   - denseEnd -> transitionEnd: eases down to 0 -- the genuine thinning.
 *   - beyond transitionEnd: 0, always. */
function densityAt(xFrac: number): number {
  if (xFrac >= REGIONS.transitionEnd) return 0;
  if (xFrac <= REGIONS.denseEnd) {
    const t = xFrac / REGIONS.denseEnd;
    return 0.82 + 0.18 * (1 - t);
  }
  const span = REGIONS.transitionEnd - REGIONS.denseEnd;
  const t = (xFrac - REGIONS.denseEnd) / span;
  return 0.82 * Math.pow(1 - t, 1.4);
}

/** Coarse per-region random multipliers, sampled once per render from the
 *  seeded generator, so the dense field reads as organic pockets (some
 *  clusters, some small clearings) rather than a smooth left-to-right
 *  gradient. Looked up with light neighbour-averaging so pocket edges
 *  blend instead of showing a visible grid. */
const POCKET_COLS = 9;
const POCKET_ROWS = 6;

function buildPocketField(rand: SeededRandom): number[][] {
  const field: number[][] = [];
  for (let r = 0; r < POCKET_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < POCKET_COLS; c++) row.push(rand.range(0.55, 1.55));
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

function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  // Finer grid than the first pass -- more addressable slots is what makes
  // the left field readable as an abundant world rather than a scattering.
  const colW = 26;
  const rowH = 30;
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
      const density = Math.min(1.5, densityAt(xFrac) * pocketMultiplierAt(pockets, xFrac, yFrac));
      if (density <= 0.03) {
        c += 2;
        continue;
      }

      const gap = Math.max(1, Math.round(rand.range(1, 5) * (1.5 - Math.min(1, density))));
      c += gap;
      if (c >= protectedCol) break;

      // Pockets can push a cluster run considerably longer than the first
      // pass allowed -- this is the substantial population increase the
      // correction asked for, concentrated in the organic high-density
      // pockets rather than spread evenly.
      const maxClusterLen = density > 0.9 ? 6 : density > 0.5 ? 3 : density > 0.2 ? 2 : 1;
      const clusterLen = rand.int(1, maxClusterLen + 1);

      for (let i = 0; i < clusterLen && c < protectedCol; i++, c++) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        const cxFrac = cx / width;
        const cyFrac = cy / height;
        const d = Math.min(1.5, densityAt(cxFrac) * pocketMultiplierAt(pockets, cxFrac, cyFrac));
        if (d <= 0.03) continue;
        // Intentional gaps within a cluster -- not every slot fires, so
        // clusters read as organic clumps with small clearings, not solid
        // blocks.
        if (!rand.chance(Math.min(1, d * 0.85 + 0.1))) continue;

        drawAmbientGlyph(ctx, cx, cy, d, tamilFont, rand);
      }
    }
  }
}

/** Four depth strata, weighted so DEEP dominates and GHOST is genuinely
 *  rare -- this is what gives the field layered depth instead of a single
 *  flat scatter. GHOST glyphs are large, extremely faint, and given wide
 *  jitter so some sit partially cropped at the field's own edges, feeling
 *  embedded rather than placed on top. */
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
  let wide = false;

  if (roll < 0.55) {
    size = rand.range(9, 14); // DEEP
    baseOpacity = rand.range(0.035, 0.1);
  } else if (roll < 0.83) {
    size = rand.range(15, 21); // MID
    baseOpacity = rand.range(0.09, 0.19);
  } else if (roll < 0.95) {
    size = rand.range(22, 30); // NEAR
    baseOpacity = rand.range(0.16, 0.28);
  } else {
    size = rand.range(48, 78); // GHOST -- rare, large, barely there
    baseOpacity = rand.range(0.025, 0.055);
    wide = true;
  }

  const jitterRange = wide ? 26 : 8;
  const jitterX = rand.range(-jitterRange, jitterRange);
  const jitterY = rand.range(-jitterRange, jitterRange);
  const glyph = rand.pick(MODERN_TAMIL_VALUES);
  const opacity = baseOpacity * (0.55 + density);

  ctx.font = `400 ${size}px ${tamilFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlpha(COLORS.primary, opacity);
  ctx.fillText(glyph, x + jitterX, y + jitterY);
}

// ---------------------------------------------------------------------------
// Formation Paths -- hardcoded, linguistically valid, for Kural 200 only.
// Paths are drawn first so the resolved glyphs sit visually above their
// own connective tissue.
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

  // Decorative root texture first (furthest back) -- most of it connects
  // nothing at all. The three linguistically real edges are drawn into
  // and blended with this same texture next, so they never read as "the
  // three clean connectors" sitting apart from everything else.
  drawRootFilaments(ctx, width, height, rand);

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

/** Scatters short, fading root-like filaments through the abundance and
 *  connection zones -- most begin inside dense clusters and taper into
 *  nothing; some branch once. None of these connect to a named
 *  FormationNode; they are texture, not claims about linguistic structure.
 *  Placement is density-weighted via `rand.chance`, so more of them start
 *  where the field is already dense, per "some begin inside dense glyph
 *  clusters." */
function drawRootFilaments(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: SeededRandom
): void {
  const attempts = 34;
  for (let i = 0; i < attempts; i++) {
    const xFrac = rand.range(0.04, REGIONS.transitionEnd * 0.97);
    const density = densityAt(xFrac);
    if (!rand.chance(Math.min(1, density * 0.9 + 0.1))) continue;

    const x = xFrac * width;
    const y = rand.range(height * 0.06, height * 0.94);
    const angle = rand.range(-Math.PI * 0.4, Math.PI * 0.4); // broadly rightward
    const length = rand.range(34, 120) * (0.55 + density);
    const depthBudget = rand.chance(0.32) ? 2 : 1;

    drawFilamentBranch(ctx, x, y, angle, length, rand, depthBudget);
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
  depthBudget: number
): void {
  const bend = rand.range(-0.55, 0.55);
  const midAngle = angle + bend * 0.5;
  const midX = x + Math.cos(midAngle) * length * 0.5;
  const midY = y + Math.sin(midAngle) * length * 0.5;
  const endAngle = angle + bend;
  const endX = x + Math.cos(endAngle) * length;
  const endY = y + Math.sin(endAngle) * length;

  const peakAlpha = rand.range(0.05, 0.15);
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
      depthBudget - 1
    );
  }
}

/** The three linguistically real relationships. Reaches exact from/to
 *  points (unlike the decorative filaments), but with two independent
 *  bends and a fading gradient stroke so it reads as one more root among
 *  many -- and, most of the time, spawns a stray branch that goes nowhere,
 *  further disguising it as "the one clean connector." */
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

  const peakAlpha = rand.range(0.11, 0.19);
  const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  gradient.addColorStop(0, withAlpha(COLORS.primary, peakAlpha * 0.5));
  gradient.addColorStop(0.5, withAlpha(COLORS.primary, peakAlpha));
  gradient.addColorStop(1, withAlpha(COLORS.primary, peakAlpha * 0.3));

  ctx.strokeStyle = gradient;
  ctx.lineWidth = rand.range(0.65, 1.05);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.stroke();

  if (rand.chance(0.8)) {
    const t = rand.range(0.3, 0.6);
    const bx = x1 + dx * t + nx * bow1 * 0.5;
    const by = y1 + dy * t + ny * bow1 * 0.5;
    const branchAngle = Math.atan2(dy, dx) + rand.range(-1.3, 1.3);
    drawFilamentBranch(ctx, bx, by, branchAngle, rand.range(28, 66), rand, 1);
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
  component: { minSize: 15, maxSize: 20, minOpacity: 0.22, maxOpacity: 0.34 },
  formed: { minSize: 23, maxSize: 28, minOpacity: 0.38, maxOpacity: 0.48 },
  emerging: { minSize: 29, maxSize: 34, minOpacity: 0.48, maxOpacity: 0.58 },
  selected: { minSize: 25, maxSize: 30, minOpacity: 0.4, maxOpacity: 0.5 },
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
// fit within the protected region via measureText, never by guessing.
// ---------------------------------------------------------------------------

function drawForegroundKural(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  content: KuralPublishingContent,
  tamilFont: string,
  sansFont: string
): void {
  const leftX = REGIONS.quietStart * width + width * 0.045;
  const rightMargin = width * 0.06;
  const maxTextWidth = width - leftX - rightMargin;

  const kuralLines = [content.tamilLine1, content.tamilLine2];
  // Larger and more generously spaced than the first pass -- the Kural is
  // the primary textual voice; the Living Layer must not compete with it.
  const kuralSize = fitFontSize(ctx, kuralLines, tamilFont, 500, maxTextWidth, 46, 26);
  const kuralLineGap = kuralSize * 1.42;
  const kuralY1 = height * 0.4;
  const kuralY2 = kuralY1 + kuralLineGap;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.foreground;
  ctx.font = `500 ${kuralSize}px ${tamilFont}`;
  ctx.fillText(content.tamilLine1, leftX, kuralY1);
  ctx.fillText(content.tamilLine2, leftX, kuralY2);

  const englishLines = [content.englishLine1, content.englishLine2];
  const engSize = fitFontSize(ctx, englishLines, sansFont, 500, maxTextWidth, 17, 12);
  const engLineGap = engSize * 1.55;
  const engY1 = kuralY2 + kuralSize * 1.65;
  const engY2 = engY1 + engLineGap;

  // Neutral, not green -- clearly subordinate to the Kural, not a second
  // voice competing with the Living Layer's own colour.
  ctx.font = `500 ${engSize}px ${sansFont}`;
  ctx.fillStyle = withAlpha(COLORS.muted, 0.95);
  ctx.fillText(content.englishLine1, leftX, engY1);
  ctx.fillText(content.englishLine2, leftX, engY2);
}

/** Shrinks font size (never below minSize) until every line fits maxWidth,
 *  using the browser's own text metrics -- not an estimate. Restores no
 *  state on its own; caller sets ctx.font again before actually drawing. */
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
  const leftX = REGIONS.quietStart * width + width * 0.045;
  const y = height * 0.92;
  const text = `Issue #${content.issue} · ${content.series} · Kural ${content.kuralNumber}`;

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

function withAlpha(hex: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${clamped})`;
}
