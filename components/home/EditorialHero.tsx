"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import localFont from "next/font/local";
import { Caveat } from "next/font/google";
import { PrayingHandsIcon } from "@/components/home/icons/PrayingHandsIcon";

/**
 * Sprint 5.2 design exploration — Abyssale-inspired deep-teal/mint editorial
 * variation of the Home hero, added ABOVE the existing (unchanged) Hero
 * section purely so it can be reviewed live. Not yet a locked design-system
 * decision: teal (#0A363A) / mint (#68FFAD) aren't in globals.css's LOCKED
 * v1.1 tokens, so they're kept local to this file rather than added there.
 */

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

const caveat = Caveat({ subsets: ["latin"], weight: ["700"], display: "swap" });

const TEAL = "#0A363A";
const MINT = "#68FFAD";

/**
 * The nav is `position:fixed`, always pinned to the true viewport bottom
 * regardless of scroll — so on a short real-device viewport (browser
 * chrome eating vertical space differently than any one test window) the
 * note can still end up landing behind it. This measures the note block
 * against the real nav bar at runtime and lifts it clear if they'd
 * overlap, capping the lift so it can't collide with the CTAs above
 * instead — past that cap it just fades the note out rather than
 * colliding with anything. Recomputed on mount/resize/scroll
 * (rAF-throttled).
 */
function useNoteClearOfNav(noteBlockRef: RefObject<HTMLElement | null>) {
  const [liftPx, setLiftPx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    function recompute() {
      rafId = null;
      const noteBlock = noteBlockRef.current;
      const nav = document.querySelector<HTMLElement>("nav");
      if (!noteBlock || !nav) {
        setHidden(false);
        setLiftPx(0);
        return;
      }
      const noteRect = noteBlock.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const overlap = noteRect.bottom + 12 - navRect.top;
      // Below this, lifting the note would push it up into the CTA
      // buttons above it instead — on a viewport that short, the
      // annotation just doesn't fit; hide it rather than collide.
      const MAX_LIFT = 48;
      setHidden(overlap > MAX_LIFT);
      setLiftPx(Math.min(Math.max(overlap, 0), MAX_LIFT));
    }

    function schedule() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(recompute);
    }

    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [noteBlockRef]);

  return { liftPx, hidden };
}

export function EditorialHero({
  displayName,
  latestActId,
}: {
  displayName: string;
  latestActId: string | null;
}) {
  const router = useRouter();
  const noteBlockRef = useRef<HTMLDivElement>(null);
  const { liftPx, hidden: noteHidden } = useNoteClearOfNav(noteBlockRef);

  return (
    <section
      className="relative -mx-5 -mt-10 mb-2 flex min-h-[100svh] flex-col overflow-hidden px-7 pb-8 pt-5"
      style={{ background: TEAL }}
    >
      <div className="relative flex shrink-0 items-center gap-3.5">
        <PrayingHandsIcon
          className="w-auto shrink-0"
          style={{ height: "54px", color: MINT }}
          strokeWidth={500}
        />
        <div>
          <div className="font-tamil-sans text-[19px] font-extrabold leading-tight text-white">
            வணக்கம்,
          </div>
          <div
            className={`${calSans.className} text-2xl font-bold leading-tight text-white`}
          >
            {displayName}
          </div>
        </div>
      </div>

      <div className="relative mt-8 shrink-0">
        <h1
          className="font-tamil-sans text-center text-[32px] font-extrabold leading-[1.4]"
          style={{ color: MINT, margin: 0 }}
        >
          அறம்
          <br />
          செய{" "}
          <span
            className="relative inline-block rounded-[2px] p-[2px] leading-none text-white"
            style={{ background: "rgba(104,255,173,.16)" }}
          >
            பழகு
            <span className="absolute -left-[3px] -top-[3px] h-[5px] w-[5px] rounded-[1px]" style={{ background: MINT }} />
            <span className="absolute -right-[3px] -top-[3px] h-[5px] w-[5px] rounded-[1px]" style={{ background: MINT }} />
            <span className="absolute -bottom-[3px] -left-[3px] h-[5px] w-[5px] rounded-[1px]" style={{ background: MINT }} />
            <span className="absolute -bottom-[3px] -right-[3px] h-[5px] w-[5px] rounded-[1px]" style={{ background: MINT }} />
          </span>
        </h1>
        <p className="mt-6 max-w-[300px] text-left text-sm leading-relaxed text-white">
          Choose a cause. AiA finds and verifies the opportunity — you&apos;ll see it happen.
        </p>
      </div>

      <div className="relative mt-8 flex shrink-0 flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/participate/causes")}
          className="flex w-[212px] items-center justify-center rounded-[15px] py-3 text-[14.5px] font-bold"
          style={{ background: "rgba(255,255,255,.08)", color: MINT }}
        >
          Begin Your Next Act
        </button>
        <Link
          href={latestActId ? `/acts/${latestActId}` : "/acts"}
          className="flex w-[212px] items-center justify-center gap-2 rounded-[15px] py-3 text-[14.5px] font-bold"
          style={{ background: MINT, color: TEAL }}
        >
          See a Verified Act
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px]"
            style={{ background: TEAL }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      </div>

      <div
        ref={noteBlockRef}
        className="relative z-[5] mt-14 flex shrink-0 justify-end pr-[60px]"
        style={{
          transform: liftPx > 0 ? `translateY(-${liftPx}px)` : undefined,
          opacity: noteHidden ? 0 : 1,
          pointerEvents: noteHidden ? "none" : undefined,
          transition: "transform 150ms ease-out, opacity 150ms ease-out",
        }}
      >
        <div
          className={`${caveat.className} text-left text-2xl font-bold leading-[1.2]`}
          style={{ color: MINT, transform: "rotate(-3deg)" }}
        >
          Watch this change
          <br />
          <span className="relative inline-block">
            as you do
            {/* Small handwritten pointer -- a gesture, not an illustration.
                Recolored to mint via a CSS mask on a cropped, upside-down
                variant of the uploaded arrow art (plain tail near the text,
                barbed head aimed at the FAB). Anchored at this line's end
                and nudged a little further right; a settled, gently-tuned
                rotation rather than a solved pixel-precise angle, so it
                reads as a natural down-left gesture toward the button. */}
            <div
              className="pointer-events-none absolute top-0 h-[95px] w-[74px]"
              style={{
                left: "calc(100% + 10px)",
                transformOrigin: "0 0",
                transform: "rotate(4deg)",
                backgroundColor: MINT,
                WebkitMaskImage: "url(/home/editorial-hero-arrow-2.png)",
                maskImage: "url(/home/editorial-hero-arrow-2.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            />
          </span>
        </div>
      </div>
    </section>
  );
}
