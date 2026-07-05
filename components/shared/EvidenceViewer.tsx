"use client";

import { useEffect, useRef, useState } from "react";
import { X, MapPin, Play, ChevronLeft, ChevronRight } from "lucide-react";

export type EvidenceMediaKind = "photo" | "video";

export interface EvidenceMediaItem {
  kind: EvidenceMediaKind;
  url: string;
  posterUrl?: string;
  durationLabel?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface EvidenceViewerProps {
  media: EvidenceMediaItem[];
  initialIndex?: number;
  locationLabel: string;
  date: string;
  time?: string;
  originRect?: DOMRect | null;
  onClose: () => void;
  onLocationTap?: () => void;
}

/**
 * Evidence Viewer v2.0 -- reusable component, not a page or popup modal.
 * "I'm witnessing the evidence of a verified Act of Aram," not "I'm
 * browsing photos." One continuous, chronological media collection --
 * the hero image and every other piece of evidence are items in the
 * same collection, with no separate "hero" experience.
 *
 * Supersedes v1.0: no long-press menu, no Evidence Record sheet (deeper
 * verification data already lives on Act Detail's own Verification
 * Record section). Entrance uses a true shared-element transition via
 * the optional originRect prop, falling back to a centered scale-in.
 *
 * Component only -- not wired into any screen, per "We are NOT modifying
 * the Act Detail page."
 */
export function EvidenceViewer({
  media,
  initialIndex = 0,
  locationLabel,
  date,
  time,
  originRect,
  onClose,
  onLocationTap,
}: EvidenceViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [metadataVisible, setMetadataVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [entered, setEntered] = useState(false);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const current = media[index];

  const entryTransform = (() => {
    if (!originRect || entered) return undefined;
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh = typeof window !== "undefined" ? window.innerHeight : 0;
    const scaleX = originRect.width / vw;
    const scaleY = originRect.height / vh;
    const translateX = originRect.left + originRect.width / 2 - vw / 2;
    const translateY = originRect.top + originRect.height / 2 - vh / 2;
    return `translate(${translateX}px, ${translateY}px) scale(${Math.max(scaleX, scaleY)})`;
  })();

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setPlaying(false);
  }, [index]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, media.length - 1));
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [media.length, onClose]);

  function distanceBetween(t: React.TouchList) {
    const a = t[0];
    const b = t[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchStart.current = { dist: distanceBetween(e.touches), scale };
      return;
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      if (scale > 1) {
        panStart.current = { x: t.clientX, y: t.clientY, tx: translate.x, ty: translate.y };
      }
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchStart.current) {
      const dist = distanceBetween(e.touches);
      const ratio = dist / pinchStart.current.dist;
      setScale(Math.min(Math.max(pinchStart.current.scale * ratio, 1), 4));
      return;
    }
    if (e.touches.length === 1 && scale > 1 && panStart.current) {
      const t = e.touches[0];
      setTranslate({
        x: panStart.current.tx + (t.clientX - panStart.current.x),
        y: panStart.current.ty + (t.clientY - panStart.current.y),
      });
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    pinchStart.current = null;
    panStart.current = null;

    if (scale > 1 || !touchStart.current) {
      touchStart.current = null;
      return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;

    const SWIPE_THRESHOLD = 50;
    const TAP_THRESHOLD = 10;

    if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD) {
      setMetadataVisible((v) => !v);
      return;
    }
    if (dy > SWIPE_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onClose();
      return;
    }
    if (dx < -SWIPE_THRESHOLD) {
      setIndex((i) => Math.min(i + 1, media.length - 1));
      return;
    }
    if (dx > SWIPE_THRESHOLD) {
      setIndex((i) => Math.max(i - 1, 0));
    }
  }

  function handleDoubleClick() {
    if (current.kind !== "photo") return;
    setScale((s) => (s > 1 ? 1 : 2));
    setTranslate({ x: 0, y: 0 });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Evidence Viewer"
    >
      <div className="z-10 flex items-center justify-between px-4 pt-4">
        <button type="button" onClick={onClose} className="flex items-center gap-1 text-sm text-white/90" aria-label="Close evidence viewer">
          <X size={20} />
          Close
        </button>
        <span className="text-sm text-white/70" aria-live="polite">
          {index + 1} / {media.length}
        </span>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="flex h-full w-full items-center justify-center transition-transform duration-300 ease-out"
          style={{ transform: entryTransform }}
        >
          {current.kind === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.alt ?? `Evidence ${index + 1} of ${media.length}`}
              className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
              style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
              draggable={false}
            />
          ) : playing ? (
            <video
              src={current.url}
              autoPlay
              controls
              playsInline
              className="max-h-full max-w-full"
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="relative flex max-h-full max-w-full items-center justify-center"
              aria-label={`Play evidence video ${index + 1} of ${media.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.posterUrl ?? current.url}
                alt={current.alt ?? `Evidence video ${index + 1} of ${media.length}`}
                className="max-h-full max-w-full select-none object-contain"
                draggable={false}
              />
              <span className="absolute flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <Play size={28} color="#fff" />
              </span>
              {current.durationLabel && (
                <span className="absolute bottom-3 right-3 rounded-md px-2 py-1 text-xs text-white" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                  {current.durationLabel}
                </span>
              )}
            </button>
          )}
        </div>
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 text-white [@media(hover:hover)]:flex"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            aria-label="Previous evidence"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {index < media.length - 1 && (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(i + 1, media.length - 1))}
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full p-2 text-white [@media(hover:hover)]:flex"
            style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            aria-label="Next evidence"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {metadataVisible && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLocationTap?.();
            }}
            className="absolute bottom-4 left-4 flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left text-white transition-opacity duration-200"
            style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}
          >
            <span className="flex items-center gap-1.5 text-xs">
              <MapPin size={12} />
              {locationLabel}
            </span>
            <span className="text-xs text-white/70">
              {date}
              {time ? ` · ${time}` : ""}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
