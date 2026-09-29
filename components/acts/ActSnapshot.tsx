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

// Box radius below (rounded-[16px]) matches globals.css --radius-card.
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

const ICON_TOP_LEFT: BoxSpec = { left: 0, top: 0, width: 36.09, height: 29.69 };
const DETAIL_TOP_LEFT: BoxSpec = { left: 0, top: 30.69, width: 36.09, height: 30.13 };
const ICON_TOP_MID: BoxSpec = { left: 41.09, top: 0, width: 29.34, height: 41.29 };
const DETAIL_TOP_RIGHT_A: BoxSpec = { left: 70.78, top: 0, width: 28.99, height: 19.31 };
const DETAIL_TOP_RIGHT_B: BoxSpec = { left: 70.78, top: 20.42, width: 28.99, height: 20.87 };
const CENTER: BoxSpec = { left: 41.09, top: 45.76, width: 15.95, height: 14.84 };
const DETAIL_RIGHT: BoxSpec = { left: 61.7, top: 45.76, width: 38.07, height: 24.55 };
const ICON_BOTTOM_RIGHT: BoxSpec = { left: 61.7, top: 71.54, width: 38.07, height: 28.46 };
const ICON_BOTTOM_WIDE: BoxSpec = { left: 0, top: 65.62, width: 56.81, height: 16.74 };
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

function SnapshotIconBox({ box }: { box: BoxSpec }) {
  return (
    <div
      className="flex items-center justify-center rounded-[16px]"
      style={{ ...boxStyle(box), border: `1.5px solid ${MINT_BORDER}` }}
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

function SnapshotDetailBox({ box, children }: { box: BoxSpec; children: ReactNode }) {
  return (
    <div
      className="flex flex-col justify-center gap-2 rounded-[16px] px-4"
      style={{ ...boxStyle(box), border: `1.5px solid ${MINT_BORDER}` }}
    >
      {children}
    </div>
  );
}

function SnapshotCenter() {
  return (
    <div
      className="flex items-center justify-center rounded-[16px]"
      style={{ ...boxStyle(CENTER), background: MINT, zIndex: 2 }}
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
 * card grid at any width. Teal/mint reuse ActDetailHero's exact tokens;
 * radius matches globals.css's --radius-card. Placeholder icon (lucide's
 * generic image glyph) and bar-shaped text placeholders only -- the real
 * date/location/partner/sapling-count content and icons come in a later
 * pass; this task locks the geometry.
 */
export function ActSnapshot() {
  return (
    <section className="rounded-[16px] px-4 py-6" style={{ background: TEAL }}>
      <div className="relative mx-auto w-full" style={{ aspectRatio: "859 / 896" }}>
        <SnapshotIconBox box={ICON_TOP_LEFT} />
        <SnapshotDetailBox box={DETAIL_TOP_LEFT}>
          <Bar width="65%" />
          <Bar width="48%" />
          <div style={{ marginTop: 8 }}>
            <Bar width="55%" bold />
          </div>
        </SnapshotDetailBox>

        <SnapshotIconBox box={ICON_TOP_MID} />

        <SnapshotDetailBox box={DETAIL_TOP_RIGHT_A}>
          <Bar width="92%" />
          <Bar width="70%" />
          <Bar width="88%" />
          <Bar width="42%" />
        </SnapshotDetailBox>
        <SnapshotDetailBox box={DETAIL_TOP_RIGHT_B}>
          <Bar width="68%" bold />
        </SnapshotDetailBox>

        <SnapshotCenter />

        <SnapshotDetailBox box={DETAIL_RIGHT}>
          <Bar width="92%" />
          <Bar width="55%" />
          <div style={{ marginTop: 8 }}>
            <Bar width="68%" bold />
          </div>
        </SnapshotDetailBox>
        <SnapshotIconBox box={ICON_BOTTOM_RIGHT} />

        <SnapshotIconBox box={ICON_BOTTOM_WIDE} />
        <div
          className="flex flex-row items-center justify-between gap-4 rounded-[16px] px-4"
          style={{ ...boxStyle(DETAIL_BOTTOM_WIDE), border: `1.5px solid ${MINT_BORDER}` }}
        >
          <div className="flex flex-col gap-2">
            <Bar width="140px" />
            <Bar width="170px" />
          </div>
          <Bar width="150px" bold />
        </div>
      </div>
    </section>
  );
}
