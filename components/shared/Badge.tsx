import { Check, Clock, AlertCircle, Minus } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export type BadgeStatus = "verified" | "pending" | "error" | "inactive";

export interface BadgeProps {
  status: BadgeStatus;
  label: string;
}

const STATUS_CONFIG: Record<
  BadgeStatus,
  { Icon: ComponentType<SVGProps<SVGSVGElement>>; bg: string; fg: string }
> = {
  verified: { Icon: Check, bg: "var(--color-badge-verified-bg)", fg: "var(--color-primary-dark)" },
  pending: { Icon: Clock, bg: "var(--color-badge-pending-bg)", fg: "var(--color-pending)" },
  error: { Icon: AlertCircle, bg: "var(--color-badge-error-bg)", fg: "var(--color-error)" },
  inactive: { Icon: Minus, bg: "var(--color-badge-inactive-bg)", fg: "var(--color-muted-foreground)" },
};

/**
 * Shared Badge primitive — informational only, never interactive
 * (Visual Constitution §8: "Badges: Informational only").
 * Icon + label always present per Product Component Library COMP-009
 * Status Badge System. Color communicates state, never cause.
 */
export function Badge({ status, label }: BadgeProps) {
  const { Icon, bg, fg } = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
      style={{ backgroundColor: bg, color: fg }}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}
