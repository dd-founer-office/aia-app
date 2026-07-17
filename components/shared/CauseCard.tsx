"use client";

import { BookOpen, HeartPulse, Soup, TreePine, Check } from "lucide-react";
import type { Cause } from "@/types/participation";

const ICONS = {
  BookOpen,
  HeartPulse,
  Soup,
  TreePine,
} as const;

interface CauseCardProps {
  cause: Cause;
  selected: boolean;
  onToggle: () => void;
}

/**
 * The single most important component in the Participation Flow (CA-014A
 * UX spec §5). Deliberate restraint choices, preserved from spec:
 *  - Selected state changes border + a small checkmark only — the card
 *    body never fills with color. A full-color fill would read as
 *    "reward/achievement" (gamified), which is explicitly prohibited.
 *  - Unselected cards never dim when siblings are selected — dimming
 *    implies competition between causes, which this screen must avoid.
 *  - Every state transition is a single-property change (border color,
 *    checkmark opacity) — no compound animation, no scale, no shadow pop.
 */
export function CauseCard({ cause, selected, onToggle }: CauseCardProps) {
  const Icon = ICONS[cause.icon];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={selected}
      aria-label={`${cause.title}, ${cause.description}${
        selected ? ", selected" : ""
      }`}
      onClick={onToggle}
      className={[
        "group relative w-full min-h-16 flex items-start gap-3",
        "rounded-2xl border bg-(--color-aia-card) p-5 text-left",
        "transition-colors duration-150 ease-out",
        "active:border-(--color-aia-primary)/60", // pressed state — subtle, faster than selection
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-(--color-aia-primary)",
        selected
          ? "border-(--color-aia-primary) border-[1.5px]"
          : "border-(--color-aia-border)",
      ].join(" ")}
    >
      <Icon
        aria-hidden="true"
        className="h-8 w-8 shrink-0 text-(--color-aia-primary)"
        strokeWidth={1.75}
      />

      <span className="flex-1 pr-6">
        <span className="block font-sans text-base font-medium text-(--color-aia-text-primary)">
          {cause.title}
        </span>
        <span className="block mt-1 font-sans text-sm text-(--color-text-secondary)">
          {cause.description}
        </span>
      </span>

      {selected ? (
        <span
          aria-hidden="true"
          className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-aia-primary)"
        >
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </span>
      ) : null}
    </button>
  );
}
