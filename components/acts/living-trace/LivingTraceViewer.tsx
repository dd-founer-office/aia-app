"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TraceCard } from "./TraceCard";
import { GeoTagCard } from "./GeoTagCard";
import { FullPhotoViewer } from "./FullPhotoViewer";
import { FullMapView } from "./FullMapView";
import { useHorizontalSwipe } from "./useHorizontalSwipe";
import type { EvidenceTraceItem } from "./types";

const CARD_W = 248;
const CARD_H = 420;
const STEP_X = 190;

function wrappedOffset(i: number, active: number, length: number) {
  let diff = i - active;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

export function LivingTraceViewer({ items }: { items: EvidenceTraceItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState<{ lat: number; lng: number; label: string } | null>(null);

  function goTo(i: number) {
    const n = items.length;
    setActiveIndex(((i % n) + n) % n);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (photoOpen || mapOpen) return;
      if (e.key === "ArrowLeft") goTo(activeIndex - 1);
      if (e.key === "ArrowRight") goTo(activeIndex + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, photoOpen, mapOpen]);

  const swipeRef = useHorizontalSwipe<HTMLDivElement>({
    onSwipeLeft: () => goTo(activeIndex + 1),
    onSwipeRight: () => goTo(activeIndex - 1),
  });

  if (items.length === 0) {
    return (
      <div className="px-5 pt-10 text-center text-sm text-[var(--color-muted-foreground)]">
        Evidence for this Act of Aram is being prepared.
      </div>
    );
  }

  const current = items[activeIndex];

  return (
    <div className="flex flex-col gap-5 pt-6">
      <div className="relative mx-auto w-full" style={{ height: CARD_H }}>
        <div ref={swipeRef} className="absolute inset-0" style={{ touchAction: "pan-y" }}>
          {items.map((item, i) => {
            const offset = wrappedOffset(i, activeIndex, items.length);
            const abs = Math.abs(offset);
            if (abs > 2) return null;
            const scale = abs === 0 ? 1 : abs === 1 ? 0.85 : 0.7;
            const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.28;
            const translateX = offset * STEP_X;
            const translateY = abs === 0 ? 0 : 10;
            return (
              <div
                key={item.id}
                className="absolute left-1/2 top-0 transition-all duration-300 ease-out"
                style={{
                  width: CARD_W,
                  height: CARD_H,
                  marginLeft: -CARD_W / 2,
                  transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale})`,
                  opacity,
                  zIndex: 10 - abs,
                  pointerEvents: abs === 0 ? "auto" : "none",
                }}
              >
                <TraceCard item={item} isActive={abs === 0} onOpenPhoto={() => setPhotoOpen(true)} />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => goTo(activeIndex - 1)}
          aria-label="Previous evidence"
          className="absolute left-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() => goTo(activeIndex + 1)}
          aria-label="Next evidence"
          className="absolute right-1 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <GeoTagCard
        item={current}
        onExpand={() =>
          current.trust.lat !== undefined && current.trust.lng !== undefined
            ? setMapOpen({ lat: current.trust.lat, lng: current.trust.lng, label: current.trust.locationLabel })
            : undefined
        }
      />

      <div className="flex items-center justify-center gap-1.5">
        {items.map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full transition-all duration-300 ease-out"
            style={{
              width: i === activeIndex ? 16 : 6,
              backgroundColor: i === activeIndex ? "var(--color-primary)" : "var(--color-border)",
            }}
          />
        ))}
      </div>

      {photoOpen && (
        <FullPhotoViewer items={items} initialIndex={activeIndex} onClose={() => setPhotoOpen(false)} />
      )}
      {mapOpen && (
        <FullMapView lat={mapOpen.lat} lng={mapOpen.lng} locationLabel={mapOpen.label} onClose={() => setMapOpen(null)} />
      )}
    </div>
  );
}
