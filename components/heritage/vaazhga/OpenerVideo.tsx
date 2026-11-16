"use client";

import { useRef, useState } from "react";
import g from "./gift.module.css";

/**
 * Full-screen opener behind the gift page's first screen. Plays the clip
 * muted on a loop (browsers don't allow sound on autoplay) with a small
 * sound toggle. With no clip yet it is just the poster photo.
 */
export function OpenerVideo({ posterSrc, videoSrc }: { posterSrc: string; videoSrc?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  if (!videoSrc) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={g.openerMedia} src={posterSrc} alt="" width={989} height={989} />;
  }

  return (
    <>
      <video
        ref={ref}
        className={g.openerMedia}
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
      />
      <button
        type="button"
        className={g.sound}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          v.muted = !v.muted;
          setMuted(v.muted);
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFEFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H3v6h3l5 4z" />
          {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
        </svg>
      </button>
    </>
  );
}
