"use client";

/**
 * Kural Scroll Formation
 * ----------------------------------------------------------------------------
 * Replaces LivingRegionZone on Home only. See segment.ts's header for why
 * this is fully isolated from lib/living-field/ (the locked Kernel) rather
 * than reaching into its live glyphs -- founder-approved tradeoff: this
 * spawns its own independent set of KKA_001 letters, styled and animated to
 * be visually indistinguishable from the real field (see config.ts's
 * "duplicated snapshot" note), rather than amending the Kernel's "no engine
 * moves a glyph" rule (Sprint 03C).
 *
 * Lifecycle:
 *  1. "scroll"     -- convergence amount is a pure function of scroll
 *                      position (0 at top, 1 at page bottom). Default mode.
 *  2. "holding"    -- triggered once scroll reaches the formation threshold.
 *                      Fully formed, time-driven, independent of further
 *                      scroll position.
 *  3. "dissolving" -- after the hold, animates back to scattered over a
 *                      fixed duration, also time-driven.
 *  4. "settled"    -- fully dissolved, ambient scatter only. Stays here
 *                      (does NOT immediately re-form even though scroll is
 *                      still at the bottom) until the person scrolls back
 *                      up past the re-arm threshold.
 * Scrolling up out of the trigger zone at ANY point (including mid-hold or
 * mid-dissolve) immediately hands control back to "scroll" mode -- scrolling
 * away always regains manual control, never leaves the animation "stuck".
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { segmentKuralVerse, type KuralGrapheme } from "@/lib/kural-scroll-formation/segment";
import { KKA_001_RAW, KURAL_SCROLL_FORMATION_CONFIG as CFG } from "@/lib/kural-scroll-formation/config";

interface Point {
  x: number;
  y: number;
}

interface LetterLayout {
  grapheme: KuralGrapheme;
  scatterFrac: Point; // stable 0..1 fractions, drawn once per mount
  scatterPx: Point; // derived from scatterFrac + current viewport size
  formedPx: Point; // derived from verse layout + current viewport size
}

type FormationMode = "scroll" | "holding" | "dissolving" | "settled";

const GRAPHEMES = segmentKuralVerse(KKA_001_RAW);

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Left-aligned, line-by-line layout anchored near the bottom of the
 *  viewport -- same word/letter spacing algorithm the old Living Region
 *  used for its reserved verse, reimplemented standalone here (see
 *  segment.ts's header for why this doesn't import from living-region.ts). */
function computeFormedPositions(viewportWidth: number, viewportHeight: number): Point[] {
  const { horizontalMarginPx, bottomOffsetPx, letterAdvancePx, wordGapPx, lineGapPx } = CFG.formed;
  const lineCount = new Set(GRAPHEMES.map((g) => g.lineIndex)).size;
  const rowHeight = CFG.fontSizePx + lineGapPx;
  const baseY = viewportHeight - bottomOffsetPx;

  const positions: Point[] = [];
  let currentLine = -1;
  let currentWord = -1;
  let x = horizontalMarginPx;

  GRAPHEMES.forEach((g) => {
    if (g.lineIndex !== currentLine) {
      currentLine = g.lineIndex;
      currentWord = -1;
      x = horizontalMarginPx;
    }
    if (g.wordIndex !== currentWord) {
      if (currentWord !== -1) x += wordGapPx;
      currentWord = g.wordIndex;
    }
    const y = baseY - (lineCount - 1 - g.lineIndex) * rowHeight;
    positions.push({ x, y });
    if (g.glyphIndexInWord < g.wordLength - 1) x += letterAdvancePx;
  });

  return positions;
}

/** Ambient shimmer opacity for one glyph at one instant -- duplicated
 *  formula from the real field's diagonal wave + slow breathing (see
 *  config.ts's ambientShimmer block for why these values are copied, not
 *  imported). Derives an approximate col/row from the glyph's own scattered
 *  pixel position so the sweep reads at the same visual cadence as the
 *  background. */
function computeAmbientShimmerOpacity(scatterPx: Point, nowMs: number): number {
  const s = CFG.ambientShimmer;
  const col = scatterPx.x / s.cellWidth;
  const row = scatterPx.y / s.cellHeight;
  const wavePhase = col * s.wavePhaseCol + row * s.wavePhaseRow - nowMs * s.waveSpeed;
  const wave = s.baseOpacity + s.waveAmplitude * (0.5 + 0.5 * Math.sin(wavePhase));
  const breath = 1 + s.breathAmplitude * Math.sin((2 * Math.PI * (nowMs % s.breathPeriodMs)) / s.breathPeriodMs);
  return clamp01(wave * breath * s.intensity);
}

export default function KuralScrollFormation() {
  const [viewport, setViewport] = useState<{ w: number; h: number } | null>(null);
  // Lazy initializer -- runs exactly once, at mount, which is the sanctioned
  // exception to "render must be pure": it's explicitly documented as the
  // one-time-init escape hatch, unlike calling Math.random() in the render
  // body itself (which is what this replaces).
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );
  // Stable scattered fractions -- same lazy-initializer reasoning: drawn
  // exactly once per mount, never re-rolled on resize (only their pixel
  // projection changes). Plain state rather than a ref, so useMemo below
  // can read it during render without tripping the "no ref reads during
  // render" rule.
  const [scatterFractions] = useState<Point[]>(() => {
    const { xMinFrac, xMaxFrac, yMinFrac, yMaxFrac } = CFG.scatter;
    return GRAPHEMES.map(() => ({
      x: xMinFrac + Math.random() * (xMaxFrac - xMinFrac),
      y: yMinFrac + Math.random() * (yMaxFrac - yMinFrac),
    }));
  });
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const computeViewport = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    computeViewport();
    window.addEventListener("resize", computeViewport);
    return () => window.removeEventListener("resize", computeViewport);
  }, []);

  const layout: LetterLayout[] | null = useMemo(() => {
    if (!viewport) return null;
    const formedPositions = computeFormedPositions(viewport.w, viewport.h);
    return GRAPHEMES.map((grapheme, i) => ({
      grapheme,
      scatterFrac: scatterFractions[i],
      scatterPx: {
        x: scatterFractions[i].x * viewport.w,
        y: scatterFractions[i].y * viewport.h,
      },
      formedPx: formedPositions[i],
    }));
  }, [viewport, scatterFractions]);

  // The formation lifecycle. Deliberately NOT React state -- runs a
  // continuous, throttled RAF loop that writes directly to each letter's
  // style, so neither scrolling nor the hold/dissolve timers ever trigger a
  // re-render (same performance discipline the Living Field engine's own
  // loop follows).
  useEffect(() => {
    if (!layout || reducedMotion) return;

    const { formationTriggerThreshold, retriggerResetThreshold, holdMs, dissolveMs, frameIntervalMs } =
      CFG.lifecycle;

    let mode: FormationMode = "scroll";
    let modeStartTs = 0;
    let hasTriggeredThisApproach = false;
    let lastFrameTs = 0;
    let rafId = 0;

    const applyFrame = (nowMs: number): void => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const rawScrollT = scrollable > 0 ? window.scrollY / scrollable : 1;
      const scrollT = clamp01(rawScrollT);

      // Scrolling away from the trigger zone always regains manual control,
      // interrupting an in-progress hold or dissolve if one is running.
      if (scrollT < retriggerResetThreshold) {
        hasTriggeredThisApproach = false;
        if (mode !== "scroll") mode = "scroll";
      }

      let displayT: number;

      if (mode === "scroll") {
        displayT = CFG.easeConverge(scrollT);
        if (scrollT >= formationTriggerThreshold && !hasTriggeredThisApproach) {
          hasTriggeredThisApproach = true;
          mode = "holding";
          modeStartTs = nowMs;
          displayT = 1;
        }
      } else if (mode === "holding") {
        displayT = 1;
        if (nowMs - modeStartTs >= holdMs) {
          mode = "dissolving";
          modeStartTs = nowMs;
        }
      } else if (mode === "dissolving") {
        const p = clamp01((nowMs - modeStartTs) / dissolveMs);
        displayT = 1 - CFG.easeDissolve(p);
        if (p >= 1) mode = "settled";
      } else {
        // settled -- fully ambient, independent of scroll, until re-armed
        displayT = 0;
      }

      layout.forEach((letter, i) => {
        const el = letterRefs.current[i];
        if (!el) return;
        const dx = (letter.scatterPx.x - letter.formedPx.x) * (1 - displayT);
        const dy = (letter.scatterPx.y - letter.formedPx.y) * (1 - displayT);
        const ambientOpacity = computeAmbientShimmerOpacity(letter.scatterPx, nowMs);
        const opacity = lerp(ambientOpacity, CFG.formed.opacity, displayT);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        el.style.opacity = String(opacity);
      });
    };

    const loop = (nowMs: number): void => {
      if (nowMs - lastFrameTs >= frameIntervalMs) {
        lastFrameTs = nowMs;
        applyFrame(nowMs);
      }
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [layout, reducedMotion]);

  if (!layout || typeof document === "undefined") return null;

  const colorString = `rgb(${CFG.colorRGB[0]}, ${CFG.colorRGB[1]}, ${CFG.colorRGB[2]})`;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: -5, // above the ambient field canvas (z:-10), below card content
        overflow: "hidden",
      }}
    >
      {layout.map((letter, i) => {
        const pos = reducedMotion ? letter.formedPx : letter.scatterPx;
        const initialDx = pos.x - letter.formedPx.x;
        const initialDy = pos.y - letter.formedPx.y;
        return (
          <span
            key={letter.grapheme.order}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            style={{
              position: "absolute",
              left: letter.formedPx.x,
              top: letter.formedPx.y,
              transform: `translate3d(${initialDx}px, ${initialDy}px, 0)`,
              fontSize: CFG.fontSizePx,
              fontWeight: CFG.fontWeight,
              fontFamily: `var(--font-tamil-sans), ${CFG.fontFamilyFallback}`,
              color: colorString,
              opacity: reducedMotion ? CFG.formed.opacity : CFG.ambientShimmer.baseOpacity,
              whiteSpace: "pre",
              lineHeight: 1,
              willChange: "transform, opacity",
            }}
          >
            {letter.grapheme.glyph}
          </span>
        );
      })}
    </div>,
    document.body
  );
}
