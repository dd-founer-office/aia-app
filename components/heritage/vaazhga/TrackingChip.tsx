"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import s from "./report.module.css";

/**
 * The courier and its reference, with a button to copy the number, shown
 * above "Track Here" once a parcel has been shipped.
 */
export function TrackingChip({ courier, reference }: { courier?: string; reference: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard can be blocked; the number is on screen to copy by hand */
    }
  };

  return (
    <div className={s.trackChip}>
      <span className={s.trackChipText}>
        {courier ? `${courier} · ` : ""}
        <b>{reference}</b>
      </span>
      <button type="button" className={s.trackChipCopy} onClick={copy} aria-label={`Copy tracking number ${reference}`}>
        {copied ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : <Copy size={14} strokeWidth={2.2} aria-hidden="true" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
