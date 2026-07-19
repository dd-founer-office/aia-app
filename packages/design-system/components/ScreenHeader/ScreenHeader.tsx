import { colors } from "../../tokens/colors";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Ported from aia-app/components/shared/ScreenHeader.tsx.
 * Deliberately matches Home's h1 treatment exactly rather than introducing
 * a separate display style for Ops.
 */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <div style={{ marginTop: "24px" }}>
      <h1
        style={{
          fontSize: "24px",
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          color: colors.foreground,
        }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p style={{ marginTop: "6px", fontSize: "14px", color: colors.mutedForeground }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
