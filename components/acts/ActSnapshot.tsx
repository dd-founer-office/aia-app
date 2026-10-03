"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ComponentType, ReactNode } from "react";
import localFont from "next/font/local";
import { Calendar, MapPin, BadgeCheck, Sprout } from "lucide-react";

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
const ICON_TOP_MID: BoxSpec = { left: 41.09, top: 0, width: 29.34, height: 41.29 };
// Same width/height as ICON_TOP_MID (the "left side" vertical box it's
// joined to), positioned flush against its right edge with zero gap --
// replaces what used to be two stacked square boxes here.
const DETAIL_TOP_RIGHT: BoxSpec = { left: ICON_TOP_MID.left + ICON_TOP_MID.width, top: 0, width: 29.34, height: 41.29 };
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

const PAIR_COUNT = 4;
const STAGGER_MS = 90;
const DURATION_MS = 650;
// A calm, slightly snappy ease-out (no bounce/elastic) for the
// "editorial, premium, precise" motion character.
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

interface Motion {
  entered: boolean;
  reducedMotion: boolean;
  swap: { x: number; y: number };
  delayMs: number;
  scale?: number;
}

// Same transition plays both ways: toggling `entered` from false->true
// is the entrance, true->false is the exit, so the exit is always
// exactly the entrance in reverse rather than a separate animation.
// Start and end must use the SAME transform function (both translate()
// or both scale()) -- CSS can't reliably interpolate between mismatched
// transform functions, so a box either translates throughout (the pair
// swap) or scales throughout (the center mark), never a mix of the two.
function motionStyle({ entered, reducedMotion, swap, delayMs, scale }: Motion): CSSProperties {
  if (reducedMotion) return { transform: "none", opacity: 1 };
  const transform =
    scale !== undefined
      ? `scale(${entered ? 1 : scale})`
      : `translate(${entered ? 0 : swap.x}%, ${entered ? 0 : swap.y}%)`;
  return {
    transform,
    opacity: entered ? 1 : 0,
    transition: `transform ${DURATION_MS}ms ${EASE} ${delayMs}ms, opacity ${DURATION_MS}ms ${EASE} ${delayMs}ms`,
    willChange: "transform, opacity",
  };
}

// Pair index -> delay: ascending on entrance (0, 90, 180, 270ms) so the
// pairs settle in sequence; the exact same indices but reversed on exit
// (270, 180, 90, 0ms), so whichever pair *finished* entering last is
// the *first* to leave -- a true last-in-first-out reversal, not just
// the entrance played at random.
function pairDelay(index: number, entered: boolean, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return (entered ? index : PAIR_COUNT - 1 - index) * STAGGER_MS;
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
        fontSize: 10,
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
      className={`flex flex-col justify-center gap-1.5 px-3 ${align === "center" ? "items-center" : "items-start"}`}
      style={{ ...boxStyle(box), ...edgeStyle(roundedEdges), ...motionStyle(motion) }}
    >
      {children}
    </div>
  );
}

function SnapshotCenter({ motion }: { motion: Motion }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ ...boxStyle(CENTER), background: MINT, borderRadius: BOX_RADIUS, zIndex: 2, ...motionStyle(motion) }}
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
export function ActSnapshot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotionChanges,
    readReducedMotionOnClient,
    readReducedMotionOnServer
  );
  const [intersecting, setIntersecting] = useState(false);
  // Under reduced motion the collage is just always "entered" -- no
  // observer needed, and this keeps the setState call confined to the
  // IntersectionObserver's own callback (the approved place for it),
  // never called synchronously from an effect body.
  const entered = reducedMotion || intersecting;

  useEffect(() => {
    if (reducedMotion) return;
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), {
      threshold: 0.25,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  function pairMotion(index: number, swap: { x: number; y: number }): Motion {
    return { entered, reducedMotion, swap, delayMs: pairDelay(index, entered, reducedMotion) };
  }

  // The center mark is the capstone: it settles in only after every
  // pair has, and on exit it's the first thing to go -- a subtle scale
  // (never a translate, it doesn't have a "swap" partner) keeps it
  // "calm" rather than a dramatic pop.
  const centerMotion: Motion = {
    entered,
    reducedMotion,
    swap: { x: 0, y: 0 },
    delayMs: reducedMotion ? 0 : entered ? PAIR_COUNT * STAGGER_MS : 0,
    scale: entered ? 1 : 0.92,
  };

  return (
    // Outer padding is 1.5x the original px-5/pb-7/pt-1 (20/28/4px), per
    // request to increase the collage's outer space by 50%.
    <div className="px-[30px] pb-[42px] pt-[6px]">
      <div ref={containerRef} className="relative mx-auto w-full" style={{ aspectRatio: "859 / 896" }}>
        {/* Date */}
        <SnapshotIconBox
          box={ICON_TOP_LEFT}
          icon={Calendar}
          roundedEdges="top"
          motion={pairMotion(0, DATE_ICON_SWAP)}
        />
        <SnapshotDetailBox box={DETAIL_TOP_LEFT} roundedEdges="bottom" motion={pairMotion(0, DATE_TEXT_SWAP)}>
          <TextBar>28 September</TextBar>
          <TextBar>Monday</TextBar>
        </SnapshotDetailBox>

        {/* Location -- three lines */}
        <SnapshotIconBox box={ICON_TOP_MID} icon={MapPin} motion={pairMotion(1, LOCATION_ICON_SWAP)} />
        <SnapshotDetailBox box={DETAIL_TOP_RIGHT} motion={pairMotion(1, LOCATION_TEXT_SWAP)}>
          <TextBar>Alangulam</TextBar>
          <TextBar>Thanjavur</TextBar>
          <TextBar>Tamil Nadu</TextBar>
        </SnapshotDetailBox>

        <SnapshotCenter motion={centerMotion} />

        {/* Act / Impact -- "25 native saplings" stays on one line, "planted" centered beneath */}
        <SnapshotDetailBox box={DETAIL_RIGHT} roundedEdges="top" align="center" motion={pairMotion(2, ACT_TEXT_SWAP)}>
          <TextBar>25 native saplings</TextBar>
          <TextBar>planted</TextBar>
        </SnapshotDetailBox>
        <SnapshotIconBox
          box={ICON_BOTTOM_RIGHT}
          icon={Sprout}
          roundedEdges="bottom"
          motion={pairMotion(2, ACT_ICON_SWAP)}
        />

        {/* Verified Partner */}
        <SnapshotIconBox
          box={ICON_BOTTOM_WIDE}
          icon={BadgeCheck}
          roundedEdges="top"
          motion={pairMotion(3, PARTNER_ICON_SWAP)}
        />
        <SnapshotDetailBox box={DETAIL_BOTTOM_WIDE} roundedEdges="bottom" motion={pairMotion(3, PARTNER_TEXT_SWAP)}>
          <TextBar>Iyal Impact Foundation</TextBar>
        </SnapshotDetailBox>
      </div>
    </div>
  );
}
