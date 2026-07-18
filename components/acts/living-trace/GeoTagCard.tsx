"use client";

import { ChevronLeft, ChevronRight, MapPin, User } from "lucide-react";
import { MapEmbed } from "./MapEmbed";
import type { EvidenceTraceItem } from "./types";

export interface GeoTagCardProps {
  item: EvidenceTraceItem;
  onExpand: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Geo-tag trust card. No raw lat/lng shown here either, per the same
 * "people trust places, not coordinate strings" principle applied to
 * the flip card -- extended here for consistency across the viewer.
 */
export function GeoTagCard({ item, onExpand, onPrev, onNext }: GeoTagCardProps) {
  const { trust } = item;
  const isMapKind = trust.kind === "map";
  const title = isMapKind ? item.landmark ?? trust.locationLabel : trust.infoValue;
  const subtitle = isMapKind ? trust.locationLabel : undefined;

  return (
    <div className="relative mx-auto w-[88%]">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous evidence"
        className="absolute -left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label="Next evidence"
        className="absolute -right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
      >
        <ChevronRight size={16} />
      </button>

      <div className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        {isMapKind && trust.lat !== undefined && trust.lng !== undefined ? (
          <button
            type="button"
            onClick={onExpand}
            className="h-16 w-16 shrink-0 overflow-hidden rounded-[var(--radius-photo)]"
            aria-label="Expand map"
          >
            <MapEmbed
              lat={trust.lat}
              lng={trust.lng}
              locationLabel={trust.locationLabel}
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
          {subtitle && <p className="truncate text-xs text-[var(--color-muted-foreground)]">{subtitle}</p>}
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {item.captureDate} · {item.captureTime}
          </p>
          <p className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
            <User size={11} />
            {item.capturedBy}
          </p>
        </div>
      </div>
    </div>
  );
}
