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
  /** Cycles the composition (0-2) so consecutive cards don't look identical. */
  variant?: number;
}

interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Pattern {
  /** Which side of the visual area the map sits on -- the photo cluster takes the other. */
  side: "left" | "right";
  rowHeight: number;
  /** Priority order: dominant tile first, then supporting tiles. */
  visibleTiles: TileRect[];
  /** An extra tile, cropped/bled behind the others -- only shown when a genuine extra photo exists. */
  hiddenTile: TileRect;
}

const CARD_PADDING = 20;
const MAP_SIZE = 80;
const GAP = 18;
const CLUSTER_W = 212;
const FULL_W = MAP_SIZE + GAP + CLUSTER_W;

/**
 * Three compositions reproducing the approved Abyssale-reference mockup
 * (https://claude.ai/artifact/DVBoo7zNZXoXrc1WYgthAt): a small map square
 * sitting beside -- never overlapping -- an uneven photo cluster (one
 * dominant tile, 2-3 supporting tiles at uneven sizes, one extra tile
 * cropped behind the others). Sized so FULL_W + 2*CARD_PADDING fits the
 * app's narrowest supported content width (350px) without overflow -- the
 * canvas mockup's own numbers were laid out for a flush, unpadded card and
 * would have bled past the card edge if carried over as-is. All
 * coordinates are authored against CLUSTER_W; when an Act has no GPS
 * coordinates the map is dropped and the cluster scales up to fill the
 * full visual width instead.
 */
const PATTERNS: Pattern[] = [
  {
    side: "left",
    rowHeight: 136,
    visibleTiles: [
      { x: 0, y: 0, w: 134, h: 80 },
      { x: 140, y: 0, w: 72, h: 58 },
      { x: 140, y: 64, w: 72, h: 72 },
    ],
    hiddenTile: { x: -14, y: 86, w: 68, h: 68 },
  },
  {
    side: "right",
    rowHeight: 136,
    visibleTiles: [
      { x: 78, y: 0, w: 134, h: 80 },
      { x: 0, y: 0, w: 72, h: 58 },
      { x: 0, y: 64, w: 72, h: 72 },
    ],
    hiddenTile: { x: 162, y: 88, w: 68, h: 68 },
  },
  {
    side: "left",
    rowHeight: 151,
    visibleTiles: [
      { x: 0, y: 0, w: 134, h: 89 },
      { x: 139, y: 0, w: 73, h: 64 },
      { x: 139, y: 70, w: 73, h: 53 },
      { x: 0, y: 94, w: 62, h: 57 },
    ],
    hiddenTile: { x: 57, y: 116, w: 62, h: 62 },
  },
];

/**
 * The Acts Feed's editorial card. Reproduces the reference's structural
 * rhythm directly: a contained visual area (map + uneven photo cluster,
 * not a full-bleed grid), straight into a large punchy headline and a
 * short description -- no eyebrow, no category label, no metadata row, no
 * card border. Default sits flush on the page's own background; the only
 * "selected" treatment is the surface turning plain white on press, per
 * the approved design.
 */
export function EditorialActCard({
  actId,
  title,
  description,
  placeName,
  photoUrls,
  lat,
  lng,
  variant = 0,
}: EditorialActCardProps) {
  const pattern = PATTERNS[Math.abs(variant) % PATTERNS.length];
  const hasMap = lat != null && lng != null;

  const clusterW = hasMap ? CLUSTER_W : FULL_W;
  const clusterX = hasMap && pattern.side === "left" ? MAP_SIZE + GAP : 0;
  const mapX = pattern.side === "left" ? 0 : clusterW + GAP;
  const scale = clusterW / CLUSTER_W;

  const visibleCount = Math.min(photoUrls.length, pattern.visibleTiles.length);
  const visiblePhotos = pattern.visibleTiles.slice(0, visibleCount).map((tile, i) => ({
    url: photoUrls[i],
    x: clusterX + tile.x * scale,
    y: tile.y,
    w: tile.w * scale,
    h: tile.h,
  }));
  const hiddenPhotoUrl = photoUrls.length > pattern.visibleTiles.length ? photoUrls[pattern.visibleTiles.length] : null;
  const hiddenPhoto = hiddenPhotoUrl
    ? {
        url: hiddenPhotoUrl,
        x: clusterX + pattern.hiddenTile.x * scale,
        y: pattern.hiddenTile.y,
        w: pattern.hiddenTile.w * scale,
        h: pattern.hiddenTile.h,
      }
    : null;

  return (
    <Link
      href={`/acts/${actId}`}
      className="block rounded-[20px] bg-transparent transition-colors duration-200 active:bg-white active:shadow-[0_16px_36px_rgba(43,42,38,0.10)]"
      style={{ padding: CARD_PADDING }}
    >
      <div className="relative" style={{ width: FULL_W, height: pattern.rowHeight }}>
        {hiddenPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hiddenPhoto.url}
            alt=""
            className="absolute z-[1] rounded-[10px] object-cover"
            style={{ left: hiddenPhoto.x, top: hiddenPhoto.y, width: hiddenPhoto.w, height: hiddenPhoto.h }}
          />
        )}

        {visiblePhotos.map((photo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.url}
            src={photo.url}
            alt=""
            className="absolute z-[2] rounded-[10px] object-cover"
            style={{ left: photo.x, top: photo.y, width: photo.w, height: photo.h }}
          />
        ))}

        {hasMap && (
          <div
            className="absolute z-[3] overflow-hidden rounded-xl shadow-[0_4px_12px_rgba(43,42,38,0.12)]"
            style={{ left: mapX, top: 0, width: MAP_SIZE, height: MAP_SIZE }}
          >
            <MapEmbed lat={lat as number} lng={lng as number} locationLabel={placeName} compact heightClassName="h-full" />
          </div>
        )}
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
