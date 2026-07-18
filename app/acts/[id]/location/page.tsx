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

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] pb-16">
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
