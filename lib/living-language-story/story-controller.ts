/**
 * Living Language Story — Story Controller (v0.4)
 * ----------------------------------------------------------------------------
 * Owns WHEN a story plays, WHICH cells become performers, and WHAT temporary
 * semantic identity each one takes on. Lives entirely outside
 * lib/living-field/ -- never touches a canvas, never reads or writes
 * FieldCell.x/y/glyph directly (only via the engine's own read-only
 * accessors).
 *
 * ---------------------------------------------------------------------------
 * v0.4: THREE EPISODES, NOT A GENERALIZED TIMELINE ENGINE
 * ---------------------------------------------------------------------------
 * This proof tests whether the Living Field can demonstrate a Tamil
 * grammatical relationship (மெய் + உயிர் -> உயிர்மெய், concretely
 * வ் + ஆ -> வா) and then let that SAME resulting performer continue into
 * the already-validated WORD PERFORMANCE (வா + ழ் + த் + து -> வாழ்த்து).
 *
 * Per explicit direction, this is built as THREE coordinated episodes, each
 * one reusing the SAME six-phase engine (awakening -> approaching ->
 * formingHero -> holding -> releasing -> returning) already validated for
 * the single-word proof -- NOT a new generalized per-fragment beat-list /
 * timeline system. The only genuinely new piece of state is
 * `StoryFragment.pinnedAtFullPresence` (story-bridge-types.ts /
 * story-bridge.ts), which lets ONE continuing performer skip re-ramping in
 * from ambient when it re-enters a later episode.
 *
 *   EPISODE A -- COMBINE: வ் + ஆ -> வா. Two performers, awaken/approach/
 *   form/hold, centred on MICRO STAGE. Stops at "holding" -- deliberately
 *   never runs releasing/returning here; the resulting performer instead
 *   continues directly into Episode B.
 *
 *   EPISODE B -- ASSEMBLE: வா + ழ் + த் + து -> வாழ்த்து. The exact same
 *   WORD PERFORMANCE mechanism as the single-episode v0.3 proof, fed FOUR
 *   fragments: the continuing வா carrier (pinnedAtFullPresence: true, its
 *   "home" for this episode is MICRO STAGE, not its true original cell) plus
 *   three freshly selected performers. Full six phases, centred on WORD
 *   STAGE.
 *
 *   EPISODE C -- DECOMBINE: வா -> வ் + ஆ. Reuses the EXACT SAME two
 *   StoryFragment objects Episode A built (same homes, same targets, same
 *   graphemes) -- but instead of starting a fresh six-phase run, jumps
 *   directly into "releasing" (returningStartedAt = now). Because it's
 *   the identical fragment definition, the state machine's own release/
 *   return math naturally sends வ்/ஆ back to their true original homes.
 *
 * These are linguistically DIFFERENT operations sharing one rendering
 * mechanism -- see story-bridge-types.ts's StoryHeroGeometry doc comment.
 * COMBINE represents a grammatical relationship; ASSEMBLE represents
 * learned grapheme units participating in a word. Keep that distinction in
 * naming here, even where the underlying calls are identical.
 *
 * ---------------------------------------------------------------------------
 * SELECTION ORDER (corrected -- avoids a circular dependency)
 * ---------------------------------------------------------------------------
 *   1. Select வ்/ஆ homes against WORD STAGE geometry (existing
 *      selectPerformerHomes(), unchanged scoring).
 *   2. Derive MICRO STAGE from those two homes (performer-selection.ts's
 *      deriveMicroStage()) -- never the other way around.
 *   3. Select ழ்/த்/து homes against WORD STAGE, excluding the two cells
 *      already reserved for வ்/ஆ.
 * All five cellIndices are captured once, up front, and threaded through
 * every episode -- never re-selected mid-sequence.
 *
 * ---------------------------------------------------------------------------
 * LAYOUT-GENERATION SAFETY (unchanged principle from earlier versions)
 * ---------------------------------------------------------------------------
 * engine.rebuild() has already defensively cleared story state on any
 * resize/DPR/viewport change; this controller additionally checks
 * engine.getLayoutGenerationId() before every one of the (now many more)
 * scheduled transitions fires, across all three episodes.
 */

import type { LivingFieldEngine } from "@/lib/living-field/engine";
import {
  DEFAULT_STORY_TIMING,
  DEFAULT_COMBINE_TIMING,
  DEFAULT_AMBIENT_DIM_FACTOR,
  type StoryFragment,
  type StoryPhase,
  type StoryState,
  type StoryTimingConfig,
} from "@/lib/living-field/story-bridge-types";
import type { FieldStratum } from "@/lib/living-field/config";
import { measureGraphemeTargets, segmentGraphemes } from "./grapheme-source";
import { selectPerformerHomes, assignPerformersToTargets, deriveMicroStage } from "./performer-selection";

export interface StoryControllerOptions {
  fontFamily: string;
  /** Hero word font weight. Defaults to 700. Held constant throughout the
   *  whole story -- font weight is NOT interpolated in this v0.1 proof, per
   *  explicit direction. */
  heroFontWeight?: number;
  /** Hero word font size, px. Defaults to 12% of the canvas's CSS height.
   *  Also used as COMBINE's own result-glyph font size (see this file's
   *  header for why: identical size at both ends of the Episode A -> B
   *  handoff is what makes the continuing performer's transition
   *  seamless). */
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

export interface PlayCombineAssembleOptions extends PlayTextFormationOptions {
  /** Overrides for Episode A (COMBINE) and Episode C (DECOMBINE)'s shared
   *  timing -- see DEFAULT_COMBINE_TIMING's doc comment for why one config
   *  covers both. `timing` (inherited above) covers Episode B (ASSEMBLE)
   *  only, exactly as it already does for the single-episode proof. */
  combineTiming?: Partial<StoryTimingConfig>;
}

export type StoryControllerPhase = StoryPhase | "idle";

/** Small offset (px) each COMBINE input performer stops short of MICRO
 *  STAGE's exact centre, along its own home->microStage line -- keeps
 *  வ்/ஆ visibly approaching from two distinct sides rather than
 *  overlapping exactly on the same point before the handoff. */
const COMBINE_APPROACH_GAP_PX = 18;

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
   * state immediately. Safe to call from any phase, in any episode: because
   * FieldCell.x/y/glyph were never mutated in the first place, clearing
   * story state is always a complete, exact return to HOME -- there is
   * nothing left to reconcile, regardless of whether Reset happens during
   * COMBINE, ASSEMBLE, or DECOMBINE.
   */
  reset(): void {
    this.clearTimers();
    this.activeGenerationId = null;
    this.setPhase("idle");
    this.engine.setStoryState(null);
  }

  /** Runs one full LIVING FIELD -> word -> LIVING FIELD cycle, with no
   *  COMBINE/DECOMBINE episodes -- the original v0.3 single-episode proof.
   *  Kept for reference/comparison and any future word that doesn't need a
   *  grammatical-relationship prelude. */
  playTextFormation(text: string, callOptions: PlayTextFormationOptions = {}): void {
    this.reset();

    const timing: StoryTimingConfig = { ...DEFAULT_STORY_TIMING, ...callOptions.timing };
    const ambientDimFactor = callOptions.ambientDimFactor ?? DEFAULT_AMBIENT_DIM_FACTOR;

    const setup = this.prepareStage();
    if (!setup) return;
    const { cells, stageSize, generationId, wordStageX, wordStageY, heroFontWeight, heroFontSizePx, candidates } = setup;

    const graphemes = segmentGraphemes(text);
    const targets = measureGraphemeTargets(
      text, graphemes, this.options.fontFamily, heroFontWeight, heroFontSizePx, wordStageX, wordStageY
    );

    const homes = selectPerformerHomes(candidates, wordStageX, wordStageY, stageSize.width, stageSize.height, graphemes.length);
    if (homes.length < graphemes.length) {
      console.warn(
        `[living-language-story] only found ${homes.length} eligible performer cells for ${graphemes.length} required -- aborting.`
      );
      return;
    }
    const assignedHomes = assignPerformersToTargets(homes, targets);
    const fragments = this.buildFragments(cells, assignedHomes, graphemes, targets);
    const fragmentByCellIndex = mapByCellIndex(fragments);
    const hero = { text, centerX: wordStageX, centerY: wordStageY, fontSizePx: heroFontSizePx, fontWeight: heroFontWeight };

    this.activeGenerationId = generationId;
    const formingStartedAt = performance.now();
    let elapsed = 0;
    elapsed = this.scheduleSixPhaseSequence(
      fragments, fragmentByCellIndex, hero, timing, ambientDimFactor,
      formingStartedAt, generationId, elapsed, /* endsInReset */ true
    );
  }

  /**
   * Runs the full COMBINE -> ASSEMBLE -> DECOMBINE proof:
   *
   *   consonantGrapheme + vowelGrapheme -> combinedGrapheme
   *   combinedGrapheme + remainingGraphemes -> fullWordText
   *   fullWordText -> combinedGrapheme + remainingGraphemes
   *   combinedGrapheme -> consonantGrapheme + vowelGrapheme
   *
   * `combinedGrapheme` is supplied explicitly by the caller (e.g. "வா"),
   * never derived by concatenating consonantGrapheme + vowelGrapheme --
   * that concatenation would not, in general, produce correct Tamil
   * orthography (a vowel sign is not the standalone vowel's string
   * substringed out). This controller has no Tamil-grammar knowledge at
   * all; it only ever renders exactly the strings it's given.
   */
  playCombineAssemble(
    consonantGrapheme: string,
    vowelGrapheme: string,
    combinedGrapheme: string,
    remainingGraphemes: readonly string[],
    fullWordText: string,
    callOptions: PlayCombineAssembleOptions = {}
  ): void {
    this.reset();

    const combineTiming: StoryTimingConfig = { ...DEFAULT_COMBINE_TIMING, ...callOptions.combineTiming };
    const assembleTiming: StoryTimingConfig = { ...DEFAULT_STORY_TIMING, ...callOptions.timing };
    const ambientDimFactor = callOptions.ambientDimFactor ?? DEFAULT_AMBIENT_DIM_FACTOR;

    const setup = this.prepareStage();
    if (!setup) return;
    const { cells, stageSize, generationId, wordStageX, wordStageY, heroFontWeight, heroFontSizePx, candidates } = setup;

    // --- STEP 1: select வ்/ஆ homes against WORD STAGE (not micro stage --
    // avoids the circular dependency an earlier draft had). ---
    const combineHomes = selectPerformerHomes(candidates, wordStageX, wordStageY, stageSize.width, stageSize.height, 2);
    if (combineHomes.length < 2) {
      console.warn("[living-language-story] could not find 2 eligible performer cells for COMBINE -- aborting.");
      return;
    }
    // Deterministic convention: the FIRST-selected (higher-scoring) home
    // becomes the consonant/carrier, per explicit direction that "it is
    // acceptable for the existing வ் performer cellIndex to become the
    // carrier" -- this is an implementation detail, not a linguistic claim.
    const [homeConsonant, homeVowel] = combineHomes;

    // --- STEP 2: derive MICRO STAGE from those two homes. ---
    const microStage = deriveMicroStage(homeConsonant, homeVowel, wordStageX, wordStageY, stageSize.width, stageSize.height);

    // --- STEP 3: select ழ்/த்/து homes against WORD STAGE, excluding the
    // two already reserved for வ்/ஆ. ---
    const usedIndices = new Set([homeConsonant.cellIndex, homeVowel.cellIndex]);
    const wordHomes = selectPerformerHomes(
      candidates, wordStageX, wordStageY, stageSize.width, stageSize.height, remainingGraphemes.length, usedIndices
    );
    if (wordHomes.length < remainingGraphemes.length) {
      console.warn(
        `[living-language-story] only found ${wordHomes.length} eligible performer cells for the remaining ${remainingGraphemes.length} -- aborting.`
      );
      return;
    }

    // Each COMBINE input approaches MICRO STAGE from its own side, stopping
    // just short of the exact centre -- a visible "meeting," never an exact
    // overlap before the handoff.
    const consonantTarget = approachTargetNear(homeConsonant, microStage, COMBINE_APPROACH_GAP_PX);
    const vowelTarget = approachTargetNear(homeVowel, microStage, COMBINE_APPROACH_GAP_PX);

    const consonantFragment = this.buildFragment(cells, homeConsonant, consonantGrapheme, consonantTarget);
    const vowelFragment = this.buildFragment(cells, homeVowel, vowelGrapheme, vowelTarget);
    const combineFragments = [consonantFragment, vowelFragment];
    const combineFragmentByCellIndex = mapByCellIndex(combineFragments);
    // Same font size as the word-stage hero, deliberately -- see this
    // file's header for why identical size at both ends of the handoff is
    // what makes Episode A -> B feel like one continuous performer rather
    // than two different ones.
    const combineHero = {
      text: combinedGrapheme, centerX: microStage.x, centerY: microStage.y,
      fontSizePx: heroFontSizePx, fontWeight: heroFontWeight,
    };

    this.activeGenerationId = generationId;
    const combineFormingStartedAt = performance.now();

    // --- EPISODE A -- COMBINE: awaken -> approach -> form -> hold. -------
    // Deliberately stops here (no releasing/returning scheduled yet) -- the
    // resulting performer continues directly into Episode B rather than
    // dissolving back to ambient.
    let elapsed = this.scheduleFourRisingPhases(
      combineFragments, combineFragmentByCellIndex, combineHero, combineTiming, ambientDimFactor,
      combineFormingStartedAt, generationId, 0
    );

    // --- Handoff into EPISODE B -- ASSEMBLE. ------------------------------
    this.scheduleTransition(elapsed, generationId, () => {
      // The continuing carrier: same cellIndex as the consonant performer,
      // but a NEW StoryFragment for this episode -- its "home" for travel
      // purposes is deliberately MICRO STAGE (where Episode A left it
      // visually), not its true original field cell, and
      // pinnedAtFullPresence means it never re-ramps in from ambient.
      const carrierFragment: StoryFragment = {
        cellIndex: homeConsonant.cellIndex,
        homeX: microStage.x,
        homeY: microStage.y,
        homeGlyph: combinedGrapheme,
        homeStratum: consonantFragment.homeStratum,
        grapheme: combinedGrapheme,
        targetX: 0, // set below, once the full target list is known
        targetY: 0,
        pinnedAtFullPresence: true,
      };

      const fullGraphemes = [combinedGrapheme, ...remainingGraphemes];
      const targets = measureGraphemeTargets(
        fullWordText, fullGraphemes, this.options.fontFamily, heroFontWeight, heroFontSizePx, wordStageX, wordStageY
      );
      // The carrier is fixed to targets[0] (combinedGrapheme is always the
      // first grapheme of fullWordText) -- only the remaining three homes
      // are permuted (via the EXISTING, unmodified crossing-minimization
      // assignment) against targets[1..].
      carrierFragment.targetX = targets[0].x;
      carrierFragment.targetY = targets[0].y;

      const remainingAssigned = assignPerformersToTargets(wordHomes, targets.slice(1));
      const remainingFragments = this.buildFragments(cells, remainingAssigned, remainingGraphemes, targets.slice(1));

      const assembleFragments = [carrierFragment, ...remainingFragments];
      const assembleFragmentByCellIndex = mapByCellIndex(assembleFragments);
      const assembleHero = {
        text: fullWordText, centerX: wordStageX, centerY: wordStageY,
        fontSizePx: heroFontSizePx, fontWeight: heroFontWeight,
      };

      const assembleFormingStartedAt = performance.now();
      const assembleElapsed = this.scheduleSixPhaseSequence(
        assembleFragments, assembleFragmentByCellIndex, assembleHero, assembleTiming, ambientDimFactor,
        assembleFormingStartedAt, generationId, 0, /* endsInReset */ false
      );

      // --- EPISODE C -- DECOMBINE: reuse Episode A's EXACT fragment -----
      // definitions, jumping straight into "releasing" -- the state
      // machine's own release/return math then naturally sends வ்/ஆ back
      // to their TRUE original homes (consonantFragment/vowelFragment's
      // own homeX/homeY, untouched since Episode A).
      this.scheduleTransition(assembleElapsed, generationId, () => {
        const decombineReturningStartedAt = performance.now();
        this.beginPhase(
          "releasing", combineFragments, combineFragmentByCellIndex, combineHero,
          combineTiming, ambientDimFactor, combineFormingStartedAt, decombineReturningStartedAt, generationId
        );

        this.scheduleTransition(combineTiming.releasingMs, generationId, () => {
          this.beginPhase(
            "returning", combineFragments, combineFragmentByCellIndex, combineHero,
            combineTiming, ambientDimFactor, combineFormingStartedAt, decombineReturningStartedAt, generationId
          );
        });

        this.scheduleTransition(combineTiming.releasingMs + combineTiming.returningMs, generationId, () => {
          this.reset();
        });
      });
    });
  }

  /** Call on unmount. */
  destroy(): void {
    this.reset();
  }

  // -- internals: shared setup -------------------------------------------

  private prepareStage(): {
    cells: NonNullable<ReturnType<LivingFieldEngine["getLayoutCells"]>>;
    stageSize: NonNullable<ReturnType<LivingFieldEngine["getCanvasCssSize"]>>;
    generationId: number;
    wordStageX: number;
    wordStageY: number;
    heroFontWeight: number;
    heroFontSizePx: number;
    candidates: Array<{ cellIndex: number; x: number; y: number; isShallowestStratum: boolean }>;
  } | null {
    const cells = this.engine.getLayoutCells();
    if (!cells || cells.length === 0) return null;
    const stageSize = this.engine.getCanvasCssSize();
    if (!stageSize) return null;

    const generationId = this.engine.getLayoutGenerationId();
    const wordStageX = stageSize.width / 2;
    const wordStageY = stageSize.height / 2;
    const heroFontWeight = this.options.heroFontWeight ?? 700;
    const heroFontSizePx = this.options.heroFontSizePx ?? Math.round(stageSize.height * 0.12);

    // Only TEXT-kind cells are eligible: the performer render pass always
    // draws via ctx.fillText with a string glyphOverride, and a path-kind
    // (Vatteluttu) cell's glyph.value is a GlyphPath, not a string -- see
    // v0.3's own note on why this filter exists.
    const candidates = cells
      .map((cell, cellIndex) => ({ cell, cellIndex }))
      .filter(({ cell }) => cell.glyph.kind === "text")
      .map(({ cell, cellIndex }) => ({
        cellIndex, x: cell.x, y: cell.y, isShallowestStratum: isShallowest(cell.stratum),
      }));

    return { cells, stageSize, generationId, wordStageX, wordStageY, heroFontWeight, heroFontSizePx, candidates };
  }

  private buildFragment(
    cells: NonNullable<ReturnType<LivingFieldEngine["getLayoutCells"]>>,
    home: { cellIndex: number; x: number; y: number },
    grapheme: string,
    target: { x: number; y: number }
  ): StoryFragment {
    const cell = cells[home.cellIndex];
    return {
      cellIndex: home.cellIndex,
      homeX: home.x,
      homeY: home.y,
      homeGlyph: cell.glyph.kind === "text" ? cell.glyph.value : grapheme,
      homeStratum: cell.stratum,
      grapheme,
      targetX: target.x,
      targetY: target.y,
    };
  }

  private buildFragments(
    cells: NonNullable<ReturnType<LivingFieldEngine["getLayoutCells"]>>,
    homes: readonly { cellIndex: number; x: number; y: number }[],
    graphemes: readonly string[],
    targets: readonly { x: number; y: number }[]
  ): StoryFragment[] {
    return graphemes.map((grapheme, i) => this.buildFragment(cells, homes[i], grapheme, targets[i]));
  }

  /** Schedules awakening -> approaching -> formingHero -> holding only
   *  (Episode A's shape) -- deliberately does NOT schedule releasing/
   *  returning. Returns the cumulative elapsed time (starting from
   *  `startElapsedMs`) after "holding" begins, so a caller can schedule
   *  what happens next relative to it. */
  private scheduleFourRisingPhases(
    fragments: readonly StoryFragment[],
    fragmentByCellIndex: ReadonlyMap<number, StoryFragment>,
    hero: StoryState["hero"],
    timing: StoryTimingConfig,
    ambientDimFactor: number,
    formingStartedAt: number,
    generationId: number,
    startElapsedMs: number
  ): number {
    this.beginPhase("awakening", fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, 0, generationId);

    let elapsed = startElapsedMs + timing.awakeningMs;
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
    return elapsed;
  }

  /** Schedules the full six phases -- awakening through returning.
   *  Returns the cumulative elapsed time after "returning" begins. If
   *  `endsInReset` is true, also schedules a final reset() once returning
   *  completes (used by the single-episode playTextFormation(); the
   *  COMBINE/ASSEMBLE/DECOMBINE sequence instead schedules Episode C to
   *  begin at that point, and only Episode C's own completion resets). */
  private scheduleSixPhaseSequence(
    fragments: readonly StoryFragment[],
    fragmentByCellIndex: ReadonlyMap<number, StoryFragment>,
    hero: StoryState["hero"],
    timing: StoryTimingConfig,
    ambientDimFactor: number,
    formingStartedAt: number,
    generationId: number,
    startElapsedMs: number,
    endsInReset: boolean
  ): number {
    let elapsed = this.scheduleFourRisingPhases(
      fragments, fragmentByCellIndex, hero, timing, ambientDimFactor, formingStartedAt, generationId, startElapsedMs
    );

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
    if (endsInReset) {
      this.scheduleTransition(elapsed, generationId, () => {
        this.reset();
      });
    }
    return elapsed;
  }

  // -- internals: primitives ----------------------------------------------

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

function mapByCellIndex(fragments: readonly StoryFragment[]): Map<number, StoryFragment> {
  const map = new Map<number, StoryFragment>();
  for (const fragment of fragments) map.set(fragment.cellIndex, fragment);
  return map;
}

/** A point `gapPx` short of `target`, along the straight line from `home`
 *  to `target` -- used so a COMBINE input performer visibly approaches
 *  MICRO STAGE from its own side rather than landing exactly on the same
 *  point as the other input. */
function approachTargetNear(
  home: { x: number; y: number },
  target: { x: number; y: number },
  gapPx: number
): { x: number; y: number } {
  const dx = target.x - home.x;
  const dy = target.y - home.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist <= gapPx) return { x: home.x, y: home.y };
  const t = 1 - gapPx / dist;
  return { x: home.x + dx * t, y: home.y + dy * t };
}
