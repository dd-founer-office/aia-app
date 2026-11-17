"use client";

import { useLayoutEffect, useRef } from "react";
import g from "./gift.module.css";
import s from "./report.module.css";

const THORAN = "/heritage/art/thoran-maroon.svg";

/** The largest and smallest base type size (px) the card will use. */
const MAX_SIZE = 15;
const MIN_SIZE = 8;

/**
 * The sender's card: a quote mark, their own words and a sign-off line for
 * each name, under the maavilai thoranam. Everything is sized in em from one
 * base size, and after every change the base is shrunk until the whole card
 * fits, so a long message or four sign-offs never spill off the card. The
 * same card is on the stage the birthday person opens and in the "how it
 * will look" box the sender sees while writing.
 */
export function SenderCard({ text, signoffs }: { text: string; signoffs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const key = `${text}\n${signoffs.join("\n")}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = MAX_SIZE;
      el.style.fontSize = `${size}px`;
      while (size > MIN_SIZE && el.scrollHeight > el.clientHeight + 1) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [key]);

  return (
    <div ref={ref} className={`${g.paper} ${g.paperSender}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={g.cardThoran} src={THORAN} alt="" aria-hidden="true" />
      <div className={g.artTop} />
      <span className={g.cardMark} aria-hidden="true">
        &ldquo;
      </span>
      <p className={`${s.cal} ${g.cardText}`}>{text}</p>
      <div className={g.signs}>
        {signoffs.map((line) => (
          <p key={line} className={g.cardSign}>
            {line}
          </p>
        ))}
      </div>
      <div className={g.artBottom} />
    </div>
  );
}
