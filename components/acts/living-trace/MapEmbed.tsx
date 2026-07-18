import { MapPin } from "lucide-react";

export interface MapEmbedProps {
  lat: number;
  lng: number;
  locationLabel: string;
  heightClassName?: string;
  compact?: boolean;
}

/**
 * Shared map primitive. Used inline on the Location page (CA-011 chip)
 * and inside FullMapView (Living Trace Trust Card expansion) -- same
 * component, two contexts, per "keep the architecture modular so the
 * same Map Experience component can later be reused elsewhere."
 */
export function MapEmbed({
  lat,
  lng,
  locationLabel,
  heightClassName = "h-48",
  compact = false,
}: MapEmbedProps) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`;

  return (
    <div className="flex flex-col gap-3">
      <iframe
        src={mapEmbedUrl}
        className={`w-full rounded-[var(--radius-photo)] border-0 ${heightClassName}`}
        loading="lazy"
        title={`Map of ${locationLabel}`}
      />
      {!compact && (
        
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--color-primary-dark)" }}
        >
          <MapPin size={14} />
          Open in Google Maps →
        </a>
      )}
    </div>
  );
}
