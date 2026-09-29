import type { CSSProperties, ReactNode } from "react";
import { Image as ImageIcon } from "lucide-react";

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
// is exactly where and how large it is in the reference; only the
// placeholder content inside each is temporary.
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

function SnapshotIconBox({ box, roundedEdges = "all" }: { box: BoxSpec; roundedEdges?: RoundedEdges }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ ...boxStyle(box), ...edgeStyle(roundedEdges) }}
    >
      <ImageIcon size={32} strokeWidth={1.75} color={MINT_FILL} />
    </div>
  );
}

function Bar({ width, bold = false }: { width: string; bold?: boolean }) {
  return (
    <div
      className="rounded-full"
      style={{ width, height: bold ? 16 : 10, background: MINT_FILL, flexShrink: 0 }}
    />
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
      className="flex flex-col justify-center gap-2 px-4"
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
 * quadrant groups (each an icon box and/or detail box) surrounding a
 * central AiA tile, reproducing the reference's exact measured geometry
 * -- box positions/sizes are percentages of one aspect-ratio container
 * (859:896, the reference's own content bounding box), so the whole
 * arrangement scales together rather than reflowing into an ordinary
 * card grid at any width. Teal/mint reuse ActDetailHero's exact tokens.
 * Placeholder icon (lucide's generic image glyph) and bar-shaped text
 * placeholders only -- the real date/location/partner/sapling-count
 * content and icons come in a later pass; this task locks the geometry.
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
        <SnapshotIconBox box={ICON_TOP_LEFT} roundedEdges="top" />
        <SnapshotDetailBox box={DETAIL_TOP_LEFT} roundedEdges="bottom">
          <Bar width="65%" />
          <Bar width="48%" />
          <div style={{ marginTop: 8 }}>
            <Bar width="55%" bold />
          </div>
        </SnapshotDetailBox>

        <SnapshotIconBox box={ICON_TOP_MID} />

        <SnapshotDetailBox box={DETAIL_TOP_RIGHT}>
          <Bar width="92%" />
          <Bar width="70%" />
          <Bar width="88%" />
          <Bar width="42%" />
          <div style={{ marginTop: 8 }}>
            <Bar width="68%" bold />
          </div>
        </SnapshotDetailBox>

        <SnapshotCenter />

        <SnapshotDetailBox box={DETAIL_RIGHT} roundedEdges="top">
          <Bar width="92%" />
          <Bar width="55%" />
          <div style={{ marginTop: 8 }}>
            <Bar width="68%" bold />
          </div>
        </SnapshotDetailBox>
        <SnapshotIconBox box={ICON_BOTTOM_RIGHT} roundedEdges="bottom" />

        <SnapshotIconBox box={ICON_BOTTOM_WIDE} roundedEdges="top" />
        <div
          className="flex flex-row items-center justify-between gap-4 px-4"
          style={{ ...boxStyle(DETAIL_BOTTOM_WIDE), ...edgeStyle("bottom") }}
        >
          <div className="flex flex-col gap-2">
            <Bar width="140px" />
            <Bar width="170px" />
          </div>
          <Bar width="150px" bold />
        </div>
      </div>
    </div>
  );
}
