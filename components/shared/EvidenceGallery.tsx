"use client";

import { useState } from "react";

/**
 * Lightweight tap-to-enlarge gallery for CA-011 Section 4 (Evidence
 * Gallery). Locked spec calls for "swipe between images" -- this ships
 * tap-to-open + prev/next buttons as the minimal version; swipe gesture
 * is deferred to a dedicated CA-011 polish pass.
 */
export function EvidenceGallery({
  images,
  altPrefix,
}: {
  images: string[];
  altPrefix: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-[var(--radius-photo)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`${altPrefix} ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex]}
            alt={`${altPrefix} ${openIndex + 1}`}
            className="max-h-full max-w-full rounded-[var(--radius-photo)] object-contain"
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 flex gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((openIndex - 1 + images.length) % images.length);
                }}
                className="rounded-full bg-white/20 px-4 py-2 text-sm text-white"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIndex((openIndex + 1) % images.length);
                }}
                className="rounded-full bg-white/20 px-4 py-2 text-sm text-white"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
