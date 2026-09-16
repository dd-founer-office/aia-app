import { getActsFeed } from "@/lib/mock-data";
import { getPublishedActsFeed } from "@/lib/published-acts";

export interface ActFeedItem {
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
 * Merges the 5 demo Acts (lib/mock-data.ts) with real published missions
 * (lib/published-acts.ts), sorted newest first -- the same merge
 * app/acts/page.tsx already did inline, now shared with the Act Detail
 * page's Related Acts section (CA-011 Section 8) so both read one
 * definition of "the feed."
 */
export async function getMergedActsFeed(): Promise<ActFeedItem[]> {
  const mockActs = getActsFeed();
  const publishedActs = await getPublishedActsFeed();

  const mockFeedItems: ActFeedItem[] = mockActs.map((act) => ({
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

  const publishedFeedItems: ActFeedItem[] = publishedActs
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

  return [...mockFeedItems, ...publishedFeedItems].sort((a, b) => b.sortDate - a.sortDate);
}
