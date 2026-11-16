"use client";

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
            onClick={() => goTo(i)}
          />
        ))}
      </div>
      <div aria-live="polite">
        <h3 className={`${s.cal} ${s.boxHeading}`}>{current.heading}</h3>
        <p className={s.boxLine}>{current.line}</p>
      </div>
    </div>
  );
}
