import { Check, Clock, AlertCircle, Minus, type LucideIcon } from "lucide-react";
import { colors } from "../../tokens/colors";

export type BadgeStatus = "verified" | "pending" | "error" | "inactive";

export interface BadgeProps {
  status: BadgeStatus;
  label: string;
}

const STATUS_CONFIG: Record<BadgeStatus, { Icon: LucideIcon; bg: string; fg: string }> = {
  verified: { Icon: Check, bg: colors.badgeVerifiedBg, fg: colors.primaryDark },
  pending: { Icon: Clock, bg: colors.badgePendingBg, fg: colors.pending },
  error: { Icon: AlertCircle, bg: colors.badgeErrorBg, fg: colors.error },
  inactive: { Icon: Minus, bg: colors.badgeInactiveBg, fg: colors.mutedForeground },
};

/**
 * Ported from aia-app/components/shared/Badge.tsx.
 * Informational only — never interactive (Visual Constitution §8).
 * Color communicates status, never category — do not repurpose for Cause.
 */
export function Badge({ status, label }: BadgeProps) {
  const { Icon, bg, fg } = STATUS_CONFIG[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        padding: "4px 10px",
        borderRadius: "9999px",
        backgroundColor: bg,
        color: fg,
      }}
    >
      <Icon size={13} />
      {label}
    </span>
  );
}
