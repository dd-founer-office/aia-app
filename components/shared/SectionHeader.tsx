import type { ReactNode } from "react";

export interface SectionHeaderProps {
  title: string;
  titleClassName?: string;
  action?: { label: string; onClick?: () => void };
  children?: ReactNode;
}

/**
 * Shared SectionHeader primitive.
 * Home Screen's section titles ("This month's participation", "Latest Act
 * of Aram", "Shared Acts of Aram") were plain <h2> tags with no action
 * slot. No atomic Product OS spec exists for this component (flagged in
 * AiA-Design-System-v1-LOCKED.md §7) — built here in-spec from the Visual
 * Constitution's general typography/border rules, extending Home's
 * existing h2 style rather than replacing it.
 *
 * titleClassName is optional. When omitted, behavior is unchanged
 * (text-base font-medium). When provided, it replaces the weight/font
 * class entirely -- used to give the KKA card's Tamil title the
 * font-tamil-sans font family instead of falling through to font-sans.
 */
export function SectionHeader({ title, titleClassName, action }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-[var(--color-border)] pb-2.5">
      <h2 className={`text-base ${titleClassName ?? "font-medium"}`}>{title}</h2>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="text-sm text-[var(--color-primary)]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
