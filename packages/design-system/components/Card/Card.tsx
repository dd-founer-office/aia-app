import type { ReactNode, CSSProperties } from "react";
import { colors } from "../../tokens/colors";
import { radius } from "../../tokens/radius";

export interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Ported from aia-app/components/shared/Card.tsx.
 * Border-only elevation — no box-shadow — confirmed as intentional,
 * matching the contributor app exactly (see tokens/shadows.ts).
 * 20px padding is a deliberate named exception to the 8pt grid.
 */
export function Card({ children, style }: CardProps) {
  return (
    <div
      style={{
        borderRadius: radius.card,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.card,
        padding: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
