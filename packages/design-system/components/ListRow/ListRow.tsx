import type { ElementType, ReactNode } from "react";
import { colors } from "../../tokens/colors";
import { IconBadge } from "../IconBadge/IconBadge";

export interface ListRowProps {
  icon: ElementType;
  label: string;
  value: ReactNode;
  trailing?: ReactNode;
  isLast?: boolean;
}

/**
 * Ported from aia-app/components/shared/ListRow.tsx.
 * Icon badge + label/value pair, thin divider between rows, meant to sit
 * grouped inside one Card — same composition as the app.
 */
export function ListRow({ icon, label, value, trailing, isLast }: ListRowProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 0",
        borderBottom: !isLast ? `1px solid ${colors.border}` : undefined,
      }}
    >
      <IconBadge icon={icon} />
      <div style={{ display: "flex", flex: 1, flexDirection: "column" }}>
        <p style={{ fontSize: "12px", color: colors.mutedForeground }}>{label}</p>
        <p style={{ fontSize: "14px", fontWeight: 500 }}>{value}</p>
      </div>
      {trailing}
    </div>
  );
}
