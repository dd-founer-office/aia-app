"use client";

/**
 * LivingRegionZone
 * ----------------------------------------------------------------------------
 * Sprint 04A (Living Region v1), Commit 3B.2: Activation Infrastructure.
 *
 * Answers exactly one question: "Can interaction occur in the correct
 * place?" It does NOT yet answer "does the Kural actually reveal?" -- no
 * verse is set in this commit (see setLivingRegionVerse's call site,
 * intentionally absent here), so the fixed hit-target below forwards real
 * pointer events into a real, running Reflection Engine state machine, but
 * there is nothing in the layout with `reservedVerse` set for that state to
 * ever visibly affect. Pressing this zone right now genuinely exercises
 * anticipating/revealed/dismissing -- it just has nothing to reveal yet.
 *
 * ---------------------------------------------------------------------------
 * WHY A DEDICATED COMPONENT, NOT INLINE PAGE LOGIC
 * ---------------------------------------------------------------------------
 * This is meant to be the reusable capability the whole reflection vision
 * depends on -- Aathichoodi, Sangam poetry, proverbs, Acts-of-Aram
 * reflections, all through the same mechanism. A future page mounts this
 * exact component (once it also calls setLivingRegionVerse with different
 * content) rather than reimplementing spacer/observer/hit-target wiring.
 *
 * ---------------------------------------------------------------------------
 * WHY THE HIT-TARGET IS document.body PORTAL, POSITION: FIXED
 * ---------------------------------------------------------------------------
 * The Living Field canvas itself is `position: fixed`, mounted directly in
 * <body> (components/field/LivingField.tsx) -- viewport space, not document
 * space (see living-region.ts's Commit 1A header for why that distinction
 * matters). The interaction rectangle has to live in that exact same
 * coordinate system to stay aligned with wherever the reserved verse's
 * cells actually sit. Rendering it in-place inside <main> and relying on
 * plain CSS `position: fixed` would still usually work, but is fragile: any
 * ancestor with a CSS transform, filter, or perspective creates a new
 * containing block that silently breaks `fixed` positioning relative to the
 * viewport. A portal to document.body sidesteps that class of bug entirely,
 * matching how LivingField.tsx itself already avoids the question by
 * mounting at the body level.
 *
 * ---------------------------------------------------------------------------
 * WHY position:fixed AND NOT ANCHORED TO THE SPACER'S OWN SCROLL POSITION
 * ---------------------------------------------------------------------------
 * By design (locked in the viewport-vs-document architectural decision):
 * the reflection always appears in the SAME relative place on screen
 * (LIVING_REGION_CONFIG.viewport's top/width/anchor, as a fraction of the
 * viewport) whenever it's active, regardless of exactly where the spacer
 * happens to sit in the scrolled document. The spacer only answers "is the
 * Living Region section currently near the viewport at all" -- it does NOT
 * determine WHERE the rectangle appears. See living-region.ts's
 * deriveLivingRegionRect() for the actual geometry, shared with the
 * Civilization Engine's own reservation so the two can never drift apart.
 *
 * ---------------------------------------------------------------------------
 * WHAT'S DELIBERATELY NOT HERE YET (later commits)
 * ---------------------------------------------------------------------------
 * - No verse is ever set (setLivingRegionVerse is never called) -- Commit
 *   3B.3.
 * - No tap-outside or scroll-away dismissal wiring -- Commit 3B.4. The
 *   observer here only mounts/unmounts the hit-target; it does not report a
 *   "dismiss" event when the section scrolls out of view, even though that
 *   will eventually be one of the three dismissal paths.
 * - No idle-timeout-driven UI feedback beyond what the engine already does
 *   internally (living-region-state.ts's own idleDismissMs) -- Commit 3B.4.
 * - pointerleave/pointermove-based "moved outside the box while pressed"
 *   handling is intentionally NOT implemented -- pointer capture (below)
 *   means a real touch/mouse cancellation (pointercancel) is the only way
 *   an in-progress press ends early besides pointerup. Revisit in 3B.4 if
 *   real device testing shows this needs refinement.
 */

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import {
  LIVING_REGION_CONFIG,
  deriveLivingRegionRect,
  type LivingRegionRect,
} from "@/lib/living-field/living-region";
import { LIVING_FIELD_CONFIG } from "@/lib/living-field/config";
import { reportLivingRegionEvent } from "@/lib/living-field/living-region-bridge";

/** Invisible spacer height, in px. Generous enough to behave as a sensible
 *  IntersectionObserver target on its own; not tied to the verse's actual
 *  footprint (which varies by viewport -- see living-region.ts) since the
 *  spacer's only job is "is this general area of the page near the
 *  viewport," not exact alignment. */
const SPACER_HEIGHT_PX = 220;

export default function LivingRegionZone() {
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<LivingRegionRect | null>(null);

  // Mount/unmount the hit-target based on whether the invisible spacer is
  // anywhere near the viewport -- deliberately simple (no large rootMargin
  // the way the existing kuralSectionRef recognition-pulse observer uses;
  // that one intentionally fires EARLY, before the section is visible, to
  // prime an ambient effect. This one should reflect "the region is
  // actually here," so a small default threshold is correct instead).
  useEffect(() => {
    const target = spacerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setActive(entry.isIntersecting);
      },
      { threshold: 0.01 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Only computed/kept up to date while active -- no resize listener sits
  // around doing nothing while the section is nowhere near the viewport.
  useEffect(() => {
    if (!active) return;
    const computeRect = (): void => {
      setRect(
        deriveLivingRegionRect(
          window.innerWidth,
          window.innerHeight,
          LIVING_REGION_CONFIG.viewport,
          LIVING_REGION_CONFIG.typography,
          LIVING_FIELD_CONFIG.cellWidth,
          LIVING_FIELD_CONFIG.cellHeight
        )
      );
    };
    computeRect();
    window.addEventListener("resize", computeRect);
    return () => window.removeEventListener("resize", computeRect);
  }, [active]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    // Pointer capture: once pressed, this element keeps receiving
    // pointerup/pointercancel for this pointer even if the physical touch
    // drifts slightly outside the rectangle's bounds mid-press -- avoids a
    // twitchy false "released" on real touch devices.
    e.currentTarget.setPointerCapture(e.pointerId);
    reportLivingRegionEvent("pointerDown");
  };
  const handlePointerUp = (): void => {
    reportLivingRegionEvent("pointerUp");
  };
  const handlePointerCancel = (): void => {
    reportLivingRegionEvent("cancel");
  };

  return (
    <>
      {/* Living Region spacer: purely an observation anchor, zero visual
          footprint (no border, no background, no text). Occupies real
          document height so the observer has something concrete to
          watch -- the height itself is not meaningful beyond that. */}
      <div ref={spacerRef} aria-hidden="true" style={{ height: SPACER_HEIGHT_PX }} />

      {active && rect && typeof document !== "undefined"
        ? createPortal(
            <div
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              aria-hidden="true"
              style={{
                position: "fixed",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                background: "transparent",
                touchAction: "none",
              }}
            />,
            document.body
          )
        : null}
    </>
  );
}
