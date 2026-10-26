"use client";

import { useEffect, useRef, useState } from "react";
import localFont from "next/font/local";
import { Play } from "lucide-react";
import { TESTIMONIAL_READY_EVENT } from "@/components/acts/testimonialTransition";

const calSans = localFont({
  src: "../../app/fonts/CalSansVF.woff2",
  weight: "400 700",
  display: "swap",
});

// Self-hosted rather than next/font/google -- see app/layout.tsx's comment
// for why (intermittent Vercel build failure fetching from Google Fonts).
const inter = localFont({
  src: "../../app/fonts/InterVF.woff2",
  weight: "100 900",
  display: "swap",
});

// Reuses ActDetailHero/ActSnapshot's exact teal/mint pair -- pixel-sampled
// directly from the Abyssale reference screenshot (its button background
// is rgb(10,54,58), its button text rgb(104,255,173): TEAL and MINT to
// the digit), so this section's colors are both "matching the reference"
// and "an existing AiA token" at once, not a coincidence to reconcile.
const TEAL = "#0A363A";

// A real 16:9 frame from the real video below (see poster comment) --
// never a generated thumbnail.
const VIDEO_SRC = "/mock/tree-planting-testimonial.mp4";
const POSTER_SRC = "/mock/tree-planting-testimonial-poster.jpg";

// Hooks for the collage -> testimonial transition (see
// testimonialTransition.ts). The `data-reveal` attribute is only ever set
// while that transition runs, so on every other page these rules are inert.
// After the collage -> testimonial transition lands, the video's play button
// shows a slow loader ring; when it completes the video starts by itself
// (pressing the button starts it at once). Only the transition arms this, so
// the same section on any other page never autoplays.
const AUTOPLAY_MS = 6000;

const REVEAL_CSS = `
  .aia-tm-ring-progress { animation: aia-tm-ring-fill ${AUTOPLAY_MS}ms linear both; }
  @keyframes aia-tm-ring-fill { from { stroke-dashoffset: 157.08; } to { stroke-dashoffset: 0; } }
  .aia-tm-head, .aia-tm-rest { transition: opacity 500ms ease, translate 600ms cubic-bezier(0.22, 1, 0.36, 1); }
  .aia-tm-play { transition: opacity 120ms ease; }
  #act-testimonial[data-reveal="hidden"] .aia-tm-head { opacity: 0; translate: 0 16px; }
  #act-testimonial:is([data-reveal="hidden"], [data-reveal="heading"]) .aia-tm-play { opacity: 0; }
  #act-testimonial:is([data-reveal="hidden"], [data-reveal="heading"], [data-reveal="video"]) .aia-tm-rest { opacity: 0; translate: 0 16px; }
  @media (prefers-reduced-motion: reduce) { .aia-tm-head, .aia-tm-rest, .aia-tm-play { transition: none; } }
`;

function PlayButton({
  onClick,
  armed,
}: {
  onClick: () => void;
  armed: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Play video"
      data-tm-play
      className="aia-tm-play absolute flex items-center justify-center rounded-full"
      style={{
        right: 14,
        bottom: 14,
        width: 52,
        height: 52,
        background: TEAL,
        border: "2px solid rgba(255, 255, 255, 0.55)",
      }}
    >
      {armed && (
        <svg
          className="pointer-events-none absolute"
          style={{ left: -2, top: -2, width: 52, height: 52 }}
          viewBox="0 0 52 52"
          fill="none"
          aria-hidden="true"
        >
          {/* The button's own grey outline is the track; this white arc
              sweeps along it. */}
          <circle
            className="aia-tm-ring-progress"
            cx="26"
            cy="26"
            r="25"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="157.08"
            strokeDashoffset="157.08"
            transform="rotate(-90 26 26)"
          />
        </svg>
      )}
      <Play
        size={20}
        color="#FFFFFF"
        fill="#FFFFFF"
        style={{ marginLeft: 3 }}
      />
    </button>
  );
}

/**
 * Act Detail's "They Say It Better" section -- CA-011's Living Moment.
 * Follows the Abyssale reference structure (heading -> short description
 * -> large video with a bottom-right play button -> quote + CTA), reusing
 * ActDetailHero/ActSnapshot's teal/mint pair rather than the reference's
 * own literal colors, since pixel-sampling the reference showed they're
 * the same colors already. Full-bleed pure-white surface (like
 * ActDetailHero's own -mx-5 full-bleed teal surface) rather than the
 * page's own off-white background, matching the reference's clean white
 * canvas exactly.
 *
 * The video/poster are the real uploaded tree-planting recording -- no
 * generated thumbnail. The quote below is the real Tamil blessing given
 * by its speakers, attributed to them directly (Inmates, Annai Aravindar
 * Karunai Illam) rather than the Tree Planting Team placeholder credit
 * used before this content was supplied.
 */
export function ActTestimonial() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // True while the play button's autoplay loader is running.
  const [armed, setArmed] = useState(false);
  const visibleRef = useRef(false);

  // Armed by the transition; cancelled if the section scrolls away.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onReady = () => setArmed(true);
    section.addEventListener(TESTIMONIAL_READY_EVENT, onReady);
    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.intersectionRatio >= 0.5;
        if (!visibleRef.current) setArmed(false);
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(section);
    return () => {
      section.removeEventListener(TESTIMONIAL_READY_EVENT, onReady);
      observer.disconnect();
    };
  }, []);

  // When the loader completes, play the video -- with sound if the browser
  // allows it (a press earlier in the visit counts), muted otherwise (the
  // native controls that appear once it plays can unmute it).
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => {
      setArmed(false);
      const video = videoRef.current;
      if (!video || !visibleRef.current) return;
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    }, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  function playInline() {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      // Autoplay-with-sound can be rejected without a direct gesture on
      // some browsers -- this IS a direct tap gesture, so this is just a
      // defensive no-op for the rare rejection.
    });
  }

  return (
    <section
      id="act-testimonial"
      ref={sectionRef}
      className="-mx-5 flex flex-col items-center gap-8 px-5 py-10 text-center"
      style={{ background: "#FFFFFF" }}
    >
      <style>{REVEAL_CSS}</style>
      <div className="aia-tm-head flex flex-col gap-2.5 px-2">
        <h2
          className={`${calSans.className} m-0 text-[24px] font-bold leading-[1.15]`}
          style={{ color: TEAL, letterSpacing: "-0.3px" }}
        >
          They say it better
        </h2>
        <p
          className={`${inter.className} m-0 mx-auto max-w-[280px] text-[14px] leading-[1.55]`}
          style={{ color: "rgba(10, 54, 58, 0.78)" }}
        >
          Hear from the elders who shared this meal.
        </p>
      </div>

      <div
        data-tm-video
        className="relative w-full overflow-hidden rounded-[16px]"
        style={{ aspectRatio: "16 / 9" }}
      >
        <video
          ref={videoRef}
          className="h-full w-full bg-black object-cover"
          poster={POSTER_SRC}
          preload="none"
          playsInline
          controls={isPlaying}
          onPlay={() => {
            setIsPlaying(true);
            setArmed(false);
          }}
          onPause={() => setIsPlaying(false)}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {!isPlaying && <PlayButton onClick={playInline} armed={armed} />}
      </div>

      <div className="aia-tm-rest flex w-full flex-col items-start gap-2.5 text-left">
        <div className="flex flex-col gap-2.5">
          {/* Real quote, in the speakers' own words -- Tamil, so it's set
              in the app's existing Noto Sans Tamil (--font-tamil-sans,
              loaded globally in app/layout.tsx), not Inter, which has no
              Tamil glyphs to shape it correctly. */}
          <p
            className="m-0 text-[17px] font-bold leading-[1.5]"
            style={{ color: TEAL, fontFamily: "var(--font-tamil-sans)" }}
          >
            &ldquo;வாழ்வில் எல்லா நலமும் வளமும் பெற்று பல்லாண்டு காலம்
            வாழவேண்டும்&rdquo;
          </p>
          <p
            className={`${inter.className} m-0 mt-1 text-[12px] font-semibold`}
            style={{ color: TEAL }}
          >
            Inmates
            <span
              className={`${inter.className} block font-normal`}
              style={{ color: "rgba(10, 54, 58, 0.55)" }}
            >
              Annai Aravindar Karunai Illam
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
