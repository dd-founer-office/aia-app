import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { ActDetailHero } from "@/components/acts/ActDetailHero";
import { ActTestimonial } from "@/components/acts/ActTestimonial";
import { ActTheAct } from "@/components/acts/ActTheAct";
import { ActEvidence } from "@/components/acts/ActEvidence";
import type { PublishedActSummary } from "@/lib/published-acts";
import type { ActFeedItem } from "@/lib/acts-feed";
import type { EvidenceTraceItem } from "@/components/acts/living-trace/types";
import { ANNADHANAM_ELDERS_ACT_ID, ANNADHANAM_ELDERS_HERO, ANNADHANAM_ELDERS_EVIDENCE } from "@/lib/act-content-overrides";

// Act Detail render for real (Supabase-backed) published missions. Was
// deliberately minimal (no story/verification/documents) because Mission
// Review didn't collect that data -- it now collects beneficiary count and
// a short story (mission_publications_impact_story_fields migration), so
// CA-011's Impact Snapshot/Story/Verification Summary sections render here
// too. Participating Contributors is real now too (lib/act-attribution.ts)
// -- shown only when known, per the same "genuinely unknown, never a
// fabricated zero" rule as beneficiaryCount. Still honest about what's
// genuinely missing: no documents exist in this schema at all (Records has
// no real backing, unlike the mock Acts' invented ones).
//
// NOTE: bg-[var(--color-background)] intentionally removed from this root
// wrapper -- body already carries this exact background color
// (globals.css), so this class was a redundant duplicate paint that
// silently hid the Living Field's ambient canvas. Same fix as app/page.tsx
// (Sprint 01 Foundation Completion). No other change.
//
// mx-auto max-w-md w-full added -- this was the one Act Detail path
// missing the same mobile-width constraint Home, the Acts feed, and the
// mock Acts' own ActDetailClient all already use, so a published Act was
// stretching to full desktop width instead of the app's fixed mobile
// column.
export function PublishedActDetail({
  act,
  relatedActs,
  evidence,
}: {
  act: PublishedActSummary;
  id: string;
  relatedActs: ActFeedItem[];
  evidence: EvidenceTraceItem[];
}) {
  const hasStory = act.storySituation && act.storyAction && act.storyOutcome;
  // Narrow, id-scoped overrides for the Annadhanam for Elders Act -- see
  // lib/act-content-overrides.ts. Every other Act renders exactly as
  // before: eyebrow shown, default hero crop, Verification Summary
  // shown, page background unchanged.
  const isAnnadhanamElders = act.id === ANNADHANAM_ELDERS_ACT_ID;

  return (
    <div
      className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-5 pb-16 pt-6"
      style={isAnnadhanamElders ? { background: "#FFFFFF" } : undefined}
    >
      {/* Hero (CA-011 Section 1) + Act Snapshot (CA-011 Section 2) render as
          one continuous teal surface inside ActDetailHero -- see that
          file's own comment. Geometry-only pass for the snapshot collage;
          real date/location/partner/sapling-count content and icons
          replace the placeholder bars in a later pass. */}
      <ActDetailHero
        actId={act.id}
        heroImageUrl={isAnnadhanamElders ? ANNADHANAM_ELDERS_HERO.heroImageUrl : act.heroImageUrl}
        title={isAnnadhanamElders ? ANNADHANAM_ELDERS_HERO.title : act.title}
        description={isAnnadhanamElders ? ANNADHANAM_ELDERS_HERO.description : act.description}
        cause={act.cause}
        showEyebrow={!isAnnadhanamElders}
        // The real hero photo for this Act is a wide hall shot; inside the
        // standard 4:5 portrait hero container a centered crop lands on
        // the empty center aisle, so the crop is pulled to the right
        // edge, where the nearest elder (facing camera, meal in hand)
        // stays fully in frame.
        imageObjectPosition={isAnnadhanamElders ? "96% center" : "center"}
      />

      {/* "They Say It Better" (CA-011 Living Moment) -- the real
          tree-planting video + quote, immediately after the hero/snapshot
          on the page's own light background (a new section, not a
          continuation of the hero's dark canvas). See ActTestimonial's
          own comment for why the quote is a marked placeholder. */}
      <ActTestimonial />

      {/* "The Act" (CA-011 visual story) -- the Act's own real photographs,
          told as 2-4 selectable moments (data-driven, never padded out to
          a fixed count). No date/location/partner/quantity here -- that's
          Act Snapshot's job; this section is about what happened. */}
      <ActTheAct actId={act.id} />

      {/* "The Evidence" (CA-011 visual story, part 2) -- real capture
          photos plus the same per-photo WHEN/WHERE/WHO records the full
          Living Trace Viewer (/acts/[id]/evidence) uses, so nothing here
          can drift from what that viewer itself shows. Renders nothing
          when this Act has no evidence rows yet. */}
      <ActEvidence
        actId={act.id}
        organization={isAnnadhanamElders ? ANNADHANAM_ELDERS_HERO.organization : act.organization}
        evidence={isAnnadhanamElders ? ANNADHANAM_ELDERS_EVIDENCE : evidence}
      />

      {/* Story (CA-011 Section 3) -- situation -> action -> outcome. Only
          rendered when Ops has filled in all three; otherwise this section
          simply doesn't exist yet for this Act, rather than showing a
          half-empty story. */}
      {hasStory && (
        <section>
          <SectionHeader title="Story" />
          <Card className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-[var(--color-foreground)]">
            <p>{act.storySituation}</p>
            <p>{act.storyAction}</p>
            <p>{act.storyOutcome}</p>
          </Card>
        </section>
      )}

      {/* Verification Summary (CA-011 Section 5). getPublishedActSummary
          only ever returns missions with status='published', and reaching
          that status is itself AiA's process guarantee (Impact Assurance,
          locked) -- so these four checks are always true here, not
          per-item tracked flags. Omitted entirely for Annadhanam for
          Elders per the founder's explicit request for this Act. */}
      {!isAnnadhanamElders && (
        <section>
          <SectionHeader title="Verification Summary" />
          <Card className="mt-3 flex flex-col gap-2.5">
            {["Opportunity Verified", "Execution Completed", "Documentation Approved", "Published"].map(
              (label) => (
                <div key={label} className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                  <CheckCircle2 size={16} className="shrink-0 text-[var(--color-primary)]" />
                  {label}
                </div>
              )
            )}
          </Card>
        </section>
      )}

      <Link href={`/acts/${act.id}/evidence`}>
        <Button variant="primary" className="w-full">
          View Living Trace
        </Button>
      </Link>

      {/* Related Acts (CA-011 Section 8) -- same cause preferred, newest
          first, hidden entirely when none exist. */}
      {relatedActs.length > 0 && (
        <section>
          <SectionHeader title="Related Acts" />
          <div className="mt-3 flex flex-col gap-3">
            {relatedActs.map((related) => (
              <Link
                key={related.id}
                href={`/acts/${related.id}`}
                className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={related.heroImage}
                  alt={related.headline}
                  className="h-14 w-14 shrink-0 rounded-[var(--radius-photo)] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                    {related.headline}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{related.placeName}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
