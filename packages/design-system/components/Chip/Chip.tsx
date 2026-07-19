import type { ButtonHTMLAttributes } from "react";
import { colors } from "../../tokens/colors";
import { duration, easing } from "../../tokens/motion";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Ported from aia-app/components/shared/Chip.tsx. 32px height, per
 * AiA-Design-System-v1-LOCKED.md §4.
 */
export function Chip({ selected = false, style, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      style={{
        height: "32px",
        display: "inline-flex",
        alignItems: "center",
        padding: "0 16px",
        borderRadius: "9999px",
        fontSize: "14px",
        transition: `background-color ${duration.base} ${easing.standard}, color ${duration.base} ${easing.standard}`,
        backgroundColor: selected ? colors.primary : colors.card,
        color: selected ? colors.primaryForeground : colors.foreground,
        border: selected ? "none" : `1px solid ${colors.border}`,
        cursor: "pointer",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
