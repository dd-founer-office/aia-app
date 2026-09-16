import { STAGE_LABELS } from "@/types";
import { Card } from "@/components/shared/Card";
import { SectionHeader } from "@/components/shared/SectionHeader";
import type { StageRequirement } from "@/lib/journey";

export interface NextStageSectionProps {
  nextStageRequirement: StageRequirement | null;
  currentParticipations: number;
  currentContinuityMonths: number;
}

/** CA-012 Section 4 -- future orientation. Locked rules: display
 *  requirements clearly, avoid progress bars, avoid countdown language,
 *  avoid pressure -- so this is two plain stat lines, not a progress bar. */
export function NextStageSection({
  nextStageRequirement,
  currentParticipations,
  currentContinuityMonths,
}: NextStageSectionProps) {
  if (!nextStageRequirement) {
    return (
      <section>
        <SectionHeader title="Next Stage" />
        <Card className="mt-3">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            You have reached Vanam, the final stage of the Aram Journey.
          </p>
        </Card>
      </section>
    );
  }

  const label = STAGE_LABELS[nextStageRequirement.stage];

  return (
    <section>
      <SectionHeader title="Next Stage" />
      <Card className="mt-3 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{label.emoji}</span>
          <p className="text-base font-medium text-[var(--color-foreground)]">{label.en}</p>
        </div>
        <div className="text-sm">
          <p className="text-[var(--color-muted-foreground)]">Requirements</p>
          <p className="mt-0.5 font-medium text-[var(--color-foreground)]">
            {nextStageRequirement.participations} participations + {nextStageRequirement.continuityMonths}{" "}
            months continuity
          </p>
        </div>
        <div className="text-sm">
          <p className="text-[var(--color-muted-foreground)]">Current progress</p>
          <p className="mt-0.5 font-medium text-[var(--color-foreground)]">
            {currentParticipations} participations + {currentContinuityMonths} months continuity
          </p>
        </div>
      </Card>
    </section>
  );
}
