"use client";

import { useEffect, useState } from "react";
import { User, MapPin, Maximize2, Play } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface TraceCardProps {
  item: EvidenceTraceItem;
  isActive: boolean;
  onOpenPhoto: () => void;
}

const HINT_KEY = "aia_living_trace_flip_hint_shown";

/**
 * Two-sided Evidence Card, Sprint 1A refinement.
 *
 * Front answers "what moment am I witnessing" -- a momentTitle, date,
 * divider, and one factual narrative sentence. No generic "Execution
 * Evidence" label, no inspirational quote.
 *
 * Back answers "why should I trust this photograph" -- captured
 * date/time, captured by, a human-readable place (never raw lat/lng),
 * approved by/on. No heading, no device info.
 *
 * No rotate icon anywhere. A subtle curled-corner affordance (bottom
 * right on the front, bottom left on the back) signals the card can be
 * turned over; tapping the caption/back area flips it, like a physical
 * photograph. On first use only, the corner gently lifts and settles
 * after ~1.6s of idle time to teach the interaction, using only the
 * existing 300ms motion token -- never shown again once the user flips
 * a card.
 */
export function TraceCard({ item, isActive, onOpenPhoto }: TraceCardProps) {
  const [flipped, setFlipped] = useState(false);
  const [hintLifted, setHintLifted] = useState(false);

  useEffect(() => {
    if (!isActive || flipped) return;
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(HINT_KEY)) return;

    const liftTimer = setTimeout(() => setHintLifted(true), 1600);
    const settleTimer = setTimeout(() => setHintLifted(false), 2000);
    return () => {
      clearTimeout(liftTimer);
      clearTimeout(settleTimer);
    };
  }, [isActive, flipped]);

  function flip(next: boolean) {
    setFlipped(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(HINT_KEY, "1");
    }
  }

  const locationLine1 = item.trust.kind === "map" ? item.landmark : item.trust.infoValue;
  const locationLine2 = item.trust.kind === "map" ? item.trust.locationLabel : undefined;

  return (
    <div className="relative h-full w-full" style={{ perspective: "1200px" }}>
      <div
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <button
            type="button"
            onClick={onOpenPhoto}
            className="relative h-[58%] w-full shrink-0"
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

          <button
            type="button"
            onClick={() => flip(true)}
            className="relative flex flex-1 flex-col gap-2 px-4 py-3 text-left"
            aria-label="Turn photograph over"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-semibold leading-snug">{item.momentTitle}</p>
              <span className="shrink-0 text-xs text-[var(--color-muted-foreground)]">
                {item.captureDate}
              </span>
            </div>
            <div className="h-px w-full bg-[var(--color-border)]" />
            <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{item.narrative}</p>

            {/* Curled corner flip affordance -- no icon, no text */}
            <div className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 overflow-hidden">
              <div
                className="absolute bottom-0 right-0 h-11 w-11 origin-bottom-right transition-transform duration-300 ease-out"
                style={{
                  background: "linear-gradient(135deg, transparent 50%, var(--color-border) 50%)",
                  transform: hintLifted ? "rotate(-10deg) translate(-2px, -2px)" : "rotate(0deg)",
                }}
              />
            </div>
          </button>
        </div>

        {/* Back */}
        <button
          type="button"
          onClick={() => flip(false)}
          className="absolute inset-0 flex flex-col justify-center gap-5 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-6 text-left"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          aria-label="Turn photograph back over"
        >
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">Captured</p>
            <p className="text-sm">
              {item.captureDate} · {item.captureTime}
            </p>
          </div>
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
            <p className="mt-1 text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">Approved On</p>
            <p className="text-sm">{item.approvedDate}</p>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 h-8 w-8 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 h-11 w-11"
              style={{ background: "linear-gradient(-135deg, transparent 50%, var(--color-border) 50%)" }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
