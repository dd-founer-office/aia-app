"use client";

import { ArrowDown, Heart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMessage } from "./MessageContext";
import { OpenerVideo } from "./OpenerVideo";
import { SenderCard } from "./SenderCard";
import { senderLabel, signoffLines } from "@/lib/heritage/vaazhga-senders";
import g from "./gift.module.css";
import s from "./report.module.css";

type Tamil = { lines: string[]; deityLine: string; closing: string };
type Kind = "sender" | "ours";

type Props = {
  headline: string;
  highlight: string;
  paragraphs: string[];
  /** On the share view the envelope leads to the writing box instead of opening. */
  preview: boolean;
  /** Id of the writing box (share view only). */
  composeId: string;
  tamil: Tamil;
  logoSrc: string;
  ddLogoSrc: string;
  logoAlt: string;
  posterSrc: string;
  videoSrc?: string;
  /** Id of the section the page carries on with after the cards. */
  nextId: string;
};

const buzz = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* vibration is a nicety: some browsers (iPhone) never allow it */
  }
};

/**
 * The gift page's first screen: the lamp photo with the Vaazhga Vaazhthudan
 * lettering, then a maroon card with the headline and a closed envelope
 * sealed with a heart. Pressing the heart buzzes the phone and opens the
 * envelope on a maroon stage: two cards rise out of it as a swipeable stack,
 * the sender's own card first (when they wrote one), ours behind it.
 * The arrow closes the stage and carries on down the page.
 */
export function HeroReveal({ headline, highlight, paragraphs, preview, composeId, tamil, logoSrc, ddLogoSrc, logoAlt, posterSrc, videoSrc, nextId }: Props) {
  const { message, senders } = useMessage();
  const envelopeLabel = senderLabel(senders);
  const signoffs = signoffLines(senders);
  const text = message.trim();
  const [open, setOpen] = useState(false);
  const [order, setOrder] = useState<Kind[]>(["ours"]);
  const [flying, setFlying] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const [before, after] = headline.split(highlight);

  const cards: Kind[] = text ? ["sender", "ours"] : ["ours"];
  // The deck as it stands: the first card is on top. Swiping sends the top card to the back.
  const deck = order.filter((k) => cards.includes(k));
  for (const k of cards) if (!deck.includes(k)) deck.push(k);
  const top = deck[0];

  const goNext = useCallback(() => {
    const target = document.getElementById(nextId);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [nextId]);

  const press = () => {
    if (preview) {
      // The sender is the one looking: take them to where they write their words.
      buzz([40, 70, 60]);
      const box = document.getElementById(composeId);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      box?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      return;
    }
    buzz([40, 70, 60]); // a heartbeat: lub-dub
    setOrder(text ? ["sender", "ours"] : ["ours"]);
    setDrag(0);
    setFlying(0);
    setOpen(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => buzz(25), 2300); // the cards have landed
  };

  const close = (scroll: boolean) => {
    window.clearTimeout(timer.current);
    setOpen(false);
    if (scroll) goNext();
  };

  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    nextBtn.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const bringToFront = (kind: Kind) => {
    if (kind === top) return;
    buzz(10);
    setOrder([kind, ...deck.filter((k) => k !== kind)]);
  };

  // Swipe the top card away: it flies off, then slips in at the back.
  const sendToBack = (dir: number) => {
    if (deck.length < 2 || flying) return;
    buzz(10);
    setFlying(dir);
    window.setTimeout(() => {
      setOrder([...deck.slice(1), deck[0]]);
      setFlying(0);
      setDrag(0);
    }, 300);
  };

  const onDown = (e: React.PointerEvent) => {
    start.current = e.clientX;
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (start.current !== null) setDrag(e.clientX - start.current);
  };
  const onUp = () => {
    if (start.current === null) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(drag) > 70) sendToBack(drag > 0 ? 1 : -1);
    else setDrag(0);
  };

  const face = (kind: Kind) =>
    kind === "sender" ? (
      <SenderCard text={text} signoffs={signoffs} />
    ) : (
      <div className={`${g.paper} ${g.paperOurs}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={g.cardVv} src={logoSrc} alt="Vaazhga Vaazhthudan" width={150} height={91} />
        <div className={g.tamilBlock}>
          <p className={g.cardTamil} lang="ta">
            {tamil.lines.map((line, i) => (
              <span key={line}>
                {i > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
          <p className={g.cardTamil} lang="ta">
            {tamil.deityLine}
          </p>
          <p className={g.cardTamil} lang="ta">
            {tamil.closing}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={g.cardDd} src={ddLogoSrc} alt="Distant Devotion" width={120} height={53} />
      </div>
    );

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
        <button type="button" className={g.envelope} onClick={press} aria-haspopup={preview ? undefined : "dialog"} aria-label={preview ? "Write your own words" : `Open the envelope from ${envelopeLabel}`}>
          <svg className={g.envelopeArt} viewBox="0 0 132 92" aria-hidden="true">
            <rect x="1" y="1" width="130" height="90" rx="4.5" fill="#F7F1EA" />
            <path d="M3 8 66 55 129 8" fill="none" stroke="#3A0B1A" strokeOpacity=".28" strokeWidth="2" strokeLinejoin="round" />
            <path d="M3 88 52 44M129 88 80 44" fill="none" stroke="#3A0B1A" strokeOpacity=".18" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={g.seal} aria-hidden="true">
            <Heart size={17} fill="currentColor" strokeWidth={0} />
          </span>
        </button>
        <span className={g.envelopeLabel}>{envelopeLabel}</span>
      </div>

      {open ? (
        <div className={g.stage} role="dialog" aria-modal="true" aria-label={`Cards from ${envelopeLabel}`}>
          <div className={g.scene}>
            <div className={g.settle}>
            <div className={g.cards}>
              {(["ours", "sender"] as Kind[]).filter((k) => cards.includes(k)).map((kind) => {
                const idx = deck.indexOf(kind);
                const front = idx === 0;
                const style: React.CSSProperties | undefined = front
                  ? flying
                    ? { transform: `translateX(${flying * 130}%) rotate(${flying * 24}deg)`, opacity: 0 }
                    : { transform: `translateX(${drag}px) rotate(${-3 + drag / 18}deg)`, transition: dragging ? "none" : "transform .3s" }
                  : undefined;
                return (
                  <div key={kind} className={g.rise} style={{ "--d": `${kind === "ours" ? 1.1 : 1.5}s`, zIndex: deck.length - idx } as React.CSSProperties}>
                    <div
                      className={`${g.card} ${kind === "ours" ? g.cardOurs : ""} ${front ? "" : kind === "ours" ? g.behindOurs : g.behindSender}`}
                      style={style}
                      onPointerDown={front ? onDown : undefined}
                      onPointerMove={front ? onMove : undefined}
                      onPointerUp={front ? onUp : undefined}
                      onPointerCancel={front ? onUp : undefined}
                      onClick={front ? undefined : () => bringToFront(kind)}
                      aria-hidden={!front}
                    >
                      {face(kind)}
                    </div>
                  </div>
                );
              })}
            </div>
            {cards.length > 1 ? (
              <div className={g.dots}>
                {cards.map((kind) => (
                  <button key={kind} type="button" className={`${g.dot} ${kind === top ? g.dotOn : ""}`} aria-label={kind === "sender" ? "Card from the sender" : "Card from Distant Devotion"} aria-current={kind === top} onClick={() => bringToFront(kind)} />
                ))}
              </div>
            ) : null}
            </div>
            <div className={g.env} aria-hidden="true">
              <div className={g.envBack} />
              <div className={g.envFlap} />
              <div className={g.envFront} />
              <span className={g.envSeal}>
                <Heart size={17} fill="currentColor" strokeWidth={0} />
              </span>
            </div>
          </div>
          <button ref={nextBtn} type="button" className={g.msgNext} onClick={() => close(true)} aria-label="Continue">
            <ArrowDown size={18} strokeWidth={3} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
