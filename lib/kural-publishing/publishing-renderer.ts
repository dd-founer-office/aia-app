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

/** 1 at the left edge, tapering to 0 at transitionEnd on an eased curve
 *  (steeper than linear, so the thinning reads as organic). Zero beyond
 *  transitionEnd -- the quiet region gets no ambient glyphs at all. */
function densityAt(xFrac: number): number {
  if (xFrac >= REGIONS.transitionEnd) return 0;
  const t = Math.min(1, xFrac / REGIONS.transitionEnd);
  return Math.pow(1 - t, 1.6);
}

function drawAmbientField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  const colW = 34;
  const rowH = 40;
  const cols = Math.ceil(width / colW);
  const rows = Math.ceil(height / rowH);
  const protectedCol = Math.ceil((REGIONS.transitionEnd * width) / colW);

  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (c >= protectedCol) break; // hard stop -- never draws past the field

      const xFrac = (c * colW) / width;
      const density = densityAt(xFrac);
      if (density <= 0.02) {
        c += 3;
        continue;
      }

      // Denser regions pack tighter; thinning regions leave bigger gaps --
      // this, not opacity alone, is what makes the population itself shrink.
      const gap = Math.max(1, Math.round(rand.range(1, 7) * (1.4 - density)));
      c += gap;
      if (c >= protectedCol) break;

      const maxClusterLen = density > 0.6 ? 4 : density > 0.3 ? 2 : 1;
      const clusterLen = rand.int(1, maxClusterLen + 1);

      for (let i = 0; i < clusterLen && c < protectedCol; i++, c++) {
        const cx = c * colW + colW / 2;
        const cy = r * rowH + rowH / 2;
        const d = densityAt(cx / width);
        if (d <= 0.02) continue;
        // Intentional gaps within a cluster -- not every slot fires, so
        // clusters read as organic clumps rather than solid blocks.
        if (!rand.chance(Math.min(1, d + 0.12))) continue;

        drawAmbientGlyph(ctx, cx, cy, d, tamilFont, rand);
      }
    }
  }
}

function drawAmbientGlyph(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  density: number,
  tamilFont: string,
  rand: SeededRandom
): void {
  // Depth tiers -- tiny/faint dominates, ghost is rare. Weighted, not
  // uniform, so the field reads as layered rather than flat.
  const roll = rand.next();
  let size: number;
  let baseOpacity: number;
  if (roll < 0.62) {
    size = rand.range(11, 16);
    baseOpacity = rand.range(0.05, 0.14);
  } else if (roll < 0.92) {
    size = rand.range(17, 24);
    baseOpacity = rand.range(0.1, 0.22);
  } else {
    size = rand.range(30, 46);
    baseOpacity = rand.range(0.04, 0.09);
  }

  const jitterX = rand.range(-8, 8);
  const jitterY = rand.range(-8, 8);
  const glyph = rand.pick(MODERN_TAMIL_VALUES);
  const opacity = baseOpacity * (0.5 + density);

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
  for (const path of FORMATION_PATHS) {
    const from = nodeById.get(path.fromId);
    const to = nodeById.get(path.toId);
    if (!from || !to) continue;
    drawFormationCurve(ctx, from, to, width, height, rand);
  }

  for (const node of FORMATION_NODES) {
    drawFormationNode(ctx, node, width, height, tamilFont);
  }
}

/** An organic bowed bezier, not a straight connector line -- the brief is
 *  explicit that these should read as root-like, not as a diagram edge. */
function drawFormationCurve(
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
  const bow = rand.range(18, 46) * (rand.chance(0.5) ? 1 : -1);

  const cx1 = x1 + dx * 0.33 + nx * bow;
  const cy1 = y1 + dy * 0.33 + ny * bow;
  const cx2 = x1 + dx * 0.66 + nx * bow * 0.6;
  const cy2 = y1 + dy * 0.66 + ny * bow * 0.6;

  ctx.strokeStyle = withAlpha(COLORS.primary, 0.16);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
  ctx.stroke();
}

function drawFormationNode(
  ctx: CanvasRenderingContext2D,
  node: FormationNode,
  width: number,
  height: number,
  tamilFont: string
): void {
  const x = node.x * width;
  const y = node.y * height;

  const bySize = { component: 22, formed: 30, discoverable: 38 } as const;
  const byOpacity = { component: 0.5, formed: 0.68, discoverable: 0.85 } as const;
  const byWeight = { component: 400, formed: 400, discoverable: 500 } as const;
  const byColor = {
    component: COLORS.primary,
    formed: COLORS.primaryDark,
    discoverable: COLORS.primaryDark,
  } as const;

  ctx.font = `${byWeight[node.emphasis]} ${bySize[node.emphasis]}px ${tamilFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlpha(byColor[node.emphasis], byOpacity[node.emphasis]);
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
  const kuralSize = fitFontSize(ctx, kuralLines, tamilFont, 500, maxTextWidth, 40, 22);
  const kuralLineGap = kuralSize * 1.32;
  const kuralY1 = height * 0.42;
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
  const engY1 = kuralY2 + kuralSize * 1.5;
  const engY2 = engY1 + engLineGap;

  ctx.font = `500 ${engSize}px ${sansFont}`;
  ctx.fillStyle = withAlpha(COLORS.primaryDark, 0.82);
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
  ctx.fillStyle = withAlpha(COLORS.muted, 0.9);
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
