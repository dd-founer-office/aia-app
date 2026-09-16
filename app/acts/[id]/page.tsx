import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { getPublishedActSummary } from "@/lib/published-acts";
import { getMergedActsFeed } from "@/lib/acts-feed";
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

  const publishedAct = await getPublishedActSummary(id);
  if (!publishedAct) notFound();

  // CA-011 Section 8 (Related Acts): same cause preferred, newest first,
  // 2-4 cards. Drawn from the same merged mock+real feed the Acts Feed
  // itself uses, excluding this act.
  const feed = await getMergedActsFeed();
  const relatedActs = feed
    .filter((item) => item.id !== id && item.category === publishedAct.cause)
    .slice(0, 4);

  return <PublishedActDetail act={publishedAct} id={id} relatedActs={relatedActs} />;
}
