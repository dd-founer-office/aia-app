"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReportPhoto } from "@/lib/heritage/vaazhga-vaazhthudan-reports";
import s from "./report.module.css";

type Props = {
  photos: ReportPhoto[];
  initialIndex: number;
};

/**
 * The swipe row: every photo from the temple in one soft container. The
 * photo nearest the centre is largest, and the heading and grey line under
 * the row follow whichever photo is centred.
 */
export function TempleCarousel({ photos, initialIndex }: Props) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialIndex);
  // Index of the photo shown full screen, or null.
  const [full, setFull] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const imgs = Array.from(row.querySelectorAll("img"));
    let frame = 0;

    const centreOf = (img: HTMLElement) => img.offsetLeft + img.offsetWidth / 2;

    const update = () => {
      frame = 0;
      const middle = row.scrollLeft + row.clientWidth / 2;
      let best = 0;
      let bestDistance = Infinity;
      imgs.forEach((img, i) => {
        const distance = Math.abs(centreOf(img) - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
        img.style.transform = `scale(${Math.max(0.78, 1 - distance / 700)})`;
      });
      setActive(best);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const start = imgs[initialIndex];
    if (start) row.scrollLeft = centreOf(start) - row.clientWidth / 2;
    update();

    row.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      row.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [initialIndex]);

  useEffect(() => {
    if (full === null) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(null);
      else if (e.key === "ArrowRight") setFull((n) => (n === null ? n : Math.min(photos.length - 1, n + 1)));
      else if (e.key === "ArrowLeft") setFull((n) => (n === null ? n : Math.max(0, n - 1)));
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [full, photos.length]);

  const closeFull = () => {
    // Leave the row on the photo that was last looked at.
    if (full !== null) goTo(full);
    setFull(null);
  };

  const goTo = (index: number) => {
    const row = rowRef.current;
    const img = row?.querySelectorAll("img")[index];
    if (!row || !img) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({
      left: img.offsetLeft + img.offsetWidth / 2 - row.clientWidth / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(Math.min(photos.length - 1, active + 1));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(Math.max(0, active - 1));
    }
  };

  const current = photos[active] ?? photos[0];
  const shown = full === null ? null : photos[full];

  return (
    <div className={s.box}>
      <div
        ref={rowRef}
        className={s.vis}
        role="group"
        aria-label="Photos from the temple"
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {photos.map((photo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.key}
            src={photo.src}
            alt={`${photo.heading}. ${photo.line}`}
            width={520}
            height={520}
            loading={i <= initialIndex + 1 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onClick={() => (i === active ? setFull(i) : goTo(i))}
          />
        ))}
      </div>
      <div aria-live="polite">
        <h3 className={`${s.cal} ${s.boxHeading}`}>{current.heading}</h3>
        <p className={s.boxLine}>{current.line}</p>
      </div>
      {shown && full !== null ? (
        <div
          className={s.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={shown.heading}
          onClick={closeFull}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            if (start === null) return;
            const dx = e.changedTouches[0].clientX - start;
            if (Math.abs(dx) > 50) setFull(dx < 0 ? Math.min(photos.length - 1, full + 1) : Math.max(0, full - 1));
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.lightboxImg} src={shown.src} alt={`${shown.heading}. ${shown.line}`} draggable={false} onClick={(e) => e.stopPropagation()} />
          <div className={s.lightboxCaption} onClick={(e) => e.stopPropagation()}>
            <h3 className={s.cal}>{shown.heading}</h3>
            <p>{shown.line}</p>
          </div>
          <button type="button" className={s.lightboxClose} aria-label="Close" onClick={closeFull}>
            <X size={20} strokeWidth={2.6} aria-hidden="true" />
          </button>
          {full > 0 ? (
            <button
              type="button"
              className={`${s.lightboxNav} ${s.lightboxPrev}`}
              aria-label="Previous photo"
              onClick={(e) => {
                e.stopPropagation();
                setFull(full - 1);
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.6} aria-hidden="true" />
            </button>
          ) : null}
          {full < photos.length - 1 ? (
            <button
              type="button"
              className={`${s.lightboxNav} ${s.lightboxNext}`}
              aria-label="Next photo"
              onClick={(e) => {
                e.stopPropagation();
                setFull(full + 1);
              }}
            >
              <ChevronRight size={22} strokeWidth={2.6} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
