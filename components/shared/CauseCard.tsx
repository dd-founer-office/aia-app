import { BookOpen, HeartPulse, Soup, TreePine, Check } from "lucide-react";
import type { Cause } from "@/types/participation";

const ICONS = { BookOpen, HeartPulse, Soup, TreePine } as const;

interface CauseCardProps {
  cause: Cause;
  selected: boolean;
  onToggle: () => void;
}

/**
 * Not built on top of <Card> — Card is a plain div wrapper, and this needs
 * real button/toggle semantics (role, aria-checked) plus a selection-state
 * border, which Card doesn't expose. Uses the same tokens Card and Button
 * already use elsewhere, so it looks identical to the rest of the app
 * without introducing anything new.
 */
export function CauseCard({ cause, selected, onToggle }: CauseCardProps) {
  const Icon = ICONS[cause.icon];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={`${cause.title}, ${cause.description}${selected ? ", selected" : ""}`}
      onClick={onToggle}
      className={`relative flex w-full items-start gap-3 rounded-[var(--radius-card)] border bg-[var(--color-card)] p-5 text-left transition-colors ${
        selected ? "border-[var(--color-primary)]" : "border-[var(--color-border)]"
      }`}
    >
      <Icon
        aria-hidden="true"
        className="h-7 w-7 shrink-0 text-[var(--color-primary)]"
        strokeWidth={1.75}
      />
      <span className="flex-1 pr-6">
        <span className="block text-base font-medium text-[var(--color-foreground)]">
          {cause.title}
        </span>
        <span className="mt-1 block text-sm text-[var(--color-muted-foreground)]">
          {cause.description}
        </span>
      </span>
      {selected ? (
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]"
        >
          <Check className="h-3.5 w-3.5 text-[var(--color-primary-foreground)]" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
