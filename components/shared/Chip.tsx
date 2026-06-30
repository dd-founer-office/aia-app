import type { ButtonHTMLAttributes } from "react";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Shared Chip primitive — interactive pill, 32px height, per
 * AiA-Design-System-v1-LOCKED.md §4. Not present in Home Screen yet;
 * built fresh from the locked spec since it's needed first for
 * cause selection in the Participation Flow.
 */
export function Chip({ selected = false, className = "", children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        "h-8 inline-flex items-center px-4 rounded-full text-sm transition-colors",
        selected
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
          : "bg-[var(--color-card)] border border-[var(--color-border)] text-[var(--color-foreground)]",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
