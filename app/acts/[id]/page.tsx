import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { getPublishedActSummary } from "@/lib/published-acts";
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

  return <PublishedActDetail act={publishedAct} id={id} />;
}
