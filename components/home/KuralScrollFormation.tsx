"use client";

/**
 * Kural Scroll Formation
 * ----------------------------------------------------------------------------
 * Replaces LivingRegionZone on Home only. See segment.ts's header for why
 * this is fully isolated from lib/living-field/ (the locked Kernel) rather
 * than reaching into its live glyphs -- founder-approved tradeoff: this
 * spawns its own independent set of KKA_001 letters, styled and animated to
 * be visually indistinguishable from the real field.
 *
 * Revision 2 (founder-directed): renders in normal page flow (a real block
 * right after Shared Acts of Aram, not a viewport-fixed overlay), and the
 * fully-formed state is real, natively-shaped text -- not more hand-placed
 * spans. Hand-placed glyphs can only ever approximate real Tamil text
 * shaping; they crossfade into the genuine article for the final ~15% of
 * convergence, which is also what stays on screen during the hold, and
 * what the crossfade reverses out of during dissolve.
 *
 * Lifecycle (identical shape to revision 1, now driven by this section's
 * own scroll position rather than the whole page's):
 *  1. "scroll"     -- convergence amount is a pure function of how far this
 *                      section has scrolled into view. Default mode.
 *  2. "holding"    -- triggered once convergence reaches the threshold.
 *                      Fully formed (real text visible), time-driven.
 *  3. "dissolving" -- after the hold, animates back to scattered over a
 *                      fixed duration, also time-driven.
 *  4. "settled"    -- fully dissolved, ambient scatter only. Stays here
 *                      until the person scrolls the section back out of
 *                      its "arrived" position and back in.
 * Scrolling the section out of range at ANY point (including mid-hold or
 * mid-dissolve) immediately hands control back to "scroll" mode.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { segmentKuralVerse, type KuralGrapheme } from "@/lib/kural-scroll-formation/segment";
import { KKA_001_RAW, KURAL_SCROLL_FORMATION_CONFIG as CFG } from "@/lib/kural-scroll-formation/config";

interface Point {
  x: number;
  y: number;
}

interface LetterLayout {
  grapheme: KuralGrapheme;
  scatterFrac: Point; // stable 0..1 fractions of the CONTAINER's own box
  scatterPx: Point; // derived from scatterFrac + current container size
  approxFormedPx: Point; // derived from verse layout + current container size
}

type FormationMode = "scroll" | "holding" | "dissolving" | "settled";

const GRAPHEMES = segmentKuralVerse(KKA_001_RAW);
const VERSE_LINES = KKA_001_RAW.split("\n");

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Left-aligned, line-by-line APPROXIMATE layout, relative to the
 *  container's own box. Intentionally not pixel-perfect -- see
 *  approxFormed's config comment for why that's fine. */
function computeApproxFormedPositions(): Point[] {
  const { horizontalMarginPx, topOffsetPx, letterAdvancePx, wordGapPx, lineGapPx } = CFG.approxFormed;
  const rowHeight = CFG.fontSizePx + lineGapPx;

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
    const y = topOffsetPx + g.lineIndex * rowHeight;
    positions.push({ x, y });
    if (g.glyphIndexInWord < g.wordLength - 1) x += letterAdvancePx;
  });

  return positions;
}

/** Ambient shimmer opacity for one glyph at one instant -- duplicated
 *  formula from the real field's diagonal wave + slow breathing. Derives
 *  an approximate col/row from the glyph's own scattered pixel position so
 *  the sweep reads at the same visual cadence as the background. */
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const realTextRef = useRef<HTMLDivElement | null>(null);

  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  );
  const [scatterFractions] = useState<Point[]>(() => {
    const { xMinFrac, xMaxFrac, yMinFrac, yMaxFrac } = CFG.scatter;
    return GRAPHEMES.map(() => ({
      x: xMinFrac + Math.random() * (xMaxFrac - xMinFrac),
      y: yMinFrac + Math.random() * (yMaxFrac - yMinFrac),
    }));
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layout: LetterLayout[] | null = useMemo(() => {
    if (!containerSize) return null;
    const approxFormedPositions = computeApproxFormedPositions();
    return GRAPHEMES.map((grapheme, i) => ({
      grapheme,
      scatterFrac: scatterFractions[i],
      scatterPx: {
        x: scatterFractions[i].x * containerSize.w,
        y: scatterFractions[i].y * containerSize.h,
      },
      approxFormedPx: approxFormedPositions[i],
    }));
  }, [containerSize, scatterFractions]);

  // The formation lifecycle. Deliberately NOT React state -- runs a
  // continuous, throttled RAF loop that writes directly to each letter's
  // style (and the real-text layer's opacity), so neither scrolling nor
  // the hold/dissolve timers ever trigger a re-render.
  useEffect(() => {
    if (!layout || reducedMotion) return;
    const container = containerRef.current;
    const realText = realTextRef.current;
    if (!container || !realText) return;

    const {
      entryViewportFrac,
      exitViewportFrac,
      formationTriggerThreshold,
      retriggerResetThreshold,
      holdMs,
      dissolveMs,
      crossfadeStartT,
      frameIntervalMs,
    } = CFG.lifecycle;

    let mode: FormationMode = "scroll";
    let modeStartTs = 0;
    let hasTriggeredThisApproach = false;
    let lastFrameTs = 0;
    let rafId = 0;

    const computeSectionProgress = (): number => {
      const rect = container.getBoundingClientRect();
      const entryPx = window.innerHeight * entryViewportFrac;
      const exitPx = window.innerHeight * exitViewportFrac;
      if (entryPx === exitPx) return rect.top <= exitPx ? 1 : 0;
      return clamp01((entryPx - rect.top) / (entryPx - exitPx));
    };

    const applyFrame = (nowMs: number): void => {
      const sectionT = computeSectionProgress();

      if (sectionT < retriggerResetThreshold) {
        hasTriggeredThisApproach = false;
        if (mode !== "scroll") mode = "scroll";
      }

      let displayT: number;

      if (mode === "scroll") {
        displayT = CFG.easeConverge(sectionT);
        if (sectionT >= formationTriggerThreshold && !hasTriggeredThisApproach) {
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
        displayT = 0;
      }

      // Animated glyph layer: position + shimmer/formed opacity blend.
      layout.forEach((letter, i) => {
        const el = letterRefs.current[i];
        if (!el) return;
        const dx = (letter.scatterPx.x - letter.approxFormedPx.x) * (1 - displayT);
        const dy = (letter.scatterPx.y - letter.approxFormedPx.y) * (1 - displayT);
        const ambientOpacity = computeAmbientShimmerOpacity(letter.scatterPx, nowMs);
        // As displayT approaches 1, the animated layer additionally fades
        // out (on top of its normal ambient-to-formed opacity blend) so it
        // can crossfade into the real text layer beneath it.
        const crossfadeOut =
          displayT >= crossfadeStartT ? 1 - (displayT - crossfadeStartT) / (1 - crossfadeStartT) : 1;
        const baseOpacity = lerp(ambientOpacity, 0.92, displayT);
        el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
        el.style.opacity = String(clamp01(baseOpacity * crossfadeOut));
      });

      // Real text layer: fades in as the animated layer fades out, over
      // the same crossfade window, then stays fully visible through the
      // hold, and fades back out symmetrically during dissolve.
      const crossfadeIn =
        displayT >= crossfadeStartT ? (displayT - crossfadeStartT) / (1 - crossfadeStartT) : 0;
      realText.style.opacity = String(clamp01(crossfadeIn));
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

  const colorString = `rgb(${CFG.colorRGB[0]}, ${CFG.colorRGB[1]}, ${CFG.colorRGB[2]})`;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: CFG.container.heightPx,
        overflow: "hidden",
      }}
    >
      {/* Animated glyph layer -- decorative, purely visual approach to
          formation. Hidden entirely (not rendered) under reduced motion;
          the real text layer below is always what's actually legible. */}
      {!reducedMotion && layout && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {layout.map((letter, i) => (
            <span
              key={letter.grapheme.order}
              ref={(el) => {
                letterRefs.current[i] = el;
              }}
              style={{
                position: "absolute",
                left: letter.approxFormedPx.x,
                top: letter.approxFormedPx.y,
                transform: `translate3d(${letter.scatterPx.x - letter.approxFormedPx.x}px, ${
                  letter.scatterPx.y - letter.approxFormedPx.y
                }px, 0)`,
                fontSize: CFG.fontSizePx,
                fontWeight: CFG.fontWeight,
                fontFamily: `var(--font-tamil-sans), ${CFG.fontFamilyFallback}`,
                color: colorString,
                opacity: CFG.ambientShimmer.baseOpacity,
                whiteSpace: "pre",
                lineHeight: 1,
                willChange: "transform, opacity",
              }}
            >
              {letter.grapheme.glyph}
            </span>
          ))}
        </div>
      )}

      {/* Real, natively-shaped text layer -- what's actually read. Always
          rendered; opacity-driven so it can crossfade in. Under reduced
          motion this is simply shown at full opacity with no animation. */}
      <div
        ref={realTextRef}
        className="font-tamil-sans"
        style={{
          position: "absolute",
          left: CFG.realText.horizontalMarginPx,
          top: CFG.realText.topOffsetPx,
          right: CFG.realText.horizontalMarginPx,
          fontSize: CFG.realText.fontSizePx,
          fontWeight: CFG.fontWeight,
          lineHeight: CFG.realText.lineHeight,
          color: colorString,
          opacity: reducedMotion ? 1 : 0,
          textAlign: "left",
        }}
      >
        {VERSE_LINES.map((line, i) => (
          <p key={i} style={{ margin: 0 }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
