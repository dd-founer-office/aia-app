"use client";

import { useLayoutEffect, useRef } from "react";

// The hero text fades out over this fraction of the viewport height of
// scrolling, so it is gone by the time the collage panel fills the screen.
const FADE_VIEWPORT_FRACTION = 0.45;

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

    const publish = () => root.style.setProperty("--hero-text-h", `${text.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(text);

    let frame = 0;
    const fade = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * FADE_VIEWPORT_FRACTION)));
      text.style.opacity = String(1 - progress);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(fade);
    };
    fade();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <span ref={markerRef} hidden />;
}
