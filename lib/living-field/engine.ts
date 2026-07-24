/**
 * Living Field — Engine
 * ----------------------------------------------------------------------------
 * Owns the canvas lifecycle and the animation clock. The engine:
 *
 *  - sizes the canvas for the device pixel ratio (capped, from v0.6)
 *  - builds the field layout for the current viewport
 *  - runs a requestAnimationFrame loop throttled to config.frameIntervalMs —
 *    motion this slow gains nothing from 60 repaints/s; RAF keeps every paint
 *    aligned to the display refresh so the throttle never causes jank
 *  - pauses completely when the document is hidden (zero work in background)
 *  - renders a single static frame under prefers-reduced-motion, and reacts
 *    live if that preference changes
 *
 * Framework-agnostic on purpose: the React component (components/field/
 * LivingField.tsx) is a thin binding over this class, so the engine can be
 * reused, tested, or mounted differently without rewriting behaviour.
 *
 * Sprint 03A (Affinity Engine): `rebuild()` now runs one extra pass,
 * `applyAffinity()`, between layout generation and rendering — matching the
 * spec's Kernel diagram (Field/Civilization Engine → Affinity Engine →
 * Renderer). It runs once per layout build, never per animation frame.
 *
 * Sprint 03C (Emergent Harmony v1.0): `rebuild()` runs one further pass,
 * `applyEmergentHarmony()`, immediately after `applyAffinity()` -- Harmony
 * explicitly consumes Affinity's output, so it must run after it. Also
 * once per layout build, never per animation frame.
 *
 * Ambient Language Layer bridge: `expressWord()` is the one new public
 * method, and the Kernel's ONLY point of contact with that layer. Unlike
 * the five pipeline stages above, it does not run as part of `rebuild()` --
 * it's called on demand, whenever an external semantic request arrives.
 *
 * Sprint 04A (Living Region v1), Commit 2: `setReservedVerse()` is the one
 * new public method, and the Kernel's ONLY new point of contact with the
 * Living Region. Strictly infrastructural, per this commit's scope:
 *
 *   - Stores whatever ReservedVerseInput (or null) it's given, then triggers
 *     a rebuild if the engine is already running -- it does not itself know
 *     or care what a "reserved verse" means beyond passing it through to
 *     buildFieldLayout(), exactly as `this.config` already is.
 *   - `rebuild()` passes `this.reservedVerse ?? undefined` as
 *     buildFieldLayout()'s fourth argument. When nothing has ever called
 *     setReservedVerse() (every current call site -- see
 *     components/field/LivingField.tsx, unchanged in this commit),
 *     `this.reservedVerse` stays `null`, so this is `undefined`, and
 *     buildFieldLayout() behaves exactly as it always has.
 *   - No renderer awareness, no opacity computation, no interaction state.
 *     This engine now understands "some cells may carry semantic meaning" --
 *     it does not yet understand what to DO with that fact. That begins in
 *     Commit 3, entirely in renderer.ts and a later interaction layer, not
 *     here.
 */

import { LIVING_FIELD_CONFIG, type LivingFieldConfig } from "./config";
import { buildFieldLayout, type FieldLayout } from "./field-layout";
import { applyAffinity } from "./affinity-engine";
import { applyEmergentHarmony } from "./emergent-harmony";
import { applyAmbientExpression } from "./ambient-expression";
import { renderField } from "./renderer";
import type { ReservedVerseInput } from "./living-region";

export interface LivingFieldEngineOptions {
  /** Resolved application font family for canvas text. */
  fontFamily?: string;
  config?: LivingFieldConfig;
}

export class LivingFieldEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: LivingFieldConfig;
  private fontFamily: string | undefined;

  private layout: FieldLayout | null = null;
  private rafId: number | null = null;
  private lastFrameAt = 0;
  private reducedMotion = false;
  private running = false;

  /** Sprint 04A, Commit 2: the currently-active Reserved Semantic Cells
   *  request, or `null` when none is set (every call site today). Purely
   *  stored state -- this class has no opinion about what it means, the
   *  same way it has no opinion about what a stratum or a glyph set means.
   *  Only buildFieldLayout() (field-layout.ts) and, from Commit 3 onward,
   *  the renderer/interaction layer actually interpret it. */
  private reservedVerse: ReservedVerseInput | null = null;

  private readonly motionQuery: MediaQueryList | null;
  private readonly onMotionChange = (e: MediaQueryListEvent): void => {
    this.reducedMotion = e.matches;
    if (!this.running) return;
    if (this.reducedMotion) {
      this.stopLoop();
      this.renderStatic();
    } else {
      this.startLoop();
    }
  };

  private readonly onVisibilityChange = (): void => {
    if (!this.running || this.reducedMotion) return;
    if (document.hidden) {
      this.stopLoop();
    } else {
      this.startLoop();
    }
  };

  constructor(canvas: HTMLCanvasElement, options: LivingFieldEngineOptions = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("LivingFieldEngine: 2d context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.config = options.config ?? LIVING_FIELD_CONFIG;
    this.fontFamily = options.fontFamily;

    this.motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    this.reducedMotion = this.motionQuery?.matches ?? false;
  }

  /** Size the canvas, build the layout, and begin rendering. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.rebuild();
    this.motionQuery?.addEventListener("change", this.onMotionChange);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
    if (this.reducedMotion) {
      this.renderStatic();
    } else {
      this.startLoop();
    }
  }

  /** Recompute canvas sizing and layout for the current viewport. */
  rebuild(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.config.maxDPR);

    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Sprint 04A, Commit 2: `this.reservedVerse` is `null` unless something
    // has called setReservedVerse() -- so `?? undefined` here reproduces
    // buildFieldLayout()'s exact prior call signature (three arguments) for
    // every call site that exists today. Bit-identical output when no
    // reservation is set.
    this.layout = buildFieldLayout(w, h, this.config, this.reservedVerse ?? undefined);
    // Sprint 03A: affinity metadata computed once per layout build, never
    // per frame. Mutates layout.cells in place (see affinity-engine.ts).
    applyAffinity(this.layout.cells);
    // Sprint 03C: harmony metadata, consuming what affinity just computed.
    // Also once per layout build, never per frame (see emergent-harmony.ts).
    applyEmergentHarmony(this.layout.cells);

    if (this.running && this.reducedMotion) this.renderStatic();
  }

  /** Update the resolved font (e.g. once web fonts finish loading) and
   *  repaint so glyphs never remain in a fallback face. */
  setFontFamily(fontFamily: string): void {
    this.fontFamily = fontFamily;
    if (this.running && this.reducedMotion) this.renderStatic();
  }

  /**
   * Sprint 04A, Commit 2. Stores (or clears, via `null`) a Reserved Semantic
   * Cells request and rebuilds if the engine is already running, so the new
   * reservation takes effect immediately rather than waiting for the next
   * unrelated resize.
   *
   * Strictly infrastructural, per this commit's scope: this method does not
   * render anything differently, does not compute opacity, and has no
   * concept of interaction, reveal, or dismissal -- it only ever affects
   * WHICH cells buildFieldLayout() reserves, exactly as calling `rebuild()`
   * with a different viewport size only affects WHERE cells land. No caller
   * exists yet (see components/field/LivingField.tsx, unchanged in this
   * commit) -- that wiring, and everything that makes a reservation visible
   * or interactive, is Commit 3's job.
   */
  setReservedVerse(input: ReservedVerseInput | null): void {
    this.reservedVerse = input;
    if (this.running) this.rebuild();
  }

  /**
   * The Ambient Language Layer's ONLY entry point into the Kernel. Accepts
   * a list of graphemes (already segmented by the caller -- this method
   * has no concept of "words" or Tamil script rules, only exact glyph-value
   * matching) and gives every currently-on-screen cell whose glyph matches
   * one of them a temporary, bounded opacity boost (ambient-expression.ts).
   *
   * Does nothing if no layout exists yet (field not yet built) or if the
   * kill switch has this engine never started. Returns the number of cells
   * matched, so a caller can know whether anything will visibly happen --
   * the Kernel makes no promise that a request will produce ANY visible
   * effect, by design (see ambient-expression.ts's "best-effort matching"
   * reasoning).
   */
  expressWord(graphemes: readonly string[]): number {
    if (!this.layout) return 0;
    return applyAmbientExpression(this.layout.cells, graphemes, performance.now());
  }

  /** Stop rendering and release all listeners. Safe to call repeatedly. */
  destroy(): void {
    this.running = false;
    this.stopLoop();
    this.motionQuery?.removeEventListener("change", this.onMotionChange);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }

  // -- internals ------------------------------------------------------------

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (t: number): void => {
      this.rafId = requestAnimationFrame(tick);
      if (t - this.lastFrameAt < this.config.frameIntervalMs) return;
      this.lastFrameAt = t;
      if (this.layout) {
        renderField(this.ctx, this.layout, t, this.config, {
          fontFamily: this.fontFamily,
        });
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private renderStatic(): void {
    if (!this.layout) return;
    renderField(this.ctx, this.layout, 0, this.config, {
      fontFamily: this.fontFamily,
      static: true,
    });
  }
}
