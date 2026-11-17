"use client";

import s from "./report.module.css";

/**
 * "Track Here": once the prasadam has been dispatched and a courier tracking
 * page is on record, it opens that page. Until then there is nothing outside
 * to track, so it scrolls up to the blessing journey on this page instead.
 */
export function TrackButton({ label, trackUrl, targetId, tone = "dark" }: { label: string; trackUrl?: string; targetId: string; tone?: "dark" | "orange" }) {
  const cls = tone === "dark" ? `${s.btn} ${s.btnDark}` : s.btn;
  if (trackUrl) {
    return (
      <a className={cls} href={trackUrl} target="_blank" rel="noopener noreferrer">
        {label}
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
    <button type="button" className={cls} onClick={onClick}>
      {label}
    </button>
  );
}
