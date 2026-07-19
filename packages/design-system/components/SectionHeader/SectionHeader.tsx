import { colors } from "../../tokens/colors";

export interface SectionHeaderProps {
  title: string;
  action?: { label: string; onClick?: () => void };
}

/**
 * Ported from aia-app/components/shared/SectionHeader.tsx.
 * No atomic Product OS spec exists for this component (flagged in the
 * original file too) — carrying that flag forward.
 */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        borderBottom: `1px solid ${colors.border}`,
        paddingBottom: "10px",
      }}
    >
      <h2 style={{ fontSize: "16px", fontWeight: 500 }}>{title}</h2>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            fontSize: "14px",
            color: colors.primary,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
