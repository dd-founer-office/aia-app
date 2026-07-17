import { notFound } from "next/navigation";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";
import { Card } from "@/components/shared/Card";

export default async function ActImpactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] pb-16">
      <ActDetailBackHeader actId={id} title="Impact" />
      <div className="flex flex-col gap-4 px-5 pt-6">
        <Card className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
            {act.impact_bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
