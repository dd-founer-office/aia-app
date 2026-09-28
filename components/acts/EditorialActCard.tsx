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

const IYAL_BG = "#EFF4F2";
const IYAL_DARK_GREEN = "#1F3D2B";
const IYAL_MID_GREEN = "#2F5B3E";
const IYAL_MUTED_GREEN = "#5B7A63";
const IYAL_ORANGE = "#E2963C";
const TILE_RADIUS = 16;

// The hero is a wide, cinematic window (not a tall illustration): a fixed
// 2:1 aspect ratio, full card width, so it holds its shape at any card
// size instead of being tall enough to fit every tile.
const LOGO_ZONE_W = "50%";

// The collage is a virtual canvas MUCH larger than the visible hero --
// 165% of the hero's width, 130% of its height -- positioned so it
// overflows the hero's top, right and bottom edges. Every photo panel
// below is positioned against this canvas, not the hero itself, so the
// hero reads as a cropped window onto a larger collage rather than a
// grid sized to fit inside it. All panel geometry is expressed first in
// hero-relative percentages (matching how the reference's proportions
// were measured), then converted to canvas-relative percentages via
// toCanvasPct/toCanvasLen, since CSS percentages on an absolutely
// positioned child resolve against its own containing block (the
// canvas), not the hero.
const CANVAS_LEFT = 45;
const CANVAS_TOP = -15;
const CANVAS_W = 165;
const CANVAS_H = 130;

function toCanvasLeft(heroPct: number) {
  return `${((heroPct - CANVAS_LEFT) / CANVAS_W) * 100}%`;
}
function toCanvasTop(heroPct: number) {
  return `${((heroPct - CANVAS_TOP) / CANVAS_H) * 100}%`;
}
function toCanvasWidth(heroPct: number) {
  return `${(heroPct / CANVAS_W) * 100}%`;
}
function toCanvasHeight(heroPct: number) {
  return `${(heroPct / CANVAS_H) * 100}%`;
}

interface PanelSpec {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  z: number;
}

// Five panels, sized and placed in hero-relative percent per the
// reference's measured geometry: A is the dominant, largest, most
// legible panel; B and C are pushed past the top/right edges so only
// part of them shows; D sits mostly below the hero's bottom edge so
// only its upper slice reads; E is a small flat accent block (not a
// photo) for the "subtle earthy accent" detail. Photos are real
// annadhanam (elder meal-service) documentation -- actual evidence of
// a real Act, not stock or generated imagery.
const PANELS: PanelSpec[] = [
  { src: "/mock/annadhanam-tray-1.jpg", left: 50, top: -6, width: 27, height: 84, z: 4 },
  { src: "/mock/annadhanam-buffet.jpg", left: 72, top: -10, width: 17, height: 40, z: 3 },
  { src: "/mock/annadhanam-hall.jpg", left: 88, top: 15, width: 17, height: 75, z: 1 },
  { src: "/mock/annadhanam-trays.jpg", left: 52, top: 76, width: 34, height: 44, z: 2 },
];

const ACCENT_PANEL = { left: 65, top: 82, width: 9, height: 24, z: 5 };

function IyalMark() {
  return (
    <svg width="37" height="37" viewBox="0 0 40 40" fill="none" aria-hidden>
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
 * The Acts Feed's editorial card. The hero visual is the Iyal Impact
 * Foundation brand treatment: a quiet logo zone filling the left half of
 * a fixed 2:1-aspect panel, and a photo collage canvas -- sized 165% x
 * 130% of the panel itself -- positioned so it overflows the panel's
 * top, right and bottom edges. Individual panels are placed against
 * that oversized canvas (not the visible panel), so what's visible is a
 * cropped window onto a larger collage, never a grid that's been sized
 * to fit. placeName/photoUrls/lat/lng are intentionally unused here
 * (this hero is a fixed brand visual, not derived from the Act's own
 * data) but stay in the prop type for caller compatibility. Straight
 * into a large punchy headline and a short description below -- no
 * eyebrow, no category label, no metadata row.
 */
export function EditorialActCard({ actId, title, description }: EditorialActCardProps) {
  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[12px] bg-white shadow-[0_2px_14px_rgba(43,42,38,0.08)] transition-shadow duration-200 active:shadow-[0_8px_22px_rgba(43,42,38,0.14)]"
      style={{ padding: CARD_PADDING }}
    >
      <div
        className="relative w-full overflow-hidden rounded-[20px]"
        style={{ aspectRatio: "2 / 1", background: IYAL_BG }}
      >
        <div
          className="absolute left-0 top-0 z-10 flex h-full items-center justify-center gap-3 px-4"
          style={{ width: LOGO_ZONE_W, background: IYAL_BG }}
        >
          <IyalMark />
          <div className="flex flex-col">
            <span
              className={`${inter.className} whitespace-nowrap`}
              style={{ fontSize: 20, fontWeight: 700, color: IYAL_DARK_GREEN, lineHeight: 1.1 }}
            >
              iyal impact
            </span>
            <span
              className={`${inter.className} whitespace-nowrap`}
              style={{ fontSize: 9, fontWeight: 600, letterSpacing: "2.1px", color: IYAL_MUTED_GREEN, marginTop: 4 }}
            >
              FOUNDATION
            </span>
          </div>
        </div>

        <div
          className="absolute"
          style={{ left: `${CANVAS_LEFT}%`, top: `${CANVAS_TOP}%`, width: `${CANVAS_W}%`, height: `${CANVAS_H}%` }}
        >
          {PANELS.map((panel) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={panel.src}
              src={panel.src}
              alt=""
              className="absolute object-cover"
              style={{
                left: toCanvasLeft(panel.left),
                top: toCanvasTop(panel.top),
                width: toCanvasWidth(panel.width),
                height: toCanvasHeight(panel.height),
                borderRadius: TILE_RADIUS,
                zIndex: panel.z,
              }}
            />
          ))}

          <div
            className="absolute flex overflow-hidden"
            style={{
              left: toCanvasLeft(ACCENT_PANEL.left),
              top: toCanvasTop(ACCENT_PANEL.top),
              width: toCanvasWidth(ACCENT_PANEL.width),
              height: toCanvasHeight(ACCENT_PANEL.height),
              borderRadius: TILE_RADIUS,
              zIndex: ACCENT_PANEL.z,
            }}
          >
            <div style={{ width: "44%", height: "100%", background: IYAL_ORANGE }} />
            <div style={{ width: "56%", height: "100%", background: IYAL_DARK_GREEN }} />
          </div>
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
