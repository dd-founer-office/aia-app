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
 */

import { LIVING_FIELD_CONFIG, type LivingFieldConfig } from "./config";
import { buildFieldLayout, type FieldLayout } from "./field-layout";
import { applyAffinity } from "./affinity-engine";
import { applyEmergentHarmony } from "./emergent-harmony";
import { renderField } from "./renderer";

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

    this.layout = buildFieldLayout(w, h, this.config);
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
