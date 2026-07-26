/**
 * Living Language Story — Story Controller
 * ----------------------------------------------------------------------------
 * Owns WHEN a story plays, WHAT text it forms, and WHICH cells participate.
 * Lives entirely outside lib/living-field/ -- it never touches a canvas,
 * never reads or writes FieldCell.x/y directly (only via the engine's own
 * read-only accessors), and never imports ambient-expression.ts or anything
 * else belonging to the Ambient Language Layer.
 *
 * ---------------------------------------------------------------------------
 * SINGLE ANIMATION CLOCK
 * ---------------------------------------------------------------------------
 * This controller does NOT run a requestAnimationFrame loop of its own, and
 * never competes with LivingFieldEngine's existing render clock. It only
 * calls `engine.setStoryState(...)` a handful of times per story -- once per
 * phase transition (forming -> holding -> returning -> idle), each scheduled
 * with a plain setTimeout against the same fixed durations the Kernel's
 * story-bridge.ts uses for interpolation (story-bridge-types.ts's exported
 * constants -- one source of truth for both). Every frame IN BETWEEN those
 * transitions is painted by the engine's own already-running RAF loop, which
 * reads whatever StoryState is currently installed and asks
 * computeStoryOffset() where things should be at time `t`. There is
 * therefore exactly one animation clock in this system, the same one that
 * already drives wave/breath/expression/living-region.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT-GENERATION SAFETY
 * ---------------------------------------------------------------------------
 * An assignment is only ever valid for the exact layout generation it was
 * built against. If a resize/DPR/viewport change rebuilds the layout while
 * a story is active, engine.rebuild() has already defensively cleared story
 * state (see engine.ts). This controller additionally checks
 * `engine.getLayoutGenerationId()` before each scheduled transition fires,
 * so a stale timer can never reinstate assignments captured from a layout
 * that no longer exists.
 */

import type { LivingFieldEngine } from "@/lib/living-field/engine";
import {
  STORY_FORM_MS,
  STORY_HOLD_MS,
  STORY_RETURN_MS,
  type StoryAssignment,
  type StoryPhase,
} from "@/lib/living-field/story-bridge-types";
import { sampleTextMask } from "./text-mask";
import { buildStoryAssignments } from "./glyph-assignment";

export interface StoryControllerOptions {
  fontFamily: string;
  fontWeight?: number;
  /** Defaults to 12% of stage height if omitted. */
  fontSizePx?: number;
  /** Mask sampling grid spacing, px. Defaults to 6. */
  sampleSpacingPx?: number;
}

export type StoryControllerPhase = StoryPhase | "idle";

export class StoryController {
  private readonly engine: LivingFieldEngine;
  private readonly options: StoryControllerOptions;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private activeGenerationId: number | null = null;
  private currentPhase: StoryControllerPhase = "idle";
  private onPhaseChange?: (phase: StoryControllerPhase) => void;

  constructor(engine: LivingFieldEngine, options: StoryControllerOptions) {
    this.engine = engine;
    this.options = options;
  }

  get phase(): StoryControllerPhase {
    return this.currentPhase;
  }

  /** Optional UI hook (e.g. the story-test page's own phase label) --
   *  purely informational, never consulted by any timing decision here. */
  setOnPhaseChange(callback: ((phase: StoryControllerPhase) => void) | undefined): void {
    this.onPhaseChange = callback;
  }

  /**
   * Cancels any pending phase timers and returns the field to pure ambient
   * state immediately. Safe to call from any phase, including mid-forming
   * or mid-returning: because FieldCell.x/y were never mutated in the first
   * place, clearing story state is always a complete, exact return to
   * HOME -- there is nothing left to reconcile or restore.
   */
  reset(): void {
    this.clearTimers();
    this.activeGenerationId = null;
    this.setPhase("idle");
    this.engine.setStoryState(null);
  }

  /** Runs one full LIVING FIELD -> word -> LIVING FIELD cycle. */
  playTextFormation(text: string): void {
    this.reset();

    const cells = this.engine.getLayoutCells();
    if (!cells || cells.length === 0) return;

    const stageSize = this.engine.getCanvasCssSize();
    if (!stageSize) return;

    const generationId = this.engine.getLayoutGenerationId();

    const maskPoints = sampleTextMask(text, stageSize.width, stageSize.height, {
      fontFamily: this.options.fontFamily,
      fontWeight: this.options.fontWeight,
      fontSizePx: this.options.fontSizePx ?? Math.round(stageSize.height * 0.12),
      sampleSpacingPx: this.options.sampleSpacingPx ?? 6,
    });
    if (maskPoints.length === 0) return;

    const assignments = buildStoryAssignments(cells, maskPoints);
    if (assignments.length === 0) return;

    const assignmentMap = new Map<number, StoryAssignment>(
      assignments.map((assignment) => [assignment.cellIndex, assignment])
    );

    this.activeGenerationId = generationId;
    this.beginPhase("forming", assignmentMap, generationId);

    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        this.beginPhase("holding", assignmentMap, generationId);
      }, STORY_FORM_MS)
    );
    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        this.beginPhase("returning", assignmentMap, generationId);
      }, STORY_FORM_MS + STORY_HOLD_MS)
    );
    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        this.reset();
      }, STORY_FORM_MS + STORY_HOLD_MS + STORY_RETURN_MS)
    );
  }

  /** Call on unmount. */
  destroy(): void {
    this.reset();
  }

  // -- internals --------------------------------------------------------

  private isStillValid(generationId: number): boolean {
    return (
      this.activeGenerationId === generationId &&
      this.engine.getLayoutGenerationId() === generationId
    );
  }

  private beginPhase(
    phase: StoryPhase,
    assignments: ReadonlyMap<number, StoryAssignment>,
    generationId: number
  ): void {
    this.setPhase(phase);
    this.engine.setStoryState({
      phase,
      phaseStartedAt: performance.now(),
      assignments,
      layoutGenerationId: generationId,
    });
  }

  private setPhase(phase: StoryControllerPhase): void {
    this.currentPhase = phase;
    this.onPhaseChange?.(phase);
  }

  private clearTimers(): void {
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
  }
}
