import { getActsFeed } from "@/lib/mock-data";
import { EvidenceCard } from "@/components/shared/EvidenceCard";
import { Button } from "@/components/shared/Button";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

/**
 * CA-010 -- Acts of Aram Feed.
 * Implements the approved editorial mockup exactly (Locked v1.1 direction):
 * no Featured Impact section, no cause filter chips, no subtitle -- the
 * newest completed Act leads the feed naturally. Mock data only; Supabase
 * integration is out of scope for this screen per Sprint 1 sequencing.
 */
export default function ActsPage() {
  const acts = getActsFeed();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-5 pb-28 pt-10">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">Acts</h1>

        {acts.length > 0 ? (
          <>
            <div className="flex flex-col gap-6">
              {acts.map((act) => (
                <EvidenceCard
                  key={act.id}
                  heroImage={act.hero_image_url}
                  supportingImages={act.supporting_image_urls}
                  cause={act.cause}
                  location={act.location}
                  impactSummary={act.impact_summary}
                  completedDate={act.completed_date}
                  isSharedAct={act.is_shared_act}
                  contributorCount={act.contributor_count}
                />
              ))}
            </div>
            <Button variant="secondary" className="self-center">
              View More Acts
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 pt-16 text-center">
            <p className="text-base font-medium">Verified Acts of Aram will appear here.</p>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              As Acts are completed and documented, they will become part of this growing record
              of Aram.
            </p>
            <Button variant="text" className="mt-2">
              Begin an Act of Aram →
            </Button>
          </div>
        )}
      </main>

      <BottomNavigation active="acts" />
    </div>
  );
}
