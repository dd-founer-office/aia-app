"use client";

import { useEffect, useState } from "react";
import { User, MapPin, Play } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface TraceCardProps {
  item: EvidenceTraceItem;
  isActive: boolean;
  onOpenPhoto: () => void;
}

const SHEET_COLLAPSED = 168;
const NUDGE_INTERVAL = 3800;

/**
 * Evidence Card, Sprint 1A pull-sheet refinement (round 2).
 *
 * Photo is a full-bleed background (tap it directly to open Full
 * Photo -- no separate "Expand" chip cluttering the image now).
 *
 * The sheet rests collapsed over the bottom of the photo, showing the
 * Moment (title, date, narrative). Tapping it expands it to fully
 * cover the card (height: 100%, no internal scroll -- the trimmed
 * provenance set was sized to fit that space without scrolling).
 *
 * While collapsed and active, the sheet gives a small recurring nudge
 * (translateY, duration-300 ease-out only -- no bounce/spring) to
 * invite tapping, rather than a one-time onboarding hint. Pauses the
 * moment the card is expanded or no longer active/centered.
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

  const locationLine1 = item.trust.kind === "map" ? item.landmark : item.trust.infoValue;
  const locationLine2 = item.trust.kind === "map" ? item.trust.locationLabel : undefined;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]">
      {/* Pinned photo, full-bleed background */}
      <button
        type="button"
        onClick={onOpenPhoto}
        className="absolute inset-0 z-0"
        aria-label={item.mediaKind === "video" ? "Play evidence video" : "Open full photo"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.photoUrl}
          alt={item.momentTitle}
          className="h-full w-full object-cover"
          draggable={false}
        />
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

      {/* Sheet -- slides up over the pinned photo, same visual language
          as CA-011's hero-photo-behind-sheet pattern */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col rounded-t-[28px] bg-[var(--color-card)] px-5 pb-5 pt-3 text-left transition-all duration-300 ease-out"
        style={{
          height: expanded ? "100%" : SHEET_COLLAPSED,
          transform: nudged ? "translateY(-10px)" : "translateY(0)",
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
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-0.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <User size={12} /> Captured By
              </p>
              <p className="text-sm">{item.capturedBy}</p>
            </div>
            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-0.5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <MapPin size={12} /> Location
              </p>
              {locationLine1 && <p className="text-sm">{locationLine1}</p>}
              {locationLine2 && <p className="text-sm">{locationLine2}</p>}
              <p className="text-xs text-[var(--color-muted-foreground)]">
                GPS Accuracy ±{item.gpsAccuracyMeters}m
              </p>
            </div>
            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-0.5">
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">Approved By</p>
              <p className="text-sm">{item.approvedBy}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Approved On
              </p>
              <p className="text-sm">{item.approvedDate}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
