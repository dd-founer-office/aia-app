import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { Button } from "@/components/shared/Button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { PublishedActSummary } from "@/lib/published-acts";
import type { ActFeedItem } from "@/lib/acts-feed";

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
export function PublishedActDetail({
  act,
  relatedActs,
}: {
  act: PublishedActSummary;
  id: string;
  relatedActs: ActFeedItem[];
}) {
  const hasStory = act.storySituation && act.storyAction && act.storyOutcome;

  return (
    <div className="flex min-h-screen flex-col gap-5 px-5 pb-16 pt-6">
      {act.heroImageUrl && (
        <div
          className="w-full overflow-hidden"
          style={{ borderRadius: "var(--radius-card)", aspectRatio: "4 / 3" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={act.heroImageUrl} alt={act.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {act.cause}
        </span>
        <h1 className="font-display text-xl text-[var(--color-foreground)]">{act.title}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{act.description}</p>
      </div>

      {/* Impact Snapshot (CA-011 Section 2) -- max 4 data points: who
          benefited, what happened, where, when. */}
      <Card>
        <dl className="flex flex-col gap-2 text-sm">
          {act.beneficiaryCount !== null && (
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Beneficiaries</dt>
              <dd className="text-[var(--color-foreground)]">{act.beneficiaryCount}</dd>
            </div>
          )}
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-muted-foreground)]">Organization</dt>
            <dd className="text-[var(--color-foreground)]">{act.organization}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-[var(--color-muted-foreground)]">Date</dt>
            <dd className="text-[var(--color-foreground)]">{act.missionDate}</dd>
          </div>
          {act.landmark && (
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Location</dt>
              <dd className="text-[var(--color-foreground)]">{act.landmark}</dd>
            </div>
          )}
          {act.participatingContributorCount !== null && (
            <div className="flex items-center justify-between">
              <dt className="text-[var(--color-muted-foreground)]">Participating Contributors</dt>
              <dd className="text-[var(--color-foreground)]">{act.participatingContributorCount}</dd>
            </div>
          )}
        </dl>
      </Card>

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
          per-item tracked flags. */}
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
