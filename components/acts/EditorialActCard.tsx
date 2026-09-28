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

const CARD_PADDING = 20;
const FULL_W = 310;
const HALF_GAP = 10;
const HALF_W = (FULL_W - HALF_GAP) / 2;
// Height is the previous compositions' average row height (~141) plus 25%.
const HERO_H = 176;

const COL_GAP = 10;
// Deliberately smaller than COL_GAP -- row 2 sits closer to row 1 than the
// two columns sit to each other, so the grid doesn't read as a uniform,
// matching-border grid.
const ROW_GAP = 6;
const TILE_TOP = 4;
const TILE_W = (HALF_W - COL_GAP) / 2;
// Solved so row 2 is cropped to exactly 60% visible by HERO_H:
// TILE_TOP + TILE_H + ROW_GAP + 0.6*TILE_H = HERO_H
const TILE_H = (HERO_H - TILE_TOP - ROW_GAP) / 1.6;

/**
 * The hero visual's photo grid: two rows of two equal, taller tiles against
 * the HALF_W-wide slot the map's other half leaves free. Row 1 sits fully
 * inside the hero card; row 2 is cropped to 60% visible by the card's own
 * bottom edge, so it reads as "more photos below" rather than a finished
 * grid. When an Act has no GPS coordinates the map is dropped and this same
 * grid is simply centered across the full visual width instead.
 */
const PHOTO_TILES = [
  { x: 0, y: TILE_TOP, w: TILE_W, h: TILE_H },
  { x: TILE_W + COL_GAP, y: TILE_TOP, w: TILE_W, h: TILE_H },
  { x: 0, y: TILE_TOP + TILE_H + ROW_GAP, w: TILE_W, h: TILE_H },
  { x: TILE_W + COL_GAP, y: TILE_TOP + TILE_H + ROW_GAP, w: TILE_W, h: TILE_H },
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
 * category label, no metadata row, no card border. Photo tiles carry a
 * slight corner radius (the map does not). Default sits flush on the
 * page's own background; the only "selected" treatment is the surface
 * turning plain white on press.
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
  const photoOriginX = hasMap ? HALF_W + HALF_GAP : (FULL_W - HALF_W) / 2;

  const photos = PHOTO_TILES.slice(0, Math.min(photoUrls.length, PHOTO_TILES.length)).map((tile, i) => ({
    url: photoUrls[i],
    x: photoOriginX + tile.x,
    y: tile.y,
    w: tile.w,
    h: tile.h,
  }));

  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[20px] bg-transparent transition-colors duration-200 active:bg-white active:shadow-[0_16px_36px_rgba(43,42,38,0.10)]"
      style={{ padding: CARD_PADDING }}
    >
      <div className="relative overflow-hidden" style={{ width: FULL_W, height: HERO_H }}>
        {hasMap && (
          <div className="absolute left-0 top-0 shadow-[0_4px_12px_rgba(43,42,38,0.12)] [&_iframe]:rounded-none" style={{ width: HALF_W, height: HERO_H }}>
            <MapEmbed lat={lat as number} lng={lng as number} locationLabel={placeName} compact heightClassName="h-full" />
          </div>
        )}

        {photos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.url}
            src={photo.url}
            alt=""
            className="absolute z-[2] rounded-[6px] object-cover"
            style={{ left: photo.x, top: photo.y, width: photo.w, height: photo.h }}
          />
        ))}
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
