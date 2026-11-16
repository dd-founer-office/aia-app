"use client";

import s from "./report.module.css";

/**
 * "Track Here": once the prasadam has been dispatched and a courier tracking
 * page is on record, it opens that page. Until then there is nothing outside
 * to track, so it scrolls up to the blessing journey on this page instead.
 */
export function TrackButton({ label, trackUrl, targetId }: { label: string; trackUrl?: string; targetId: string }) {
  const icon = (
    <span className={s.btnIcon} aria-hidden="true">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {trackUrl ? <path d="M5 19L19 5M8 5h11v11" /> : <path d="M12 20V5M5 12l7-7 7 7" />}
      </svg>
    </span>
  );

  if (trackUrl) {
    return (
      <a className={`${s.btn} ${s.btnDark}`} href={trackUrl} target="_blank" rel="noopener noreferrer">
        {label}
        {icon}
      </a>
    );
  }

  const onClick = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <button type="button" className={`${s.btn} ${s.btnDark}`} onClick={onClick}>
      {label}
      {icon}
    </button>
  );
}
