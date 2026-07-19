import { colors, radius } from "../../tokens";

export interface SkeletonProps {
  /** Width of each bar, e.g. "60%" or "180px". */
  widths?: string[];
}

/**
 * Ported from aia-app/components/shared/Skeleton.tsx.
 * Not yet actually used in the contributor app (Home still renders mock
 * data synchronously — no loading state exists to extract behavior from).
 * Built to the locked spec, but flagging that it's spec-derived, not
 * battle-tested against a real loading screen yet.
 */
export function Skeleton({ widths = ["60%", "90%"] }: SkeletonProps) {
  return (
    <div
      style={{
        borderRadius: radius.card,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.card,
        padding: "20px",
      }}
    >
      {widths.map((w, i) => (
        <div
          key={i}
          style={{
            height: "14px",
            borderRadius: "6px",
            backgroundColor: colors.skeleton,
            width: w,
            marginBottom: i === widths.length - 1 ? 0 : "10px",
          }}
        />
      ))}
    </div>
  );
}
