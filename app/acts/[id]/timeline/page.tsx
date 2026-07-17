import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getActById } from "@/lib/mock-data";
import { ActDetailBackHeader } from "@/components/acts/ActDetailBackHeader";

export default async function ActTimelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const act = getActById(id);
  if (!act) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] pb-16">
      <ActDetailBackHeader actId={id} title="Timeline" />
      <div className="flex flex-col px-5 pt-6">
        {act.timeline.map((step, i) => (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-primary-dark)" }}
              >
                <Check size={14} color="#fff" />
              </div>
              {i < act.timeline.length - 1 && (
                <span
                  className="mt-1 w-px flex-1"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              )}
            </div>
            <div className="flex flex-col gap-0.5 pb-6">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{step.date}</p>
              <p className="text-sm text-[var(--color-muted-foreground)]">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
