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
 *
 * Sprint 04A, Commit 3A: renderer.ts (unchanged here) gained the ability to
 * read an optional `livingRegionState` render option and apply the Living
 * Region's opacity term -- but nothing yet supplied one.
 *
 * Sprint 04A, Commit 3B.1: the engine becomes REACHABLE for that state.
 * `reportLivingRegionEvent()` is the one new public method -- the page
 * (a later commit) reports exactly four things (pointerDown, pointerUp,
 * cancel, dismiss); this engine owns everything else (phase, timers,
 * progress), via living-region-state.ts's pure functions:
 *
 *   - Every render call (both the RAF loop's tick and renderStatic()) now
 *     passes `this.livingRegionState` through to renderField(), so the
 *     Living Region opacity term (Commit 3A) actually has something to read.
 *   - The RAF loop (normal motion) calls advanceLivingRegionState() once
 *     per frame, right alongside the render call it already makes -- this
 *     is how time-based transitions (anticipating -> revealed at the hold
 *     threshold, revealed -> dismissing after the idle timeout, dismissing
 *     -> idle once the fade completes) happen under normal motion: the
 *     existing loop already runs every frame, so no separate scheduling
 *     mechanism is needed there.
 *   - Reduced motion has no such loop (`renderStatic()` paints exactly once
 *     per relevant change, not continuously), so time-based transitions
 *     there are driven by real `setTimeout` calls
 *     (`scheduleLivingRegionTimers()`), each one firing `advanceLivingRegionState()`
 *     followed by a single `renderStatic()` repaint, then chaining to
 *     schedule whatever the NEXT phase's own timer should be.
 *
 * Still nothing calls `reportLivingRegionEvent()` or `setReservedVerse()`
 * with a real reservation as of this commit (see components/field/
 * LivingField.tsx, unchanged) -- the engine is reachable, not yet reached.
 * Home page wiring is later commits (3B.2 onward), reviewed separately.
 */

import { LIVING_FIELD_CONFIG, type LivingFieldConfig } from "./config";
import { buildFieldLayout, type FieldLayout } from "./field-layout";
import { applyAffinity } from "./affinity-engine";
import { applyEmergentHarmony } from "./emergent-harmony";
import { applyAmbientExpression } from "./ambient-expression";
import { renderField } from "./renderer";
import type { ReservedVerseInput } from "./living-region";
import { LIVING_REGION_CONFIG } from "./living-region";
import {
  createLivingRegionState,
  dispatchLivingRegionEvent,
  advanceLivingRegionState,
  type LivingRegionState,
  type LivingRegionEvent,
} from "./living-region-state";

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

  /** Sprint 04A, Commit 3B.1: the Reflection Engine's own state -- phase,
   *  timers, and progress, per living-region-state.ts. Idle by construction
   *  until something calls reportLivingRegionEvent(); harmless to always
   *  have one (an idle state has zero rendering effect, per Commit 3A's
   *  computeLivingRegionOpacityMultiplier). */
  private livingRegionState: LivingRegionState = createLivingRegionState(performance.now());

  /** Reduced-motion-only: a pending setTimeout scheduled to advance a
   *  time-based Living Region transition (see scheduleLivingRegionTimers()).
   *  `null` whenever nothing is scheduled -- under normal motion this stays
   *  `null` permanently, since the RAF loop advances state every frame
   *  instead. */
  private livingRegionTimer: ReturnType<typeof setTimeout> | null = null;

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
    // Sprint 04A, Commit 3B.1: switching INTO reduced motion means the RAF
    // loop (which was advancing Living Region state every frame) just
    // stopped, so any in-progress interaction needs a setTimeout to pick up
    // where the loop left off. Switching OUT of reduced motion means the
    // loop is about to resume, so any pending reduced-motion-only timer
    // must be cleared -- scheduleLivingRegionTimers() does both (it always
    // clears first, then only re-schedules if `this.reducedMotion` is now
    // true), so a single call here is correct either direction.
    this.scheduleLivingRegionTimers();
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
   * Sprint 04A, Commit 3B.1. The engine's one point of contact with the
   * Reflection Engine's event-driven transitions. A caller (a later
   * commit's Home page, via living-region-bridge.ts) reports exactly one of
   * the four things that can happen -- "pointerDown" | "pointerUp" |
   * "cancel" | "dismiss" -- and this method:
   *
   *   1. Asks living-region-state.ts's dispatchLivingRegionEvent() what the
   *      resulting state should be (a pure function -- this method owns
   *      calling it, not deciding what it returns).
   *   2. If nothing changed (the event was a no-op for the current phase --
   *      e.g. releasing the press while already "revealed"), does nothing
   *      further -- no repaint, no rescheduling.
   *   3. If something DID change, stores the new state, reschedules any
   *      reduced-motion timer for whatever phase we're now in, and repaints
   *      immediately under reduced motion (there's no RAF loop to pick up
   *      the change on its own next frame the way normal motion does).
   *
   * This method has no concept of pointer coordinates, DOM elements, or
   * which page called it -- exactly the "page reports events, engine owns
   * everything else" split from explicit direction.
   */
  reportLivingRegionEvent(event: LivingRegionEvent): void {
    const now = performance.now();
    const { timings, opacity } = LIVING_REGION_CONFIG;
    const next = dispatchLivingRegionEvent(
      this.livingRegionState,
      event,
      now,
      timings,
      opacity,
      this.reducedMotion
    );
    if (next === this.livingRegionState) return;

    this.livingRegionState = next;
    this.scheduleLivingRegionTimers();
    if (this.reducedMotion) this.renderStatic();
    // Normal motion: nothing else to do here -- the RAF loop's own tick
    // (startLoop(), below) reads this.livingRegionState fresh every frame
    // and will reflect the change on its very next paint.
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
    if (this.livingRegionTimer !== null) {
      clearTimeout(this.livingRegionTimer);
      this.livingRegionTimer = null;
    }
  }

  // -- internals ------------------------------------------------------------

  private startLoop(): void {
    if (this.rafId !== null) return;
    const tick = (t: number): void => {
      this.rafId = requestAnimationFrame(tick);
      if (t - this.lastFrameAt < this.config.frameIntervalMs) return;
      this.lastFrameAt = t;
      // Sprint 04A, Commit 3B.1: normal motion has no separate timer
      // mechanism -- this loop already runs every frame, so it's also
      // where time-based Living Region transitions (hold threshold, idle
      // timeout, dismiss fade completing) happen. Reduced motion's
      // scheduleLivingRegionTimers() is the equivalent for when this loop
      // isn't running at all.
      this.livingRegionState = advanceLivingRegionState(
        this.livingRegionState,
        t,
        LIVING_REGION_CONFIG.timings,
        LIVING_REGION_CONFIG.opacity,
        false
      );
      if (this.layout) {
        renderField(this.ctx, this.layout, t, this.config, {
          fontFamily: this.fontFamily,
          livingRegionState: this.livingRegionState,
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
      livingRegionState: this.livingRegionState,
    });
  }

  /**
   * Reduced-motion-only scheduling for time-based Living Region
   * transitions. Always clears any previously-pending timer first, then --
   * only if `this.reducedMotion` is currently true -- schedules exactly one
   * setTimeout for whatever the CURRENT phase's own next threshold is
   * (the hold threshold while anticipating, the idle timeout while
   * revealed, or immediately for dismissing, since
   * computeLivingRegionProgress() treats dismissal as instantaneous under
   * reduced motion). When that timer fires, it advances state, repaints
   * once, and calls itself again to schedule whatever the NEW phase's own
   * timer should be -- a self-chaining sequence, not a single one-shot.
   *
   * Under normal motion this method still runs (called from
   * reportLivingRegionEvent() and onMotionChange()) but always no-ops after
   * clearing -- the RAF loop's own per-frame advancement is used instead.
   */
  private scheduleLivingRegionTimers(): void {
    if (this.livingRegionTimer !== null) {
      clearTimeout(this.livingRegionTimer);
      this.livingRegionTimer = null;
    }
    if (!this.reducedMotion) return;

    const { timings, opacity } = LIVING_REGION_CONFIG;
    const elapsed = performance.now() - this.livingRegionState.phaseStartedAt;

    let delay: number | null;
    switch (this.livingRegionState.phase) {
      case "anticipating":
        delay = Math.max(0, timings.holdThresholdMs - elapsed);
        break;
      case "revealed":
        delay = Math.max(0, timings.idleDismissMs - elapsed);
        break;
      case "dismissing":
        delay = 0;
        break;
      case "idle":
      default:
        delay = null;
        break;
    }
    if (delay === null) return;

    this.livingRegionTimer = setTimeout(() => {
      this.livingRegionTimer = null;
      const now = performance.now();
      const next = advanceLivingRegionState(
        this.livingRegionState,
        now,
        timings,
        opacity,
        this.reducedMotion
      );
      if (next !== this.livingRegionState) {
        this.livingRegionState = next;
        this.renderStatic();
        this.scheduleLivingRegionTimers();
      }
    }, delay);
  }
}
