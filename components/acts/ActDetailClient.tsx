"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Check, FileText, Receipt } from "lucide-react";
import type { MockAct } from "@/lib/mock-data";
import { mockKuralOfTheDay } from "@/lib/mock-data";
import { EvidenceViewer, type EvidenceMediaItem } from "@/components/shared/EvidenceViewer";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

// Test-only sample video, added per explicit instruction in this task
// ("add one sample video so the interaction can be tested") -- not a
// mock-data.ts schema addition, scoped to this preview integration only.
const SAMPLE_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

export function ActDetailClient({ act }: { act: MockAct }) {
  const heroRef = useRef<HTMLButtonElement>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);
  const [mapPlaceholderOpen, setMapPlaceholderOpen] = useState(false);

  const media: EvidenceMediaItem[] = [
    { kind: "photo", url: act.hero_image_url, alt: act.impact_summary },
    ...act.supporting_image_urls.slice(0, 1).map((url) => ({ kind: "photo" as const, url })),
    {
      kind: "video" as const,
      url: SAMPLE_VIDEO_URL,
      posterUrl: act.supporting_image_urls[0] ?? act.hero_image_url,
      durationLabel: "0:10",
    },
    ...act.supporting_image_urls.slice(1).map((url) => ({ kind: "photo" as const, url })),
  ];

  const photoCount = media.filter((m) => m.kind === "photo").length;
  const videoCount = media.filter((m) => m.kind === "video").length;
  const timePart = act.verification.timestamp.split(", ")[1];

  useEffect(() => {
    document.body.style.overflow = viewerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [viewerOpen]);

  function openViewer(index: number) {
    if (heroRef.current) {
      setOriginRect(heroRef.current.getBoundingClientRect());
    }
    setViewerIndex(index);
    setViewerOpen(true);
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${act.latitude},${act.longitude}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${act.latitude},${act.longitude}&z=14&output=embed`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-12 pb-28">
        <div className="relative">
          <button ref={heroRef} type="button" onClick={() => openViewer(0)} className="block w-full" aria-label="Open evidence viewer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={act.hero_image_url} alt={act.impact_summary} className="h-[380px] w-full object-cover" />
          </button>
          <Link href="/acts" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <ChevronLeft size={20} color="#fff" />
          </Link>
        </div>

        <div className="flex flex-col gap-12 px-5">
          <p className="text-2xl font-semibold leading-snug">{act.impact_summary}</p>

          <ExpandableText lines={5}>
            <p className="text-sm leading-relaxed">
              {act.story_situation} {act.story_action} {act.story_outcome}
            </p>
          </ExpandableText>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Impact</p>
            <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-muted-foreground)]">
              {act.impact_bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Evidence</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {media.length} Items · {photoCount} Photo{photoCount === 1 ? "" : "s"}
              {videoCount > 0 ? ` • ${videoCount} Video${videoCount === 1 ? "" : "s"}` : ""}
            </p>
            <button type="button" onClick={() => openViewer(0)} className="self-start text-sm font-medium" style={{ color: "var(--color-primary-dark)" }}>
              View Evidence →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {act.town}
              <br />
              {act.district}
              <br />
              {act.state}
            </p>
            <iframe src={mapEmbedUrl} className="h-40 w-full rounded-[var(--radius-photo)] border-0" loading="lazy" title="Location map" />
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-primary-dark)" }}>
              <MapPin size={14} />
              Open in Google Maps →
            </a>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Timeline</p>
            <div className="flex flex-col">
              {act.timeline.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: "var(--color-primary-dark)" }}>
                      <Check size={14} color="#fff" />
                    </div>
                    {i < act.timeline.length - 1 && (
                      <span className="mt-1 w-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-6">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{step.date}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Verification Record</p>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Captured by</p>
                <p>{act.verification.captured_by}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Verified by</p>
                <p>{act.verification.verified_by}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Timestamp</p>
                <p>{act.verification.timestamp}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">GPS Verified</p>
                <p>{act.verification.gps_verified ? "Yes" : "No"}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Evidence Count</p>
                <p>{media.length}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Partner Organisation</p>
                <p>{act.verification.partner_organisation}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Records</p>
            <div className="flex flex-col gap-2">
              {act.documents.map((doc) => (
                <a key={doc.label} href={doc.url} className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--color-primary-dark)" }}>
                  {doc.label.includes("Invoice") ? <FileText size={15} /> : <Receipt size={15} />}
                  {doc.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium">குறள் கூறும் அறம்</p>
            <p className="whitespace-pre-line text-base leading-relaxed">{mockKuralOfTheDay.kural_tamil}</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">{mockKuralOfTheDay.core_principle}</p>
            <p className="text-sm italic leading-relaxed">{mockKuralOfTheDay.aram_for_today_body}</p>
          </div>
        </div>
      </main>

      <BottomNavigation active="acts" />

      {viewerOpen && (
        <EvidenceViewer
          media={media}
          initialIndex={viewerIndex}
          locationLabel={act.place_name}
          date={act.completed_date}
          time={timePart}
          originRect={originRect}
          onClose={() => setViewerOpen(false)}
          onLocationTap={() => setMapPlaceholderOpen(true)}
        />
      )}

      {mapPlaceholderOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40" onClick={() => setMapPlaceholderOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-[var(--color-background)] p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-medium">Map Experience Placeholder</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              The full Map Experience isn't built yet — this confirms the tap interaction works.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
