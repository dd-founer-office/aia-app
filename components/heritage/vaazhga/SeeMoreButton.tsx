"use client";

import s from "./report.module.css";

/** Hero button: scrolls the booker down into the story. */
export function SeeMoreButton({ targetId }: { targetId: string }) {
  const onClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <button type="button" className={`${s.cal} ${s.pill}`} onClick={onClick}>
      See more
      <span className={s.pillIcon} aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFEFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4v15M5 12l7 7 7-7" />
        </svg>
      </span>
    </button>
  );
}
