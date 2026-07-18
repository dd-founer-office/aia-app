"use client";

import { useEffect, useState } from "react";
import { User, MapPin, Maximize2, Play } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface TraceCardProps {
  item: EvidenceTraceItem;
  isActive: boolean;
  onOpenPhoto: () => void;
}

const HINT_KEY = "aia_living_trace_sheet_hint_shown";
const SHEET_COLLAPSED = 168;
const SHEET_EXPANDED = 288;

/**
 * Evidence Card, Sprint 1A pull-sheet refinement. Replaces the earlier
 * flip interaction entirely -- no rotateY, no corner affordance.
 *
 * The photo is a full-bleed background, same "pinned photo, sheet
 * slides over it" language as CA-011 Act Detail's hero. The bottom
 * sheet rests collapsed showing the Moment (title, date, narrative);
 * tapping it (via a small pull-handle) expands it upward over the
 * photo to reveal the same trimmed provenance set as before (Captured
 * By, Location, GPS Accuracy, Approved By/On). Tap-to-toggle rather
 * than drag, since a vertical drag would conflict with the stack's
 * horizontal swipe navigation.
 *
 * Sheet auto-collapses when the card leaves the active/center position
 * (see effect below), so cards never carry an open sheet into the
 * peeked side positions.
 *
 * First-time only: the sheet nudges up ~10px and settles after ~1.6s
 * idle, using only the existing 300ms token -- no bounce, no pulse.
 * Never shown again once the user opens a sheet.
 */
export function TraceCard({ item, isActive, onOpenPhoto }: TraceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [hintNudged, setHintNudged] = useState(false);

  useEffect(() => {
    if (!isActive) setExpanded(false);
  }, [isActive]);

  useEffect(() => {
    if (!isActive || expanded) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(HINT_KEY)) return;

    const nudgeTimer = setTimeout(() => setHintNudged(true), 1600);
    const settleTimer = setTimeout(() => setHintNudged(false), 2000);
    return () => {
      clearTimeout(nudgeTimer);
      clearTimeout(settleTimer);
    };
  }, [isActive, expanded]);

  function toggleSheet() {
    setExpanded((v) => !v);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HINT_KEY, "1");
    }
  }

  const locationLine1 = item.trust.kind === "map" ? item.landmark : item.trust.infoValue;
  const locationLine2 = item.trust.kind === "map" ? item.trust.locationLabel : undefined;
  const sheetHeight = expanded ? SHEET_EXPANDED : SHEET_COLLAPSED;
  const nudgeOffset = hintNudged ? 10 : 0;

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
        <span
          className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <Maximize2 size={12} />
          Expand
        </span>
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
        onClick={toggleSheet}
        className="absolute bottom-0 left-0 right-0 z-10 flex flex-col overflow-hidden rounded-t-[28px] bg-[var(--color-card)] px-5 pb-5 pt-3 text-left transition-all duration-300 ease-out"
        style={{ height: sheetHeight, transform: `translateY(-${nudgeOffset}px)` }}
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
          <div className="mt-3 flex flex-col gap-3 overflow-y-auto">
            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                <User size={12} /> Captured By
              </p>
              <p className="text-sm">{item.capturedBy}</p>
            </div>
            <div className="h-px w-full bg-[var(--color-border)]" />
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-1">
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
