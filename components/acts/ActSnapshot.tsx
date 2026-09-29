import type { CSSProperties, ComponentType, ReactNode } from "react";
import { Inter } from "next/font/google";
import { Calendar, MapPin, BadgeCheck, Sprout } from "lucide-react";

const inter = Inter({ subsets: ["latin"], weight: ["500", "600"], display: "swap" });

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
// Equal heights (was 25.78/28.46) -- split the pair's combined span
// (45.76 to 100, unchanged) evenly so both boxes in this column match.
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

type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;

function SnapshotIconBox({
  box,
  icon: Icon,
  roundedEdges = "all",
}: {
  box: BoxSpec;
  icon: IconComponent;
  roundedEdges?: RoundedEdges;
}) {
  return (
    <div className="flex items-center justify-center" style={{ ...boxStyle(box), ...edgeStyle(roundedEdges) }}>
      <Icon size={32} strokeWidth={1.75} color={MINT_FILL} />
    </div>
  );
}

// Abyssale-style text bar: flat mint fill, dark-teal Inter text, a small
// rectangular radius rather than a fully rounded pill/capsule, sized to
// its own content -- never white text, never border-radius: 9999px. No
// max-width clamp: a clamp here would shrink the bar's own background
// below its text's natural width, leaving the tail of the text rendered
// past the (now-narrower) mint fill -- invisible, since the text color
// is the same dark teal as the card background behind it. Compact
// font-size/padding below are sized instead so every bar's true content
// width fits inside its card at the card's own fixed geometry.
function TextBar({ children }: { children: ReactNode }) {
  return (
    <span
      className={`${inter.className} inline-flex w-fit items-center whitespace-nowrap`}
      style={{
        background: MINT,
        color: TEAL,
        fontWeight: 600,
        fontSize: 10,
        lineHeight: 1.3,
        padding: "5px 8px",
        borderRadius: 4,
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
}: {
  box: BoxSpec;
  children: ReactNode;
  roundedEdges?: RoundedEdges;
}) {
  return (
    <div
      className="flex flex-col items-start justify-center gap-2 px-3"
      style={{ ...boxStyle(box), ...edgeStyle(roundedEdges) }}
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
 * icon-card + text-bar-card pairs (Date, Location, Act, Verified Partner)
 * surrounding a central AiA tile, reproducing the reference's exact
 * measured geometry -- box positions/sizes are percentages of one
 * aspect-ratio container (859:896, the reference's own content bounding
 * box), so the whole arrangement scales together rather than reflowing
 * into an ordinary card grid at any width. Teal/mint reuse ActDetailHero's
 * exact tokens; text-bar copy is Inter (Medium/SemiBold), never the page's
 * editorial serif.
 *
 * No background/rounding/padding of its own -- ActDetailHero renders
 * this directly inside its own single continuous teal surface (photo ->
 * eyebrow/title/description -> this collage -> close), so it must read
 * as a continuation of that surface, not a second nested card.
 */
export function ActSnapshot() {
  return (
    // Outer padding is 1.5x the original px-5/pb-7/pt-1 (20/28/4px), per
    // request to increase the collage's outer space by 50%.
    <div className="px-[30px] pb-[42px] pt-[6px]">
      <div className="relative mx-auto w-full" style={{ aspectRatio: "859 / 896" }}>
        {/* Date */}
        <SnapshotIconBox box={ICON_TOP_LEFT} icon={Calendar} roundedEdges="top" />
        <SnapshotDetailBox box={DETAIL_TOP_LEFT} roundedEdges="bottom">
          <TextBar>28 September</TextBar>
          <TextBar>Monday</TextBar>
        </SnapshotDetailBox>

        {/* Location -- exactly two bars */}
        <SnapshotIconBox box={ICON_TOP_MID} icon={MapPin} />
        <SnapshotDetailBox box={DETAIL_TOP_RIGHT}>
          <TextBar>Alangulam</TextBar>
          <TextBar>Thanjavur</TextBar>
        </SnapshotDetailBox>

        <SnapshotCenter />

        {/* Act */}
        <SnapshotDetailBox box={DETAIL_RIGHT} roundedEdges="top">
          <TextBar>25 native</TextBar>
          <TextBar>saplings</TextBar>
        </SnapshotDetailBox>
        <SnapshotIconBox box={ICON_BOTTOM_RIGHT} icon={Sprout} roundedEdges="bottom" />

        {/* Verified Partner */}
        <SnapshotIconBox box={ICON_BOTTOM_WIDE} icon={BadgeCheck} roundedEdges="top" />
        <SnapshotDetailBox box={DETAIL_BOTTOM_WIDE} roundedEdges="bottom">
          <TextBar>Iyal Impact Foundation</TextBar>
        </SnapshotDetailBox>
      </div>
    </div>
  );
}
