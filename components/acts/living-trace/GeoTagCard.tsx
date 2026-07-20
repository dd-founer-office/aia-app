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

export function GeoTagCard({ item, onExpand }: GeoTagCardProps) {
  const { trust } = item;
  const isMapKind = trust.kind === "map";
  const hasCoords = isMapKind && trust.lat !== undefined && trust.lng !== undefined;

  const headline = isMapKind ? (item.placeName ?? item.landmark ?? trust.locationLabel) : trust.infoValue;
  const detailLine = isMapKind
    ? item.plusCode && item.address
      ? `${item.plusCode}, ${item.address}`
      : (item.address ?? undefined)
    : undefined;

  return (
    <div className="mx-auto flex w-[88%] gap-3">
      {hasCoords ? (
        <button
          type="button"
          onClick={onExpand}
          className="h-24 w-24 shrink-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)]"
          aria-label="Open full map"
        >
          <MapEmbed
            lat={trust.lat as number}
            lng={trust.lng as number}
            locationLabel={headline ?? trust.locationLabel}
            heightClassName="h-24"
            compact
          />
        </button>
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]">
          <MapPin size={20} className="text-[var(--color-muted-foreground)]" />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <p className="truncate text-sm font-semibold">{headline}</p>
        {detailLine && (
          <p className="truncate text-xs text-[var(--color-muted-foreground)]">{detailLine}</p>
        )}
        {hasCoords && (
          <p className="truncate font-mono text-xs text-[var(--color-muted-foreground)]">
            Lat {formatCoordinate(trust.lat as number, "lat")}, Long {formatCoordinate(trust.lng as number, "lng")}
          </p>
        )}
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {item.captureDateTimeFull ?? `${item.captureDate} · ${item.captureTime}`}
        </p>
      </div>
    </div>
  );
}
