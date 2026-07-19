"use client";

import { useState, type ReactNode } from "react";
import { colors } from "../../tokens/colors";

export interface ExpandableTextProps {
  children: ReactNode;
  lines?: number;
}

/** Ported from aia-app/components/shared/ExpandableText.tsx (CA-011 Story section rule: ~4-5 lines before "Read More"). */
export function ExpandableText({ children, lines = 5 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: lines,
                overflow: "hidden",
              }
        }
      >
        {children}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          alignSelf: "flex-start",
          fontSize: "14px",
          fontWeight: 500,
          color: colors.primaryDark,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </div>
  );
}
