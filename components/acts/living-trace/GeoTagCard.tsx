"use client";

import { MapPin } from "lucide-react";
import { MapEmbed } from "./MapEmbed";
import type { EvidenceTraceItem } from "./types";

export interface GeoTagCardProps {
  item: EvidenceTraceItem;
  onExpand: () => void;
}

function formatCoordinate(value: number, kind: "lat" | "lng"): string {
  const dir = kind === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  return `${Math.abs(value).toFixed(6)}° ${dir}`;
}

/**
 * Floating info panel below the card stack. Separate small map (tap ->
 * full Google Maps), plus the exact address, lat/long, and capture
 * date/time -- all captured automatically by Mission Camera, never
 * entered manually. No nav arrows here -- those float independently in
 * LivingTraceViewer now. Privacy rule preserved: map/coords/address only
 * ever shown for map-kind categories (tree/temple/annadhanam); student/
 * family evidence shows only the organization name, exactly as before.
 */
export function GeoTagCard({ item, onExpand }: GeoTagCardProps) {
  const { trust } = item;
  const isMapKind = trust.kind === "map";
  const hasCoords = isMapKind && trust.lat !== undefined && trust.lng !== undefined;
  const title = isMapKind ? (item.address ?? item.landmark ?? trust.locationLabel) : trust.infoValue;

  return (
    <div className="mx-auto flex w-[88%] flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      {hasCoords ? (
        <button
          type="button"
          onClick={onExpand}
          className="h-28 w-full overflow-hidden rounded-[var(--radius-photo)]"
          aria-label="Open full map"
        >
          <MapEmbed
            lat={trust.lat as number}
            lng={trust.lng as number}
            locationLabel={title ?? trust.locationLabel}
            heightClassName="h-28"
            compact
          />
        </button>
      ) : (
        <div className="flex h-28 w-full items-center justify-center rounded-[var(--radius-photo)] bg-[var(--color-background)]">
          <MapPin size={22} className="text-[var(--color-muted-foreground)]" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {hasCoords && (
          <p className="font-mono text-xs text-[var(--color-muted-foreground)]">
            {formatCoordinate(trust.lat as number, "lat")}, {formatCoordinate(trust.lng as number, "lng")}
          </p>
        )}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {item.captureDate} · {item.captureTime}
        </p>
      </div>
    </div>
  );
}
