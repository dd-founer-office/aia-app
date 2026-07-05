import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getActById, mockKuralOfTheDay } from "@/lib/mock-data";
import { EvidenceGallery } from "@/components/shared/EvidenceGallery";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

/**
 * CA-011 -- Act of Aram Detail. Polish pass per "AiA Acts Feed / Detail
 * Final UI Refinement" direction: Story -> Trust -> Meaning. No page
 * title -- the content is the title. Trust lives entirely in Verification
 * Record; the feed never shows it.
 *
 * Deviations from the locked v1.0 Notion spec, per explicit direction in
 * this pass (most recent instruction is authoritative): the old Impact
 * Snapshot grid, standalone Verification checklist, standalone "View on
 * Map" link, Related Acts, and the separate Shared Impact section are
 * removed -- none appear in the new Final Information Architecture. The
 * Shared Act detail is preserved as one Impact bullet ("N contributors
 * participated together") so COMP-005's "never show names/amounts, do
 * show count" rule isn't silently lost.
 *
 * Documents section uses 2 mock entries per act -- explicitly approved,
 * since fabricating real business records is prohibited but this is
 * presentation-only UI validation, same pattern as other mock data.
 * குறள் கூறும் அறம் reuses the same approved KKA-001 record as Home
 * (confirmed) -- per-Act Kural mapping is not yet defined.
 * "Continue Your Practice" is an explicit placeholder (confirmed) with no
 * content spec beyond what not to add (no Family Legacy/Continuity
 * concepts).
 */
export default async function ActDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${act.latitude},${act.longitude}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${act.latitude},${act.longitude}&z=14&output=embed`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 pb-28">
        {/* Hero Image -- back button overlaid, no separate header bar */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={act.hero_image_url}
            alt={act.impact_summary}
            className="h-[340px] w-full object-cover"
          />
          <Link
            href="/acts"
            className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          >
            <ChevronLeft size={20} color="#fff" />
          </Link>
          <span
            className="absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs text-white"
            style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
          >
            {act.place_name} · {act.completed_date}
          </span>
        </div>

        <div className="flex flex-col gap-10 px-5">
          {/* Headline */}
          <p className="text-2xl font-semibold leading-snug">{act.impact_summary}</p>

          {/* Story */}
          <ExpandableText lines={5}>
            <p className="text-sm leading-relaxed">
              {act.story_situation} {act.story_action} {act.story_outcome}
            </p>
          </ExpandableText>

          {/* Impact */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Impact</p>
            <ul className="flex flex-col gap-1.5 text-sm text-[var(--color-muted-foreground)]">
              {act.impact_bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </div>

          {/* Evidence */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Evidence</p>
            <EvidenceGallery
              images={[act.hero_image_url, ...act.supporting_image_urls]}
              altPrefix={`${act.cause} Act of Aram`}
            />
          </div>

          {/* Location */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Location</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {act.town}
              <br />
              {act.district}
              <br />
              {act.state}
            </p>
            <iframe
              src={mapEmbedUrl}
              className="h-40 w-full rounded-[var(--radius-photo)] border-0"
              loading="lazy"
              title="Location map"
            />
            
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium"
              style={{ color: "var(--color-primary-dark)" }}
            >
              Open in Google Maps
            </a>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Timeline</p>
            <div className="flex flex-col gap-3">
              {act.timeline.map((step) => (
                <div key={step.label} className="flex items-center justify-between">
                  <p className="text-sm">{step.label}</p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{step.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Record */}
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
                <p>{act.supporting_image_urls.length + 1}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[var(--color-muted-foreground)]">Partner Organisation</p>
                <p>{act.verification.partner_organisation}</p>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Documents</p>
            <div className="flex flex-col gap-2">
              {act.documents.map((doc) => (
                
                  key={doc.label}
                  href={doc.url}
                  className="text-sm font-medium"
                  style={{ color: "var(--color-primary-dark)" }}
                >
                  {doc.label}
                </a>
              ))}
            </div>
          </div>

          {/* குறள் கூறும் அறம் */}
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">குறள் கூறும் அறம்</p>
            <p className="whitespace-pre-line text-base leading-relaxed">
              {mockKuralOfTheDay.kural_tamil}
            </p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {mockKuralOfTheDay.core_principle}
            </p>
            <p className="text-sm italic leading-relaxed">
              {mockKuralOfTheDay.aram_for_today_body}
            </p>
          </div>

          {/* Continue Your Practice -- explicit placeholder, confirmed */}
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-medium">Continue Your Practice</p>
            <Link
              href="/acts"
              className="text-sm font-medium"
              style={{ color: "var(--color-primary-dark)" }}
            >
              Explore More Acts of Aram →
            </Link>
          </div>
        </div>
      </main>

      <BottomNavigation active="acts" />
    </div>
  );
}
