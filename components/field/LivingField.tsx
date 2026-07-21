"use client";

/**
 * LivingField — React binding for the Ambient Letter Field
 * ----------------------------------------------------------------------------
 * Thin client component over LivingFieldEngine (lib/living-field/engine.ts).
 * All behaviour lives in the engine; this component only handles mounting,
 * the kill switch, resize debouncing, font resolution, and cleanup.
 *
 * Placement contract:
 *  - position: fixed, full viewport, behind all content (z-index 0; content
 *    is expected to stack above it — cards, sheets, and nav paint their own
 *    backgrounds and correctly cover the field; the field lives only in the
 *    page's breathing room).
 *  - pointer-events: none — letters never carry function (Grammar Rule 74:
 *    no letter is ever tappable or navigational).
 *  - aria-hidden — purely atmospheric; invisible to assistive technology.
 *
 * Kill switch: renders nothing when LIVING_FIELD_CONFIG.enabled is false
 * (NEXT_PUBLIC_LIVING_FIELD_ENABLED="false"). The application is fully
 * constitutional without the field.
 *
 * Font: resolves the app's --font-tamil-sans variable at mount and again once
 * document.fonts settles, so the field always uses the typography already
 * adopted by the application. No new fonts are introduced in this sprint.
 */

import { useEffect, useRef } from "react";
import { LIVING_FIELD_CONFIG } from "@/lib/living-field/config";
import { LivingFieldEngine } from "@/lib/living-field/engine";

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

    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    const onResize = (): void => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(
        () => engine.rebuild(),
        LIVING_FIELD_CONFIG.resizeDebounceMs
      );
    };
    window.addEventListener("resize", onResize);

    return () => {
      fontsCancelled = true;
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      engine.destroy();
    };
  }, []);

  if (!LIVING_FIELD_CONFIG.enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
