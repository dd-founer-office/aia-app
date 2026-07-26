/**
 * Living Language Story — Story Controller (v0.2)
 * ----------------------------------------------------------------------------
 * Owns WHEN a story plays, WHAT text it forms, and WHICH cells/positions
 * each grapheme fragment uses. Lives entirely outside lib/living-field/ --
 * never touches a canvas, never reads or writes FieldCell.x/y directly
 * (only via the engine's own read-only accessors), and never imports
 * ambient-expression.ts or anything belonging to the Ambient Language
 * Layer.
 *
 * v0.2 CHANGE OF GRAMMAR (superseding v0.1's pixel-mask silhouette): builds
 * exactly four grapheme fragments via grapheme-source.ts instead of
 * sampling a text mask and pairing hundreds of cells. text-mask.ts and
 * glyph-assignment.ts are intentionally left unimported -- not deleted,
 * per explicit direction, until this new grammar is visually accepted.
 *
 * ---------------------------------------------------------------------------
 * SINGLE ANIMATION CLOCK (unchanged principle from v0.1)
 * ---------------------------------------------------------------------------
 * This controller still does not run a requestAnimationFrame loop of its
 * own. It only calls `engine.setStoryState(...)` a handful of times per
 * story -- once per phase transition -- each scheduled with a plain
 * setTimeout against the same fixed durations story-bridge-types.ts
 * exports. Every frame IN BETWEEN those transitions is painted by the
 * engine's own already-running RAF loop, which asks story-bridge.ts's pure
 * functions where things should be at time `t`.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT-GENERATION SAFETY (unchanged principle from v0.1)
 * ---------------------------------------------------------------------------
 * A story's fragments are only ever valid for the exact layout generation
 * they were built against. engine.rebuild() has already defensively
 * cleared story state on any resize/DPR/viewport change; this controller
 * additionally checks engine.getLayoutGenerationId() before each scheduled
 * transition fires, so a stale timer can never reinstate fragments captured
 * from a layout that no longer exists.
 */

import type { LivingFieldEngine } from "@/lib/living-field/engine";
import {
  STORY_FORM_MS,
  STORY_HOLD_MS,
  STORY_RETURN_MS,
  type StoryFragment,
  type StoryPhase,
  type StoryState,
} from "@/lib/living-field/story-bridge-types";
import { LIVING_FIELD_CONFIG } from "@/lib/living-field/config";
import {
  measureGraphemeTargets,
  segmentGraphemes,
  selectGraphemeSources,
} from "./grapheme-source";

export interface StoryControllerOptions {
  fontFamily: string;
  /** Hero word font weight. Defaults to 700. */
  heroFontWeight?: number;
  /** Hero word font size, px. Defaults to 12% of the canvas's CSS height. */
  heroFontSizePx?: number;
}

export type StoryControllerPhase = StoryPhase | "idle";

/** Representative ambient font size used to size PHANTOM (not-found)
 *  fragments so they blend with real ones -- the "near" stratum's own
 *  fontSize, since it's 100% modern Tamil and the stratum a target
 *  grapheme is most likely to actually be found in. Falls back to the
 *  first configured stratum if "near" isn't present for some reason. */
function representativeFragmentFontSizePx(): number {
  const near = LIVING_FIELD_CONFIG.strata.find((s) => s.id === "near");
  return (near ?? LIVING_FIELD_CONFIG.strata[0])?.fontSize ?? 16;
}

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
   * state immediately. Safe to call from any phase: because FieldCell.x/y
   * were never mutated in the first place, clearing story state is always
   * a complete, exact return to HOME -- there is nothing left to
   * reconcile.
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
    const sources = selectGraphemeSources(cells, graphemes, centerX, centerY);

    const fragments: StoryFragment[] = graphemes.map((grapheme, i) => {
      const source = sources[i];
      if (!source.found) {
        // Per explicit direction: never fabricate an ambient source. Log a
        // dev-only note so this is visible while testing, without being a
        // user-facing error -- the field genuinely might not contain this
        // grapheme at this exact moment (best-effort, same philosophy as
        // the Ambient Language Layer).
        console.info(
          `[living-language-story] grapheme "${grapheme}" not found in current layout -- using fade-in-only fallback, not a fabricated source.`
        );
      }
      return {
        grapheme,
        source,
        targetX: targets[i].x,
        targetY: targets[i].y,
      };
    });

    const fragmentByCellIndex = new Map<number, StoryFragment>();
    for (const fragment of fragments) {
      if (fragment.source.found) {
        fragmentByCellIndex.set(fragment.source.cellIndex, fragment);
      }
    }

    const hero = {
      text,
      centerX,
      centerY,
      fontSizePx: heroFontSizePx,
      fontWeight: heroFontWeight,
    };
    const fragmentFontSizePx = representativeFragmentFontSizePx();

    this.activeGenerationId = generationId;
    this.beginPhase("forming", fragments, fragmentByCellIndex, hero, fragmentFontSizePx, generationId);

    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        this.beginPhase(
          "holding",
          fragments,
          fragmentByCellIndex,
          hero,
          fragmentFontSizePx,
          generationId
        );
      }, STORY_FORM_MS)
    );
    this.timers.push(
      setTimeout(() => {
        if (!this.isStillValid(generationId)) return;
        this.beginPhase(
          "returning",
          fragments,
          fragmentByCellIndex,
          hero,
          fragmentFontSizePx,
          generationId
        );
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
    fragments: readonly StoryFragment[],
    fragmentByCellIndex: ReadonlyMap<number, StoryFragment>,
    hero: StoryState["hero"],
    fragmentFontSizePx: number,
    generationId: number
  ): void {
    this.setPhase(phase);
    this.engine.setStoryState({
      phase,
      phaseStartedAt: performance.now(),
      fragments,
      fragmentByCellIndex,
      hero,
      fragmentFontSizePx,
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
