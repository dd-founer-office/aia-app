"use client";

/**
 * KuralHeroCanvas — MVP
 * ----------------------------------------------------------------------------
 * Renders lib/kural-publishing/publishing-renderer.ts into a fixed
 * 1648x928 backing canvas, displayed responsively via CSS (width: 100%,
 * height: auto) so the preview scales to fit the workspace without ever
 * changing the actual export resolution.
 *
 * Deliberately NOT the Living Field's LivingFieldEngine/requestAnimationFrame
 * loop -- this draws exactly once per (content, generation) change and then
 * stops. No animation, per the brief.
 *
 * Font resolution mirrors components/field/LivingField.tsx's own approach
 * (read --font-tamil-sans / --font-sans from the document, re-render once
 * document.fonts settles) without importing that component -- concept reuse
 * only, as instructed.
 */

import { useEffect, useRef } from "react";
import { renderKuralPublishing } from "@/lib/kural-publishing/publishing-renderer";
import type { KuralPublishingContent } from "@/lib/kural-publishing/kural200-state";

export const CANVAS_WIDTH = 1648;
export const CANVAS_HEIGHT = 928;

const TAMIL_FALLBACK =
  "'Noto Sans Tamil','Nirmala UI','Tamil Sangam MN','Tamil MN',sans-serif";
const SANS_FALLBACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

function resolveFont(cssVarName: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVarName)
    .trim();
  return value.length > 0 ? `${value}, ${fallback}` : fallback;
}

interface KuralHeroCanvasProps {
  content: KuralPublishingContent;
  /** Bump to force a re-render even when content is byte-identical to the
   *  last render (the explicit "Generate / Refresh" button). */
  generation: number;
  /** Optional canonical KKA logo, once available. */
  logoImage?: HTMLImageElement | null;
  /** Fires after every paint with the live canvas element, so the workspace
   *  can wire up PNG export without this component owning download logic. */
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export default function KuralHeroCanvas({
  content,
  generation,
  logoImage,
  onCanvasReady,
}: KuralHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = (): void => {
      renderKuralPublishing(ctx, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        content,
        tamilFont: resolveFont("--font-tamil-sans", TAMIL_FALLBACK),
        sansFont: resolveFont("--font-sans", SANS_FALLBACK),
        logoImage: logoImage ?? null,
      });
      onCanvasReady?.(canvas);
    };

    paint();

    // Canvas text does not reflow when a web font finishes loading the way
    // DOM text does -- repaint once loading settles so the exported PNG
    // never freezes on a fallback-font measurement.
    let cancelled = false;
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready
        .then(() => {
          if (!cancelled) paint();
        })
        .catch(() => {
          /* fallback chain already in place */
        });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, generation, logoImage]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      aria-label="Kural Koorum Aram publication preview"
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--color-border)",
      }}
    />
  );
}
