"use client";

import { useEffect, useState } from "react";
import { MapPin, User, Building2, BadgeCheck, Play } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface TraceCardProps {
  item: EvidenceTraceItem;
  isActive: boolean;
  onOpenPhoto: () => void;
}

const SHEET_COLLAPSED = 168;
const SHEET_NUDGE_GROWTH = 10;
const NUDGE_INTERVAL = 3800;

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function splitPlaceName(placeName: string): { line1: string; line2?: string } {
  const parts = placeName.split(", ");
  return { line1: parts[0], line2: parts.slice(1).join(", ") || undefined };
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ backgroundColor: "var(--color-badge-verified-bg)", color: "var(--color-primary-dark)" }}
    >
      {initials(name)}
    </span>
  );
}

/**
 * Living Trace -- Back Face Constitution v1.0. The back is the Human
 * Trust Layer: who made this possible, not what a map or timeline
 * already shows elsewhere. Order: Location -> Field Executive ->
 * Executing Organization -> Reviewed & Published By. People before
 * institutions; no coordinates, no map button, no badges/statistics.
 */
export function TraceCard({ item, isActive, onOpenPhoto }: TraceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [nudged, setNudged] = useState(false);

  useEffect(() => {
    if (!isActive) setExpanded(false);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || expanded) return;
    const interval = setInterval(() => {
      setNudged(true);
      setTimeout(() => setNudged(false), 400);
    }, NUDGE_INTERVAL);
    return () => clearInterval(interval);
  }, [isActive, expanded]);

  const isMapKind = item.trust.kind === "map";
  const place = isMapKind ? (item.placeName ?? item.landmark) : undefined;
  const placeParts = place ? splitPlaceName(place) : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]">
      <button
        type="button"
        onClick={onOpenPhoto}
        className="absolute inset-0 z-0"
        aria-label={item.mediaKind === "video" ? "Play evidence video" : "Open full photo"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.photoUrl} alt={item.momentTitle} className="h-full w-full object-cover" draggable={false} />
        {item.mediaKind === "video" && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <Play size={22} color="#fff" />
            </span>
          </span>
        )}
        {item.mediaKind === "video" && item.durationLabel && (
          <span
            className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            {item.durationLabel}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col rounded-t-[var(--radius-card)] bg-[var(--color-card)] px-5 pb-5 pt-3 text-left transition-all duration-300 ease-out"
        style={{
          height: expanded ? "100%" : nudged ? SHEET_COLLAPSED + SHEET_NUDGE_GROWTH : SHEET_COLLAPSED,
        }}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse capture details" : "Reveal capture details"}
      >
        <span className="mx-auto mb-3 h-1 w-9 shrink-0 rounded-full bg-[var(--color-border)]" />

        <div className="flex shrink-0 items-start justify-between gap-2">
          <p className="text-base font-semibold leading-snug">{item.momentTitle}</p>
          <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">{item.captureDate}</span>
        </div>
        <div className="my-2 h-px w-full shrink-0 bg-[var(--color-border)]" />
        <p className="shrink-0 text-sm leading-relaxed text-[var(--color-foreground)]">{item.narrative}</p>

        {expanded && (
          <div className="mt-3 flex flex-col gap-3">
            {placeParts && (
              <>
                <div className="h-px w-full bg-[var(--color-border)]" />
                <div className="flex flex-col gap-0.5">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    <MapPin size={12} /> Location
                  </p>
                  <p className="text-sm font-medium">{placeParts.line1}</p>
                  {placeParts.line2 && <p className="text-sm text-[var(--color-muted-foreground)]">{placeParts.line2}</p>}
                </div>
              </>
            )}

            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <User size={12} /> Field Executive
              </p>
              <div className="flex items-center gap-2.5">
                <Avatar name={item.capturedBy} />
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{item.capturedBy}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Field Executive</p>
                </div>
              </div>
            </div>

            {item.organization && (
              <>
                <div className="h-px w-full bg-[var(--color-border)]" />
                <div className="flex flex-col gap-0.5">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                    <Building2 size={12} /> Executing Organization
                  </p>
                  <p className="text-sm font-medium">{item.organization}</p>
                </div>
              </>
            )}

            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-1.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <BadgeCheck size={12} /> Reviewed & Published By
              </p>
              <div className="flex items-center gap-2.5">
                <Avatar name={item.approvedBy} />
                <div className="flex flex-col">
                  <p className="text-sm font-medium">{item.approvedBy}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Documentation Reviewer</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
