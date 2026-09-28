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

const TILE = 70;
const TILE_GAP = 10;

/**
 * The hero visual's photo grid: four equal-size tiles, laid out against the
 * HALF_W-wide slot the map's other half leaves free. The first three sit
 * fully inside that slot; the fourth is offset further right so it bleeds
 * past the card's own right edge and reads as only partially visible --
 * same photo size as the rest, just cropped by the frame, per the
 * reference. When an Act has no GPS coordinates the map is dropped and
 * this same grid is simply centered across the full visual width instead.
 */
const PHOTO_TILES = [
  { x: 0, y: 3, w: TILE, h: TILE },
  { x: TILE + TILE_GAP, y: 3, w: TILE, h: TILE },
  { x: 0, y: 3 + TILE + TILE_GAP, w: TILE, h: TILE },
  { x: TILE + TILE_GAP + 20, y: 3 + TILE + TILE_GAP + 20, w: TILE, h: TILE },
];

/**
 * The Acts Feed's editorial card. The visual area is its own "hero"
 * composition inside the card: a map filling the full left half, and a
 * grid of same-size photo tiles filling the right half -- one of them
 * cropped by the card's edge, so it's clear there's more evidence behind
 * it (per the approved Abyssale-reference direction:
 * https://claude.ai/artifact/DVBoo7zNZXoXrc1WYgthAt). Straight into a
 * large punchy headline and a short description below -- no eyebrow, no
 * category label, no metadata row, no card border, no rounded corners on
 * the visual tiles. Default sits flush on the page's own background; the
 * only "selected" treatment is the surface turning plain white on press.
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
            className="absolute z-[2] object-cover"
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
