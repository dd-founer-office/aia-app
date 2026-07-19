import type { ElementType } from "react";
import { colors } from "../../tokens/colors";

export interface IconBadgeProps {
  icon: ElementType;
}

/**
 * Ported from aia-app/components/shared/IconBadge.tsx.
 * Visual Constitution v1.1 "New Patterns Added" — small circular badge,
 * light tint background, icon in primary green.
 */
export function IconBadge({ icon: Icon }: IconBadgeProps) {
  return (
    <span
      style={{
        display: "flex",
        height: "36px",
        width: "36px",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "9999px",
        backgroundColor: colors.badgeVerifiedBg,
      }}
    >
      <Icon size={16} style={{ color: colors.primary }} />
    </span>
  );
}
