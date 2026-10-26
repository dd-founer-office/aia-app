"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Publishes the hero text block's live height as `--hero-text-h` on the
 * hero root, so the photo can take whatever height is left of the first
 * screen (see ActDetailHero). Renders nothing visible; it must sit
 * directly inside the hero root, which must contain a `[data-hero-text]`.
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
    return () => observer.disconnect();
  }, []);

  return <span ref={markerRef} hidden />;
}
