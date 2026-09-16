import { BookOpen, HeartPulse, Soup, TreePine } from "lucide-react";
import { Card } from "@/components/shared/Card";
import { CAUSES, type CauseId } from "@/types/participation";

const ICONS = { BookOpen, HeartPulse, Soup, TreePine } as const;

export interface ParticipationSummaryCardProps {
  selectedCauseIds: CauseId[];
  monthLabel: string;
  stageLabel: string;
  continuityMonthCount: number;
}

// CA-014 Locked v1.0's example content ("Selected causes: 📚 Education, 🌳
// Environment") uses raw emoji, but Step 1 (CauseCard) already established
// lucide icons as this app's actual execution of the same cause icons --
// staying consistent with that rather than introducing emoji glyphs nothing
// else in the flow uses.
export function ParticipationSummaryCard({
  selectedCauseIds,
  monthLabel,
  stageLabel,
  continuityMonthCount,
}: ParticipationSummaryCardProps) {
  const selectedCauses = CAUSES.filter((cause) => selectedCauseIds.includes(cause.id));

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-[var(--color-muted-foreground)]">Selected causes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCauses.map((cause) => {
            const Icon = ICONS[cause.icon];
            return (
              <span
                key={cause.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-foreground)]"
              >
                <Icon size={14} className="text-[var(--color-primary)]" strokeWidth={1.75} />
                {cause.title}
              </span>
            );
          })}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 border-t border-[var(--color-border)] pt-4 text-sm">
        <dt className="text-[var(--color-muted-foreground)]">Participation month</dt>
        <dd className="text-right font-medium">{monthLabel}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Current stage</dt>
        <dd className="text-right font-medium">{stageLabel}</dd>
        <dt className="text-[var(--color-muted-foreground)]">Current continuity</dt>
        <dd className="text-right font-medium">
          {continuityMonthCount} month{continuityMonthCount === 1 ? "" : "s"}
        </dd>
      </dl>
    </Card>
  );
}
