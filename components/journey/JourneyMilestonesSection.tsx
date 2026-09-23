import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatMonthYear } from "@/lib/format";
import type { JourneyMilestone } from "@/lib/journey";

export interface JourneyMilestonesSectionProps {
  milestones: JourneyMilestone[];
}

/** CA-012 Section 7 -- historical record only, chronological order, no
 *  rewards (locked rules). */
export function JourneyMilestonesSection({ milestones }: JourneyMilestonesSectionProps) {
  if (milestones.length === 0) return null;

  return (
    <section>
      <SectionHeader title="Journey Milestones" />
      <Card className="mt-3 divide-y divide-[var(--color-border)] p-0">
        {milestones.map((milestone) => (
          <div
            key={`${milestone.label}-${milestone.dateIso}`}
            className="flex items-center justify-between px-5 py-3.5 text-sm"
          >
            <span className="text-[var(--color-foreground)]">{milestone.label}</span>
            <span className="text-[var(--color-muted-foreground)]">
              {formatMonthYear(milestone.dateIso)}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}
