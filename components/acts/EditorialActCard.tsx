import Link from "next/link";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { MapEmbed } from "@/components/acts/living-trace/MapEmbed";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export interface EditorialActCardProps {
  actId: string;
  title: string;
  description?: string;
  placeName: string;
  photoUrls: string[];
  lat: number | null;
  lng: number | null;
}

// Matches app/acts/page.tsx's own page background -- the hero panel is
// filled with this so it reads as its own region inside the white card.
const PAGE_BG = "#F2EFE7";

const CARD_PADDING = 20;
// Height is fixed -- it doesn't need to track the card's width. Everything
// horizontal below is percentage/calc-based instead of a fixed pixel
// budget, so the composition actually fits the card on any phone width
// (a fixed-width version bled past the card's right edge on narrower
// screens once CARD_PADDING was subtracted from a viewport narrower than
// the one it was tuned against).
const HERO_H = 176;

const HALF_GAP = 10;
const HALF_STYLE = `calc(50% - ${HALF_GAP / 2}px)`;

const COL_GAP = 10;
const COL_STYLE = `calc(50% - ${COL_GAP / 2}px)`;

// Deliberately much smaller than COL_GAP -- row 2 sits pulled up tight
// against row 1, so the grid doesn't read as a uniform, matching-border
// grid the way the two columns do.
const ROW_GAP = 2;
const TILE_TOP = 4;
// Solved so row 2 is cropped to exactly 60% visible by HERO_H:
// TILE_TOP + TILE_H + ROW_GAP + 0.6*TILE_H = HERO_H
const TILE_H = (HERO_H - TILE_TOP - ROW_GAP) / 1.6;
const ROW2_TOP = TILE_TOP + TILE_H + ROW_GAP;

/**
 * The hero visual's photo grid: two rows of two equal, taller tiles filling
 * the half (or, with no map, the full width) the map's own half leaves
 * free. Row 1 sits fully inside the hero card; row 2 is pulled up tight
 * against it and cropped to 60% visible by the card's own bottom edge, so
 * it reads as "more photos below" rather than a finished grid. Column
 * position/width are percentage-based so the grid holds its proportions at
 * any card width; only the vertical dimensions are fixed pixels.
 */
const PHOTO_TILES = [
  { side: "left" as const, top: TILE_TOP, h: TILE_H },
  { side: "right" as const, top: TILE_TOP, h: TILE_H },
  { side: "left" as const, top: ROW2_TOP, h: TILE_H },
  { side: "right" as const, top: ROW2_TOP, h: TILE_H },
];

/**
 * The Acts Feed's editorial card. The visual area is its own "hero"
 * composition inside the card: a map filling the full left half, and a
 * two-row grid of same-size photo tiles filling the right half -- the
 * first row fully visible, the second cropped in half by the card's own
 * bottom edge, so it's clear there's more evidence behind it (per the
 * approved Abyssale-reference direction:
 * https://claude.ai/artifact/DVBoo7zNZXoXrc1WYgthAt). Straight into a
 * large punchy headline and a short description below -- no eyebrow, no
 * category label, no metadata row. The card itself is a white,
 * rounded-corner surface (per the reference); the hero visual sits on its
 * own panel inside it, filled with the page's own background color so the
 * map/photos read as a distinct region rather than bleeding into the
 * white card. Photo tiles carry a slight corner radius (the map does
 * not).
 */
export function EditorialActCard({
  actId,
  title,
  description,
  placeName,
  photoUrls,
  lat,
  lng,
}: EditorialActCardProps) {
  const hasMap = lat != null && lng != null;
  const photoHalfWidth = hasMap ? HALF_STYLE : "100%";
  const photoHalfLeft = hasMap ? `calc(50% + ${HALF_GAP / 2}px)` : "0";

  const photos = PHOTO_TILES.slice(0, Math.min(photoUrls.length, PHOTO_TILES.length)).map((tile, i) => ({
    url: photoUrls[i],
    ...tile,
  }));

  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[12px] bg-white shadow-[0_2px_14px_rgba(43,42,38,0.08)] transition-shadow duration-200 active:shadow-[0_8px_22px_rgba(43,42,38,0.14)]"
      style={{ padding: CARD_PADDING }}
    >
      <div className="relative w-full overflow-hidden" style={{ height: HERO_H, background: PAGE_BG }}>
        {hasMap && (
          <div
            className="absolute left-0 top-0 shadow-[0_4px_12px_rgba(43,42,38,0.12)] [&_iframe]:rounded-none"
            style={{ width: HALF_STYLE, height: HERO_H }}
          >
            <MapEmbed lat={lat as number} lng={lng as number} locationLabel={placeName} compact heightClassName="h-full" />
          </div>
        )}

        <div className="absolute top-0" style={{ left: photoHalfLeft, width: photoHalfWidth, height: HERO_H }}>
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.url}
              src={photo.url}
              alt=""
              className="absolute z-[2] rounded-[6px] object-cover"
              style={{
                [photo.side]: 0,
                top: photo.top,
                width: COL_STYLE,
                height: photo.h,
              }}
            />
          ))}
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
