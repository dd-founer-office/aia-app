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

const CARD_PADDING = 10;
const HERO_H = 176;

// Map takes the left third, photo grid the right two-thirds -- a wider,
// more noticeable gap between them than between individual tiles, matching
// the reference's clear separation between "identity" (badge) and
// "evidence" (photos).
const MAP_GAP = 14;
const MAP_STYLE = `calc(33.333% - ${MAP_GAP / 2}px)`;
const PHOTO_LEFT = `calc(33.333% + ${MAP_GAP / 2}px)`;
const PHOTO_WIDTH = `calc(66.667% - ${MAP_GAP / 2}px)`;

// Inside the photo area: a tight gap between tiles (much smaller than
// MAP_GAP), an uneven 2x2 grid -- one dominant tile, two narrower
// supporting tiles at the dominant's own width, and a fourth tile at the
// bottom-right that's the SAME size as its row-mate but deliberately
// widened so it bleeds past the photo area's own right edge, cropped by
// the hero panel's overflow -- horizontally only, never vertically, so
// its full height still reads, just not its full width. Percentages are
// relative to the photo area's own (fluid) width, so the grid holds its
// proportions at any card width; only the row heights are fixed pixels.
const TILE_GAP = 6;
const CROP_BLEED = 28;
const DOMINANT_W = `calc(58% - ${TILE_GAP / 2}px)`;
const NARROW_LEFT = `calc(58% + ${TILE_GAP / 2}px)`;
const NARROW_W = `calc(42% - ${TILE_GAP / 2}px)`;
const CROPPED_W = `calc(42% - ${TILE_GAP / 2}px + ${CROP_BLEED}px)`;

const ROW1_H = 106;
const ROW_GAP = TILE_GAP;
const ROW2_H = HERO_H - ROW1_H - ROW_GAP;
const ROW2_TOP = ROW1_H + ROW_GAP;

const PHOTO_TILES = [
  { left: "0", top: 0, width: DOMINANT_W, height: ROW1_H },
  { left: NARROW_LEFT, top: 0, width: NARROW_W, height: ROW1_H },
  { left: "0", top: ROW2_TOP, width: NARROW_W, height: ROW2_H },
  { left: NARROW_LEFT, top: ROW2_TOP, width: CROPPED_W, height: ROW2_H },
];

/**
 * The Acts Feed's editorial card. The visual area is its own "hero"
 * composition inside the card: a map filling the left third, and an
 * uneven photo grid filling the right two-thirds -- one dominant tile,
 * two supporting tiles at its own width, and a fourth tile cropped by the
 * hero panel's own right edge (same height as its row-mate, just wider
 * than the space left for it), so it's clear there's more evidence just
 * out of frame (per the approved Abyssale-reference direction:
 * https://claude.ai/artifact/DVBoo7zNZXoXrc1WYgthAt). Straight into a
 * large punchy headline and a short description below -- no eyebrow, no
 * category label, no metadata row. The card itself is a white,
 * rounded-corner surface; the hero visual sits on its own rounded panel
 * inside it, filled with the page's own background color so the
 * map/photos read as a distinct region rather than bleeding into the
 * white card.
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
  const photoAreaLeft = hasMap ? PHOTO_LEFT : "0";
  const photoAreaWidth = hasMap ? PHOTO_WIDTH : "100%";

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
      <div className="relative w-full overflow-hidden rounded-[6px]" style={{ height: HERO_H, background: PAGE_BG }}>
        {hasMap && (
          <div
            className="absolute left-0 top-0 shadow-[0_4px_12px_rgba(43,42,38,0.12)] [&_iframe]:rounded-none"
            style={{ width: MAP_STYLE, height: HERO_H }}
          >
            <MapEmbed lat={lat as number} lng={lng as number} locationLabel={placeName} compact heightClassName="h-full" />
          </div>
        )}

        <div className="absolute top-0" style={{ left: photoAreaLeft, width: photoAreaWidth, height: HERO_H }}>
          {photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.url}
              src={photo.url}
              alt=""
              className="absolute z-[2] rounded-[6px] object-cover"
              style={{ left: photo.left, top: photo.top, width: photo.width, height: photo.height }}
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
