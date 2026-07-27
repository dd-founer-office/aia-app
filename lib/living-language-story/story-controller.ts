/**
 * Living Language Story — Story Controller (v0.3)
 * ----------------------------------------------------------------------------
 * Owns WHEN a story plays, WHICH cells become performers, and WHAT temporary
 * semantic identity each one takes on. Lives entirely outside
 * lib/living-field/ -- never touches a canvas, never reads or writes
 * FieldCell.x/y/glyph directly (only via the engine's own read-only
 * accessors), and never imports ambient-expression.ts or anything belonging
 * to the Ambient Language Layer.
 *
 * v0.3 CHANGE OF GRAMMAR (superseding v0.2's grapheme-matching approach):
 * builds four performers via performer-selection.ts (pure choreography --
 * ANY cell is eligible) instead of grapheme-source.ts's selectGraphemeSources
 * (which searched for cells whose EXISTING glyph happened to match a target
 * grapheme, and empirically came up empty for 3 of 4 graphemes on a typical
 * mobile layout). grapheme-source.ts is intentionally left untouched and
 * unimported here, per explicit direction, until this new grammar is
 * visually accepted -- it still exists for reference/comparison.
 *
 * ---------------------------------------------------------------------------
 * SIX-PHASE SCHEDULE
 * ---------------------------------------------------------------------------
 * FIELD -> awakening -> approaching -> formingHero -> holding -> releasing
 * -> returning -> FIELD. Exactly one setTimeout per phase transition,
 * scheduled against the SAME StoryTimingConfig durations story-bridge.ts
 * uses for interpolation -- one source of truth. Every frame IN BETWEEN
 * those transitions is painted by the engine's own already-running RAF
 * loop, which asks story-bridge.ts's pure functions where things should be
 * at time `t`. This controller runs no animation loop of its own.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT-GENERATION SAFETY (unchanged principle from earlier versions)
 * ---------------------------------------------------------------------------
 * A story's performers are only ever valid for the exact layout generation
 * they were selected against. engine.rebuild() has already defensively
 * cleared story state on any resize/DPR/viewport change; this controller
 * additionally checks engine.getLayoutGenerationId() before each scheduled
 * transition fires, so a stale timer can never reinstate performers
 * captured from a layout that no longer exists.
 */

import type { LivingFieldEngine } from "@/lib/living-field/engine";
import {
  DEFAULT_STORY_TIMING,
  DEFAULT_AMBIENT_DIM_FACTOR,
  type StoryFragment,
  type StoryPhase,
  type StoryState,
  type StoryTimingConfig,
} from "@/lib/living-field/story-bridge-types";
import type { FieldStratum } from "@/lib/living-field/config";
import { measureGraphemeTargets, segmentGraphemes } from "./grapheme-source";
import { selectPerformerHomes, assignPerformersToTargets } from "./performer-selection";

export interface StoryControllerOptions {
  fontFamily: string;
  /** Hero word font weight. Defaults to 700. Held constant throughout the
   *  whole story -- font weight is NOT interpolated in this v0.1 proof, per
   *  explicit direction. */
  heroFontWeight?: number;
  /** Hero word font size, px. Defaults to 12% of the canvas's CSS height. */
  heroFontSizePx?: number;
}

export interface PlayTextFormationOptions {
  /** Overrides for any subset of the six phase durations -- the dev-only
   *  tuning sliders (story-test page) pass whatever the user has adjusted
   *  at the moment Play is pressed; anything omitted falls back to
   *  DEFAULT_STORY_TIMING. Resolved fresh per call (not fixed at
   *  construction), so sliders can be adjusted between plays without
   *  needing to reconstruct the controller. */
  timing?: Partial<StoryTimingConfig>;
  /** Ambient dim factor override -- see DEFAULT_AMBIENT_DIM_FACTOR's doc
   *  comment in story-bridge-types.ts. Resolved fresh per call, same
   *  reasoning as `timing` above. */
  ambientDimFactor?: number;
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
   * state immediately. Safe to call from any phase: because FieldCell.x/y/
   * glyph were never mutated in the first place, clearing story state is
   * always a complete, exact return to HOME -- there is nothing left to
   * reconcile.
   */
  reset(): void {
    this.clearTimers();
    this.activeGenerationId = null;
    this.setPhase("idle");
    this.engine.setStoryState(null);
  }

  /** Runs one full LIVING FIELD -> word -> LIVING FIELD cycle. */
  playTextFormation(text: string, callOptions: PlayTextFormationOptions = {}): void {
    this.reset();

    const timing: StoryTimingConfig = { ...DEFAULT_STORY_TIMING, ...callOptions.timing };
    const ambientDimFactor = callOptions.ambientDimFactor ?? DEFAULT_AMBIENT_DIM_FACTOR;

    const cells = this.engine.getLayoutCells();
    if (!cells || cells.length === 0) return;

    const stageSize = this.engine.getCanvasCssSize();
    if (!stageSize) return;

    const generationId = this.engine.getLayoutGenerationId();
    const centerX = stageSize.width / 2;
    const centerY = stageSize.height / 2;
    const heroFontWeight = this.options.heroFontWeight ?? 700;
    const heroFontSizePx = this.options.heroFontSizePx ?? Math.round(stageSize.height * 0.12);

    const graphemes = segmentGraphemes(text);
    const targets = measureGraphemeTargets(
      text,
      graphemes,
      this.options.fontFamily,
      heroFontWeight,
      heroFontSizePx,
      centerX,
      centerY
    );

    // --- Performer selection: pure choreography, no grapheme matching. ---
    // Only TEXT-kind cells are eligible: the performer render pass always
    // draws via ctx.fillText with a string glyphOverride (homeGlyph or
    // storyGlyph), and a path-kind (Vatteluttu) cell's glyph.value is a
    // GlyphPath, not a string -- there is no meaningful "homeGlyph" to
    // capture for one. Without this filter, a selected Vatteluttu cell
    // would silently fall back to using the STORY GRAPHEME as its own
    // "homeGlyph" (nothing else representable), making the awaken-time
    // swap a no-op and quietly recreating the original failure: the
    // performer would show its target identity from before awakening even
    // begins, never anything meaningfully "swapped." Vatteluttu is a small
    // weighted fraction of the field, so excluding it from eligibility
    // still leaves plenty of real text-glyph candidates on any real layout.
    const candidates = cells
      .map((cell, cellIndex) => ({ cell, cellIndex }))
      .filter(({ cell }) => cell.glyph.kind === "text")
      .map(({ cell, cellIndex }) => ({
        cellIndex,
        x: cell.x,
        y: cell.y,
        isShallowestStratum: isShallowest(cell.stratum),
      }));
    const homes = selectPerformerHomes(candidates, centerX, centerY, stageSize.width, stageSize.height, graphemes.length);
    if (homes.length < graphemes.length) {
      // Fewer eligible cells than performers needed -- should not happen on
      // any real layout (dozens of candidates typically exist), but fail
      // visibly rather than silently proceeding with a partial cast.
      console.warn(
        `[living-language-story] only found ${homes.length} eligible performer cells for ${graphemes.length} required -- aborting this playTextFormation() call.`
      );
      return;
    }

    // --- Assignment: which performer (by HOME) plays which grapheme, ----
    // --- minimizing path crossings while preserving left-to-right order. ---
    const assignedHomes = assignPerformersToTargets(homes, targets);

    const fragments: StoryFragment[] = graphemes.map((grapheme, i) => {
      const home = assignedHomes[i];
      const cell = cells[home.cellIndex];
      return {
        cellIndex: home.cellIndex,
        homeX: home.x,
        homeY: home.y,
        // Read-only snapshot, captured once, right now -- never written
        // back to the cell. This is the cell's genuine ambient identity at
        // the moment it was cast as a performer.
        homeGlyph: cell.glyph.kind === "text" ? cell.glyph.value : grapheme,
        homeStratum: cell.stratum,
        grapheme,
        targetX: targets[i].x,
        targetY: targets[i].y,
      };
    });

    const fragmentByCellIndex = new Map<number, StoryFragment>();
    for (const fragment of fragments) {
      fragmentByCellIndex.set(fragment.cellIndex, fragment);
    }

    const hero = { text, centerX, centerY, fontSizePx: heroFontSizePx, fontWeight: heroFontWeight };

    this.activeGenerationId = generationId;
    const formingStartedAt = performance.now();
    this.beginPhase("awakening", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, 0, generationId);

    let elapsed = timing.awakeningMs;
    this.scheduleTransition(elapsed, generationId, () => {
      this.beginPhase("approaching", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, 0, generationId);
    });

    elapsed += timing.approachingMs;
    this.scheduleTransition(elapsed, generationId, () => {
      this.beginPhase("formingHero", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, 0, generationId);
    });

    elapsed += timing.formingHeroMs;
    this.scheduleTransition(elapsed, generationId, () => {
      this.beginPhase("holding", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, 0, generationId);
    });

    elapsed += timing.holdingMs;
    // Captured once, when "releasing" actually begins, and reused
    // unchanged for "returning" below -- NOT independently reconstructed
    // when returning's own timer fires. Two separately-scheduled
    // setTimeouts drift slightly from their nominal delays; recomputing
    // this value a second time would silently disagree with the value
    // used during releasing, causing exactly the kind of discontinuity at
    // the releasing/returning boundary that formingStartedAt's single
    // capture (above) is designed to avoid on the forming side.
    let returningStartedAt = 0;
    this.scheduleTransition(elapsed, generationId, () => {
      returningStartedAt = performance.now();
      this.beginPhase("releasing", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, returningStartedAt, generationId);
    });

    elapsed += timing.releasingMs;
    this.scheduleTransition(elapsed, generationId, () => {
      this.beginPhase("returning", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, returningStartedAt, generationId);
    });

    elapsed += timing.returningMs;
    this.scheduleTransition(elapsed, generationId, () => {
      this.reset();
    });
  }

  /** Call on unmount. */
  destroy(): void {
    this.reset();
  }

  // -- internals --------------------------------------------------------

  private scheduleTransition(delayMs: number, generationId: number, run: () => void): void {
    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        run();
      }, delayMs)
    );
  }

  private isStillValid(generationId: number): boolean {
    return (
      this.activeGenerationId === generationId &&
      this.engine.getLayoutGenerationId() === generationId
    );
  }

  private beginPhase(
    phase: StoryPhase,
    fragments: readonly StoryFragment[],
    fragmentByCellIndex: ReadonlyMap<number, StoryFragment>,
    hero: StoryState["hero"],
    timing: StoryTimingConfig,
    ambientDimFactor: number,
    formingStartedAt: number,
    returningStartedAt: number,
    generationId: number
  ): void {
    this.setPhase(phase);
    this.engine.setStoryState({
      phase,
      phaseStartedAt: performance.now(),
      formingStartedAt,
      returningStartedAt,
      fragments,
      fragmentByCellIndex,
      hero,
      timing,
      ambientDimFactor,
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

function isShallowest(stratum: FieldStratum): boolean {
  return stratum.id === "near";
}
