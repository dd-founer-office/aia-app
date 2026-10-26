"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ComponentType, ReactNode } from "react";
import localFont from "next/font/local";
import { Calendar, MapPin, BadgeCheck, Sprout, UtensilsCrossed } from "lucide-react";
import { ANNADHANAM_ELDERS_ACT_ID } from "@/lib/act-content-overrides";

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({ src: "../../app/fonts/InterVF.woff2", weight: "100 900", display: "swap" });

// Reuses Home's EditorialHero teal/mint pair exactly (see ActDetailHero.tsx
// for the same constants) -- the reference's three-tone look (dark teal
// ground, a muted mid-tone fill for icons/bars, a bright mint border and
// center tile) is built from ONE existing token (MINT) at different
// opacities, rather than introducing a second green.
const TEAL = "#0A363A";
const MINT = "#68FFAD";
const MINT_BORDER = "rgba(104, 255, 173, 0.32)";
const MINT_FILL = "rgba(104, 255, 173, 0.62)";

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

// Every stacked pair below (same left/width, one directly under the
// other) sits edge-to-edge with zero space between: the top box's
// height is extended down to exactly the bottom box's top, closing what
// was a small gap in the reference's raw measurements. See
// SnapshotIconBox/SnapshotDetailBox's roundedEdges -- the top box of
// each pair rounds only its top corners and carries the shared border
// on all four sides, the bottom box rounds only its bottom corners and
// omits its own top border, so the seam between them reads as one line
// rather than a doubled one.
const ICON_TOP_LEFT: BoxSpec = { left: 0, top: 0, width: 36.09, height: 30.69 };
const DETAIL_TOP_LEFT: BoxSpec = { left: 0, top: 30.69, width: 36.09, height: 30.13 };
const ICON_TOP_MID: BoxSpec = { left: 41.09, top: 0, width: 20.61, height: 41.29 };
// Same width/height as ICON_TOP_MID (the "left side" vertical box it's
// joined to), positioned flush against its right edge with zero gap --
// replaces what used to be two stacked square boxes here.
const DETAIL_TOP_RIGHT: BoxSpec = { left: ICON_TOP_MID.left + ICON_TOP_MID.width, top: 0, width: 38.07, height: 41.29 };
const CENTER: BoxSpec = { left: 41.09, top: 45.76, width: 15.95, height: 14.84 };
// Equal heights -- split the pair's combined span (45.76 to 100) evenly
// so both boxes in this column match.
const DETAIL_RIGHT: BoxSpec = { left: 61.7, top: 45.76, width: 38.07, height: 27.12 };
const ICON_BOTTOM_RIGHT: BoxSpec = { left: 61.7, top: 72.88, width: 38.07, height: 27.12 };
const ICON_BOTTOM_WIDE: BoxSpec = { left: 0, top: 65.62, width: 56.81, height: 17.75 };
const DETAIL_BOTTOM_WIDE: BoxSpec = { left: 0, top: 83.37, width: 56.81, height: 16.63 };

function boxStyle(box: BoxSpec): CSSProperties {
  return {
    position: "absolute",
    left: `${box.left}%`,
    top: `${box.top}%`,
    width: `${box.width}%`,
    height: `${box.height}%`,
  };
}

// A "side" value marks which border a box in an attached pair omits (so
// the shared seam isn't drawn twice); every box's corners -- outer and
// joint alike -- round by the same BOX_RADIUS regardless.
type RoundedEdges = "all" | "top" | "bottom";

const BOX_RADIUS = 12;

// "top" carries the shared border on all four sides (its own bottom
// edge doubles as the seam line); "bottom" omits its top border so
// that seam isn't drawn twice.
function edgeStyle(roundedEdges: RoundedEdges): CSSProperties {
  const border = `1.75px solid ${MINT_BORDER}`;
  const borderStyle: CSSProperties =
    roundedEdges === "bottom" ? { borderLeft: border, borderRight: border, borderBottom: border } : { border };
  return { ...borderStyle, borderRadius: BOX_RADIUS };
}

// ---- Entrance/exit swap choreography -------------------------------
//
// Each of the 4 pairs' icon card and text card begin swapped -- the
// icon card sitting at its text card's final slot and vice versa --
// and animate back to their own true position, so the entrance reads
// as "these two pieces trade places to form the collage" rather than
// a plain fade-in. `swapRatio` expresses that starting offset as a
// CSS `transform: translate(%, %)` pair, which is relative to the
// MOVING element's own box (not the container) -- since a box's own
// pixel width/height is itself a fixed fraction of the container's
// pixel width/height, that container size cancels out of the ratio,
// so this is a plain compile-time constant. No runtime measurement
// (ResizeObserver etc.) is needed, it's SSR-safe, and it animates
// `transform`/`opacity` only (compositor-friendly, no layout shift).
function swapRatio(from: BoxSpec, to: BoxSpec): { x: number; y: number } {
  return {
    x: ((to.left - from.left) / from.width) * 100,
    y: ((to.top - from.top) / from.height) * 100,
  };
}

const DATE_ICON_SWAP = swapRatio(ICON_TOP_LEFT, DETAIL_TOP_LEFT);
const DATE_TEXT_SWAP = swapRatio(DETAIL_TOP_LEFT, ICON_TOP_LEFT);
const LOCATION_ICON_SWAP = swapRatio(ICON_TOP_MID, DETAIL_TOP_RIGHT);
const LOCATION_TEXT_SWAP = swapRatio(DETAIL_TOP_RIGHT, ICON_TOP_MID);
const ACT_ICON_SWAP = swapRatio(ICON_BOTTOM_RIGHT, DETAIL_RIGHT);
const ACT_TEXT_SWAP = swapRatio(DETAIL_RIGHT, ICON_BOTTOM_RIGHT);
const PARTNER_ICON_SWAP = swapRatio(ICON_BOTTOM_WIDE, DETAIL_BOTTOM_WIDE);
const PARTNER_TEXT_SWAP = swapRatio(DETAIL_BOTTOM_WIDE, ICON_BOTTOM_WIDE);

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
const PAIR_COUNT = 4;
// Entry is paced to the reference video: the four pairs pop in one after
// another (~1.9s end to end, AiA tile already in place). Exit is a
// separate, deliberate beat: once the entry has settled the boxes HOLD,
// and on the visitor's next action they all collapse back into the AiA
// tile (see the phase machine in ActSnapshot).
const PAIRS_START_MS = 350;
const PAIR_ENTER_STAGGER_MS = 250;
const DURATION_MS = 800;
const SETTLE_MS = PAIRS_START_MS + (PAIR_COUNT - 1) * PAIR_ENTER_STAGGER_MS + DURATION_MS;
const COLLAPSE_MS = 700;
const COLLAPSE_STAGGER_MS = 50;
// How long a collapse blocks further downward scrolling: its own length
// plus a beat, which also absorbs trailing trackpad momentum.
const COLLAPSE_LOCK_MS = (PAIR_COUNT - 1) * COLLAPSE_STAGGER_MS + COLLAPSE_MS + 350;
// A calm, slightly snappy ease-out (no bounce/elastic) for the
// "editorial, premium, precise" motion character.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLLAPSE_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

// hidden: boxes waiting at their swapped slots, invisible (before the
// panel is on screen). entered: the settled collage. collapsed: every box
// has drawn back into the AiA tile, which stays on its own.
type Phase = "hidden" | "entered" | "collapsed";

interface Motion {
  phase: Phase;
  reducedMotion: boolean;
  swap: { x: number; y: number };
  collapse: { x: number; y: number };
  delayMs: number;
}

// Every state uses the same transform function list (translate + scale)
// so CSS interpolates between any two of them.
function motionStyle({ phase, reducedMotion, swap, collapse, delayMs }: Motion): CSSProperties {
  if (reducedMotion) return { transform: "none", opacity: 1 };
  if (phase === "hidden") {
    // Reset instantly (the panel is off screen whenever this applies).
    return { transform: `translate(${swap.x}%, ${swap.y}%) scale(1)`, opacity: 0, transition: "none" };
  }
  if (phase === "entered") {
    return {
      transform: "translate(0%, 0%) scale(1)",
      opacity: 1,
      transition: `transform ${DURATION_MS}ms ${EASE} ${delayMs}ms, opacity ${DURATION_MS}ms ${EASE} ${delayMs}ms`,
      willChange: "transform, opacity",
    };
  }
  return {
    transform: `translate(${collapse.x}%, ${collapse.y}%) scale(0.15)`,
    opacity: 0,
    transition: `transform ${COLLAPSE_MS}ms ${COLLAPSE_EASE} ${delayMs}ms, opacity ${COLLAPSE_MS}ms ${COLLAPSE_EASE} ${delayMs}ms`,
    willChange: "transform, opacity",
  };
}

// Entrance delay ascends pair by pair; the collapse runs the pairs in the
// reverse order (last pair in is first to draw back), nearly together.
function pairDelay(index: number, phase: Phase, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return phase === "collapsed" ? (PAIR_COUNT - 1 - index) * COLLAPSE_STAGGER_MS : PAIRS_START_MS + index * PAIR_ENTER_STAGGER_MS;
}

// Offset (as translate %, relative to the moving box's own size) that
// carries a box's centre onto the AiA tile's centre.
function collapseRatio(from: BoxSpec): { x: number; y: number } {
  return {
    x: ((CENTER.left + CENTER.width / 2 - (from.left + from.width / 2)) / from.width) * 100,
    y: ((CENTER.top + CENTER.height / 2 - (from.top + from.height / 2)) / from.height) * 100,
  };
}

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;

function SnapshotIconBox({
  box,
  icon: Icon,
  roundedEdges = "all",
  motion,
}: {
  box: BoxSpec;
  icon: IconComponent;
  roundedEdges?: RoundedEdges;
  motion: Motion;
}) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ ...boxStyle(box), ...edgeStyle(roundedEdges), ...motionStyle(motion) }}
    >
      <Icon size={32} strokeWidth={1.75} color={MINT_FILL} />
    </div>
  );
}

// Abyssale-style typographic highlight -- NOT a button/pill/capsule.
// Flat mint fill sized to hug the text tightly (small radius, tight
// padding), dark-teal Inter text, never white text, never a fully
// rounded end. No max-width clamp: a clamp here would shrink the
// highlight's own background below its text's natural width, leaving
// the tail of the text rendered past the (now-narrower) mint fill --
// invisible, since the text color is the same dark teal as the card
// background behind it. Font-size/padding are sized instead so every
// highlight's true content width fits inside its card at the card's
// own fixed geometry.
function TextBar({ children }: { children: ReactNode }) {
  return (
    <span
      className={`${inter.className} inline-flex w-fit items-center whitespace-nowrap`}
      style={{
        background: MINT,
        color: TEAL,
        fontWeight: 600,
        fontSize: "clamp(8px, 3.1cqw, 10px)",
        lineHeight: 1.25,
        padding: "2px 6px",
        borderRadius: 5,
      }}
    >
      {children}
    </span>
  );
}

function SnapshotDetailBox({
  box,
  children,
  roundedEdges = "all",
  align = "start",
  motion,
}: {
  box: BoxSpec;
  children: ReactNode;
  roundedEdges?: RoundedEdges;
  align?: "start" | "center";
  motion: Motion;
}) {
  return (
    <div
      className={`flex flex-col justify-center gap-1.5 px-2 ${align === "center" ? "items-center" : "items-start"}`}
      style={{ ...boxStyle(box), ...edgeStyle(roundedEdges), ...motionStyle(motion) }}
    >
      {children}
    </div>
  );
}

function SnapshotCenter() {
  return (
    <div
      className="flex items-center justify-center"
      style={{ ...boxStyle(CENTER), background: MINT, borderRadius: BOX_RADIUS, zIndex: 2 }}
    >
      <span style={{ fontFamily: "var(--font-display), serif", fontWeight: 700, fontSize: "1.4em", color: TEAL }}>
        AiA
      </span>
    </div>
  );
}

/**
 * Act Detail's Act Snapshot: a fixed, non-grid composition of four
 * icon-card + text-highlight-card pairs (Date, Location, Act, Verified
 * Partner) surrounding a central AiA tile, reproducing the reference's
 * exact measured geometry -- box positions/sizes are percentages of one
 * aspect-ratio container (859:896, the reference's own content bounding
 * box), so the whole arrangement scales together rather than reflowing
 * into an ordinary card grid at any width. Teal/mint reuse ActDetailHero's
 * exact tokens; highlight copy is Inter (Medium/SemiBold), never the
 * page's editorial serif.
 *
 * Scroll-triggered: each pair's icon/text boxes start swapped (see
 * swapRatio) and animate to their true position when the section enters
 * the viewport, reversing the same transition when it leaves -- see
 * the module-level "Entrance/exit swap choreography" comment. Skipped
 * entirely under prefers-reduced-motion, which jumps straight to the
 * settled static collage.
 *
 * No background/rounding/padding of its own -- ActDetailHero renders
 * this directly inside its own single continuous teal surface (photo ->
 * eyebrow/title/description -> this collage -> close), so it must read
 * as a continuation of that surface, not a second nested card.
 */
export function ActSnapshot({ actId }: { actId: string }) {
  const isAnnadhanamElders = actId === ANNADHANAM_ELDERS_ACT_ID;
  const panelRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer
  );
  const [phase, setPhase] = useState<Phase>("hidden");
  // Under reduced motion the collage is simply the settled static collage.
  const shownPhase: Phase = reducedMotion ? "entered" : phase;

  // Refs mirror the state for the observer and the gesture handlers, which
  // outlive any one render.
  const phaseRef = useRef<Phase>("hidden");
  const panelFullRef = useRef(false);
  const settledRef = useRef(false);
  const lockUntilRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (reducedMotion) return;
    const node = panelRef.current;
    if (!node) return;

    function go(next: Phase) {
      phaseRef.current = next;
      setPhase(next);
    }

    // The collage lives in a full-screen panel; the entry plays only once
    // (almost) the whole panel is on screen, so the full screen always
    // appears first. Leaving the panel (below EXIT_RATIO) resets it so the
    // entry plays again on return -- two thresholds, no flicker. On a
    // viewport shorter than the panel the full ratio can't be reached, so
    // the entry bar scales down to what is reachable (never below half).
    const observer = new IntersectionObserver(
      ([entry]) => {
        const reachable = Math.min(1, window.innerHeight / entry.boundingClientRect.height);
        const enterAt = Math.max(0.5, Math.min(ENTER_RATIO, reachable * ENTER_RATIO));
        const ratio = entry.intersectionRatio;
        panelFullRef.current = ratio >= enterAt;

        if (ratio >= enterAt && phaseRef.current === "hidden") {
          go("entered");
          settledRef.current = false;
          clearTimeout(settleTimerRef.current);
          settleTimerRef.current = setTimeout(() => {
            settledRef.current = true;
          }, SETTLE_MS);
        } else if (ratio < EXIT_RATIO && phaseRef.current !== "hidden") {
          clearTimeout(settleTimerRef.current);
          settledRef.current = false;
          go("hidden");
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    observer.observe(node);

    // "Next action" = the visitor's first attempt to scroll on past the
    // panel. While the entry is still playing it is held back; once the
    // collage has settled, that first gesture is swallowed and instead
    // collapses every box into the AiA tile, and further downward scrolling
    // stays blocked until the collapse has finished. Upward scrolling is
    // never touched.
    function onDownwardIntent(event: Event) {
      if (!panelFullRef.current) return;
      const now = performance.now();
      if (phaseRef.current === "entered") {
        if (event.cancelable) event.preventDefault();
        if (settledRef.current && now >= lockUntilRef.current) {
          go("collapsed");
          lockUntilRef.current = now + COLLAPSE_LOCK_MS;
        }
      } else if (phaseRef.current === "collapsed" && now < lockUntilRef.current) {
        if (event.cancelable) event.preventDefault();
      }
    }
    function onWheel(event: WheelEvent) {
      if (event.deltaY > 0) onDownwardIntent(event);
    }
    let touchStartY = 0;
    function onTouchStart(event: TouchEvent) {
      touchStartY = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      const y = event.touches[0]?.clientY ?? touchStartY;
      if (touchStartY - y > 6) onDownwardIntent(event);
    }
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      observer.disconnect();
      clearTimeout(settleTimerRef.current);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [reducedMotion]);

  function pairMotion(index: number, swap: { x: number; y: number }, box: BoxSpec): Motion {
    return {
      phase: shownPhase,
      reducedMotion,
      swap,
      collapse: collapseRatio(box),
      delayMs: pairDelay(index, shownPhase, reducedMotion),
    };
  }

  return (
    // Outer padding is 1.5x the original px-5/pb-7/pt-1 (20/28/4px), per
    // request to increase the collage's outer space by 50%.
    // min-h-[100svh] + centered: the collage owns one whole screen.
    <div ref={panelRef} className="flex min-h-[100svh] items-center px-[30px] py-[42px]">
      <div className="relative mx-auto w-full" style={{ aspectRatio: "859 / 896", containerType: "inline-size" }}>
        {/* Date */}
        <SnapshotIconBox
          box={ICON_TOP_LEFT}
          icon={Calendar}
          roundedEdges="top"
          motion={pairMotion(0, DATE_ICON_SWAP, ICON_TOP_LEFT)}
        />
        <SnapshotDetailBox box={DETAIL_TOP_LEFT} roundedEdges="bottom" motion={pairMotion(0, DATE_TEXT_SWAP, DETAIL_TOP_LEFT)}>
          <TextBar>28 September</TextBar>
          <TextBar>Monday</TextBar>
        </SnapshotDetailBox>

        {/* Location -- three lines */}
        <SnapshotIconBox box={ICON_TOP_MID} icon={MapPin} motion={pairMotion(1, LOCATION_ICON_SWAP, ICON_TOP_MID)} />
        <SnapshotDetailBox box={DETAIL_TOP_RIGHT} motion={pairMotion(1, LOCATION_TEXT_SWAP, DETAIL_TOP_RIGHT)}>
          {isAnnadhanamElders ? (
            <>
              <TextBar>Sreenivasanallur</TextBar>
              <TextBar>Kumbakonam</TextBar>
              <TextBar>Thanjavur</TextBar>
            </>
          ) : (
            <>
              <TextBar>Alangulam</TextBar>
              <TextBar>Thanjavur</TextBar>
              <TextBar>Tamil Nadu</TextBar>
            </>
          )}
        </SnapshotDetailBox>

        <SnapshotCenter />

        {/* Act / Impact -- first line stays on one line, second line centered beneath */}
        <SnapshotDetailBox box={DETAIL_RIGHT} roundedEdges="top" align="center" motion={pairMotion(2, ACT_TEXT_SWAP, DETAIL_RIGHT)}>
          {isAnnadhanamElders ? (
            <>
              <TextBar>45 elders</TextBar>
              <TextBar>served with care</TextBar>
            </>
          ) : (
            <>
              <TextBar>25 native saplings</TextBar>
              <TextBar>planted</TextBar>
            </>
          )}
        </SnapshotDetailBox>
        <SnapshotIconBox
          box={ICON_BOTTOM_RIGHT}
          icon={isAnnadhanamElders ? UtensilsCrossed : Sprout}
          roundedEdges="bottom"
          motion={pairMotion(2, ACT_ICON_SWAP, ICON_BOTTOM_RIGHT)}
        />

        {/* Verified Partner */}
        <SnapshotIconBox
          box={ICON_BOTTOM_WIDE}
          icon={BadgeCheck}
          roundedEdges="top"
          motion={pairMotion(3, PARTNER_ICON_SWAP, ICON_BOTTOM_WIDE)}
        />
        <SnapshotDetailBox box={DETAIL_BOTTOM_WIDE} roundedEdges="bottom" motion={pairMotion(3, PARTNER_TEXT_SWAP, DETAIL_BOTTOM_WIDE)}>
          {isAnnadhanamElders ? (
            <>
              <TextBar>Annai Aravindhar</TextBar>
              <TextBar>Karunai Illam</TextBar>
            </>
          ) : (
            <TextBar>Iyal Impact Foundation</TextBar>
          )}
        </SnapshotDetailBox>
      </div>
    </div>
  );
}
