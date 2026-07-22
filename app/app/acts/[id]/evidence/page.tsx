import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { getEvidenceTrace } from "@/lib/living-trace-mock";
import { getPublishedActTrace, getPublishedActSummary } from "@/lib/published-acts";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { LivingTraceViewer } from "@/components/acts/living-trace/LivingTraceViewer";

export default async function ActEvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mockAct = getActById(id);

  // NOTE: bg-[var(--color-background)] intentionally removed from both
  // branches' root wrappers below -- body already carries this exact
  // background color (globals.css), so this class was a redundant
  // duplicate paint that silently hid the Living Field's ambient canvas.
  // Same fix as app/page.tsx (Sprint 01 Foundation Completion). No other
  // change.
  if (mockAct) {
    return (
      <div className="flex min-h-screen flex-col pb-16">
        <ActDetailBackHeader actId={id} title="Living Trace" />
        <LivingTraceViewer items={getEvidenceTrace(id)} />
      </div>
    );
  }

  // Not a mock Act -- confirm it's a real published mission before rendering.
  const publishedAct = await getPublishedActSummary(id);
  if (!publishedAct) notFound();

  const items = await getPublishedActTrace(id);

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <ActDetailBackHeader actId={id} title="Living Trace" />
      <LivingTraceViewer items={items} />
    </div>
  );
}
