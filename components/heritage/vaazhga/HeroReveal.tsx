"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { useMessage } from "./MessageContext";
import { OpenerVideo } from "./OpenerVideo";
import { Quote } from "./MessageSection";
import g from "./gift.module.css";
import s from "./report.module.css";

type Props = {
  headline: string;
  highlight: string;
  paragraphs: string[];
  heartLabel: string;
  sender: string;
  logoSrc: string;
  logoAlt: string;
  posterSrc: string;
  videoSrc?: string;
  /** Id of the section the button scrolls to when there is no message to open. */
  nextId: string;
};

/**
 * The gift page's first screen: the lamp photo with the Vaazhga Vaazhthudan
 * lettering, then a maroon card with the headline. The button holds a heart;
 * pressing it opens the sender's message in place and the page carries on
 * below. With no message there is nothing to open, so it scrolls on instead.
 */
export function HeroReveal({ headline, highlight, paragraphs, heartLabel, sender, logoSrc, logoAlt, posterSrc, videoSrc, nextId }: Props) {
  const { message } = useMessage();
  const text = message.trim();
  const [open, setOpen] = useState(false);
  const [before, after] = headline.split(highlight);
  const [label, ...rest] = heartLabel.split("\u2764\uFE0F");

  const press = () => {
    if (text) {
      setOpen(true);
      return;
    }
    const target = document.getElementById(nextId);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

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
          <p key={p} className={`${g.heroBody} ${i === paragraphs.length - 1 ? g.heroBodyLast : ""}`}>
            {p}
          </p>
        ))}
        {text && open ? (
          <div className={g.heroMsg} aria-live="polite">
            <Quote sender={sender} text={text} />
          </div>
        ) : (
          <button type="button" className={`${s.btn} ${g.heartBtn}`} onClick={press} aria-expanded={text ? open : undefined}>
            {label.trim()}
            <span className={g.heart} aria-hidden="true">
              <Heart size={12} fill="currentColor" strokeWidth={0} />
            </span>
            {rest.join("").trim()}
          </button>
        )}
      </div>
    </section>
  );
}
