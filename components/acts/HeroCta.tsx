"use client";

import localFont from "next/font/local";
import { ArrowDown } from "lucide-react";

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

const TEAL = "#0A363A";
const MINT = "#68FFAD";

/**
 * The hero's primary CTA: a mint button (dark text, small radius, the
 * arrow in a dark rounded square -- the Abyssale "Get started" button,
 * arrow turned down) that smooth-scrolls to `targetId`. It sits in the
 * page flow under the description and scrolls away with it.
 */
export function HeroCta({ label, targetId }: { label: string; targetId: string }) {
  function scrollToTarget() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(targetId)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <>
      <style>{`
        @keyframes aia-cta-arrow-pulse { 0%, 100% { transform: translateY(-1px); opacity: 0.85; } 50% { transform: translateY(3px); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .aia-cta-arrow { animation: none !important; } }
      `}</style>
    <button
      type="button"
      onClick={scrollToTarget}
      className={`${inter.className} inline-flex h-12 items-center justify-center gap-3 rounded-[8px] px-5 text-[16px] font-semibold leading-none transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
      style={{ background: MINT, color: TEAL, outlineColor: MINT }}
    >
      {label}
      <span
        aria-hidden="true"
        className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px]"
        style={{ background: TEAL }}
      >
        <ArrowDown
          size={14}
          strokeWidth={3}
          color="#FFFFFF"
          className="aia-cta-arrow"
          style={{ animation: "aia-cta-arrow-pulse 1.4s ease-in-out infinite" }}
        />
      </span>
    </button>
    </>
  );
}
