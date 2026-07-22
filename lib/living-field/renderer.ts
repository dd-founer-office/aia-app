/**
 * Living Field — Renderer
 * ----------------------------------------------------------------------------
 * Pure drawing layer: given a layout, a config, and a timestamp, paint one
 * frame. Holds no state and schedules nothing (that is the engine's job),
 * which keeps the modulation math independently testable.
 *
 * Two modulations compose here, both on field time (Two Clocks — the field
 * never borrows interface time):
 *
 *  1. Diagonal brightness wave (identity behaviour from v0.6, formula
 *     unchanged): a slow sweep across the grid, amplitude set per stratum.
 *  2. Global breath (Sprint 01): one field-wide sinusoidal swell, ~45s
 *     period, ±8% of current opacity. Deliberately at the threshold of
 *     perception — fog, paper, air; never waves, never particles.
 *
 * Letters never move, rotate, or scale at runtime. Only opacity breathes.
 *
 * Sprint 02 (Living Civilization Layer v1.0): this file now draws BOTH
 * glyph kinds — text (modern Tamil, Tamil-Brahmi) and path (Vatteluttu,
 * even-odd fill for interior holes). Per the "all scripts render
 * identically" rule, path glyphs go through the exact same wave/breath/
 * intensity opacity pipeline as text glyphs, at the same fillStyle, with no
 * glow, colour, or motion difference by script. This module still has no
 * concept of "civilization" or "which script" — it only knows two glyph
 * *kinds* to paint. That decision already happened in field-layout.ts.
 *
 * Sprint 03A (Affinity Engine): the ONLY change in this file. The global
 * breath sine wave now accepts an optional per-cell phase offset, sourced
 * from `cell.affinity?.breathingOffset` (defaults to 0 — bit-identical to
 * Sprint 02 when affinity metadata is absent). This module still has no
 * concept of neighborhoods, density, or affinity strength — per the
 * Renderer Contract, it reads exactly one number and does nothing else
 * differently.
 */

import type { LivingFieldConfig, FieldStratum } from "./config";
import type { FieldLayout, FieldCell } from "./field-layout";
import type { GlyphPath } from "./glyphs";

/** v0.6 diagonal wave, normalised 0..1. */
export function wavePhase01(
  col: number,
  row: number,
  t: number,
  config: LivingFieldConfig
): number {
  const phase = col * config.wavePhaseCol + row * config.wavePhaseRow - t * config.waveSpeed;
  return 0.5 + 0.5 * Math.sin(phase);
}

/** Global breathing multiplier, ~1 ± breathAmplitude. `phaseOffset` (radians)
 *  is Sprint 03A's addition: 0 reproduces Sprint 02's single global phase
 *  exactly; a per-cell offset from `cell.affinity.breathingOffset` makes
 *  neighborhoods drift subtly out of sync with each other. */
export function breathMultiplier(
  t: number,
  config: LivingFieldConfig,
  phaseOffset = 0
): number {
  return 1 + config.breathAmplitude * Math.sin((2 * Math.PI * t) / config.breathPeriodMs + phaseOffset);
}

/** Final opacity for one cell at time t. */
export function cellOpacity(cell: FieldCell, t: number, config: LivingFieldConfig): number {
  const wave = wavePhase01(cell.col, cell.row, t, config);
  const raw = cell.stratum.baseOpacity + cell.stratum.waveAmplitude * wave;
  return raw * breathMultiplier(t, config, cell.affinity?.breathingOffset ?? 0) * config.intensity;
}

/** Static opacity used for the reduced-motion frame: wave held at midpoint,
 *  no breath. The field remains alive without noticeable animation. */
export function cellOpacityStatic(cell: FieldCell, config: LivingFieldConfig): number {
  return (cell.stratum.baseOpacity + cell.stratum.waveAmplitude * 0.5) * config.intensity;
}

/**
 * Draws a traced letterform (0–10 unit box, even-odd fill so interior holes
 * stay visually open) centred at the canvas origin, scaled to `size` so it
 * reads at the same visual weight as a text glyph at that font size. Caller
 * is expected to have already translated the context to the cell's (x, y).
 * Formula unchanged from Concept v0.6's `drawPathGlyph`.
 */
function drawPathGlyph(ctx: CanvasRenderingContext2D, shape: GlyphPath, size: number): void {
  ctx.beginPath();
  shape.outer.forEach((p, i) => {
    const x = (p[0] / 10 - 0.5) * size;
    const y = (p[1] / 10 - 0.5) * size;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  shape.holes.forEach((hole) => {
    hole.forEach((p, i) => {
      const x = (p[0] / 10 - 0.5) * size;
      const y = (p[1] / 10 - 0.5) * size;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  });
  ctx.fill("evenodd");
}

export interface RenderOptions {
  /** Resolved application font family (from --font-tamil-sans); falls back to
   *  config.fontFamilyFallback when empty. */
  fontFamily?: string;
  /** When true, draw the single static frame (prefers-reduced-motion). */
  static?: boolean;
}

/**
 * Paint one frame. Cells are drawn grouped by stratum so ctx.font is set once
 * per stratum instead of once per cell.
 */
export function renderField(
  ctx: CanvasRenderingContext2D,
  layout: FieldLayout,
  t: number,
  config: LivingFieldConfig,
  options: RenderOptions = {}
): void {
  const [cr, cg, cb] = config.colorRGB;
  const family = options.fontFamily && options.fontFamily.trim().length > 0
    ? options.fontFamily
    : config.fontFamilyFallback;

  ctx.clearRect(0, 0, layout.width, layout.height);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const stratum of config.strata) {
    ctx.font = `${config.fontWeight} ${stratum.fontSize}px ${family}`;
    for (const cell of layout.cells) {
      if (cell.stratum !== stratum) continue;
      const op = options.static
        ? cellOpacityStatic(cell, config)
        : cellOpacity(cell, t, config);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${op})`;
      if (cell.glyph.kind === "text") {
        ctx.fillText(cell.glyph.value, cell.x, cell.y);
      } else {
        // kind === "path" (Vatteluttu). Same fillStyle/opacity as text
        // glyphs above -- no script-specific styling, per Sprint 02's
        // "all scripts render identically" rule.
        ctx.save();
        ctx.translate(cell.x, cell.y);
        drawPathGlyph(ctx, cell.glyph.value, stratum.fontSize);
        ctx.restore();
      }
    }
  }
}
