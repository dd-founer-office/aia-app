"use client";

import { useState } from "react";
import { senderQuery } from "@/lib/heritage/vaazhga-senders";
import { useMessage } from "./MessageContext";
import g from "./gift.module.css";

/**
 * Shown only when the booker opens the gift page from their report
 * (?preview=1): lets them check what the recipient will see, then share the
 * clean link (no preview flag) on WhatsApp or by copying it.
 */
export function PreviewBar({ recipient, publicPath, internalPath }: { recipient: string; publicPath: string; internalPath: string }) {
  const [copied, setCopied] = useState(false);
  const { message, senders } = useMessage();

  const shareUrl = () => {
    const path = /^heritage\./i.test(window.location.hostname) ? publicPath : internalPath;
    const text = message.trim();
    const query = [text ? `m=${encodeURIComponent(text)}` : "", senderQuery(senders)].filter(Boolean).join("&");
    return `${window.location.origin}${path}${query ? `?${query}` : ""}`;
  };

  const whatsapp = () => {
    const url = shareUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy this link", shareUrl());
    }
  };

  return (
    <div className={g.bar} role="region" aria-label="Share this page">
      <p className={g.barText}>This is what {recipient} will see</p>
      <div className={g.barRow}>
        <button type="button" className={`${g.barBtn} ${g.barPrimary}`} onClick={whatsapp}>
          Share on WhatsApp
        </button>
        <button type="button" className={`${g.barBtn} ${g.barGhost}`} onClick={copy} aria-live="polite">
          {copied ? "Link copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
