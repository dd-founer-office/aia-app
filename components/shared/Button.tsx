import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "text";
}

/**
 * Shared Button primitive.
 * "Primary" extracted verbatim from Home's inline participation CTA.
 * "Secondary" and "text" added per AiA-Design-System-v1-LOCKED.md §4 —
 * not yet used anywhere in Home, but required by the Visual Constitution's
 * "one primary CTA per screen" rule, which needs secondary/text buttons to
 * be meaningful (otherwise every action would have to be a primary button).
 *
 * Note: Home's original CTA used `rounded-full`; locked spec §4 calls for
 * `--radius-button` (10px), not a full pill. Corrected here per "spec wins."
 */
export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base = "px-5 py-3 text-sm font-medium transition-colors rounded-[var(--radius-button)]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
    secondary:
      "bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-badge-verified-bg)]",
    text: "bg-transparent text-[var(--color-primary-dark)] px-1 hover:underline",
  };

  return (
    <button type="button" className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
