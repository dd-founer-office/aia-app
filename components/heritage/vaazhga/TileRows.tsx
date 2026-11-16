"use client";

import { useEffect, useRef } from "react";
import s from "./report.module.css";

export type Tile = { kind: "photo"; src: string } | { kind: "logo" };

type Props = {
  rows: Tile[][];
  logoSrc: string;
};

// How far a row slides sideways per pixel of vertical scroll, measured from
// a recording of the reference grid: about 13.5%. Rows 1 and 3 slide left and
// row 2 slides right as the page scrolls down (reversed when scrolling up).
const SPEED = 0.135;
const DIRECTION = [-1, 1, -1];
// The rows carry extra tiles on both sides so the slide never shows a gap;
// this caps the slide at what those extra tiles cover.
const MAX_SHIFT = 150;

/** Two tiles are added before each row and one after, repeating its own tiles. */
function extend(row: Tile[]): Tile[] {
  return [...row.slice(-2), ...row, ...row.slice(0, 1)];
}

export function TileRows({ rows, logoSrc }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rowEls = Array.from(wrap.children) as HTMLElement[];
    let frame = 0;

    const apply = () => {
      frame = 0;
      const shift = Math.min(Math.max(window.scrollY, 0) * SPEED, MAX_SHIFT);
      rowEls.forEach((el, i) => {
        el.style.transform = `translate3d(${(DIRECTION[i] ?? 0) * shift}px,0,0)`;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={wrapRef} className={s.rows} aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={`${s.row} ${[s.row1, s.row2, s.row3][r]}`}>
          {extend(row).map((tile, i) =>
            tile.kind === "logo" ? (
              <div key={i} className={s.logoTile}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoSrc} alt="" width={70} height={42} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                className={s.tile}
                src={tile.src}
                alt=""
                width={87}
                height={87}
                loading={r === 2 ? "lazy" : "eager"}
                decoding="async"
              />
            ),
          )}
        </div>
      ))}
    </div>
  );
}
