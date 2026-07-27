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
 *
 * Optical Weight Calibration v1.0: this task explicitly asks for
 * per-script rendering adjustments, unlike Sprints 03A/03B which forbade
 * touching this file. Each cell's `scriptId` (set by the Civilization
 * Engine's own selection decision, not re-derived here) looks up a
 * multiplier from optical-calibration.ts and applies it to the FINAL
 * opacity (after wave/breath/intensity, so breathing rhythm itself is
 * untouched) and to the effective font/path size. Colour, motion, and
 * everything else about how a glyph is drawn stays identical across
 * scripts -- only presence and size differ, per the calibration's rules.
 *
 * Sprint 03C (Emergent Harmony v1.0): the ONLY change in this file.
 * `breathMultiplier` gains one more optional parameter, an amplitude
 * scale, sourced from `cell.harmony?.amplitudeInfluence` (defaults to 1 --
 * bit-identical to Sprint 03A/Optical Calibration behaviour when harmony
 * metadata is absent). It scales ONLY the existing breath-amplitude term,
 * never the phase (Affinity's territory), never the base opacity or wave
 * (Sprint 01's), never colour or size (Optical Calibration's). This module
 * still has no concept of neighborhoods, density, or affinity strength --
 * per the Harmony Engine's contract, it reads exactly one number and does
 * nothing else differently.
 *
 * Ambient Language Layer bridge: one more multiplicative layer, sourced
 * from `cell.expression` (ambient-expression.ts), applied AFTER Optical
 * Calibration's opacity weight. Exactly 1 (no change) for the overwhelming
 * majority of cells, which never have an active expression -- this is
 * event-driven, not present during the normal render cadence. Skipped
 * entirely on the static (reduced-motion) frame, for the same reason
 * breathing already is: it's a form of per-frame animation, and the
 * static frame's `t` is fixed. Still opacity-only -- no size, colour, or
 * position change from this layer either.
 *
 * Sprint 04A (Living Region v1), Commit 3A: one FINAL multiplicative layer,
 * sourced from `cell.reservedVerse` + an optional `options.livingRegionState`
 * (living-region-state.ts). Unlike the Ambient Expression term immediately
 * above, this one is NOT skipped on the static/reduced-motion frame -- per
 * explicit direction, the Living Region's interaction must still work under
 * reduced motion (just without animated interpolation), so its progress
 * function handles `reducedMotion` internally rather than being bypassed
 * here. Exactly 1 (no change) for every cell without `reservedVerse`, and
 * for every cell when `options.livingRegionState` is omitted entirely --
 * which is every call site as of this commit (see engine.ts, unchanged) --
 * so this term has zero effect on anything rendered today. Deliberately its
 * own system, not a reuse of Ambient Expression's rise/hold/fall envelope:
 * that one is a one-shot pulse fired by an application event; this one is a
 * sustained, gesture-driven state a person actively holds open. Computed
 * once per frame per stratum (the peak-multiplier lookup), not once per
 * cell -- see the top of renderField()'s stratum loop.
 *
 * Living Language Stories v0.1 introduced the general principle this file
 * still follows: an explicitly opt-in, `options.storyState`-gated term,
 * applied after every other term, with its own two-state reduced-motion
 * behaviour rather than being bypassed on the static frame. The specific
 * mechanism has since evolved twice (v0.2's grapheme-fragment grammar, then
 * v0.3's performer grammar below) -- see story-bridge.ts's own header for
 * that history if useful context.
 *
 * Living Language Stories v0.3 (performer-based grammar, superseding v0.2's
 * grapheme-fragment grammar): a story no longer requires the field to
 * happen to contain a matching glyph. ANY ordinary cell can become ANY
 * performer -- Story Mode gives a chosen cell a TEMPORARY glyph override
 * (`glyphOverride`) alongside its existing position offset and a NEW scale
 * multiplier. Three renderer-visible consequences:
 *
 *   1. There are no more "phantom" overlay fragments at all -- every
 *      performer is always a real cell, so this file's normal per-cell loop
 *      handles 100% of performer rendering; the overlay pass now paints
 *      ONLY the hero word.
 *   2. Performer cells can no longer share their stratum group's single
 *      `ctx.font` setting the way ordinary cells do -- their scale varies
 *      per-cell (each performer's own homeStratum vs the hero's font size),
 *      so they need their OWN font-size resolution. They are therefore
 *      SKIPPED in the normal per-stratum loop below and drawn in a
 *      dedicated pass afterward.
 *   3. That dedicated pass is also what gives performers "hierarchy" (per
 *      explicit direction: position + scale + opacity + hierarchy, not
 *      X/Y alone) -- drawn strictly after every ordinary cell regardless of
 *      which stratum they originally belonged to, so a performer always
 *      reads as foreground/on-top, never accidentally occluded by an
 *      ordinary cell painted after it in stratum-iteration order.
 */

import type { LivingFieldConfig, FieldStratum } from "./config";
import type { FieldLayout, FieldCell } from "./field-layout";
import type { GlyphPath } from "./glyphs";
import {
  ACTIVE_CALIBRATION,
  SCRIPT_IDS,
  getScriptWeight,
  applyOpticalOpacity,
  applyOpticalSize,
} from "./optical-calibration";
import { computeExpressionOpacityMultiplier } from "./ambient-expression";
import {
  computeLivingRegionOpacityMultiplier,
  computeRevealPeakMultiplier,
  type LivingRegionState,
} from "./living-region-state";
import { LIVING_REGION_CONFIG, resolveVerseStratum } from "./living-region";
import { computeStoryCellRenderState } from "./story-bridge";
import { computeAmbientDimMultiplier, computeStoryOverlay } from "./story-bridge";
import type { StoryState } from "./story-bridge-types";

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
 *  neighborhoods drift subtly out of sync with each other. `amplitudeScale`
 *  is Sprint 03C's addition: 1 reproduces the exact prior amplitude; a
 *  per-cell value from `cell.harmony.amplitudeInfluence` lets how DEEP a
 *  cell's breathing dips vary subtly, independent of phase. */
export function breathMultiplier(
  t: number,
  config: LivingFieldConfig,
  phaseOffset = 0,
  amplitudeScale = 1
): number {
  return (
    1 +
    config.breathAmplitude *
      amplitudeScale *
      Math.sin((2 * Math.PI * t) / config.breathPeriodMs + phaseOffset)
  );
}

/** Final opacity for one cell at time t. */
export function cellOpacity(cell: FieldCell, t: number, config: LivingFieldConfig): number {
  const wave = wavePhase01(cell.col, cell.row, t, config);
  const raw = cell.stratum.baseOpacity + cell.stratum.waveAmplitude * wave;
  const breath = breathMultiplier(
    t,
    config,
    cell.affinity?.breathingOffset ?? 0,
    cell.harmony?.amplitudeInfluence ?? 1
  );
  return raw * breath * config.intensity;
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
  /** Sprint 04A, Commit 3A: the current Living Region phase/progress
   *  (living-region-state.ts), or omitted/null when nothing has ever
   *  activated one -- every call site as of this commit. Reduced motion is
   *  conveyed to it via `static` above (the same flag that already means
   *  "prefers-reduced-motion" everywhere else in this file); there is no
   *  separate reducedMotion flag on this interface. */
  livingRegionState?: LivingRegionState | null;
  /** Living Language Stories v0.1: omitted (or `null`) on every page except
   *  the dedicated /living-language/story-test route -- see this file's
   *  header. */
  storyState?: StoryState | null;
}

/**
 * Paint one frame. Cells are drawn grouped by (stratum, scriptId) so
 * ctx.font is set once per group instead of once per cell -- at most
 * strata.length * SCRIPT_IDS.length font changes per frame (currently 9),
 * still a small, bounded number, preserving the original "batch by
 * stratum" performance intent from Sprint 01/02.
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

  // Sprint 04A, Commit 3A: computed ONCE per frame, not once per cell -- the
  // peak multiplier depends only on the verse's stratum and the field's
  // global intensity, neither of which vary cell-to-cell. Harmless and
  // unused when no cell in this layout has `reservedVerse` set (every
  // layout before a later commit wires up a real reservation).
  const livingRegionPeakMultiplier = computeRevealPeakMultiplier(
    resolveVerseStratum(config.strata, LIVING_REGION_CONFIG.typography),
    config.intensity,
    LIVING_REGION_CONFIG.opacity
  );

  // Living Language Stories v0.2/v0.3: identical for every ordinary cell
  // this frame, so computed once here rather than once per cell.
  // Exactly 1 (no dimming) whenever no story is active.
  const ambientDimMultiplier = computeAmbientDimMultiplier(
    options.storyState,
    t,
    options.static === true
  );

  for (const stratum of config.strata) {
    for (const scriptId of SCRIPT_IDS) {
      const weight = getScriptWeight(ACTIVE_CALIBRATION, scriptId);
      const effectiveSize = applyOpticalSize(stratum.fontSize, weight);
      const effectiveWeight = weight.fontWeightOverride ?? config.fontWeight;
      // Text glyphs need ctx.font set before fillText; path glyphs (always
      // Vatteluttu) don't use ctx.font at all, but setting it unconditionally
      // here is harmless and keeps the loop body simple -- it's simply
      // unused on those iterations.
      ctx.font = `${effectiveWeight} ${effectiveSize}px ${family}`;

      for (let cellIndex = 0; cellIndex < layout.cells.length; cellIndex++) {
        const cell = layout.cells[cellIndex];
        if (cell.stratum !== stratum || cell.scriptId !== scriptId) continue;
        // Living Language Stories v0.3: a performing cell is drawn in its
        // OWN dedicated pass below (it needs a per-cell font size the
        // shared stratum-group ctx.font above can't provide, and must draw
        // strictly after every ordinary cell for foreground hierarchy) --
        // skip it here entirely rather than drawing it twice.
        if (options.storyState?.fragmentByCellIndex.has(cellIndex)) continue;

        const baseOp = options.static
          ? cellOpacityStatic(cell, config)
          : cellOpacity(cell, t, config);
        const opticalOp = applyOpticalOpacity(baseOp, weight);
        // Ambient Language Layer bridge: exactly 1 (no change) for the
        // overwhelming majority of cells, which never have an active
        // expression. Reduced-motion frames intentionally skip this --
        // `options.static` never reaches here with a live expression
        // clock, since `t` is fixed at 0 for that frame (see
        // cellOpacityStatic's own "no breath" comment; the same
        // reasoning applies to expression, which is equally a form of
        // per-frame animation).
        const expressionMultiplier = options.static
          ? 1
          : computeExpressionOpacityMultiplier(cell.expression, t);
        // Sprint 04A, Commit 3A: the final semantic influence, per the
        // locked pipeline order (...x Ambient Expression x Living Region ->
        // Final). Unlike expressionMultiplier immediately above, this is
        // NOT forced to 1 on the static frame -- see this file's header and
        // living-region-state.ts's own header for why reduced motion still
        // needs this term to do real work (just without interpolation).
        const livingRegionMultiplier = computeLivingRegionOpacityMultiplier(
          cell.reservedVerse !== undefined,
          options.livingRegionState,
          t,
          LIVING_REGION_CONFIG.timings,
          LIVING_REGION_CONFIG.opacity,
          livingRegionPeakMultiplier,
          options.static === true
        );
        const op = Math.min(
          1,
          opticalOp * expressionMultiplier * livingRegionMultiplier * ambientDimMultiplier
        );

        ctx.fillStyle = `rgba(${cr},${cg},${cb},${op})`;
        if (cell.glyph.kind === "text") {
          ctx.fillText(cell.glyph.value, cell.x, cell.y);
        } else {
          // kind === "path" (Vatteluttu). Optical calibration still applies
          // via `op` (opacity) and `effectiveSize` (path scale) above --
          // just no stroke/outline, per this module's documented rule
          // interpretation.
          ctx.save();
          ctx.translate(cell.x, cell.y);
          drawPathGlyph(ctx, cell.glyph.value, effectiveSize);
          ctx.restore();
        }
      }
    }
  }

  // Living Language Stories v0.3: dedicated performer pass -- drawn strictly
  // AFTER every ordinary cell (foreground hierarchy), each at its own
  // resolved font size (home stratum size x this frame's scale, never the
  // shared stratum-group ctx.font above) and its own resolved glyph text
  // (homeGlyph or storyGlyph, per computeStoryCellRenderState's single
  // instantaneous swap -- never both). A no-op loop (zero iterations)
  // whenever no story is active, since fragmentByCellIndex is then absent/
  // empty.
  if (options.storyState) {
    for (const fragment of options.storyState.fragments) {
      const cell = layout.cells[fragment.cellIndex];
      if (!cell) continue;
      const renderState = computeStoryCellRenderState(
        options.storyState,
        fragment.cellIndex,
        t,
        options.static === true
      );
      if (!renderState) continue;

      const baseOp = options.static
        ? cellOpacityStatic(cell, config)
        : cellOpacity(cell, t, config);
      // cell.scriptId is stored as a plain string (set once by the
      // Civilization Engine); validate against the known ScriptId union
      // rather than an unsafe cast, falling back to the first configured
      // script if a value somehow doesn't match (should never happen in
      // practice -- scriptId is always one of SCRIPT_IDS by construction).
      const scriptId = (SCRIPT_IDS as readonly string[]).includes(cell.scriptId)
        ? (cell.scriptId as (typeof SCRIPT_IDS)[number])
        : SCRIPT_IDS[0];
      const weight = getScriptWeight(ACTIVE_CALIBRATION, scriptId);
      const opticalOp = applyOpticalOpacity(baseOp, weight);
      const op = Math.min(1, opticalOp * renderState.opacityMultiplier);

      const performerFontSizePx = Math.round(fragment.homeStratum.fontSize * renderState.scale);
      ctx.font = `${config.fontWeight} ${performerFontSizePx}px ${family}`;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${op})`;

      const renderX = cell.x + renderState.dx;
      const renderY = cell.y + renderState.dy;
      ctx.fillText(renderState.glyphOverride, renderX, renderY);
    }
  }

  // Living Language Stories v0.3: overlay pass, painted AFTER every ordinary
  // cell AND every performer, so the hero sits visually on top of both.
  // Exactly a no-op (zero draw calls) whenever no story is active --
  // computeStoryOverlay() returns `{ hero: null }` in that case. No more
  // phantom fragments -- every performer is always a real cell, drawn in
  // the dedicated pass above.
  const overlay = computeStoryOverlay(options.storyState, t, options.static === true);
  if (overlay.hero) {
    const hero = overlay.hero;
    ctx.font = `${hero.fontWeight} ${hero.fontSizePx}px ${family}`;
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${Math.min(1, hero.opacity)})`;
    ctx.fillText(hero.text, hero.x, hero.y);
  }
}
