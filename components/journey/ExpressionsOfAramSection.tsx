import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { CauseDistributionEntry } from "@/lib/journey";

export interface ExpressionsOfAramSectionProps {
  causeDistribution: CauseDistributionEntry[];
}

/** CA-012 Section 5 -- identity reflection. Locked rule: based on
 *  participation count, not contribution amount (causeDistribution is
 *  already counted that way by lib/journey.ts). */
export function ExpressionsOfAramSection({ causeDistribution }: ExpressionsOfAramSectionProps) {
  const total = causeDistribution.reduce((sum, c) => sum + c.participationCount, 0);

  return (
    <section>
      <SectionHeader title="Expressions of Aram" />
      <Card className="mt-3 flex flex-col gap-3">
        {causeDistribution.map((cause) => {
          const percentage = total > 0 ? Math.round((cause.participationCount / total) * 100) : 0;
          return (
            <div key={cause.causeId} className="flex items-center gap-3">
              <span className="w-24 text-sm text-[var(--color-foreground)]">{cause.title}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-badge-inactive-bg)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm text-[var(--color-muted-foreground)]">
                {percentage}%
              </span>
            </div>
          );
        })}
      </Card>
    </section>
  );
}
