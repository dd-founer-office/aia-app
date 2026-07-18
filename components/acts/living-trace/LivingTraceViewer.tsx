"use client";

import { useEffect, useRef, useState } from "react";
import type { MockAct } from "@/lib/mock-data";
import { getEvidenceTrace } from "@/lib/living-trace-mock";
import { TraceCard } from "./TraceCard";
import { GeoTagCard } from "./GeoTagCard";
import { FullPhotoViewer } from "./FullPhotoViewer";
import { FullMapView } from "./FullMapView";

const CARD_W = 248;
const CARD_H = 420;
const STEP_X = 190;
const STEP_ROTATE = 14;

function wrappedOffset(i: number, active: number, length: number) {
  let diff = i - active;
  if (diff > length / 2) diff -= length;
  if (diff < -length / 2) diff += length;
  return diff;
}

/**
 * 3D coverflow-style card stack, per reference image. Loops infinitely
 * ("rotation basis") -- swiping/paging past either end wraps around,
 * per explicit direction. Opaque cards only, no blur/glassmorphism.
 */
export function LivingTraceViewer({ act }: { act: MockAct; id: string }) {
  const items = getEvidenceTrace(act.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState<{ lat: number; lng: number; label: string } | null>(null);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const wheelLock = useRef(false);

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

  function handleWheel(e: React.WheelEvent) {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
    if (wheelLock.current) return;
    if (e.deltaX > 20) {
      goTo(activeIndex + 1);
      wheelLock.current = true;
      setTimeout(() => (wheelLock.current = false), 350);
    } else if (e.deltaX < -20) {
      goTo(activeIndex - 1);
      wheelLock.current = true;
      setTimeout(() => (wheelLock.current = false), 350);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    touchStart.current = null;
    if (dx < -50) goTo(activeIndex + 1);
    else if (dx > 50) goTo(activeIndex - 1);
  }

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
      <div
        className="relative mx-auto w-full"
        style={{ height: CARD_H, perspective: "1200px" }}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, i) => {
          const offset = wrappedOffset(i, activeIndex, items.length);
          const abs = Math.abs(offset);
          if (abs > 2) return null;
          const scale = abs === 0 ? 1 : abs === 1 ? 0.85 : 0.7;
          const opacity = abs === 0 ? 1 : abs === 1 ? 0.55 : 0.28;
          const rotate = offset === 0 ? 0 : offset > 0 ? -STEP_ROTATE : STEP_ROTATE;
          const translateX = offset * STEP_X;
          return (
            <div
              key={item.id}
              className="absolute left-1/2 top-0 transition-all duration-300 ease-out"
              style={{
                width: CARD_W,
                height: CARD_H,
                marginLeft: -CARD_W / 2,
                transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotate}deg)`,
                opacity,
                zIndex: 10 - abs,
                pointerEvents: abs === 0 ? "auto" : "none",
              }}
            >
              <TraceCard item={item} reflection={act.reflection} onOpenPhoto={() => setPhotoOpen(true)} />
            </div>
          );
        })}
      </div>

     <GeoTagCard
        item={current}
        onPrev={() => goTo(activeIndex - 1)}
        onNext={() => goTo(activeIndex + 1)}
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
