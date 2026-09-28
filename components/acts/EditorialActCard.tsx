import Link from "next/link";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { MapPin } from "lucide-react";
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
  isSharedAct?: boolean;
  contributorCount?: number;
  /** Cycles the collage's composition (0-2) so consecutive cards don't look identical. */
  variant?: number;
}

interface Pattern {
  mainCount: number;
  collageHeight: number;
  columns: string;
  rowsFor: (count: number) => string;
  areasFor: (count: number) => string;
  edgePhoto: { top?: number; bottom?: number; left?: number; right?: number; size: number };
  mapTile: { leftPct: number; topPct: number; size: number };
}

/**
 * Three collage compositions carried over from the approved canvas
 * exploration (https://claude.ai/artifact/DVBoo7zNZXoXrc1WYgthAt): a
 * dominant tile plus 2-3 supporting tiles at uneven proportions, never an
 * equal grid. Each degrades gracefully to fewer tiles when an Act has
 * fewer than the pattern's full photo count -- never padded with
 * placeholders, since every photo here is real evidence.
 */
const PATTERNS: Pattern[] = [
  {
    mainCount: 3,
    collageHeight: 250,
    columns: "1.5fr 1fr",
    rowsFor: (count) => (count >= 3 ? "1fr 1fr" : "1fr"),
    areasFor: (count) => (count >= 3 ? "'big s1' 'big s2'" : "'big s1'"),
    edgePhoto: { bottom: -18, right: -18, size: 84 },
    mapTile: { leftPct: 48, topPct: 68, size: 92 },
  },
  {
    mainCount: 3,
    collageHeight: 230,
    columns: "1fr 1.6fr",
    rowsFor: (count) => (count >= 3 ? "1fr 1fr" : "1fr"),
    areasFor: (count) => (count >= 3 ? "'s1 big' 's2 big'" : "'s1 big'"),
    edgePhoto: { bottom: -16, left: -16, size: 78 },
    mapTile: { leftPct: 34, topPct: -6, size: 90 },
  },
  {
    mainCount: 4,
    collageHeight: 260,
    columns: "1.4fr 1fr",
    rowsFor: (count) => {
      if (count >= 4) return "0.9fr 0.9fr 0.7fr";
      if (count === 3) return "1fr 1fr";
      return "1fr";
    },
    areasFor: (count) => {
      if (count >= 4) return "'big s1' 'big s2' 'big s3'";
      if (count === 3) return "'big s1' 'big s2'";
      return "'big s1'";
    },
    edgePhoto: { top: 6, right: -22, size: 82 },
    mapTile: { leftPct: 68, topPct: 73, size: 86 },
  },
];

const AREA_NAMES = ["big", "s1", "s2", "s3"];

/**
 * The Acts Feed's editorial card, replacing the previous EvidenceCard here:
 * a full-bleed, uneven photo collage (map folded in as one overlapping
 * tile) followed directly by a headline and description -- no eyebrow, no
 * badge, no border. Default sits directly on the page's own background;
 * the only "selected" treatment is a plain white surface on press, per the
 * approved design (no green, no outline).
 */
export function EditorialActCard({
  actId,
  title,
  description,
  placeName,
  photoUrls,
  lat,
  lng,
  isSharedAct = false,
  contributorCount,
  variant = 0,
}: EditorialActCardProps) {
  const pattern = PATTERNS[Math.abs(variant) % PATTERNS.length];
  const mainPhotoCount = Math.min(photoUrls.length, pattern.mainCount);
  const mainPhotos = photoUrls.slice(0, mainPhotoCount);
  const edgePhoto = photoUrls.length > mainPhotoCount ? photoUrls[mainPhotoCount] : null;
  const hasMap = lat != null && lng != null;

  return (
    <Link
      href={`/acts/${actId}`}
      className="block overflow-hidden rounded-[22px] bg-transparent transition-colors duration-200 active:bg-white active:shadow-[0_14px_32px_rgba(43,42,38,0.09)]"
    >
      <div className="relative w-full overflow-hidden" style={{ height: pattern.collageHeight }}>
        <div
          className="relative z-[2] grid h-full w-full gap-1"
          style={{
            gridTemplateColumns: pattern.columns,
            gridTemplateRows: pattern.rowsFor(mainPhotoCount),
            gridTemplateAreas: pattern.areasFor(mainPhotoCount),
          }}
        >
          {mainPhotos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className="relative z-[2] h-full w-full object-cover"
              style={{ gridArea: AREA_NAMES[i] }}
            />
          ))}
        </div>

        {edgePhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={edgePhoto}
            alt=""
            className="absolute z-[1] rounded-[10px] object-cover"
            style={{
              width: pattern.edgePhoto.size,
              height: pattern.edgePhoto.size,
              top: pattern.edgePhoto.top,
              bottom: pattern.edgePhoto.bottom,
              left: pattern.edgePhoto.left,
              right: pattern.edgePhoto.right,
            }}
          />
        )}

        {hasMap && (
          <div
            className="absolute z-[3] overflow-hidden rounded-xl shadow-[0_6px_16px_rgba(43,42,38,0.14)]"
            style={{
              width: pattern.mapTile.size,
              height: pattern.mapTile.size,
              left: `${pattern.mapTile.leftPct}%`,
              top: `${pattern.mapTile.topPct}%`,
            }}
          >
            <MapEmbed lat={lat as number} lng={lng as number} locationLabel={placeName} compact heightClassName="h-full" />
          </div>
        )}
      </div>

      <div className="p-[22px]">
        <h2 className={`${calSans.className} m-0`} style={{ fontSize: 27, fontWeight: 700, lineHeight: 1.14, letterSpacing: "-0.4px", color: "#24231F" }}>
          {title}
        </h2>
        {!hasMap && placeName && (
          <span
            className={`${inter.className} mt-2 flex items-center gap-1`}
            style={{ fontSize: 12, fontWeight: 500, color: "#8A8678" }}
          >
            <MapPin size={12} />
            {placeName}
          </span>
        )}
        {description && (
          <p className={`${inter.className} mt-2.5`} style={{ fontSize: 14, lineHeight: 1.55, color: "#7D7A70" }}>
            {description}
          </p>
        )}
        {isSharedAct && contributorCount ? (
          <p className={`${inter.className} mt-2.5`} style={{ fontSize: 13, color: "#8A8678" }}>
            {contributorCount} contributors participated together
          </p>
        ) : null}
      </div>
    </Link>
  );
}
