import { colors } from "../../tokens/colors";

export interface ProgressIndicatorProps {
  current: number;
  /** Must reflect only steps that actually render for this flow, not the theoretical maximum. */
  total: number;
}

/**
 * Ported from aia-app/components/shared/ProgressIndicator.tsx.
 * Deliberately just text — no bar, no percentage, no dots. UX Constitution:
 * "Never use percentages, XP, levels or gamification" applies here too,
 * even though this component predates Journey and isn't Journey-specific.
 */
export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <p style={{ fontSize: "12px", color: colors.mutedForeground }} aria-hidden="true">
      Step {current} of {total}
    </p>
  );
}
