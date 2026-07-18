"use client";

import { useState } from "react";
import { RotateCw, ShieldCheck, User, Smartphone, MapPin } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface TraceCardProps {
  item: EvidenceTraceItem;
  onOpenPhoto: () => void;
}

/**
 * Two-sided Evidence Card (Living Trace Constitution §2). One photo,
 * one truth -- each card is a single piece of evidence, never a grouped
 * gallery. Flip uses the approved 300ms token only.
 */
export function TraceCard({ item, onOpenPhoto }: TraceCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="relative h-[440px] w-full" style={{ perspective: "1200px" }}>
      <div
        className="relative h-full w-full transition-transform duration-300 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <button type="button" onClick={onOpenPhoto} className="block h-full w-full" aria-label="Open full photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.photoUrl} alt={item.proofTypeLabel} className="h-full w-full object-cover" draggable={false} />
          </button>

          <span
            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            {item.proofTypeLabel}
          </span>

          <button
            type="button"
            onClick={() => setFlipped(true)}
            aria-label="Flip card to see capture details"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <RotateCw size={15} />
          </button>

          <span
            className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <ShieldCheck size={12} />
            {item.trust.verificationStatus === "verified" ? "Verified" : "Pending"}
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col gap-4 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card)] p-5"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{item.proofTypeLabel}</p>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="Flip card back to photo"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)]"
            >
              <RotateCw size={15} />
            </button>
          </div>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted-foreground)]">Captured</span>
              <span>{item.captureDate} · {item.captureTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                <User size={13} /> Captured By
              </span>
              <span>{item.capturedBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                <MapPin size={13} /> GPS
              </span>
              <span>
                {item.gpsLat.toFixed(4)}, {item.gpsLng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted-foreground)]">GPS Accuracy</span>
              <span>±{item.gpsAccuracyMeters}m</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
                <Smartphone size={13} /> Device
              </span>
              <span>{item.device}</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
              <span className="text-[var(--color-muted-foreground)]">Approved By</span>
              <span>{item.approvedBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted-foreground)]">Approved On</span>
              <span>{item.approvedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
