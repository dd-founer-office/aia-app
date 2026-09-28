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
const TILE_RADIUS = 10;
const TILE_GAP = 8;

// A shallow editorial panel (per the Bagelstein/MyJobGlasses references),
// not a tall photograph: ~1.65:1, landing around 195-210px tall on a
// ~390px mobile card. Left ~46% is the quiet brand zone; right ~54% is a
// clean, gapped image grid -- a large main photo, two small photos
// stacked beside it, and a shorter full-width photo below -- every tile
// fully contained within the hero's own bounds (no bleed past the
// frame). Photos are real annadhanam (elder meal-service) documentation,
// actual evidence of a real Act.
const LOGO_ZONE_W = "46%";

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

function GridPhoto({ src, area }: { src: string; area: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      style={{ gridArea: area, borderRadius: TILE_RADIUS }}
    />
  );
}

/**
 * The Acts Feed's editorial card. The hero visual is the Iyal Impact
 * Foundation brand treatment: a quiet logo zone filling the left ~46% of
 * a shallow, wide panel, and a structured CSS-grid image treatment
 * filling the right ~54% -- one large main photo, two small photos
 * stacked beside it, and a shorter full-width photo below. Every tile
 * sits fully inside the hero's own bounds; only object-fit crops the
 * photo content, never the tile itself. placeName/photoUrls/lat/lng are
 * intentionally unused here (this hero is a fixed brand visual, not
 * derived from the Act's own data) but stay in the prop type for caller
 * compatibility. Straight into a large punchy headline and a short
 * description below -- no eyebrow, no category label, no metadata row.
 */
export function EditorialActCard({ actId, title, description }: EditorialActCardProps) {
  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[12px] bg-white shadow-[0_2px_14px_rgba(43,42,38,0.08)] transition-shadow duration-200 active:shadow-[0_8px_22px_rgba(43,42,38,0.14)]"
      style={{ padding: CARD_PADDING }}
    >
      <div
        className="flex w-full overflow-hidden rounded-[20px]"
        style={{ aspectRatio: "1.65 / 1", background: IYAL_BG }}
      >
        <div className="flex items-center justify-center gap-3 px-4" style={{ width: LOGO_ZONE_W }}>
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
          className="grid flex-1"
          style={{
            gridTemplateAreas: `"main small1" "main small2" "bottom bottom"`,
            gridTemplateColumns: "1.3fr 1fr",
            gridTemplateRows: "1fr 1fr 0.6fr",
            gap: TILE_GAP,
            padding: TILE_GAP,
            paddingLeft: 0,
          }}
        >
          <GridPhoto src="/mock/annadhanam-tray-1.jpg" area="main" />
          <GridPhoto src="/mock/annadhanam-buffet.jpg" area="small1" />
          <GridPhoto src="/mock/annadhanam-hall.jpg" area="small2" />
          <GridPhoto src="/mock/annadhanam-trays.jpg" area="bottom" />
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
