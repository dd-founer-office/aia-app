"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { EvidenceTraceItem } from "./types";

export interface FullPhotoViewerProps {
  items: EvidenceTraceItem[];
  initialIndex: number;
  onClose: () => void;
}

/**
 * Full Photo (Living Trace Constitution §6). Loops infinitely, matching
 * the card stack's rotation behavior. Video items show a poster + play
 * button, then play inline with native controls -- same pattern as the
 * original EvidenceViewer v2.0 had, rebuilt here for the new item shape.
 */
export function FullPhotoViewer({ items, initialIndex, onClose }: FullPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [metadataVisible, setMetadataVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const current = items[index];

  function goTo(i: number) {
    const n = items.length;
    setIndex(((i % n) + n) % n);
  }

  useEffect(() => {
    setPlaying(false);
  }, [index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const SWIPE = 50;
    const TAP = 10;

    if (Math.abs(dx) < TAP && Math.abs(dy) < TAP) {
      setMetadataVisible((v) => !v);
      return;
    }
    if (dx < -SWIPE) goTo(index + 1);
    else if (dx > SWIPE) goTo(index - 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black" role="dialog" aria-modal="true" aria-label="Full photo view">
      <div className="z-10 flex items-center justify-between px-4 pt-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-white/90" aria-label="Close photo viewer">
          <X size={20} />
          Close
        </button>
        <span className="text-sm text-white/70" aria-live="polite">
          {index + 1} / {items.length}
        </span>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => current.mediaKind === "photo" && setMetadataVisible((v) => !v)}
      >
        {current.mediaKind === "video" ? (
          playing ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={current.videoUrl}
              autoPlay
              controls
              playsInline
              className="max-h-full max-w-full"
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPlaying(true);
              }}
              className="relative flex max-h-full max-w-full items-center justify-center"
              aria-label={`Play evidence video ${index + 1} of ${items.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.photoUrl}
                alt={current.proofTypeLabel}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
              <span
                className="absolute flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Play size={28} color="#fff" />
              </span>
              {current.durationLabel && (
                <span
                  className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs text-white"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  {current.durationLabel}
                </span>
              )}
            </button>
          )
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.photoUrl}
            alt={current.proofTypeLabel}
            className="max-h-full max-w-full select-none object-contain transition-opacity duration-300 ease-out"
            draggable={false}
          />
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goTo(index - 1);
          }}
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 text-white [@media(hover:hover)]:flex"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          aria-label="Previous evidence"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goTo(index + 1);
          }}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 text-white [@media(hover:hover)]:flex"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          aria-label="Next evidence"
        >
          <ChevronRight size={22} />
        </button>

        {metadataVisible && current.mediaKind === "photo" && (
          <div
            className="absolute bottom-4 left-4 flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left text-white transition-opacity duration-200 ease-out"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          >
            <span className="text-xs font-medium">{current.proofTypeLabel}</span>
            <span className="flex items-center gap-1.5 text-xs">
              <MapPin size={12} />
              {current.trust.locationLabel}
            </span>
            <span className="text-xs text-white/70">
              {current.captureDate} · {current.captureTime}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
