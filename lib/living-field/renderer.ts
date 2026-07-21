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
 *  2. Global breath (new in Sprint 01): one field-wide sinusoidal swell,
 *     ~45s period, ±8% of current opacity. Deliberately at the threshold of
 *     perception — fog, paper, air; never waves, never particles.
 *
 * Letters never move, rotate, or scale at runtime. Only opacity breathes.
 */

import type { LivingFieldConfig, FieldStratum } from "./config";
import type { FieldLayout, FieldCell } from "./field-layout";

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

/** Global breathing multiplier, ~1 ± breathAmplitude. */
export function breathMultiplier(t: number, config: LivingFieldConfig): number {
  return 1 + config.breathAmplitude * Math.sin((2 * Math.PI * t) / config.breathPeriodMs);
}

/** Final opacity for one cell at time t. */
export function cellOpacity(cell: FieldCell, t: number, config: LivingFieldConfig): number {
  const wave = wavePhase01(cell.col, cell.row, t, config);
  const raw = cell.stratum.baseOpacity + cell.stratum.waveAmplitude * wave;
  return raw * breathMultiplier(t, config) * config.intensity;
}

/** Static opacity used for the reduced-motion frame: wave held at midpoint,
 *  no breath. The field remains alive without noticeable animation. */
export function cellOpacityStatic(cell: FieldCell, config: LivingFieldConfig): number {
  return (cell.stratum.baseOpacity + cell.stratum.waveAmplitude * 0.5) * config.intensity;
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
      }
      // kind === "path" (future heritage strata) is intentionally not drawn
      // in Sprint 01 — no path data ships, no placeholder rendering exists.
    }
  }
}
