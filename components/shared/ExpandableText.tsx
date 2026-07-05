"use client";

import { useState } from "react";

/**
 * Shared "Read More" primitive -- CA-011 Story section: "Limit the
 * visible text to approximately 4-5 lines before 'Read More'."
 */
export function ExpandableText({
  children,
  lines = 5,
}: {
  children: React.ReactNode;
  lines?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
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
        className="self-start text-sm font-medium"
        style={{ color: "var(--color-primary-dark)" }}
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </div>
  );
}
