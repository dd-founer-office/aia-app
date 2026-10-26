"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ComponentType, ReactNode } from "react";
import localFont from "next/font/local";
import {
  Calendar,
  MapPin,
  BadgeCheck,
  Play,
  Sprout,
  UtensilsCrossed,
} from "lucide-react";
import { playTestimonialTransition } from "@/components/acts/testimonialTransition";
import { ANNADHANAM_ELDERS_ACT_ID } from "@/lib/act-content-overrides";

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

// Reuses Home's EditorialHero teal/mint pair exactly (see ActDetailHero.tsx
// for the same constants) -- the reference's three-tone look (dark teal
// ground, a muted mid-tone fill for icons/bars, a bright mint border and
// center tile) is built from ONE existing token (MINT) at different
// opacities, rather than introducing a second green.
const TEAL = "#0A363A";
const MINT = "#68FFAD";
// MINT at 32% over TEAL, as an opaque colour: where two boxes of a pair
// share an edge their borders overlap exactly, and two translucent borders
// would stack into a brighter line.
const MINT_BORDER = "#28765F";
// Colour roles on this screen: solid MINT is reserved for the AiA tile (and
// the one key fact); icon tiles are a quiet mint tint; information is soft
// white; structure is the muted outline above.
const SOFT_WHITE = "#EAFBF2";
const ICON_TILE_TINT = "rgba(104, 255, 173, 0.13)";

// Geometry measured directly from the reference image (1080x1142; content
// bounding box 110,117 to 969,1013 -- 859x896) and expressed as
// percentages of that content box, so the whole composition scales
// together at any width via one aspect-ratio container. Every box below
// is exactly where and how large it is in the reference.
interface BoxSpec {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Each of the four Icon/Detail pairs is described by two slots for each
// box: slot A is where it sits when the collage first assembles and slot B
// is where it ends up after its pair swaps places (the idle stage of the
// reference video). A box's DOM position is always its A slot; the swap is
// a translate from A to B. Every pair sits edge-to-edge with zero space
// between; each box keeps a full outline, and the two boxes of a pair
// overlap by exactly one line width (see SEAM_OVERLAP_PX) so their shared
// edge reads as a single line rather than two.
//
// Date (stacked): A = icon over text, B = text over icon.
const DATE_ICON_A: BoxSpec = { left: 0, top: 0, width: 36.09, height: 30.69 };
const DATE_TEXT_A: BoxSpec = {
  left: 0,
  top: 30.69,
  width: 36.09,
  height: 30.13,
};
const DATE_ICON_B: BoxSpec = {
  left: 0,
  top: 30.13,
  width: 36.09,
  height: 30.69,
};
const DATE_TEXT_B: BoxSpec = { left: 0, top: 0, width: 36.09, height: 30.13 };
// Location (side by side): A = text then icon, B = icon then text.
const LOC_TEXT_A: BoxSpec = {
  left: 41.09,
  top: 0,
  width: 38.07,
  height: 41.29,
};
const LOC_ICON_A: BoxSpec = {
  left: 79.16,
  top: 0,
  width: 20.61,
  height: 41.29,
};
const LOC_ICON_B: BoxSpec = {
  left: 41.09,
  top: 0,
  width: 20.61,
  height: 41.29,
};
const LOC_TEXT_B: BoxSpec = { left: 61.7, top: 0, width: 38.07, height: 41.29 };
const CENTER: BoxSpec = {
  left: 41.09,
  top: 45.76,
  width: 15.95,
  height: 14.84,
};
// Act (stacked, equal heights): A = text over icon, B = icon over text.
const ACT_TEXT_A: BoxSpec = {
  left: 61.7,
  top: 45.76,
  width: 38.07,
  height: 27.12,
};
const ACT_ICON_A: BoxSpec = {
  left: 61.7,
  top: 72.88,
  width: 38.07,
  height: 27.12,
};
const ACT_ICON_B: BoxSpec = {
  left: 61.7,
  top: 45.76,
  width: 38.07,
  height: 27.12,
};
const ACT_TEXT_B: BoxSpec = {
  left: 61.7,
  top: 72.88,
  width: 38.07,
  height: 27.12,
};
// Verified Partner (stacked): A = icon over text, B = text over icon.
const WIDE_ICON_A: BoxSpec = {
  left: 0,
  top: 65.62,
  width: 56.81,
  height: 17.75,
};
const WIDE_TEXT_A: BoxSpec = {
  left: 0,
  top: 83.37,
  width: 56.81,
  height: 16.63,
};
const WIDE_ICON_B: BoxSpec = {
  left: 0,
  top: 82.25,
  width: 56.81,
  height: 17.75,
};
const WIDE_TEXT_B: BoxSpec = {
  left: 0,
  top: 65.62,
  width: 56.81,
  height: 16.63,
};

function boxStyle(box: BoxSpec): CSSProperties {
  return {
    position: "absolute",
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

const BOX_RADIUS = 12;
const BORDER_PX = 1.75;
// Each box of a pair reaches half a line width into its partner, so the two
// borders land on exactly the same pixels.
const SEAM_OVERLAP_PX = BORDER_PX / 2;

// useSyncExternalStore (not useState+useEffect) reads prefers-reduced-motion
// correctly on the very first client render -- an effect-based setState
// would need an extra render to correct an initial "false" guess, and
// trips the react-hooks/set-state-in-effect lint rule besides.
function subscribeToReducedMotionChanges(onChange: () => void): () => void {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
function readReducedMotionOnClient(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function readReducedMotionOnServer(): boolean {
  return false;
}

const ENTER_RATIO = 0.9;
const EXIT_RATIO = 0.25;

// ---- The reference video's timeline (all ms from the moment the panel is
// on screen; read frame by frame off the recording) ----------------------
//
// 1. 0-400      the AiA tile grows in on its own (mirroring how it leaves).
// 2. 400-2100   outlined boxes appear: icon boxes grow in first (date,
//               location, act), the wide partner text box at the bottom,
//               then each partner box slides out from behind its icon.
// 3. 1200-2300  text bars fill the detail boxes, bar by bar.
// 4. 3400-6700  idle: the pairs trade places one at a time (location,
//               partner, date, act), ~1s apart, ~300ms each.
// 5. exit       (on the visitor's next action) the boxes fade and shrink
//               toward the centre pair by pair, the AiA tile holds alone
//               for a beat, then shrinks and fades out last.
const SWAP_MS = 320;
const BAR_STAGGER_MS = 90;
const ENTRY_SETTLED_MS = 2400;
// The play button stays hidden until the whole collage animation (the entry
// and all four swaps; the last swap starts at 6400ms) is done. Then its ring
// fills over READ_MS -- the visitor's reading time -- and the page moves on
// by itself when it completes (pressing it or scrolling moves on sooner).
const ANIMATION_DONE_MS = 6400 + SWAP_MS + 80;
const READ_MS = 5000;
const EXIT_PAIR_STAGGER_MS = 100;
const AIA_OUT_DELAY_MS = 850;
const AIA_OUT_MS = 350;
// When the exit (boxes collapsing, then the AiA tile leaving) has fully
// played; the transition into the testimonial starts right after.
const EXIT_DONE_MS = AIA_OUT_DELAY_MS + AIA_OUT_MS + 50;

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";
const EASE_IN_OUT = "cubic-bezier(0.65, 0, 0.35, 1)";

// idle: before the panel is on screen (AiA only, ready to play). play:
// entry -> idle swaps, holding on the final arrangement. exit: the exit.
// static: reduced motion -- the settled collage, no animation.
type Stage = "idle" | "play" | "exit" | "static";

// Three nested layers per box so their animations never fight over the
// same property: .aia-o (exit: translate/scale/opacity), .aia-m (swap:
// translate), .aia-i (entry: scale/opacity or translate/opacity, plus the
// border seam flip). Individual `translate`/`scale` properties are used,
// so they compose with each other instead of overriding.
const SNAPSHOT_CSS = `
  .aia-o, .aia-m { position: absolute; }
  .aia-o { }
  .aia-m, .aia-i { inset: 0; }
  .aia-m { position: absolute; }
  .aia-i { position: absolute; opacity: 0; }
  .aia-bar { transform-origin: left center; }

  .aia-snap[data-stage="static"] .aia-i { opacity: 1; }
  .aia-snap[data-stage="static"] .aia-m { translate: var(--tx) var(--ty); }

  .aia-snap:is([data-stage="play"], [data-stage="exit"]) .aia-i[data-enter="grow"] {
    animation: aia-grow 280ms ${EASE_OUT} var(--d) both, aia-glow 1000ms ease calc(var(--sw) - 150ms) backwards;
  }
  .aia-snap:is([data-stage="play"], [data-stage="exit"]) .aia-i[data-enter="emerge"] {
    animation: aia-emerge 320ms ${EASE_OUT} var(--d) both, aia-glow 1000ms ease calc(var(--sw) - 150ms) backwards;
  }
  .aia-snap:is([data-stage="play"], [data-stage="exit"]) .aia-m {
    animation: aia-swap ${SWAP_MS}ms ${EASE_IN_OUT} var(--sw) both;
  }
  .aia-snap:is([data-stage="play"], [data-stage="exit"]) .aia-bar {
    animation: aia-bar-in 240ms ease-out calc(var(--bd) + var(--bi) * ${BAR_STAGGER_MS}ms) both;
  }
  .aia-snap[data-stage="exit"] .aia-o {
    animation: aia-exit 250ms cubic-bezier(0.55, 0, 0.8, 0.4) var(--xd) both;
  }
  .aia-c { opacity: 0; scale: 0.5; }
  .aia-snap[data-stage="static"] .aia-c { opacity: 1; scale: 1; }
  .aia-snap[data-stage="play"] .aia-c {
    animation: aia-ai-in ${AIA_OUT_MS}ms ${EASE_IN_OUT} both;
  }
  .aia-snap[data-stage="exit"] .aia-c {
    animation: aia-ai-out ${AIA_OUT_MS}ms ${EASE_IN_OUT} ${AIA_OUT_DELAY_MS}ms both;
  }

  @keyframes aia-grow { from { scale: 0.2; opacity: 0; } to { scale: 1; opacity: 1; } }
  @keyframes aia-emerge { from { translate: var(--ex) var(--ey); opacity: 0; } to { translate: 0% 0%; opacity: 1; } }
  @keyframes aia-swap { from { translate: 0% 0%; } to { translate: var(--tx) var(--ty); } }
  .aia-snap:is([data-stage="play"], [data-stage="exit"]) .aia-bar[data-plain] {
    animation: aia-text-in 320ms ease-out calc(var(--bd) + var(--bi) * ${BAR_STAGGER_MS}ms) both;
  }
  @keyframes aia-bar-in { from { scale: 0 1; opacity: 0; } to { scale: 1 1; opacity: 1; } }
  @keyframes aia-text-in { from { opacity: 0; translate: 0 4px; } to { opacity: 1; translate: 0 0; } }
  /* While a pair trades places its outline briefly lights up, so motion --
     not colour -- guides the eye. */
  @keyframes aia-glow { 0%, 100% { border-color: ${MINT_BORDER}; } 35% { border-color: #5BE8A6; } }
  @keyframes aia-exit { to { translate: var(--cx) var(--cy); scale: 0.55; opacity: 0; } }
  @keyframes aia-ai-in { from { scale: 0.5; opacity: 0; } to { scale: 1; opacity: 1; } }
  @keyframes aia-ai-out { from { scale: 1; opacity: 1; } to { scale: 0.5; opacity: 0; } }

  /* The play button under the collage: it appears only once the collage
     animation is done, and its ring then fills slowly (the reading time).
     When the ring completes the page advances on its own. */
  .aia-cta { opacity: 0; }
  .aia-panel[data-stage="play"] .aia-cta {
    animation: aia-cta-in 300ms ease ${ANIMATION_DONE_MS}ms both;
  }
  .aia-panel[data-stage="exit"] .aia-cta[data-shown="true"], .aia-panel[data-stage="static"] .aia-cta { opacity: 1; }
  .aia-panel[data-stage="play"] .aia-cta-ring-progress {
    animation: aia-ring-fill ${READ_MS}ms linear ${ANIMATION_DONE_MS}ms both;
  }
  .aia-panel[data-stage="exit"] .aia-cta-ring, .aia-panel[data-stage="static"] .aia-cta-ring { display: none; }
  @keyframes aia-cta-in { from { opacity: 0; translate: 0 10px; } to { opacity: 1; translate: 0 0; } }
  @keyframes aia-ring-fill { from { stroke-dashoffset: 201.06; } to { stroke-dashoffset: 0; } }

  @media (prefers-reduced-motion: reduce) { .aia-snap *, .aia-panel * { animation: none !important; } }
`;

type IconComponent = ComponentType<{
  size?: number | string;
  strokeWidth?: number;
  color?: string;
}>;

// Percent offsets (relative to the moving box's own size) from slot `from`
// to slot `to`.
function offset(
  from: BoxSpec,
  to: BoxSpec,
  own: BoxSpec,
): { x: number; y: number } {
  return {
    x: ((to.left - from.left) / own.width) * 100,
    y: ((to.top - from.top) / own.height) * 100,
  };
}

interface BoxProps {
  a: BoxSpec;
  b: BoxSpec;
  // Which axis this box touches its partner along: "y" for a stacked pair,
  // "x" for the side-by-side location pair.
  seam: "x" | "y";
  swapAt: number;
  exitOrder: number;
  // Grows in place, or slides out from behind its partner's A slot.
  enter:
    | { kind: "grow"; at: number }
    | { kind: "emerge"; at: number; from: BoxSpec };
  // Text boxes: when the first bar starts to fill in.
  barsAt?: number;
  className: string;
  zIndex: number;
  children: ReactNode;
}

function SnapshotBox({
  a,
  b,
  seam,
  swapAt,
  exitOrder,
  enter,
  barsAt,
  className,
  zIndex,
  children,
}: BoxProps) {
  const swap = offset(a, b, a);
  const emerge =
    enter.kind === "emerge" ? offset(a, enter.from, a) : { x: 0, y: 0 };
  // Toward the AiA tile, a third of the way, on exit.
  const toCenterX =
    ((CENTER.left + CENTER.width / 2 - (b.left + b.width / 2)) / a.width) *
    100 *
    0.35;
  const toCenterY =
    ((CENTER.top + CENTER.height / 2 - (b.top + b.height / 2)) / a.height) *
    100 *
    0.35;

  const vars = {
    "--tx": `${swap.x}%`,
    "--ty": `${swap.y}%`,
    "--ex": `${emerge.x}%`,
    "--ey": `${emerge.y}%`,
    "--cx": `${toCenterX}%`,
    "--cy": `${toCenterY}%`,
    "--d": `${enter.at}ms`,
    "--sw": `${swapAt}ms`,
    "--xd": `${exitOrder * EXIT_PAIR_STAGGER_MS}ms`,
    "--bd": `${barsAt ?? 0}ms`,
  } as CSSProperties;

  return (
    <div className="aia-o" style={{ ...boxStyle(a), ...vars, zIndex }}>
      <div className="aia-m">
        <div
          className={`aia-i ${className}`}
          data-enter={enter.kind}
          style={{
            border: `${BORDER_PX}px solid ${MINT_BORDER}`,
            inset:
              seam === "y"
                ? `${-SEAM_OVERLAP_PX}px 0`
                : `0 ${-SEAM_OVERLAP_PX}px`,
            borderRadius: BOX_RADIUS,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function IconBox(
  props: Omit<BoxProps, "className" | "zIndex" | "children"> & {
    icon: IconComponent;
  },
) {
  const { icon: Icon, ...rest } = props;
  return (
    <SnapshotBox
      {...rest}
      className="flex items-center justify-center"
      zIndex={1}
    >
      {/* The icon sits in a small tile with softly rounded corners, a quiet
          mint tint with a mint glyph so the AiA tile stays the only solid
          mint block; the tile scales with the collage width. */}
      <span
        className="flex items-center justify-center"
        style={{
          width: "clamp(30px, 11cqw, 44px)",
          height: "clamp(30px, 11cqw, 44px)",
          background: ICON_TILE_TINT,
          borderRadius: 8,
        }}
      >
        <Icon size="58%" strokeWidth={2} color={MINT} />
      </span>
    </SnapshotBox>
  );
}

function DetailBox(
  props: Omit<BoxProps, "className" | "zIndex" | "children"> & {
    align?: "start" | "center";
    children: ReactNode;
  },
) {
  const { align = "start", children, ...rest } = props;
  return (
    <SnapshotBox
      {...rest}
      className={`flex flex-col justify-center gap-1.5 px-2 ${align === "center" ? "items-center" : "items-start"}`}
      zIndex={0}
    >
      {children}
    </SnapshotBox>
  );
}

// Detail text is plain soft-white type on the dark teal -- information, not
// decoration. The one KEY fact of the collage (the count) keeps the
// Abyssale-style typographic highlight: NOT a button/pill/capsule, but a flat
// mint fill hugging the text tightly (small radius, tight padding) with
// dark-teal text, so it is the single mint accent besides the AiA tile. No
// max-width clamp on the highlight: a clamp would shrink its background below
// the text's natural width, leaving the tail of the text rendered past the
// fill in the same dark teal as the card. The font scales with the collage's
// own width (capped) so every line's true width fits inside its card at the
// card's own fixed geometry. `i` orders the lines as they fade in.
const HIGHLIGHT_STYLE: CSSProperties = {
  lineHeight: 1.25,
  fontWeight: 600,
  background: MINT,
  color: TEAL,
  fontSize: "clamp(8px, 3.1cqw, 10px)",
  padding: "2px 6px",
  borderRadius: 5,
};
const PLAIN_STYLE: CSSProperties = {
  lineHeight: 1.25,
  fontWeight: 600,
  color: SOFT_WHITE,
  fontSize: "clamp(8.5px, 3.3cqw, 10.5px)",
};

function TextBar({
  i,
  highlight = false,
  children,
}: {
  i: number;
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`${inter.className} aia-bar inline-flex w-fit items-center whitespace-nowrap`}
      data-plain={highlight ? undefined : "true"}
      style={{
        ...(highlight ? HIGHLIGHT_STYLE : PLAIN_STYLE),
        ["--bi" as string]: i,
      }}
    >
      {children}
    </span>
  );
}

function SnapshotCenter() {
  return (
    <div
      className="aia-c flex items-center justify-center"
      style={{
        ...boxStyle(CENTER),
        background: MINT,
        borderRadius: BOX_RADIUS,
        zIndex: 3,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 700,
          fontSize: "1.4em",
          color: TEAL,
        }}
      >
        AiA
      </span>
    </div>
  );
}

/**
 * Act Detail's Act Snapshot: four icon-card + text-highlight-card pairs
 * (Date, Location, Act, Verified Partner) around a central AiA tile, in the
 * reference's exact measured geometry -- box positions/sizes are percentages
 * of one aspect-ratio container (859:896), so the whole arrangement scales
 * together at any width. Teal/mint reuse ActDetailHero's exact tokens;
 * highlight copy is Inter (Medium/SemiBold), never the page's editorial
 * serif.
 *
 * It lives in its own full-screen panel and plays the reference video's
 * timeline (see the stage list above): once the panel is (almost) fully on
 * screen the boxes assemble, the pairs trade places one by one, and then
 * everything holds still. The visitor's next downward scroll is swallowed
 * and plays the exit instead (boxes fade/shrink out, the AiA tile last);
 * further downward scrolling stays blocked until it finishes. Reduced
 * motion shows the settled collage with no animation and no scroll
 * handling.
 *
 * No background/rounding of its own -- ActDetailHero renders this directly
 * inside its own single continuous teal surface, so it must read as a
 * continuation of that surface, not a second nested card.
 */
export function ActSnapshot({ actId }: { actId: string }) {
  const isAnnadhanamElders = actId === ANNADHANAM_ELDERS_ACT_ID;
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer,
  );
  const [stage, setStage] = useState<Stage>("idle");
  const shownStage: Stage = reducedMotion ? "static" : stage;

  // Refs mirror the state for the observer and the gesture handlers, which
  // outlive any one render.
  const stageRef = useRef<Stage>("idle");
  const panelFullRef = useRef(false);
  const settledRef = useRef(false);
  const lockedRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const advanceRef = useRef<() => void>(() => {});
  const ctaRef = useRef<HTMLButtonElement>(null);
  // The play button is visible and pressable once the collage animation is
  // done (see ANIMATION_DONE_MS).
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;
    const node = panelRef.current;
    if (!node) return;

    function go(next: Stage) {
      stageRef.current = next;
      setStage(next);
    }
    function clearAllTimers() {
      clearTimeout(settleTimerRef.current);
      clearTimeout(showTimerRef.current);
      clearTimeout(autoTimerRef.current);
    }

    // Play only once (almost) the whole panel is on screen, so the full
    // screen always appears first. Leaving the panel (below EXIT_RATIO)
    // resets it so the timeline plays again on return -- two thresholds, no
    // flicker. On a viewport shorter than the panel the full ratio can't be
    // reached, so the entry bar scales down to what is reachable (never
    // below half).
    const observer = new IntersectionObserver(
      ([entry]) => {
        const reachable = Math.min(
          1,
          window.innerHeight / entry.boundingClientRect.height,
        );
        const enterAt = Math.max(
          0.5,
          Math.min(ENTER_RATIO, reachable * ENTER_RATIO),
        );
        const ratio = entry.intersectionRatio;
        panelFullRef.current = ratio >= enterAt;

        if (ratio >= enterAt && stageRef.current === "idle") {
          go("play");
          settledRef.current = false;
          setReady(false);
          clearAllTimers();
          settleTimerRef.current = setTimeout(() => {
            settledRef.current = true;
          }, ENTRY_SETTLED_MS);
          showTimerRef.current = setTimeout(
            () => setReady(true),
            ANIMATION_DONE_MS,
          );
          autoTimerRef.current = setTimeout(
            () => advanceRef.current(),
            ANIMATION_DONE_MS + READ_MS,
          );
        } else if (ratio < EXIT_RATIO && stageRef.current !== "idle") {
          clearAllTimers();
          settledRef.current = false;
          setReady(false);
          go("idle");
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    observer.observe(node);

    // One action carries the visitor all the way through: the exit plays
    // (boxes collapse into the AiA tile, the tile leaves), then the teal
    // screen shrinks into the testimonial video's frame (see
    // testimonialTransition.ts). The action is either pressing the play
    // button or the first attempt to scroll on past the panel; both are held
    // back until the entry has settled. While the whole sequence runs, every
    // wheel/touch gesture is swallowed (and the hero pager is told to stand
    // down via the data-aia-lock flag). Upward scrolling outside that window
    // is never touched.
    function setLocked(locked: boolean) {
      lockedRef.current = locked;
      if (locked) document.documentElement.dataset.aiaLock = "1";
      else delete document.documentElement.dataset.aiaLock;
    }
    function advance() {
      if (
        stageRef.current !== "play" ||
        !settledRef.current ||
        lockedRef.current
      )
        return;
      clearAllTimers();
      go("exit");
      setLocked(true);
      const cta = ctaRef.current;
      window.setTimeout(() => {
        void playTestimonialTransition(cta).finally(() => setLocked(false));
      }, EXIT_DONE_MS);
    }
    advanceRef.current = advance;
    function onGesture(event: Event, direction: "down" | "up") {
      if (lockedRef.current) {
        if (event.cancelable) event.preventDefault();
        return;
      }
      if (
        direction !== "down" ||
        !panelFullRef.current ||
        stageRef.current !== "play"
      )
        return;
      if (event.cancelable) event.preventDefault();
      if (settledRef.current) advance();
    }
    function onWheel(event: WheelEvent) {
      if (event.deltaY !== 0)
        onGesture(event, event.deltaY > 0 ? "down" : "up");
    }
    let touchStartY = 0;
    function onTouchStart(event: TouchEvent) {
      touchStartY = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      const delta = touchStartY - (event.touches[0]?.clientY ?? touchStartY);
      if (Math.abs(delta) > 6) onGesture(event, delta > 0 ? "down" : "up");
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      clearAllTimers();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      setLocked(false);
    };
  }, [reducedMotion]);

  return (
    // min-h-[100svh] + centered: the collage owns one whole screen.
    <div
      ref={panelRef}
      className="aia-panel relative flex min-h-[100svh] items-center px-[30px] py-[42px]"
      data-stage={shownStage}
    >
      <style>{SNAPSHOT_CSS}</style>
      <div
        className="aia-snap relative mx-auto w-full"
        data-stage={shownStage}
        style={{ aspectRatio: "859 / 896", containerType: "inline-size" }}
      >
        {/* Date */}
        <IconBox
          a={DATE_ICON_A}
          b={DATE_ICON_B}
          seam="y"
          swapAt={5400}
          exitOrder={2}
          enter={{ kind: "grow", at: 400 }}
          icon={Calendar}
        />
        <DetailBox
          a={DATE_TEXT_A}
          b={DATE_TEXT_B}
          seam="y"
          swapAt={5400}
          exitOrder={2}
          enter={{ kind: "emerge", at: 1000, from: DATE_ICON_A }}
          barsAt={1300}
        >
          <TextBar i={0}>28 September</TextBar>
          <TextBar i={1}>Monday</TextBar>
        </DetailBox>

        {/* Location -- three lines */}
        <IconBox
          a={LOC_ICON_A}
          b={LOC_ICON_B}
          seam="x"
          swapAt={3400}
          exitOrder={0}
          enter={{ kind: "grow", at: 500 }}
          icon={MapPin}
        />
        <DetailBox
          a={LOC_TEXT_A}
          b={LOC_TEXT_B}
          seam="x"
          swapAt={3400}
          exitOrder={0}
          enter={{ kind: "emerge", at: 1000, from: LOC_ICON_A }}
          barsAt={1450}
        >
          {isAnnadhanamElders ? (
            <>
              <TextBar i={0}>Sreenivasanallur</TextBar>
              <TextBar i={1}>Kumbakonam</TextBar>
              <TextBar i={2}>Thanjavur</TextBar>
            </>
          ) : (
            <>
              <TextBar i={0}>Alangulam</TextBar>
              <TextBar i={1}>Thanjavur</TextBar>
              <TextBar i={2}>Tamil Nadu</TextBar>
            </>
          )}
        </DetailBox>

        <SnapshotCenter />

        {/* Act / Impact -- first line stays on one line, second line centered beneath */}
        <DetailBox
          a={ACT_TEXT_A}
          b={ACT_TEXT_B}
          seam="y"
          swapAt={6400}
          exitOrder={3}
          enter={{ kind: "emerge", at: 1400, from: ACT_ICON_A }}
          barsAt={1750}
          align="center"
        >
          {isAnnadhanamElders ? (
            <>
              <TextBar i={0} highlight>
                45 elders
              </TextBar>
              <TextBar i={1}>served with care</TextBar>
            </>
          ) : (
            <>
              <TextBar i={0} highlight>
                25 native saplings
              </TextBar>
              <TextBar i={1}>planted</TextBar>
            </>
          )}
        </DetailBox>
        <IconBox
          a={ACT_ICON_A}
          b={ACT_ICON_B}
          seam="y"
          swapAt={6400}
          exitOrder={3}
          enter={{ kind: "grow", at: 850 }}
          icon={isAnnadhanamElders ? UtensilsCrossed : Sprout}
        />

        {/* Verified Partner */}
        <IconBox
          a={WIDE_ICON_A}
          b={WIDE_ICON_B}
          seam="y"
          swapAt={4400}
          exitOrder={1}
          enter={{ kind: "emerge", at: 1900, from: WIDE_TEXT_A }}
          icon={BadgeCheck}
        />
        <DetailBox
          a={WIDE_TEXT_A}
          b={WIDE_TEXT_B}
          seam="y"
          swapAt={4400}
          exitOrder={1}
          enter={{ kind: "grow", at: 700 }}
          barsAt={1200}
        >
          {isAnnadhanamElders ? (
            <>
              <TextBar i={0}>Annai Aravindhar</TextBar>
              <TextBar i={1}>Karunai Illam</TextBar>
            </>
          ) : (
            <TextBar i={0}>Iyal Impact Foundation</TextBar>
          )}
        </DetailBox>
      </div>

      {/* The play button: a ring fills while the collage assembles, then it
          pulses and waits for the visitor. Pressing it does exactly what
          scrolling does (see advance above). */}
      <div
        className="pointer-events-none absolute inset-x-0 flex justify-center"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 36px)" }}
      >
        <button
          ref={ctaRef}
          type="button"
          disabled={!ready && !reducedMotion}
          onClick={() => {
            if (reducedMotion) void playTestimonialTransition(null);
            else advanceRef.current();
          }}
          aria-label="Play the testimonial video"
          data-shown={ready ? "true" : "false"}
          // Looks exactly like the video's own play button (52px, dark teal,
          // translucent white border, white icon), so it can fly onto it.
          className="aia-cta pointer-events-auto relative flex h-[52px] w-[52px] items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{
            background: TEAL,
            color: "#FFFFFF",
            border: "2px solid rgba(255, 255, 255, 0.55)",
            outlineColor: MINT,
          }}
        >
          <svg
            className="aia-cta-ring pointer-events-none absolute"
            style={{ left: -10, top: -10, width: 68, height: 68 }}
            viewBox="0 0 68 68"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="34"
              cy="34"
              r="32"
              stroke={MINT}
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <circle
              className="aia-cta-ring-progress"
              cx="34"
              cy="34"
              r="32"
              stroke={MINT}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="201.06"
              strokeDashoffset="201.06"
              transform="rotate(-90 34 34)"
            />
          </svg>
          <Play
            size={20}
            color="currentColor"
            fill="currentColor"
            style={{ marginLeft: 3 }}
          />
        </button>
      </div>
    </div>
  );
}
