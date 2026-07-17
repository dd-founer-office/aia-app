import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { Card } from "@/components/shared/Card";

export default async function ActLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${act.latitude},${act.longitude}`;
  const mapEmbedUrl = `https://www.google.com/maps?q=${act.latitude},${act.longitude}&z=14&output=embed`;

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
          <iframe
            src={mapEmbedUrl}
            className="h-48 w-full rounded-[var(--radius-photo)] border-0"
            loading="lazy"
            title="Location map"
          />
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-primary-dark)" }}
          >
            <MapPin size={14} />
            Open in Google Maps →
          </a>
        </Card>
      </div>
    </div>
  );
}
