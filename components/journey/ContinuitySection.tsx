import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { formatMonthYear } from "@/lib/format";

export interface ContinuitySectionProps {
  continuityMonthCount: number;
  longestContinuityMonthCount: number;
  lifetimeParticipationCount: number;
  firstParticipationDateIso: string | null;
}

/** CA-012 Section 3 -- Continuity is the primary metric (locked rule);
 *  lifetime participation is secondary, shown in the same list rather than
 *  leading it. */
export function ContinuitySection({
  continuityMonthCount,
  longestContinuityMonthCount,
  lifetimeParticipationCount,
  firstParticipationDateIso,
}: ContinuitySectionProps) {
  return (
    <section>
      <SectionHeader title="Continuity" />
      <Card className="mt-3">
        <dl className="grid grid-cols-2 gap-y-3 text-sm">
          <dt className="text-[var(--color-muted-foreground)]">Current continuity</dt>
          <dd className="text-right font-medium">
            {continuityMonthCount} month{continuityMonthCount === 1 ? "" : "s"}
          </dd>
          <dt className="text-[var(--color-muted-foreground)]">Longest continuity</dt>
          <dd className="text-right font-medium">
            {longestContinuityMonthCount} month{longestContinuityMonthCount === 1 ? "" : "s"}
          </dd>
          <dt className="text-[var(--color-muted-foreground)]">Lifetime participations</dt>
          <dd className="text-right font-medium">{lifetimeParticipationCount}</dd>
          <dt className="text-[var(--color-muted-foreground)]">First participation</dt>
          <dd className="text-right font-medium">
            {firstParticipationDateIso ? formatMonthYear(firstParticipationDateIso) : "—"}
          </dd>
        </dl>
      </Card>
    </section>
  );
}
