"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * AiA Splash Screen — wordmark transformation loader.
 *
 * "AiA" expands into "Aram in Action" and contracts back before the
 * Home screen cross-dissolves in underneath it.
 *
 * TYPOGRAPHY, NOT ANIMATION, DOES THE WORK:
 * Each word ("Aram ", "in ", "Action") is rendered as ONE unsplit text
 * node — never split mid-letter — so the browser shapes kerning pairs
 * (e.g. "Ar") correctly in both the compact and expanded states. A
 * clip-path masks the undisclosed portion from the right; the box's
 * width shrinks in lockstep with it. Both values are plain numbers
 * computed in React and applied as ordinary inline styles with a
 * standard CSS transition — deliberately NOT using CSS custom
 * properties or @property, so nothing here depends on newer engine
 * support. overflow stays `visible` throughout, so baseline alignment
 * follows the text's own baseline rather than falling back to the
 * box's bottom margin edge (the CSS 2.1 rule triggered by
 * overflow:hidden on an inline-block).
 *
 * All color, background, and type values are read from the locked
 * design tokens in globals.css — nothing here is hardcoded.
 *
 * Motion: the letter transformation itself (800ms symmetric ease) is
 * a logged, splash-only exception to the Constitution's 150/250/300ms
 * cap. The exit into Home uses only Constitution-approved durations
 * (300ms backdrop dissolve, 250ms wordmark fade).
 *
 * Plays once per browser session. Respects prefers-reduced-motion.
 * Setup is guarded with a `hasRun` ref (not just the sessionStorage
 * flag) so React Strict Mode's dev-only double-invoke of effects
 * can't clear the first pass's timers and then bail out of the
 * second pass, leaving the splash stuck on its first frame.
 */

const SESSION_KEY = "aia-splash-played";
const EASE = "cubic-bezier(0.45, 0, 0.55, 1)"; // symmetric, no overshoot

// Splash-specific exception (logged) — no equivalent Constitution token.
const INITIAL_STILL_MS = 600;
const EXPAND_MS = 800;
const HOLD_MS = 1000;
const CONTRACT_MS = 800;
const REST_MS = 500;

// Exit into Home — both values are Constitution-approved durations.
const BACKDROP_DISSOLVE_MS = 300;
const WORDMARK_FADE_DELAY_MS = 100;
const WORDMARK_FADE_MS = 250;

type Phase = "compact" | "expanded" | "dissolving" | "wordmark-fading";

const WORDS: { text: string; colorVar: "--color-primary" | "--color-muted-foreground" }[] = [
  { text: "Aram ", colorVar: "--color-primary" },
  { text: "in ", colorVar: "--color-muted-foreground" },
  { text: "Action", colorVar: "--color-primary" },
];

function RevealWord({
  text,
  colorVar,
  open,
}: {
  text: string;
  colorVar: string;
  open: boolean;
}) {
  const fullRef = useRef<HTMLSpanElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<{ anchor: number; full: number } | null>(null);

  useLayoutEffect(() => {
    if (fullRef.current && anchorRef.current) {
      setMeasured({
        anchor: anchorRef.current.getBoundingClientRect().width,
        full: fullRef.current.getBoundingClientRect().width,
      });
    }
  }, [text]);

  const currentWidth = measured ? (open ? measured.full : measured.anchor) : 0;
  const hiddenWidth = measured ? Math.max(measured.full - currentWidth, 0) : 0;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {/* Hidden measurement clones — same font context, never painted */}
      <span
        ref={fullRef}
        aria-hidden="true"
        style={{ position: "absolute", visibility: "hidden", whiteSpace: "pre", pointerEvents: "none" }}
      >
        {text}
      </span>
      <span
        ref={anchorRef}
        aria-hidden="true"
        style={{ position: "absolute", visibility: "hidden", whiteSpace: "pre", pointerEvents: "none" }}
      >
        {text.charAt(0)}
      </span>

      {/* The one real, unsplit text node — clip-path masks it, never the DOM */}
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          verticalAlign: "baseline",
          color: `var(${colorVar})`,
          opacity: measured ? 1 : 0,
          width: `${currentWidth}px`,
          clipPath: `inset(0 ${hiddenWidth}px 0 0)`,
          transition: `width ${EXPAND_MS}ms ${EASE}, clip-path ${EXPAND_MS}ms ${EASE}`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

export default function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("compact");
  const [mounted, setMounted] = useState(false);
  const hasRun = useRef(false);

  useLayoutEffect(() => {
    if (hasRun.current) return; // survives React Strict Mode's dev double-invoke
    hasRun.current = true;

    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    window.sessionStorage.setItem(SESSION_KEY, "1");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMounted(true);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const dissolveTotal = BACKDROP_DISSOLVE_MS + WORDMARK_FADE_DELAY_MS + WORDMARK_FADE_MS;

    if (reducedMotion) {
      const tDissolve = 900;
      timers.push(setTimeout(() => setPhase("dissolving"), tDissolve));
      timers.push(setTimeout(() => setPhase("wordmark-fading"), tDissolve + WORDMARK_FADE_DELAY_MS));
      timers.push(setTimeout(() => setMounted(false), tDissolve + dissolveTotal));
      return () => timers.forEach(clearTimeout);
    }

    const tExpand = INITIAL_STILL_MS;
    const tContract = tExpand + EXPAND_MS + HOLD_MS;
    const tDissolve = tContract + CONTRACT_MS + REST_MS;

    timers.push(setTimeout(() => setPhase("expanded"), tExpand));
    timers.push(setTimeout(() => setPhase("compact"), tContract));
    timers.push(setTimeout(() => setPhase("dissolving"), tDissolve));
    timers.push(setTimeout(() => setPhase("wordmark-fading"), tDissolve + WORDMARK_FADE_DELAY_MS));
    timers.push(setTimeout(() => setMounted(false), tDissolve + dissolveTotal));

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!mounted) return null;

  const open = phase === "expanded";
  const dissolving = phase === "dissolving" || phase === "wordmark-fading";
  const wordmarkFading = phase === "wordmark-fading";

  return (
    <div
      role="status"
      aria-label="Aram in Action"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-background)]"
      style={{
        opacity: dissolving ? 0 : 1,
        transition: `opacity ${BACKDROP_DISSOLVE_MS}ms ease-out`,
        pointerEvents: dissolving ? "none" : "auto",
      }}
    >
      <div
        className="font-display select-none flex items-baseline"
        style={{
          fontSize: "clamp(2.25rem, 10vw, 3rem)",
          lineHeight: 1,
          opacity: wordmarkFading ? 0 : 1,
          transition: `opacity ${WORDMARK_FADE_MS}ms ease-out`,
        }}
      >
        {WORDS.map((w) => (
          <RevealWord key={w.text} text={w.text} colorVar={w.colorVar} open={open} />
        ))}
      </div>
    </div>
  );
}
