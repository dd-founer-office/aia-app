import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { LivingTraceViewer } from "@/components/acts/living-trace/LivingTraceViewer";

export default async function ActEvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] pb-16">
      <ActDetailBackHeader actId={id} title="Living Trace" />
      <LivingTraceViewer act={act} id={id} />
    </div>
  );
}
