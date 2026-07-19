import { getActsFeed } from "@/lib/mock-data";
import { getPublishedActsFeed } from "@/lib/published-acts";
import { EvidenceCard } from "@/components/shared/EvidenceCard";
import { Button } from "@/components/shared/Button";
import { BottomNavigation } from "@/components/shared/BottomNavigation";

interface FeedItem {
  id: string;
  heroImage: string;
  supportingImageCount: number;
  category: string;
  placeName: string;
  completedDate: string;
  headline: string;
  supportingCopy?: string;
  isSharedAct?: boolean;
  contributorCount?: number;
  sortDate: number;
}

/**
 * CA-010 -- Acts of Aram Feed. Refined per "AiA Acts Feed -- Final UI
 * Refinement" direction: hero-forward, whitespace over icons, trust
 * discovery moved to CA-011.
 *
 * Merges the 5 demo Acts (lib/mock-data.ts) with real published missions
 * from the Mission Review Workflow (Supabase), sorted newest first.
 */
export default async function ActsPage() {
  const mockActs = getActsFeed();
  const publishedActs = await getPublishedActsFeed();

  const mockFeedItems: FeedItem[] = mockActs.map((act) => ({
    id: act.id,
    heroImage: act.hero_image_url,
    supportingImageCount: act.supporting_image_urls.length,
    category: act.cause,
    placeName: act.place_name,
    completedDate: act.completed_date,
    headline: act.impact_summary,
    supportingCopy: act.supporting_copy,
    isSharedAct: act.is_shared_act,
    contributorCount: act.contributor_count,
    sortDate: new Date(act.completed_date_iso).getTime(),
  }));

  const publishedFeedItems: FeedItem[] = publishedActs
    .filter((act) => act.heroImageUrl)
    .map((act) => ({
      id: act.id,
      heroImage: act.heroImageUrl as string,
      supportingImageCount: Math.max(act.evidenceCount - 1, 0),
      category: act.cause,
      placeName: act.landmark ?? act.organization,
      completedDate: act.missionDate,
      headline: act.title,
      supportingCopy: act.description,
      sortDate: new Date(act.missionDateIso).getTime(),
    }));

  const acts = [...mockFeedItems, ...publishedFeedItems].sort((a, b) => b.sortDate - a.sortDate);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pb-28 pt-10">
        <h1 className="text-2xl font-semibold leading-tight tracking-tight">Acts</h1>

        {acts.length > 0 ? (
          <>
            <div className="flex flex-col gap-8">
              {acts.map((act) => (
                <EvidenceCard
                  key={act.id}
                  actId={act.id}
                  heroImage={act.heroImage}
                  supportingImageCount={act.supportingImageCount}
                  category={act.category}
                  placeName={act.placeName}
                  completedDate={act.completedDate}
                  headline={act.headline}
                  supportingCopy={act.supportingCopy}
                  isSharedAct={act.isSharedAct}
                  contributorCount={act.contributorCount}
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
