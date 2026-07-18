"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MockAct } from "@/lib/mock-data";
import { getEvidenceTrace } from "@/lib/living-trace-mock";
import { TraceCard } from "./TraceCard";
import { TrustCard } from "./TrustCard";
import { FullPhotoViewer } from "./FullPhotoViewer";
import { FullMapView } from "./FullMapView";

export function LivingTraceViewer({ act }: { act: MockAct; id: string }) {
  const items = getEvidenceTrace(act.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Card Stack navigation (Living Trace Constitution -- horizontally
  // navigated collection, active card centered, adjacent cards peek).
  // Implemented on native CSS scroll-snap: swipe, trackpad, and
  // arrow-key nav all work through the browser's own scroll handling,
  // rather than hand-rolled transform math -- a documented adaptation
  // since the Visual Constitution's motion tokens don't cover native
  // scroll physics.
  function scrollToIndex(i: number) {
    const clamped = Math.max(0, Math.min(i, items.length - 1));
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    setActiveIndex(clamped);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (photoOpen || mapOpen) return;
      if (e.key === "ArrowLeft") scrollToIndex(activeIndex - 1);
      if (e.key === "ArrowRight") scrollToIndex(activeIndex + 1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, photoOpen, mapOpen]);

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let closestDist = Infinity;
    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  if (items.length === 0) {
    return (
      <div className="px-5 pt-10 text-center text-sm text-[var(--color-muted-foreground)]">
        Evidence for this Act of Aram is being prepared.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-6">
      <div className="flex items-center justify-between px-5">
        <span className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          {activeIndex + 1} / {items.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-label="Previous evidence"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === items.length - 1}
            aria-label="Next evidence"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[6%] pb-2"
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="w-[88%] shrink-0 snap-center transition-opacity duration-300 ease-out"
            style={{ opacity: i === activeIndex ? 1 : 0.55 }}
          >
            <TraceCard item={item} onOpenPhoto={() => { setActiveIndex(i); setPhotoOpen(true); }} />
            <TrustCard
              item={item}
              onExpandMap={() =>
                item.trust.lat !== undefined && item.trust.lng !== undefined
                  ? setMapOpen({ lat: item.trust.lat, lng: item.trust.lng, label: item.trust.locationLabel })
                  : undefined
              }
            />
          </div>
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
