import { Check } from "lucide-react";
import type { EvidenceRequirement } from "@/types/mission-camera";

interface EvidenceChecklistProps {
  requirements: EvidenceRequirement[];
}

/** Mission Camera Constitution P4 — only one item is ever active. */
export function EvidenceChecklist({ requirements }: EvidenceChecklistProps) {
  return (
    <ul className="flex flex-col gap-1.5">
      {requirements.map((r) => (
        <li key={r.id} className="flex items-center gap-2 text-sm">
          {r.status === "complete" ? (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-success)] text-white">
              <Check size={11} />
            </span>
          ) : r.status === "active" ? (
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
            </span>
          ) : (
            <span className="flex h-4 w-4 items-center justify-center">
              <span className="h-2 w-2 rounded-full border border-[var(--color-border)]" />
            </span>
          )}
          <span
            className={
              r.status === "complete"
                ? "text-[var(--color-muted-foreground)] line-through"
                : r.status === "active"
                ? "font-medium text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)]"
            }
          >
            {r.label}
            {r.kind === "video" && r.durationSeconds ? ` (${r.durationSeconds} sec)` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
