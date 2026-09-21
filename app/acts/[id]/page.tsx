import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { getPublishedActSummary } from "@/lib/published-acts";
import { getMyActsFeed } from "@/lib/acts-feed";
import { getMyLinkedPublishedMissionIds } from "@/lib/act-attribution";
import { ActDetailClient } from "@/components/acts/ActDetailClient";
import { PublishedActDetail } from "@/components/acts/PublishedActDetail";

export default async function ActDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mockAct = getActById(id);

  if (mockAct) {
    return <ActDetailClient act={mockAct} id={id} />;
  }

  // Personal-use-case override (2026-09-21): a real published Act's detail
  // page is only viewable by contributors who actually participated in it
  // (this covers every co-contributor on a Shared Act too, since each of
  // their own linked-mission lists includes it) -- not any signed-in user
  // who happens to know the URL.
  const linkedMissionIds = await getMyLinkedPublishedMissionIds();
  if (!linkedMissionIds.includes(id)) notFound();

  const publishedAct = await getPublishedActSummary(id);
  if (!publishedAct) notFound();

  // CA-011 Section 8 (Related Acts): same cause preferred, newest first,
  // 2-4 cards, drawn from the contributor's own Acts feed only (see
  // getMyActsFeed()), excluding this act.
  const feed = await getMyActsFeed();
  const relatedActs = feed
    .filter((item) => item.id !== id && item.category === publishedAct.cause)
    .slice(0, 4);

  return <PublishedActDetail act={publishedAct} id={id} relatedActs={relatedActs} />;
}
