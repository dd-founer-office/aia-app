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

// The hero is a wide, cinematic window: a fixed aspect ratio close to
// 1.65:1 (~200px tall on a ~330px-wide mobile card), full card width, so
// it holds its shape at any card size.
const LOGO_ZONE_W = "50%";

// The collage panels are positioned directly against the hero itself
// using hero-relative percentages that are allowed to go negative or
// past 100 -- CSS resolves percentages arithmetically regardless of
// whether the result lands outside the parent's own box, so a panel at
// e.g. left:82% width:24% (right edge at 106%) simply renders 6% of its
// own width past the hero's right edge, clipped by the hero's own
// overflow:hidden. That's the whole mechanism: no separate oversized
// "canvas" wrapper is needed, just panels sized and placed larger/
// further than the visible frame. Three substantial photos -- one
// dominant, one far-right vertical, one bottom horizontal -- plus one
// small flat accent block, deliberately overlapping each other so nothing
// reads as a tidy, evenly-spaced grid. Photos are real annadhanam (elder
// meal-service) documentation -- actual evidence of a real Act, not
// stock or generated imagery.
interface PanelSpec {
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  z: number;
}

const PANELS: PanelSpec[] = [
  // Dominant: the main visual anchor, nearly the full hero height.
  { src: "/mock/annadhanam-tray-1.jpg", left: 48, top: -2, width: 42, height: 96, z: 4 },
  // Far-right vertical: bleeds past the hero's right edge.
  { src: "/mock/annadhanam-hall.jpg", left: 82, top: 8, width: 24, height: 85, z: 1 },
  // Bottom horizontal: peeks out from under the dominant photo, cropped by the hero's bottom edge.
  { src: "/mock/annadhanam-trays.jpg", left: 58, top: 70, width: 39, height: 36, z: 2 },
];

const ACCENT_PANEL = { left: 68, top: -6, width: 10, height: 18, z: 5 };

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
 * a fixed ~1.65:1-aspect panel, and three large, overlapping photo
 * panels sized and placed so they bleed past the panel's own right and
 * bottom edges -- a cropped window onto a larger collage, not a grid
 * sized to fit inside it. placeName/photoUrls/lat/lng are intentionally
 * unused here (this hero is a fixed brand visual, not derived from the
 * Act's own data) but stay in the prop type for caller compatibility.
 * Straight into a large punchy headline and a short description below --
 * no eyebrow, no category label, no metadata row.
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
        style={{ aspectRatio: "1.65 / 1", background: IYAL_BG }}
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

        {PANELS.map((panel) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={panel.src}
            src={panel.src}
            alt=""
            className="absolute object-cover"
            style={{
              left: `${panel.left}%`,
              top: `${panel.top}%`,
              width: `${panel.width}%`,
              height: `${panel.height}%`,
              borderRadius: TILE_RADIUS,
              zIndex: panel.z,
            }}
          />
        ))}

        <div
          className="absolute flex overflow-hidden"
          style={{
            left: `${ACCENT_PANEL.left}%`,
            top: `${ACCENT_PANEL.top}%`,
            width: `${ACCENT_PANEL.width}%`,
            height: `${ACCENT_PANEL.height}%`,
            borderRadius: TILE_RADIUS,
            zIndex: ACCENT_PANEL.z,
          }}
        >
          <div style={{ width: "44%", height: "100%", background: IYAL_ORANGE }} />
          <div style={{ width: "56%", height: "100%", background: IYAL_DARK_GREEN }} />
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
