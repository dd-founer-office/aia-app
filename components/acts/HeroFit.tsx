"use client";

import { useLayoutEffect, useRef } from "react";

// The hero text fades out over this fraction of the viewport height of
// scrolling, so it is gone by the time the collage panel fills the screen.
const FADE_VIEWPORT_FRACTION = 0.45;
// The collage panel (see ActDetailHero) the pager carries the page to, and
// how long a carry blocks further gestures (a smooth scroll of one screen).
const PANEL_ID = "act-snapshot";
const PAGING_LOCK_MS = 1100;

/**
 * Publishes the hero text block's live height as `--hero-text-h` on the
 * hero root, so the photo can take whatever height is left of the first
 * screen (see ActDetailHero), and fades the text block out as the visitor
 * scrolls (button press or by hand -- both just scroll the page) and back
 * in when they return. Renders nothing visible; it must sit directly
 * inside the hero root, which must contain a `[data-hero-text]`.
 */
export function HeroFit() {
  const markerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = markerRef.current?.parentElement;
    const text = root?.querySelector<HTMLElement>("[data-hero-text]");
    if (!root || !text) return;

    const publish = () =>
      root.style.setProperty("--hero-text-h", `${text.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(text);

    let frame = 0;
    const fade = () => {
      frame = 0;
      const progress = Math.min(
        1,
        Math.max(
          0,
          window.scrollY / (window.innerHeight * FADE_VIEWPORT_FRACTION),
        ),
      );
      text.style.opacity = String(1 - progress);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(fade);
    };
    fade();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Two-screen paging between the hero screen and the collage screen: the
    // first scroll gesture down from the hero carries the page all the way
    // to the full-screen collage (exactly what the CTA does), and a scroll
    // up from the collage carries it back to the hero. Gestures arriving
    // while a carry is in flight are swallowed, so it can't be fought.
    // Everything below the collage scrolls freely.
    let pagingUntil = 0;
    function pageTo(top: number, event: Event) {
      if (event.cancelable) event.preventDefault();
      pagingUntil = performance.now() + PAGING_LOCK_MS;
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
    function onIntent(direction: "down" | "up", event: Event) {
      const panel = document.getElementById(PANEL_ID);
      if (!panel) return;
      // The collage -> testimonial sequence owns scrolling while it runs.
      if (document.documentElement.dataset.aiaLock) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (performance.now() < pagingUntil) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      const panelTop = panel.getBoundingClientRect().top + window.scrollY;
      const y = window.scrollY;
      if (direction === "down" && y < panelTop - 2) pageTo(panelTop, event);
      else if (direction === "up" && y > 2 && y <= panelTop + 2)
        pageTo(0, event);
    }
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY !== 0) onIntent(event.deltaY > 0 ? "down" : "up", event);
    };
    let touchStartY = 0;
    const onTouchStart = (event: TouchEvent) => {
      touchStartY = event.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const delta = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
      if (Math.abs(delta) > 6) onIntent(delta > 0 ? "down" : "up", event);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
