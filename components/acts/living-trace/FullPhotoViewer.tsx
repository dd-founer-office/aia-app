"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, MapPin } from "lucide-react";
import { useHorizontalSwipe } from "./useHorizontalSwipe";
import type { EvidenceTraceItem } from "./types";

export interface FullPhotoViewerProps {
  items: EvidenceTraceItem[];
  initialIndex: number;
  onClose: () => void;
}

const PHOTO_DURATION_MS = 5000;

export function FullPhotoViewer({ items, initialIndex, onClose }: FullPhotoViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const current = items[index];
  const isMapKind = current.trust.kind === "map";
  const locationLine = isMapKind ? (current.address ?? current.landmark) : current.trust.infoValue;

  function goTo(i: number) {
    const n = items.length;
    setIndex(((i % n) + n) % n);
  }

  useEffect(() => {
    setProgress(0);
    setPaused(false);
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

  // Story-style auto-advance for photos; videos advance via onEnded instead.
  useEffect(() => {
    if (current.mediaKind !== "photo" || paused) return;
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / PHOTO_DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        window.clearInterval(tick);
        goTo(index + 1);
      }
    }, 50);
    return () => window.clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current.mediaKind, paused]);

  const swipeRef = useHorizontalSwipe<HTMLDivElement>({
    onSwipeLeft: () => goTo(index + 1),
    onSwipeRight: () => goTo(index - 1),
  });

  function handleZoneTap(zone: "prev" | "next" | "center") {
    if (zone === "prev") return goTo(index - 1);
    if (zone === "next") return goTo(index + 1);
    if (current.mediaKind === "video" && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPaused(false);
      } else {
        videoRef.current.pause();
        setPaused(true);
      }
    } else {
      setPaused((p) => !p);
    }
  }

  return (
    <div
      ref={swipeRef}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ touchAction: "pan-y", height: "100dvh" }}
      role="dialog"
      aria-modal="true"
      aria-label="Full screen evidence view"
    >
      <div className="z-20 flex gap-1 px-3 pt-3">
        {items.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.3)" }}>
            <div
              className="h-full rounded-full bg-white"
              style={{
                width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                transition: i === index ? "width 50ms linear" : undefined,
              }}
            />
          </div>
        ))}
      </div>

      <div className="z-20 flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <ChevronLeft size={20} color="#fff" />
        </button>
        <span className="text-xs text-white/70" aria-live="polite">
          {index + 1} / {items.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <X size={18} color="#fff" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {current.mediaKind === "video" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={videoRef}
            key={current.id}
            src={current.videoUrl}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            onEnded={() => goTo(index + 1)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.photoUrl}
            alt={current.momentTitle}
            className="absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-300 ease-out"
            draggable={false}
          />
        <div className="absolute inset-0 z-10 flex">
          <button type="button" className="h-full w-1/4" aria-label="Previous" onClick={() => handleZoneTap("prev")} />
          <button type="button" className="h-full w-1/2" aria-label="Pause or play" onClick={() => handleZoneTap("center")} />
          <button type="button" className="h-full w-1/4" aria-label="Next" onClick={() => handleZoneTap("next")} />
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex flex-col gap-1 px-5 pb-6 pt-10 text-white"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
        >
          <span className="text-sm font-semibold">{current.momentTitle}</span>
          {locationLine && (
            <span className="flex items-center gap-1.5 text-xs">
              <MapPin size={12} />
              {locationLine}
            </span>
          )}
          <span className="text-xs text-white/70">
            {current.captureDate} · {current.captureTime}
          </span>
        </div>
      </div>
    </div>
  );
}
