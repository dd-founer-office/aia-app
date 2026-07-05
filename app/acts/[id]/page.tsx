import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Check, FileText, Receipt } from "lucide-react";
import { getActById, mockKuralOfTheDay } from "@/lib/mock-data";
import { EvidenceGallery } from "@/components/shared/EvidenceGallery";
import { ExpandableText } from "@/components/shared/ExpandableText";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

/**
 * CA-011 -- Act of Aram Detail. Final polish lock v1.1: Story -> Trust ->
 * Meaning, calm/premium/editorial. Supersedes v1.0's icon-free hero
 * overlay (MapPin restored) and nature-emoji timeline (replaced with the
 * forest-green filled-circle + checkmark + connector language, which
 * v1.1 designates the permanent AiA timeline pattern). Records icons use
 * Lucide FileText/Receipt rather than the brief's illustrative emoji, per
 * Section 14's own philosophy (no emojis; Invoice/Receipt are approved
 * Lucide icon categories) -- flagged assumption.
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
          <img src={act.hero_image_url} alt={act.impact_summary} className="h-[380px] w-full object-cover" />
          <Link href="/acts" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
            <ChevronLeft size={20} color="#fff" />
          </Link>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-4 left-4 flex items-center gap-1.5 text-xs text-white">
            <MapPin size={13} />
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
    </div>
  );
}
