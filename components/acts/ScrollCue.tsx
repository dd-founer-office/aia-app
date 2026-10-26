"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const TEAL = "#0A363A";
const MINT = "#68FFAD";
// Scrolling past this many px counts as "the visitor got the hint".
const DISMISS_SCROLL_PX = 24;

/**
 * Floating "scroll down" cue for the hero's first screen: a mint circle
 * pinned to the bottom-center of the viewport that gently bobs, scrolls
 * smoothly to `targetId` when tapped, and fades out for good as soon as
 * the visitor scrolls. No bobbing / smooth-scroll under reduced motion.
 */
export function ScrollCue({ targetId }: { targetId: string }) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function onScroll() {
      if (window.scrollY > DISMISS_SCROLL_PX) setDismissed(true);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToTarget() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <style>{`
        @keyframes aia-scroll-cue-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        @media (prefers-reduced-motion: reduce) { .aia-scroll-cue-icon { animation: none !important; } }
      `}</style>
      <button
        type="button"
        onClick={scrollToTarget}
        aria-label="Scroll down"
        tabIndex={dismissed ? -1 : 0}
        aria-hidden={dismissed}
        className="fixed left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
          background: MINT,
          boxShadow: "0 6px 16px rgba(10, 54, 58, 0.35)",
          opacity: dismissed ? 0 : 1,
          pointerEvents: dismissed ? "none" : "auto",
          transition: "opacity 250ms ease",
        }}
      >
        <ChevronDown
          size={22}
          strokeWidth={2.5}
          color={TEAL}
          className="aia-scroll-cue-icon"
          style={{ animation: "aia-scroll-cue-bob 1.6s ease-in-out infinite" }}
        />
      </button>
    </>
  );
}
