import { List } from "lucide-react";
import type { EvidenceRequirement } from "@/types/mission-camera";

interface CaptureProgressDotsProps {
  requirements: EvidenceRequirement[];
  onOpenChecklist: () => void;
}

/**
 * Compact replacement for the full Mission Guidance Card during active
 * capture -- keeps the camera preview dominant (Constitution P1). The
 * full checklist is one tap away via the list icon, opened in a
 * BottomSheet instead of staying permanently on screen.
 */
export function CaptureProgressDots({ requirements, onOpenChecklist }: CaptureProgressDotsProps) {
  const active = requirements.find((r) => r.status === "active");
  const completed = requirements.filter((r) => r.status === "complete").length;

  return (
    <div className="flex items-center justify-between rounded-[var(--radius-card)] border-t border-[var(--color-border)] bg-[var(--color-card)] px-5 py-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {requirements.map((r) => (
            <span
              key={r.id}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  r.status === "complete"
                    ? "var(--color-success)"
                    : r.status === "active"
                    ? "var(--color-primary)"
                    : "var(--color-border)",
              }}
            />
          ))}
        </div>
        <span className="text-sm text-[var(--color-foreground)]">
          {active ? active.label : `${completed}/${requirements.length} complete`}
        </span>
      </div>
      <button
        type="button"
        onClick={onOpenChecklist}
        aria-label="View full evidence checklist"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-badge-verified-bg)] text-[var(--color-primary-dark)]"
      >
        <List size={16} />
      </button>
    </div>
  );
}
