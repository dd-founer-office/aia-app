"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "./report.module.css";

/**
 * "Send to <name>": fades the screen to warm lamp-light, then opens the gift
 * page as the recipient will see it, with the share bar on top.
 */
export function SendButton({ label, publicPath, internalPath }: { label: string; publicPath: string; internalPath: string }) {
  const router = useRouter();
  const [glow, setGlow] = useState(false);

  const go = () => {
    const base = /^heritage\./i.test(window.location.hostname) ? publicPath : internalPath;
    const href = `${base}?preview=1`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      router.push(href);
      return;
    }
    setGlow(true);
    setTimeout(() => router.push(href), 650);
  };

  return (
    <>
      <button type="button" className={`${s.cal} ${s.btn}`} onClick={go} disabled={glow}>
        {label}
        <span className={s.btnIcon} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFEFF" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 19L19 5M8 5h11v11" />
          </svg>
        </span>
      </button>
      <div className={`${s.glow} ${glow ? s.glowOn : ""}`} aria-hidden="true" />
    </>
  );
}
