import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { ActDetailClient } from "@/components/acts/ActDetailClient";

export default async function ActDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  return <ActDetailClient act={act} id={id} />;
}
