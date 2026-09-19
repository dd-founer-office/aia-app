/**
 * Distant Devotion — Asset Generator: Purananuru Reel Motion Preview Hook
 * ----------------------------------------------------------------------------
 * Phase 9B. Drives purananuru-reel-motion-preview-renderer.ts's
 * renderReelMotionPreviewFrame with a single requestAnimationFrame loop --
 * kept out of PublishingWorkspace.tsx (already a very large component) the
 * same way components/acts/living-trace/useHorizontalSwipe.ts keeps its own
 * gesture logic out of its host component.
 *
 * Performance discipline (Part 17): the animation loop itself never calls
 * React state setters -- it draws directly onto the canvas ref and updates
 * the progress-bar fill via a plain DOM style write on a ref, both of which
 * bypass React's render cycle entirely. React state (`isPlaying`, `isDone`)
 * only changes twice per playback: once when Play starts, once when it
 * finishes -- never once per frame. Exactly one rAF handle exists at a time:
 * play() cancels any previous loop before starting a new one, replay() does
 * the same, and the unmount cleanup cancels it too.
 *
 * IDENTITY NOTE: `storyboard` is built fresh (buildComposedReelStoryboard)
 * in PublishingWorkspace.tsx's own render body every render, so it is a NEW
 * OBJECT every render even for the same poem, so it must never be compared
 * by reference or listed as a dependency directly. This hook instead
 * derives a stable primitive key (`storyboard?.poemNumber`) for every
 * dependency array and render-phase comparison, and reads the latest
 * storyboard value through a ref inside the actual drawing/timing
 * callbacks, so those callbacks stay referentially stable across renders
 * that don't represent an actual poem switch.
 *
 * CANVAS-MOUNT NOTE: the <canvas> this hook draws into is conditionally
 * rendered by its caller (only once the Reel Storyboard format is active),
 * so it can attach to the DOM strictly AFTER a poem switch already fired
 * this hook's "paint the initial state" effect once (with the ref still
 * null, a harmless no-op). Nothing else would ever repaint it if the ref
 * were a plain object ref -- so `canvasRef` returned by this hook is a
 * CALLBACK ref instead: the moment the canvas node actually attaches (or
 * re-attaches), it repaints immediately, independent of whether
 * storyboardKey happened to change at the same time.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComposedReelStoryboard } from "@/lib/kural-publishing/purananuru/reel-storyboard-content";
import {
  renderReelMotionPreviewFrame,
  getMotionPhase,
  MOTION_PACING_MS,
} from "@/lib/kural-publishing/purananuru-reel-motion-preview-renderer";

/** Fixed preview canvas resolution -- the SAME 1080x1920 coordinate system
 *  the static Reel Storyboard exports at (Part 12: "the underlying
 *  coordinate system must remain 1080x1920... do not create a second
 *  aspect ratio"). Displayed scaled down via ordinary CSS width/height on
 *  the <canvas> element, drawn at full native resolution. */
export const REEL_MOTION_PREVIEW_WIDTH = 1080;
export const REEL_MOTION_PREVIEW_HEIGHT = 1920;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export interface UseReelMotionPreviewResult {
  canvasRef: React.RefCallback<HTMLCanvasElement>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  isPlaying: boolean;
  isDone: boolean;
  play: () => void;
  replay: () => void;
}

/** `storyboard` may be null (no Reel content authored yet for this poem, or
 *  a different content type is active) -- the hook simply becomes inert;
 *  Play/Replay are no-ops and the canvas stays whatever it last painted. */
export function useReelMotionPreview(
  storyboard: ComposedReelStoryboard | null,
  tamilFont: string,
  sansFont: string
): UseReelMotionPreviewResult {
  const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // See this file's own header "IDENTITY NOTE" -- poemNumber is the one
  // stable primitive that actually identifies "which poem", independent of
  // buildComposedReelStoryboard's per-render object identity.
  const storyboardKey = storyboard?.poemNumber ?? null;

  // Synced via an effect (never written during render itself -- React
  // treats render as required to be pure) so callbacks below always read
  // the CURRENT storyboard without needing it in their own dependency
  // arrays. Deliberately no dependency array: this should run after every
  // render, exactly mirroring whatever `storyboard` currently is.
  const storyboardRef = useRef(storyboard);
  useEffect(() => {
    storyboardRef.current = storyboard;
  });

  const cancelLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startRef.current = null;
  }, []);

  // Stable across renders (identity only changes if the fonts themselves
  // change) -- reads the latest storyboard via the ref above rather than
  // closing over the `storyboard` parameter, so a fresh
  // buildComposedReelStoryboard() object on an otherwise-identical render
  // never forces this callback (or anything depending on it) to be
  // recreated.
  const drawAt = useCallback(
    (progress: number) => {
      const canvas = canvasNodeRef.current;
      const sb = storyboardRef.current;
      if (!canvas || !sb) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderReelMotionPreviewFrame(ctx, {
        width: canvas.width,
        height: canvas.height,
        storyboard: sb,
        tamilFont,
        sansFont,
        motionState: { progress, phase: getMotionPhase(progress) },
        reducedMotionMode: sb.motionDirection.reducedMotion.mode,
      });
      if (progressBarRef.current) {
        // Imperative DOM write, not React state -- see this file's own
        // header on why the animation loop never triggers a re-render.
        progressBarRef.current.style.width = `${Math.round(progress * 100)}%`;
      }
    },
    [tamilFont, sansFont]
  );

  // Paints the exact Frame 2 state -- shared by both triggers that need
  // it (a genuine poem/font change, and the canvas DOM node attaching for
  // the first time / re-attaching -- see this file's own "CANVAS-MOUNT
  // NOTE"). Waits for document.fonts.ready first, exactly like
  // renderPurananuruReelFrameForExport's own export path does: without
  // this, a paint that lands before the Tamil webfont has finished
  // loading renders with a fallback font and nothing else would ever
  // trigger a repaint once fonts become ready.
  const paintInitialState = useCallback(() => {
    cancelLoop();
    let cancelled = false;
    const run = async () => {
      if (typeof document !== "undefined" && "fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          /* fallback chain already in place, same as the export path */
        }
      }
      if (!cancelled) drawAt(0);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [cancelLoop, drawAt]);

  const play = useCallback(() => {
    const sb = storyboardRef.current;
    if (!sb) return;
    cancelLoop();
    setIsDone(false);

    const totalMs = MOTION_PACING_MS[sb.motionDirection.timing.durationIntent];
    // Part 10: prefers-reduced-motion (or an "instant" pacing intent, which
    // is 0ms by construction) skips the animated loop entirely and jumps
    // straight to Frame 5's exact resolved state -- never leaving the
    // scene half-transitioned (Part 16's own reduced-motion QA rule).
    if (totalMs <= 0 || prefersReducedMotion()) {
      drawAt(1);
      setIsPlaying(false);
      setIsDone(true);
      return;
    }

    setIsPlaying(true);
    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(1, elapsed / totalMs);
      drawAt(progress);
      if (progress >= 1) {
        rafRef.current = null;
        startRef.current = null;
        setIsPlaying(false);
        setIsDone(true);
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, [cancelLoop, drawAt]);

  const replay = useCallback(() => {
    cancelLoop();
    drawAt(0);
    play();
  }, [cancelLoop, drawAt, play]);

  // Reset play state when the poem actually changes -- "adjusting state
  // when a prop changes", called during render rather than inside an
  // effect, the same prevContentTypeId/prevTemplate pattern
  // PublishingWorkspace.tsx's own content-type-switch resets already use.
  // Compares storyboardKey (a stable primitive), never the storyboard
  // object itself -- see this file's own "IDENTITY NOTE".
  const [renderedStoryboardKey, setRenderedStoryboardKey] = useState(storyboardKey);
  if (storyboardKey !== renderedStoryboardKey) {
    setRenderedStoryboardKey(storyboardKey);
    setIsPlaying(false);
    setIsDone(false);
  }

  // Repaint whenever the poem or fonts actually change AND the canvas is
  // already mounted. This alone would miss the case in this file's own
  // "CANVAS-MOUNT NOTE" (canvas attaching later than the key change) --
  // that case is covered by the callback ref below instead.
  useEffect(() => {
    const cancelPaint = paintInitialState();
    return () => {
      cancelPaint();
      cancelLoop();
    };
  }, [storyboardKey, paintInitialState, cancelLoop]);

  // The callback ref: fires on every attach (mount) and detach (unmount)
  // of the actual canvas DOM node. On attach, paints immediately -- this
  // is what guarantees Frame 2 is showing the first moment the canvas
  // becomes visible, even when it mounts after the poem was already
  // selected (switching from Carousel format to Reel Storyboard format,
  // for instance, changes no storyboardKey at all).
  const canvasRef = useCallback<React.RefCallback<HTMLCanvasElement>>(
    (node) => {
      canvasNodeRef.current = node;
      if (node) paintInitialState();
    },
    [paintInitialState]
  );

  return { canvasRef, progressBarRef, isPlaying, isDone, play, replay };
}
