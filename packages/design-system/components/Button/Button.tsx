import type { ButtonHTMLAttributes } from "react";
import { colors } from "../../tokens/colors";
import { radius } from "../../tokens/radius";
import { duration, easing } from "../../tokens/motion";

export type ButtonVariant = "primary" | "secondary" | "text";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

/**
 * Ported from aia-app/components/shared/Button.tsx.
 * Radius confirmed as full pill (9999px) against the live CSS var —
 * ignore the stale "10px" note in the original file's comment.
 */
export function Button({ variant = "primary", style, children, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    padding: "12px 20px",
    fontSize: "14px",
    fontWeight: 500,
    borderRadius: radius.button,
    transition: `color ${duration.base} ${easing.standard}, background-color ${duration.base} ${easing.standard}, opacity ${duration.base} ${easing.standard}`,
    border: "none",
    cursor: "pointer",
  };

  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary,
      color: colors.primaryForeground,
    },
    secondary: {
      backgroundColor: "transparent",
      border: `1px solid ${colors.primary}`,
      color: colors.primary,
    },
    text: {
      backgroundColor: "transparent",
      color: colors.primaryDark,
      padding: "12px 4px",
    },
  };

  return (
    <button type="button" style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  );
}
