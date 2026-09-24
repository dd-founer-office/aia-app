"use client";

import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
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

const FIELD_LETTERS = [
  { char: "அ", top: "8%", left: "82%", size: 36, opacity: 0.05, delay: "0s" },
  { char: "ற", top: "34%", left: "10%", size: 22, opacity: 0.06, delay: "2s" },
  { char: "ம", top: "62%", left: "88%", size: 26, opacity: 0.045, delay: "3.4s" },
  { char: "வ", top: "80%", left: "14%", size: 30, opacity: 0.06, delay: "1.2s" },
];

/**
 * Points the hand-drawn arrow at the real BottomNavigation center FAB
 * (`a[aria-label="practice"]`) by measuring both elements' actual screen
 * positions, rather than a hardcoded angle tuned for one canvas mockup.
 * Also measures the note block against the real nav bar itself and lifts
 * it clear if they'd overlap — the nav is `position:fixed`, so on a short
 * real-device viewport (browser chrome eating vertical space) a vertical
 * rhythm tuned against one desktop test window can still land the note
 * behind it; this makes correctness a runtime guarantee instead of a
 * pixel-budget guess. Recomputed on mount/resize/scroll (rAF-throttled).
 * The arrow's own size stays fixed (the small, thin size settled on
 * during design review) — only its rotation is dynamic, since scaling it
 * to literally reach the FAB from way down the page would make it huge.
 */
function useDynamicNotePointer(
  anchorRef: RefObject<HTMLElement | null>,
  noteBlockRef: RefObject<HTMLElement | null>
) {
  const [rotation, setRotation] = useState<number | null>(null);
  const [liftPx, setLiftPx] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    function recompute() {
      rafId = null;
      const anchor = anchorRef.current;
      const noteBlock = noteBlockRef.current;
      const fab = document.querySelector<HTMLElement>('a[aria-label="practice"]');
      const nav = document.querySelector<HTMLElement>("nav");
      if (!anchor || !fab) {
        setRotation(null);
      } else {
        const a = anchor.getBoundingClientRect();
        const f = fab.getBoundingClientRect();
        const dx = f.left + f.width / 2 - a.right;
        const dy = f.top + f.height / 2 - a.top;
        // FAB is above (or the anchor has scrolled past it) — nothing sane to point at.
        if (dy < 20) {
          setRotation(null);
        } else {
          // Local tip direction measured on the source illustration: out of a
          // mask-size:contain'd square, its sharp tip sits at roughly
          // (52.5, 92.3) from the top-left starting point — an angle of
          // ~60.4° off horizontal, constant regardless of box render size.
          const localTipAngle = Math.atan2(92.3, 52.5);
          const targetAngle = Math.atan2(dy, dx);
          setRotation(((targetAngle - localTipAngle) * 180) / Math.PI);
        }
      }

      if (noteBlock && nav) {
        const noteRect = noteBlock.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        const overlap = noteRect.bottom + 12 - navRect.top;
        // Below this, lifting the note would push it up into the CTA
        // buttons above it instead — on a viewport that short, the
        // annotation just doesn't fit; hide it rather than collide.
        const MAX_LIFT = 48;
        setHidden(overlap > MAX_LIFT);
        setLiftPx(Math.min(Math.max(overlap, 0), MAX_LIFT));
      } else {
        setHidden(false);
        setLiftPx(0);
      }
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
  }, [anchorRef, noteBlockRef]);

  return { rotation, liftPx, hidden };
}

export function EditorialHero({
  displayName,
  latestActId,
}: {
  displayName: string;
  latestActId: string | null;
}) {
  const router = useRouter();
  const noteAnchorRef = useRef<HTMLSpanElement>(null);
  const noteBlockRef = useRef<HTMLDivElement>(null);
  const { rotation: arrowRotation, liftPx, hidden: noteHidden } = useDynamicNotePointer(
    noteAnchorRef,
    noteBlockRef
  );

  return (
    <section
      className="relative -mx-5 -mt-10 mb-2 flex min-h-[100svh] flex-col overflow-hidden px-7 pb-8 pt-5"
      style={{ background: TEAL }}
    >
      <div className="pointer-events-none absolute inset-0">
        {FIELD_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="font-tamil-sans absolute animate-[editorial-hero-breathe_7.5s_ease-in-out_infinite]"
            style={
              {
                top: letter.top,
                left: letter.left,
                fontSize: letter.size,
                color: MINT,
                animationDelay: letter.delay,
                "--bo": letter.opacity,
              } as CSSProperties
            }
          >
            {letter.char}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes editorial-hero-breathe {
          0%, 100% { opacity: var(--bo, 0.06); }
          50% { opacity: calc(var(--bo, 0.06) * 1.9); }
        }
      `}</style>

      <div className="relative flex shrink-0 items-center gap-3">
        <PrayingHandsIcon className="h-9 w-auto shrink-0" style={{ color: MINT }} />
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
        className="relative z-[5] mt-8 flex shrink-0 justify-end"
        style={{
          transform: liftPx > 0 ? `translateY(-${liftPx}px)` : undefined,
          opacity: noteHidden ? 0 : 1,
          pointerEvents: noteHidden ? "none" : undefined,
          transition: "transform 150ms ease-out, opacity 150ms ease-out",
        }}
      >
        <div
          className={`${caveat.className} text-left text-2xl font-bold leading-tight`}
          style={{ color: MINT, transform: "rotate(-3deg)" }}
        >
          Watch this change
          <br />
          <span ref={noteAnchorRef} className="relative inline-block">
            as you do
            <div
              className="pointer-events-none absolute left-full top-0 h-[63px] w-[60px]"
              style={{
                transformOrigin: "0 0",
                transform: `rotate(${arrowRotation ?? 36}deg)`,
                opacity: arrowRotation === null ? 0 : 1,
                transition: "opacity 200ms ease-out",
                backgroundColor: MINT,
                WebkitMaskImage: "url(/home/editorial-hero-arrow.png)",
                maskImage: "url(/home/editorial-hero-arrow.png)",
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
