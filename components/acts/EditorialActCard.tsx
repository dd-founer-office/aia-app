import Link from "next/link";
import localFont from "next/font/local";
import { Inter } from "next/font/google";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "700", "800"], display: "swap" });

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

// Matches app/acts/page.tsx's own page background exactly, so the hero
// panel blends into the page rather than reading as its own tinted region.
const IYAL_BG = "#F2EFE7";
const IYAL_TEXT = "#173e35";
const IYAL_ORANGE = "#d5904b";
const IYAL_RULE = "rgba(23, 62, 53, 0.22)";
const TILE_RADIUS = 7;
const TILE_W = 90;
const TILE_H = 120;
const TILE_GAP = 8;
const ROW_GAP = 9;

// Per the Featured Impact Card canvas design (canvas.json "Main.dc.html"):
// a fixed 195px-tall hero, a quiet text-only wordmark filling the left
// half, and two 90x120 photo columns on the right, each holding the
// same 3 photos twice back to back so a translateY(-50%) loop (defined
// in app/globals.css as editorial-scroll-up/-down) is seamless -- left
// column scrolling up, right column scrolling down, opposite directions.
// Photos are real annadhanam (elder meal-service) documentation.
const LEFT_TILES = [
  { cls: "top-photo", src: "/mock/annadhanam-buffet.jpg" },
  { cls: "main-photo", src: "/mock/annadhanam-tray-1.jpg" },
  { cls: "bottom-photo", src: "/mock/annadhanam-trays.jpg" },
];
const RIGHT_TILES = [
  { cls: "top-photo", src: "/mock/annadhanam-trays.jpg" },
  { cls: "secondary-photo", src: "/mock/annadhanam-hall.jpg" },
  { cls: "bottom-photo", src: "/mock/annadhanam-buffet.jpg" },
];

const OBJECT_POSITION: Record<string, string> = {
  "main-photo": "51% center",
  "secondary-photo": "40% center",
  "bottom-photo": "center 44%",
};

function PhotoColumn({ tiles, animation }: { tiles: typeof LEFT_TILES; animation: string }) {
  const looped = [...tiles, ...tiles];
  return (
    <div
      className="flex flex-col"
      style={{ width: TILE_W, flex: "0 0 auto", gap: ROW_GAP, animation: `${animation} 15s linear infinite` }}
    >
      {looped.map((tile, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={tile.src}
          alt=""
          aria-hidden={i >= tiles.length}
          className="object-cover"
          style={{
            width: TILE_W,
            height: TILE_H,
            flex: "0 0 auto",
            borderRadius: TILE_RADIUS,
            border: "1px solid rgba(255, 255, 255, 0.65)",
            background: "#dbe7e2",
            objectPosition: OBJECT_POSITION[tile.cls] ?? "center",
          }}
        />
      ))}
    </div>
  );
}

/**
 * The Acts Feed's editorial card. The hero visual is the Iyal Impact
 * Foundation brand treatment, per the Featured Impact Card canvas
 * design: a fixed 195px-tall panel, a quiet text-only "iyal." wordmark
 * filling the left half, and two photo columns filling the right half
 * that scroll continuously in opposite directions (left up, right
 * down) -- each column holds its 3 photos twice back to back so the
 * loop is seamless. placeName/photoUrls/lat/lng are intentionally
 * unused here (this hero is a fixed brand visual, not derived from the
 * Act's own data) but stay in the prop type for caller compatibility.
 * Straight into a large punchy headline and a short description below
 * -- no eyebrow, no category label, no metadata row.
 */
export function EditorialActCard({ actId, title, description }: EditorialActCardProps) {
  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[12px] bg-transparent transition-all duration-200 hover:bg-white hover:shadow-[0_2px_14px_rgba(43,42,38,0.08)] active:bg-white active:shadow-[0_8px_22px_rgba(43,42,38,0.14)]"
      style={{ padding: CARD_PADDING }}
    >
      <div
        className="flex w-full overflow-hidden rounded-[9px]"
        style={{ height: 195, background: IYAL_BG }}
      >
        <div className="flex items-center justify-center" style={{ width: "50%" }}>
          <div className="flex flex-col items-start" style={{ width: 138, color: IYAL_TEXT }}>
            <span className={`${inter.className}`} style={{ fontSize: 35, fontWeight: 800, letterSpacing: "-2.7px", lineHeight: 0.9 }}>
              iyal<span style={{ color: IYAL_ORANGE }}>.</span>
            </span>
            <span style={{ width: "100%", height: 1, margin: "8px 0 6px", background: IYAL_RULE }} />
            <span
              className={`${inter.className} whitespace-nowrap uppercase`}
              style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.65px", lineHeight: 1.3 }}
            >
              Impact Foundation
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center" style={{ gap: TILE_GAP, overflow: "visible" }}>
          <PhotoColumn tiles={LEFT_TILES} animation="editorial-scroll-up" />
          <PhotoColumn tiles={RIGHT_TILES} animation="editorial-scroll-down" />
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
