import Link from "next/link";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

export interface EditorialActCardProps {
  actId: string;
  title: string;
  description?: string;
  placeName: string;
  photoUrls: string[];
  lat: number | null;
  lng: number | null;
}

const CARD_PADDING = 10;
const HERO_H = 176;

// Pale botanical mint -- the Iyal Impact reference's own background tone,
// distinct from the app's page background, since this hero panel now
// carries that reference's brand treatment literally (logo + palette),
// not just its compositional language.
const IYAL_BG = "#EAF2EC";
const IYAL_DARK_GREEN = "#1F3D2B";
const IYAL_MID_GREEN = "#2F5B3E";
const IYAL_MUTED_GREEN = "#5B7A63";
const IYAL_ORANGE = "#E2963C";

// Left = a large, quiet logo zone (~46% of the hero's width); right = an
// oversized, staggered photo collage that fills the rest and bleeds past
// the panel's own top, right and bottom edges -- the panel is a WINDOW
// onto a larger collage, not a grid sized to fit inside it. Column widths
// are percentages of the hero's own (fluid) width so the composition
// holds its proportions at any card width; only row heights/offsets are
// fixed pixels.
const LOGO_ZONE_W = "46%";
const COLLAGE_LEFT = "46%";
const COL_GAP = 8;
const COL_W = `calc(27% - ${COL_GAP / 2}px)`;
const COL2_LEFT = `calc(73% + ${COL_GAP / 2}px)`;

const TILE_GAP = 6;
const TOP_BLEED = 10;
const BOTTOM_BLEED = 14;
const RIGHT_BLEED = 22;
const STAGGER = 16; // vertical offset between the two columns' bands
const TILE_RADIUS = 16;

// Column 1: small accent tile (cropped top) -> dominant photo -> small
// photo (cropped bottom). Column 2, staggered down by STAGGER: small
// photo (cropped top) -> one tall dominant photo that bleeds past both
// the hero's bottom AND right edges -- mirroring the reference's two
// intentionally-cropped edges on its rightmost panel.
const col1TileA = { top: -TOP_BLEED, height: 34 };
const col1TileB = { top: col1TileA.top + col1TileA.height + TILE_GAP, height: 110 };
const col1TileC = {
  top: col1TileB.top + col1TileB.height + TILE_GAP,
  height: HERO_H - (col1TileB.top + col1TileB.height + TILE_GAP) + BOTTOM_BLEED,
};

const col2TileD = { top: -TOP_BLEED + STAGGER, height: 34 };
const col2TileE = {
  top: col2TileD.top + col2TileD.height + TILE_GAP,
  height: HERO_H - (col2TileD.top + col2TileD.height + TILE_GAP) + BOTTOM_BLEED,
};

function IyalMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden>
      <circle cx="20" cy="6" r="4" fill={IYAL_ORANGE} />
      <path
        d="M20 12C11 12 6 19 6 28C6 28 14 30 20 24C26 30 34 28 34 28C34 19 29 12 20 12Z"
        fill={IYAL_MID_GREEN}
      />
      <path
        d="M20 15C16 17 14 21 14 26C14 26 18 27 20 23C22 27 26 26 26 26C26 21 24 17 20 15Z"
        fill={IYAL_DARK_GREEN}
      />
    </svg>
  );
}

/**
 * The Acts Feed's editorial card. The hero visual is now the literal Iyal
 * Impact Foundation brand treatment (per direct reference, not just its
 * style): a quiet logo zone filling the left ~46% of the panel, and an
 * oversized, staggered photo collage filling the right side that bleeds
 * past the panel's own top, right and bottom edges -- the panel reads as
 * a cropped window onto a larger collage, not a grid sized to fit inside
 * it. placeName/photoUrls/lat/lng are intentionally unused here (this
 * hero is a fixed brand visual, not derived from the Act's own data) but
 * stay in the prop type for caller compatibility. Straight into a large
 * punchy headline and a short description below -- no eyebrow, no
 * category label, no metadata row.
 */
export function EditorialActCard({ actId, title, description }: EditorialActCardProps) {
  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[12px] bg-white shadow-[0_2px_14px_rgba(43,42,38,0.08)] transition-shadow duration-200 active:shadow-[0_8px_22px_rgba(43,42,38,0.14)]"
      style={{ padding: CARD_PADDING }}
    >
      <div className="relative w-full overflow-hidden rounded-[20px]" style={{ height: HERO_H, background: IYAL_BG }}>
        <div
          className="absolute left-0 top-0 flex items-center justify-center gap-2"
          style={{ width: LOGO_ZONE_W, height: HERO_H }}
        >
          <IyalMark />
          <div className="flex flex-col">
            <span className={`${inter.className}`} style={{ fontSize: 15, fontWeight: 700, color: IYAL_DARK_GREEN, lineHeight: 1.1 }}>
              iyal impact
            </span>
            <span
              className={`${inter.className}`}
              style={{ fontSize: 7, fontWeight: 600, letterSpacing: "1.6px", color: IYAL_MUTED_GREEN, marginTop: 3 }}
            >
              FOUNDATION
            </span>
          </div>
        </div>

        <div className="absolute top-0" style={{ left: COLLAGE_LEFT, width: "54%", height: HERO_H }}>
          <div
            className="absolute z-[2] flex overflow-hidden"
            style={{ left: 0, top: col1TileA.top, width: COL_W, height: col1TileA.height, borderRadius: TILE_RADIUS }}
          >
            <div style={{ width: "44%", height: "100%", background: IYAL_ORANGE }} />
            <div style={{ width: "56%", height: "100%", background: IYAL_DARK_GREEN }} />
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mock/iyal-hands-soil.jpg"
            alt=""
            className="absolute z-[2] object-cover"
            style={{ left: 0, top: col1TileB.top, width: COL_W, height: col1TileB.height, borderRadius: TILE_RADIUS }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mock/iyal-leaves.jpg"
            alt=""
            className="absolute z-[2] object-cover"
            style={{ left: 0, top: col1TileC.top, width: COL_W, height: col1TileC.height, borderRadius: TILE_RADIUS }}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mock/iyal-leaf-dark.jpg"
            alt=""
            className="absolute z-[2] object-cover"
            style={{ left: COL2_LEFT, top: col2TileD.top, width: COL_W, height: col2TileD.height, borderRadius: TILE_RADIUS }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mock/iyal-sapling.jpg"
            alt=""
            className="absolute z-[2] object-cover"
            style={{
              left: COL2_LEFT,
              top: col2TileE.top,
              width: `calc(${COL_W} + ${RIGHT_BLEED}px)`,
              height: col2TileE.height,
              borderRadius: TILE_RADIUS,
            }}
          />
        </div>
      </div>

      <h2 className={`${calSans.className} m-0`} style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-0.4px", color: "#221F1A", marginTop: 28 }}>
        {title}
      </h2>
      {description && (
        <p className={`${inter.className} m-0`} style={{ fontSize: 14.5, lineHeight: 1.6, color: "#7D7A70", marginTop: 10 }}>
          {description}
        </p>
      )}
    </Link>
  );
}
