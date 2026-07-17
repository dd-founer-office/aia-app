"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Play } from "lucide-react";
import type { MockAct } from "@/lib/mock-data";
import { buildActMedia } from "@/lib/act-media";
import { EvidenceViewer } from "@/components/shared/EvidenceViewer";

/**
 * A continuous vertical feed of evidence media -- not a modal-first flow,
 * not a thumbnail grid. Tapping an item still opens the existing
 * full-screen swipe/zoom EvidenceViewer for a closer look, reusing the
 * shared-element transition via the tapped item's own bounding rect.
 */
export function EvidenceFeedClient({ act, id }: { act: MockAct; id: string }) {
  const router = useRouter();
  const media = buildActMedia(act);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const timePart = act.verification.timestamp.split(", ")[1];

  function open(index: number, rect: DOMRect) {
    setOriginRect(rect);
    setViewerIndex(index);
    setViewerOpen(true);
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-6">
      {media.map((item, index) => (
        <button
          key={`${item.url}-${index}`}
          type="button"
          onClick={(e) => open(index, e.currentTarget.getBoundingClientRect())}
          className="relative block w-full overflow-hidden rounded-[var(--radius-photo)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.kind === "video" ? (item.posterUrl ?? item.url) : item.url}
            alt={item.alt ?? `Evidence ${index + 1}`}
            className="h-64 w-full object-cover"
          />
          {item.kind === "video" && (
            <span
              className="absolute inset-0 flex items-center justify-center"
              aria-hidden="true"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
              >
                <Play size={22} color="#fff" />
              </span>
            </span>
          )}
        </button>
      ))}

      {viewerOpen && (
        <EvidenceViewer
          media={media}
          initialIndex={viewerIndex}
          locationLabel={act.place_name}
          date={act.completed_date}
          time={timePart}
          originRect={originRect}
          onClose={() => setViewerOpen(false)}
          onLocationTap={() => router.push(`/acts/${id}/location`)}
        />
      )}
    </div>
  );
}
