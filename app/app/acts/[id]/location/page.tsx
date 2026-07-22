import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { Card } from "@/components/shared/Card";
import { MapEmbed } from "@/components/acts/living-trace/MapEmbed";

export default async function ActLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  // NOTE: bg-[var(--color-background)] intentionally removed from this
  // root wrapper -- body already carries this exact background color
  // (globals.css), so this class was a redundant duplicate paint that
  // silently hid the Living Field's ambient canvas. Same fix as
  // app/page.tsx (Sprint 01 Foundation Completion). No other change.
  return (
    <div className="flex min-h-screen flex-col pb-16">
      <ActDetailBackHeader actId={id} title="Location" />
      <div className="flex flex-col gap-4 px-5 pt-6">
        <Card className="flex flex-col gap-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {act.town}
            <br />
            {act.district}
            <br />
            {act.state}
          </p>
          <MapEmbed lat={act.latitude} lng={act.longitude} locationLabel={act.place_name} />
        </Card>
      </div>
    </div>
  );
}
