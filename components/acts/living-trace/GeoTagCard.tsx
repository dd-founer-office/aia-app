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
 * Floating info panel below the card stack -- horizontal layout: small
 * map thumbnail on the left (tap -> full Google Maps), address/lat-long/
 * date-time stacked on the right. All auto-captured by Mission Camera,
 * never entered manually. No nav arrows here -- those float
 * independently in LivingTraceViewer. Privacy rule preserved: map/
 * coords/address only ever shown for map-kind categories.
 */
export function GeoTagCard({ item, onExpand }: GeoTagCardProps) {
  const { trust } = item;
  const isMapKind = trust.kind === "map";
  const hasCoords = isMapKind && trust.lat !== undefined && trust.lng !== undefined;
  const title = isMapKind ? (item.address ?? item.landmark ?? trust.locationLabel) : trust.infoValue;

  return (
    <div className="mx-auto flex w-[88%] gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      {hasCoords ? (
        <button
          type="button"
          onClick={onExpand}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-photo)]"
          aria-label="Open full map"
        >
          <MapEmbed
            lat={trust.lat as number}
            lng={trust.lng as number}
            locationLabel={title ?? trust.locationLabel}
            heightClassName="h-16"
            compact
          />
        </button>
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-photo)] bg-[var(--color-background)]">
          <MapPin size={20} className="text-[var(--color-muted-foreground)]" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold">{title}</p>
        {hasCoords && (
          <p className="truncate font-mono text-xs text-[var(--color-muted-foreground)]">
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
