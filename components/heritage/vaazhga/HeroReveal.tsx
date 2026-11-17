"use client";

import { ArrowDown, Heart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useMessage } from "./MessageContext";
import { OpenerVideo } from "./OpenerVideo";
import { Quote } from "./MessageSection";
import g from "./gift.module.css";
import s from "./report.module.css";

type Props = {
  headline: string;
  highlight: string;
  paragraphs: string[];
  /** Small label under the envelope ("Amma", "Appa", or the sender's name). */
  envelopeLabel: string;
  signoff: string;
  logoSrc: string;
  logoAlt: string;
  posterSrc: string;
  videoSrc?: string;
  /** Id of the section the page carries on with after the message. */
  nextId: string;
};

/**
 * The gift page's first screen: the lamp photo with the Vaazhga Vaazhthudan
 * lettering, then a maroon card with the headline and a closed envelope
 * sealed with a heart. Pressing the heart widens it to fill the screen and
 * the sender's message appears; the arrow carries on down the page. With no
 * message there is nothing to open, so it just scrolls on.
 */
export function HeroReveal({ headline, highlight, paragraphs, envelopeLabel, signoff, logoSrc, logoAlt, posterSrc, videoSrc, nextId }: Props) {
  const { message } = useMessage();
  const text = message.trim();
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const seal = useRef<HTMLSpanElement>(null);
  const [before, after] = headline.split(highlight);

  const goNext = () => {
    const target = document.getElementById(nextId);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const press = () => {
    if (!text) {
      goNext();
      return;
    }
    const box = seal.current?.getBoundingClientRect();
    if (box) setOrigin({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    goNext();
  };

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section className={g.hero} aria-label={logoAlt}>
      <div className={g.heroMedia}>
        <OpenerVideo posterSrc={posterSrc} videoSrc={videoSrc} />
        <div className={g.heroShade} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={g.heroLogo} src={logoSrc} alt={logoAlt} width={190} height={115} />
      </div>
      <div className={g.heroCard}>
        <h1 className={`${s.cal} ${g.heroTitle}`}>
          {before}
          <span className={s.heroMark}>
            {highlight}
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
          {after}
        </h1>
        {paragraphs.map((p, i) => (
          <p key={p} className={`${g.heroBody} ${paragraphs.length > 1 && i === paragraphs.length - 1 ? g.heroBodyLast : ""}`}>
            {p}
          </p>
        ))}
        <button type="button" className={g.envelope} onClick={press} aria-haspopup={text ? "dialog" : undefined} aria-label={`Open the message from ${envelopeLabel}`}>
          <svg className={g.envelopeArt} viewBox="0 0 132 92" aria-hidden="true">
            <rect x="1" y="1" width="130" height="90" rx="9" fill="#F7F1EA" />
            <path d="M3 8 66 55 129 8" fill="none" stroke="#3A0B1A" strokeOpacity=".28" strokeWidth="2" strokeLinejoin="round" />
            <path d="M3 88 52 44M129 88 80 44" fill="none" stroke="#3A0B1A" strokeOpacity=".18" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span ref={seal} className={g.seal} aria-hidden="true">
            <Heart size={17} fill="currentColor" strokeWidth={0} />
          </span>
        </button>
        <span className={g.envelopeLabel}>{envelopeLabel}</span>
      </div>

      {open ? (
        <div
          className={g.msgScreen}
          role="dialog"
          aria-modal="true"
          aria-label={`A message from ${envelopeLabel}`}
          style={{ "--ox": `${origin.x}px`, "--oy": `${origin.y}px` } as React.CSSProperties}
        >
          <div className={g.msgInner}>
            <Quote signoff={signoff} text={text} />
          </div>
          <button type="button" className={g.msgNext} onClick={close} aria-label="Continue">
            <ArrowDown size={18} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
