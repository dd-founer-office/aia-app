import { CaptureProgress } from "./CaptureProgress";
import { EvidenceChecklist } from "./EvidenceChecklist";
import type { EvidenceRequirement } from "@/types/mission-camera";

interface MissionGuidanceCardProps {
  missionName: string;
  requirements: EvidenceRequirement[];
}

/** Mission Camera Constitution P4 — below preview, never overlaps the live feed. */
export function MissionGuidanceCard({ missionName, requirements }: MissionGuidanceCardProps) {
  const completed = requirements.filter((r) => r.status === "complete").length;

  return (
    <div className="rounded-t-[var(--radius-card)] border-t border-[var(--color-border)] bg-[var(--color-card)] px-5 pb-5 pt-4">
      <p className="text-xs text-[var(--color-muted-foreground)]">Current Mission</p>
      <p className="mb-3 font-display text-base text-[var(--color-foreground)]">{missionName}</p>
      <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">Evidence Progress</p>
      <EvidenceChecklist requirements={requirements} />
      <div className="mt-3">
        <CaptureProgress completed={completed} total={requirements.length} />
      </div>
    </div>
  );
}
