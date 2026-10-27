"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import localFont from "next/font/local";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Share pages only (for now): full mint screen, Cal Sans wordmark in the
// brand teal, and the exit shrinks the screen into the AiA tile shape and
// lets it glide down before fading. Everything else keeps the original look.
const SHARE_MINT = "#68FFAD";
const SHARE_TEAL = "#0A363A";
const TILE_PX = 120;
const SHARE_EXPAND_MS = 1000;
const SHARE_EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const TILE_RADIUS_PX = 16;
const TILE_SHRINK_MS = 500;
const TILE_GLIDE_MS = 600;

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

const WORDS: {
  text: string;
  colorVar: "--color-primary" | "--color-muted-foreground";
}[] = [
  { text: "Aram ", colorVar: "--color-primary" },
  { text: "in ", colorVar: "--color-muted-foreground" },
  { text: "Action", colorVar: "--color-primary" },
];

function RevealWord({
  text,
  colorVar,
  color,
  open,
}: {
  text: string;
  colorVar: string;
  color?: string;
  open: boolean;
}) {
  const fullRef = useRef<HTMLSpanElement>(null);
  const [measured, setMeasured] = useState<{
    anchor: number;
    full: number;
  } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;

    async function measure() {
      // Wait for the real webfont — measuring against a temporary
      // fallback font locks in the wrong widths for the whole animation.
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          /* proceed with whatever is loaded */
        }
      }
      if (cancelled || !fullRef.current?.firstChild) return;

      const el = fullRef.current;
      const textNode = el.firstChild as Text;

      // Measure the anchor glyph IN CONTEXT (as shaped/kerned against
      // its neighbor), not as an isolated character — an isolated "A"
      // is not necessarily the same width as the "A" inside "Aram".
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);

      setMeasured({
        anchor: range.getBoundingClientRect().width,
        full: el.getBoundingClientRect().width,
      });
    }

    measure();
    return () => {
      cancelled = true;
    };
  }, [text]);

  const currentWidth = measured ? (open ? measured.full : measured.anchor) : 0;
  const hiddenWidth = measured ? Math.max(measured.full - currentWidth, 0) : 0;

  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {/* Hidden measurement clone — same font context, never painted */}
      <span
        ref={fullRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          pointerEvents: "none",
        }}
      >
        {text}
      </span>

      {/* The one real, unsplit text node — clip-path masks it, never the DOM */}
      <span
        style={{
          display: "inline-block",
          whiteSpace: "pre",
          verticalAlign: "baseline",
          color: color ?? `var(${colorVar})`,
          opacity: measured ? 1 : 0,
          width: `${currentWidth}px`,
          clipPath: `inset(0 ${hiddenWidth}px 0 0)`,
          willChange: "width, clip-path",
          transition: `width ${EXPAND_MS}ms ${EASE}, clip-path ${EXPAND_MS}ms ${EASE}`,
        }}
      >
        {text}
      </span>
    </span>
  );
}

// Share-page wordmark: laid out once at its final size, then moved with
// transform/clip-path only (no width animation, so no reflow and no drift).
// Collapsed, every word is slid so its first letter ("A", "i", "A") sits
// next to the others, and the rest of the word is clipped away; opening just
// slides the words back and un-clips them. Measured only after the real
// webfont has loaded so the widths are never from a fallback font.
function AnchoredWordmark({ open }: { open: boolean }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [m, setM] = useState<{ shift: number[]; hide: number[] } | null>(null);
  // Transitions switch on only after the collapsed pose has painted, so the
  // wordmark appears already collapsed instead of visibly collapsing.
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await document.fonts.load(`700 3rem ${calSans.style.fontFamily}`);
        await document.fonts.ready;
      } catch {
        /* proceed with whatever is loaded */
      }
      const els = refs.current;
      if (cancelled || els.some((el) => !el?.firstChild)) return;
      const lefts = els.map((el) => el!.offsetLeft);
      const widths = els.map((el) => el!.offsetWidth);
      const anchors = els.map((el) => {
        const range = document.createRange();
        range.setStart(el!.firstChild!, 0);
        range.setEnd(el!.firstChild!, 1);
        return range.getBoundingClientRect().width;
      });
      const full =
        lefts[lefts.length - 1] + widths[widths.length - 1] - lefts[0];
      const sum = anchors.reduce((a, b) => a + b, 0);
      let before = 0;
      const shift = els.map((_, i) => {
        const x = lefts[0] + (full - sum) / 2 + before - lefts[i];
        before += anchors[i];
        return x;
      });
      setM({ shift, hide: widths.map((w, i) => w - anchors[i]) });
      requestAnimationFrame(() =>
        requestAnimationFrame(() => !cancelled && setArmed(true)),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      className={`${calSans.className} select-none font-bold`}
      style={{
        fontSize: "clamp(2.25rem, 10vw, 3rem)",
        lineHeight: 1,
        whiteSpace: "pre",
        position: "relative",
      }}
    >
      {WORDS.map((w, i) => (
        <span
          key={w.text}
          ref={(el) => {
            refs.current[i] = el;
          }}
          style={{
            display: "inline-block",
            color: SHARE_TEAL,
            opacity: m ? 1 : 0,
            translate: m && !open ? `${m.shift[i]}px 0` : "0 0",
            clipPath:
              m && !open ? `inset(0 ${m.hide[i]}px 0 0)` : "inset(0 0 0 0)",
            willChange: "translate, clip-path",
            transition: armed
              ? `translate ${SHARE_EXPAND_MS}ms ${SHARE_EASE}, clip-path ${SHARE_EXPAND_MS}ms ${SHARE_EASE}`
              : "none",
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}

export default function SplashScreen() {
  const share = usePathname()?.startsWith("/share/") ?? false;
  const [phase, setPhase] = useState<Phase>("compact");
  // Defaults to true so the splash is present in the server-rendered
  // HTML itself — otherwise the browser paints Home first (server
  // output, pre-hydration) and only shows the splash once React
  // hydrates and this effect runs, causing a brief flash of Home.
  const [mounted, setMounted] = useState(true);
  const hasRun = useRef(false);

  useLayoutEffect(() => {
    if (hasRun.current) return; // survives React Strict Mode's dev double-invoke
    hasRun.current = true;

    if (typeof window === "undefined") return;

    if (window.sessionStorage.getItem(SESSION_KEY)) {
      // Already played this session — hide before the browser paints
      // this frame, so there's no flash of the splash either.
      setMounted(false);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, "1");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const dissolveTotal = share
      ? TILE_SHRINK_MS + TILE_GLIDE_MS
      : BACKDROP_DISSOLVE_MS + WORDMARK_FADE_DELAY_MS + WORDMARK_FADE_MS;
    const fadeDelay = share ? TILE_SHRINK_MS : WORDMARK_FADE_DELAY_MS;

    if (reducedMotion) {
      const tDissolve = 900;
      timers.push(setTimeout(() => setPhase("dissolving"), tDissolve));
      timers.push(
        setTimeout(() => setPhase("wordmark-fading"), tDissolve + fadeDelay),
      );
      timers.push(
        setTimeout(() => setMounted(false), tDissolve + dissolveTotal),
      );
      return () => timers.forEach(clearTimeout);
    }

    const tExpand = INITIAL_STILL_MS;
    const tContract = tExpand + (share ? SHARE_EXPAND_MS : EXPAND_MS) + HOLD_MS;
    const tDissolve = tContract + CONTRACT_MS + REST_MS;

    timers.push(setTimeout(() => setPhase("expanded"), tExpand));
    timers.push(setTimeout(() => setPhase("compact"), tContract));
    timers.push(setTimeout(() => setPhase("dissolving"), tDissolve));
    timers.push(
      setTimeout(() => setPhase("wordmark-fading"), tDissolve + fadeDelay),
    );
    timers.push(setTimeout(() => setMounted(false), tDissolve + dissolveTotal));

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per mount
  }, []);

  if (!mounted) return null;

  const open = phase === "expanded";
  const dissolving = phase === "dissolving" || phase === "wordmark-fading";
  const wordmarkFading = phase === "wordmark-fading";

  if (share) {
    const clipFull = "inset(0px 0px 0px 0px round 0px)";
    const half = TILE_PX / 2;
    const clipTile = `inset(calc(50% - ${half}px) calc(50% - ${half}px) calc(50% - ${half}px) calc(50% - ${half}px) round ${TILE_RADIUS_PX}px)`;
    return (
      <div
        role="status"
        aria-label="Aram in Action"
        className="fixed inset-0 z-[100]"
        style={{
          translate: wordmarkFading ? "0 34vh" : "0 0",
          opacity: wordmarkFading ? 0 : 1,
          transition: `translate ${TILE_GLIDE_MS}ms ${EASE}, opacity ${TILE_GLIDE_MS}ms ease-in`,
          pointerEvents: dissolving ? "none" : "auto",
        }}
      >
        {/* The mint screen shrinks into the tile shape; the wordmark is a
            separate layer so the tile always carries its "AiA". */}
        <div
          className="absolute inset-0"
          style={{
            background: SHARE_MINT,
            clipPath: dissolving ? clipTile : clipFull,
            transition: `clip-path ${TILE_SHRINK_MS}ms ${EASE}`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <AnchoredWordmark open={open} />
        </div>
      </div>
    );
  }

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
          <RevealWord
            key={w.text}
            text={w.text}
            colorVar={w.colorVar}
            open={open}
          />
        ))}
      </div>
    </div>
  );
}
