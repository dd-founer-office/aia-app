import { getPublishedActsFeed } from "@/lib/published-acts";
import { getMyLinkedPublishedMissionIds } from "@/lib/act-attribution";

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
 * The signed-in contributor's own Acts of Aram feed -- founder-directed
 * override (2026-09-21): this is a personal-use-case app, so "Acts of
 * Aram" must mean Acts the signed-in contributor personally participated
 * in, never the org-wide feed. Replaces the earlier getMergedActsFeed(),
 * which (a) merged in 5 presentation-only demo Acts from lib/mock-data.ts
 * that don't belong to any real contributor, and (b) showed every
 * published mission system-wide rather than just this contributor's own.
 * [] for a signed-out visitor or a contributor with no published Acts yet
 * -- same "hide, don't fabricate" rule the rest of this codebase follows.
 */
export async function getMyActsFeed(): Promise<ActFeedItem[]> {
  const missionIds = await getMyLinkedPublishedMissionIds();
  if (missionIds.length === 0) return [];

  const linkedIds = new Set(missionIds);
  const publishedActs = await getPublishedActsFeed();

  return publishedActs
    .filter((act) => linkedIds.has(act.id) && act.heroImageUrl)
    .map((act) => ({
      id: act.id,
      heroImage: act.heroImageUrl as string,
      supportingImageCount: Math.max(act.evidenceCount - 1, 0),
      category: act.cause,
      placeName: act.landmark ?? act.organization,
      completedDate: act.missionDate,
      headline: act.title,
      supportingCopy: act.description,
      isSharedAct: act.isSharedAct,
      contributorCount: act.contributorCount,
      sortDate: new Date(act.missionDateIso).getTime(),
    }))
    .sort((a, b) => b.sortDate - a.sortDate);
}
