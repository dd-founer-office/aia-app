"use client";

/**
 * LivingField — React binding for the Ambient Letter Field
 * ----------------------------------------------------------------------------
 * Thin client component over LivingFieldEngine (lib/living-field/engine.ts).
 * All behaviour lives in the engine; this component only handles mounting,
 * the kill switch, resize handling, font resolution, and cleanup.
 *
 * Placement contract:
 *  - position: fixed, full viewport, -z-10: the app's background is set on
 *    body/html in globals.css and propagates to the document canvas, which
 *    always paints first — so a negative-z fixed element sits above the mint
 *    background but below ALL normal-flow content (cards, text, nav) without
 *    requiring any wrapper or z-index changes elsewhere.
 *  - pointer-events: none — letters never carry function (Grammar Rule 74:
 *    no letter is ever tappable or navigational).
 *  - aria-hidden — purely atmospheric; invisible to assistive technology.
 *
 * Resize policy: mobile browsers fire resize when the URL bar collapses or
 * expands. Rebuilding the field for those small height deltas would visibly
 * re-scatter the letters mid-scroll, so we only rebuild when the width
 * changes or the height shifts by a significant amount (rotation, split
 * screen, real window resize).
 *
 * Kill switch: renders nothing when LIVING_FIELD_CONFIG.enabled is false
 * (NEXT_PUBLIC_LIVING_FIELD_ENABLED="false"). The application is fully
 * constitutional without the field.
 *
 * Font: resolves the app's --font-tamil-sans variable at mount and again once
 * document.fonts settles, so the field always uses the typography already
 * adopted by the application. No new fonts are introduced in this sprint.
 *
 * Ambient Language Layer bridge: registers this engine instance as "the
 * currently active one" on mount, and clears it on unmount, via
 * engine-registry.ts. This is the ONLY thing that connects this component
 * to the Ambient Language Layer -- it has no other knowledge of that
 * layer's existence.
 */

import { useEffect, useRef } from "react";
import { LIVING_FIELD_CONFIG } from "@/lib/living-field/config";
import { LivingFieldEngine } from "@/lib/living-field/engine";
import { setActiveLivingFieldEngine } from "@/lib/living-field/engine-registry";

/** Height delta (px) below which a resize is treated as browser-chrome
 *  movement and ignored, not a real viewport change. */
const REBUILD_HEIGHT_THRESHOLD = 160;

function resolveAppTamilFont(): string {
  const varValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-tamil-sans")
    .trim();
  return varValue.length > 0
    ? `${varValue}, ${LIVING_FIELD_CONFIG.fontFamilyFallback}`
    : LIVING_FIELD_CONFIG.fontFamilyFallback;
}

export default function LivingField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!LIVING_FIELD_CONFIG.enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new LivingFieldEngine(canvas, {
      fontFamily: resolveAppTamilFont(),
    });
    engine.start();
    setActiveLivingFieldEngine(engine);

    // Repaint with the real web font once loading settles (canvas does not
    // reflow automatically the way DOM text does).
    let fontsCancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          if (!fontsCancelled) engine.setFontFamily(resolveAppTamilFont());
        })
        .catch(() => {
          /* fallback chain already in place */
        });
    }

    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const onResize = (): void => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const widthChanged = w !== lastWidth;
        const heightChanged =
          Math.abs(h - lastHeight) >= REBUILD_HEIGHT_THRESHOLD;
        if (!widthChanged && !heightChanged) return;
        lastWidth = w;
        lastHeight = h;
        engine.rebuild();
      }, LIVING_FIELD_CONFIG.resizeDebounceMs);
    };
    window.addEventListener("resize", onResize);

    return () => {
      fontsCancelled = true;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      setActiveLivingFieldEngine(null);
      engine.destroy();
    };
  }, []);

  if (!LIVING_FIELD_CONFIG.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
