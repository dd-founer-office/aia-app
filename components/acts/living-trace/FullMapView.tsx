"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MapEmbed } from "./MapEmbed";

export interface FullMapViewProps {
  lat: number;
  lng: number;
  locationLabel: string;
  onClose: () => void;
}

/**
 * Full Map (Living Trace Constitution §5). Tapping the Trust Card
 * expands into this full-screen map; closing collapses back. Uses only
 * the approved 300ms token (Visual Constitution §12) -- no spring.
 */
export function FullMapView({ lat, lng, locationLabel, onClose }: FullMapViewProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)] transition-opacity duration-300 ease-out"
      style={{ opacity: entered ? 1 : 0 }}
      role="dialog"
      aria-modal="true"
      aria-label="Full map view"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-base font-semibold">{locationLabel}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close map"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)]"
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="flex-1 px-5 pb-6 pt-4 transition-transform duration-300 ease-out"
        style={{ transform: entered ? "scale(1)" : "scale(0.97)" }}
      >
        <MapEmbed lat={lat} lng={lng} locationLabel={locationLabel} heightClassName="h-full" />
      </div>
    </div>
  );
}
