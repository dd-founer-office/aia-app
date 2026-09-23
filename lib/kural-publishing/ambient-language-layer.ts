/**
 * Distant Devotion — Ambient Language Layer (shared)
 * ----------------------------------------------------------------------------
 * The single, reusable implementation of the app's ambient Tamil glyph field
 * for the kural-publishing Asset Generator, so every template draws from the
 * SAME code instead of each keeping its own copy. publishing-renderer.ts's
 * own Layer 1-4 system for the KKA template (real word/syllable
 * decomposition, milestone zones, hero-box exclusion) is too tightly coupled
 * to a specific Kural's linguistic content to generalize -- it stays where
 * it is, but now imports its noise primitives (smoothNoise / clusterDensity
 * / directionalFlow) and its Tamil-grapheme extractor from here instead of
 * keeping local copies, so there is exactly one implementation of each,
 * not two. drawAmbientLanguageLayer below is the new, content-agnostic pass
 * used by the Aathichoodi/generic template, which has no curated
 * word-by-word structure to hang a bespoke system off of the way the KKA
 * template does.
 *
 * Principles every caller gets: a modern Tamil glyph field sourced from the
 * actual loaded content (never invented), subtle depth strata, clustered/
 * scattered positioning via the same clusterDensity/directionalFlow noise
 * used across this system (never a uniform grid), restrained opacity,
 * positional jitter, one static "breathing" multiplier sampled per render
 * (a still PNG can't animate, so this is one deterministic sample of that
 * slow oscillation, not motion), glyphs never rotated or scaled as
 * decoration, ambient rather than illustrative, nearly imperceptible at
 * first glance. Always drawn straight into the passed canvas context --
 * never a CSS/page background -- so it is part of every downloaded PNG.
 */

import type { SeededRandom } from "./seeded-random";

function positionHash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

/** A single octave of organic value noise -- bilinear-interpolated hash,
 *  which is what turns a hard lookup into a soft undulation. */
export function smoothNoise(px: number, py: number, gridStep: number): number {
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

/** Deterministic organic density field -- quiet zone -> cluster -> quiet
 *  zone -- pure function of position (zero rand draws). */
export function clusterDensity(x: number, y: number): number {
  const n = smoothNoise(x + 5000, y + 5000, 165);
  const shaped = n * n * (3 - 2 * n);
  const sharpened = shaped * shaped * (3 - 2 * shaped);
  return 0.12 + sharpened * 1.3;
}

/** A subtle diagonal compositional bias, weaker than clusterDensity so it
 *  can only ever modulate the clustering, never override it. */
export function directionalFlow(x: number, y: number, width: number, height: number): number {
  const diagonalLength = Math.sqrt(width * width + height * height);
  const perpDist = Math.abs(height * x + width * y - width * height) / diagonalLength;
  const wobble = (smoothNoise(x + 8000, y + 8000, 220) - 0.5) * diagonalLength * 0.08;
  const normalizedDist = Math.min(1, Math.max(0, (perpDist + wobble) / (diagonalLength * 0.22)));
  const falloff = normalizedDist * normalizedDist * (3 - 2 * normalizedDist);
  return 1.2 - falloff * 0.35;
}

/** Real Tamil graphemes (உயிர் independents, plus மெய்+optional உயிர்
 *  vowel-sign compounds) found in arbitrary Tamil text -- so a template's
 *  glyph field is sourced from whatever content is actually loaded, never
 *  an invented set. */
export function extractTamilGraphemes(text: string): string[] {
  const matches = text.match(/[அ-ஔ]|[க-ஹ][ா-்]?/g);
  return matches ?? [];
}

export interface AmbientClearBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AmbientLanguageLayerOptions {
  width: number;
  height: number;
  rand: SeededRandom;
  font: string;
  glyphPool: readonly string[];
  color: string;
  /** Pixel rect (e.g. the foreground card) that the field softly thins out
   *  toward, never a hard edge -- same technique kuralClearingFactor uses
   *  for the KKA template's own field. */
  clearBox?: AmbientClearBox;
}

function clearingFactor(x: number, y: number, box?: AmbientClearBox): number {
  if (!box) return 1;
  // A soft feather right at the box's own edge, not a buffer scaled to the
  // box's size -- the box (e.g. a card) is typically most of the canvas,
  // so a size-scaled buffer would swallow the entire margin the field
  // actually has room to appear in.
  const feather = Math.min(box.width, box.height) * 0.02 + 6;
  const dx = Math.max(box.x - x, 0, x - (box.x + box.width));
  const dy = Math.max(box.y - y, 0, y - (box.y + box.height));
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.min(1, dist / feather);
}

/** One depth stratum: a grid sized comfortably larger than the glyph (so
 *  neighbours can never touch), jittered per cell, accepted
 *  probabilistically via clustering + directional flow so density genuinely
 *  varies rather than reading as a uniform scatter. Glyphs are drawn
 *  upright at a fixed size for this stratum -- never rotated or scaled per
 *  glyph, which would read as decoration rather than ambient presence. */
function drawStratum(
  ctx: CanvasRenderingContext2D,
  opts: AmbientLanguageLayerOptions,
  cell: number,
  size: number,
  opacityRange: readonly [number, number],
  breathing: number
): void {
  const { width, height, rand, font, glyphPool, color, clearBox } = opts;
  if (glyphPool.length === 0) return;
  const jitter = cell * 0.32;
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${size}px ${font}`;
  ctx.fillStyle = color;
  const [lo, hi] = opacityRange;
  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const gx = (ci + 0.5) * cell + rand.range(-jitter, jitter);
      const gy = (ri + 0.5) * cell + rand.range(-jitter, jitter);
      if (gx < 2 || gx > width - 2 || gy < 2 || gy > height - 2) continue;
      const density = clusterDensity(gx, gy) * directionalFlow(gx, gy, width, height);
      const clearing = clearingFactor(gx, gy, clearBox);
      if (!rand.chance(Math.min(1, density * 0.5) * clearing)) continue;
      ctx.globalAlpha = Math.max(0.02, (lo + (hi - lo) * Math.min(1, density * 0.6)) * breathing);
      ctx.fillText(rand.pick(glyphPool), gx, gy);
    }
  }
  ctx.globalAlpha = 1;
}

/** Draws the full ambient field into ctx: two depth strata (a smaller,
 *  denser, fainter "far" pass and a slightly larger, sparser, marginally
 *  more present "near" pass) plus one deterministic global "breathing"
 *  multiplier sampled from rand -- a single static point along a slow
 *  oscillation, since a still PNG export can't itself animate. */
export function drawAmbientLanguageLayer(
  ctx: CanvasRenderingContext2D,
  opts: AmbientLanguageLayerOptions
): void {
  const short = Math.min(opts.width, opts.height);
  const breathing = 0.82 + opts.rand.range(0, 0.28);
  ctx.save();
  drawStratum(ctx, opts, short * 0.09, short * 0.028, [0.025, 0.05], breathing);
  drawStratum(ctx, opts, short * 0.16, short * 0.045, [0.035, 0.075], breathing);
  ctx.restore();
}
