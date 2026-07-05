import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getActById, mockKuralOfTheDay } from "@/lib/mock-data";
import { EvidenceGallery } from "@/components/shared/EvidenceGallery";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

const NATURE_TIMELINE = [
  { icon: "🌱", label: "Planned", description: "Initiative approved by AiA" },
  { icon: "🌿", label: "Prepared", description: "Materials arranged and volunteers assigned" },
  { icon: "🌾", label: "Executed", description: "Act completed successfully on site" },
  { icon: "🌳", label: "Verified", description: "Evidence reviewed and GPS verified" },
  { icon: "🌲", label: "Published", description: "Officially available to contributors" },
] as const;

/**
 * CA-011 -- Act of Aram Detail. Final polish lock per "CA-011 Act Detail
 * Final Lock (v1.0)": Story -> Trust -> Meaning, calm/premium/editorial.
 *
 * Deviations from earlier passes, per this most-recent locked direction:
 * - "Continue Your Practice" removed entirely (this pass explicitly
 *   postpones the Continuity pillar; supersedes the earlier placeholder).
 * - "Documents" renamed to "Records".
 * - Timeline replaced with a nature-inspired progression (Planned ->
 *   Prepared -> Executed -> Verified -> Published) with its own icon set
 *   (🌱🌿🌾🌳🌲) -- explicitly NOT the contributor Aram Journey stages
 *   (Vidhai/Thulir/Kandru/Maram/Vanam), which belong only to the
 *   contributor journey. Copy is fixed/universal per this spec's own
 *   wording, hardcoded here rather than added to mock-data.
 * - Location pin icon removed from the hero overlay -- typography only.
 *   The overlay links to Google Maps (functional today) rather than a
 *   "future Map Experience" placeholder with no destination.
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
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-12 pb-28">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={act.hero_image_url} alt={act.impact_summary} className="h-[380px] w-full object-cover" />
          <Link href="/acts" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <ChevronLeft size={20} color="#fff" />
          </Link>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-4 text-xs text-white">
            {act.place_name} · {act.completed_date}
          </a>
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

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Evidence</p>
            <EvidenceGallery images={[act.hero_image_url, ...act.supporting_image_urls]} altPrefix={`${act.cause} Act of Aram`} />
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
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium" style={{ color: "var(--color-primary-dark)" }}>
              Open in Google Maps →
            </a>
          </div>

          <div className="flex flex-col gap-5">
            <p className="text-sm font-medium">Timeline</p>
            <div className="flex flex-col">
              {NATURE_TIMELINE.map((step, i) => (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-lg leading-none">{step.icon}</span>
                    {i < NATURE_TIMELINE.length - 1 && (
                      <span className="mt-1 w-px flex-1" style={{ backgroundColor: "var(--color-border)" }} />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 pb-5">
                    <p className="text-sm font-medium">{step.label}</p>
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
                <p>{act.supporting_image_urls.length + 1}</p>
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
                <a key={doc.label} href={doc.url} className="text-sm font-medium" style={{ color: "var(--color-primary-dark)" }}>
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
    </div>
  );
}
